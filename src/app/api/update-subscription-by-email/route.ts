import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jkgkuiuycqyzobbiwxpx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper to get user ID from email
async function getUserByEmail(email: string): Promise<string | null> {
  try {
    console.log(`Looking up user by email: ${email}`);
    
    // First try to find the user in the users table
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
    
    const { data: authData, error: authError } = await supabase
      .auth
      .admin
      .listUsers();
      
    if (!authError && authData && authData.users.length > 0) {
      const match = authData.users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
      const userId = match?.id;
      if (!userId) {
        console.error(`User not found in auth.users for email: ${email}`);
        return null;
      }
      console.log(`Found user in auth.users with ID: ${userId}`);
      return userId;
    }
    
    console.error(`No user found with email: ${email}`);
    return null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
}

// Helper to get plan ID from price ID
async function getPlanIdFromPriceId(priceId: string): Promise<string | null> {
  try {
    console.log(`Looking up plan for price ID: ${priceId}`);
    
    // First check if this is a yearly price ID
    const { data: yearlyPlanData, error: yearlyPlanError } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('stripe_price_id', priceId)
      .eq('is_active', true)
      .like('name', '% Yearly')
      .single();
    
    // If found as a yearly plan's primary price ID
    if (!yearlyPlanError && yearlyPlanData) {
      console.log(`Found yearly plan with ID: ${yearlyPlanData.id}`);
      return yearlyPlanData.id;
    }
    
    // If not found as a yearly plan, check if it's a monthly plan
    const { data: monthlyPlanData, error: monthlyPlanError } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('stripe_price_id', priceId)
      .eq('is_active', true)
      .not('name', 'like', '% Yearly')
      .single();
      
    // If found as a monthly plan
    if (!monthlyPlanError && monthlyPlanData) {
      console.log(`Found monthly plan with ID: ${monthlyPlanData.id}`);
      return monthlyPlanData.id;
    }
    
    // For backward compatibility, check if it's a yearly price ID in the old format
    const { data: legacyYearlyPlanData, error: legacyYearlyPlanError } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('stripe_price_id_yearly', priceId)
      .eq('is_active', true)
      .single();

    // If found as a legacy yearly price ID
    if (!legacyYearlyPlanError && legacyYearlyPlanData) {
      console.log(`Found plan with legacy yearly price ID: ${legacyYearlyPlanData.id}`);
      return legacyYearlyPlanData.id;
    }
    
    console.error(`No plan found for price ID: ${priceId}`);
    return null;
  } catch (error) {
    console.error('Error finding plan by price ID:', error);
    return null;
  }
}

// Create or update a subscription
async function upsertSubscription(
  userId: string,
  planId: string,
  stripeSubscriptionId: string
) {
  try {
    console.log(`Upserting subscription for user ${userId}`);
    
    // Set dates
    const currentDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // Add 1 month
    
    // Check if subscription already exists
    const { data: existingSub } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('payment_provider_subscription_id', stripeSubscriptionId)
      .maybeSingle();
      
    let result;
    
    if (existingSub) {
      console.log(`Updating existing subscription ${existingSub.id}`);
      
      // Update existing subscription
      const { data: updatedSub, error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          plan_id: planId,
          status: 'active',
          current_period_start: currentDate.toISOString(),
          current_period_end: endDate.toISOString(),
          cancel_at_period_end: false,
          payment_provider: 'stripe',
          updated_at: currentDate.toISOString(),
          email: null // Add email field if needed
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
          status: 'active',
          current_period_start: currentDate.toISOString(),
          current_period_end: endDate.toISOString(),
          cancel_at_period_end: false,
          payment_provider: 'stripe',
          payment_provider_subscription_id: stripeSubscriptionId,
          created_at: currentDate.toISOString(),
          updated_at: currentDate.toISOString(),
          email: null // Add email field if needed
        })
        .select()
        .single();
        
      if (insertError) {
        console.error('Error creating subscription:', insertError);
        return { success: false, error: insertError.message };
      }
      
      result = newSub;
    }
    
    // Get the plan details
    const { data: planData, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();
      
    if (!planError && planData) {
      console.log(`Found plan: ${planData.name} with ${planData.credits_per_month} credits`);
      
      // Update user credits
      const { data: existingCredits, error: creditsError } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (!creditsError) {
        if (existingCredits) {
          console.log(`Updating existing credits for user ${userId}`);
          
          // Update existing credits
          await supabase
            .from('user_credits')
            .update({
              balance: planData.credits_per_month,
              last_refill_date: currentDate.toISOString(),
              updated_at: currentDate.toISOString()
            })
            .eq('id', existingCredits.id);
        } else {
          console.log(`Creating new credits for user ${userId}`);
          
          // Create new credits
          await supabase
            .from('user_credits')
            .insert({
              user_id: userId,
              balance: planData.credits_per_month,
              last_refill_date: currentDate.toISOString(),
              created_at: currentDate.toISOString(),
              updated_at: currentDate.toISOString()
            });
        }
        
        // Add a credit transaction
        await supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: planData.credits_per_month,
            description: `${planData.credits_per_month} credits added for subscription to ${planData.name} plan`,
            created_at: currentDate.toISOString()
          });
      }
    }
    
    return { success: true, subscription: result };
  } catch (error) {
    console.error('Unexpected error in upsertSubscription:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, stripeSubscriptionId, priceId } = await req.json();
    
    if (!email || !stripeSubscriptionId || !priceId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email, subscription ID, and price ID are required' 
      }, { status: 400 });
    }
    
    console.log(`Updating subscription for email ${email}`);
    
    // Step 1: Get user ID from email
    const userId = await getUserByEmail(email);
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found with this email' 
      }, { status: 404 });
    }
    
    // Step 2: Get plan ID from price ID
    const planId = await getPlanIdFromPriceId(priceId);
    
    if (!planId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Plan not found for this price ID' 
      }, { status: 404 });
    }
    
    // Step 3: Create or update the subscription
    const result = await upsertSubscription(userId, planId, stripeSubscriptionId);
    
    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      userId,
      planId,
      subscription: result.subscription
    });
  } catch (error) {
    console.error('Unexpected error in update-subscription-by-email:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An unexpected error occurred' 
    }, { status: 500 });
  }
}
