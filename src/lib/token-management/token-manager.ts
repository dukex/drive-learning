/**
 * TokenManager - Token management orchestration layer
 * 
 * Coordinates token validation, refresh operations, and caching for optimal performance.
 * Provides the main interface for getting valid access tokens with automatic refresh.
 */

import { TokenValidator, tokenValidator, type TokenValidationResult } from '../token-validator';
import { TokenRefresher, tokenRefresher, type RefreshResult } from './token-refresher';
import { getDatabase, handleDatabaseError } from '../database';

export interface TokenCacheEntry {
  userId: string;
  accessToken: string;
  expiresAt: Date;
  lastValidated: Date;
}

export interface TokenManagerOptions {
  cacheEnabled?: boolean;
  cacheTtlMinutes?: number;
  proactiveRefreshMinutes?: number;
}

export class TokenManager {
  private tokenCache = new Map<string, TokenCacheEntry>();
  private readonly validator: TokenValidator;
  private readonly refresher: TokenRefresher;
  
  // Configuration options
  private readonly cacheEnabled: boolean;
  private readonly cacheTtlMinutes: number;
  private readonly proactiveRefreshMinutes: number;
  
  // Cache cleanup interval
  private cacheCleanupInterval?: NodeJS.Timeout;

  constructor(options: TokenManagerOptions = {}) {
    this.validator = tokenValidator;
    this.refresher = tokenRefresher;
    
    // Set configuration with defaults
    this.cacheEnabled = options.cacheEnabled ?? true;
    this.cacheTtlMinutes = options.cacheTtlMinutes ?? 30;
    this.proactiveRefreshMinutes = options.proactiveRefreshMinutes ?? 5;
    
    // Start cache cleanup if caching is enabled
    if (this.cacheEnabled) {
      this.startCacheCleanup();
    }
  }

  /**
   * Gets a valid access token for the user, refreshing if necessary
   * This is the main method that orchestrates all token operations
   */
  async getValidAccessToken(userId: string): Promise<string> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      // 1. Check cache first if enabled
      if (this.cacheEnabled) {
        const cachedToken = this.getCachedToken(userId);
        if (cachedToken) {
          // Validate cached token
          const validation = this.validator.validateToken(cachedToken.accessToken, this.proactiveRefreshMinutes);
          
          if (validation.isValid && !validation.isExpiringSoon) {
            return cachedToken.accessToken;
          }
          
          // Remove expired/expiring token from cache
          this.removeCachedToken(userId);
        }
      }

      // 2. Get stored token from database
      const storedToken = await this.refresher.getStoredAccessToken(userId);
      
      if (storedToken) {
        // Validate stored token
        const validation = this.validator.validateToken(storedToken, this.proactiveRefreshMinutes);
        
        if (validation.isValid && !validation.isExpiringSoon) {
          // Token is valid, cache it and return
          if (this.cacheEnabled && validation.expiresAt) {
            this.setCachedToken(userId, storedToken, validation.expiresAt);
          }
          return storedToken;
        }
      }

      // 3. Token is expired or expiring soon, refresh it
      const refreshResult = await this.refreshTokenIfNeeded(userId);
      
      if (!refreshResult) {
        throw new Error('Failed to refresh token - no valid token available');
      }

      return refreshResult;

    } catch (error) {
      // Clear any cached token on error
      if (this.cacheEnabled) {
        this.removeCachedToken(userId);
      }
      
      throw new Error(`Failed to get valid access token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Refreshes token if needed and returns the new access token
   */
  async refreshTokenIfNeeded(userId: string): Promise<string | null> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      const refreshResult = await this.refresher.refreshUserToken(userId);
      
      if (!refreshResult.success) {
        // Handle refresh failure
        await this.handleRefreshFailure(userId, refreshResult);
        return null;
      }

      if (!refreshResult.accessToken) {
        throw new Error('Refresh succeeded but no access token returned');
      }

      // Cache the new token if caching is enabled
      if (this.cacheEnabled && refreshResult.expiresIn) {
        const expiresAt = new Date(Date.now() + (refreshResult.expiresIn * 1000));
        this.setCachedToken(userId, refreshResult.accessToken, expiresAt);
      }

      return refreshResult.accessToken;

    } catch (error) {
      throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handles API errors and attempts token refresh if it's an authentication error
   */
  async handleApiError(error: any, userId: string): Promise<string> {
    if (!userId) {
      throw new Error('User ID is required for error handling');
    }

    // Check if it's a 401 authentication error
    const is401Error = error?.status === 401 || 
                      error?.response?.status === 401 || 
                      error?.code === 401 ||
                      (error?.message && error.message.includes('401'));

    if (!is401Error) {
      // Not an authentication error, re-throw
      throw error;
    }

    try {
      // Clear any cached token since it's invalid
      if (this.cacheEnabled) {
        this.removeCachedToken(userId);
      }

      // Attempt to refresh the token
      const newToken = await this.refreshTokenIfNeeded(userId);
      
      if (!newToken) {
        throw new Error('Unable to refresh token after 401 error');
      }

      return newToken;

    } catch (refreshError) {
      // If refresh fails, clear stored tokens and re-throw original error
      await this.clearInvalidTokens(userId);
      throw error;
    }
  }

  /**
   * Clears invalid tokens from both cache and database
   */
  async clearInvalidTokens(userId: string): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required');
    }

    try {
      // Clear from cache
      if (this.cacheEnabled) {
        this.removeCachedToken(userId);
      }

      // Clear from database
      await this.refresher.clearStoredTokens(userId);

    } catch (error) {
      throw new Error(`Failed to clear invalid tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validates if a token is still valid and not expiring soon
   */
  isTokenValid(token: string): boolean {
    const validation = this.validator.validateToken(token, this.proactiveRefreshMinutes);
    return validation.isValid && !validation.isExpiringSoon;
  }

  /**
   * Gets token validation details
   */
  validateToken(token: string): TokenValidationResult {
    return this.validator.validateToken(token, this.proactiveRefreshMinutes);
  }

  // Cache management methods

  /**
   * Gets cached token for user if valid
   */
  private getCachedToken(userId: string): TokenCacheEntry | null {
    if (!this.cacheEnabled) {
      return null;
    }

    const cached = this.tokenCache.get(userId);
    if (!cached) {
      return null;
    }

    // Check if cache entry is still valid
    const now = new Date();
    const cacheExpiry = new Date(cached.lastValidated.getTime() + (this.cacheTtlMinutes * 60 * 1000));
    
    if (now > cacheExpiry || now >= cached.expiresAt) {
      this.tokenCache.delete(userId);
      return null;
    }

    return cached;
  }

  /**
   * Sets cached token for user
   */
  private setCachedToken(userId: string, accessToken: string, expiresAt: Date): void {
    if (!this.cacheEnabled) {
      return;
    }

    this.tokenCache.set(userId, {
      userId,
      accessToken,
      expiresAt,
      lastValidated: new Date()
    });
  }

  /**
   * Removes cached token for user
   */
  private removeCachedToken(userId: string): void {
    if (this.cacheEnabled) {
      this.tokenCache.delete(userId);
    }
  }

  /**
   * Clears all cached tokens
   */
  clearCache(): void {
    if (this.cacheEnabled) {
      this.tokenCache.clear();
    }
  }

  /**
   * Gets cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    if (!this.cacheEnabled) {
      return { size: 0, entries: [] };
    }

    return {
      size: this.tokenCache.size,
      entries: Array.from(this.tokenCache.keys())
    };
  }

  /**
   * Starts periodic cache cleanup
   */
  private startCacheCleanup(): void {
    if (this.cacheCleanupInterval) {
      return; // Already started
    }

    // Run cleanup every 10 minutes
    this.cacheCleanupInterval = setInterval(() => {
      this.cleanupExpiredCacheEntries();
    }, 10 * 60 * 1000);
  }

  /**
   * Stops periodic cache cleanup
   */
  stopCacheCleanup(): void {
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
      this.cacheCleanupInterval = undefined;
    }
  }

  /**
   * Removes expired entries from cache
   */
  private cleanupExpiredCacheEntries(): void {
    if (!this.cacheEnabled) {
      return;
    }

    const now = new Date();
    const expiredKeys: string[] = [];

    for (const [userId, entry] of this.tokenCache.entries()) {
      const cacheExpiry = new Date(entry.lastValidated.getTime() + (this.cacheTtlMinutes * 60 * 1000));
      
      if (now > cacheExpiry || now >= entry.expiresAt) {
        expiredKeys.push(userId);
      }
    }

    // Remove expired entries
    expiredKeys.forEach(key => this.tokenCache.delete(key));
  }

  /**
   * Handles refresh failure scenarios
   */
  private async handleRefreshFailure(userId: string, refreshResult: RefreshResult): Promise<void> {
    if (refreshResult.requiresReauth) {
      // Clear invalid tokens if re-authentication is required
      await this.clearInvalidTokens(userId);
    }

    // Log the error for debugging (in production, use proper logging)
    console.error(`Token refresh failed for user ${userId}:`, refreshResult.error);
  }

  /**
   * Cleanup method to call when shutting down
   */
  destroy(): void {
    this.stopCacheCleanup();
    this.clearCache();
  }

  /**
   * Proactively refreshes tokens that are expiring soon
   * This can be called periodically to maintain fresh tokens
   */
  async proactiveRefresh(userId: string): Promise<boolean> {
    if (!userId) {
      return false;
    }

    try {
      const storedToken = await this.refresher.getStoredAccessToken(userId);
      
      if (!storedToken) {
        return false; // No token to refresh
      }

      const validation = this.validator.validateToken(storedToken, this.proactiveRefreshMinutes);
      
      if (validation.isExpiringSoon && !validation.isExpired) {
        // Token is expiring soon but not expired, refresh it
        const newToken = await this.refreshTokenIfNeeded(userId);
        return newToken !== null;
      }

      return true; // Token is still valid
      
    } catch (error) {
      console.error(`Proactive refresh failed for user ${userId}:`, error);
      return false;
    }
  }
}

// Export singleton instance for convenience
export const tokenManager = new TokenManager();