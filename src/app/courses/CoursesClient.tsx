'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Course } from '@/lib/models'
import CourseLoadingSkeleton from '../../components/courses/CourseLoadingSkeleton'
import CourseErrorBoundary from '../../components/courses/CourseErrorBoundary'
import CourseErrorDisplay from '../../components/courses/CourseErrorDisplay'
import CourseEmptyState from '../../components/courses/CourseEmptyState'
import CoursesClientWrapper from '../../components/courses/CoursesClientWrapper'

interface CoursesResponse {
  courses: Course[]
  cached: boolean
  timestamp: string
  errors?: Array<{ url: string; error: string }>
}

interface User {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

interface CoursesClientProps {
  user: User
}

export default function CoursesClient({ user }: CoursesClientProps) {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Fetch courses data with timeout and retry logic
  const fetchCourses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch('/api/courses', {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/')
          return
        }
        
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      const data: CoursesResponse = await response.json()
      setCourses(data.courses)
      
      // Reset retry count on success
      setRetryCount(0)
      
      // Show warning if there were errors fetching some courses
      if (data.errors && data.errors.length > 0) {
        console.warn('Some courses could not be loaded:', data.errors)
      }
      
    } catch (err) {
      console.error('Failed to fetch courses:', err)
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Request timeout. The server took too long to respond.')
        } else if (err.message.includes('NetworkError') || err.message.includes('fetch')) {
          setError('Network error. Please check your internet connection.')
        } else {
          setError(err.message)
        }
      } else {
        setError('Failed to load courses')
      }
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch when component mounts
  useEffect(() => {
    fetchCourses()
  }, [])

  // Retry function with exponential backoff
  const handleRetry = () => {
    const newRetryCount = retryCount + 1
    setRetryCount(newRetryCount)
    
    // Exponential backoff: 1s, 2s, 4s, 8s, then 8s max
    const delay = Math.min(1000 * Math.pow(2, newRetryCount - 1), 8000)
    
    setTimeout(() => {
      fetchCourses()
    }, delay)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <svg
                    className="h-5 w-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Courses
                  </h1>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              {user?.image && (
                <img
                  src={user.image}
                  alt={user.name || 'User avatar'}
                  className="h-8 w-8 rounded-full border border-gray-200 dark:border-gray-600"
                />
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user?.name || user?.email}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Available Courses
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Browse and access your educational content
            </p>
          </div>

          <CourseErrorBoundary>
            {/* Loading State */}
            {loading && <CourseLoadingSkeleton />}

            {/* Error State */}
            {error && !loading && (
              <CourseErrorDisplay 
                error={error} 
                onRetry={handleRetry} 
                retryCount={retryCount}
              />
            )}

            {/* Courses Grid or Empty State */}
            {!loading && !error && (
              <>
                {courses.length === 0 ? (
                  <CourseEmptyState />
                ) : (
                  <CoursesClientWrapper courses={courses} />
                )}
              </>
            )}
          </CourseErrorBoundary>
        </div>
      </main>
    </div>
  )
}