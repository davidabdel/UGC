import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// No need for Stripe import since we're bypassing the API call

// Initialize Supabase admin client (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jkgkuiuycqyzobbiwxpx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const { userId, subscriptionId, planId } = await req.json();
    
    if (!userId || !subscriptionId || !planId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID, Subscription ID, and Plan ID are required' 
      }, { status: 400 });
    }
    
    console.log(`Manually updating subscription for user ${userId}`);
    
    try {
      // Skip the Stripe API call and use hardcoded values
      console.log(`Skipping Stripe API call for ${subscriptionId}`);
      
      // Create a mock subscription object with the necessary fields
      const currentDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // Add 1 month for monthly subscription
      
      const subscription = {
        status: 'active',
        current_period_start: Math.floor(currentDate.getTime() / 1000), // Convert to Unix timestamp
        current_period_end: Math.floor(endDate.getTime() / 1000), // Convert to Unix timestamp
        cancel_at_period_end: false
      };
      
      console.log('Using mock subscription data:', JSON.stringify(subscription, null, 2));
      
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
      
      // Map subscription status
      let status = subscription.status === 'active' || subscription.status === 'trialing' 
        ? 'active' : subscription.status;
      
      // Update or create subscription
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          plan_id: planId,
          payment_provider_subscription_id: subscriptionId,
          status: status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          updated_at: new Date().toISOString()
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
      const { data: existingCredits, error: existingCreditsError } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (existingCreditsError && existingCreditsError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error checking existing credits:', existingCreditsError);
        return NextResponse.json({ 
          success: false, 
          error: 'Error checking existing credits' 
        }, { status: 500 });
      }
      
      // Create or update user credits
      const { data: creditsData, error: creditsError } = await supabase
        .from('user_credits')
        .upsert({
          user_id: userId,
          balance: planData.credits_per_month,
          last_refill_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
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
          description: `Subscription to ${planData.name} plan`,
          created_at: new Date().toISOString()
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
    } catch (stripeError) {
      console.error('Error with Stripe API:', stripeError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error with Stripe API' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Unexpected error updating subscription:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update subscription' 
    }, { status: 500 });
  }
}
