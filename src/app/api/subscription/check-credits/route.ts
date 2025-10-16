import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jkgkuiuycqyzobbiwxpx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
  try {
    // Get user ID from query params
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID is required' 
      }, { status: 400 });
    }
    
    console.log(`Checking credits for user ${userId}`);
    
    // Get user credits
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (creditsError) {
      // If no credits found, create initial credits
      if (creditsError.code === 'PGRST116') { // No rows returned
        console.log(`No credits found for user ${userId}, creating initial credits`);
        
        // Get the user's active subscription to determine credits amount
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select(`
            *,
            subscription_plans:plan_id (
              id,
              name,
              credits_per_month,
              price_monthly,
              price_yearly
            )
          `)
          .eq('user_id', userId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .maybeSingle();
        
        // Decide whether to seed initial credits
        // Rule: Only seed 100 when user is effectively on Free (no active sub OR plan price 0)
        const isFree = !subscription?.subscription_plans ||
          (((subscription.subscription_plans.price_monthly ?? 0) === 0) && ((subscription.subscription_plans.price_yearly ?? 0) === 0));
        const creditsAmount = isFree
          ? 100
          : (subscription?.subscription_plans?.credits_per_month ?? 0);
        
        // Create credits record
        const { data: newCredits, error: createError } = await supabase
          .from('user_credits')
          .insert({
            user_id: userId,
            balance: creditsAmount,
            last_refill_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (createError) {
          console.error('Error creating credits record:', createError);
          return NextResponse.json({ 
            success: false, 
            error: 'Failed to create credits record' 
          }, { status: 500 });
        }
        
        // Add credit transaction for initial credits (idempotent: only if not already present)
        if (creditsAmount > 0) {
          const { data: existingTx, error: txFindErr } = await supabase
            .from('credit_transactions')
            .select('id')
            .eq('user_id', userId)
            .eq('description', 'Initial credits from subscription plan')
            .limit(1)
            .maybeSingle();
          
          if (!txFindErr && !existingTx) {
            const { error: txError } = await supabase
              .from('credit_transactions')
              .insert({
                user_id: userId,
                amount: creditsAmount,
                description: `Initial credits from subscription plan`,
                created_at: new Date().toISOString()
              });
            if (txError) {
              console.error('Error creating credit transaction:', txError);
            }
          }
        }
        
        return NextResponse.json({
          success: true,
          credits: newCredits
        });
      } else {
        console.error('Error finding credits:', creditsError);
        return NextResponse.json({ 
          success: false, 
          error: 'Error finding credits' 
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({
      success: true,
      credits
    });
  } catch (error) {
    console.error('Unexpected error checking user credits:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to check user credits' 
    }, { status: 500 });
  }
}
