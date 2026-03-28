/**
 * Lesson plan data transformation utilities
 */

export interface LessonPlan {
  id: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  review_comments?: string;
  [key: string]: any;
}

/**
 * Count lesson plans by status
 */
export function countByStatus(
  lessonPlans: LessonPlan[],
  status: string
): number {
  if (status === 'all') return lessonPlans.length;
  return lessonPlans.filter(lp => lp.status === status).length;
}

/**
 * Filter lesson plans by status
 */
export function filterByStatus(
  lessonPlans: LessonPlan[],
  status: string
): LessonPlan[] {
  if (status === 'all') return lessonPlans;
  return lessonPlans.filter(lp => lp.status === status);
}

/**
 * Get lesson plans with review comments
 */
export function getPlansWithComments(
  lessonPlans: LessonPlan[],
  limit?: number
): LessonPlan[] {
  const filtered = lessonPlans.filter(lp => lp.review_comments);
  return limit ? filtered.slice(0, limit) : filtered;
}

/**
 * Check if any lesson plans have comments
 */
export function hasAnyComments(lessonPlans: LessonPlan[]): boolean {
  return lessonPlans.some(lp => lp.review_comments);
}
