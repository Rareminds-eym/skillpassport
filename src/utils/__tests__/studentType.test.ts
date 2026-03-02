import { describe, it, expect } from 'vitest';
import {
    determineStudentType,
    isCollegeStudent,
    isSchoolStudent,
    getStudentEducationLevel,
    EducationLevel
} from '../studentType';

describe('studentType utilities', () => {
    describe('determineStudentType', () => {
        // Priority 1: Role-based detection
        describe('role-based detection (highest priority)', () => {
            it('identifies college student by role', () => {
                const result = determineStudentType({ role: 'college_student' });
                expect(result.isCollegeStudent).toBe(true);
                expect(result.isSchoolStudent).toBe(false);
                expect(result.educationLevel).toBe(EducationLevel.COLLEGE);
            });

            it('identifies school student by role', () => {
                const result = determineStudentType({ role: 'school_student', grade: '10' });
                expect(result.isCollegeStudent).toBe(false);
                expect(result.isSchoolStudent).toBe(true);
                expect(result.educationLevel).toBe('highschool');
            });

            it('role takes precedence over institution IDs', () => {
                const result = determineStudentType({
                    role: 'college_student',
                    school_id: 'school-uuid-123'
                });
                expect(result.isCollegeStudent).toBe(true);
                expect(result.isSchoolStudent).toBe(false);
            });

            it('school_student role takes precedence over college IDs', () => {
                const result = determineStudentType({
                    role: 'school_student',
                    university_college_id: 'college-uuid-123',
                    grade: '10'
                });
                expect(result.isCollegeStudent).toBe(false);
                expect(result.isSchoolStudent).toBe(true);
            });
        });

        // Priority 2: Institution ID-based detection
        describe('institution ID-based detection', () => {
            it('identifies college student by university_college_id', () => {
                const result = determineStudentType({ university_college_id: 'uuid-123' });
                expect(result.isCollegeStudent).toBe(true);
                expect(result.isSchoolStudent).toBe(false);
                expect(result.institutionId).toBe('uuid-123');
            });

            it('identifies college student by college_id alias', () => {
                const result = determineStudentType({ college_id: 'uuid-123' });
                expect(result.isCollegeStudent).toBe(true);
                expect(result.isSchoolStudent).toBe(false);
                expect(result.institutionId).toBe('uuid-123');
            });

            it('identifies school student by school_id', () => {
                const result = determineStudentType({ school_id: 'school-uuid-123' });
                expect(result.isCollegeStudent).toBe(false);
                expect(result.isSchoolStudent).toBe(true);
                expect(result.institutionId).toBe('school-uuid-123');
            });

            it('college takes precedence when both IDs present', () => {
                const result = determineStudentType({
                    school_id: 'school-uuid',
                    university_college_id: 'college-uuid'
                });
                expect(result.isCollegeStudent).toBe(true);
                expect(result.isSchoolStudent).toBe(false);
                expect(result.institutionId).toBe('college-uuid');
            });
        });

        // Priority 3: Grade-based fallback
        describe('grade-based fallback', () => {
            it('returns higher_secondary for grade 12', () => {
                const result = determineStudentType({ grade: '12' });
                // Grade 12 is higher secondary - still a school student
                expect(result.isCollegeStudent).toBe(false);
                expect(result.isSchoolStudent).toBe(true);
                expect(result.educationLevel).toBe('higher_secondary');
            });
            it('returns school for highschool grades', () => {
                const result = determineStudentType({ grade: '10' });
                expect(result.isSchoolStudent).toBe(true);
                expect(result.educationLevel).toBe('highschool');
            });

            it('returns school for middle school grades', () => {
                const result = determineStudentType({ grade: '6' });
                expect(result.isSchoolStudent).toBe(true);
                expect(result.educationLevel).toBe('middle');
            });

            it('returns unknown for no data', () => {
                const result = determineStudentType({});
                expect(result.isCollegeStudent).toBe(false);
                expect(result.isSchoolStudent).toBe(false);
                expect(result.educationLevel).toBeNull();
            });
        });

        // Edge cases
        describe('edge cases', () => {
            it('handles null values gracefully', () => {
                const result = determineStudentType({
                    school_id: null,
                    university_college_id: null,
                    grade: null
                });
                expect(result.isCollegeStudent).toBe(false);
                expect(result.isSchoolStudent).toBe(false);
            });

            it('handles empty string values', () => {
                const result = determineStudentType({
                    school_id: '',
                    university_college_id: ''
                });
                expect(result.isCollegeStudent).toBe(false);
                expect(result.isSchoolStudent).toBe(false);
            });

            it('prefers university_college_id over college_id when both present', () => {
                const result = determineStudentType({
                    university_college_id: 'primary-uuid',
                    college_id: 'alias-uuid'
                });
                expect(result.institutionId).toBe('primary-uuid');
            });
        });

        it('should return default values for null or undefined student', () => {
            const expected = {
                isCollegeStudent: false,
                isSchoolStudent: false,
                educationLevel: null,
                institutionId: null
            };

            expect(determineStudentType(null)).toEqual(expected);
            expect(determineStudentType(undefined)).toEqual(expected);
        });
    });

    // Convenience helper tests
    describe('isCollegeStudent helper', () => {
        it('returns true for college students', () => {
            expect(isCollegeStudent({ role: 'college_student' })).toBe(true);
            expect(isCollegeStudent({ university_college_id: 'uuid' })).toBe(true);
            expect(isCollegeStudent({ college_id: 'uuid' })).toBe(true);
        });

        it('returns false for school students', () => {
            expect(isCollegeStudent({ role: 'school_student' })).toBe(false);
            expect(isCollegeStudent({ school_id: 'uuid' })).toBe(false);
        });
    });

    describe('isSchoolStudent helper', () => {
        it('returns true for school students', () => {
            expect(isSchoolStudent({ role: 'school_student' })).toBe(true);
            expect(isSchoolStudent({ school_id: 'uuid' })).toBe(true);
        });

        it('returns false for college students', () => {
            expect(isSchoolStudent({ role: 'college_student' })).toBe(false);
            expect(isSchoolStudent({ university_college_id: 'uuid' })).toBe(false);
        });
    });

    describe('getStudentEducationLevel helper', () => {
        it('returns correct education levels', () => {
            expect(getStudentEducationLevel({ role: 'college_student' })).toBe(EducationLevel.COLLEGE);
            expect(getStudentEducationLevel({ grade: '10' })).toBe('highschool');
            expect(getStudentEducationLevel({ grade: '6' })).toBe('middle');
            expect(getStudentEducationLevel({ grade: '11' })).toBe('higher_secondary');
        });
    });
});
