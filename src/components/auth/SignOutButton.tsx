'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authUtils } from '@/lib/auth-utils'
import { useAuth } from '@/components/providers/AuthProvider'

export default function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { refreshSession } = useAuth()

  const handleSignOut = async () => {
    try {
      setIsLoading(true)
      
      // Attempt to sign out from server
      await authUtils.signOut()
      
      // Refresh the session state to reflect the sign out
      await refreshSession()
      
      // Force redirect to welcome page after a short delay to ensure state is updated
      setTimeout(() => {
        router.push('/')
        router.refresh() // Force a full page refresh to clear any cached state
      }, 100)
      
    } catch (error) {
      console.error('Sign out failed:', error)
      
      // Even if server sign out fails, force local cleanup and redirect
      try {
        // Force refresh session to clear local state
        await refreshSession()
        
        // Redirect anyway to ensure user is logged out locally
        setTimeout(() => {
          router.push('/')
          router.refresh()
        }, 100)
      } catch (refreshError) {
        console.error('Failed to refresh session after sign out error:', refreshError)
        // Force redirect as last resort
        window.location.href = '/'
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={isLoading}
      className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2" />
          Signing out...
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Sign Out
        </>
      )}
    </button>
  )
}