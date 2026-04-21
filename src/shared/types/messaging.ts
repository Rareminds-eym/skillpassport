/**
 * Shared messaging types
 * These types are used across multiple layers and belong in shared
 */

/**
 * All supported user roles in the messaging system
 */
export type UserRole =
    | 'student'
    | 'recruiter'
    | 'educator'
    | 'college_educator'
    | 'school_admin'
    | 'college_admin'
    | 'university_admin';

/**
 * All supported conversation types between users
 */
export type ConversationType =
    | 'student_recruiter'
    | 'student_educator'
    | 'educator_recruiter'
    | 'student_admin'
    | 'student_college_admin'
    | 'student_college_educator'
    | 'educator_admin'
    | 'college_educator_admin';
