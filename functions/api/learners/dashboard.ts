import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import { createLogger } from '../../lib/logger';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError } from '../../lib/response';

const logger = createLogger('learner-dashboard-api');

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const startTime = Date.now();
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const user = getContextUser(context);

  try {
    const url = new URL(context.request.url);
    const targetLearnerId = url.searchParams.get('learner_id');
    const userId = user.id;
    const userEmail = user.email;
    logger.info('Fetching learner profile', { userId, userEmail, targetLearnerId });

    let learnerData: any;
    let learnerId: string;

    if (targetLearnerId) {
      const { data, error } = await supabase
        .from('learners')
        .select('*')
        .eq('id', targetLearnerId)
        .maybeSingle();
      if (error) {
        return apiError(500, 'DATABASE_ERROR', 'Failed to fetch learner data', context.request, { startTime });
      }
      if (!data) {
        return apiError(404, 'NOT_FOUND', `No learner found with id "${targetLearnerId}"`, context.request, { startTime });
      }
      learnerData = data;
      learnerId = data.id;
    } else {
      const { data, error } = await supabase
        .from('learners')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) {
        logger.error('Error fetching learner', { userId, userEmail, error });
        return apiError(500, 'DATABASE_ERROR', 'Failed to fetch learner data', context.request, { startTime });
      }
      if (!data) {
        logger.warn('No learner found', { userId, userEmail });
        const { data: debugData } = await supabase
          .from('learners')
          .select('id, email, user_id')
          .eq('email', userEmail)
          .maybeSingle();
        if (debugData) {
          logger.warn('Learner exists by email but user_id mismatch', {
            learnerId: debugData.id,
            learnerEmail: debugData.email,
            learnerUserId: debugData.user_id,
            jwtUserId: userId,
            mismatch: debugData.user_id !== userId,
          });
        }
        return apiError(404, 'NOT_FOUND', `No learner record found for user_id "${userId}"`, context.request, { startTime });
      }
      learnerData = data;
      learnerId = data.id;
    }

    logger.info('Learner found', { learnerId, userId, userEmail });

    const [
      educationResult,
      experienceResult,
      skillsResult,
      projectsResult,
      certificatesResult,
      trainingResult,
      opportunitiesResult,
    ] = await Promise.all([
      supabase.from('education').select('*').eq('learner_id', learnerId).order('created_at', { ascending: false }),
      supabase.from('experience').select('*').eq('learner_id', learnerId).order('created_at', { ascending: false }),
      supabase.from('skills').select('*').eq('learner_id', learnerId).is('training_id', null).order('created_at', { ascending: false }),
      supabase.from('projects').select('*').eq('learner_id', learnerId).order('created_at', { ascending: false }),
      supabase.from('certificates').select('*').eq('learner_id', learnerId).order('created_at', { ascending: false }),
      supabase.from('trainings').select('*').eq('learner_id', learnerId).order('created_at', { ascending: false }),
      supabase.from('opportunities').select('*').eq('status', 'active').limit(10).order('created_at', { ascending: false }),
    ]);

    const errorResults = [
      { name: 'education', result: educationResult },
      { name: 'experience', result: experienceResult },
      { name: 'skills', result: skillsResult },
      { name: 'projects', result: projectsResult },
      { name: 'certificates', result: certificatesResult },
      { name: 'training', result: trainingResult },
      { name: 'opportunities', result: opportunitiesResult },
    ];
    for (const { name, result } of errorResults) {
      if (result.error) {
        logger.error(`${name} query error`, { learnerId, error: result.error });
      }
    }

    const allSkills = skillsResult.data || [];
    const technicalSkills = allSkills.filter(s => s.type === 'technical');
    const softSkills = allSkills.filter(s => s.type === 'soft');

    const dashboardData = {
      profile: learnerData,
      education: educationResult.data || [],
      experience: experienceResult.data || [],
      skills: { technical: technicalSkills, soft: softSkills, all: allSkills },
      projects: projectsResult.data || [],
      certificates: certificatesResult.data || [],
      training: trainingResult.data || [],
      opportunities: opportunitiesResult.data || [],
    };

    logger.info('Dashboard data fetched successfully', { learnerId, userId });
    return apiSuccess(dashboardData, context.request, { startTime });
  } catch (err) {
    logger.error('Unexpected error fetching dashboard', { error: err });
    return apiError(500, 'INTERNAL_ERROR', 'An internal error occurred', context.request, { startTime });
  }
});
