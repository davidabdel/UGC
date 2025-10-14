import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          get: async (name: string) => (await cookies()).get(name)?.value,
          set: async (name: string, value: string, options?: CookieOptions) => {
            (await cookies()).set({ name, value, ...(options || {}) })
          },
          remove: async (name: string, options?: CookieOptions) => {
            (await cookies()).set({ name, value: '', ...(options || {}) })
          }
        }
      }
    )

    await supabase.auth.exchangeCodeForSession(code)
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/app/create', request.url))
}
