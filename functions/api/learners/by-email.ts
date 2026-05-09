/**
 * Learners By-Email API
 *
 * GET /api/learners/by-email?email=...
 *
 * Full learner profile fetch by email with all relations.
 * Uses service_role to bypass RLS. Requires SSO authentication.
 */
import { withAuth } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const user = context.data.user;

  const url = new URL(context.request.url);
  const email = url.searchParams.get('email');

  if (!email) {
    return Response.json({ success: false, data: null, error: 'Email is required' }, { status: 400 });
  }

  // Security: only allow fetching your own data (unless admin)
  const isAdmin = user.roles?.some((r: string) =>
    ['admin', 'super_admin', 'org_admin', 'college_admin', 'university_admin'].includes(r)
  );
  if (!isAdmin && user.email !== email) {
    return Response.json({ success: false, data: null, error: 'Unauthorized: can only fetch your own profile' }, { status: 403 });
  }

  try {
    const { data, error } = await supabase
      .from('learners')
      .select(`
        *,
        users!fk_learners_user (
          role
        ),
        school:organizations!learners_school_id_fkey (
          id,
          name,
          code,
          city,
          state,
          organization_type
        ),
        college:organizations!learners_college_id_fkey (
          id,
          name,
          code,
          city,
          state,
          organization_type
        ),
        university:organizations!learners_universityid_fkey (
          id,
          name,
          code,
          city,
          state,
          organization_type
        ),
        university_colleges:university_college_id (
          id,
          name,
          code,
          university:organizations!university_colleges_university_id_fkey (
            id,
            name,
            city,
            state,
            organization_type
          )
        ),
        skill_passports (
          id,
          projects,
          certificates,
          assessments,
          status,
          aiVerification,
          nsqfLevel,
          skills,
          createdAt,
          updatedAt
        ),
        projects (
          id,
          title,
          description,
          role,
          status,
          start_date,
          end_date,
          duration,
          organization,
          tech_stack,
          demo_link,
          github_link,
          enabled,
          approval_status,
          created_at,
          updated_at,
          certificate_url,
          video_url,
          ppt_url
        ),
        certificates (*),
        experience (*),
        skills(*),
        trainings (*),
        education (*)
      `)
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('[LearnersByEmail] Supabase error:', error);
      return Response.json({ success: false, data: null, error: error.message }, { status: 200 });
    }

    if (!data) {
      return Response.json({ success: false, data: null, error: 'No data found for this email.' }, { status: 200 });
    }

    return Response.json({ success: true, data, error: null }, { status: 200 });
  } catch (err) {
    console.error('[LearnersByEmail] Error:', err);
    return Response.json(
      { success: false, data: null, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 200 }
    );
  }
});
