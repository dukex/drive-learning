interface CourseErrorDisplayProps {
  error: string
  onRetry: () => void
  retryCount?: number
}

export default function CourseErrorDisplay({ error, onRetry, retryCount = 0 }: CourseErrorDisplayProps) {
  const getErrorMessage = (error: string) => {
    if (error.includes('Authentication')) {
      return {
        title: 'Authentication Required',
        message: 'Please log in again to access your courses.',
        showRetry: false
      }
    } else if (error.includes('permissions')) {
      return {
        title: 'Access Denied',
        message: 'You don\'t have permission to access these courses. Please contact your administrator.',
        showRetry: false
      }
    } else if (error.includes('Network')) {
      return {
        title: 'Connection Problem',
        message: 'Unable to connect to the server. Please check your internet connection.',
        showRetry: true
      }
    } else if (error.includes('timeout')) {
      return {
        title: 'Request Timeout',
        message: 'The request took too long to complete. Please try again.',
        showRetry: true
      }
    } else {
      return {
        title: 'Failed to Load Courses',
        message: error,
        showRetry: true
      }
    }
  }

  const errorInfo = getErrorMessage(error)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-red-200 dark:bg-gray-800 dark:border-red-700 p-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            {errorInfo.title}
          </h3>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            {errorInfo.message}
          </p>
          {retryCount > 0 && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              Retry attempt: {retryCount}
            </p>
          )}
        </div>
        {errorInfo.showRetry && (
          <div className="ml-4">
            <button
              onClick={onRetry}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}