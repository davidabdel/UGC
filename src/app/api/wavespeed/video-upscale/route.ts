import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jkgkuiuycqyzobbiwxpx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Credit costs for each resolution
const CREDIT_COSTS = {
  "720p": 100,
  "1080p": 125,
  "2k": 250,
  "4k": 500
};

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.WAVESPEED_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "WAVESPEED_API_KEY missing" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const video: unknown = body?.video;
    const resolution: unknown = body?.resolution;
    const copyAudio: unknown = body?.copyAudio ?? true;
    const userId: unknown = body?.userId;

    if (typeof video !== "string" || !video) {
      return NextResponse.json({ error: "video is required" }, { status: 400 });
    }
    
    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    
    const validResolutions = ["720p", "1080p", "2k", "4k"];
    if (typeof resolution !== "string" || !validResolutions.includes(resolution)) {
      return NextResponse.json({ error: "resolution must be 720p, 1080p, 2k, or 4k" }, { status: 400 });
    }
    
    // Get the credit cost for the selected resolution
    const creditCost = CREDIT_COSTS[resolution as keyof typeof CREDIT_COSTS];
    
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
      spend_description: `Video upscaling to ${resolution}`
    });
    
    if (spendError || !spendResult?.success) {
      console.error('Error spending credits:', spendError || spendResult);
      return NextResponse.json({ 
        error: "Failed to deduct credits", 
        details: spendError?.message || spendResult?.message || "Unknown error" 
      }, { status: 500 });
    }

    const url = "https://api.wavespeed.ai/api/v3/wavespeed-ai/video-upscaler";
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    };
    
    const payload = {
      "copy_audio": Boolean(copyAudio),
      "target_resolution": resolution,
      "video": video
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        // If the API call fails, refund the credits
        const { data: refundResult, error: refundError } = await supabase.rpc('spend_user_credits', {
          user_id: userId,
          spend_amount: -creditCost, // Negative amount to refund
          spend_description: `Refund for failed video upscaling to ${resolution}`
        });
        
        if (refundError) {
          console.error('Error refunding credits:', refundError);
        }
        
        return NextResponse.json({ 
          ok: false, 
          status: response.status, 
          error: data,
          creditsRefunded: !refundError
        }, { status: response.status });
      }
      
      const requestId = data?.data?.id;
      
      if (!requestId) {
        // If no request ID, refund the credits
        const { data: refundResult, error: refundError } = await supabase.rpc('spend_user_credits', {
          user_id: userId,
          spend_amount: -creditCost, // Negative amount to refund
          spend_description: `Refund for incomplete video upscaling to ${resolution}`
        });
        
        if (refundError) {
          console.error('Error refunding credits:', refundError);
        }
        
        return NextResponse.json({ 
          ok: false, 
          error: "No request ID returned from API",
          creditsRefunded: !refundError
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        ok: true, 
        data: {
          taskId: requestId,
          message: "Video upscale task created successfully",
          creditsSpent: creditCost,
          remainingCredits: spendResult.balance
        }
      });
    } catch (err) {
      // If there's an exception, try to refund the credits
      try {
        const { data: refundResult, error: refundError } = await supabase.rpc('spend_user_credits', {
          user_id: userId,
          spend_amount: -creditCost, // Negative amount to refund
          spend_description: `Refund for failed video upscaling to ${resolution} (error)`
        });
        
        if (refundError) {
          console.error('Error refunding credits:', refundError);
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
  } catch (err) {
    return NextResponse.json({ 
      error: "Unexpected error", 
      details: String(err) 
    }, { status: 500 });
  }
}
