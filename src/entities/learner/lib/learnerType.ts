/**
 * Learner Type Detection Utilities
 * 
 * Single source of truth for determining learner type.
 * All components should use these utilities instead of inline logic.
 * 
 * @module utils/learnerType
 */

import { getGradeLevelFromGrade } from '@/shared/lib/utils/grade-utils';

/**
 * Learner category - top-level classification
 */
export enum LearnerCategory {
    SCHOOL_STUDENT = 'school_student',      // School learners
    COLLEGE_STUDENT = 'college_student',    // College learners
    PROFESSIONAL = 'professional'           // Working professionals (default if not school or college)
}

/**
 * Education levels in the system
 */
export enum EducationLevel {
    MIDDLE = 'middle',                      // Grades 6-8
    HIGHSCHOOL = 'highschool',              // Grades 9-10
    AFTER_10 = 'after10',                   // Transition: completed 10th, choosing stream
    HIGHER_SECONDARY = 'higher_secondary',  // Grades 11-12
    AFTER_12 = 'after12',                   // Transition: completed 12th, choosing degree
    COLLEGE = 'college'                     // UG/PG learners
}

/**
 * Learner data structure for type detection
 * Supports multiple field name variations used across the codebase
 */
export interface LearnerData {
    university_college_id?: string | null;
    universityCollegeId?: string | null;
    college_id?: string | null;  // Alias used in some files
    collegeId?: string | null;
    school_id?: string | null;
    schoolId?: string | null;
    grade?: string | null;
    role?: string | null;
    program_id?: string | null;
    users?: { role?: string } | Array<{ role?: string }> | null; // Role from joined users table
    userRole?: string | null; // Direct userRole property from learnerSettingsService
    learner_type?: string | null; // Direct learner type from database
    university?: string | null; // Custom university name
    college_school_name?: string | null; // Custom college/school name
}

/**
 * Result of learner type detection
 */
export interface LearnerTypeInfo {
    isCollegeLearner: boolean;
    isSchoolLearner: boolean;
    isLearner: boolean;
    educationLevel: EducationLevel | null;
    institutionId: string | null;
    category: LearnerCategory;  // school_student, college_student, or professional
}

/**
 * Determines learner type using a priority-based detection chain.
 *
 * Priority:
 * 0. Explicit learner_type field ('college_student' or 'school_student')
 * 1. User role (from users table)
 * 2. Institution IDs (university_college_id for college, school_id for school)
 * 3. Grade level (fallback based on grade string)
 *
 * NOTE: Custom names (university, college_school_name) are display values only,
 * NOT used for type detection as they're unreliable indicators.
 *
 * @param learner - Learner data object with relevant fields
 * @returns LearnerTypeInfo with detection results
 *
 * @example
 * // By learner_type field
 * determinelearnerType({ learner_type: 'college_student' })
 * // => { isCollegeLearner: true, ... }
 *
 * @example
 * // By institution ID
 * determinelearnerType({ university_college_id: 'uuid', school_id: null })
 * // => { isCollegeLearner: true, ... }
 *
 * @example
 * // By grade
 * determinelearnerType({ grade: 'Grade 10' })
 * // => { isSchoolLearner: true, educationLevel: 'highschool', ... }
 */
export function determinelearnerType(learner: LearnerData | null | undefined): LearnerTypeInfo {
    if (!learner) {
        return {
            isCollegeLearner: false,
            isSchoolLearner: false,
            isLearner: false,
            educationLevel: null,
            institutionId: null,
            category: LearnerCategory.PROFESSIONAL
        };
    }

    // Priority 0: Check explicit learner_type field (most authoritative)
    // Only check for 'school_student' or 'college_student'
    if (learner.learner_type) {
        const typeStr = String(learner.learner_type).toLowerCase().trim();
        
        if (typeStr === 'school_student' || typeStr === 'school') {
            const level = getGradeLevelFromGrade(learner.grade) as EducationLevel | null;
            return {
                isCollegeLearner: false,
                isSchoolLearner: true,
                isLearner: false,
                educationLevel: level,
                institutionId: learner.school_id || learner.schoolId || null,
                category: LearnerCategory.SCHOOL_STUDENT
            };
        }
        
        if (typeStr === 'college_student' || typeStr === 'college') {
            return {
                isCollegeLearner: true,
                isSchoolLearner: false,
                isLearner: false,
                educationLevel: EducationLevel.COLLEGE,
                institutionId: learner.university_college_id || learner.universityCollegeId || learner.college_id || learner.collegeId || null,
                category: LearnerCategory.COLLEGE_STUDENT
            };
        }
    }

    // Normalize college_id alias (some files use college_id, others use university_college_id)
    const collegeId = learner.university_college_id || learner.universityCollegeId || learner.college_id || learner.collegeId;
    const hasCollegeId = Boolean(collegeId);
    const schoolId = learner.school_id || learner.schoolId;
    const hasSchoolId = Boolean(schoolId);

    // Extract role from multiple possible sources (priority order):
    // 1. userRole (direct property from learnerSettingsService)
    // 2. users.role (from joined users table)
    // 3. role (fallback direct property)
    let userRole: string | null = null;

    if (learner.userRole) {
        userRole = learner.userRole;
    } else if (learner.users) {
        if (Array.isArray(learner.users) && learner.users.length > 0) {
            userRole = learner.users[0]?.role || null;
        } else if (typeof learner.users === 'object') {
            userRole = (learner.users as { role?: string }).role || null;
        }
    } else if (learner.role) {
        userRole = learner.role;
    }

    // Priority 1: Explicit role from users table
    // Normalize role to handle both 'learner' and potential variations
    const normalizedRole = userRole?.toLowerCase().replace(/[_\s-]/g, '');

    if (normalizedRole === 'learner') {
        // All learner subtypes now use the canonical 'learner' role.
        // Entity-type detection (school vs college) is determined by institution IDs below.
        // If no institution ID is present, this is an independent learner.
        if (hasCollegeId) {
            return {
                isCollegeLearner: true,
                isSchoolLearner: false,
                isLearner: false,
                educationLevel: EducationLevel.COLLEGE,
                institutionId: collegeId || null,
                category: LearnerCategory.COLLEGE_STUDENT
            };
        }
        if (hasSchoolId) {
            const level = getGradeLevelFromGrade(learner.grade) as EducationLevel | null;
            return {
                isCollegeLearner: false,
                isSchoolLearner: true,
                isLearner: false,
                educationLevel: level,
                institutionId: schoolId || null,
                category: LearnerCategory.SCHOOL_STUDENT
            };
        }
        return {
            isCollegeLearner: false,
            isSchoolLearner: false,
            isLearner: true,
            educationLevel: null,
            institutionId: null,
            category: LearnerCategory.PROFESSIONAL
        };
    }

    // Priority 2: Institution IDs only (most reliable)
    if (hasCollegeId && !hasSchoolId) {
        return {
            isCollegeLearner: true,
            isSchoolLearner: false,
            isLearner: false,
            educationLevel: EducationLevel.COLLEGE,
            institutionId: collegeId || null,
            category: LearnerCategory.COLLEGE_STUDENT
        };
    }

    if (hasSchoolId && !hasCollegeId) {
        const level = getGradeLevelFromGrade(learner.grade) as EducationLevel | null;
        return {
            isCollegeLearner: false,
            isSchoolLearner: true,
            isLearner: false,
            educationLevel: level,
            institutionId: schoolId || null,
            category: LearnerCategory.SCHOOL_STUDENT
        };
    }

    // Edge case: Both institution IDs present - college takes precedence
    if (hasCollegeId && hasSchoolId) {
        return {
            isCollegeLearner: true,
            isSchoolLearner: false,
            isLearner: false,
            educationLevel: EducationLevel.COLLEGE,
            institutionId: collegeId || null,
            category: LearnerCategory.COLLEGE_STUDENT
        };
    }

    // Priority 3: No institution IDs - treat as learner
    if (!hasCollegeId && !hasSchoolId) {
        return {
            isCollegeLearner: false,
            isSchoolLearner: false,
            isLearner: true,
            educationLevel: null,
            institutionId: null,
            category: LearnerCategory.PROFESSIONAL
        };
    }

    // Priority 4: Grade-based fallback
    const level = getGradeLevelFromGrade(learner.grade) as EducationLevel | null;
    const isCollegeLevel = level === EducationLevel.COLLEGE || level === EducationLevel.AFTER_12;

    return {
        isCollegeLearner: isCollegeLevel,
        isSchoolLearner: !isCollegeLevel && level !== null,
        isLearner: false,
        educationLevel: level,
        institutionId: null,
        category: isCollegeLevel ? LearnerCategory.COLLEGE_STUDENT : LearnerCategory.PROFESSIONAL
    };
}

/**
 * Check if learner is a college learner
 * Convenience wrapper around determinelearnerType
 * 
 * @param learner - Learner data object
 * @returns true if learner is identified as college learner
 */
export const isCollegeLearner = (learner: LearnerData | null | undefined): boolean =>
    determinelearnerType(learner).isCollegeLearner;

/**
 * Check if learner is a school learner
 * Convenience wrapper around determinelearnerType
 * 
 * @param learner - Learner data object
 * @returns true if learner is identified as school learner
 */
export const isSchoolLearner = (learner: LearnerData | null | undefined): boolean =>
    determinelearnerType(learner).isSchoolLearner;

/**
 * Get education level for a learner
 * Convenience wrapper around determinelearnerType
 * 
 * @param learner - Learner data object
 * @returns Education level enum value or null
 */
export const getlearnerEducationLevel = (learner: LearnerData | null | undefined): EducationLevel | null =>
    determinelearnerType(learner).educationLevel;

/**
 * Check if learner is a learner (independent, no institution)
 * Convenience wrapper around determinelearnerType
 * 
 * @param learner - Learner data object
 * @returns true if learner is identified as learner
 */
export const isLearner = (learner: LearnerData | null | undefined): boolean =>
    determinelearnerType(learner).isLearner;

/**
 * Get learner category (school_student, college_student, or professional)
 * 
 * @param learner - Learner data object
 * @returns Learner category
 */
export const getLearnerCategory = (learner: LearnerData | null | undefined): LearnerCategory =>
    determinelearnerType(learner).category;

/**
 * Check if learner is a school student
 * 
 * @param learner - Learner data object
 * @returns true if learner is school_student
 */
export const isSchoolStudent = (learner: LearnerData | null | undefined): boolean =>
    determinelearnerType(learner).category === LearnerCategory.SCHOOL_STUDENT;

/**
 * Check if learner is a college student
 * 
 * @param learner - Learner data object
 * @returns true if learner is college_student
 */
export const isCollegeStudent = (learner: LearnerData | null | undefined): boolean =>
    determinelearnerType(learner).category === LearnerCategory.COLLEGE_STUDENT;

/**
 * Check if learner is a professional
 * 
 * @param learner - Learner data object
 * @returns true if learner is professional
 */
export const isProfessional = (learner: LearnerData | null | undefined): boolean =>
    determinelearnerType(learner).category === LearnerCategory.PROFESSIONAL;
