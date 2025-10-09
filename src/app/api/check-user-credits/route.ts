import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jkgkuiuycqyzobbiwxpx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    
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
      
    if (creditsError && creditsError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error finding credits:', creditsError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error finding credits' 
      }, { status: 500 });
    }
    
    // Get credit transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (transactionsError) {
      console.error('Error finding credit transactions:', transactionsError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error finding credit transactions' 
      }, { status: 500 });
    }
    
    // Get user subscriptions
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans:plan_id (
          id,
          name,
          credits_per_month
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
      
    if (subscriptionsError) {
      console.error('Error finding subscriptions:', subscriptionsError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error finding subscriptions' 
      }, { status: 500 });
    }
    
    // Get the active subscription plan's credits
    let planCredits = 0;
    if (subscriptions && subscriptions.length > 0 && subscriptions[0].subscription_plans) {
      planCredits = subscriptions[0].subscription_plans.credits_per_month;
    }
    
    // If no credits record exists, create one
    if (!credits) {
      console.log(`No credits record found for user ${userId}, creating one with ${planCredits} credits`);
      
      const { data: newCredits, error: newCreditsError } = await supabase
        .from('user_credits')
        .insert({
          user_id: userId,
          balance: planCredits,
          last_refill_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (newCreditsError) {
        console.error('Error creating credits record:', newCreditsError);
        return NextResponse.json({ 
          success: false, 
          error: 'Error creating credits record' 
        }, { status: 500 });
      }
      
      console.log(`Created credits record:`, newCredits);
      
      // Add credit transaction for initial credits
      if (planCredits > 0) {
        const { data: txData, error: txError } = await supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: planCredits,
            description: `Initial credits from subscription plan`,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (txError) {
          console.error('Error creating credit transaction:', txError);
          // Non-fatal error, continue
        } else {
          console.log('Credit transaction created:', txData);
        }
      }
      
      return NextResponse.json({
        success: true,
        credits: newCredits,
        transactions: transactions || [],
        subscriptions: subscriptions || []
      });
    }
    
    return NextResponse.json({
      success: true,
      credits,
      transactions: transactions || [],
      subscriptions: subscriptions || []
    });
  } catch (error) {
    console.error('Unexpected error checking user credits:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to check user credits' 
    }, { status: 500 });
  }
}
