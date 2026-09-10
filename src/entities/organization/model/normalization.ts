/**
 * Data normalization utilities for Organization entity
 */

import { getLogger } from '@/shared/config/logging';
import type { NormalizedPoolMemberAssignment, PoolAssignmentRawItem } from './types';

const logger = getLogger('organization');

/**
 * Normalizes raw pool assignment API item into a clean domain object.
 */
export function normalizePoolMemberAssignment(item: PoolAssignmentRawItem): NormalizedPoolMemberAssignment {
  const userObj = item.user || item.users || {};
  const firstName = userObj.first_name || userObj.firstName;
  const lastName = userObj.last_name || userObj.lastName;
  const combinedName = [firstName, lastName].filter(Boolean).join(' ');

  const primaryName =
    item.full_name ||
    item.name ||
    userObj.full_name ||
    userObj.name ||
    (combinedName.length > 0 ? combinedName : undefined);

  // Surface upstream data-quality problems when we have to fall back to
  // email or a hardcoded placeholder for the display name.
  const name = primaryName || userObj.email || item.email || 'Learner';
  if (!primaryName) {
    logger.warn(
      `Pool assignment for user ${item.user_id} is missing a name; fell back to "${name}". Check the source record.`
    );
  }

  const email = userObj.email || item.email || '';

  return {
    id: item.user_id,
    name,
    email,
    assignedAt: item.assigned_at,
    licenseAssignmentId: item.id,
  };
}
