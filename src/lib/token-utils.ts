/**
 * Token utility functions for safe JWT operations and token management
 */

import { JWTPayload } from './token-validator';

export interface SafeJWTResult<T = any> {
  success: boolean;
  payload?: T;
  error?: string;
}

export interface TokenInfo {
  isValid: boolean;
  expiresAt: Date | null;
  issuedAt: Date | null;
  subject: string | null;
  audience: string | null;
  issuer: string | null;
}

/**
 * Safely extracts JWT payload without throwing errors
 */
export function safeExtractJWTPayload(token: string): SafeJWTResult<JWTPayload> {
  try {
    if (!token || typeof token !== 'string') {
      return {
        success: false,
        error: 'Invalid token: must be a non-empty string'
      };
    }

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace(/^Bearer\s+/i, '');

    // Validate JWT structure
    const parts = cleanToken.split('.');
    if (parts.length !== 3) {
      return {
        success: false,
        error: 'Invalid JWT format: must have 3 parts'
      };
    }

    // Decode payload
    const payload = parts[1];
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decodedPayload = base64UrlDecode(paddedPayload);
    
    if (!decodedPayload.success || !decodedPayload.data) {
      return {
        success: false,
        error: decodedPayload.error || 'Failed to decode payload'
      };
    }

    const parsedPayload = JSON.parse(decodedPayload.data);

    // Validate required claims
    if (typeof parsedPayload.exp !== 'number') {
      return {
        success: false,
        error: 'Invalid JWT: missing or invalid exp claim'
      };
    }

    return {
      success: true,
      payload: parsedPayload as JWTPayload
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during JWT extraction'
    };
  }
}

/**
 * Safely extracts specific claim from JWT token
 */
export function safeExtractClaim<T = any>(token: string, claimName: string): SafeJWTResult<T> {
  const result = safeExtractJWTPayload(token);
  
  if (!result.success || !result.payload) {
    return {
      success: false,
      error: result.error
    };
  }

  const claimValue = result.payload[claimName];
  
  if (claimValue === undefined) {
    return {
      success: false,
      error: `Claim '${claimName}' not found in token`
    };
  }

  return {
    success: true,
    payload: claimValue as T
  };
}

/**
 * Extracts comprehensive token information safely
 */
export function extractTokenInfo(token: string): TokenInfo {
  const result = safeExtractJWTPayload(token);
  
  if (!result.success || !result.payload) {
    return {
      isValid: false,
      expiresAt: null,
      issuedAt: null,
      subject: null,
      audience: null,
      issuer: null
    };
  }

  const payload = result.payload;

  return {
    isValid: true,
    expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
    issuedAt: payload.iat ? new Date(payload.iat * 1000) : null,
    subject: payload.sub || null,
    audience: payload.aud || null,
    issuer: payload.iss || null
  };
}

/**
 * Safely decodes base64url string
 */
function base64UrlDecode(str: string): { success: boolean; data?: string; error?: string } {
  try {
    // Convert base64url to base64
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    
    let decoded: string;
    
    // Use appropriate decoding method based on environment
    if (typeof Buffer !== 'undefined') {
      // Node.js environment
      decoded = Buffer.from(base64, 'base64').toString('utf-8');
    } else if (typeof atob !== 'undefined') {
      // Browser environment
      decoded = atob(base64);
    } else {
      return {
        success: false,
        error: 'No base64 decoding method available'
      };
    }

    return {
      success: true,
      data: decoded
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to decode base64url string'
    };
  }
}

/**
 * Validates token format without decoding payload
 */
export function isValidJWTFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  // Remove 'Bearer ' prefix if present
  const cleanToken = token.replace(/^Bearer\s+/i, '');

  // Check if it has 3 parts separated by dots
  const parts = cleanToken.split('.');
  if (parts.length !== 3) {
    return false;
  }

  // Check if each part is valid base64url
  return parts.every(part => isValidBase64Url(part));
}

/**
 * Validates base64url format
 */
function isValidBase64Url(str: string): boolean {
  if (!str || typeof str !== 'string') {
    return false;
  }

  // Base64url uses A-Z, a-z, 0-9, -, _ characters
  const base64UrlRegex = /^[A-Za-z0-9_-]+$/;
  return base64UrlRegex.test(str);
}

/**
 * Calculates time until token expiry
 */
export function getTimeUntilExpiry(token: string): { success: boolean; milliseconds?: number; error?: string } {
  const result = safeExtractClaim<number>(token, 'exp');
  
  if (!result.success || result.payload === undefined) {
    return {
      success: false,
      error: result.error || 'Could not extract expiry time'
    };
  }

  const expiryTime = result.payload * 1000; // Convert to milliseconds
  const timeUntilExpiry = expiryTime - Date.now();

  return {
    success: true,
    milliseconds: Math.max(0, timeUntilExpiry)
  };
}

/**
 * Formats token expiry time for display
 */
export function formatTokenExpiry(token: string): string {
  const info = extractTokenInfo(token);
  
  if (!info.isValid || !info.expiresAt) {
    return 'Invalid or expired token';
  }

  const now = new Date();
  const expiry = info.expiresAt;
  
  if (expiry <= now) {
    return 'Expired';
  }

  const diffMs = expiry.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `Expires in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    return `Expires in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  } else if (diffMinutes > 0) {
    return `Expires in ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  } else {
    return 'Expires very soon';
  }
}