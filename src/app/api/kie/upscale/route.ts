import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jkgkuiuycqyzobbiwxpx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Credit costs for each scale factor
const CREDIT_COSTS = {
  2: 10,  // 2x = 10 credits
  3: 20,  // 3x = 20 credits
  4: 30   // 4x = 30 credits
};

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.KIE_API_KEY || process.env.NEXT_PUBLIC_KIE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "KIE_API_KEY missing" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const image: unknown = body?.image;
    const scale: unknown = body?.scale;
    const face_enhance: unknown = body?.face_enhance;
    const userId: unknown = body?.userId;

    if (typeof image !== "string" || !image) {
      return NextResponse.json({ error: "image is required" }, { status: 400 });
    }
    
    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    
    const validScales = [2, 3, 4];
    if (typeof scale !== "number" || !validScales.includes(scale)) {
      return NextResponse.json({ error: "scale must be 2, 3, or 4" }, { status: 400 });
    }
    
    // Get the credit cost for the selected scale
    const creditCost = CREDIT_COSTS[scale as keyof typeof CREDIT_COSTS];
    
    // Check if user has enough credits
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', userId)
      .single();
      
    if (creditsError) {
      console.error('Error checking user credits:', creditsError);
      return NextResponse.json({ 
        error: "Failed to check user credits", 
        details: creditsError.message 
      }, { status: 500 });
    }
    
    if (!credits || credits.balance < creditCost) {
      return NextResponse.json({ 
        error: "Insufficient credits", 
        required: creditCost,
        available: credits?.balance || 0
      }, { status: 402 }); // 402 Payment Required
    }
    
    // Deduct credits using the spend_user_credits function
    const { data: spendResult, error: spendError } = await supabase.rpc('spend_user_credits', {
      user_id: userId,
      spend_amount: creditCost,
      spend_description: `Image upscaling ${scale}x`
    });
    
    if (spendError || !spendResult?.success) {
      console.error('Error spending credits:', spendError || spendResult);
      return NextResponse.json({ 
        error: "Failed to deduct credits", 
        details: spendError?.message || spendResult?.message || "Unknown error" 
      }, { status: 500 });
    }

    const res = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "nano-banana-upscale",
        callBackUrl: process.env.KIE_CALLBACK_URL || undefined,
        input: {
          image,
          scale,
          face_enhance: Boolean(face_enhance),
        },
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      // If the API call fails, refund the credits
      const { data: refundResult, error: refundError } = await supabase.rpc('spend_user_credits', {
        user_id: userId,
        spend_amount: -creditCost, // Negative amount to refund
        spend_description: `Refund for failed image upscaling ${scale}x`
      });
      
      if (refundError) {
        console.error('Error refunding credits:', refundError);
      }
      
      return NextResponse.json({ 
        ok: false, 
        status: res.status, 
        error: data,
        creditsRefunded: !refundError
      }, { status: res.status });
    }
    
    return NextResponse.json({ 
      ok: true, 
      data: {
        ...data,
        creditsSpent: creditCost,
        remainingCredits: spendResult.balance
      }
    });
  } catch (err) {
    // If there's an exception, try to refund the credits if we've already processed userId and creditCost
    try {
      // These variables might not be defined if the error happened early in the function
      const userIdValue = typeof userId === 'string' ? userId : null;
      const scaleValue = typeof scale === 'number' ? scale : null;
      
      if (userIdValue && scaleValue && CREDIT_COSTS[scaleValue as keyof typeof CREDIT_COSTS]) {
        const refundAmount = CREDIT_COSTS[scaleValue as keyof typeof CREDIT_COSTS];
        
        const { data: refundResult, error: refundError } = await supabase.rpc('spend_user_credits', {
          user_id: userIdValue,
          spend_amount: -refundAmount, // Negative amount to refund
          spend_description: `Refund for failed image upscaling ${scaleValue}x (error)`
        });
        
        if (refundError) {
          console.error('Error refunding credits:', refundError);
        }
      }
    } catch (refundErr) {
      console.error('Exception during credit refund:', refundErr);
    }
    
    return NextResponse.json({ 
      error: "Unexpected error", 
      details: String(err),
      note: "Credits may have been refunded, please check your balance"
    }, { status: 500 });
  }
}
