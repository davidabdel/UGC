import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jkgkuiuycqyzobbiwxpx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const { userId, planId, isYearly } = await req.json();
    
    if (!userId || !planId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID and Plan ID are required' 
      }, { status: 400 });
    }
    
    console.log(`Direct subscription update for user ${userId} to plan ${planId} (${isYearly ? 'yearly' : 'monthly'})`);
    
    // Get plan details
    const { data: planData, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();
      
    if (planError || !planData) {
      console.error('Error finding plan:', planError);
      return NextResponse.json({ 
        success: false, 
        error: 'Plan not found' 
      }, { status: 404 });
    }
    
    console.log(`Found plan: ${planData.name} with ${planData.credits_per_month} credits`);
    
    // Create a subscription ID if needed
    const subscriptionId = `manual_${isYearly ? 'yearly' : 'monthly'}_${Date.now()}`;
    
    // Set dates
    const currentDate = new Date();
    const endDate = new Date();
    
    if (isYearly) {
      endDate.setFullYear(endDate.getFullYear() + 1); // Add 1 year for yearly plans
      console.log(`Setting yearly subscription period: ${currentDate.toISOString()} to ${endDate.toISOString()}`);
    } else {
      endDate.setMonth(endDate.getMonth() + 1); // Add 1 month for monthly plans
      console.log(`Setting monthly subscription period: ${currentDate.toISOString()} to ${endDate.toISOString()}`);
    }
    
    // Update or create subscription
    const { data: subData, error: subError } = await supabase
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        plan_id: planId,
        payment_provider_subscription_id: subscriptionId,
        status: 'active',
        current_period_start: currentDate.toISOString(),
        current_period_end: endDate.toISOString(),
        cancel_at_period_end: false,
        updated_at: currentDate.toISOString()
      })
      .select()
      .single();
      
    if (subError) {
      console.error('Error updating subscription:', subError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update subscription' 
      }, { status: 500 });
    }
    
    console.log('Subscription updated:', subData);
    
    // Update user credits
    const { data: creditsData, error: creditsError } = await supabase
      .from('user_credits')
      .upsert({
        user_id: userId,
        balance: planData.credits_per_month,
        last_refill_date: currentDate.toISOString(),
        updated_at: currentDate.toISOString()
      })
      .select()
      .single();
      
    if (creditsError) {
      console.error('Error updating credits:', creditsError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update credits' 
      }, { status: 500 });
    }
    
    console.log('Credits updated:', creditsData);
    
    // Add credit transaction
    const { data: txData, error: txError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: planData.credits_per_month,
        description: `Manual subscription to ${planData.name} plan`,
        created_at: currentDate.toISOString()
      })
      .select()
      .single();
      
    if (txError) {
      console.error('Error creating credit transaction:', txError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create credit transaction' 
      }, { status: 500 });
    }
    
    console.log('Credit transaction created:', txData);
    
    return NextResponse.json({
      success: true,
      subscription: subData,
      credits: creditsData,
      transaction: txData
    });
  } catch (error: any) {
    console.error('Unexpected error updating subscription:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to update subscription' 
    }, { status: 500 });
  }
}
