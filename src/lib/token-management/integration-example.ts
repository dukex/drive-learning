/**
 * TokenManager Integration Example
 * 
 * Demonstrates how the TokenManager integrates with existing authentication flows
 * This shows how getUserSession can be enhanced to use automatic token refresh
 */

import { tokenManager } from './token-manager';
import { auth } from '../auth';
import { headers } from 'next/headers';

export interface UserSession {
    user: {
        id: string;
        email: string;
        name: string;
        image?: string | null;
    };
    accessToken: string;
    refreshToken?: string;
}

/**
 * Enhanced getUserSession that uses TokenManager for automatic token refresh
 * This replaces the existing getUserSession function in drive-auth-utils.ts
 */
export async function getUserSessionWithTokenManager(): Promise<UserSession | null> {
    try {
        // Get the basic session from Better Auth
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session?.user || !session?.session) {
            return null;
        }

        // Use TokenManager to get a valid access token (with automatic refresh)
        const accessToken = await tokenManager.getValidAccessToken(session.user.id);

        if (!accessToken) {
            throw new Error('No valid access token available. Please re-authenticate.');
        }

        // Get refresh token from database (for backward compatibility)
        const db = (auth as any).options.database;
        const accountQuery = db.prepare(`
      SELECT refreshToken 
      FROM account 
      WHERE userId = ? AND providerId = 'google'
      ORDER BY createdAt DESC 
      LIMIT 1
    `);

        const account = accountQuery.get(session.user.id);

        return {
            user: {
                id: session.user.id,
                email: session.user.email || '',
                name: session.user.name || '',
                image: session.user.image
            },
            accessToken, // This is now guaranteed to be valid and fresh
            refreshToken: account?.refreshToken
        };
    } catch (error) {
        console.error('Failed to get user session with token manager:', error);
        return null;
    }
}

/**
 * Example of how GoogleDriveService would be enhanced to use TokenManager
 * This shows the integration pattern for API services
 */
export class EnhancedGoogleDriveService {
    private userId: string;

    constructor(userId: string) {
        this.userId = userId;
    }

    /**
     * Example API method that uses TokenManager for automatic token handling
     */
    async listFolders(folderId: string): Promise<any[]> {
        try {
            // Get valid access token (automatically refreshed if needed)
            const accessToken = await tokenManager.getValidAccessToken(this.userId);

            // Make API request
            const response = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType='application/vnd.google-apps.folder'`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.files || [];

        } catch (error: any) {
            // Handle authentication errors with automatic token refresh
            if (error?.status === 401 || error?.response?.status === 401) {
                try {
                    // TokenManager will attempt to refresh the token and return a new one
                    const newAccessToken = await tokenManager.handleApiError(error, this.userId);

                    // Retry the request with the new token
                    const retryResponse = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType='application/vnd.google-apps.folder'`, {
                        headers: {
                            'Authorization': `Bearer ${newAccessToken}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!retryResponse.ok) {
                        throw new Error(`Retry request failed: ${retryResponse.status} ${retryResponse.statusText}`);
                    }

                    const retryData = await retryResponse.json();
                    return retryData.files || [];

                } catch (refreshError) {
                    // If token refresh fails, the user needs to re-authenticate
                    throw new Error('Authentication failed. Please sign in again.');
                }
            }

            // Re-throw non-authentication errors
            throw error;
        }
    }

    /**
     * Example of proactive token refresh before making API calls
     */
    async ensureValidToken(): Promise<string> {
        return await tokenManager.getValidAccessToken(this.userId);
    }

    /**
     * Example of handling token validation
     */
    async validateCurrentToken(): Promise<boolean> {
        try {
            const token = await tokenManager.getValidAccessToken(this.userId);
            return tokenManager.isTokenValid(token);
        } catch {
            return false;
        }
    }
}

/**
 * Example middleware function that ensures valid tokens for API routes
 */
export async function withTokenValidation(userId: string, handler: (accessToken: string) => Promise<any>) {
    try {
        // Ensure we have a valid access token
        const accessToken = await tokenManager.getValidAccessToken(userId);

        // Execute the handler with the valid token
        return await handler(accessToken);

    } catch (error: any) {
        // Handle token-related errors
        if (error.message?.includes('refresh')) {
            throw new Error('Authentication expired. Please sign in again.');
        }

        throw error;
    }
}

/**
 * Example of cache management for performance optimization
 */
export function getTokenCacheStats() {
    return tokenManager.getCacheStats();
}

export function clearTokenCache() {
    tokenManager.clearCache();
}

/**
 * Example of proactive token maintenance
 * This could be called periodically to keep tokens fresh
 */
export async function maintainUserTokens(userIds: string[]): Promise<{ success: string[]; failed: string[] }> {
    const results: { success: string[]; failed: string[] } = { success: [], failed: [] };

    for (const userId of userIds) {
        try {
            const refreshed = await tokenManager.proactiveRefresh(userId);
            if (refreshed) {
                results.success.push(userId);
            } else {
                results.failed.push(userId);
            }
        } catch (error) {
            results.failed.push(userId);
            console.error(`Failed to maintain token for user ${userId}:`, error);
        }
    }

    return results;
}

/**
 * Example of using ApiRequestInterceptor with googleapis
 * This shows how to integrate automatic token refresh with googleapis calls
 */
import { apiRequestInterceptor } from './api-request-interceptor';
import { google } from 'googleapis';

export class InterceptedGoogleDriveService {
    private userId: string;

    constructor(userId: string) {
        this.userId = userId;
    }

    /**
     * Example using the interceptor's wrapDriveService method
     */
    async listFoldersWithInterceptor(folderId: string): Promise<any[]> {
        // Get a wrapped drive service that automatically handles token refresh
        const drive = apiRequestInterceptor.wrapDriveService(this.userId);

        try {
            const response = await drive.files.list({
                q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                fields: 'files(id,name,mimeType,modifiedTime,webViewLink)',
                orderBy: 'name',
                includeItemsFromAllDrives: true,
                supportsAllDrives: true
            });

            return response.data.files || [];
        } catch (error) {
            console.error('Failed to list folders:', error);
            throw error;
        }
    }

    /**
     * Example using the interceptor's interceptGoogleApiCall method
     */
    async getFileMetadataWithInterceptor(fileId: string): Promise<any> {
        return await apiRequestInterceptor.interceptGoogleApiCall(
            (auth) => {
                const drive = google.drive({ version: 'v3', auth });
                return drive.files.get({
                    fileId: fileId,
                    fields: 'id,name,description,modifiedTime,webViewLink',
                    supportsAllDrives: true
                });
            },
            this.userId,
            'getFileMetadata'
        );
    }

    /**
     * Example of handling multiple API calls with automatic retry
     */
    async getFolderContentsWithInterceptor(folderId: string): Promise<{ folders: any[]; files: any[] }> {
        try {
            // Both calls will automatically handle token refresh if needed
            const [foldersResponse, filesResponse] = await Promise.all([
                apiRequestInterceptor.interceptGoogleApiCall(
                    (auth) => {
                        const drive = google.drive({ version: 'v3', auth });
                        return drive.files.list({
                            q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                            fields: 'files(id,name,mimeType,modifiedTime,webViewLink)',
                            orderBy: 'name'
                        });
                    },
                    this.userId,
                    'listFolders'
                ),
                apiRequestInterceptor.interceptGoogleApiCall(
                    (auth) => {
                        const drive = google.drive({ version: 'v3', auth });
                        return drive.files.list({
                            q: `'${folderId}' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false`,
                            fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink,webContentLink)',
                            orderBy: 'name'
                        });
                    },
                    this.userId,
                    'listFiles'
                )
            ]);

            return {
                folders: foldersResponse.data.files || [],
                files: filesResponse.data.files || []
            };
        } catch (error) {
            console.error('Failed to get folder contents:', error);
            throw error;
        }
    }
}