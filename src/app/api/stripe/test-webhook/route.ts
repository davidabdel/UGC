import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jkgkuiuycqyzobbiwxpx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.text();
    const event = JSON.parse(body);
    
    console.log('TEST WEBHOOK: Received event type:', event.type);
    
    // If this is a checkout.session.completed event, process it
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('TEST WEBHOOK: Processing checkout.session.completed event', {
        sessionId: session.id,
        customerId: session.customer,
        subscriptionId: session.subscription,
        paymentStatus: session.payment_status,
        mode: session.mode,
        invoice: session.invoice,
        timestamp: new Date().toISOString()
      });
      
      // Get customer email
      const customerEmail = session.customer_details?.email;
      console.log(`TEST WEBHOOK: Customer email from session: ${customerEmail}`);
      
      // Get user ID
      const userId = 'b3c5a3d1-2f0d-4941-83c8-ed0c7cf70d33'; // Hardcoded for testing
      console.log(`TEST WEBHOOK: Using user ID: ${userId}`);
      
      // If this is a subscription checkout, handle it
      if (session.mode === 'subscription' && session.subscription) {
        console.log(`TEST WEBHOOK: Handling subscription ${session.subscription}`);
        
        // Check if the subscription exists in the database
        const { data: existingSubscription, error: subError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('payment_provider_subscription_id', session.subscription)
          .single();
          
        console.log('TEST WEBHOOK: Existing subscription check:', { 
          exists: !!existingSubscription, 
          error: subError ? true : false 
        });
        
        // Check all subscription plans in the database
        console.log('TEST WEBHOOK: Checking all subscription plans');
        const { data: allPlans, error: plansError } = await supabase
          .from('subscription_plans')
          .select('id, name, credits_per_month, stripe_price_id, stripe_price_id_yearly');
          
        if (!plansError && allPlans) {
          console.log(`TEST WEBHOOK: Found ${allPlans.length} subscription plans:`);
          allPlans.forEach(plan => {
            console.log(`TEST WEBHOOK: Plan: ${plan.name}, ID: ${plan.id}, Monthly Price ID: ${plan.stripe_price_id}, Yearly Price ID: ${plan.stripe_price_id_yearly}`);
          });
        } else {
          console.error('TEST WEBHOOK ERROR: Failed to fetch subscription plans:', plansError);
        }
        
        // Get the invoice to find the price ID
        if (session.invoice) {
          console.log(`TEST WEBHOOK: Fetching invoice ${session.invoice}`);
          
          // Simulate invoice fetch - in a real scenario we'd call Stripe API
          // For testing, we'll use the price ID from the webhook event
          const priceId = 'price_1SELtRKIeF7PCY4Jti48TBYA'; // Yearly Lite plan
          console.log(`TEST WEBHOOK: Using price ID: ${priceId}`);
          
          // Find the plan by price ID
          let planId = null;
          let credits = 0;
          
          // First check monthly price ID
          const monthlyPlan = allPlans?.find(plan => plan.stripe_price_id === priceId);
          if (monthlyPlan) {
            planId = monthlyPlan.id;
            credits = monthlyPlan.credits_per_month;
            console.log(`TEST WEBHOOK: Found plan by monthly price ID: ${planId}, credits: ${credits}`);
          } else {
            // Then check yearly price ID
            const yearlyPlan = allPlans?.find(plan => plan.stripe_price_id_yearly === priceId);
            if (yearlyPlan) {
              planId = yearlyPlan.id;
              credits = yearlyPlan.credits_per_month;
              console.log(`TEST WEBHOOK: Found plan by yearly price ID: ${planId}, credits: ${credits}`);
            } else {
              console.error(`TEST WEBHOOK ERROR: No plan found for price ID: ${priceId}`);
            }
          }
          
          if (planId) {
            console.log(`TEST WEBHOOK: Would update subscription for user ${userId} to plan ${planId} with ${credits} credits`);
            
            // In a real scenario, we would update the subscription in the database
            // For testing, we'll just log what would happen
            console.log('TEST WEBHOOK: Subscription update simulation complete');
          }
        }
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('TEST WEBHOOK ERROR:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
