"use client"

import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Session, User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signUp: (email: string, password: string, name: string) => Promise<{ error: { message?: string } | null }>
  signIn: (email: string, password: string) => Promise<{ error: { message?: string } | null }>
  signOut: () => Promise<void>
  googleSignIn: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user || null)
      setIsLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user || null)
      setIsLoading(false)
      router.refresh()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  const signUp = async (email: string, password: string, name: string) => {
    // In development, use admin signup endpoint to bypass email delivery
    if (process.env.NODE_ENV !== 'production') {
      try {
        const res = await fetch('/api/dev-admin-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, name })
        })
        const data = await res.json()
        if (!res.ok) {
          return { error: { message: data?.error || 'Admin signup failed' } }
        }
        return { error: null }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Admin signup error'
        return { error: { message } }
      }
    }

    // In production, use normal email confirmation flow
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : ''))
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: siteUrl ? `${siteUrl}/auth/callback` : undefined,
        data: {
          name
        }
      }
    })
    return { error: error ? { message: error.message } : null }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { error: error ? { message: error.message } : null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const googleSignIn = async () => {
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : ''))
    const redirectTo = siteUrl ? `${siteUrl}/auth/callback` : undefined
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: { prompt: 'select_account' },
      },
      // @ts-expect-error flowType exists in supabase-js v2
      flowType: 'pkce',
    })
    if (error) throw error
    // On some browsers, explicitly navigate to returned URL
    if (data?.url && typeof window !== 'undefined') {
      window.location.assign(data.url)
    }
  }

  const value = {
    user,
    session,
    isLoading,
    signUp,
    signIn,
    signOut,
    googleSignIn
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
