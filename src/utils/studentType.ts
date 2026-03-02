/**
 * Student Type Detection Utilities
 * 
 * Single source of truth for determining student type.
 * All components should use these utilities instead of inline logic.
 * 
 * @module utils/studentType
 */

import { getGradeLevelFromGrade } from '../features/assessment/utils/gradeUtils';

/**
 * Education levels in the system
 */
export enum EducationLevel {
    MIDDLE = 'middle',                      // Grades 6-8
    HIGHSCHOOL = 'highschool',              // Grades 9-10
    AFTER_10 = 'after10',                   // Transition: completed 10th, choosing stream
    HIGHER_SECONDARY = 'higher_secondary',  // Grades 11-12
    AFTER_12 = 'after12',                   // Transition: completed 12th, choosing degree
    COLLEGE = 'college'                     // UG/PG students
}

/**
 * Student data structure for type detection
 * Supports multiple field name variations used across the codebase
 */
export interface StudentData {
    university_college_id?: string | null;
    college_id?: string | null;  // Alias used in some files
    school_id?: string | null;
    grade?: string | null;
    role?: string | null;
    program_id?: string | null;
}

/**
 * Result of student type detection
 */
export interface StudentTypeInfo {
    isCollegeStudent: boolean;
    isSchoolStudent: boolean;
    educationLevel: EducationLevel | null;
    institutionId: string | null;
}

/**
 * Determines student type using a priority-based detection chain.
 * 
 * Priority:
 * 1. User role (most authoritative - from users table)
 * 2. Institution IDs (university_college_id / school_id)
 * 3. Grade level (fallback based on grade string)
 * 
 * @param student - Student data object with relevant fields
 * @returns StudentTypeInfo with detection results
 * 
 * @example
 * // By role
 * determineStudentType({ role: 'college_student' })
 * // => { isCollegeStudent: true, isSchoolStudent: false, ... }
 * 
 * @example
 * // By institution ID
 * determineStudentType({ university_college_id: 'uuid', school_id: null })
 * // => { isCollegeStudent: true, ... }
 * 
 * @example
 * // By grade
 * determineStudentType({ grade: 'Grade 10' })
 * // => { isSchoolStudent: true, educationLevel: 'highschool', ... }
 */
export function determineStudentType(student: StudentData | null | undefined): StudentTypeInfo {
    if (!student) {
        return {
            isCollegeStudent: false,
            isSchoolStudent: false,
            educationLevel: null,
            institutionId: null
        };
    }

    // Normalize college_id alias (some files use college_id, others use university_college_id)
    const collegeId = student.university_college_id || student.college_id;
    const hasCollegeId = Boolean(collegeId);
    const hasSchoolId = Boolean(student.school_id);

    // Priority 1: Explicit role from users table
    if (student.role === 'college_student') {
        return {
            isCollegeStudent: true,
            isSchoolStudent: false,
            educationLevel: EducationLevel.COLLEGE,
            institutionId: collegeId || null
        };
    }

    if (student.role === 'school_student') {
        const level = getGradeLevelFromGrade(student.grade) as EducationLevel | null;
        return {
            isCollegeStudent: false,
            isSchoolStudent: true,
            educationLevel: level,
            institutionId: student.school_id || null
        };
    }

    // Priority 2: Institution IDs
    if (hasCollegeId && !hasSchoolId) {
        return {
            isCollegeStudent: true,
            isSchoolStudent: false,
            educationLevel: EducationLevel.COLLEGE,
            institutionId: collegeId || null
        };
    }

    if (hasSchoolId && !hasCollegeId) {
        const level = getGradeLevelFromGrade(student.grade) as EducationLevel | null;
        return {
            isCollegeStudent: false,
            isSchoolStudent: true,
            educationLevel: level,
            institutionId: student.school_id || null
        };
    }

    // Edge case: Both IDs present - college takes precedence
    // This handles students who may have transferred from school to college
    if (hasCollegeId && hasSchoolId) {
        return {
            isCollegeStudent: true,
            isSchoolStudent: false,
            educationLevel: EducationLevel.COLLEGE,
            institutionId: collegeId || null
        };
    }

    // Priority 3: Grade-based fallback (no institution IDs or role)
    const level = getGradeLevelFromGrade(student.grade) as EducationLevel | null;
    const isCollegeLevel = level === EducationLevel.COLLEGE || level === EducationLevel.AFTER_12;

    return {
        isCollegeStudent: isCollegeLevel,
        isSchoolStudent: !isCollegeLevel && level !== null,
        educationLevel: level,
        institutionId: null
    };
}

/**
 * Check if student is a college student
 * Convenience wrapper around determineStudentType
 * 
 * @param student - Student data object
 * @returns true if student is identified as college student
 */
export const isCollegeStudent = (student: StudentData | null | undefined): boolean =>
    determineStudentType(student).isCollegeStudent;

/**
 * Check if student is a school student
 * Convenience wrapper around determineStudentType
 * 
 * @param student - Student data object
 * @returns true if student is identified as school student
 */
export const isSchoolStudent = (student: StudentData | null | undefined): boolean =>
    determineStudentType(student).isSchoolStudent;

/**
 * Get education level for a student
 * Convenience wrapper around determineStudentType
 * 
 * @param student - Student data object
 * @returns Education level enum value or null
 */
export const getStudentEducationLevel = (student: StudentData | null | undefined): EducationLevel | null =>
    determineStudentType(student).educationLevel;
