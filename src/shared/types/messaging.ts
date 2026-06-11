/**
 * Shared messaging types
 * These types are used across multiple layers and belong in shared
 */

/**
 * All supported user roles in the messaging system.
 *
 * Re-export shim: `UserRole` is canonically defined ONCE in the generated
 * module (src/shared/types/generated/roles.ts). See Phase P1, task 6.2.
 */
export type { UserRole } from '@/shared/types/generated/roles';

/**
 * All supported conversation types between users
 */
export type ConversationType =
    | 'learner_recruiter'
    | 'learner_educator'
    | 'educator_recruiter'
    | 'learner_admin'
    | 'learner_college_admin'
    | 'learner_college_educator'
    | 'educator_admin'
    | 'college_educator_admin';
