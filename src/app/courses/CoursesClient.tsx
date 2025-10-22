'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Course } from '@/lib/models'
import CourseLoadingSkeleton from '../../components/courses/CourseLoadingSkeleton'
import CourseErrorBoundary from '../../components/courses/CourseErrorBoundary'
import CourseErrorDisplay from '../../components/courses/CourseErrorDisplay'
import CourseEmptyState from '../../components/courses/CourseEmptyState'
import CoursesClientWrapper from '../../components/courses/CoursesList'

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
    <>
    
     

          <CourseErrorBoundary>
          

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
        
      
    
    </>
  )
}