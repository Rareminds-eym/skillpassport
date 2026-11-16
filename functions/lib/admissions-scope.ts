import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveAdminOrganizationId } from './hybrid-features';

export interface AdmissionsActor { id: string; roles?: readonly string[]; org_id?: string }
const ENROLLMENT_ROLES = {
  college: ['college_admin', 'college_educator'],
  school: ['school_admin', 'school_educator', 'educator'],
} as const;
type InstitutionType = keyof typeof ENROLLMENT_ROLES;

/** Verified institution roles include the endpoint's existing educator callers. */
export async function resolveAdmissionsScope(db: SupabaseClient, actor: AdmissionsActor, requestedId?: string) {
  const allowedTypes = (Object.keys(ENROLLMENT_ROLES) as InstitutionType[])
    .filter(type => ENROLLMENT_ROLES[type].some(role => actor.roles?.includes(role)));
  let type: InstitutionType;
  if (actor.org_id) {
    const { data: org, error } = await db.from('organizations').select('id, organization_type').eq('id', actor.org_id).maybeSingle();
    if (error || !org || !allowedTypes.includes(org.organization_type)) throw new Error('Institution enrollment access is required');
    type = org.organization_type;
  } else {
    if (allowedTypes.length !== 1) throw new Error('An unambiguous institution enrollment role is required');
    type = allowedTypes[0];
  }
  // Body IDs may assert the resolved tenant; they never select it.
  const organizationId = await resolveAdminOrganizationId(db, actor.id, type, actor.org_id);
  if (!organizationId || (requestedId && requestedId !== organizationId)) throw new Error('Organization access denied');
  return { organizationId, type };
}
