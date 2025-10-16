import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jkgkuiuycqyzobbiwxpx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(req: NextRequest) {
  try {
    console.log('Starting plan update process');
    
    // Check if the stripe_price_id column exists
    const { error: columnsError } = await supabase
      .from('subscription_plans')
      .select('id, name')
      .limit(1);
    
    if (columnsError) {
      console.error('Error checking subscription_plans table:', columnsError);
      return NextResponse.json({ 
        error: 'Failed to check subscription_plans table', 
        details: columnsError 
      }, { status: 500 });
    }
    
    console.log('Successfully connected to subscription_plans table');
    
    // We'll try to update the plans directly
    // If the column doesn't exist, we'll get an error
    // But we'll handle that in the catch block
    console.log('Proceeding with plan updates - column will be created if needed');
    
    // We'll first check if we can select the column
    try {
      const { error: testError } = await supabase
        .from('subscription_plans')
        .select('stripe_price_id')
        .limit(1);
      
      if (testError && testError.message && testError.message.includes('column "stripe_price_id" does not exist')) {
        console.log('Column does not exist, attempting to create it');
        
        // Try to execute raw SQL to add the column
        // This requires higher privileges and might not work
        try {
          const { error: sqlError } = await supabase.rpc('exec', { 
            sql: 'ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS stripe_price_id text;'
          });
          
          if (sqlError) {
            console.error('Error adding column via SQL:', sqlError);
            // We'll still try to update the plans - the column might be created automatically
          } else {
            console.log('Column added successfully');
          }
        } catch (sqlError) {
          console.error('Exception adding column via SQL:', sqlError);
          // Continue anyway - we'll try the updates
        }
      } else {
        console.log('Column already exists, proceeding with updates');
      }
    } catch (columnCheckError) {
      console.error('Error checking for column:', columnCheckError);
      // Continue anyway - we'll try the updates
    }
    
    // Update the Lite plan
    console.log('Updating Lite plan');
    const { error: liteError } = await supabase
      .from('subscription_plans')
      .update({ stripe_price_id: 'price_1SELqMKIeF7PCY4JjPiAhvmx' })
      .eq('name', 'Lite')
      .eq('price_monthly', 9900);
    
    if (liteError) {
      console.error('Error updating Lite plan:', liteError);
    } else {
      console.log('Lite plan updated successfully');
    }
    
    // Update the Business plan
    console.log('Updating Business plan');
    const { error: businessError } = await supabase
      .from('subscription_plans')
      .update({ stripe_price_id: 'price_1SELv9KIeF7PCY4J8o8mvjHB' })
      .eq('name', 'Business')
      .eq('price_monthly', 29900);
    
    if (businessError) {
      console.error('Error updating Business plan:', businessError);
    } else {
      console.log('Business plan updated successfully');
    }
    
    // Update the Heavy plan
    console.log('Updating Heavy plan');
    const { error: heavyError } = await supabase
      .from('subscription_plans')
      .update({ stripe_price_id: 'price_1SELvjKIeF7PCY4Jbf4vtqC2' })
      .eq('name', 'Heavy')
      .eq('price_monthly', 79900);
    
    if (heavyError) {
      console.error('Error updating Heavy plan:', heavyError);
    } else {
      console.log('Heavy plan updated successfully');
    }
    
    // Get all subscription plans to verify the updates
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('id, name, price_monthly, stripe_price_id')
      .eq('is_active', true);
    
    if (plansError) {
      console.error('Error fetching updated plans:', plansError);
      return NextResponse.json({ 
        error: 'Failed to fetch updated plans', 
        details: plansError,
        updates: {
          lite: liteError ? 'failed' : 'success',
          business: businessError ? 'failed' : 'success',
          heavy: heavyError ? 'failed' : 'success'
        }
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Subscription plans updated successfully',
      updates: {
        lite: liteError ? 'failed' : 'success',
        business: businessError ? 'failed' : 'success',
        heavy: heavyError ? 'failed' : 'success'
      },
      plans
    });
  } catch (error) {
    console.error('Unexpected error updating plans:', error);
    return NextResponse.json({ 
      error: 'Failed to update plans', 
      details: error 
    }, { status: 500 });
  }
}
