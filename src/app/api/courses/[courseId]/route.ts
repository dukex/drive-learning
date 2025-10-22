import { NextRequest, NextResponse } from 'next/server';
import { getUserSession, validateUserPermissions, generateCacheKey, extractFolderIdFromUrl } from '@/lib/drive-auth-utils';
import { GoogleDriveService } from '@/lib/google-drive';
import { transformDriveFolderToCourse, transformDriveFolderToChapter, sortChaptersByName, assignChapterOrder } from '@/lib/models';
import type { Course, Chapter } from '@/lib/models';

// Cache for storing course details (30 minutes TTL)
const courseDetailsCache = new Map<string, { data: { course: Course; chapters: Chapter[] }; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
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

    const { courseId } = await params;
    
    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = generateCacheKey('course', session.user.id, courseId);
    const cached = courseDetailsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        ...cached.data,
        cached: true,
        timestamp: new Date(cached.timestamp).toISOString()
      });
    }

    // Initialize Google Drive service with user's access token
    const driveService = new GoogleDriveService(session.accessToken);
    
    // The courseId should be a Google Drive folder ID or URL
    let folderId: string;
    try {
      // Try to extract folder ID if it's a URL, otherwise use as-is
      folderId = courseId.includes('drive.google.com') 
        ? extractFolderIdFromUrl(courseId)
        : courseId;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid course ID format' },
        { status: 400 }
      );
    }

    try {
      // Get course metadata
      const folderMetadata = await driveService.getFolderMetadata(folderId);
      
      // Get chapters (subfolders)
      const chapterFolders = await driveService.listFolders(folderId);
      
      // Transform course data
      const course = transformDriveFolderToCourse(
        folderMetadata,
        `https://drive.google.com/drive/folders/${folderId}`,
        chapterFolders.length
      );

      // Transform and sort chapters
      let chapters = chapterFolders.map(folder => 
        transformDriveFolderToChapter(folder, course.id)
      );
      
      // Sort chapters by name and assign order
      chapters = sortChaptersByName(chapters);
      chapters = assignChapterOrder(chapters);

      const responseData = { course, chapters };

      // Cache the results
      courseDetailsCache.set(cacheKey, {
        data: responseData,
        timestamp: Date.now()
      });

      return NextResponse.json({
        ...responseData,
        cached: false,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error(`Failed to fetch course details for ${courseId}:`, error);
      
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          return NextResponse.json(
            { error: 'Course not found or you do not have access to it' },
            { status: 404 }
          );
        } else if (error.message.includes('permissions')) {
          return NextResponse.json(
            { error: 'Insufficient permissions to access this course' },
            { status: 403 }
          );
        }
      }

      return NextResponse.json(
        { error: 'Failed to fetch course details. Please try again later.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Course details API error:', error);
    
    if (error instanceof Error && error.message.includes('Authentication')) {
      return NextResponse.json(
        { error: 'Authentication failed. Please log in again.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch course details. Please try again later.' },
      { status: 500 }
    );
  }
}

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of courseDetailsCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      courseDetailsCache.delete(key);
    }
  }
}, CACHE_TTL); // Run cleanup every 30 minutes