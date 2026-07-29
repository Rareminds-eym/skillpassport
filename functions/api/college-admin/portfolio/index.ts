import { withAuth, getContextUser } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiDbError, apiError, apiMethodNotAllowed } from '../../../lib/response';

async function getPortfolioByEmail(supabase: ReturnType<typeof getServiceClient>, email: string) {
  const { data: learner, error: learnerError } = await supabase
    .from('learners')
    .select(`
      *,
      school:organizations!learners_school_id_fkey (id, name, code, city, state, organization_type),
      college:organizations!learners_college_id_fkey (id, name, code, city, state, organization_type),
      universityInfo:organizations!learners_universityid_fkey (id, name, code, state, city, website, organization_type),
      university_colleges:university_college_id (id, name, code, university:organizations!university_colleges_university_id_fkey (id, name, state, city, organization_type))
    `)
    .eq('email', email)
    .maybeSingle();

  if (learnerError) return { error: learnerError };
  if (!learner) return { error: null, notFound: true };

  if (learner.school_id && !learner.school) {
    const { data: schoolData } = await supabase
      .from('organizations')
      .select('id, name, code, city, state, organization_type')
      .eq('id', learner.school_id)
      .single();
    if (schoolData) learner.school = schoolData;
  }

  if (learner.college_id && !learner.college) {
    const { data: collegeData } = await supabase
      .from('organizations')
      .select('id, name, code, city, state, organization_type')
      .eq('id', learner.college_id)
      .single();
    if (collegeData) learner.college = collegeData;
  }

  const userId = learner.id;

  const [
    skillsResult,
    trainingsResult,
    projectsResult,
    certificatesResult,
    educationResult,
    experienceResult,
    achievementsResult,
    pendingSkillsResult,
    pendingEducationResult,
    pendingProjectsResult,
    pendingAchievementsResult
  ] = await Promise.all([
    supabase.from('skills').select('*').eq('learner_id', userId).in('approval_status', ['verified', 'approved']).eq('enabled', true).order('created_at', { ascending: false }),
    supabase.from('trainings').select('*').eq('learner_id', userId).eq('enabled', true).in('approval_status', ['verified', 'approved']).order('start_date', { ascending: false }),
    supabase.from('projects').select('*').eq('learner_id', userId).eq('enabled', true).in('approval_status', ['verified', 'approved']).order('start_date', { ascending: false }),
    supabase.from('certificates').select('*').eq('learner_id', userId).eq('enabled', true).in('approval_status', ['verified', 'approved']).order('issued_on', { ascending: false }),
    supabase.from('education').select('*').eq('learner_id', userId).eq('enabled', true).in('approval_status', ['verified', 'approved']).order('year_of_passing', { ascending: false }),
    supabase.from('experience').select('*').eq('learner_id', userId).eq('enabled', true).in('approval_status', ['verified', 'approved']).order('start_date', { ascending: false }),
    supabase.from('achievements').select('*').eq('learner_id', userId).eq('enabled', true).in('approval_status', ['verified', 'approved']).order('created_at', { ascending: false }),
    supabase.from('skills').select('*').eq('learner_id', userId).eq('approval_status', 'pending').eq('enabled', true).order('created_at', { ascending: false }),
    supabase.from('education').select('*').eq('learner_id', userId).eq('approval_status', 'pending').eq('enabled', true).order('year_of_passing', { ascending: false }),
    supabase.from('projects').select('*').eq('learner_id', userId).eq('approval_status', 'pending').eq('enabled', true).order('start_date', { ascending: false }),
    supabase.from('achievements').select('*').eq('learner_id', userId).eq('approval_status', 'pending').eq('enabled', true).order('created_at', { ascending: false })
  ]);

  return {
    data: {
      learner,
      skills: skillsResult.data || [],
      trainings: trainingsResult.data || [],
      projects: projectsResult.data || [],
      certificates: certificatesResult.data || [],
      education: educationResult.data || [],
      experience: experienceResult.data || [],
      achievements: achievementsResult.data || [],
      pendingSkills: pendingSkillsResult.data || [],
      pendingEducation: pendingEducationResult.data || [],
      pendingProjects: pendingProjectsResult.data || [],
      pendingAchievements: pendingAchievementsResult.data || [],
    }
  };
}

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const startTime = Date.now();

  const url = new URL(context.request.url);
  const email = url.searchParams.get('email');
  if (!email) {
    return apiError(400, 'VALIDATION_ERROR', 'Missing email query parameter', context.request, { startTime });
  }

  const result = await getPortfolioByEmail(supabase, email);
  if (result.error) return apiDbError(result.error, context.request, { startTime });
  if (result.notFound) return apiError(404, 'NOT_FOUND', 'Learner not found', context.request, { startTime });

  return apiSuccess(result.data!, context.request, { startTime });
});

export const onRequestPatch = withAuth(async (context: AuthenticatedContext) => {
  getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const startTime = Date.now();

  let body: Record<string, any>;
  try {
    body = await context.request.json() as any;
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { id, ...updates } = body;
  if (!id) return apiError(400, 'VALIDATION_ERROR', 'Missing learner id', context.request, { startTime });

  const { data, error } = await supabase
    .from('learners')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return apiDbError(error, context.request, { startTime });
  return apiSuccess(data, context.request, { startTime });
});

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  return apiMethodNotAllowed(context.request);
});
