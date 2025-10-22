'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import Link from 'next/link'
import type { Course } from '@/lib/models'
import CourseLoadingSkeleton from '@/components/courses/CourseLoadingSkeleton'
import CourseErrorBoundary from '@/components/courses/CourseErrorBoundary'
import CourseErrorDisplay from '@/components/courses/CourseErrorDisplay'
import CourseEmptyState from '@/components/courses/CourseEmptyState'

interface CoursesResponse {
  courses: Course[]
  cached: boolean
  timestamp: string
  errors?: Array<{ url: string; error: string }>
}

export default function CoursesListPage() {
  const { status, data } = useAuth()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Redirect unauthenticated users to welcome page
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  // Fetch courses data with timeout and retry logic
  const fetchCourses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Create AbortController for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
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

  // Initial fetch when component mounts and user is authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      fetchCourses()
    }
  }, [status])

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

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      </div>
    )
  }

  // Don't render anything if unauthenticated (will redirect)
  if (status === 'unauthenticated') {
    return null
  }

  const user = data?.user

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

            {/* Courses Grid */}
            {!loading && !error && (
            <>
              {courses.length === 0 ? (
                <CourseEmptyState />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <Link
                      key={course.id}
                      href={`/courses/${course.id}`}
                      className="group bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-blue-600"
                    >
                      <div className="p-6">
                        {/* Course Thumbnail */}
                        {course.thumbnailUrl ? (
                          <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className="w-full h-32 object-cover rounded-md mb-4"
                          />
                        ) : (
                          <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900 dark:to-indigo-800 rounded-md mb-4 flex items-center justify-center">
                            <svg
                              className="h-12 w-12 text-blue-600 dark:text-blue-400"
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
                        )}

                        {/* Course Title */}
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {course.title}
                        </h3>

                        {/* Course Description */}
                        {course.description && (
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {course.description}
                          </p>
                        )}

                        {/* Course Metadata */}
                        <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center">
                            <svg
                              className="h-4 w-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                              />
                            </svg>
                            {course.chapterCount} {course.chapterCount === 1 ? 'chapter' : 'chapters'}
                          </div>
                          <div className="text-xs">
                            Updated {new Date(course.lastUpdated).toLocaleDateString()}
                          </div>
                        </div>

                        {/* View Course Button */}
                        <div className="mt-4">
                          <span className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 group-hover:bg-blue-200 transition-colors dark:bg-blue-900 dark:text-blue-200 dark:group-hover:bg-blue-800">
                            View Course
                            <svg
                              className="ml-1 h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
            )}
          </CourseErrorBoundary>
        </div>
      </main>
    </div>
  )
}