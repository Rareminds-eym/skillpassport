/**
 * Maps SSO roles to organization member roles
 * SSO roles come from the auth system and need to be mapped to the local schema
 */

/**
 * Set of SSO roles that identify learners
 */
export const LEARNER_SSO_ROLES = new Set([
  'learner',
  'student',
]);

/**
 * Maps an array of SSO roles to a single organization member role
 * Organization member roles are constrained to: 'owner', 'admin', 'member'
 */
export function mapRolesToOrgMemberRole(roles: string[]): 'owner' | 'admin' | 'member' {
  // Check for the highest priority role first
  if (roles.some(r => r === 'owner' || r === 'org_owner')) {
    return 'owner';
  }
  
  if (roles.some(r => r === 'admin' || r === 'org_admin' || r === 'college_admin')) {
    return 'admin';
  }
  
  // Default to member for everyone else (including learners)
  return 'member';
}
