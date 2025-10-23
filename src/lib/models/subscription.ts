/**
 * Subscription model and utilities for course subscription system
 */

/**
 * Subscription interface representing a user's subscription to a course
 */
export interface Subscription {
  id: number;
  userId: string;
  courseId: string;
  subscribedAt: Date;
  status: 'active' | 'cancelled';
}

/**
 * Raw subscription data from database (before transformation)
 */
export interface RawSubscription {
  id: number;
  user_id: string;
  course_id: string;
  subscribed_at: string;
  status: 'active' | 'cancelled';
}

/**
 * Transform raw database subscription data to Subscription object
 */
export function transformRawSubscription(raw: RawSubscription): Subscription {
  return {
    id: raw.id,
    userId: raw.user_id,
    courseId: raw.course_id,
    subscribedAt: new Date(raw.subscribed_at),
    status: raw.status,
  };
}

/**
 * Transform Subscription object to database format
 */
export function subscriptionToDbFormat(subscription: Omit<Subscription, 'id'>): Omit<RawSubscription, 'id'> {
  return {
    user_id: subscription.userId,
    course_id: subscription.courseId,
    subscribed_at: subscription.subscribedAt.toISOString(),
    status: subscription.status,
  };
}

/**
 * Validate subscription status
 */
export function isValidSubscriptionStatus(status: string): status is 'active' | 'cancelled' {
  return status === 'active' || status === 'cancelled';
}

/**
 * Generate cache key for subscription data
 */
export function generateSubscriptionCacheKey(userId: string, courseId?: string): string {
  return courseId ? `subscription:${userId}:${courseId}` : `subscriptions:${userId}`;
}