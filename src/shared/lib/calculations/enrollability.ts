import type { LearnerProfile, EnrollabilityScore } from '../../../entities/learner/model/types';

/**
 * Weight distribution for enrollability score calculation
 * Total must equal 1.0 (100%)
 */
const WEIGHTS = {
    skillCompleteness: 0.35, // 35%
    learningProgress: 0.30, // 30%
    certificationRate: 0.20, // 20%
    activityLevel: 0.15, // 15%
} as const;

/**
 * Target values for each factor
 */
const TARGETS = {
    skills: 20, // Target: 20 verified skills
    certificates: 10, // Target: 10 certificates
    streakDays: 30, // Target: 30-day streak
} as const;

/**
 * Extended learner data with course information
 * LearnerProfile doesn't contain course data, so we extend it here
 */
export interface LearnerWithCourses extends LearnerProfile {
    coursesEnrolled: number;
    coursesCompleted: number;
}

/**
 * Calculate enrollability score for a learner
 * 
 * Enrollability score is a composite metric (0-100) that measures
 * a student's readiness for employment/opportunities based on:
 * - Skill completeness (35%): Verified skills / 20 target skills
 * - Learning progress (30%): Courses completed / courses enrolled
 * - Certification rate (20%): Certificates earned / 10 target certificates
 * - Activity level (15%): Current streak / 30-day target streak
 * 
 * @param learner - Learner profile with course information
 * @returns EnrollabilityScore with overall score, status, and factor breakdown
 * 
 * @example
 * const learner = {
 *   ...profile,
 *   verifiedSkills: 15,
 *   certificates: 5,
 *   streak: 20,
 *   coursesEnrolled: 10,
 *   coursesCompleted: 7
 * };
 * const score = calculateEnrollabilityScore(learner);
 * // Returns: { score: 72, status: 'good', factors: {...} }
 */
export function calculateEnrollabilityScore(
    learner: LearnerWithCourses
): EnrollabilityScore {
    // Calculate skill completeness (capped at 100)
    const skillCompleteness = Math.min((learner.verifiedSkills / TARGETS.skills) * 100, 100);

    // Calculate learning progress (capped at 100)
    // Handle edge case: no courses enrolled (prevent division by zero)
    const learningProgress =
        learner.coursesEnrolled > 0
            ? Math.min((learner.coursesCompleted / learner.coursesEnrolled) * 100, 100)
            : 0;

    // Calculate certification rate (capped at 100)
    const certificationRate = Math.min(
        (learner.certificates / TARGETS.certificates) * 100,
        100
    );

    // Calculate activity level
    // Capped at 100 by using min() in the formula
    const activityLevel = Math.min(learner.streak / TARGETS.streakDays, 1) * 100;

    // Calculate weighted score
    const weightedScore =
        skillCompleteness * WEIGHTS.skillCompleteness +
        learningProgress * WEIGHTS.learningProgress +
        certificationRate * WEIGHTS.certificationRate +
        activityLevel * WEIGHTS.activityLevel;

    // Round and cap at 100
    const score = Math.round(Math.min(weightedScore, 100));

    // Determine status based on score ranges
    const status: EnrollabilityScore['status'] =
        score >= 85
            ? 'excellent'
            : score >= 70
                ? 'good'
                : score >= 50
                    ? 'average'
                    : 'needs-improvement';

    return {
        score,
        status,
        factors: {
            skillCompleteness: Math.round(skillCompleteness),
            learningProgress: Math.round(learningProgress),
            certificationRate: Math.round(certificationRate),
            activityLevel: Math.round(activityLevel),
        },
    };
}
