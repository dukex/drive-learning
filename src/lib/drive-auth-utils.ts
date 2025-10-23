import { redirect } from 'next/navigation';
import { auth } from './auth';
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

export interface CourseConfig {
  coursesListEnv: string;
  courseUrls: string[];
}

export async function validSession() {
  try {
    const session = await getUserSession();
    if (!session) {
      redirect('/');
    }

    // Validate user permissions
    validateUserPermissions(session);

    return session;
  } catch (error) {
    // If there's an authentication error, redirect to sign-in page
    console.error('Authentication error:', error);
    redirect('/');
  }
}


/**
 * Extract user session and access token from Better Auth
 * Now uses TokenManager for automatic token refresh
 */
export async function getUserSession(): Promise<UserSession | null> {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user || !session?.session) {
      return null;
    }

    // Import TokenManager dynamically to avoid circular dependencies
    const { TokenManager } = await import('./token-management');
    const tokenManager = new TokenManager();

    try {
      // First check if user has any stored tokens at all
      const db = (auth as any).options.database;
      const accountQuery = db.prepare(`
        SELECT accessToken, refreshToken 
        FROM account 
        WHERE userId = ? AND providerId = 'google'
        ORDER BY createdAt DESC 
        LIMIT 1
      `);

      const account = accountQuery.get(session.user.id);

      // Debug logging
      console.log('Account data for user', session.user.id, ':', {
        hasAccount: !!account,
        hasAccessToken: !!account?.accessToken,
        hasRefreshToken: !!account?.refreshToken,
        createdAt: account?.createdAt ? new Date(account.createdAt * 1000).toISOString() : 'N/A'
      });

      if (!account) {
        // No Google account linked - user needs to authenticate
        throw new Error('No Google account linked. Please sign in with Google.');
      }

      if (!account.refreshToken) {
        // No refresh token - user needs to re-authenticate
        throw new Error('No refresh token found. Please re-authenticate with Google.');
      }

      // Try to get a valid access token (will refresh if needed)
      const accessToken = await tokenManager.getValidAccessToken(session.user.id);

      return {
        user: {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.name || '',
          image: session.user.image
        },
        accessToken,
        refreshToken: account.refreshToken
      };
    } catch (tokenError) {
      // If token management fails, user needs to re-authenticate
      console.error('Token management failed:', tokenError);

      // Provide more specific error messages
      if (tokenError instanceof Error) {
        if (tokenError.message.includes('No Google account linked')) {
          throw tokenError;
        }
        if (tokenError.message.includes('No refresh token found')) {
          throw tokenError;
        }
        if (tokenError.message.includes('invalid_grant') || tokenError.message.includes('expired')) {
          throw new Error('Your Google authentication has expired. Please sign in again.');
        }
      }

      throw new Error('Unable to access Google Drive. Please re-authenticate.');
    }
  } catch (error) {
    console.error('Failed to get user session:', error);
    return null;
  }
}

/**
 * Parse COURSES_LIST environment variable
 */
export function parseCoursesList(): CourseConfig {
  const coursesListEnv = process.env.COURSES_LIST || '';

  if (!coursesListEnv.trim()) {
    throw new Error('COURSES_LIST environment variable is not configured');
  }

  // Split by comma and clean up URLs
  const courseUrls = coursesListEnv
    .split(',')
    .map(url => url.trim())
    .filter(url => url.length > 0);

  if (courseUrls.length === 0) {
    throw new Error('No valid course URLs found in COURSES_LIST');
  }

  // Validate each URL
  courseUrls.forEach(url => {
    if (!isValidGoogleDriveUrl(url)) {
      throw new Error(`Invalid Google Drive URL: ${url}`);
    }
  });

  return {
    coursesListEnv,
    courseUrls
  };
}

/**
 * Extract Google Drive folder ID from URL
 */
export function extractFolderIdFromUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid URL provided');
  }

  // Handle different Google Drive URL formats:
  // https://drive.google.com/drive/folders/FOLDER_ID
  // https://drive.google.com/drive/folders/FOLDER_ID?usp=sharing
  // https://drive.google.com/open?id=FOLDER_ID
  // https://drive.google.com/drive/u/0/folders/FOLDER_ID

  const patterns = [
    /\/folders\/([a-zA-Z0-9_-]+)/,  // Standard folder URL
    /[?&]id=([a-zA-Z0-9_-]+)/,      // Open URL format
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  throw new Error(`Could not extract folder ID from URL: ${url}`);
}

/**
 * Validate Google Drive URL format
 */
export function isValidGoogleDriveUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);

    // Must be a Google Drive domain
    if (!urlObj.hostname.includes('drive.google.com')) {
      return false;
    }

    // Must contain a folder ID
    extractFolderIdFromUrl(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate cache key for course data
 */
export function generateCacheKey(type: 'courses' | 'course' | 'lesson', userId: string, id?: string): string {
  const baseKey = `drive-courses:${userId}:${type}`;
  return id ? `${baseKey}:${id}` : baseKey;
}

/**
 * Validate user has required permissions
 */
export function validateUserPermissions(session: UserSession): void {
  if (!session.accessToken) {
    throw new Error('No access token available. Please re-authenticate.');
  }

  if (!session.user.email) {
    throw new Error('User email not available. Please re-authenticate.');
  }
}