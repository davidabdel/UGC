"use client"

import { useState } from 'react'
import { setupStorageBuckets } from '@/lib/storage-setup'

export default function StorageSetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSetupStorage = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const setupResult = await setupStorageBuckets()
      setResult(setupResult)
      
      if (!setupResult.success) {
        setError('Failed to set up storage buckets. See console for details.')
      }
    } catch (err: any) {
      console.error('Error setting up storage:', err)
      setError(err.message || 'An unexpected error occurred')
      setResult(null)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Storage Setup</h1>
      
      <div className="glass-card mb-6">
        <h2 className="text-xl font-semibold mb-4">Create Storage Buckets</h2>
        <p className="text-white/70 mb-4">
          This will create the necessary storage buckets for the application if they don't already exist:
        </p>
        
        <ul className="list-disc list-inside mb-6 text-white/80">
          <li>user-images: For storing user uploaded images</li>
          <li>user-videos: For storing user uploaded videos</li>
          <li>thumbnails: For storing video thumbnails</li>
        </ul>
        
        <button
          onClick={handleSetupStorage}
          disabled={isLoading}
          className="btn-primary"
        >
          {isLoading ? 'Setting up...' : 'Set Up Storage Buckets'}
        </button>
      </div>
      
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg mb-6">
          <p className="text-white font-medium">{error}</p>
        </div>
      )}
      
      {result && (
        <div className="glass-card">
          <h2 className="text-xl font-semibold mb-4">Setup Result</h2>
          <pre className="bg-black/30 p-4 rounded-lg overflow-auto max-h-80">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
