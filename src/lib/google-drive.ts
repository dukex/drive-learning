import { google } from 'googleapis';
import { TokenManager, ApiRequestInterceptor } from './token-management';

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
  private userId: string;
  private tokenManager: TokenManager;
  private apiInterceptor: ApiRequestInterceptor;

  constructor(userId: string) {
    this.userId = userId;
    this.tokenManager = new TokenManager();
    this.apiInterceptor = new ApiRequestInterceptor(this.tokenManager);
  }

  /**
   * List folders within a parent folder
   */
  async listFolders(folderId: string): Promise<DriveFolder[]> {
    const response = await this.apiInterceptor.interceptGoogleApiCall(
      (auth) => {
        const drive = google.drive({ version: 'v3', auth });
        return drive.files.list({
          q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
          fields: 'files(id,name,mimeType,modifiedTime,webViewLink)',
          orderBy: 'name',
          includeItemsFromAllDrives: true,
          supportsAllDrives: true
        });
      },
      this.userId,
      'listFolders'
    );

    return (response.data.files || []).map(file => ({
      id: file.id || '',
      name: file.name || '',
      mimeType: file.mimeType || '',
      modifiedTime: file.modifiedTime || '',
      webViewLink: file.webViewLink || ''
    }));
  }

  /**
   * List files within a folder (excluding subfolders)
   */
  async listFiles(folderId: string): Promise<DriveFile[]> {
    const response = await this.apiInterceptor.interceptGoogleApiCall(
      (auth) => {
        const drive = google.drive({ version: 'v3', auth });
        return drive.files.list({
          q: `'${folderId}' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false`,
          fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink,webContentLink,thumbnailLink)',
          orderBy: 'name',
          includeItemsFromAllDrives: true,
          supportsAllDrives: true
        });
      },
      this.userId,
      'listFiles'
    );

    return (response.data.files || []).map(file => ({
      id: file.id || '',
      name: file.name || '',
      mimeType: file.mimeType || '',
      size: file.size || undefined,
      modifiedTime: file.modifiedTime || '',
      webViewLink: file.webViewLink || '',
      webContentLink: file.webContentLink || undefined,
      thumbnailLink: file.thumbnailLink || undefined
    }));
  }

  /**
   * Get metadata for a specific folder
   */
  async getFolderMetadata(folderId: string): Promise<FolderMetadata> {
    const response = await this.apiInterceptor.interceptGoogleApiCall(
      (auth) => {
        const drive = google.drive({ version: 'v3', auth });
        return drive.files.get({
          fileId: folderId,
          fields: 'id,name,description,modifiedTime,webViewLink',
          supportsAllDrives: true
        });
      },
      this.userId,
      'getFolderMetadata'
    );

    const file = response.data;
    return {
      id: file.id || '',
      name: file.name || '',
      description: file.description || undefined,
      modifiedTime: file.modifiedTime || '',
      webViewLink: file.webViewLink || ''
    };
  }

  /**
   * Get download URL for a file
   */
  async getFileDownloadUrl(fileId: string): Promise<string> {
    const response = await this.apiInterceptor.interceptGoogleApiCall(
      (auth) => {
        const drive = google.drive({ version: 'v3', auth });
        return drive.files.get({
          fileId: fileId,
          fields: 'webContentLink',
          supportsAllDrives: true
        });
      },
      this.userId,
      'getFileDownloadUrl'
    );

    return response.data.webContentLink || '';
  }

  /**
   * Get the current user ID
   */
  getUserId(): string {
    return this.userId;
  }
}