import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// Hardcoded values for testing
const supabaseUrl = 'https://jkgkuiuycqyzobbiwxpx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprZ2t1aXV5Y3F5em9iYml3eHB4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMjQyMjYsImV4cCI6MjA3NDgwMDIyNn0.WkwwTwI-S_pmD-8xb2mL8P2-ezMCSSXDtqsipEbwUvQ'

// Create a single supabase client for the entire application
export const createSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Create a browser client (for client components)
export const createSupabaseBrowserClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
