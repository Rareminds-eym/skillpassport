import type { QueryKey } from './types';

export const coursesKeys = {
    // Base key for all course queries
    all: ['courses'] as const,

    // Course list
    list: {
        all: ['courses', 'list'] as const,
        byCollege: (collegeId: string): QueryKey =>
            ['courses', 'list', collegeId] as const,
    },

    // Course enrollment
    enrollment: {
        all: ['courses', 'enrollment'] as const,
        byCourse: (courseId: string): QueryKey =>
            ['courses', 'enrollment', courseId] as const,
        byLearner: (learnerId: string): QueryKey =>
            ['courses', 'enrollment', 'learner', learnerId] as const,
    },

    // Course performance
    performance: {
        all: ['courses', 'performance'] as const,
        byCourse: (courseId: string): QueryKey =>
            ['courses', 'performance', courseId] as const,
        byLearner: (learnerId: string, courseId: string): QueryKey =>
            ['courses', 'performance', learnerId, courseId] as const,
        byPreset: (preset: string, options?: { startDate?: string; endDate?: string; limit?: number }): QueryKey =>
            ['courses', 'performance', 'preset', preset, options].filter(Boolean) as QueryKey,
    },

    // Course progress
    progress: {
        all: ['courses', 'progress'] as const,
        byLearner: (learnerId: string, courseId: string): QueryKey =>
            ['courses', 'progress', learnerId, courseId] as const,
    },

    // Curriculum courses (legacy naming for backward compatibility)
    curriculum: {
        all: ['curriculum_courses'] as const,
        byCollege: (collegeId: string): QueryKey =>
            ['curriculum_courses', collegeId] as const,
    },
} as const;
