import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client (bypasses RLS)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jkgkuiuycqyzobbiwxpx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    // Get the SQL from the request body
    const { sql } = await req.json();
    
    if (!sql) {
      return NextResponse.json({ 
        error: 'No SQL provided' 
      }, { status: 400 });
    }
    
    console.log('Executing SQL:', sql);
    
    // Execute via RPC (a Postgres function named 'exec' must exist)
    const { data, error } = await supabase.rpc('exec', { sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      
      // Try a different approach - individual statements
      const statements = sql.split(';').filter((s: string) => s.trim());
      const results: Array<{ statement: string; success: boolean; error?: unknown; data?: unknown }> = [];
      
      for (const statement of statements) {
        if (!statement.trim()) continue;
        
        try {
          console.log('Executing statement:', statement);
          
          // Execute each statement individually via RPC
          const { data: stmtData, error: stmtError } = await supabase.rpc('exec', { sql: statement });
          results.push({
            statement,
            success: !stmtError,
            error: stmtError,
            data: stmtData
          });
        } catch (stmtError) {
          results.push({
            statement,
            success: false,
            error: stmtError
          });
        }
      }
      
      return NextResponse.json({
        success: false,
        message: 'Error executing SQL as a batch, tried individual statements',
        error,
        individualResults: results
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'SQL executed successfully',
      data
    });
  } catch (error) {
    console.error('Unexpected error executing SQL:', error);
    return NextResponse.json({ 
      error: 'Failed to execute SQL', 
      details: error 
    }, { status: 500 });
  }
}
