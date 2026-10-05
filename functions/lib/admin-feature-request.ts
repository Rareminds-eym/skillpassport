import type { SupabaseClient } from '@supabase/supabase-js';
import { ADMIN_FEATURE_POLICIES } from './admin-feature-policies';
import { ADMIN_TABLE_FEATURES } from './admin-table-features';
import { requireHybridFeature, type AdminOrganizationType } from './hybrid-features';
import { apiError } from './response';

// Shared college-admin handlers are also used by school/university dashboards.
const ROLE_KEYS: Record<string, Record<string, string>> = {
  school: {
    admissions_data: 'admissions', enrolled_learners: 'admissions', learner_attendance: 'attendance_reports',
    faculty: 'teachers', departments: 'class_management', user_management: 'teachers',
    program_sections: 'class_management', programs: 'class_management', course_mapping: 'curriculum_builder',
    exam_management: 'exams_assessments', finance: 'fee_setup_payments', library: 'library_assets',
    reports_analytics: 'skills_reports', circulars: 'parent_communication',
  },
  university: {
    admissions_data: 'enrollment_profiles', enrolled_learners: 'enrollment_profiles',
    digital_portfolio: 'digital_portfolios', faculty: 'faculty_empanelment', departments: 'program_allocation',
    programs: 'program_allocation', program_sections: 'program_allocation', course_mapping: 'program_allocation',
    curriculum_builder: 'syllabus_approval', exam_management: 'examination_scheduling',
    finance: 'fee_structures', library: 'library_management', reports_analytics: 'district_college_reports',
    placement_status: 'placement_readiness', circulars: 'circulars_notices',
  },
};

const DEFAULT_FEATURES: Record<string, readonly string[]> = {
  assessments: ['exam_management'], exams: ['exam_management'], marks: ['exam_management'],
  finance: ['finance'], library: ['library'], reports: ['reports_analytics'], attendance: ['learner_attendance'],
  'course-analytics': ['basic_analytics'], 'college-circulars': ['circulars'], circulars: ['circulars'],
  events: ['events'], 'lesson-plans': ['lesson_plans'], admissions: ['admissions_data'],
  'digital-portfolio': ['digital_portfolio'], curriculum: ['curriculum_builder'], mentors: ['mentors'],
  'school-finance': ['fee_setup_payments'], 'school-library': ['library_assets'],
};

/** null is explicitly ungated; [] denies Hybrid; groups are AND, keys within a group are OR. */
export function resolveAdminFeaturePolicy(
  pathname: string, action: string | undefined, body: Record<string, any>, type: AdminOrganizationType,
): readonly (readonly string[])[] | null {
  const segments = pathname.replace(/\/$/, '').split('/').filter(Boolean);
  if (segments[0] !== 'api' || !['college-admin', 'school-admin', 'university-admin'].includes(segments[1])) return null;
  const group = segments[1];
  let module = segments[2] || '[[path]]';
  if (module === 'placement' || module === 'recruiter-pipeline') return [[type === 'university' ? 'placement_readiness' : 'placement_status']];
  if (group === 'university-admin' && !ADMIN_FEATURE_POLICIES[`${group}/${module}`]) module = 'actions';
  const translate = (keys: readonly string[]) => keys.map(key => ROLE_KEYS[type]?.[key] || key);

  if (action && ['query-table', 'count-table', 'insert-table', 'update-table', 'delete-table', 'upsert-table'].includes(action)) {
    const table = typeof body.table === 'string' ? body.table : '';
    const write = !['query-table', 'count-table'].includes(action);
    const permission = ADMIN_TABLE_FEATURES[table];
    if (!permission) return [[]];
    const groups: string[][] = [translate(permission[write ? 'write' : 'read'])];
    const select = body.select_columns;
    if (select != null && typeof select !== 'string') return [[]];
    // Embedded resources also need their own grant. Do not let an allowed
    // table become a tunnel to a restricted table through a PostgREST join.
    for (const match of (select || '').matchAll(/(?:[\w]+:)?([\w]+)(?:![\w]+)*\s*\(/g)) {
      const related = ADMIN_TABLE_FEATURES[match[1]];
      if (!related) return [[]];
      groups.push(translate(related.read));
    }
    return groups;
  }

  const policy = ADMIN_FEATURE_POLICIES[`${group}/${module}`] || ADMIN_FEATURE_POLICIES[`${group}/[[path]]`];
  if (action && policy && Object.prototype.hasOwnProperty.call(policy, action)) {
    const keys = policy[action];
    return keys === null ? null : [translate(keys)];
  }
  // GET handlers without action dispatch still expose protected data.
  if (!action && DEFAULT_FEATURES[module]) return [translate(DEFAULT_FEATURES[module])];
  return [[]];
}

export async function requireAdminRequestFeature(
  supabase: SupabaseClient, request: Request,
  user: { sub: string; org_id?: string; roles?: readonly string[] },
): Promise<Response | null> {
  const url = new URL(request.url);
  if (!/^\/api\/(college-admin|school-admin|university-admin)(\/|$)/.test(url.pathname)) return null;
  const type = (['college', 'school', 'university'] as const).find(t => user.roles?.includes(`${t}_admin`));
  // These legacy endpoints also serve learners/educators. Admin nav grants
  // apply to admin callers, without changing the other roles' entitlements.
  if (!type) return null;
  let body: Record<string, any> = {};
  try {
    if (['GET', 'HEAD'].includes(request.method)) {
      for (const [key, value] of url.searchParams) {
        try { body[key] = JSON.parse(value); } catch { body[key] = value; }
      }
    } else if (request.headers.get('content-type')?.includes('multipart/form-data')) {
      const data = await request.clone().formData();
      body = { action: data.get('action') };
    } else if (request.headers.get('content-type')?.includes('application/json')) {
      body = await request.clone().json();
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Invalid body');
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid request body', request);
  }
  const policy = resolveAdminFeaturePolicy(url.pathname, body.action, body, type);
  if (policy === null) return null;
  for (const keys of policy) {
    const denied = await requireHybridFeature(supabase, request, type, keys, user.sub, user.org_id);
    if (denied) return denied;
  }
  return null;
}
