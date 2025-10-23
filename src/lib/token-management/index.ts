/**
 * Token Management Infrastructure
 * 
 * Core token validation, refresh, and utility functions for Google OAuth token management
 */

// Export TokenValidator class and types
export {
  TokenValidator,
  tokenValidator,
  type TokenValidationResult,
  type JWTPayload
} from '../token-validator';

// Export TokenRefresher class and types
export {
  TokenRefresher,
  tokenRefresher,
  type RefreshResult,
  type TokenPair
} from './token-refresher';

// Export TokenManager class and types
export {
  TokenManager,
  tokenManager,
  type TokenCacheEntry,
  type TokenManagerOptions
} from './token-manager';

// Export ApiRequestInterceptor class and types
export {
  ApiRequestInterceptor,
  apiRequestInterceptor,
  type GoogleApiCallContext,
  type ApiError
} from './api-request-interceptor';

// Export token utility functions and types
export {
  safeExtractJWTPayload,
  safeExtractClaim,
  extractTokenInfo,
  isValidJWTFormat,
  getTimeUntilExpiry,
  formatTokenExpiry,
  type SafeJWTResult,
  type TokenInfo
} from '../token-utils';

// Re-export for convenience
export * from '../token-validator';
export * from './token-refresher';
export * from './token-manager';
export * from './api-request-interceptor';
export * from '../token-utils';