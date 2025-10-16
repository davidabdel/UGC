import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize Supabase admin client (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jkgkuiuycqyzobbiwxpx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const { userId, cancelImmediately = false } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID is required' 
      }, { status: 400 });
    }
    
    console.log(`Canceling subscription for user ${userId}, immediate: ${cancelImmediately}`);
    
    // Get the current subscription
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
      
    if (subError) {
      console.error('Error finding active subscription:', subError);
      
      // Check if the error is "No rows found" - this means the user doesn't have an active subscription
      if (subError.code === 'PGRST116') {
        return NextResponse.json({ 
          success: false, 
          error: 'No active subscription found' 
        }, { status: 404 });
      }
      
      return NextResponse.json({ 
        success: false, 
        error: 'Error finding subscription' 
      }, { status: 500 });
    }
    
    console.log('Found subscription:', subscription);
    
    if (cancelImmediately) {
      // Cancel immediately
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);
        
      if (updateError) {
        console.error('Error updating subscription status:', updateError);
        return NextResponse.json({ 
          success: false, 
          error: 'Error updating subscription' 
        }, { status: 500 });
      }
    } else {
      // Cancel at period end
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);
        
      if (updateError) {
        console.error('Error updating subscription cancel_at_period_end:', updateError);
        return NextResponse.json({ 
          success: false, 
          error: 'Error updating subscription' 
        }, { status: 500 });
      }
    }
    
    // If the subscription is through Stripe, cancel it there too
    if (subscription.payment_provider === 'stripe' && subscription.payment_provider_subscription_id) {
      try {
        // Only attempt to cancel in Stripe if we have the Stripe API key
        const stripeApiKey = process.env.STRIPE_API_KEY;
        if (stripeApiKey) {
          const stripe = new Stripe(stripeApiKey);
          
          console.log(`Canceling Stripe subscription: ${subscription.payment_provider_subscription_id}`);
          
          await stripe.subscriptions.update(subscription.payment_provider_subscription_id, {
            cancel_at_period_end: !cancelImmediately,
          });
          
          if (cancelImmediately) {
            await stripe.subscriptions.cancel(subscription.payment_provider_subscription_id);
          }
          
          console.log('Stripe subscription canceled successfully');
        }
      } catch (stripeError) {
        console.error('Error canceling Stripe subscription:', stripeError);
        // We'll still return success since we updated our database
      }
    }
    
    return NextResponse.json({
      success: true,
      message: cancelImmediately ? 'Subscription canceled' : 'Subscription will be canceled at the end of the billing period'
    });
  } catch (error) {
    console.error('Unexpected error canceling subscription:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to cancel subscription' 
    }, { status: 500 });
  }
}
