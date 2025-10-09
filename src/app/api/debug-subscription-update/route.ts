import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jkgkuiuycqyzobbiwxpx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const { userId, planId, status, stripeSubscriptionId, id } = await req.json();
    
    if (!userId || !planId || !status || !stripeSubscriptionId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }
    
    console.log(`DEBUG: Updating subscription for user ${userId}`, {
      planId,
      status,
      stripeSubscriptionId,
      id
    });
    
    // Set dates
    const currentDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // Add 1 month
    
    // Check if the subscription exists (if ID is provided)
    let existingSubscription = null;
    
    if (id) {
      const { data: existingSub, error: findError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('id', id)
        .single();
        
      if (findError) {
        console.error('DEBUG ERROR: Error finding subscription:', findError);
        return NextResponse.json({ 
          success: false, 
          error: `Error finding subscription: ${findError.message}` 
        }, { status: 500 });
      }
      
      existingSubscription = existingSub;
    } else {
      // Check if there's an existing subscription for this user and Stripe subscription ID
      const { data: existingSub, error: findError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('payment_provider_subscription_id', stripeSubscriptionId)
        .maybeSingle();
        
      if (!findError) {
        existingSubscription = existingSub;
      }
    }
    
    let result;
    
    if (existingSubscription) {
      console.log(`DEBUG: Updating existing subscription ${existingSubscription.id}`);
      
      // Update existing subscription
      const { data: updatedSub, error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          plan_id: planId,
          status: status,
          current_period_start: currentDate.toISOString(),
          current_period_end: endDate.toISOString(),
          cancel_at_period_end: false,
          payment_provider: 'stripe',
          payment_provider_subscription_id: stripeSubscriptionId,
          updated_at: currentDate.toISOString()
        })
        .eq('id', existingSubscription.id)
        .select()
        .single();
        
      if (updateError) {
        console.error('DEBUG ERROR: Error updating subscription:', updateError);
        return NextResponse.json({ 
          success: false, 
          error: `Error updating subscription: ${updateError.message}` 
        }, { status: 500 });
      }
      
      result = updatedSub;
    } else {
      console.log(`DEBUG: Creating new subscription`);
      
      // Create new subscription
      const { data: newSub, error: insertError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan_id: planId,
          status: status,
          current_period_start: currentDate.toISOString(),
          current_period_end: endDate.toISOString(),
          cancel_at_period_end: false,
          payment_provider: 'stripe',
          payment_provider_subscription_id: stripeSubscriptionId,
          created_at: currentDate.toISOString(),
          updated_at: currentDate.toISOString()
        })
        .select()
        .single();
        
      if (insertError) {
        console.error('DEBUG ERROR: Error creating subscription:', insertError);
        return NextResponse.json({ 
          success: false, 
          error: `Error creating subscription: ${insertError.message}` 
        }, { status: 500 });
      }
      
      result = newSub;
    }
    
    // Get the plan details
    const { data: planData, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();
      
    // Check if this is a yearly plan
    const isYearly = planData?.name?.includes('Yearly') || false;
      
    if (planError) {
      console.error('DEBUG ERROR: Error fetching plan details:', planError);
    } else {
      console.log(`DEBUG: Found plan: ${planData.name} with ${planData.credits_per_month} credits`);
      
      // Update user credits
      const { data: existingCredits, error: creditsError } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (!creditsError) {
        if (existingCredits) {
          console.log(`DEBUG: Updating existing credits for user ${userId}`);
          
          // Update existing credits
          const { error: updateError } = await supabase
            .from('user_credits')
            .update({
              balance: planData.credits_per_month,
              last_refill_date: currentDate.toISOString(),
              updated_at: currentDate.toISOString()
            })
            .eq('id', existingCredits.id);
            
          if (updateError) {
            console.error('DEBUG ERROR: Error updating credits:', updateError);
          }
        } else {
          console.log(`DEBUG: Creating new credits for user ${userId}`);
          
          // Create new credits
          const { error: insertError } = await supabase
            .from('user_credits')
            .insert({
              user_id: userId,
              balance: planData.credits_per_month,
              last_refill_date: currentDate.toISOString(),
              created_at: currentDate.toISOString(),
              updated_at: currentDate.toISOString()
            });
            
          if (insertError) {
            console.error('DEBUG ERROR: Error creating credits:', insertError);
          }
        }
        
        // Add a credit transaction
        const { error: transactionError } = await supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: planData.credits_per_month,
            description: `${planData.credits_per_month} credits added for subscription to ${planData.name} plan`,
            created_at: currentDate.toISOString()
          });
          
        if (transactionError) {
          console.error('DEBUG ERROR: Error creating transaction:', transactionError);
        }
      } else {
        console.error('DEBUG ERROR: Error checking existing credits:', creditsError);
      }
    }
    
    return NextResponse.json({
      success: true,
      subscription: result
    });
  } catch (error) {
    console.error('DEBUG ERROR: Unexpected error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An unexpected error occurred' 
    }, { status: 500 });
  }
}
