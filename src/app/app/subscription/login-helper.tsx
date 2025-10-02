"use client"

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { createSupabaseClient } from '@/lib/supabase'

export default function LoginHelper() {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const supabase = createSupabaseClient()
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        throw error
      }
      
      setSuccess('Login successful! Refreshing page...')
      
      // Reload the page after 2 seconds
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'An error occurred during login')
    } finally {
      setIsLoading(false)
    }
  }

  const checkSession = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const supabase = createSupabaseClient()
      
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        throw error
      }
      
      if (data.session) {
        setSuccess(`Session found: ${data.session.user.email}`)
      } else {
        setError('No active session found')
      }
    } catch (err: any) {
      console.error('Session check error:', err)
      setError(err.message || 'An error occurred checking session')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="glass-card mb-8 border border-blue-500/50">
      <h2 className="text-xl font-semibold mb-4">Authentication Helper</h2>
      
      {user ? (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
          <p className="text-sm">Logged in as: {user.email}</p>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
          <p className="text-sm">Not logged in. Please use the form below.</p>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
          <p className="text-sm">{success}</p>
        </div>
      )}
      
      <form onSubmit={handleLogin} className="space-y-4 mb-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-[#0F1117] border border-white/10 px-3 py-2 outline-none focus:border-[color:var(--brand)]"
            placeholder="you@example.com"
            required
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-[#0F1117] border border-white/10 px-3 py-2 outline-none focus:border-[color:var(--brand)]"
            placeholder="••••••••"
            required
          />
        </div>
        
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-gradient-to-r from-[color:var(--brand)] to-[color:var(--brand-2)] text-white rounded-lg hover:opacity-90 transition"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
          
          <button
            type="button"
            onClick={checkSession}
            disabled={isLoading}
            className="px-4 py-2 border border-white/20 bg-white/5 rounded-lg hover:bg-white/10 transition"
          >
            Check Session
          </button>
        </div>
      </form>
    </div>
  )
}
