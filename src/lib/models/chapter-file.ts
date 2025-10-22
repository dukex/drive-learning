import { drive_v3 } from 'googleapis';

/**
 * ChapterFile interface representing individual files within a Chapter
 */
export interface ChapterFile {
  id: string;
  chapterId: string;
  name: string;
  mimeType: string;
  size: number;
  downloadUrl: string;
  viewUrl?: string;
  thumbnailUrl?: string;
  lastModified: Date;
}

/**
 * Transform Google Drive file data to ChapterFile object
 */
export function transformDriveFileToChapterFile(
  file: drive_v3.Schema$File,
  chapterId: string
): ChapterFile {
  return {
    id: file.id!,
    chapterId,
    name: file.name || 'Untitled File',
    mimeType: file.mimeType || 'application/octet-stream',
    size: file.size ? parseInt(file.size, 10) : 0,
    downloadUrl: generateDownloadUrl(file.id!, file.mimeType || undefined),
    viewUrl: generateViewUrl(file.id!, file.mimeType || undefined),
    thumbnailUrl: file.thumbnailLink || undefined,
    lastModified: file.modifiedTime ? new Date(file.modifiedTime) : new Date(),
  };
}

/**
 * Generate download URL for different file types
 */
export function generateDownloadUrl(fileId: string, mimeType?: string): string {
  // For Google Workspace files, use export endpoint
  if (isGoogleWorkspaceFile(mimeType)) {
    const exportFormat = getExportFormat(mimeType);
    return `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${exportFormat}`;
  }
  
  // For regular files, use direct download
  return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
}

/**
 * Generate view URL for different file types
 */
export function generateViewUrl(fileId: string, mimeType?: string): string | undefined {
  // Google Workspace files and PDFs can be viewed in browser
  if (isViewableInBrowser(mimeType)) {
    return `https://drive.google.com/file/d/${fileId}/view`;
  }
  
  return undefined;
}

/**
 * Check if file is a Google Workspace file
 */
export function isGoogleWorkspaceFile(mimeType?: string): boolean {
  if (!mimeType) return false;
  
  const workspaceTypes = [
    'application/vnd.google-apps.document',
    'application/vnd.google-apps.spreadsheet',
    'application/vnd.google-apps.presentation',
    'application/vnd.google-apps.drawing',
  ];
  
  return workspaceTypes.includes(mimeType);
}

/**
 * Get appropriate export format for Google Workspace files
 */
export function getExportFormat(mimeType?: string): string {
  const exportFormats: Record<string, string> = {
    'application/vnd.google-apps.document': 'application/pdf',
    'application/vnd.google-apps.spreadsheet': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.google-apps.presentation': 'application/pdf',
    'application/vnd.google-apps.drawing': 'image/png',
  };
  
  return exportFormats[mimeType || ''] || 'application/pdf';
}

/**
 * Check if file can be viewed in browser
 */
export function isViewableInBrowser(mimeType?: string): boolean {
  if (!mimeType) return false;
  
  const viewableTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'text/html',
    'application/vnd.google-apps.document',
    'application/vnd.google-apps.spreadsheet',
    'application/vnd.google-apps.presentation',
  ];
  
  return viewableTypes.includes(mimeType) || mimeType.startsWith('image/') || mimeType.startsWith('text/');
}

/**
 * Get file type category for display purposes
 */
export function getFileTypeCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('document') || mimeType.includes('word')) return 'document';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
  if (mimeType.startsWith('text/')) return 'text';
  
  return 'file';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Generate cache key for chapter files
 */
export function generateChapterFilesCacheKey(
  chapterId: string, 
  userId?: string
): string {
  return userId ? `files:${chapterId}:${userId}` : `files:${chapterId}`;
}