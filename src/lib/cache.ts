/**
 * Centralized caching service that supports both in-memory and Redis caching
 * with proper TTL management and cache invalidation strategies
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlMs: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(pattern?: string): Promise<void>;
  has(key: string): Promise<boolean>;
}

/**
 * In-memory cache implementation with TTL support
 */
export class InMemoryCache implements CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(cleanupIntervalMs: number = 5 * 60 * 1000) { // 5 minutes default
    // Start periodic cleanup of expired entries
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, cleanupIntervalMs);
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl: ttlMs
    };

    this.cache.set(key, entry);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(pattern?: string): Promise<void> {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    // Convert glob pattern to regex for matching
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  private cleanupExpired(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }

  // Utility methods for debugging and monitoring
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

/**
 * Redis cache implementation (optional, requires redis client)
 */
export class RedisCache implements CacheService {
  private client: any; // Redis client type would be imported if using redis

  constructor(redisClient: any) {
    this.client = redisClient;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    try {
      const ttlSeconds = Math.ceil(ttlMs / 1000);
      await this.client.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  async clear(pattern?: string): Promise<void> {
    try {
      if (!pattern) {
        await this.client.flushdb();
        return;
      }

      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }
}

/**
 * Cache configuration and TTL settings
 */
export const CACHE_CONFIG = {
  COURSES_TTL: 60 * 60 * 1000, // 1 hour
  COURSE_DETAILS_TTL: 30 * 60 * 1000, // 30 minutes
  CHAPTER_FILES_TTL: 15 * 60 * 1000, // 15 minutes
  DEFAULT_TTL: 10 * 60 * 1000, // 10 minutes
} as const;

/**
 * Cache key generation utilities
 */
export class CacheKeyGenerator {
  private static readonly PREFIX = 'gdrive_courses';

  static courses(userId: string): string {
    return `${this.PREFIX}:courses:${userId}`;
  }

  static courseDetails(userId: string, courseId: string): string {
    return `${this.PREFIX}:course:${userId}:${courseId}`;
  }

  static chapterFiles(userId: string, courseId: string, chapterId: string): string {
    return `${this.PREFIX}:chapter:${userId}:${courseId}:${chapterId}`;
  }

  static userPattern(userId: string): string {
    return `${this.PREFIX}:*:${userId}*`;
  }

  static coursePattern(userId: string, courseId: string): string {
    return `${this.PREFIX}:*:${userId}:${courseId}*`;
  }
}

/**
 * Global cache instance - defaults to in-memory cache
 * Can be replaced with Redis cache if needed
 */
let globalCache: CacheService = new InMemoryCache();

export function getCacheService(): CacheService {
  return globalCache;
}

export function setCacheService(cacheService: CacheService): void {
  globalCache = cacheService;
}

/**
 * Cache invalidation utilities
 */
export class CacheInvalidator {
  private cache: CacheService;

  constructor(cacheService?: CacheService) {
    this.cache = cacheService || getCacheService();
  }

  /**
   * Invalidate all cache entries for a specific user
   */
  async invalidateUser(userId: string): Promise<void> {
    const pattern = CacheKeyGenerator.userPattern(userId);
    await this.cache.clear(pattern);
  }

  /**
   * Invalidate all cache entries for a specific course
   */
  async invalidateCourse(userId: string, courseId: string): Promise<void> {
    const pattern = CacheKeyGenerator.coursePattern(userId, courseId);
    await this.cache.clear(pattern);
  }

  /**
   * Invalidate courses list for a user
   */
  async invalidateCourses(userId: string): Promise<void> {
    const key = CacheKeyGenerator.courses(userId);
    await this.cache.delete(key);
  }

  /**
   * Invalidate course details for a user
   */
  async invalidateCourseDetails(userId: string, courseId: string): Promise<void> {
    const key = CacheKeyGenerator.courseDetails(userId, courseId);
    await this.cache.delete(key);
  }

  /**
   * Invalidate chapter files for a user
   */
  async invalidateChapterFiles(userId: string, courseId: string, chapterId: string): Promise<void> {
    const key = CacheKeyGenerator.chapterFiles(userId, courseId, chapterId);
    await this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  async invalidateAll(): Promise<void> {
    await this.cache.clear();
  }
}

/**
 * Utility function to get cache stats (for monitoring)
 */
export function getCacheStats() {
  const cache = getCacheService();
  if (cache instanceof InMemoryCache) {
    return cache.getStats();
  }
  return { message: 'Stats not available for this cache type' };
}