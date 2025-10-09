import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jkgkuiuycqyzobbiwxpx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID is required' 
      }, { status: 400 });
    }
    
    console.log(`Checking subscriptions for user ${userId}`);
    
    // Get all subscriptions for the user
    const { data: subscriptions, error: findError } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans:plan_id (
          id,
          name,
          price_monthly,
          price_yearly,
          credits_per_month,
          stripe_price_id,
          stripe_price_id_yearly
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (findError) {
      console.error('Error finding subscriptions:', findError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error finding subscriptions' 
      }, { status: 500 });
    }
    
    console.log(`Found ${subscriptions?.length || 0} subscriptions for user ${userId}`);
    
    // Get user credits
    const { data: credits, error: creditsError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (creditsError && creditsError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error finding credits:', creditsError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error finding credits' 
      }, { status: 500 });
    }
    
    // Get credit transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (transactionsError) {
      console.error('Error finding credit transactions:', transactionsError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error finding credit transactions' 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      subscriptions: subscriptions || [],
      credits: credits || null,
      transactions: transactions || []
    });
  } catch (error) {
    console.error('Unexpected error checking user subscription:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to check user subscription' 
    }, { status: 500 });
  }
}
