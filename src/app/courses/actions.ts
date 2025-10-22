import { extractFolderIdFromUrl, generateCacheKey, parseCoursesList, UserSession } from "@/lib/drive-auth-utils";
import { GoogleDriveService } from "@/lib/google-drive";
import { Course, transformDriveFolderToCourse } from "@/lib/models";

const courseCache = new Map<string, { data: Course[]; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

export async function fetchCourses(session: UserSession): Promise<{ courses: Course[], errors: Array<{ url?: string; error: string }> }> {
    const cacheKey = generateCacheKey('courses', session.user.id)
    const cached = courseCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return Promise.resolve({ courses: cached.data, errors: [] });
    }

    try {
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

                // Get lesson count by listing subfolders
                const lessons = await driveService.listFolders(folderId);

                // Transform to Course object
                const course = transformDriveFolderToCourse(
                    folderMetadata,
                    courseUrl,
                    lessons.length
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

        if (errors.length === 0) {
            // Cache the results
            courseCache.set(cacheKey, {
                data: courses,
                timestamp: Date.now()
            });
        }

        return { courses, errors }
    } catch (error) {
        console.error('Courses API error:', error);

        if (error instanceof Error) {
            if (error.message.includes('Authentication')) {
                return { errors: [{ error: 'Authentication failed. Please log in again.' }], courses: [] }
            } else if (error.message.includes('permissions')) {
                return { errors: [{ error: 'Insufficient permissions to access courses.' },], courses: [] }
            } else if (error.message.includes('COURSES_LIST')) {
                return { errors: [{ error: 'Course configuration error. Please contact administrator.' }], courses: [] }
            }
        }

        return { errors: [{ error: 'Failed to fetch courses. Please try again later.' }], courses: [] }
    }

}

setInterval(() => {
    const now = Date.now();
    for (const [key, value] of courseCache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
            courseCache.delete(key);
        }
    }
}, CACHE_TTL);