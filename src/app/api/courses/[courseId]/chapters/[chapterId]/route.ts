import { NextRequest, NextResponse } from 'next/server';
import { getUserSession, validateUserPermissions, generateCacheKey, extractFolderIdFromUrl } from '@/lib/drive-auth-utils';
import { GoogleDriveService } from '@/lib/google-drive';
import { transformDriveFileToChapterFile, generateDownloadUrl, generateViewUrl } from '@/lib/models';
import type { ChapterFile } from '@/lib/models';

// Cache for storing chapter files (15 minutes TTL)
const chapterFilesCache = new Map<string, { data: ChapterFile[]; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes in milliseconds

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

        // Check cache first
        const cacheKey = generateCacheKey('chapter', session.user.id, `${courseId}:${chapterId}`);
        const cached = chapterFilesCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            return NextResponse.json({
                files: cached.data,
                cached: true,
                timestamp: new Date(cached.timestamp).toISOString()
            });
        }

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
            const chapterMetadata = await driveService.getFolderMetadata(chapterFolderId);

            // Get all files in the chapter folder
            const driveFiles = await driveService.listFiles(chapterFolderId);

            // Transform files and generate URLs
            const chapterFiles: ChapterFile[] = [];

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

                    chapterFiles.push(chapterFile);
                } catch (fileError) {
                    console.error(`Failed to process file ${driveFile.name}:`, fileError);
                    // Continue processing other files even if one fails
                }
            }

            // Cache the results
            chapterFilesCache.set(cacheKey, {
                data: chapterFiles,
                timestamp: Date.now()
            });

            return NextResponse.json({
                files: chapterFiles,
                chapterName: chapterMetadata.name,
                chapterDescription: chapterMetadata.description,
                totalFiles: chapterFiles.length,
                cached: false,
                timestamp: new Date().toISOString()
            });

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

// Clean up expired cache entries periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of chapterFilesCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
            chapterFilesCache.delete(key);
        }
    }
}, CACHE_TTL); // Run cleanup every 15 minutes