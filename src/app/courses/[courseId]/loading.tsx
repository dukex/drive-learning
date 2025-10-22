import Breadcrumb, { BreadcrumbIcons } from '@/components/ui/Breadcrumb';

export default function CourseDetailLoading() {
  const breadcrumbItems = [
    {
      label: 'Courses',
      href: '/courses',
      icon: BreadcrumbIcons.Home,
    },
    {
      label: 'Loading...',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Loading */}
        <Breadcrumb items={breadcrumbItems} className="mb-8" />

        {/* Course Header Loading */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-4 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4 animate-pulse"></div>
              <div className="flex items-center space-x-6">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
            </div>
            <div className="ml-6">
              <div className="w-24 h-24 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Lessons Section Loading */}
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-32 mb-6 animate-pulse"></div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-8 animate-pulse"></div>
                </div>
                
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                </div>
                
                <div className="mt-4">
                  <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}