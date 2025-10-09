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
    
    // Try to execute the SQL using a direct query
    // This is a workaround and might not work depending on permissions
    const { data, error } = await supabase
      .from('_manual_sql_execution')
      .select('*')
      .limit(1)
      .then(() => {
        // This is just a trick to get access to the internal query method
        // @ts-ignore - Accessing private method
        return supabase.rest.rpc('exec', { sql });
      })
      .catch(e => {
        // Try another approach if the first one fails
        // @ts-ignore - Accessing private method
        return supabase.rpc('exec', { sql });
      });
    
    if (error) {
      console.error('Error executing SQL:', error);
      
      // Try a different approach - individual statements
      const statements = sql.split(';').filter(s => s.trim());
      const results = [];
      
      for (const statement of statements) {
        if (!statement.trim()) continue;
        
        try {
          console.log('Executing statement:', statement);
          
          // Try to execute each statement individually
          // We'll use different approaches based on the statement type
          if (statement.trim().toLowerCase().startsWith('select')) {
            // For SELECT statements, we can use the .rpc method
            const { data: selectData, error: selectError } = await supabase
              .rpc('exec', { sql: statement });
            
            results.push({
              statement,
              success: !selectError,
              error: selectError,
              data: selectData
            });
          } else {
            // For other statements, we'll try a different approach
            // This is a hack and might not work
            const { data: updateData, error: updateError } = await supabase
              .from('_manual_sql_execution')
              .select('*')
              .limit(1)
              .then(() => {
                // @ts-ignore - Accessing private method
                return supabase.rest.rpc('exec', { sql: statement });
              })
              .catch(e => {
                // @ts-ignore - Accessing private method
                return supabase.rpc('exec', { sql: statement });
              });
            
            results.push({
              statement,
              success: !updateError,
              error: updateError,
              data: updateData
            });
          }
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
