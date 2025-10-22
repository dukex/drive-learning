'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createAuthClient } from 'better-auth/client'

const authClient = createAuthClient()

// Types for authentication state
export interface User {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

export interface Session {
  user: User
  expires: Date
}

export interface AuthState {
  status: 'loading' | 'authenticated' | 'unauthenticated'
  data: Session | null
}

// Create the auth context with refresh function
interface AuthContextType extends AuthState {
  refreshSession: () => Promise<void>
  forceSignOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    status: 'loading',
    data: null,
  })

  // Function to get and update session state
  const getSession = async () => {
    try {
      const session = await authClient.getSession()
      
      if (session.data) {
        const sessionData = {
          user: {
            id: session.data.user.id,
            name: session.data.user.name,
            email: session.data.user.email,
            image: session.data.user.image,
          },
          expires: new Date(session.data.session.expiresAt),
        }

        setAuthState({
          status: 'authenticated',
          data: sessionData,
        })

        // Store session data in localStorage for persistence
        localStorage.setItem('auth-session', JSON.stringify(sessionData))
      } else {
        setAuthState({
          status: 'unauthenticated',
          data: null,
        })
        // Clear stored session data
        localStorage.removeItem('auth-session')
      }
    } catch (error) {
      console.error('Failed to get session:', error)
      setAuthState({
        status: 'unauthenticated',
        data: null,
      })
      // Clear stored session data on error
      localStorage.removeItem('auth-session')
    }
  }

  // Function to restore session from localStorage on initial load
  const restoreSession = () => {
    try {
      const storedSession = localStorage.getItem('auth-session')
      if (storedSession) {
        const sessionData = JSON.parse(storedSession)
        // Check if session is still valid (not expired)
        if (new Date(sessionData.expires) > new Date()) {
          setAuthState({
            status: 'authenticated',
            data: {
              ...sessionData,
              expires: new Date(sessionData.expires),
            },
          })
          return true
        } else {
          // Session expired, remove it
          localStorage.removeItem('auth-session')
        }
      }
    } catch (error) {
      console.error('Failed to restore session:', error)
      localStorage.removeItem('auth-session')
    }
    return false
  }

  // Function to manually refresh session (can be called after auth operations)
  const refreshSession = async () => {
    await getSession()
  }

  // Function to force sign out locally (for cleanup when server sign out fails)
  const forceSignOut = () => {
    // Clear all local storage
    localStorage.removeItem('auth-session')
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('better-auth.') || key.startsWith('auth-')) {
        localStorage.removeItem(key)
      }
    })
    
    // Clear session storage
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('better-auth.') || key.startsWith('auth-')) {
        sessionStorage.removeItem(key)
      }
    })
    
    // Update state immediately
    setAuthState({
      status: 'unauthenticated',
      data: null,
    })
  }

  useEffect(() => {
    // First try to restore session from localStorage for immediate UI update
    const sessionRestored = restoreSession()
    
    // Then verify with server (this will update if session is invalid)
    getSession()

    // Set up periodic session checking since BetterAuth doesn't have onAuthStateChange
    const interval = setInterval(() => {
      getSession()
    }, 30000) // Check every 30 seconds

    // Listen for storage events to sync auth state across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'better-auth.session-token' || e.key === 'auth-session' || e.key === null) {
        getSession()
      }
    }

    // Listen for focus events to refresh session when user returns to tab
    const handleFocus = () => {
      getSession()
    }

    // Listen for beforeunload to clean up expired sessions
    const handleBeforeUnload = () => {
      const storedSession = localStorage.getItem('auth-session')
      if (storedSession) {
        try {
          const sessionData = JSON.parse(storedSession)
          if (new Date(sessionData.expires) <= new Date()) {
            localStorage.removeItem('auth-session')
          }
        } catch (error) {
          localStorage.removeItem('auth-session')
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearInterval(interval)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  const contextValue: AuthContextType = {
    ...authState,
    refreshSession,
    forceSignOut,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}