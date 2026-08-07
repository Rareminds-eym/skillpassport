/**
 * Unit tests for enrollability score calculation
 * Requirements: 9.1-9.10, 1.5-1.9, 19.4-19.7
 */

import { describe, it, expect } from 'vitest';
import { calculateEnrollabilityScore } from '../enrollability';
import type { LearnerProfile } from '@/entities/learner/model/types';

// Extended type for testing (includes coursesEnrolled and coursesCompleted)
interface TestLearnerProfile extends LearnerProfile {
    coursesEnrolled?: number;
    coursesCompleted?: number;
}

describe('calculateEnrollabilityScore', () => {
    it('should calculate score correctly for complete profile with excellent status', () => {
        const learner: TestLearnerProfile = {
            id: '1',
            userId: 'user1',
            email: 'test@example.com',
            name: 'Test Student',
            collegeId: 'college1',
            collegeName: 'Test College',
            program: 'B.Tech Engineering',
            semester: 5,
            grade: 'UG',
            enrollabilityScore: 0,
            skillScore: 85,
            streak: 30,
            streakBest: 30,
            lastActivity: new Date(),
            badges: 10,
            verifiedSkills: 20,
            certificates: 10,
            passportVerified: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
            coursesEnrolled: 10,
            coursesCompleted: 10
        };

        const result = calculateEnrollabilityScore(learner);

        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
        expect(result.score).toBe(100);
        expect(result.status).toBe('excellent');
        expect(result.factors.skillCompleteness).toBe(100);
        expect(result.factors.learningProgress).toBe(100);
        expect(result.factors.certificationRate).toBe(100);
        expect(result.factors.activityLevel).toBe(100);
    });

    it('should calculate score correctly for empty profile', () => {
        const learner: TestLearnerProfile = {
            id: '2',
            userId: 'user2',
            email: 'empty@example.com',
            name: 'Empty Student',
            collegeId: 'college1',
            collegeName: 'Test College',
            program: 'B.Tech Engineering',
            semester: 1,
            grade: 'UG',
            enrollabilityScore: 0,
            skillScore: 0,
            streak: 0,
            streakBest: 0,
            lastActivity: new Date(),
            badges: 0,
            verifiedSkills: 0,
            certificates: 0,
            passportVerified: 'none',
            createdAt: new Date(),
            updatedAt: new Date(),
            coursesEnrolled: 0,
            coursesCompleted: 0
        };

        const result = calculateEnrollabilityScore(learner);

        expect(result.score).toBe(0);
        expect(result.status).toBe('needs-improvement');
        expect(result.factors.skillCompleteness).toBe(0);
        expect(result.factors.learningProgress).toBe(0);
        expect(result.factors.certificationRate).toBe(0);
        expect(result.factors.activityLevel).toBe(0);
    });

    it('should return good status for score between 70-84', () => {
        const learner: TestLearnerProfile = {
            id: '3',
            userId: 'user3',
            email: 'good@example.com',
            name: 'Good Student',
            collegeId: 'college1',
            collegeName: 'Test College',
            program: 'B.Tech Engineering',
            semester: 3,
            grade: 'UG',
            enrollabilityScore: 0,
            skillScore: 70,
            streak: 20,
            streakBest: 20,
            lastActivity: new Date(),
            badges: 5,
            verifiedSkills: 15,
            certificates: 7,
            passportVerified: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
            coursesEnrolled: 10,
            coursesCompleted: 7
        };

        const result = calculateEnrollabilityScore(learner);

        expect(result.score).toBeGreaterThanOrEqual(70);
        expect(result.score).toBeLessThan(85);
        expect(result.status).toBe('good');
    });

    it('should return average status for score between 50-69', () => {
        const learner: TestLearnerProfile = {
            id: '4',
            userId: 'user4',
            email: 'average@example.com',
            name: 'Average Student',
            collegeId: 'college1',
            collegeName: 'Test College',
            program: 'B.Tech Engineering',
            semester: 2,
            grade: 'UG',
            enrollabilityScore: 0,
            skillScore: 50,
            streak: 15,
            streakBest: 15,
            lastActivity: new Date(),
            badges: 3,
            verifiedSkills: 10,
            certificates: 5,
            passportVerified: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
            coursesEnrolled: 10,
            coursesCompleted: 5
        };

        const result = calculateEnrollabilityScore(learner);

        expect(result.score).toBeGreaterThanOrEqual(50);
        expect(result.score).toBeLessThan(70);
        expect(result.status).toBe('average');
    });

    it('should return needs-improvement status for score below 50', () => {
        const learner: TestLearnerProfile = {
            id: '5',
            userId: 'user5',
            email: 'needs-improvement@example.com',
            name: 'Needs Improvement Student',
            collegeId: 'college1',
            collegeName: 'Test College',
            program: 'B.Tech Engineering',
            semester: 1,
            grade: 'UG',
            enrollabilityScore: 0,
            skillScore: 30,
            streak: 5,
            streakBest: 5,
            lastActivity: new Date(),
            badges: 1,
            verifiedSkills: 3,
            certificates: 2,
            passportVerified: 'none',
            createdAt: new Date(),
            updatedAt: new Date(),
            coursesEnrolled: 5,
            coursesCompleted: 1
        };

        const result = calculateEnrollabilityScore(learner);

        expect(result.score).toBeLessThan(50);
        expect(result.status).toBe('needs-improvement');
    });

    it('should cap skill completeness at 100% when verifiedSkills > 20', () => {
        const learner: TestLearnerProfile = {
            id: '6',
            userId: 'user6',
            email: 'overachiever@example.com',
            name: 'Overachiever Student',
            collegeId: 'college1',
            collegeName: 'Test College',
            program: 'B.Tech Engineering',
            semester: 7,
            grade: 'UG',
            enrollabilityScore: 0,
            skillScore: 95,
            streak: 45,
            streakBest: 45,
            lastActivity: new Date(),
            badges: 15,
            verifiedSkills: 30,
            certificates: 15,
            passportVerified: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
            coursesEnrolled: 15,
            coursesCompleted: 15
        };

        const result = calculateEnrollabilityScore(learner);

        // Individual factors should be capped at 100
        expect(result.score).toBeLessThanOrEqual(100);
        expect(result.factors.skillCompleteness).toBe(100); // Capped at 100
        expect(result.factors.certificationRate).toBe(100); // Capped at 100
        expect(result.factors.learningProgress).toBe(100);
        expect(result.factors.activityLevel).toBe(100);
    });

    it('should handle undefined coursesEnrolled and coursesCompleted', () => {
        const learner: TestLearnerProfile = {
            id: '7',
            userId: 'user7',
            email: 'no-courses@example.com',
            name: 'No Courses Student',
            collegeId: 'college1',
            collegeName: 'Test College',
            program: 'B.Tech Engineering',
            semester: 1,
            grade: 'UG',
            enrollabilityScore: 0,
            skillScore: 40,
            streak: 10,
            streakBest: 10,
            lastActivity: new Date(),
            badges: 2,
            verifiedSkills: 5,
            certificates: 3,
            passportVerified: 'none',
            createdAt: new Date(),
            updatedAt: new Date()
            // coursesEnrolled and coursesCompleted are undefined
        };

        const result = calculateEnrollabilityScore(learner);

        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
        expect(result.factors.learningProgress).toBe(0);
    });

    it('should correctly apply weight distribution', () => {
        const learner: TestLearnerProfile = {
            id: '8',
            userId: 'user8',
            email: 'weights@example.com',
            name: 'Weights Test Student',
            collegeId: 'college1',
            collegeName: 'Test College',
            program: 'B.Tech Engineering',
            semester: 4,
            grade: 'UG',
            enrollabilityScore: 0,
            skillScore: 60,
            streak: 30,
            streakBest: 30,
            lastActivity: new Date(),
            badges: 5,
            verifiedSkills: 10,
            certificates: 5,
            passportVerified: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
            coursesEnrolled: 10,
            coursesCompleted: 5
        };

        const result = calculateEnrollabilityScore(learner);

        // Manual calculation:
        // skillCompleteness = (10/20) * 100 = 50
        // learningProgress = (5/10) * 100 = 50
        // certificationRate = (5/10) * 100 = 50
        // activityLevel = min(30/30, 1) * 100 = 100
        // weighted = 50*0.35 + 50*0.30 + 50*0.20 + 100*0.15 = 17.5 + 15 + 10 + 15 = 57.5 ≈ 58

        expect(result.score).toBe(58);
        expect(result.factors.skillCompleteness).toBe(50);
        expect(result.factors.learningProgress).toBe(50);
        expect(result.factors.certificationRate).toBe(50);
        expect(result.factors.activityLevel).toBe(100);
    });

    it('should handle partial streak correctly', () => {
        const learner: TestLearnerProfile = {
            id: '9',
            userId: 'user9',
            email: 'partial-streak@example.com',
            name: 'Partial Streak Student',
            collegeId: 'college1',
            collegeName: 'Test College',
            program: 'B.Tech Engineering',
            semester: 2,
            grade: 'UG',
            enrollabilityScore: 0,
            skillScore: 55,
            streak: 15,
            streakBest: 20,
            lastActivity: new Date(),
            badges: 4,
            verifiedSkills: 10,
            certificates: 5,
            passportVerified: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
            coursesEnrolled: 8,
            coursesCompleted: 4
        };

        const result = calculateEnrollabilityScore(learner);

        // activityLevel should be (15/30) * 100 = 50
        expect(result.factors.activityLevel).toBe(50);
    });

    it('should always return score between 0 and 100', () => {
        // Test with extreme values
        const extremeLearner: TestLearnerProfile = {
            id: '10',
            userId: 'user10',
            email: 'extreme@example.com',
            name: 'Extreme Student',
            collegeId: 'college1',
            collegeName: 'Test College',
            program: 'B.Tech Engineering',
            semester: 8,
            grade: 'UG',
            enrollabilityScore: 0,
            skillScore: 100,
            streak: 100,
            streakBest: 100,
            lastActivity: new Date(),
            badges: 50,
            verifiedSkills: 50,
            certificates: 30,
            passportVerified: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
            coursesEnrolled: 50,
            coursesCompleted: 50
        };

        const result = calculateEnrollabilityScore(extremeLearner);

        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(100);
    });
});
