/**
 * Shared Grade Level Configuration Constants
 * Used by gradeUtils and assessment feature
 */

export type GradeLevel = 'middle' | 'highschool' | 'higher_secondary' | 'after10' | 'after12' | 'college';

export interface GradeRange {
    min: number;
    max: number;
}

export const GRADE_LEVELS = {
    MIDDLE: 'middle' as GradeLevel,
    HIGHSCHOOL: 'highschool' as GradeLevel,
    HIGHER_SECONDARY: 'higher_secondary' as GradeLevel,
    AFTER_10: 'after10' as GradeLevel,
    AFTER_12: 'after12' as GradeLevel,
    COLLEGE: 'college' as GradeLevel,
} as const;

export const GRADE_RANGES: Record<string, GradeRange> = {
    MIDDLE: { min: 6, max: 8 },
    HIGHSCHOOL: { min: 9, max: 10 },
    HIGHER_SECONDARY: { min: 11, max: 12 },
};

export const PROGRAM_GRADE_MAPPINGS: Record<string, GradeLevel> = {
    'UG': 'college',
    'UNDERGRADUATE': 'college',
    'PG': 'college',
    'POSTGRADUATE': 'college',
    'DIPLOMA': 'after12',
    'CERTIFICATE': 'after12',
};
