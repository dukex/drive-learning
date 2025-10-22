export default function CourseLoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 dark:bg-gray-800 dark:border-gray-700 p-6 animate-pulse">
          {/* Thumbnail skeleton */}
          <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-md mb-4"></div>
          
          {/* Title skeleton */}
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
          
          {/* Description skeleton */}
          <div className="space-y-2 mb-4">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
          
          {/* Metadata skeleton */}
          <div className="flex justify-between items-center mb-4">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
          
          {/* Button skeleton */}
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
      ))}
    </div>
  )
}