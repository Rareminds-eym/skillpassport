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
    users?: { role?: string } | Array<{ role?: string }> | null; // Role from joined users table
    userRole?: string | null; // Direct userRole property from studentSettingsService
}

/**
 * Result of student type detection
 */
export interface StudentTypeInfo {
    isCollegeStudent: boolean;
    isSchoolStudent: boolean;
    isLearner: boolean;
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
            isLearner: false,
            educationLevel: null,
            institutionId: null
        };
    }

    // Normalize college_id alias (some files use college_id, others use university_college_id)
    const collegeId = student.university_college_id || student.college_id;
    const hasCollegeId = Boolean(collegeId);
    const hasSchoolId = Boolean(student.school_id);

    // Extract role from multiple possible sources (priority order):
    // 1. userRole (direct property from studentSettingsService)
    // 2. users.role (from joined users table)
    // 3. role (fallback direct property)
    let userRole: string | null = null;
    
    if (student.userRole) {
        userRole = student.userRole;
    } else if (student.users) {
        if (Array.isArray(student.users) && student.users.length > 0) {
            userRole = student.users[0]?.role || null;
        } else if (typeof student.users === 'object') {
            userRole = (student.users as { role?: string }).role || null;
        }
    } else if (student.role) {
        userRole = student.role;
    }

    // Priority 1: Explicit role from users table
    // Normalize role to handle both 'learner' and potential variations
    const normalizedRole = userRole?.toLowerCase().replace(/[_\s-]/g, '');
    
    if (normalizedRole === 'learner') {
        return {
            isCollegeStudent: false,
            isSchoolStudent: false,
            isLearner: true,
            educationLevel: null,
            institutionId: null
        };
    }

    if (normalizedRole === 'collegestudent') {
        return {
            isCollegeStudent: true,
            isSchoolStudent: false,
            isLearner: false,
            educationLevel: EducationLevel.COLLEGE,
            institutionId: collegeId || null
        };
    }

    if (normalizedRole === 'schoolstudent') {
        const level = getGradeLevelFromGrade(student.grade) as EducationLevel | null;
        return {
            isCollegeStudent: false,
            isSchoolStudent: true,
            isLearner: false,
            educationLevel: level,
            institutionId: student.school_id || null
        };
    }

    // Priority 2: Institution IDs
    if (hasCollegeId && !hasSchoolId) {
        return {
            isCollegeStudent: true,
            isSchoolStudent: false,
            isLearner: false,
            educationLevel: EducationLevel.COLLEGE,
            institutionId: collegeId || null
        };
    }

    if (hasSchoolId && !hasCollegeId) {
        const level = getGradeLevelFromGrade(student.grade) as EducationLevel | null;
        return {
            isCollegeStudent: false,
            isSchoolStudent: true,
            isLearner: false,
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
            isLearner: false,
            educationLevel: EducationLevel.COLLEGE,
            institutionId: collegeId || null
        };
    }

    // Priority 3: No institution IDs - treat as learner
    if (!hasCollegeId && !hasSchoolId) {
        return {
            isCollegeStudent: false,
            isSchoolStudent: false,
            isLearner: true,
            educationLevel: null,
            institutionId: null
        };
    }

    // Priority 4: Grade-based fallback
    const level = getGradeLevelFromGrade(student.grade) as EducationLevel | null;
    const isCollegeLevel = level === EducationLevel.COLLEGE || level === EducationLevel.AFTER_12;

    return {
        isCollegeStudent: isCollegeLevel,
        isSchoolStudent: !isCollegeLevel && level !== null,
        isLearner: false,
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

/**
 * Check if student is a learner (independent, no institution)
 * Convenience wrapper around determineStudentType
 * 
 * @param student - Student data object
 * @returns true if student is identified as learner
 */
export const isLearner = (student: StudentData | null | undefined): boolean =>
    determineStudentType(student).isLearner;
