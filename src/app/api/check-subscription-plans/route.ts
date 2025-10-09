import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jkgkuiuycqyzobbiwxpx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
  try {
    console.log('Checking subscription plans with yearly price IDs');
    
    // Get all subscription plans
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('id, name, price_monthly, price_yearly, credits_per_month, stripe_price_id, stripe_price_id_yearly')
      .eq('is_active', true);

    if (plansError) {
      console.error('Error fetching subscription plans:', plansError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to get subscription plans', 
        details: plansError 
      }, { status: 500 });
    }

    // Check for the specific yearly price ID
    const yearlyLitePriceId = 'price_1SELtRKIeF7PCY4Jti48TBYA';
    const hasYearlyLitePlan = plans?.some(plan => 
      plan.stripe_price_id_yearly === yearlyLitePriceId
    );

    return NextResponse.json({
      success: true,
      plans,
      hasYearlyLitePlan,
      yearlyLitePriceId
    });
  } catch (error: any) {
    console.error('Unexpected error checking subscription plans:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'An unexpected error occurred' 
    }, { status: 500 });
  }
}
