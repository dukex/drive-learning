/**
 * TokenRefresher - Google OAuth token refresh service
 * 
 * Handles automatic refresh of Google OAuth access tokens using stored refresh tokens.
 * Integrates with Better Auth database for token storage and uses googleapis library
 * for reliable OAuth token management.
 */

import { google } from 'googleapis';
import { getDatabase, handleDatabaseError } from '../database';

export interface RefreshResult {
    success: boolean;
    accessToken?: string;
    expiresIn?: number;
    error?: string;
    requiresReauth?: boolean;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    tokenType: 'Bearer';
}



export class TokenRefresher {
    private readonly MAX_RETRY_ATTEMPTS = 3;
    private readonly RETRY_DELAY_MS = 1000;

    /**
     * Refreshes an access token using the provided refresh token
     */
    async refreshAccessToken(refreshToken: string): Promise<RefreshResult> {
        if (!this.validateRefreshToken(refreshToken)) {
            return {
                success: false,
                error: 'Invalid refresh token format',
                requiresReauth: true
            };
        }

        let lastError: string = '';

        // Retry logic for network failures
        for (let attempt = 1; attempt <= this.MAX_RETRY_ATTEMPTS; attempt++) {
            try {
                const result = await this.performTokenRefresh(refreshToken);

                if (result.success) {
                    return result;
                }

                // If it's an auth error, don't retry
                if (result.requiresReauth) {
                    return result;
                }

                lastError = result.error || 'Unknown error';

                // Wait before retrying (exponential backoff)
                if (attempt < this.MAX_RETRY_ATTEMPTS) {
                    await this.delay(this.RETRY_DELAY_MS * Math.pow(2, attempt - 1));
                }

            } catch (error) {
                lastError = error instanceof Error ? error.message : 'Network error during token refresh';

                // Wait before retrying
                if (attempt < this.MAX_RETRY_ATTEMPTS) {
                    await this.delay(this.RETRY_DELAY_MS * Math.pow(2, attempt - 1));
                }
            }
        }

        return {
            success: false,
            error: `Token refresh failed after ${this.MAX_RETRY_ATTEMPTS} attempts: ${lastError}`
        };
    }

    /**
     * Performs the actual token refresh using googleapis OAuth2 client
     */
    private async performTokenRefresh(refreshToken: string): Promise<RefreshResult> {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            return {
                success: false,
                error: 'Google OAuth credentials not configured',
                requiresReauth: true
            };
        }

        try {
            // Create OAuth2 client with credentials
            const oauth2Client = new google.auth.OAuth2(
                clientId,
                clientSecret
            );

            // Set the refresh token
            oauth2Client.setCredentials({
                refresh_token: refreshToken
            });

            // Refresh the access token
            const { credentials } = await oauth2Client.refreshAccessToken();

            if (!credentials.access_token || !credentials.expiry_date) {
                return {
                    success: false,
                    error: 'Invalid response from Google OAuth service: missing required fields'
                };
            }

            // Calculate expires_in from expiry_date
            const expiresIn = Math.floor((credentials.expiry_date - Date.now()) / 1000);

            return {
                success: true,
                accessToken: credentials.access_token,
                expiresIn: expiresIn
            };

        } catch (error: any) {
            return this.handleGoogleAuthError(error);
        }
    }

    /**
     * Handles errors from googleapis OAuth2 client
     */
    private handleGoogleAuthError(error: any): RefreshResult {
        // Handle googleapis specific errors
        if (error.code) {
            switch (error.code) {
                case 400:
                    if (error.message?.includes('invalid_grant')) {
                        return {
                            success: false,
                            error: 'Refresh token is expired or invalid',
                            requiresReauth: true
                        };
                    }
                    return {
                        success: false,
                        error: 'Invalid refresh request',
                        requiresReauth: true
                    };

                case 401:
                    return {
                        success: false,
                        error: 'Invalid OAuth client configuration',
                        requiresReauth: true
                    };

                case 403:
                    return {
                        success: false,
                        error: 'OAuth client not authorized for token refresh',
                        requiresReauth: true
                    };

                case 429:
                    return {
                        success: false,
                        error: 'Rate limited by Google OAuth service'
                    };

                case 500:
                case 502:
                case 503:
                case 504:
                    return {
                        success: false,
                        error: 'Google OAuth service temporarily unavailable'
                    };

                default:
                    return {
                        success: false,
                        error: `OAuth error: ${error.message || 'Unknown error'}`,
                        requiresReauth: error.code === 400 || error.code === 401
                    };
            }
        }

        // Handle network errors
        if (error.message?.includes('ENOTFOUND') || error.message?.includes('ECONNREFUSED')) {
            return {
                success: false,
                error: 'Network error: Unable to connect to Google OAuth service'
            };
        }

        return {
            success: false,
            error: error.message || 'Unknown error during token refresh'
        };
    }

    /**
     * Updates stored tokens in Better Auth database
     */
    async updateStoredTokens(userId: string, tokens: TokenPair): Promise<void> {
        if (!userId || !tokens.accessToken || !tokens.refreshToken) {
            throw new Error('Invalid parameters for token update');
        }

        const db = getDatabase();

        try {
            // Calculate expiry timestamp
            const expiresAt = Math.floor(tokens.expiresAt.getTime() / 1000);

            // Update the account record with new tokens
            const updateQuery = db.prepare(`
        UPDATE account 
        SET accessToken = ?, expiresAt = ?, updatedAt = ?
        WHERE userId = ? AND providerId = 'google'
      `);

            const result = updateQuery.run(
                tokens.accessToken,
                expiresAt,
                Math.floor(Date.now() / 1000),
                userId
            );

            if (result.changes === 0) {
                throw new Error(`No Google account found for user ${userId}`);
            }

        } catch (error) {
            throw handleDatabaseError(error);
        } finally {
            db.close();
        }
    }

    /**
     * Validates refresh token format
     */
    validateRefreshToken(refreshToken: string): boolean {
        if (!refreshToken || typeof refreshToken !== 'string') {
            return false;
        }

        // Google refresh tokens are typically 100+ characters and contain specific patterns
        const minLength = 50;
        const maxLength = 512;

        if (refreshToken.length < minLength || refreshToken.length > maxLength) {
            return false;
        }

        // Google refresh tokens contain alphanumeric characters, hyphens, underscores, and slashes
        const validPattern = /^[A-Za-z0-9\-_\/\.]+$/;
        return validPattern.test(refreshToken);
    }



    /**
     * Retrieves stored refresh token for a user
     */
    async getStoredRefreshToken(userId: string): Promise<string | null> {
        if (!userId) {
            throw new Error('User ID is required');
        }

        const db = getDatabase();

        try {
            const query = db.prepare(`
        SELECT refreshToken 
        FROM account 
        WHERE userId = ? AND providerId = 'google'
      `);

            const result = query.get(userId) as { refreshToken: string } | undefined;
            return result?.refreshToken || null;

        } catch (error) {
            throw handleDatabaseError(error);
        } finally {
            db.close();
        }
    }

    /**
     * Clears stored tokens for a user (used when refresh fails)
     */
    async clearStoredTokens(userId: string): Promise<void> {
        if (!userId) {
            throw new Error('User ID is required');
        }

        const db = getDatabase();

        try {
            const updateQuery = db.prepare(`
        UPDATE account 
        SET accessToken = NULL, expiresAt = NULL, updatedAt = ?
        WHERE userId = ? AND providerId = 'google'
      `);

            updateQuery.run(
                Math.floor(Date.now() / 1000),
                userId
            );

        } catch (error) {
            throw handleDatabaseError(error);
        } finally {
            db.close();
        }
    }

    /**
     * Utility function for delays in retry logic
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Gets current stored access token for a user
     */
    async getStoredAccessToken(userId: string): Promise<string | null> {
        if (!userId) {
            throw new Error('User ID is required');
        }

        const db = getDatabase();

        try {
            const query = db.prepare(`
        SELECT accessToken, expiresAt 
        FROM account 
        WHERE userId = ? AND providerId = 'google'
      `);

            const result = query.get(userId) as { accessToken: string; expiresAt: number } | undefined;

            if (!result?.accessToken) {
                return null;
            }

            // Check if token is expired
            if (result.expiresAt && result.expiresAt * 1000 <= Date.now()) {
                return null;
            }

            return result.accessToken;

        } catch (error) {
            throw handleDatabaseError(error);
        } finally {
            db.close();
        }
    }

    /**
     * Refreshes token for a specific user using their stored refresh token
     */
    async refreshUserToken(userId: string): Promise<RefreshResult> {
        try {
            const refreshToken = await this.getStoredRefreshToken(userId);

            if (!refreshToken) {
                return {
                    success: false,
                    error: 'No refresh token found for user',
                    requiresReauth: true
                };
            }

            const refreshResult = await this.refreshAccessToken(refreshToken);

            if (refreshResult.success && refreshResult.accessToken && refreshResult.expiresIn) {
                // Calculate expiry date
                const expiresAt = new Date(Date.now() + (refreshResult.expiresIn * 1000));

                // Update stored tokens
                await this.updateStoredTokens(userId, {
                    accessToken: refreshResult.accessToken,
                    refreshToken: refreshToken, // Keep the same refresh token
                    expiresAt,
                    tokenType: 'Bearer'
                });
            }

            return refreshResult;

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error during user token refresh'
            };
        }
    }
}

// Export singleton instance for convenience
export const tokenRefresher = new TokenRefresher();