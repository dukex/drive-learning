import { NextRequest, NextResponse } from 'next/server';
import { getUserSession, parseCoursesList, validateUserPermissions, generateCacheKey, extractFolderIdFromUrl } from '@/lib/drive-auth-utils';
import { GoogleDriveService } from '@/lib/google-drive';
import { transformDriveFolderToCourse } from '@/lib/models';
import type { Course } from '@/lib/models';

// Cache for storing course data (1 hour TTL)
const courseCache = new Map<string, { data: Course[]; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

export async function GET(request: NextRequest) {
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

    // Check cache first
    const cacheKey = generateCacheKey('courses', session.user.id);
    const cached = courseCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({
        courses: cached.data,
        cached: true,
        timestamp: new Date(cached.timestamp).toISOString()
      });
    }

    // Parse courses list from environment
    const courseConfig = parseCoursesList();
    
    // Initialize Google Drive service with user's access token
    const driveService = new GoogleDriveService(session.accessToken);
    
    // Fetch course data from Google Drive
    const courses: Course[] = [];
    const errors: Array<{ url: string; error: string }> = [];

    for (const courseUrl of courseConfig.courseUrls) {
      try {
        const folderId = extractFolderIdFromUrl(courseUrl);
        
        // Get folder metadata
        const folderMetadata = await driveService.getFolderMetadata(folderId);
        
        // Get chapter count by listing subfolders
        const chapters = await driveService.listFolders(folderId);
        
        // Transform to Course object
        const course = transformDriveFolderToCourse(
          folderMetadata,
          courseUrl,
          chapters.length
        );
        
        courses.push(course);
      } catch (error) {
        console.error(`Failed to fetch course from ${courseUrl}:`, error);
        errors.push({
          url: courseUrl,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Cache the results
    courseCache.set(cacheKey, {
      data: courses,
      timestamp: Date.now()
    });

    // Return response with courses and any errors
    const response: any = {
      courses,
      cached: false,
      timestamp: new Date().toISOString()
    };

    if (errors.length > 0) {
      response.errors = errors;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Courses API error:', error);
    
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('Authentication')) {
        return NextResponse.json(
          { error: 'Authentication failed. Please log in again.' },
          { status: 401 }
        );
      } else if (error.message.includes('permissions')) {
        return NextResponse.json(
          { error: 'Insufficient permissions to access courses.' },
          { status: 403 }
        );
      } else if (error.message.includes('COURSES_LIST')) {
        return NextResponse.json(
          { error: 'Course configuration error. Please contact administrator.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch courses. Please try again later.' },
      { status: 500 }
    );
  }
}

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of courseCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      courseCache.delete(key);
    }
  }
}, CACHE_TTL); // Run cleanup every hour