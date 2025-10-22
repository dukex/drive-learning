import { createAuthClient } from 'better-auth/client'
import type { User, Session } from '@/components/providers/AuthProvider'

// Create a singleton auth client instance
export const authClient = createAuthClient()

// Authentication utility functions
export const authUtils = {
  /**
   * Sign in with Google OAuth
   */
  signInWithGoogle: async () => {
    try {
      const result = await authClient.signIn.social({
        provider: 'google',
      })
      return result
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Authentication failed')
    }
  },

  /**
   * Sign out the current user
   */
  signOut: async () => {
    try {
      const result = await authClient.signOut()
      
      // Clear all stored session data
      localStorage.removeItem('auth-session')
      
      // Clear any other auth-related data from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('better-auth.') || key.startsWith('auth-')) {
          localStorage.removeItem(key)
        }
      })
      
      // Clear sessionStorage as well
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('better-auth.') || key.startsWith('auth-')) {
          sessionStorage.removeItem(key)
        }
      })
      
      return result
    } catch (error) {
      // Even if sign out fails on server, clear local data
      localStorage.removeItem('auth-session')
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('better-auth.') || key.startsWith('auth-')) {
          localStorage.removeItem(key)
        }
      })
      
      throw new Error(error instanceof Error ? error.message : 'Sign out failed')
    }
  },

  /**
   * Get the current session
   */
  getSession: async (): Promise<Session | null> => {
    try {
      const session = await authClient.getSession()
      
      if (session.data) {
        return {
          user: {
            id: session.data.user.id,
            name: session.data.user.name,
            email: session.data.user.email,
            image: session.data.user.image,
          },
          expires: new Date(session.data.session.expiresAt),
        }
      }
      
      return null
    } catch (error) {
      console.error('Failed to get session:', error)
      return null
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: async (): Promise<boolean> => {
    const session = await authUtils.getSession()
    return session !== null
  },

  /**
   * Get current user information
   */
  getCurrentUser: async (): Promise<User | null> => {
    const session = await authUtils.getSession()
    return session?.user || null
  },
}

// Export types for use in other components
export type { User, Session } from '@/components/providers/AuthProvider'