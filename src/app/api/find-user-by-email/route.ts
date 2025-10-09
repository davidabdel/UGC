import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jkgkuiuycqyzobbiwxpx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email is required' 
      }, { status: 400 });
    }
    
    console.log(`Looking up user with email: ${email}`);
    
    // Look up user by email in the auth.users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();
      
    if (userError) {
      console.error('Error finding user by email:', userError);
      
      // Try looking up in auth.users directly
      const { data: authData, error: authError } = await supabase
        .auth
        .admin
        .listUsers({
          filter: `email.eq.${email}`
        });
        
      if (authError || !authData || authData.users.length === 0) {
        console.error('Error finding user in auth.users:', authError);
        return NextResponse.json({ 
          success: false, 
          error: 'User not found with this email' 
        }, { status: 404 });
      }
      
      // Found in auth.users
      const user = authData.users[0];
      return NextResponse.json({
        success: true,
        userId: user.id,
        user: {
          id: user.id,
          email: user.email
        }
      });
    }
    
    // Found in users table
    return NextResponse.json({
      success: true,
      userId: userData.id,
      user: userData
    });
  } catch (error) {
    console.error('Unexpected error in find-user-by-email:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An unexpected error occurred' 
    }, { status: 500 });
  }
}
