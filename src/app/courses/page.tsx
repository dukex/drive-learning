import Navigation from '@/components/ui/Navigation';
import { validSession } from '@/lib/drive-auth-utils';
import { fetchCourses } from './actions';
import CoursesClientWrapper from '@/components/courses/CoursesList';

export default async function CoursesListPage() {
    const session = await validSession()
    const { courses } = await fetchCourses(session)


    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Navigation user={session.user} />
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

                 <CoursesClientWrapper courses={courses} />

                {/* TODO: remove <CoursesClient user={session.user} /> */}
            
            </div>
        </main>
    </div>
}