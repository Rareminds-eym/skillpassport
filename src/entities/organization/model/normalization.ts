/**
 * Data normalization utilities for Organization entity
 */

import type { NormalizedPoolMemberAssignment, PoolAssignmentRawItem } from './types';

/**
 * Normalizes raw pool assignment API item into a clean domain object.
 */
export function normalizePoolMemberAssignment(item: PoolAssignmentRawItem): NormalizedPoolMemberAssignment {
  const userObj = item.user || item.users || {};
  const firstName = userObj.first_name || userObj.firstName;
  const lastName = userObj.last_name || userObj.lastName;
  const combinedName = [firstName, lastName].filter(Boolean).join(' ');

  const name =
    item.full_name ||
    item.name ||
    userObj.full_name ||
    userObj.name ||
    (combinedName.length > 0 ? combinedName : undefined) ||
    userObj.email ||
    item.email ||
    'Learner';

  const email = userObj.email || item.email || '';

  return {
    id: item.user_id,
    name,
    email,
    assignedAt: item.assigned_at,
    licenseAssignmentId: item.id,
  };
}
