import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getUserSession, validateUserPermissions, extractFolderIdFromUrl } from '@/lib/drive-auth-utils';
import { GoogleDriveService } from '@/lib/google-drive';
import Breadcrumb, { BreadcrumbIcons } from '@/components/ui/Breadcrumb';
import { ChapterFilesClient } from '@/components/courses/ChapterFilesClient';
import type { ChapterFile } from '@/lib/models';

interface ChapterDetailPageProps {
    params: Promise<{
        courseId: string;
        chapterId: string;
    }>;
}

interface ChapterApiResponse {
    files: ChapterFile[];
    chapterName: string;
    chapterDescription?: string;
    pagination: {
        currentPage: number;
        totalPages: number;
        totalFiles: number;
        limit: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
    cached: boolean;
    timestamp: string;
}

async function fetchInitialChapterData(courseId: string, chapterId: string): Promise<{ courseName: string; chapterName: string; chapterDescription?: string }> {
    try {
        // Get user session and validate authentication
        const session = await getUserSession();
        if (!session) {
            redirect('/api/auth/signin');
        }

        // Validate user permissions
        validateUserPermissions(session);

        if (!courseId || !chapterId) {
            throw new Error('Course ID and Chapter ID are required');
        }

        // Get course and chapter metadata for breadcrumb
        const driveService = new GoogleDriveService(session.accessToken);
        
        let courseFolderId: string;
        try {
            courseFolderId = courseId.includes('drive.google.com')
                ? extractFolderIdFromUrl(courseId)
                : courseId;
        } catch (error) {
            throw new Error('Invalid course ID format');
        }

        let chapterFolderId: string;
        try {
            chapterFolderId = chapterId.includes('drive.google.com')
                ? extractFolderIdFromUrl(chapterId)
                : chapterId;
        } catch (error) {
            throw new Error('Invalid chapter ID format');
        }

        const [courseMetadata, chapterMetadata] = await Promise.all([
            driveService.getFolderMetadata(courseFolderId),
            driveService.getFolderMetadata(chapterFolderId)
        ]);

        return {
            courseName: courseMetadata.name || 'Unknown Course',
            chapterName: chapterMetadata.name || 'Unknown Chapter',
            chapterDescription: chapterMetadata.description
        };

    } catch (error) {
        console.error('Chapter metadata fetch error:', error);

        if (error instanceof Error && error.message.includes('Authentication')) {
            redirect('/api/auth/signin');
        }

        if (error instanceof Error) {
            if (error.message.includes('not found')) {
                notFound();
            } else if (error.message.includes('permissions')) {
                throw new Error('Insufficient permissions to access this chapter');
            }
        }

        throw error;
    }
}



function ChapterDetailContent({ courseId, chapterId }: { courseId: string; chapterId: string }) {
    const breadcrumbItems = [
        {
            label: 'Courses',
            href: '/courses',
            icon: BreadcrumbIcons.Home,
        },
        {
            label: 'Loading...',
            href: `/courses/${courseId}`,
            icon: BreadcrumbIcons.Course,
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

                    <div className="grid gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white rounded-lg shadow p-4">
                                <div className="flex items-center space-x-4">
                                    <div className="w-8 h-8 bg-gray-200 rounded"></div>
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                                        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                                    </div>
                                    <div className="w-20 h-8 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

async function ChapterDetailPageContent({ courseId, chapterId }: { courseId: string; chapterId: string }) {
    const { courseName, chapterName, chapterDescription } = await fetchInitialChapterData(courseId, chapterId);

    // Create initial data structure for the client component
    const initialData: ChapterApiResponse = {
        files: [],
        chapterName,
        chapterDescription,
        pagination: {
            currentPage: 1,
            totalPages: 1,
            totalFiles: 0,
            limit: 50,
            hasNextPage: false,
            hasPreviousPage: false
        },
        cached: false,
        timestamp: new Date().toISOString()
    };

    const breadcrumbItems = [
        {
            label: 'Courses',
            href: '/courses',
            icon: BreadcrumbIcons.Home,
        },
        {
            label: courseName,
            href: `/courses/${courseId}`,
            icon: BreadcrumbIcons.Course,
        },
        {
            label: chapterName,
            icon: BreadcrumbIcons.Chapter,
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb Navigation */}
                <Breadcrumb items={breadcrumbItems} className="mb-8" />

                {/* Chapter Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                {chapterName}
                            </h1>
                            {chapterDescription && (
                                <p className="text-lg text-gray-600 mb-4">
                                    {chapterDescription}
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
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                    Loading files...
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Files List with Pagination */}
                <ChapterFilesClient 
                    courseId={courseId}
                    chapterId={chapterId}
                    initialData={initialData}
                />
            </div>
        </div>
    );
}

export default async function ChapterDetailPage({ params }: ChapterDetailPageProps) {
    // Check authentication
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect('/api/auth/signin');
    }

    const { courseId, chapterId } = await params;

    return (
        <Suspense fallback={<ChapterDetailContent courseId={courseId} chapterId={chapterId} />}>
            <ChapterDetailPageContent courseId={courseId} chapterId={chapterId} />
        </Suspense>
    );
}