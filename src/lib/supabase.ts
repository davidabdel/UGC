import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

// These environment variables are set in .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create a single supabase client for the entire application
export const createSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey)
}

// Create a browser client (for client components)
export const createSupabaseBrowserClient = () => {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
