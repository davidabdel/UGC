import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  // Create a new response object that we'll modify and return
  const cookieStore = cookies()
  
  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          get: (name: string) => {
            return cookieStore.get(name)?.value
          },
          set: (name: string, value: string, options?: CookieOptions) => {
            cookieStore.set({ name, value, ...options })
          },
          remove: (name: string, options?: CookieOptions) => {
            cookieStore.set({ name, value: '', ...options })
          }
        }
      }
    )

    try {
      // Exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Error exchanging code for session:', error)
        return NextResponse.redirect(new URL('/login?error=auth', requestUrl.origin))
      }
      
      // If successful, redirect to the app
      return NextResponse.redirect(new URL('/app/create', requestUrl.origin))
    } catch (error) {
      console.error('Exception during auth callback:', error)
      return NextResponse.redirect(new URL('/login?error=server', requestUrl.origin))
    }
  }

  // If no code is present, redirect to login
  return NextResponse.redirect(new URL('/login?error=no_code', requestUrl.origin))
}