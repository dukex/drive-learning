import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { getUserSession, validateUserPermissions, extractFolderIdFromUrl } from '@/lib/drive-auth-utils';
import { GoogleDriveService } from '@/lib/google-drive';
import { transformDriveFolderToCourse, transformDriveFileToLessonFile } from '@/lib/models';
import Breadcrumb, { BreadcrumbIcons } from '@/components/ui/Breadcrumb';
import type { LessonFile } from '@/lib/models';
import { formatFileSize, isViewableInBrowser } from '@/lib/models/lesson-file';
import { getFileTypeIcon, getFileTypeDisplayName, supportsPreview, getPreviewUrl, getDetailedFileType } from '@/lib/utils/file-icons';

interface LessonDetailPageProps {
    params: Promise<{
        courseId: string;
        lessonId: string;
    }>;
}

interface LessonApiResponse {
    files: LessonFile[];
    lessonName: string;
    lessonDescription?: string;
    totalFiles: number;
    cached: boolean;
    timestamp: string;
}

async function fetchLessonData(courseId: string, lessonId: string): Promise<LessonApiResponse & { courseName: string }> {
    try {
        // Get user session and validate authentication
        const session = await getUserSession();
        if (!session) {
            redirect('/');
        }

        // Validate user permissions
        validateUserPermissions(session);

        if (!courseId || !lessonId) {
            throw new Error('Course ID and Lesson ID are required');
        }

        // Initialize Google Drive service with user's access token
        const driveService = new GoogleDriveService(session.accessToken);

        // Get course name for breadcrumb
        let courseFolderId: string;
        try {
            courseFolderId = courseId.includes('drive.google.com')
                ? extractFolderIdFromUrl(courseId)
                : courseId;
        } catch (error) {
            throw new Error('Invalid course ID format');
        }

        const courseMetadata = await driveService.getFolderMetadata(courseFolderId);

        // Get lesson folder ID
        let lessonFolderId: string;
        try {
            lessonFolderId = lessonId.includes('drive.google.com')
                ? extractFolderIdFromUrl(lessonId)
                : lessonId;
        } catch (error) {
            throw new Error('Invalid lesson ID format');
        }

        // Get lesson metadata and files directly
        const lessonMetadata = await driveService.getFolderMetadata(lessonFolderId);
        const driveFiles = await driveService.listFiles(lessonFolderId);

        // Transform files to LessonFile objects
        const files: LessonFile[] = [];
        for (const driveFile of driveFiles) {
            try {
                const lessonFile = transformDriveFileToLessonFile(driveFile, lessonId);
                files.push(lessonFile);
            } catch (fileError) {
                console.error(`Failed to process file ${driveFile.name}:`, fileError);
            }
        }

        return {
            files,
            lessonName: lessonMetadata.name || 'Unknown Lesson',
            lessonDescription: lessonMetadata.description,
            totalFiles: files.length,
            cached: false,
            timestamp: new Date().toISOString(),
            courseName: courseMetadata.name || 'Unknown Course',
        };

    } catch (error) {
        console.error('Lesson details fetch error:', error);

        if (error instanceof Error && error.message.includes('Authentication')) {
            redirect('/');
        }

        if (error instanceof Error) {
            if (error.message.includes('not found')) {
                notFound();
            } else if (error.message.includes('permissions')) {
                throw new Error('Insufficient permissions to access this lesson');
            }
        }

        throw error;
    }
}

function formatLastModified(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

// File icon function removed - now using getFileTypeIcon from utils

function LessonDetailContent({ courseId, lessonId }: { courseId: string; lessonId: string }) {
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

async function LessonDetailPageContent({ courseId, lessonId }: { courseId: string; lessonId: string }) {
    const data = await fetchLessonData(courseId, lessonId);
    const { files, lessonName, lessonDescription, courseName } = data;

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
            label: lessonName,
            icon: BreadcrumbIcons.Lesson,
        },
    ];

    const mainVideo = files.filter(file => getDetailedFileType(file.mimeType, file.name) === 'video').at(0)



    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb Navigation */}
                <Breadcrumb items={breadcrumbItems} className="mb-8" />

                {/* Lesson Header */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                {lessonName}
                            </h1>
                            {lessonDescription && (
                                <p className="text-lg text-gray-600 mb-4">
                                    {lessonDescription}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Files List */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Files</h2>
                    {mainVideo && <>
                        <iframe width={"100%"} height={"100%"} src={getPreviewUrl(mainVideo.id, mainVideo.mimeType, mainVideo.name)!} />
                        <p>{getPreviewUrl(mainVideo.id, mainVideo.mimeType, mainVideo.name)}</p>
                        <p>{JSON.stringify(mainVideo)}</p>
                    </>}

                    {files.length === 0 ? (
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
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No files found
                            </h3>
                            <p className="text-gray-500">
                                This lesson doesn't have any files yet.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            <div className="divide-y divide-gray-200">
                                {files.map((file) => (
                                    <div
                                        key={file.id}
                                        className="p-6 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                                                {/* File Icon */}
                                                <div className="flex-shrink-0">
                                                    {getFileTypeIcon(file.mimeType, file.name)}
                                                </div>

                                                {/* File Info */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-lg font-medium text-gray-900 truncate">
                                                        {file.name}
                                                    </h3>
                                                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                                        <span>
                                                            {formatFileSize(file.size)}
                                                        </span>
                                                        <span>
                                                            {formatLastModified(new Date(file.lastModified))}
                                                        </span>
                                                        <span>
                                                            {getFileTypeDisplayName(file.mimeType, file.name)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center space-x-3 ml-4">
                                                {/* Preview Button */}
                                                {supportsPreview(file.mimeType, file.name) && (
                                                    <Link
                                                        href={getPreviewUrl(file.id, file.mimeType, file.name) || file.viewUrl || '#'}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                                    >
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
                                                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                            />
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                            />
                                                        </svg>
                                                        Preview
                                                    </Link>
                                                )}

                                                {/* View Button (fallback for non-previewable files) */}
                                                {!supportsPreview(file.mimeType, file.name) && file.viewUrl && isViewableInBrowser(file.mimeType) && (
                                                    <Link
                                                        href={file.viewUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                                    >
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
                                                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                            />
                                                        </svg>
                                                        Open
                                                    </Link>
                                                )}

                                                {/* Download Button */}
                                                <Link
                                                    href={file.downloadUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                                >
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
                                                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                        />
                                                    </svg>
                                                    Download
                                                </Link>
                                            </div>
                                        </div>

                                        {/* Thumbnail if available */}
                                        {file.thumbnailUrl && (
                                            <div className="mt-4">
                                                <img
                                                    src={file.thumbnailUrl}
                                                    alt={`${file.name} thumbnail`}
                                                    className="w-32 h-24 rounded-lg object-cover border border-gray-200"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default async function LessonDetailPage({ params }: LessonDetailPageProps) {
    // Check authentication
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session) {
        redirect('/');
    }

    const { courseId, lessonId } = await params;

    return (
        <Suspense fallback={<LessonDetailContent courseId={courseId} lessonId={lessonId} />}>
            <LessonDetailPageContent courseId={courseId} lessonId={lessonId} />
        </Suspense>
    );
}