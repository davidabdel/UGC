import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jkgkuiuycqyzobbiwxpx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const { subscriptionId } = await req.json();
    
    if (!subscriptionId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Subscription ID is required' 
      }, { status: 400 });
    }
    
    console.log(`Canceling subscription ${subscriptionId}`);
    
    // Update the subscription to canceled
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);
      
    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error updating subscription' 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Subscription canceled'
    });
  } catch (error) {
    console.error('Unexpected error canceling subscription:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to cancel subscription' 
    }, { status: 500 });
  }
}
