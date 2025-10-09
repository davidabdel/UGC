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
      .select('*')
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
    
    return NextResponse.json({
      success: true,
      subscriptions: subscriptions || []
    });
  } catch (error) {
    console.error('Unexpected error checking subscriptions:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to check subscriptions' 
    }, { status: 500 });
  }
}
