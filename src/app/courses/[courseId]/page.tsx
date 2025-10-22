import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getUserSession, validateUserPermissions, generateCacheKey, extractFolderIdFromUrl } from '@/lib/drive-auth-utils';
import { GoogleDriveService } from '@/lib/google-drive';
import { transformDriveFolderToCourse, transformDriveFolderToLesson, sortLessonsByName, assignLessonOrder } from '@/lib/models';
import Breadcrumb, { BreadcrumbIcons } from '@/components/ui/Breadcrumb';
import type { Course, Lesson } from '@/lib/models';
interface CourseDetailPageProps {
    params: Promise<{
        courseId: string;
    }>;
}

interface CourseApiResponse {
    course: Course;
    lessons: Lesson[];
    cached: boolean;
    timestamp: string;
}

async function fetchCourseData(courseId: string): Promise<CourseApiResponse> {
    try {
        // Get user session and validate authentication
        const session = await getUserSession();
        if (!session) {
            redirect('/');
        }

        // Validate user permissions
        validateUserPermissions(session);

        if (!courseId) {
            throw new Error('Course ID is required');
        }

        // The courseId should be a Google Drive folder ID or URL
        let folderId: string;
        try {
            // Try to extract folder ID if it's a URL, otherwise use as-is
            folderId = courseId.includes('drive.google.com') 
                ? extractFolderIdFromUrl(courseId)
                : courseId;
        } catch (error) {
            throw new Error('Invalid course ID format');
        }

        // Initialize Google Drive service with user's access token
        const driveService = new GoogleDriveService(session.accessToken);
        
        try {
            // Get course metadata
            const folderMetadata = await driveService.getFolderMetadata(folderId);
            
            // Get lessons (subfolders)
            const lessonFolders = await driveService.listFolders(folderId);
            
            // Transform course data
            const course = transformDriveFolderToCourse(
                folderMetadata,
                `https://drive.google.com/drive/folders/${folderId}`,
                lessonFolders.length
            );

            // Transform and sort lessons
            let lessons = lessonFolders.map(folder => 
                transformDriveFolderToLesson(folder, course.id)
            );
            
            // Sort lessons by name and assign order
            lessons = sortLessonsByName(lessons);
            lessons = assignLessonOrder(lessons);

            return {
                course,
                lessons,
                cached: false,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error(`Failed to fetch course details for ${courseId}:`, error);
            
            if (error instanceof Error) {
                if (error.message.includes('not found')) {
                    notFound();
                } else if (error.message.includes('permissions')) {
                    throw new Error('Insufficient permissions to access this course');
                }
            }

            throw new Error('Failed to fetch course details. Please try again later.');
        }

    } catch (error) {
        console.error('Course details fetch error:', error);
        
        if (error instanceof Error && error.message.includes('Authentication')) {
            redirect('/');
        }

        throw error;
    }
}

function formatLastUpdated(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

function CourseDetailContent({ courseId }: { courseId: string }) {
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
                {/* Breadcrumb Navigation */}
                <Breadcrumb items={breadcrumbItems} className="mb-8" />

                {/* Loading State */}
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-lg shadow p-6">
                                <div className="h-6 bg-gray-200 rounded mb-3"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

async function CourseDetailPageContent({ courseId }: { courseId: string }) {
    const data = await fetchCourseData(courseId);
    const { course, lessons } = data;

    const breadcrumbItems = [
        {
            label: 'Courses',
            href: '/courses',
            icon: BreadcrumbIcons.Home,
        },
        {
            label: course.title,
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb Navigation */}
                <Breadcrumb items={breadcrumbItems} className="mb-8" />

                {/* Course Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                {course.title}
                            </h1>
                            {course.description && (
                                <p className="text-lg text-gray-600 mb-4">
                                    {course.description}
                                </p>
                            )}
                            <div className="flex items-center space-x-6 text-sm text-gray-500">
                                <span className="flex items-center">
                                    <svg
                                        className="w-4 h-4 mr-1"
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
                                    {lessons.length} {lessons.length === 1 ? 'Lesson' : 'Lessons'}
                                </span>
                                <span className="flex items-center">
                                    <svg
                                        className="w-4 h-4 mr-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    Updated {formatLastUpdated(new Date(course.lastUpdated))}
                                </span>
                            </div>
                        </div>
                        {course.thumbnailUrl && (
                            <div className="ml-6">
                                <img
                                    src={course.thumbnailUrl}
                                    alt={`${course.title} thumbnail`}
                                    className="w-24 h-24 rounded-lg object-cover"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Lessons List */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Lessons</h2>

                    {lessons.length === 0 ? (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                            <svg
                                className="w-12 h-12 text-gray-400 mx-auto mb-4"
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
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No lessons found
                            </h3>
                            <p className="text-gray-500">
                                This course doesn't have any lessons yet.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {lessons.map((lesson) => (
                                <Link
                                    key={lesson.id}
                                    href={`/courses/${courseId}/lessons/${lesson.id}`}
                                    className="group bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all duration-200"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                            {lesson.title}
                                        </h3>
                                        <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                            #{lesson.order}
                                        </span>
                                    </div>

                                    <div className="space-y-2 text-sm text-gray-500">
                                        
                                        <div className="flex items-center">
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
                                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                            </svg>
                                            {formatLastUpdated(new Date(lesson.lastUpdated))}
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center text-blue-600 group-hover:text-blue-700">
                                        <span className="text-sm font-medium">View lesson</span>
                                        <svg
                                            className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
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
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
    // Check authentication
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect('/');
    }

    const { courseId } = await params;

    return (
        <Suspense fallback={<CourseDetailContent courseId={courseId} />}>
            <CourseDetailPageContent courseId={courseId} />
        </Suspense>
    );
}