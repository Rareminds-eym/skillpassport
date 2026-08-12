import type { CourseProgress, AggregatedLearningMetrics } from '../../../entities/learner/model/types';

/**
 * Certificate interface for aggregateLearningMetrics function
 * Minimal interface to support certificate counting
 */
export interface Certificate {
    id: string;
    // Other fields as needed
}

/**
 * Aggregate learning metrics from course progress and certificates
 * 
 * Calculates comprehensive learning statistics for dashboard display:
 * - Course enrollment counts (total, completed, in-progress, not-started)
 * - Certificate count
 * - Total learning hours (converted from minutes)
 * - Completion rate percentage
 * 
 * @param courses - Array of course progress records
 * @param certificates - Array of earned certificates
 * @returns AggregatedLearningMetrics with all calculated metrics
 * 
 * Edge cases handled:
 * - Empty courses array: Returns zeros for all metrics
 * - Zero coursesEnrolled: Sets completionRate to 0 (avoid division by zero)
 * - Null/undefined timeSpent: Treats as 0
 * - Learning hours rounded to 1 decimal place
 * - Completion rate rounded to integer percentage
 * 
 * @example
 * const courses = [
 *   { status: 'completed', timeSpent: 120, ... },
 *   { status: 'in-progress', timeSpent: 60, ... },
 *   { status: 'not-started', timeSpent: 0, ... }
 * ];
 * const certificates = [{ id: '1' }, { id: '2' }];
 * const metrics = aggregateLearningMetrics(courses, certificates);
 * // Returns: {
 * //   coursesEnrolled: 3,
 * //   coursesCompleted: 1,
 * //   coursesInProgress: 1,
 * //   coursesNotStarted: 1,
 * //   certificatesEarned: 2,
 * //   totalLearningHours: 3.0,
 * //   completionRate: 33
 * // }
 */
export function aggregateLearningMetrics(
    courses: CourseProgress[],
    certificates: Certificate[]
): AggregatedLearningMetrics {
    // Handle invalid input - ensure courses is an array
    if (!Array.isArray(courses)) {
        return {
            coursesEnrolled: 0,
            coursesCompleted: 0,
            coursesInProgress: 0,
            coursesNotStarted: 0,
            certificatesEarned: Array.isArray(certificates) ? certificates.length : 0,
            totalLearningHours: 0,
            completionRate: 0,
        };
    }

    // Handle empty courses array
    if (courses.length === 0) {
        return {
            coursesEnrolled: 0,
            coursesCompleted: 0,
            coursesInProgress: 0,
            coursesNotStarted: 0,
            certificatesEarned: Array.isArray(certificates) ? certificates.length : 0,
            totalLearningHours: 0,
            completionRate: 0,
        };
    }

    // Calculate course counts by status
    const coursesEnrolled = courses.length;
    const coursesCompleted = courses.filter((c) => c.status === 'completed').length;
    const coursesInProgress = courses.filter((c) => c.status === 'in-progress').length;
    const coursesNotStarted = courses.filter((c) => c.status === 'not-started').length;

    // Calculate certificates earned
    const certificatesEarned = Array.isArray(certificates) ? certificates.length : 0;

    // Calculate total learning hours from timeSpent (in minutes)
    // Treat null/undefined timeSpent as 0
    const totalMinutes = courses.reduce((sum, course) => {
        return sum + (course.timeSpent || 0);
    }, 0);

    // Convert minutes to hours and round to 1 decimal place
    const totalLearningHours = Math.round((totalMinutes / 60) * 10) / 10;

    // Calculate completion rate
    // Avoid division by zero if coursesEnrolled is 0 (already handled above, but defensive)
    const completionRate =
        coursesEnrolled > 0
            ? Math.round((coursesCompleted / coursesEnrolled) * 100)
            : 0;

    return {
        coursesEnrolled,
        coursesCompleted,
        coursesInProgress,
        coursesNotStarted,
        certificatesEarned,
        totalLearningHours,
        completionRate,
    };
}
