/**
 * Lesson progress model and utilities for tracking user progress through lessons
 */

/**
 * Lesson progress interface representing a user's progress on a specific lesson
 */
export interface LessonProgress {
  id: number;
  userId: string;
  courseId: string;
  lessonId: string;
  completedAt: Date | null;
  progressPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Raw lesson progress data from database (before transformation)
 */
export interface RawLessonProgress {
  id: number;
  user_id: string;
  course_id: string;
  lesson_id: string;
  completed_at: string | null;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

/**
 * Transform raw database lesson progress data to LessonProgress object
 */
export function transformRawLessonProgress(raw: RawLessonProgress): LessonProgress {
  return {
    id: raw.id,
    userId: raw.user_id,
    courseId: raw.course_id,
    lessonId: raw.lesson_id,
    completedAt: raw.completed_at ? new Date(raw.completed_at) : null,
    progressPercentage: raw.progress_percentage,
    createdAt: new Date(raw.created_at),
    updatedAt: new Date(raw.updated_at),
  };
}

/**
 * Transform LessonProgress object to database format
 */
export function lessonProgressToDbFormat(progress: Omit<LessonProgress, 'id' | 'createdAt' | 'updatedAt'>): Omit<RawLessonProgress, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: progress.userId,
    course_id: progress.courseId,
    lesson_id: progress.lessonId,
    completed_at: progress.completedAt ? progress.completedAt.toISOString() : null,
    progress_percentage: progress.progressPercentage,
  };
}

/**
 * Validate progress percentage (0-100)
 */
export function isValidProgressPercentage(percentage: number): boolean {
  return Number.isInteger(percentage) && percentage >= 0 && percentage <= 100;
}

/**
 * Check if lesson is completed (progress percentage is 100 or completedAt is set)
 */
export function isLessonCompleted(progress: LessonProgress): boolean {
  return progress.progressPercentage === 100 || progress.completedAt !== null;
}

/**
 * Generate cache key for lesson progress data
 */
export function generateLessonProgressCacheKey(userId: string, courseId: string, lessonId?: string): string {
  return lessonId 
    ? `progress:${userId}:${courseId}:${lessonId}` 
    : `progress:${userId}:${courseId}`;
}

/**
 * Calculate course completion percentage based on lesson progress
 */
export function calculateCourseProgress(lessonProgresses: LessonProgress[], totalLessons: number): {
  completed: number;
  total: number;
  percentage: number;
} {
  const completedLessons = lessonProgresses.filter(isLessonCompleted).length;
  const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  
  return {
    completed: completedLessons,
    total: totalLessons,
    percentage,
  };
}