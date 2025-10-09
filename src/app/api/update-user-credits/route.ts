import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jkgkuiuycqyzobbiwxpx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const { userId, balance } = await req.json();
    
    if (!userId || balance === undefined) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID and balance are required' 
      }, { status: 400 });
    }
    
    console.log(`Updating credits for user ${userId} to ${balance}`);
    
    // Check if user credits record exists
    const { data: existingCredits, error: checkError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking existing credits:', checkError);
      return NextResponse.json({ 
        success: false, 
        error: 'Error checking existing credits' 
      }, { status: 500 });
    }
    
    const currentDate = new Date().toISOString();
    
    // Create or update user credits
    const { data: updatedCredits, error: updateError } = await supabase
      .from('user_credits')
      .upsert({
        user_id: userId,
        balance: balance,
        last_refill_date: currentDate,
        updated_at: currentDate
      })
      .select()
      .single();
      
    if (updateError) {
      console.error('Error updating credits:', updateError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update credits' 
      }, { status: 500 });
    }
    
    console.log('Credits updated:', updatedCredits);
    
    // Add credit transaction for the update
    const previousBalance = existingCredits?.balance || 0;
    const difference = balance - previousBalance;
    
    if (difference !== 0) {
      const { data: txData, error: txError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          amount: difference,
          description: `Manual credit balance adjustment`,
          created_at: currentDate
        })
        .select()
        .single();
        
      if (txError) {
        console.error('Error creating credit transaction:', txError);
        // Non-fatal error, continue
      } else {
        console.log('Credit transaction created:', txData);
      }
    }
    
    return NextResponse.json({
      success: true,
      credits: updatedCredits,
      previousBalance,
      difference
    });
  } catch (error: any) {
    console.error('Unexpected error updating user credits:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to update user credits' 
    }, { status: 500 });
  }
}
