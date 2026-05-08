/**
 * Learner Type Detection Utilities
 * 
 * Single source of truth for determining learner type.
 * All components should use these utilities instead of inline logic.
 * 
 * @module utils/learnerType
 */

import { getGradeLevelFromGrade } from '@/shared/lib/utils/gradeUtils';

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
    college_id?: string | null;  // Alias used in some files
    school_id?: string | null;
    grade?: string | null;
    role?: string | null;
    program_id?: string | null;
    users?: { role?: string } | Array<{ role?: string }> | null; // Role from joined users table
    userRole?: string | null; // Direct userRole property from learnerSettingsService
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
}

/**
 * Determines learner type using a priority-based detection chain.
 * 
 * Priority:
 * 1. User role (most authoritative - from users table)
 * 2. Institution IDs (university_college_id / school_id)
 * 3. Grade level (fallback based on grade string)
 * 
 * @param learner - Learner data object with relevant fields
 * @returns LearnerTypeInfo with detection results
 * 
 * @example
 * // By role
 * determinelearnerType({ role: 'learner' })
 * // => { isCollegeLearner: true, isSchoolLearner: false, ... }
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
            institutionId: null
        };
    }

    // Normalize college_id alias (some files use college_id, others use university_college_id)
    const collegeId = learner.university_college_id || learner.college_id;
    const hasCollegeId = Boolean(collegeId);
    const hasSchoolId = Boolean(learner.school_id);

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
        return {
            isCollegeLearner: false,
            isSchoolLearner: false,
            isLearner: true,
            educationLevel: null,
            institutionId: null
        };
    }

    if (normalizedRole === 'collegelearner') {
        return {
            isCollegeLearner: true,
            isSchoolLearner: false,
            isLearner: false,
            educationLevel: EducationLevel.COLLEGE,
            institutionId: collegeId || null
        };
    }

    if (normalizedRole === 'schoollearner') {
        const level = getGradeLevelFromGrade(learner.grade) as EducationLevel | null;
        return {
            isCollegeLearner: false,
            isSchoolLearner: true,
            isLearner: false,
            educationLevel: level,
            institutionId: learner.school_id || null
        };
    }

    // Priority 2: Institution IDs
    if (hasCollegeId && !hasSchoolId) {
        return {
            isCollegeLearner: true,
            isSchoolLearner: false,
            isLearner: false,
            educationLevel: EducationLevel.COLLEGE,
            institutionId: collegeId || null
        };
    }

    if (hasSchoolId && !hasCollegeId) {
        const level = getGradeLevelFromGrade(learner.grade) as EducationLevel | null;
        return {
            isCollegeLearner: false,
            isSchoolLearner: true,
            isLearner: false,
            educationLevel: level,
            institutionId: learner.school_id || null
        };
    }

    // Edge case: Both IDs present - college takes precedence
    // This handles learners who may have transferred from school to college
    if (hasCollegeId && hasSchoolId) {
        return {
            isCollegeLearner: true,
            isSchoolLearner: false,
            isLearner: false,
            educationLevel: EducationLevel.COLLEGE,
            institutionId: collegeId || null
        };
    }

    // Priority 3: No institution IDs - treat as learner
    if (!hasCollegeId && !hasSchoolId) {
        return {
            isCollegeLearner: false,
            isSchoolLearner: false,
            isLearner: true,
            educationLevel: null,
            institutionId: null
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
        institutionId: null
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
