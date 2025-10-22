import { google } from 'googleapis';

export interface DriveFolder {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  webViewLink: string;
  webContentLink?: string;
  thumbnailLink?: string;
}

export interface FolderMetadata {
  id: string;
  name: string;
  description?: string;
  modifiedTime: string;
  webViewLink: string;
}

export class GoogleDriveService {
  private drive: any;

  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    
    this.drive = google.drive({ version: 'v3', auth });
  }

  /**
   * List folders within a parent folder
   */
  async listFolders(folderId: string): Promise<DriveFolder[]> {
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id,name,mimeType,modifiedTime,webViewLink)',
        orderBy: 'name'
      });

      return response.data.files || [];
    } catch (error) {
      this.handleApiError(error, 'listing folders');
      throw error;
    }
  }

  /**
   * List files within a folder (excluding subfolders)
   */
  async listFiles(folderId: string): Promise<DriveFile[]> {
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink,webContentLink,thumbnailLink)',
        orderBy: 'name'
      });

      return response.data.files || [];
    } catch (error) {
      this.handleApiError(error, 'listing files');
      throw error;
    }
  }

  /**
   * Get metadata for a specific folder
   */
  async getFolderMetadata(folderId: string): Promise<FolderMetadata> {
    try {
      const response = await this.drive.files.get({
        fileId: folderId,
        fields: 'id,name,description,modifiedTime,webViewLink'
      });

      return response.data;
    } catch (error) {
      this.handleApiError(error, 'getting folder metadata');
      throw error;
    }
  }

  /**
   * Get download URL for a file
   */
  async getFileDownloadUrl(fileId: string): Promise<string> {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'webContentLink'
      });

      return response.data.webContentLink || '';
    } catch (error) {
      this.handleApiError(error, 'getting file download URL');
      throw error;
    }
  }

  /**
   * Handle API errors with proper error messages and rate limiting
   */
  private handleApiError(error: any, operation: string): void {
    console.error(`Google Drive API error during ${operation}:`, error);

    if (error.code === 401) {
      throw new Error('Authentication failed. Please log in again.');
    } else if (error.code === 403) {
      if (error.message?.includes('rate')) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else {
        throw new Error('Insufficient permissions to access this content.');
      }
    } else if (error.code === 404) {
      throw new Error('The requested folder or file was not found.');
    } else if (error.code === 429) {
      throw new Error('Too many requests. Please try again later.');
    } else {
      throw new Error(`Failed to ${operation}. Please try again.`);
    }
  }
}