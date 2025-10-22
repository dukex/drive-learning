import { drive_v3 } from 'googleapis';

/**
 * Chapter interface representing a subdirectory within a Course
 */
export interface Chapter {
  id: string;
  courseId: string;
  title: string;
  folderId: string;
  fileCount: number;
  lastUpdated: Date;
  order: number;
}

/**
 * Transform Google Drive subfolder data to Chapter object
 */
export function transformDriveFolderToChapter(
  folder: drive_v3.Schema$File,
  courseId: string,
  fileCount: number = 0,
  order: number = 0
): Chapter {
  return {
    id: folder.id!,
    courseId,
    title: folder.name || 'Untitled Chapter',
    folderId: folder.id!,
    fileCount,
    lastUpdated: folder.modifiedTime ? new Date(folder.modifiedTime) : new Date(),
    order,
  };
}

/**
 * Sort chapters by name (natural ordering for chapter numbers)
 */
export function sortChaptersByName(chapters: Chapter[]): Chapter[] {
  return chapters.sort((a, b) => {
    // Extract numbers from chapter names for natural sorting
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
 * Assign order numbers to chapters based on sorted position
 */
export function assignChapterOrder(chapters: Chapter[]): Chapter[] {
  const sortedChapters = sortChaptersByName(chapters);
  return sortedChapters.map((chapter, index) => ({
    ...chapter,
    order: index + 1,
  }));
}

/**
 * Generate cache key for chapter data
 */
export function generateChapterCacheKey(
  courseId: string, 
  chapterId?: string, 
  userId?: string
): string {
  const base = chapterId ? `chapter:${courseId}:${chapterId}` : `chapters:${courseId}`;
  return userId ? `${base}:${userId}` : base;
}