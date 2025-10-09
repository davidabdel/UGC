import { NextRequest, NextResponse } from 'next/server';

// Direct subscription creation function
async function directCreateSubscription(
  userId: string,
  priceId: string,
  customerEmail: string
) {
  try {
    console.log(`Creating subscription for user ${userId} with price ${priceId}`);
    
    // Get Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jkgkuiuycqyzobbiwxpx.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get plan details from price ID
    const { data: planData, error: planError } = await supabase
      .from('subscription_plans')
      .select('id, name, credits_per_month')
      .eq('stripe_price_id', priceId)
      .eq('is_active', true)
      .single();
      
    if (planError || !planData) {
      console.error(`No plan found for price: ${priceId}`, planError);
      return { success: false, error: 'Plan not found' };
    }
    
    const planId = planData.id;
    const credits = planData.credits_per_month;
    
    console.log(`Found plan: ${planData.name} with ${credits} credits`);
    
    // Create a fake subscription ID for testing
    const fakeSubscriptionId = `manual_${Date.now()}`;
    
    // Create subscription record
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    // Insert subscription
    const { data: newSub, error: insertError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_id: planId,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: nextMonth.toISOString(),
        cancel_at_period_end: false,
        payment_provider: 'stripe',
        payment_provider_subscription_id: fakeSubscriptionId,
        email: customerEmail
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating subscription:', insertError);
      return { success: false, error: insertError };
    }
    
    console.log(`Created subscription: ${newSub.id}`);
    
    // Add credits
    if (credits > 0) {
      // Check if user has existing credits
      const { data: existingCredits, error: findError } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (findError) {
        console.error('Error finding user credits:', findError);
        return { success: false, error: findError };
      }
      
      if (existingCredits) {
        // Update existing credits
        const { error: updateError } = await supabase
          .from('user_credits')
          .update({
            balance: existingCredits.balance + credits,
            last_refill_date: now.toISOString(),
          })
          .eq('id', existingCredits.id);
        
        if (updateError) {
          console.error('Error updating credits:', updateError);
          return { success: false, error: updateError };
        }
      } else {
        // Create new credits record
        const { error: insertCreditError } = await supabase
          .from('user_credits')
          .insert({
            user_id: userId,
            balance: credits,
            last_refill_date: now.toISOString(),
          });
        
        if (insertCreditError) {
          console.error('Error creating credits:', insertCreditError);
          return { success: false, error: insertCreditError };
        }
      }
      
      // Add transaction record
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          amount: credits,
          description: `${credits} credits added for new subscription`,
          metadata: { source: 'manual_subscription' },
        });
      
      if (transactionError) {
        console.error('Error creating transaction:', transactionError);
        // Don't fail the whole operation for transaction error
      }
    }
    
    return { success: true };
  } catch (err) {
    console.error('Error in directCreateSubscription:', err);
    return { success: false, error: err };
  }
}

// This is a direct API route to create a subscription without going through Stripe
// It's useful for testing and debugging
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, priceId, email } = body;
    
    if (!userId || !priceId || !email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields: userId, priceId, email' 
      }, { status: 400 });
    }
    
    const result = await directCreateSubscription(userId, priceId, email);
    
    if (!result.success) {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Subscription created successfully'
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
