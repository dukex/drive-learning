/**
 * TokenValidator - Core token validation and expiry detection
 * 
 * Handles JWT token validation, expiry detection, and format validation
 * for Google OAuth access tokens.
 */

export interface TokenValidationResult {
  isValid: boolean;
  isExpired: boolean;
  isExpiringSoon: boolean;
  expiresAt: Date | null;
  error?: string;
}

export interface JWTPayload {
  exp: number;
  iat: number;
  aud: string;
  iss: string;
  sub: string;
  [key: string]: any;
}

export class TokenValidator {
  private readonly DEFAULT_BUFFER_MINUTES = 5;

  /**
   * Validates token format and checks expiry status
   */
  validateToken(token: string, bufferMinutes?: number): TokenValidationResult {
    if (!token || typeof token !== 'string') {
      return {
        isValid: false,
        isExpired: true,
        isExpiringSoon: true,
        expiresAt: null,
        error: 'Invalid token format'
      };
    }

    try {
      const payload = this.decodeJWTPayload(token);
      const expiresAt = new Date(payload.exp * 1000);
      const isExpired = this.isTokenExpired(token);
      const isExpiringSoon = this.isTokenExpiringSoon(token, bufferMinutes);

      return {
        isValid: true,
        isExpired,
        isExpiringSoon,
        expiresAt,
      };
    } catch (error) {
      return {
        isValid: false,
        isExpired: true,
        isExpiringSoon: true,
        expiresAt: null,
        error: error instanceof Error ? error.message : 'Token validation failed'
      };
    }
  }

  /**
   * Checks if token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeJWTPayload(token);
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true; // Invalid token format is considered expired
    }
  }

  /**
   * Checks if token is expiring soon (within buffer time)
   */
  isTokenExpiringSoon(token: string, bufferMinutes = this.DEFAULT_BUFFER_MINUTES): boolean {
    try {
      const payload = this.decodeJWTPayload(token);
      const expiryTime = payload.exp * 1000;
      const bufferTime = bufferMinutes * 60 * 1000;
      return Date.now() >= (expiryTime - bufferTime);
    } catch {
      return true; // Invalid token format is considered expiring
    }
  }

  /**
   * Validates token format without checking expiry
   */
  validateTokenFormat(token: string): boolean {
    try {
      this.decodeJWTPayload(token);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets token expiry date
   */
  getTokenExpiry(token: string): Date | null {
    try {
      const payload = this.decodeJWTPayload(token);
      return new Date(payload.exp * 1000);
    } catch {
      return null;
    }
  }

  /**
   * Gets token issued date
   */
  getTokenIssuedAt(token: string): Date | null {
    try {
      const payload = this.decodeJWTPayload(token);
      return payload.iat ? new Date(payload.iat * 1000) : null;
    } catch {
      return null;
    }
  }

  /**
   * Gets remaining token lifetime in milliseconds
   */
  getTokenRemainingLifetime(token: string): number {
    try {
      const payload = this.decodeJWTPayload(token);
      const expiryTime = payload.exp * 1000;
      const remaining = expiryTime - Date.now();
      return Math.max(0, remaining);
    } catch {
      return 0;
    }
  }

  /**
   * Safely decodes JWT payload without verification
   * Note: This is for expiry checking only, not for security validation
   */
  private decodeJWTPayload(token: string): JWTPayload {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token: must be a non-empty string');
    }

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace(/^Bearer\s+/i, '');

    // JWT tokens have 3 parts separated by dots
    const parts = cleanToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format: must have 3 parts');
    }

    try {
      // Decode the payload (second part)
      const payload = parts[1];
      
      // Add padding if needed for base64 decoding
      const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
      
      // Decode base64url
      const decodedPayload = this.base64UrlDecode(paddedPayload);
      const parsedPayload = JSON.parse(decodedPayload);

      // Validate required JWT claims
      if (typeof parsedPayload.exp !== 'number') {
        throw new Error('Invalid JWT: missing or invalid exp claim');
      }

      return parsedPayload as JWTPayload;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`JWT decode error: ${error.message}`);
      }
      throw new Error('JWT decode error: unknown error');
    }
  }

  /**
   * Decodes base64url encoded string
   */
  private base64UrlDecode(str: string): string {
    // Convert base64url to base64
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    
    try {
      // Use Buffer in Node.js environment, atob in browser
      if (typeof Buffer !== 'undefined') {
        return Buffer.from(base64, 'base64').toString('utf-8');
      } else if (typeof atob !== 'undefined') {
        return atob(base64);
      } else {
        throw new Error('No base64 decoding method available');
      }
    } catch (error) {
      throw new Error('Failed to decode base64url string');
    }
  }

  /**
   * Calculates buffer time in milliseconds
   */
  calculateBufferTime(bufferMinutes: number): number {
    if (bufferMinutes < 0) {
      throw new Error('Buffer minutes must be non-negative');
    }
    return bufferMinutes * 60 * 1000;
  }

  /**
   * Validates timezone-aware expiry calculations
   */
  isTokenExpiredWithTimezone(token: string, timezone?: string): boolean {
    try {
      const payload = this.decodeJWTPayload(token);
      const expiryTime = payload.exp * 1000;
      
      // Get current time in specified timezone or UTC
      const now = timezone ? 
        new Date().toLocaleString('en-US', { timeZone: timezone }) :
        Date.now();
      
      const currentTime = typeof now === 'string' ? new Date(now).getTime() : now;
      
      return currentTime >= expiryTime;
    } catch {
      return true;
    }
  }
}

// Export a singleton instance for convenience
export const tokenValidator = new TokenValidator();