import { ReactNode } from 'react';

/**
 * File type icon components using SVG icons
 */
export const FileTypeIcons = {
  // Document types
  pdf: (
    <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
    </svg>
  ),
  
  document: (
    <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
    </svg>
  ),

  spreadsheet: (
    <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
    </svg>
  ),

  presentation: (
    <svg className="w-8 h-8 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v8a1 1 0 01-1 1h-5v2a1 1 0 01-1.707.707L7.586 14H4a1 1 0 01-1-1V4z" clipRule="evenodd" />
    </svg>
  ),

  // Media types
  image: (
    <svg className="w-8 h-8 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
    </svg>
  ),

  video: (
    <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" clipRule="evenodd" />
    </svg>
  ),

  audio: (
    <svg className="w-8 h-8 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" clipRule="evenodd" />
    </svg>
  ),

  // Text and code
  text: (
    <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
    </svg>
  ),

  code: (
    <svg className="w-8 h-8 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  ),

  // Archive and compressed
  archive: (
    <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
      <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
      <path fillRule="evenodd" d="M3 8a2 2 0 012-2v9a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" clipRule="evenodd" />
    </svg>
  ),

  // Default file
  file: (
    <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
    </svg>
  ),
};

/**
 * Enhanced file type detection with more specific categories
 */
export function getDetailedFileType(mimeType: string, fileName?: string): string {
  const extension = fileName ? fileName.split('.').pop()?.toLowerCase() : '';
  
  // Check by MIME type first
  if (mimeType.startsWith('image/')) {
    if (mimeType.includes('svg')) return 'svg';
    if (mimeType.includes('gif')) return 'gif';
    return 'image';
  }
  
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  
  // Document types
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('document') || mimeType.includes('word')) return 'document';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
  
  // Google Workspace files
  if (mimeType === 'application/vnd.google-apps.document') return 'document';
  if (mimeType === 'application/vnd.google-apps.spreadsheet') return 'spreadsheet';
  if (mimeType === 'application/vnd.google-apps.presentation') return 'presentation';
  if (mimeType === 'application/vnd.google-apps.drawing') return 'image';
  
  // Text and code files
  if (mimeType.startsWith('text/')) {
    if (extension && ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json', 'xml'].includes(extension)) {
      return 'code';
    }
    return 'text';
  }
  
  // Archive files
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') || mimeType.includes('gzip')) {
    return 'archive';
  }
  
  // Check by file extension if MIME type is generic
  if (extension) {
    const codeExtensions = ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'cs', 'php', 'rb', 'go', 'rs', 'swift'];
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
    const audioExtensions = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'];
    const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'];
    
    if (codeExtensions.includes(extension)) return 'code';
    if (imageExtensions.includes(extension)) return 'image';
    if (videoExtensions.includes(extension)) return 'video';
    if (audioExtensions.includes(extension)) return 'audio';
    if (archiveExtensions.includes(extension)) return 'archive';
    if (extension === 'pdf') return 'pdf';
  }
  
  return 'file';
}

/**
 * Get the appropriate icon component for a file type
 */
export function getFileTypeIcon(mimeType: string, fileName?: string): ReactNode {
  const fileType = getDetailedFileType(mimeType, fileName);
  
  return FileTypeIcons[fileType as keyof typeof FileTypeIcons] || FileTypeIcons.file;
}

/**
 * Get file type display name
 */
export function getFileTypeDisplayName(mimeType: string, fileName?: string): string {
  const fileType = getDetailedFileType(mimeType, fileName);
  
  const displayNames: Record<string, string> = {
    pdf: 'PDF Document',
    document: 'Document',
    spreadsheet: 'Spreadsheet',
    presentation: 'Presentation',
    image: 'Image',
    video: 'Video',
    audio: 'Audio',
    text: 'Text File',
    code: 'Code File',
    archive: 'Archive',
    file: 'File',
  };
  
  return displayNames[fileType] || 'File';
}

/**
 * Check if file supports preview functionality
 */
export function supportsPreview(mimeType: string, fileName?: string): boolean {
  const fileType = getDetailedFileType(mimeType, fileName);
  
  // File types that can be previewed
  const previewableTypes = ['pdf', 'image', 'text', 'document', 'spreadsheet', 'presentation', 'video'];
  
  return previewableTypes.includes(fileType);
}

/**
 * Get preview URL for supported file types
 */
export function getPreviewUrl(fileId: string, mimeType: string, fileName?: string): string | null {
  if (!supportsPreview(mimeType, fileName)) {
    return null;
  }
  
  // Use Google Drive's preview functionality
  return `https://drive.google.com/file/d/${fileId}/preview`;
}