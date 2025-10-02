"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import ImageUploader from '@/components/ImageUploader'
import { getUserMedia } from '@/lib/media-service'

export default function MediaPage() {
  const { user } = useAuth()
  const [userMedia, setUserMedia] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadUserMedia() {
      if (!user) return
      
      try {
        const result = await getUserMedia(user.id)
        
        if (result.success) {
          setUserMedia(result.media || [])
        } else {
          setError('Failed to load media: ' + (result.error ? String(result.error) : 'Unknown error'))
        }
      } catch (err: any) {
        console.error('Error loading user media:', err)
        setError(err.message || 'An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadUserMedia()
  }, [user])

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Media Library</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <ImageUploader />
        </div>
        
        <div className="glass-card">
          <h2 className="text-xl font-semibold mb-4">Your Media</h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin h-6 w-6 border-2 border-white/60 border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-sm">{error}</p>
            </div>
          ) : userMedia.length === 0 ? (
            <p className="text-white/60">No media uploaded yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {userMedia.map((item) => (
                <div key={item.id} className="border border-white/10 rounded-lg overflow-hidden">
                  {item.media_type === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={item.mediaUrl} 
                      alt={item.title} 
                      className="w-full h-32 object-cover"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={item.thumbnailUrl || '/placeholder-video.jpg'} 
                      alt={item.title} 
                      className="w-full h-32 object-cover"
                    />
                  )}
                  <div className="p-2">
                    <p className="text-sm truncate">{item.title}</p>
                    <p className="text-xs text-white/60">{item.media_type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
