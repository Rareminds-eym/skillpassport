/**
 * Unit tests for learning metrics aggregation
 * Requirements: 3.1-3.8, 12.8
 * 
 * Validates: Requirements 3.1-3.8
 */

import { describe, it, expect } from 'vitest';
import { aggregateLearningMetrics, type Certificate } from '../learningMetrics';
import type { CourseProgress } from '@/entities/learner/model/types';

describe('aggregateLearningMetrics', () => {
    it('should calculate metrics correctly for complete course data', () => {
        const courses: CourseProgress[] = [
            {
                learnerId: 'learner1',
                courseId: 'course1',
                status: 'completed',
                progressPercentage: 100,
                completedModules: 10,
                totalModules: 10,
                timeSpent: 600, // 10 hours
                completedAt: new Date(),
                lastAccessedAt: new Date(),
                certificateEarned: true,
                certificateId: 'cert1',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                learnerId: 'learner1',
                courseId: 'course2',
                status: 'in-progress',
                progressPercentage: 50,
                completedModules: 5,
                totalModules: 10,
                timeSpent: 300, // 5 hours
                lastAccessedAt: new Date(),
                certificateEarned: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                learnerId: 'learner1',
                courseId: 'course3',
                status: 'not-started',
                progressPercentage: 0,
                completedModules: 0,
                totalModules: 10,
                timeSpent: 0,
                lastAccessedAt: new Date(),
                certificateEarned: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        const certificates: Certificate[] = [{ id: 'cert1' }, { id: 'cert2' }];

        const result = aggregateLearningMetrics(courses, certificates);

        expect(result.coursesEnrolled).toBe(3);
        expect(result.coursesCompleted).toBe(1);
        expect(result.coursesInProgress).toBe(1);
        expect(result.coursesNotStarted).toBe(1);
        expect(result.certificatesEarned).toBe(2);
        expect(result.totalLearningHours).toBe(15.0); // 900 minutes / 60 = 15.0
        expect(result.completionRate).toBe(33); // 1/3 * 100 = 33.33 rounded to 33
    });

    it('should return zeros for empty courses array', () => {
        const courses: CourseProgress[] = [];
        const certificates: Certificate[] = [{ id: 'cert1' }];

        const result = aggregateLearningMetrics(courses, certificates);

        expect(result.coursesEnrolled).toBe(0);
        expect(result.coursesCompleted).toBe(0);
        expect(result.coursesInProgress).toBe(0);
        expect(result.coursesNotStarted).toBe(0);
        expect(result.certificatesEarned).toBe(1);
        expect(result.totalLearningHours).toBe(0);
        expect(result.completionRate).toBe(0);
    });

    it('should handle zero coursesEnrolled and set completionRate to 0', () => {
        const courses: CourseProgress[] = [];
        const certificates: Certificate[] = [];

        const result = aggregateLearningMetrics(courses, certificates);

        expect(result.coursesEnrolled).toBe(0);
        expect(result.completionRate).toBe(0);
    });

    it('should treat null timeSpent as 0', () => {
        const courses: CourseProgress[] = [
            {
                learnerId: 'learner1',
                courseId: 'course1',
                status: 'not-started',
                progressPercentage: 0,
                completedModules: 0,
                totalModules: 10,
                timeSpent: null as unknown as number, // Simulating null
                lastAccessedAt: new Date(),
                certificateEarned: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        const certificates: Certificate[] = [];

        const result = aggregateLearningMetrics(courses, certificates);

        expect(result.totalLearningHours).toBe(0);
    });

    it('should treat undefined timeSpent as 0', () => {
        const courses: CourseProgress[] = [
            {
                learnerId: 'learner1',
                courseId: 'course1',
                status: 'not-started',
                progressPercentage: 0,
                completedModules: 0,
                totalModules: 10,
                timeSpent: undefined as unknown as number, // Simulating undefined
                lastAccessedAt: new Date(),
                certificateEarned: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        const certificates: Certificate[] = [];

        const result = aggregateLearningMetrics(courses, certificates);

        expect(result.totalLearningHours).toBe(0);
    });

    it('should round learning hours to 1 decimal place', () => {
        const courses: CourseProgress[] = [
            {
                learnerId: 'learner1',
                courseId: 'course1',
                status: 'completed',
                progressPercentage: 100,
                completedModules: 10,
                totalModules: 10,
                timeSpent: 125, // 2.083333... hours
                lastAccessedAt: new Date(),
                certificateEarned: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        const certificates: Certificate[] = [];

        const result = aggregateLearningMetrics(courses, certificates);

        expect(result.totalLearningHours).toBe(2.1); // Rounded to 1 decimal place
    });

    it('should round completion rate to integer percentage', () => {
        const courses: CourseProgress[] = [
            {
                learnerId: 'learner1',
                courseId: 'course1',
                status: 'completed',
                progressPercentage: 100,
                completedModules: 10,
                totalModules: 10,
                timeSpent: 120,
                lastAccessedAt: new Date(),
                certificateEarned: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                learnerId: 'learner1',
                courseId: 'course2',
                status: 'in-progress',
                progressPercentage: 50,
                completedModules: 5,
                totalModules: 10,
                timeSpent: 60,
                lastAccessedAt: new Date(),
                certificateEarned: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                learnerId: 'learner1',
                courseId: 'course3',
                status: 'in-progress',
                progressPercentage: 30,
                completedModules: 3,
                totalModules: 10,
                timeSpent: 30,
                lastAccessedAt: new Date(),
                certificateEarned: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        const certificates: Certificate[] = [];

        const result = aggregateLearningMetrics(courses, certificates);

        // 1 completed / 3 enrolled = 33.33...%, should round to 33
        expect(result.completionRate).toBe(33);
    });

    it('should calculate coursesCompleted correctly', () => {
        const courses: CourseProgress[] = [
            {
                learnerId: 'learner1',
                courseId: 'course1',
                status: 'completed',
                progressPercentage: 100,
                completedModules: 10,
                totalModules: 10,
                timeSpent: 120,
                lastAccessedAt: new Date(),
                certificateEarned: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                learnerId: 'learner1',
                courseId: 'course2',
                status: 'completed',
                progressPercentage: 100,
                completedModules: 8,
                totalModules: 8,
                timeSpent: 100,
                lastAccessedAt: new Date(),
                certificateEarned: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        const certificates: Certificate[] = [];

        const result = aggregateLearningMetrics(courses, certificates);

        expect(result.coursesCompleted).toBe(2);
    });

    it('should calculate coursesInProgress correctly', () => {
        const courses: CourseProgress[] = [
            {
                learnerId: 'learner1',
                courseId: 'course1',
                status: 'in-progress',
                progressPercentage: 50,
                completedModules: 5,
                totalModules: 10,
                timeSpent: 60,
                lastAccessedAt: new Date(),
                certificateEarned: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                learnerId: 'learner1',
                courseId: 'course2',
                status: 'in-progress',
                progressPercentage: 30,
                completedModules: 3,
                totalModules: 10,
                timeSpent: 30,
                lastAccessedAt: new Date(),
                certificateEarned: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                learnerId: 'learner1',
                courseId: 'course3',
                status: 'in-progress',
                progressPercentage: 80,
                completedModules: 8,
                totalModules: 10,
                timeSpent: 90,
                lastAccessedAt: new Date(),
                certificateEarned: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        const certificates: Certificate[] = [];

        const result = aggregateLearningMetrics(courses, certificates);

        expect(result.coursesInProgress).toBe(3);
    });

    it('should calculate coursesNotStarted correctly', () => {
        const courses: CourseProgress[] = [
            {
                learnerId: 'learner1',
                courseId: 'course1',
                status: 'not-started',
                progressPercentage: 0,
                completedModules: 0,
                totalModules: 10,
                timeSpent: 0,
                lastAccessedAt: new Date(),
                certificateEarned: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                learnerId: 'learner1',
                courseId: 'course2',
                status: 'not-started',
                progressPercentage: 0,
                completedModules: 0,
                totalModules: 8,
                timeSpent: 0,
                lastAccessedAt: new Date(),
                certificateEarned: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        const certificates: Certificate[] = [];

        const result = aggregateLearningMetrics(courses, certificates);

        expect(result.coursesNotStarted).toBe(2);
    });

    it('should calculate certificatesEarned correctly', () => {
        const courses: CourseProgress[] = [
            {
                learnerId: 'learner1',
                courseId: 'course1',
                status: 'completed',
                progressPercentage: 100,
                completedModules: 10,
                totalModules: 10,
                timeSpent: 120,
                lastAccessedAt: new Date(),
                certificateEarned: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        const certificates: Certificate[] = [
            { id: 'cert1' },
            { id: 'cert2' },
            { id: 'cert3' },
        ];

        const result = aggregateLearningMetrics(courses, certificates);

        expect(result.certificatesEarned).toBe(3);
    });

    it('should calculate totalLearningHours correctly', () => {
        const courses: CourseProgress[] = [
            {
                learnerId: 'learner1',
                courseId: 'course1',
                status: 'completed',
                progressPercentage: 100,
                completedModules: 10,
                totalModules: 10,
                timeSpent: 180, // 3 hours
                lastAccessedAt: new Date(),
                certificateEarned: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                learnerId: 'learner1',
                courseId: 'course2',
                status: 'in-progress',
                progressPercentage: 50,
                completedModules: 5,
                totalModules: 10,
                timeSpent: 120, // 2 hours
                lastAccessedAt: new Date(),
                certificateEarned: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                learnerId: 'learner1',
                courseId: 'course3',
                status: 'completed',
                progressPercentage: 100,
                completedModules: 8,
                totalModules: 8,
                timeSpent: 240, // 4 hours
                lastAccessedAt: new Date(),
                certificateEarned: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        const certificates: Certificate[] = [];

        const result = aggregateLearningMetrics(courses, certificates);

        // Total: 180 + 120 + 240 = 540 minutes = 9.0 hours
        expect(result.totalLearningHours).toBe(9.0);
    });

    it('should handle 100% completion rate correctly', () => {
        const courses: CourseProgress[] = [
            {
                learnerId: 'learner1',
                courseId: 'course1',
                status: 'completed',
                progressPercentage: 100,
                completedModules: 10,
                totalModules: 10,
                timeSpent: 120,
                lastAccessedAt: new Date(),
                certificateEarned: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                learnerId: 'learner1',
                courseId: 'course2',
                status: 'completed',
                progressPercentage: 100,
                completedModules: 8,
                totalModules: 8,
                timeSpent: 100,
                lastAccessedAt: new Date(),
                certificateEarned: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        const certificates: Certificate[] = [];

        const result = aggregateLearningMetrics(courses, certificates);

        expect(result.completionRate).toBe(100);
    });

    it('should handle 0% completion rate correctly', () => {
        const courses: CourseProgress[] = [
            {
                learnerId: 'learner1',
                courseId: 'course1',
                status: 'in-progress',
                progressPercentage: 50,
                completedModules: 5,
                totalModules: 10,
                timeSpent: 60,
                lastAccessedAt: new Date(),
                certificateEarned: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                learnerId: 'learner1',
                courseId: 'course2',
                status: 'not-started',
                progressPercentage: 0,
                completedModules: 0,
                totalModules: 10,
                timeSpent: 0,
                lastAccessedAt: new Date(),
                certificateEarned: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        const certificates: Certificate[] = [];

        const result = aggregateLearningMetrics(courses, certificates);

        expect(result.completionRate).toBe(0);
    });

    it('should handle empty certificates array', () => {
        const courses: CourseProgress[] = [
            {
                learnerId: 'learner1',
                courseId: 'course1',
                status: 'completed',
                progressPercentage: 100,
                completedModules: 10,
                totalModules: 10,
                timeSpent: 120,
                lastAccessedAt: new Date(),
                certificateEarned: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        const certificates: Certificate[] = [];

        const result = aggregateLearningMetrics(courses, certificates);

        expect(result.certificatesEarned).toBe(0);
    });

    it('should handle large number of courses', () => {
        const courses: CourseProgress[] = Array.from({ length: 100 }, (_, i) => ({
            learnerId: 'learner1',
            courseId: `course${i}`,
            status: i % 3 === 0 ? 'completed' : i % 3 === 1 ? 'in-progress' : 'not-started',
            progressPercentage: i % 3 === 0 ? 100 : i % 3 === 1 ? 50 : 0,
            completedModules: i % 3 === 0 ? 10 : i % 3 === 1 ? 5 : 0,
            totalModules: 10,
            timeSpent: i % 3 === 0 ? 120 : i % 3 === 1 ? 60 : 0,
            lastAccessedAt: new Date(),
            certificateEarned: i % 3 === 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        })) as CourseProgress[];

        const certificates: Certificate[] = Array.from({ length: 34 }, (_, i) => ({
            id: `cert${i}`,
        }));

        const result = aggregateLearningMetrics(courses, certificates);

        expect(result.coursesEnrolled).toBe(100);
        expect(result.coursesCompleted).toBe(34); // 100/3 rounded up
        expect(result.coursesInProgress).toBe(33); // 100/3 rounded down
        expect(result.coursesNotStarted).toBe(33); // 100/3 rounded down
        expect(result.certificatesEarned).toBe(34);
        expect(result.completionRate).toBe(34); // 34/100 * 100 = 34
    });
});
