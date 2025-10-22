import { NextRequest, NextResponse } from 'next/server';
import { getUserSession, validateUserPermissions, extractFolderIdFromUrl } from '@/lib/drive-auth-utils';
import { GoogleDriveService } from '@/lib/google-drive';
import { transformDriveFileToChapterFile } from '@/lib/models';
import { getCacheService, CacheKeyGenerator, CACHE_CONFIG } from '@/lib/cache';
import type { ChapterFile } from '@/lib/models';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ courseId: string; chapterId: string }> }
) {
    try {
        // Get user session and validate authentication
        const session = await getUserSession();
        if (!session) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Validate user permissions
        validateUserPermissions(session);

        const { courseId, chapterId } = await params;

        if (!courseId || !chapterId) {
            return NextResponse.json(
                { error: 'Course ID and Chapter ID are required' },
                { status: 400 }
            );
        }

        // Parse pagination parameters from query string
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50'))); // Max 100, default 50

        // Check cache first (cache all files, then paginate)
        const cache = getCacheService();
        const cacheKey = CacheKeyGenerator.chapterFiles(session.user.id, courseId, chapterId);
        let allFiles = await cache.get<ChapterFile[]>(cacheKey);
        let chapterMetadata: any = null;

        if (!allFiles) {
            // Cache miss - fetch from Google Drive
            // Initialize Google Drive service with user's access token
            const driveService = new GoogleDriveService(session.accessToken);

            // The chapterId should be a Google Drive folder ID or URL
            let chapterFolderId: string;
            try {
                // Try to extract folder ID if it's a URL, otherwise use as-is
                chapterFolderId = chapterId.includes('drive.google.com')
                    ? extractFolderIdFromUrl(chapterId)
                    : chapterId;
            } catch (error) {
                return NextResponse.json(
                    { error: 'Invalid chapter ID format' },
                    { status: 400 }
                );
            }

            try {
                // Verify chapter exists and get metadata
                chapterMetadata = await driveService.getFolderMetadata(chapterFolderId);

                // Get all files in the chapter folder
                const driveFiles = await driveService.listFiles(chapterFolderId);

                // Transform files and generate URLs
                allFiles = [];

                for (const driveFile of driveFiles) {
                    try {
                        // Transform to ChapterFile object first
                        const chapterFile = transformDriveFileToChapterFile(driveFile, chapterId);

                        // Override URLs to use user's access token for authenticated access
                        // For Google Drive API access with user permissions, we use the webContentLink
                        // or generate authenticated URLs through the Drive service
                        if (driveFile.webContentLink) {
                            chapterFile.downloadUrl = driveFile.webContentLink;
                        } else {
                            // For files without direct download links, use the Drive API endpoint
                            chapterFile.downloadUrl = `https://www.googleapis.com/drive/v3/files/${driveFile.id}?alt=media`;
                        }

                        // Use the webViewLink for viewing files
                        if (driveFile.webViewLink) {
                            chapterFile.viewUrl = driveFile.webViewLink;
                        }

                        allFiles.push(chapterFile);
                    } catch (fileError) {
                        console.error(`Failed to process file ${driveFile.name}:`, fileError);
                        // Continue processing other files even if one fails
                    }
                }

                // Cache all files
                await cache.set(cacheKey, allFiles, CACHE_CONFIG.CHAPTER_FILES_TTL);

            } catch (error) {
                console.error(`Failed to fetch chapter files for ${chapterId}:`, error);

                if (error instanceof Error) {
                    if (error.message.includes('not found')) {
                        return NextResponse.json(
                            { error: 'Chapter not found or you do not have access to it' },
                            { status: 404 }
                        );
                    } else if (error.message.includes('permissions')) {
                        return NextResponse.json(
                            { error: 'Insufficient permissions to access this chapter' },
                            { status: 403 }
                        );
                    }
                }

                return NextResponse.json(
                    { error: 'Failed to fetch chapter files. Please try again later.' },
                    { status: 500 }
                );
            }
        }

        // Apply pagination to the files
        const totalFiles = allFiles.length;
        const totalPages = Math.ceil(totalFiles / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedFiles = allFiles.slice(startIndex, endIndex);

        // If we don't have chapter metadata from cache miss, we need to fetch it
        if (!chapterMetadata && allFiles.length > 0) {
            try {
                const driveService = new GoogleDriveService(session.accessToken);
                const chapterFolderId = chapterId.includes('drive.google.com')
                    ? extractFolderIdFromUrl(chapterId)
                    : chapterId;
                chapterMetadata = await driveService.getFolderMetadata(chapterFolderId);
            } catch (error) {
                // If we can't get metadata, use defaults
                chapterMetadata = { name: 'Chapter', description: '' };
            }
        }

        return NextResponse.json({
            files: paginatedFiles,
            chapterName: chapterMetadata?.name || 'Chapter',
            chapterDescription: chapterMetadata?.description || '',
            pagination: {
                currentPage: page,
                totalPages,
                totalFiles,
                limit,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            },
            cached: allFiles !== null,
            timestamp: new Date().toISOString()
        });



    } catch (error) {
        console.error('Chapter files API error:', error);

        if (error instanceof Error && error.message.includes('Authentication')) {
            return NextResponse.json(
                { error: 'Authentication failed. Please log in again.' },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to fetch chapter files. Please try again later.' },
            { status: 500 }
        );
    }
}

// Cache cleanup is handled automatically by the cache service