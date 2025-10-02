"use client"

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { createSupabaseClient } from '@/lib/supabase'

export default function SubscriptionDebug() {
  const { user } = useAuth()
  const [results, setResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkSubscription = async () => {
    // Get the current user from the context
    if (!user) {
      // Try to get the session directly
      const supabase = createSupabaseClient()
      const { data: sessionData } = await supabase.auth.getSession()
      
      if (!sessionData?.session?.user) {
        setError('No user logged in. Please log in first.')
        return
      }
      
      // Use the user from the session
      const currentUser = sessionData.session.user

    setIsLoading(true)
    setError(null)
    
    try {
      const supabase = createSupabaseClient()
      
      // Direct query to check if subscription exists
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', currentUser.id)
        .single()
      
      // Direct query to check if credits exist
      const { data: credits, error: creditsError } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', currentUser.id)
        .single()
      
      // Get all subscription plans
      const { data: plans, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
      
      // Get the current user
      const { data: userData, error: userError } = await supabase.auth.getUser()
      
      setResults({
        user: userData?.user,
        subscription,
        subscriptionError: subError,
        credits,
        creditsError,
        plans,
        plansError
      })
      
      if (subError && subError.code !== 'PGRST116') {
        setError(`Subscription error: ${subError.message}`)
      } else if (creditsError && creditsError.code !== 'PGRST116') {
        setError(`Credits error: ${creditsError.message}`)
      } else if (plansError) {
        setError(`Plans error: ${plansError.message}`)
      } else if (!subscription) {
        setError('No subscription found for this user')
      } else if (!credits) {
        setError('No credits found for this user')
      } else if (!plans || plans.length === 0) {
        setError('No subscription plans found')
      }
    } catch (err: any) {
      console.error('Error checking subscription:', err)
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const createSubscription = async () => {
    // Get the current user even if the context doesn't have it
    const supabase = createSupabaseClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError || !userData?.user) {
      setError(`No user logged in or error getting user: ${userError?.message || 'Unknown error'}`)
      return
    }
    
    // Use the user from Supabase directly
    const currentUser = userData.user

    setIsLoading(true)
    setError(null)
    
    try {
      const supabase = createSupabaseClient()
      
      // Get the free plan ID - case insensitive search
      const { data: plans, error: plansError } = await supabase
        .from('subscription_plans')
        .select('id, name')
        .eq('is_active', true)
      
      if (plansError) {
        throw plansError
      }
      
      // Find a plan with name 'Free' (case insensitive)
      const freePlan = plans.find(plan => 
        plan.name.toLowerCase() === 'free'
      )
      
      if (!freePlan) {
        throw new Error('Free plan not found. Available plans: ' + plans.map(p => p.name).join(', '))
      }
      
      // Create subscription directly
      const now = new Date()
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: currentUser.id,
          plan_id: freePlan.id,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: nextMonth.toISOString()
        })
        .select()
        .single()
      
      if (subError) {
        throw subError
      }
      
      // Create credits directly
      const { data: credits, error: creditsError } = await supabase
        .from('user_credits')
        .insert({
          user_id: currentUser.id,
          balance: 100,
          last_refill_date: now.toISOString()
        })
        .select()
        .single()
      
      if (creditsError) {
        throw creditsError
      }
      
      // Create transaction
      await supabase
        .from('credit_transactions')
        .insert({
          user_id: currentUser.id,
          amount: 100,
          description: 'Initial free credits (debug)'
        })
      
      setResults({
        subscription,
        credits,
        message: 'Subscription and credits created successfully'
      })
      
      // Reload the page after 2 seconds
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (err: any) {
      console.error('Error creating subscription:', err)
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const callSetupFunction = async () => {
    // Get the current user even if the context doesn't have it
    const supabase = createSupabaseClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError || !userData?.user) {
      setError(`No user logged in or error getting user: ${userError?.message || 'Unknown error'}`)
      return
    }
    
    // Use the user from Supabase directly
    const currentUser = userData.user

    setIsLoading(true)
    setError(null)
    
    try {
      const supabase = createSupabaseClient()
      
      // Call the setup_user_subscription function
      const { data, error } = await supabase.rpc('setup_user_subscription', {
        user_id: currentUser.id
      })
      
      if (error) {
        throw error
      }
      
      setResults({
        setupResult: data,
        message: 'Setup function called successfully'
      })
      
      // Reload the page after 2 seconds
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (err: any) {
      console.error('Error calling setup function:', err)
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="glass-card mb-8 border border-red-500/50">
      <h2 className="text-xl font-semibold mb-4">Subscription Debugging</h2>
      
      {/* Authentication status */}
      <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
        <p className="text-sm font-medium">Authentication Status</p>
        <p className="text-sm">{user ? `Logged in as: ${user.email}` : 'Not logged in - Please use the Login Helper above'}</p>
      </div>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={checkSubscription}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            {isLoading ? 'Checking...' : 'Check Subscription'}
          </button>
          
          <button
            onClick={createSubscription}
            disabled={isLoading}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
          >
            {isLoading ? 'Creating...' : 'Create Subscription Directly'}
          </button>
          
          <button
            onClick={callSetupFunction}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
          >
            {isLoading ? 'Setting up...' : 'Call Setup Function'}
          </button>
        </div>
        
        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {results && (
          <div>
            <h3 className="text-lg font-medium mb-2">Results:</h3>
            <pre className="bg-black/30 p-4 rounded-lg overflow-auto max-h-96 text-xs">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
