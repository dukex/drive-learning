import { drive_v3 } from 'googleapis';

/**
 * Course interface representing a top-level educational unit
 */
export interface Course {
  id: string;
  title: string;
  description?: string;
  driveUrl: string;
  folderId: string;
  lessonCount: number;
  lastUpdated: Date;
  thumbnailUrl?: string;
}

/**
 * Transform Google Drive folder data to Course object
 */
export function transformDriveFolderToCourse(
  folder: drive_v3.Schema$File,
  driveUrl: string,
  lessonCount: number = 0
): Course {
  return {
    id: folder.id!,
    title: folder.name || 'Untitled Course',
    description: folder.description || undefined,
    driveUrl,
    folderId: folder.id!,
    lessonCount,
    lastUpdated: folder.modifiedTime ? new Date(folder.modifiedTime) : new Date(),
    thumbnailUrl: folder.thumbnailLink || undefined,
  };
}

/**
 * Extract Google Drive folder ID from various URL formats
 */
export function extractFolderIdFromUrl(url: string): string | null {
  // Handle different Google Drive URL formats:
  // https://drive.google.com/drive/folders/FOLDER_ID
  // https://drive.google.com/drive/u/0/folders/FOLDER_ID
  // https://drive.google.com/open?id=FOLDER_ID
  
  const patterns = [
    /\/folders\/([a-zA-Z0-9-_]+)/,
    /[?&]id=([a-zA-Z0-9-_]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Validate Google Drive URL format
 */
export function isValidGoogleDriveUrl(url: string): boolean {
  const driveUrlPattern = /^https:\/\/drive\.google\.com\//;
  return driveUrlPattern.test(url) && extractFolderIdFromUrl(url) !== null;
}

/**
 * Generate cache key for course data
 */
export function generateCourseCacheKey(courseId: string, userId?: string): string {
  return userId ? `course:${courseId}:${userId}` : `course:${courseId}`;
}