import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jkgkuiuycqyzobbiwxpx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
  try {
    // Get parameters from query string
    const url = new URL(req.url);
    const table = url.searchParams.get('table') || 'subscription_plans';
    const userId = url.searchParams.get('userId');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    
    console.log(`DEBUG: Querying table ${table} with userId=${userId}, limit=${limit}`);
    
    // Query the database based on the table
    let query = supabase.from(table).select('*').limit(limit);
    
    // Add filters if userId is provided
    if (userId && (table === 'user_subscriptions' || table === 'user_credits' || table === 'credit_transactions')) {
      query = query.eq('user_id', userId);
    }
    
    // Execute the query
    const { data, error } = await query;
    
    if (error) {
      console.error(`DEBUG ERROR: Error querying ${table}:`, error);
      return NextResponse.json({ 
        success: false, 
        error: `Error querying ${table}: ${error.message}` 
      }, { status: 500 });
    }
    
    console.log(`DEBUG: Found ${data?.length || 0} rows in ${table}`);
    
    // For user_subscriptions, also fetch the related plan details
    if (table === 'user_subscriptions' && data && data.length > 0) {
      const planIds = data.map(sub => sub.plan_id).filter(Boolean);
      
      if (planIds.length > 0) {
        const { data: planData, error: planError } = await supabase
          .from('subscription_plans')
          .select('*')
          .in('id', planIds);
          
        if (!planError && planData) {
          console.log(`DEBUG: Found ${planData.length} related plans`);
          
          // Add plan details to each subscription
          data.forEach(sub => {
            sub.plan = planData.find(plan => plan.id === sub.plan_id);
          });
        } else {
          console.error('DEBUG ERROR: Error fetching related plans:', planError);
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      table,
      count: data?.length || 0,
      data
    });
  } catch (error) {
    console.error('DEBUG ERROR: Unexpected error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An unexpected error occurred' 
    }, { status: 500 });
  }
}
