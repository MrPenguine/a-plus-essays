"use client"

import { useAuth } from "@/lib/firebase/hooks"
import { useEffect } from "react"

export default function AdminSetup() {
  const { user } = useAuth()

  useEffect(() => {
    const setupAdmin = async () => {
      if (!user) return
      
      try {
        const response = await fetch('/api/admin/set-admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uid: user.uid }),
        })
        
        if (!response.ok) {
          throw new Error('Failed to set admin')
        }
        
        // Force token refresh to get new claims
        await user.getIdToken(true)
        
        console.log('Admin setup complete')
      } catch (error) {
        console.error('Error setting up admin:', error)
      }
    }

    setupAdmin()
  }, [user])

  return <div>Setting up admin...</div>
} 