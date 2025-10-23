/**
 * ApiRequestInterceptor - API request interception and retry mechanism
 * 
 * Handles 401 authentication errors by automatically refreshing tokens and retrying requests.
 * Implements single retry limitation to prevent infinite loops and proper error propagation
 * for non-authentication errors. Designed to work with googleapis library.
 */

import { google } from 'googleapis';
import { TokenManager } from './token-manager';

export interface GoogleApiCallContext {
    userId: string;
    retryCount: number;
    operationName: string;
}

export interface ApiError extends Error {
    status?: number;
    code?: number;
    response?: {
        status: number;
        data?: any;
    };
}

export class ApiRequestInterceptor {
    private readonly tokenManager: TokenManager;
    private readonly MAX_RETRY_COUNT = 1; // Single retry limitation

    constructor(tokenManager: TokenManager) {
        this.tokenManager = tokenManager;
    }

    /**
     * Wraps googleapis calls with automatic token refresh and retry
     * This is the main method for intercepting googleapis API calls
     */
    async interceptGoogleApiCall<T>(
        apiCall: (auth: any) => Promise<T>,
        userId: string,
        operationName: string = 'API call'
    ): Promise<T> {
        const context: GoogleApiCallContext = {
            userId,
            retryCount: 0,
            operationName
        };

        return await this.executeWithRetry(apiCall, context);
    }

    /**
     * Executes the API call with retry logic for authentication errors
     */
    private async executeWithRetry<T>(
        apiCall: (auth: any) => Promise<T>,
        context: GoogleApiCallContext
    ): Promise<T> {
        try {
            // Get a valid access token
            const accessToken = await this.tokenManager.getValidAccessToken(context.userId);

            // Create OAuth2 client with the access token
            const auth = this.createAuthClient(accessToken);

            // Execute the API call
            return await apiCall(auth);

        } catch (error) {
            // Check if it's a 401 authentication error and we haven't retried yet
            if (this.isAuthenticationError(error) && context.retryCount === 0) {
                return await this.handleAuthenticationError(error as ApiError, apiCall, context);
            }

            // For non-authentication errors or already retried requests, propagate the error
            throw error;
        }
    }

    /**
     * Handles authentication errors by refreshing token and retrying request
     */
    private async handleAuthenticationError<T>(
        error: ApiError,
        apiCall: (auth: any) => Promise<T>,
        context: GoogleApiCallContext
    ): Promise<T> {
        try {
            // Attempt to get a fresh access token
            const newToken = await this.tokenManager.handleApiError(error, context.userId);

            // Create new context with incremented retry count
            const retryContext: GoogleApiCallContext = {
                ...context,
                retryCount: context.retryCount + 1
            };

            // Retry the request with the new token
            return await this.retryWithNewToken(apiCall, retryContext, newToken);

        } catch (refreshError) {
            // If token refresh fails, propagate the original authentication error
            throw error;
        }
    }

    /**
     * Retries the API call with a new access token
     */
    private async retryWithNewToken<T>(
        apiCall: (auth: any) => Promise<T>,
        context: GoogleApiCallContext,
        newToken: string
    ): Promise<T> {
        if (context.retryCount > this.MAX_RETRY_COUNT) {
            throw new Error(`Maximum retry attempts exceeded for ${context.operationName}`);
        }

        try {
            // Create OAuth2 client with the new access token
            const auth = this.createAuthClient(newToken);

            // Execute the API call with the new token
            return await apiCall(auth);

        } catch (error) {
            // If retry fails, don't attempt another retry - propagate the error
            throw error;
        }
    }

    /**
     * Creates an OAuth2 client with the provided access token
     */
    private createAuthClient(accessToken: string): any {
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: accessToken });
        return auth;
    }

    /**
     * Checks if an error is a 401 authentication error
     */
    private isAuthenticationError(error: any): boolean {
        return (
            error?.status === 401 ||
            error?.code === 401 ||
            error?.response?.status === 401 ||
            (error?.message && error.message.includes('401')) ||
            (error?.message && error.message.toLowerCase().includes('unauthorized')) ||
            (error?.message && error.message.toLowerCase().includes('invalid credentials'))
        );
    }

    /**
     * Creates a wrapper function for googleapis service methods
     * This allows easy integration with existing GoogleDriveService methods
     */
    createServiceWrapper<T extends Record<string, any>>(
        serviceFactory: (auth: any) => T,
        userId: string
    ): T {
        const interceptor = this;

        return new Proxy({} as T, {
            get(target, prop: string | symbol) {
                if (typeof prop !== 'string') {
                    return undefined;
                }

                return function (...args: any[]) {
                    return interceptor.interceptGoogleApiCall(
                        (auth) => {
                            const service = serviceFactory(auth);
                            const method = service[prop];
                            if (typeof method === 'function') {
                                return method.apply(service, args);
                            }
                            throw new Error(`Method ${prop} not found on service`);
                        },
                        userId,
                        `${serviceFactory.name || 'service'}.${prop}`
                    );
                };
            }
        });
    }

    /**
     * Wraps a googleapis drive service with automatic token management
     */
    wrapDriveService(userId: string): any {
        return this.createServiceWrapper(
            (auth) => google.drive({ version: 'v3', auth }),
            userId
        );
    }

    /**
     * Legacy method for backward compatibility
     * Wraps individual googleapis calls with automatic token refresh and retry
     */
    async wrapGoogleApiCall<T>(
        apiCall: () => Promise<T>,
        userId: string,
        operationName: string = 'API call'
    ): Promise<T> {
        const context: GoogleApiCallContext = {
            userId,
            retryCount: 0,
            operationName
        };

        try {
            return await apiCall();
        } catch (error) {
            if (this.isAuthenticationError(error) && context.retryCount === 0) {
                try {
                    // Get fresh token
                    const newToken = await this.tokenManager.handleApiError(error, userId);

                    // The calling code needs to be modified to use the new token
                    // This is a limitation of this approach - the caller must handle token updates
                    throw new Error(
                        `Authentication error: Token refreshed but caller must retry with new token. ` +
                        `Use interceptGoogleApiCall method instead for automatic retry.`
                    );

                } catch (refreshError) {
                    // If refresh fails, propagate original error
                    throw error;
                }
            }

            // For non-authentication errors, propagate as-is
            throw error;
        }
    }
}

// Export singleton instance for convenience
// Note: The singleton is created lazily to avoid circular dependencies
let _apiRequestInterceptor: ApiRequestInterceptor | null = null;

export function getApiRequestInterceptor(): ApiRequestInterceptor {
    if (!_apiRequestInterceptor) {
        const { tokenManager } = require('./token-manager');
        _apiRequestInterceptor = new ApiRequestInterceptor(tokenManager);
    }
    return _apiRequestInterceptor;
}

export const apiRequestInterceptor = getApiRequestInterceptor();