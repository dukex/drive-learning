// Course models and utilities
export type { Course } from './course';
export {
  transformDriveFolderToCourse,
  extractFolderIdFromUrl,
  isValidGoogleDriveUrl,
  generateCourseCacheKey,
} from './course';

// Chapter models and utilities
export type { Chapter } from './chapter';
export {
  transformDriveFolderToChapter,
  sortChaptersByName,
  assignChapterOrder,
  generateChapterCacheKey,
} from './chapter';

// ChapterFile models and utilities
export type { ChapterFile } from './chapter-file';
export {
  transformDriveFileToChapterFile,
  generateDownloadUrl,
  generateViewUrl,
  isGoogleWorkspaceFile,
  getExportFormat,
  isViewableInBrowser,
  getFileTypeCategory,
  formatFileSize,
  generateChapterFilesCacheKey,
} from './chapter-file';