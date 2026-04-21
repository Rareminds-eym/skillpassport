export { studentKeys } from './student';
export { educatorKeys } from './educator';
export { collegeKeys } from './college';
export { recruiterKeys } from './recruiter';
export { analyticsKeys } from './analytics';
export { coursesKeys } from './courses';
export { subscriptionKeys } from './subscription';
export { messagesKeys } from './messages';

export type { QueryKey, UserType, ConversationType, ArchiveStatus } from './types';

import { studentKeys } from './student';
import { educatorKeys } from './educator';
import { collegeKeys } from './college';
import { recruiterKeys } from './recruiter';
import { analyticsKeys } from './analytics';
import { coursesKeys } from './courses';
import { subscriptionKeys } from './subscription';
import { messagesKeys } from './messages';

/**
 * Centralized query key factory for React Query
 * 
 * @description
 * This factory provides type-safe, consistent query keys organized by domain.
 * All keys are readonly tuples to prevent accidental mutation.
 * 
 * @example
 * // Basic usage
 * import { queryKeys } from '@/shared/lib/queryKeys';
 * 
 * useQuery({
 *   queryKey: queryKeys.student.messages.conversation(conversationId),
 *   queryFn: fetchMessages,
 * });
 * 
 * @example
 * // Cache invalidation - specific query
 * queryClient.invalidateQueries({ 
 *   queryKey: queryKeys.student.messages.conversation(conversationId) 
 * });
 * 
 * @example
 * // Cache invalidation - all student messages
 * queryClient.invalidateQueries({ 
 *   queryKey: queryKeys.student.messages.all 
 * });
 * 
 * @example
 * // Cache invalidation - all student queries
 * queryClient.invalidateQueries({ 
 *   queryKey: queryKeys.student.all 
 * });
 * 
 * @example
 * // With optional parameters
 * queryKeys.educator.conversations.byEducator(educatorId, 'active');
 * queryKeys.analytics.diversity.data(orgId, { gender: 'all' });
 */
export const queryKeys = {
    student: studentKeys,
    educator: educatorKeys,
    college: collegeKeys,
    recruiter: recruiterKeys,
    analytics: analyticsKeys,
    courses: coursesKeys,
    subscription: subscriptionKeys,
    messages: messagesKeys,
} as const;
