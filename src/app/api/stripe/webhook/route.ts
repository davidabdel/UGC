import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Ensure runtime is dynamic and Node.js so we don't static-optimize this route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Lazy initializers
function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase env vars missing');
  }
  return createClient(url, key);
}

function getStripe(): Stripe {
  const key = process.env.STRIPE_API_KEY;
  if (!key) {
    throw new Error('Stripe API key missing');
  }
  // Omit apiVersion here to avoid TS/type mismatches during build
  return new Stripe(key);
}

// Hardcoded price to credits mapping for fallback
const PRICE_TO_CREDITS_MAP: Record<string, { name: string, credits: number }> = {
  // Free plan
  'price_free': { name: 'Free', credits: 100 },
  
  // Lite plans
  'price_1SELqMKIeF7PCY4JjPiAhvmx': { name: 'Lite', credits: 50000 }, // Monthly
  'price_1SELtRKIeF7PCY4Jti48TBYA': { name: 'Lite Yearly', credits: 50000 }, // Yearly
  
  // Business plans
  'price_1SELvjKIeF7PCY4JDmxnPFvY': { name: 'Business', credits: 150000 }, // Yearly
  'price_1SELv9KIeF7PCY4J8o8mvjHB': { name: 'Business', credits: 150000 }, // Monthly
  
  // Heavy plans
  'price_1SELvjKIeF7PCY4Jbf4vtqC2': { name: 'Heavy', credits: 400000 }, // Monthly
  'price_1SELvjKIeF7PCY4JYvgmLtXB': { name: 'Heavy Yearly', credits: 400000 }, // Yearly
};

// Debug function to log all steps
function debugLog(message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  
  // Log detailed data if provided
  if (data) {
    try {
      console.log(JSON.stringify(data, null, 2));
    } catch {
      console.log('Could not stringify data:', data);
    }
  }
}

// Helper to get plan ID and credits from Stripe price
async function getPlanDetails(priceId: string): Promise<{ planId: string | null, credits: number, isYearly: boolean }> {
  console.log(`WEBHOOK: Looking up plan details for price ID: ${priceId}`);
  
  try {
    const supabase = getSupabaseAdmin();
    // First check if this is a yearly price ID
    console.log(`WEBHOOK: Checking if this is a yearly price ID: ${priceId}`);
    const { data: yearlyPlanData, error: yearlyPlanError } = await supabase
      .from('subscription_plans')
      .select('*') // Select all columns to make sure we get everything we need
      .eq('stripe_price_id', priceId) // Note: We're checking stripe_price_id, not stripe_price_id_yearly
      .eq('is_active', true)
      .like('name', '% Yearly') // Look for plans with 'Yearly' in the name
      .single();
    
    // If found as a yearly plan's primary price ID
    if (!yearlyPlanError && yearlyPlanData) {
      console.log(`WEBHOOK: Found yearly plan with price ID ${priceId} in database:`, yearlyPlanData);
      return { 
        planId: yearlyPlanData.id, 
        credits: yearlyPlanData.credits_per_month,
        isYearly: true
      };
    }
    
    // If not found as a yearly plan, check if it's a monthly plan
    console.log(`WEBHOOK: Checking if this is a monthly price ID: ${priceId}`);
    const { data: monthlyPlanData, error: monthlyPlanError } = await supabase
      .from('subscription_plans')
      .select('*') // Select all columns to make sure we get everything we need
      .eq('stripe_price_id', priceId)
      .eq('is_active', true)
      .not('name', 'like', '% Yearly') // Exclude yearly plans
      .single();
      
    // If found as a monthly plan
    if (!monthlyPlanError && monthlyPlanData) {
      console.log(`WEBHOOK: Found monthly plan with price ID ${priceId} in database:`, monthlyPlanData);
      return { 
        planId: monthlyPlanData.id, 
        credits: monthlyPlanData.credits_per_month,
        isYearly: false
      };
    }
    
    // For backward compatibility, check if it's a yearly price ID in the old format
    console.log(`WEBHOOK: Checking for legacy yearly price ID: ${priceId}`);
    const { data: legacyYearlyPlanData, error: legacyYearlyPlanError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('stripe_price_id_yearly', priceId)
      .eq('is_active', true)
      .single();

    // If found as a legacy yearly price ID
    if (!legacyYearlyPlanError && legacyYearlyPlanData) {
      console.log(`WEBHOOK: Found plan with legacy yearly price ID ${priceId} in database:`, legacyYearlyPlanData);
      return { 
        planId: legacyYearlyPlanData.id, 
        credits: legacyYearlyPlanData.credits_per_month,
        isYearly: true
      };
    }
    
    // If we get here, we didn't find the plan by either monthly or yearly price ID
    console.error(`WEBHOOK ERROR: No plan found with price ID: ${priceId} (checked both monthly and yearly)`);
    
    // Let's check all plans to see what price IDs we have in the database
    console.log(`WEBHOOK: Checking all subscription plans for any price ID matches`);
    const { data: allPlans, error: allPlansError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true);
      
    if (!allPlansError && allPlans) {
      console.log('WEBHOOK: Available plans in database:');
      allPlans.forEach(plan => {
        console.log(`WEBHOOK: Plan: ${plan.name}, ID: ${plan.id}, Monthly Price ID: ${plan.stripe_price_id}, Yearly Price ID: ${plan.stripe_price_id_yearly}`);
      });
    } else {
      console.log('WEBHOOK: No subscription plans found in database');
    }
    
    // Fallback to our hardcoded mapping
    const planInfo = PRICE_TO_CREDITS_MAP[priceId];
    if (!planInfo) {
      console.error(`WEBHOOK ERROR: No plan mapping found for price ID: ${priceId}`);
      return { planId: null, credits: 0, isYearly: false };
    }

    // Look up the plan ID in Supabase by name
    const { data: nameData, error: nameError } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('name', planInfo.name)
      .eq('is_active', true)
      .single();
      
    if (nameError || !nameData) {
      console.error(`WEBHOOK ERROR: Could not find plan with name ${planInfo.name}:`, nameError);
      return { planId: null, credits: 0, isYearly: false };
    }
    
    console.log(`WEBHOOK: Found plan by name ${planInfo.name} with ID ${nameData.id}`);
    // Determine if this is a yearly plan based on the price ID format or name
    const isYearly = planInfo.name.includes('Yearly') || priceId.includes('yearly');
    return {
      planId: nameData.id,
      credits: planInfo.credits,
      isYearly
    };
  } catch (error) {
    console.error(`WEBHOOK ERROR: Unexpected error in getPlanDetails:`, error);
    return { planId: null, credits: 0, isYearly: false };
  }
}

// Helper to find a user by email
async function getUserByEmail(email: string): Promise<string | null> {
  try {
    console.log(`Looking up user by email: ${email}`);
    
    // IMPORTANT: For testing in development, just return the hardcoded user ID
    // This ensures the webhook works even if user lookup fails
    if (process.env.NODE_ENV === 'development' && email === 'test@example.com') {
      console.log('Using hardcoded user ID for test@example.com');
      return 'b3c5a3d1-2f0d-4941-83c8-ed0c7cf70d33';
    }
    
    // First try to find the user in the users table
    const supabase = getSupabaseAdmin();
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
      
    if (!userError && userData) {
      console.log(`Found user with ID: ${userData.id}`);
      return userData.id;
    }
    
    // If not found in users table, try auth.users
    console.log('User not found in users table, trying auth.users');
    
    try {
      const { data: authData, error: authError } = await supabase
        .auth
        .admin
        .listUsers();
      if (!authError && authData && authData.users.length > 0) {
        const match = authData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
        const userId = match?.id;
        if (userId) {
          console.log(`Found user in auth.users with ID: ${userId}`);
          return userId;
        }
      }
    } catch (e) {
      console.error('Error querying auth.users:', e);
    }
    
    // If we still can't find the user, try a direct query
    console.log('Trying direct query to find user');
    const { data: directData, error: directError } = await supabase
      .from('users')
      .select('id, email')
      .filter('email', 'eq', email)
      .single();
      
    if (!directError && directData) {
      console.log(`Found user with direct query: ${directData.id}`);
      return directData.id;
    }
    
    console.error(`No user found with email: ${email}`);
    return null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
}

// Add credits to a user
async function addCreditsToUser(userId: string, credits: number, description: string): Promise<boolean> {
  try {
    console.log(`Adding ${credits} credits to user ${userId}`);
    
    // First, check if the user already has a credits record
    const supabase = getSupabaseAdmin();
    const { data: existingCredits, error: checkError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    const currentDate = new Date().toISOString();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking existing credits:', checkError);
      return false;
    }
    
    let newBalance = credits;
    
    // If user already has credits, update the balance
    if (existingCredits) {
      newBalance = existingCredits.balance + credits;
      
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({
          balance: newBalance,
          last_refill_date: currentDate,
          updated_at: currentDate
        })
        .eq('id', existingCredits.id);
        
      if (updateError) {
        console.error('Error updating credits:', updateError);
        return false;
      }
    } else {
      // Create new credits record
      const { error: insertError } = await supabase
        .from('user_credits')
        .insert({
          user_id: userId,
          balance: newBalance,
          last_refill_date: currentDate,
          created_at: currentDate,
          updated_at: currentDate
        });
        
      if (insertError) {
        console.error('Error creating credits:', insertError);
        return false;
      }
    }
    
    // Add a transaction record
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: credits,
        description,
        created_at: currentDate
      });
      
    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      // We still return true because the credits were added successfully
    }
    
    console.log(`Successfully added ${credits} credits to user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error adding credits:', error);
    return false;
  }
}

// Create or update a subscription
async function upsertSubscription(
  userId: string,
  planId: string,
  stripeSubscriptionId: string,
  status: string,
  currentPeriodStart: string,
  currentPeriodEnd: string,
  cancelAtPeriodEnd: boolean = false,
  customerEmail?: string, // Add email parameter
  _isYearly: boolean = false // Add isYearly parameter
) {
  try {
    debugLog(`Upserting subscription for user ${userId}`, {
      planId,
      stripeSubscriptionId,
      status,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd
    });
    
    // Check if a subscription exists for this user (keep a single row per user)
    const supabase = getSupabaseAdmin();
    const { data: existingSub, error: findError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (findError && findError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error finding subscription:', findError);
      return { success: false, error: findError.message };
    }
    
    let result;
    
    if (existingSub) {
      console.log(`Updating existing subscription ${existingSub.id}`);
      
      // Update existing subscription
      const { data: updatedSub, error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          plan_id: planId,
          status,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          cancel_at_period_end: cancelAtPeriodEnd,
          payment_provider: 'stripe',
          updated_at: new Date().toISOString(),
          email: customerEmail // Add email field
        })
        .eq('id', existingSub.id)
        .select()
        .single();
        
      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return { success: false, error: updateError.message };
      }
      
      result = updatedSub;
    } else {
      console.log(`Creating new subscription`);
      
      // Create new subscription
      const { data: newSub, error: insertError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan_id: planId,
          status,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          cancel_at_period_end: cancelAtPeriodEnd,
          payment_provider: 'stripe',
          payment_provider_subscription_id: stripeSubscriptionId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          email: customerEmail // Add email field
        })
        .select()
        .single();
        
      if (insertError) {
        console.error('Error creating subscription:', insertError);
        return { success: false, error: insertError.message };
      }
      
      result = newSub;
    }
    
    return { success: true, subscription: result };
  } catch (error) {
    console.error('Unexpected error in upsertSubscription:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const event = JSON.parse(body);
    
    console.log(`Received webhook event: ${event.type}`);
    
    // Process different event types
    switch (event.type) {
      // Handle checkout.session.completed event
      case 'checkout.session.completed': {
        console.log('Handling checkout.session.completed event');
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Log the full session for debugging
        console.log('CHECKOUT SESSION DATA:', JSON.stringify(session, null, 2));
        
        // Only handle subscription checkouts
        if (session.mode !== 'subscription') {
          console.log('Not a subscription checkout, ignoring');
          return NextResponse.json({ received: true });
        }
        
        console.log('CHECKOUT: Subscription mode detected');
        console.log('CHECKOUT: Customer email:', session.customer_details?.email);
        console.log('CHECKOUT: Subscription ID:', session.subscription);
        
        // Check if we have all required data
        if (!session.customer_details?.email) {
          console.error('CHECKOUT ERROR: No customer email found in session');
          return NextResponse.json({ error: 'No customer email' }, { status: 400 });
        }
        
        if (!session.subscription) {
          console.error('CHECKOUT ERROR: No subscription ID found in session');
          return NextResponse.json({ error: 'No subscription ID' }, { status: 400 });
        }
        
        // Get customer email
        const customerEmail = session.customer_details.email;
        
        // Find user by email
        const userId = await getUserByEmail(customerEmail);
        if (!userId) {
          console.error(`No user found with email: ${customerEmail}`);
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        // Fetch the real subscription from Stripe to get the exact priceId
        try {
          console.log(`CHECKOUT: Fetching subscription from Stripe: ${session.subscription}`);
          const stripe = getStripe();
          const subscriptionResp = await stripe.subscriptions.retrieve(session.subscription as string);
          const subscription = subscriptionResp as unknown as {
            id: string;
            status?: string;
            current_period_start?: number;
            current_period_end?: number;
            cancel_at_period_end?: boolean;
            items?: { data?: Array<{ price?: { id?: string } | null }> };
          };

          // Get the price ID from the subscription
          const priceId = subscription.items?.data?.[0]?.price?.id ?? null;
          if (!priceId) {
            console.error('CHECKOUT ERROR: No price ID found on subscription');
            return NextResponse.json({ error: 'No price ID found' }, { status: 400 });
          }

          console.log(`CHECKOUT: Price ID from subscription: ${priceId}`);

          // Map price to plan
          const { planId, credits, isYearly } = await getPlanDetails(priceId);
          console.log(`CHECKOUT: Plan details:`, { planId, credits, isYearly });

          if (!planId) {
            console.error(`CHECKOUT ERROR: No plan found for price: ${priceId}`);
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
          }

          // Map subscription status
          const status = (subscription.status === 'active' || subscription.status === 'trialing') ? 'active' : (subscription.status || 'inactive');

          // Update or create subscription
          const result = await upsertSubscription(
            userId,
            planId,
            subscription.id,
            status,
            new Date((subscription.current_period_start ?? 0) * 1000).toISOString(),
            new Date((subscription.current_period_end ?? 0) * 1000).toISOString(),
            Boolean(subscription.cancel_at_period_end),
            customerEmail,
            isYearly
          );
          
          if (!result.success) {
            console.error('CHECKOUT ERROR: Failed to upsert subscription');
            return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
          }
          
          // Add credits for new subscription
          if (credits > 0) {
            await addCreditsToUser(
              userId,
              credits,
              `${credits} credits added for new subscription`
            );
          }
          
          return NextResponse.json({ success: true });
        } catch (stripeError) {
          console.error('CHECKOUT ERROR: Error retrieving subscription from Stripe:', stripeError);
          return NextResponse.json({ error: 'Error retrieving subscription' }, { status: 500 });
        }
      }
      
      // Handle invoice.paid event
      case 'invoice.paid': {
        console.log('Handling invoice.paid event');
        const invoice = event.data.object as Stripe.Invoice;
        
        // Log the full invoice for debugging
        console.log('INVOICE DATA:', JSON.stringify(invoice, null, 2));
        
        // Check if this is a subscription invoice (handle Stripe type variance)
        const subFieldPresence = (invoice as unknown as { subscription?: string | { id?: string } | null }).subscription;
        if (!subFieldPresence) {
          console.log('Not a subscription invoice, ignoring');
          return NextResponse.json({ received: true });
        }
        
        // Get customer email
        const customerEmail = invoice.customer_email;
        if (!customerEmail) {
          console.error('No customer email found in invoice');
          return NextResponse.json({ error: 'No customer email' }, { status: 400 });
        }
        
        // Find user by email
        const userId = await getUserByEmail(customerEmail);
        if (!userId) {
          console.error(`No user found with email: ${customerEmail}`);
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        
        // Get price ID from invoice line items
        let priceId: string | null = null;
        if (invoice.lines?.data?.length) {
          const lineItem = invoice.lines.data[0] as unknown as { price?: { id?: string } | null };
          priceId = lineItem?.price?.id ?? null;
        }
        
        // If we couldn't get the price ID from the invoice, get it from the subscription
        if (!priceId) {
          try {
            const stripe = getStripe();
            const subField = subFieldPresence;
            const subId = typeof subField === 'string' ? subField : subField?.id;
            if (!subId) throw new Error('No subscription ID on invoice');
            const subResp = await stripe.subscriptions.retrieve(subId);
            const subStruct = subResp as unknown as { items?: { data?: Array<{ price?: { id?: string } | null }> } };
            if (subStruct.items?.data?.length) {
              priceId = subStruct.items.data[0].price?.id ?? null;
            }
          } catch (error) {
            console.error('Error retrieving subscription:', error);
            return NextResponse.json({ error: 'Failed to retrieve subscription' }, { status: 500 });
          }
        }
        
        if (!priceId) {
          console.error('No price ID found in invoice or subscription');
          return NextResponse.json({ error: 'No price ID found' }, { status: 400 });
        }
        
        console.log(`INVOICE: Price ID: ${priceId}`);
        
        // If this is a renewal (not the first payment), add credits
        if (invoice.billing_reason === 'subscription_cycle') {
          // Get credits amount from price mapping
          const { credits } = await getPlanDetails(priceId);
          
          if (credits > 0) {
            await addCreditsToUser(
              userId, 
              credits, 
              `${credits} credits added for subscription renewal`
            );
          }
        }
        
        return NextResponse.json({ success: true });
      }
      
      // Handle other events
      default:
        console.log(`Unhandled event type: ${event.type}`);
        return NextResponse.json({ received: true });
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}
