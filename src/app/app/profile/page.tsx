"use client"

import { useAuth } from "@/context/AuthContext"
import { useState } from "react"

export default function ProfilePage() {
  const { user } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false)
  const [name, setName] = useState(user?.user_metadata?.name || '')

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)
    
    // In a real implementation, you would update the user profile in Supabase here
    // For now, we'll just simulate a delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsUpdating(false)
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold">Profile</h1>
      <p className="mt-2 text-white/70">Manage your account settings and profile information.</p>

      <div className="mt-8 glass-card">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-[color:var(--brand)] flex items-center justify-center text-2xl font-bold">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user?.user_metadata?.name || 'User'}</h2>
            <p className="text-sm text-white/70">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-1">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl bg-[#0F1117] border border-white/10 px-4 py-3 outline-none focus:border-[color:var(--brand)]"
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={user?.email}
                disabled
                className="w-full rounded-xl bg-[#0F1117] border border-white/10 px-4 py-3 outline-none text-white/50"
              />
              <p className="mt-1 text-xs text-white/50">Email cannot be changed</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              className="btn-primary"
              disabled={isUpdating}
            >
              {isUpdating ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
