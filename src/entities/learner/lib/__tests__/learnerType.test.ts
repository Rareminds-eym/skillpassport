import { describe, it, expect } from 'vitest';
import {
    determinelearnerType,
    isCollegeLearner,
    isSchoolLearner,
    getlearnerEducationLevel,
    EducationLevel
} from '../learnerType';

describe('learnerType utilities', () => {
    describe('determinelearnerType', () => {
        // Priority 1: Role-based detection
        describe('role-based detection (highest priority)', () => {
            it('identifies college learner by role', () => {
                const result = determinelearnerType({ role: 'learner' });
                expect(result.isCollegeLearner).toBe(true);
                expect(result.isSchoolLearner).toBe(false);
                expect(result.educationLevel).toBe(EducationLevel.COLLEGE);
            });

            it('identifies school learner by role', () => {
                const result = determinelearnerType({ role: 'learner', grade: '10' });
                expect(result.isCollegeLearner).toBe(false);
                expect(result.isSchoolLearner).toBe(true);
                expect(result.educationLevel).toBe('highschool');
            });

            it('role takes precedence over institution IDs', () => {
                const result = determinelearnerType({
                    role: 'learner',
                    school_id: 'school-uuid-123'
                });
                expect(result.isCollegeLearner).toBe(true);
                expect(result.isSchoolLearner).toBe(false);
            });

            it('learner role takes precedence over college IDs', () => {
                const result = determinelearnerType({
                    role: 'learner',
                    university_college_id: 'college-uuid-123',
                    grade: '10'
                });
                expect(result.isCollegeLearner).toBe(false);
                expect(result.isSchoolLearner).toBe(true);
            });
        });

        // Priority 2: Institution ID-based detection
        describe('institution ID-based detection', () => {
            it('identifies college learner by university_college_id', () => {
                const result = determinelearnerType({ university_college_id: 'uuid-123' });
                expect(result.isCollegeLearner).toBe(true);
                expect(result.isSchoolLearner).toBe(false);
                expect(result.institutionId).toBe('uuid-123');
            });

            it('identifies college learner by college_id alias', () => {
                const result = determinelearnerType({ college_id: 'uuid-123' });
                expect(result.isCollegeLearner).toBe(true);
                expect(result.isSchoolLearner).toBe(false);
                expect(result.institutionId).toBe('uuid-123');
            });

            it('identifies school learner by school_id', () => {
                const result = determinelearnerType({ school_id: 'school-uuid-123' });
                expect(result.isCollegeLearner).toBe(false);
                expect(result.isSchoolLearner).toBe(true);
                expect(result.institutionId).toBe('school-uuid-123');
            });

            it('college takes precedence when both IDs present', () => {
                const result = determinelearnerType({
                    school_id: 'school-uuid',
                    university_college_id: 'college-uuid'
                });
                expect(result.isCollegeLearner).toBe(true);
                expect(result.isSchoolLearner).toBe(false);
                expect(result.institutionId).toBe('college-uuid');
            });
        });

        // Priority 3: Grade-based fallback
        describe('grade-based fallback', () => {
            it('returns higher_secondary for grade 12', () => {
                const result = determinelearnerType({ grade: '12' });
                // Grade 12 is higher secondary - still a school learner
                expect(result.isCollegeLearner).toBe(false);
                expect(result.isSchoolLearner).toBe(true);
                expect(result.educationLevel).toBe('higher_secondary');
            });
            it('returns school for highschool grades', () => {
                const result = determinelearnerType({ grade: '10' });
                expect(result.isSchoolLearner).toBe(true);
                expect(result.educationLevel).toBe('highschool');
            });

            it('returns school for middle school grades', () => {
                const result = determinelearnerType({ grade: '6' });
                expect(result.isSchoolLearner).toBe(true);
                expect(result.educationLevel).toBe('middle');
            });

            it('returns unknown for no data', () => {
                const result = determinelearnerType({});
                expect(result.isCollegeLearner).toBe(false);
                expect(result.isSchoolLearner).toBe(false);
                expect(result.educationLevel).toBeNull();
            });
        });

        // Edge cases
        describe('edge cases', () => {
            it('handles null values gracefully', () => {
                const result = determinelearnerType({
                    school_id: null,
                    university_college_id: null,
                    grade: null
                });
                expect(result.isCollegeLearner).toBe(false);
                expect(result.isSchoolLearner).toBe(false);
            });

            it('handles empty string values', () => {
                const result = determinelearnerType({
                    school_id: '',
                    university_college_id: ''
                });
                expect(result.isCollegeLearner).toBe(false);
                expect(result.isSchoolLearner).toBe(false);
            });

            it('prefers university_college_id over college_id when both present', () => {
                const result = determinelearnerType({
                    university_college_id: 'primary-uuid',
                    college_id: 'alias-uuid'
                });
                expect(result.institutionId).toBe('primary-uuid');
            });
        });

        it('should return default values for null or undefined learner', () => {
            const expected = {
                isCollegeLearner: false,
                isSchoolLearner: false,
                educationLevel: null,
                institutionId: null
            };

            expect(determinelearnerType(null)).toEqual(expected);
            expect(determinelearnerType(undefined)).toEqual(expected);
        });
    });

    // Convenience helper tests
    describe('isCollegeLearner helper', () => {
        it('returns true for college learners', () => {
            expect(isCollegeLearner({ role: 'learner' })).toBe(true);
            expect(isCollegeLearner({ university_college_id: 'uuid' })).toBe(true);
            expect(isCollegeLearner({ college_id: 'uuid' })).toBe(true);
        });

        it('returns false for school learners', () => {
            expect(isCollegeLearner({ role: 'learner' })).toBe(false);
            expect(isCollegeLearner({ school_id: 'uuid' })).toBe(false);
        });
    });

    describe('isSchoolLearner helper', () => {
        it('returns true for school learners', () => {
            expect(isSchoolLearner({ role: 'learner' })).toBe(true);
            expect(isSchoolLearner({ school_id: 'uuid' })).toBe(true);
        });

        it('returns false for college learners', () => {
            expect(isSchoolLearner({ role: 'learner' })).toBe(false);
            expect(isSchoolLearner({ university_college_id: 'uuid' })).toBe(false);
        });
    });

    describe('getlearnerEducationLevel helper', () => {
        it('returns correct education levels', () => {
            expect(getlearnerEducationLevel({ role: 'learner' })).toBe(EducationLevel.COLLEGE);
            expect(getlearnerEducationLevel({ grade: '10' })).toBe('highschool');
            expect(getlearnerEducationLevel({ grade: '6' })).toBe('middle');
            expect(getlearnerEducationLevel({ grade: '11' })).toBe('higher_secondary');
        });
    });
});
