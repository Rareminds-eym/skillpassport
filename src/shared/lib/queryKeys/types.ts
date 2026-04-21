/**
 * Base query key type - all keys start with a domain string
 */
export type QueryKey = readonly [string, ...any[]];

/**
 * User type discriminator for messaging queries
 */
export type UserType =
    | 'student'
    | 'recruiter'
    | 'educator'
    | 'admin'
    | 'school_admin'
    | 'college_admin'
    | 'college_lecturer';

/**
 * Conversation type discriminator
 */
export type ConversationType =
    | 'student_recruiter'
    | 'student_educator'
    | 'student_admin'
    | 'student_college_admin'
    | 'student_college_educator'
    | 'educator_admin'
    | 'college_educator_admin';

/**
 * Archive status for conversation queries
 */
export type ArchiveStatus = 'active' | 'archived' | 'all';
