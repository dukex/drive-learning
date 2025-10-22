import { drive_v3 } from 'googleapis';

/**
 * Lesson interface representing a subdirectory within a Course
 */
export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  folderId: string;
  fileCount: number;
  lastUpdated: Date;
  order: number;
}

/**
 * Transform Google Drive subfolder data to Lesson object
 */
export function transformDriveFolderToLesson(
  folder: drive_v3.Schema$File,
  courseId: string,
  fileCount: number = 0,
  order: number = 0
): Lesson {
  return {
    id: folder.id!,
    courseId,
    title: folder.name || 'Untitled Lesson',
    folderId: folder.id!,
    fileCount,
    lastUpdated: folder.modifiedTime ? new Date(folder.modifiedTime) : new Date(),
    order,
  };
}

/**
 * Sort lessons by name (natural ordering for lesson numbers)
 */
export function sortLessonsByName(lessons: Lesson[]): Lesson[] {
  return lessons.sort((a, b) => {
    // Extract numbers from lesson names for natural sorting
    const aMatch = a.title.match(/(\d+)/);
    const bMatch = b.title.match(/(\d+)/);
    
    if (aMatch && bMatch) {
      const aNum = parseInt(aMatch[1], 10);
      const bNum = parseInt(bMatch[1], 10);
      if (aNum !== bNum) {
        return aNum - bNum;
      }
    }
    
    // Fall back to alphabetical sorting
    return a.title.localeCompare(b.title, undefined, { numeric: true });
  });
}

/**
 * Assign order numbers to lessons based on sorted position
 */
export function assignLessonOrder(lessons: Lesson[]): Lesson[] {
  const sortedLessons = sortLessonsByName(lessons);
  return sortedLessons.map((lesson, index) => ({
    ...lesson,
    order: index + 1,
  }));
}

/**
 * Generate cache key for lesson data
 */
export function generateLessonCacheKey(
  courseId: string, 
  lessonId?: string, 
  userId?: string
): string {
  const base = lessonId ? `lesson:${courseId}:${lessonId}` : `lessons:${courseId}`;
  return userId ? `${base}:${userId}` : base;
}