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
        byStudent: (studentId: string): QueryKey =>
            ['courses', 'enrollment', 'student', studentId] as const,
    },

    // Course performance
    performance: {
        all: ['courses', 'performance'] as const,
        byCourse: (courseId: string): QueryKey =>
            ['courses', 'performance', courseId] as const,
        byStudent: (studentId: string, courseId: string): QueryKey =>
            ['courses', 'performance', studentId, courseId] as const,
    },

    // Course progress
    progress: {
        all: ['courses', 'progress'] as const,
        byStudent: (studentId: string, courseId: string): QueryKey =>
            ['courses', 'progress', studentId, courseId] as const,
    },

    // Curriculum courses (legacy naming for backward compatibility)
    curriculum: {
        all: ['curriculum_courses'] as const,
        byCollege: (collegeId: string): QueryKey =>
            ['curriculum_courses', collegeId] as const,
    },
} as const;
