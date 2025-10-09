import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jkgkuiuycqyzobbiwxpx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
  try {
    console.log('Checking subscription plans');
    
    // We'll check if the column exists by trying to select it
    // If it doesn't exist, this will fail with a specific error
    const { data: testPlan, error: testError } = await supabase
      .from('subscription_plans')
      .select('id, name, stripe_price_id')
      .limit(1);
      
    // Check if the error indicates the column doesn't exist
    let hasStripePriceIdColumn = true;
    if (testError) {
      console.error('Error checking for stripe_price_id column:', testError);
      if (testError.message && testError.message.includes('column "stripe_price_id" does not exist')) {
        hasStripePriceIdColumn = false;
      } else {
        return NextResponse.json({ 
          error: 'Failed to check subscription_plans table', 
          details: testError 
        }, { status: 500 });
      }
    }

    // Get all subscription plans
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('id, name, price_monthly, stripe_price_id')
      .eq('is_active', true);

    if (plansError) {
      return NextResponse.json({ 
        error: 'Failed to get subscription plans', 
        details: plansError 
      }, { status: 500 });
    }

    // Check if the Business plan has the correct price ID
    const businessPlan = plans.find((plan: any) => plan.name === 'Business');
    const businessPriceId = businessPlan?.stripe_price_id;
    const isBusinessPriceCorrect = businessPriceId === 'price_1SELv9KIeF7PCY4J8o8mvjHB';

    // Check if the Lite plan has the correct price ID
    const litePlan = plans.find((plan: any) => plan.name === 'Lite');
    const litePriceId = litePlan?.stripe_price_id;
    const isLitePriceCorrect = litePriceId === 'price_1SELqMKIeF7PCY4JjPiAhvmx';

    // Check if the Heavy plan has the correct price ID
    const heavyPlan = plans.find((plan: any) => plan.name === 'Heavy');
    const heavyPriceId = heavyPlan?.stripe_price_id;
    const isHeavyPriceCorrect = heavyPriceId === 'price_1SELvjKIeF7PCY4Jbf4vtqC2';

    return NextResponse.json({
      hasStripePriceIdColumn,
      plans,
      businessPlan,
      isBusinessPriceCorrect,
      litePlan,
      isLitePriceCorrect,
      heavyPlan,
      isHeavyPriceCorrect
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to check plans', 
      details: error 
    }, { status: 500 });
  }
}
