/**
 * Base query key type - all keys start with a domain string
 */
export type QueryKey = readonly [string, ...any[]];

/**
 * User type discriminator for messaging queries
 */
export type UserType =
    | 'learner'
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
    | 'learner_recruiter'
    | 'learner_educator'
    | 'learner_admin'
    | 'learner_college_admin'
    | 'learner_college_educator'
    | 'educator_admin'
    | 'college_educator_admin';

/**
 * Archive status for conversation queries
 */
export type ArchiveStatus = 'active' | 'archived' | 'all';
