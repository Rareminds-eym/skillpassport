/**
 * Learner Dashboard API
 *
 * GET /api/learners/dashboard
 *
 * Fetches all dashboard data for a learner including:
 * - Profile data
 * - Education records
 * - Experience records
 * - Skills (technical and soft)
 * - Projects
 * - Certificates
 * - Training/Learning
 * - Opportunities (matched jobs)
 *
 * Uses service_role to bypass RLS. Requires SSO authentication.
 */
import { withAuth } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import { createLogger } from '../../lib/logger';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError } from '../../lib/response';

const logger = createLogger('learner-dashboard-api');

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const startTime = Date.now();
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const user = context.data.user;

  try {
    // Get learner by user_id from JWT token only
    const userId = user.sub;
    const userEmail = user.email;
    logger.info('Fetching learner profile', { userId, userEmail });
    
    const { data: learnerData, error: learnerError } = await supabase
      .from('learners')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (learnerError) {
      logger.error('Error fetching learner', { userId, userEmail, error: learnerError });
      return apiError(500, 'DATABASE_ERROR', 'Failed to fetch learner data', context.request, { startTime });
    }

    if (!learnerData) {
      logger.warn('No learner found', { userId, userEmail, message: 'Learner record not found or user_id mismatch' });
      
      // Debug: Check if learner exists by email
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
          mismatch: debugData.user_id !== userId
        });
      } else {
        logger.warn('No learner record exists for this email', { userEmail });
      }
      
      return apiError(404, 'NOT_FOUND', `No learner record found for user_id "${userId}". Check if learner.user_id matches users.id`, context.request, { startTime });
    }

    const learnerId = learnerData.id;
    logger.info('Learner found', { learnerId, userId, userEmail });

    // Step 2: Fetch all related data in parallel
    const [
      educationResult,
      experienceResult,
      skillsResult,
      projectsResult,
      certificatesResult,
      trainingResult,
      opportunitiesResult
    ] = await Promise.all([
      // Education
      supabase
        .from('education')
        .select('*')
        .eq('learner_id', learnerId)
        .order('created_at', { ascending: false }),
      
      // Experience
      supabase
        .from('experience')
        .select('*')
        .eq('learner_id', learnerId)
        .order('created_at', { ascending: false }),
      
      // Skills
      supabase
        .from('skills')
        .select('*')
        .eq('learner_id', learnerId)
        .is('training_id', null)
        .order('created_at', { ascending: false }),
      
      // Projects
      supabase
        .from('projects')
        .select('*')
        .eq('learner_id', learnerId)
        .order('created_at', { ascending: false }),
      
      // Certificates
      supabase
        .from('certificates')
        .select('*')
        .eq('learner_id', learnerId)
        .order('created_at', { ascending: false }),
      
      // Training/Learning
      supabase
        .from('trainings')
        .select('*')
        .eq('learner_id', learnerId)
        .order('created_at', { ascending: false }),
      
      // Opportunities (matched jobs) - limit to 10 for dashboard
      supabase
        .from('opportunities')
        .select('*')
        .eq('status', 'active')
        .limit(10)
        .order('created_at', { ascending: false })
    ]);

    // Check for errors
    if (educationResult.error) {
      logger.error('Education query error', { learnerId, error: educationResult.error });
    }
    if (experienceResult.error) {
      logger.error('Experience query error', { learnerId, error: experienceResult.error });
    }
    if (skillsResult.error) {
      logger.error('Skills query error', { learnerId, error: skillsResult.error });
    }
    if (projectsResult.error) {
      logger.error('Projects query error', { learnerId, error: projectsResult.error });
    }
    if (certificatesResult.error) {
      logger.error('Certificates query error', { learnerId, error: certificatesResult.error });
    }
    if (trainingResult.error) {
      logger.error('Training query error', { learnerId, error: trainingResult.error });
    }
    if (opportunitiesResult.error) {
      logger.error('Opportunities query error', { error: opportunitiesResult.error });
    }

    // Separate technical and soft skills
    const allSkills = skillsResult.data || [];
    const technicalSkills = allSkills.filter(s => s.type === 'technical');
    const softSkills = allSkills.filter(s => s.type === 'soft');

    // Build response
    const dashboardData = {
      profile: learnerData,
      education: educationResult.data || [],
      experience: experienceResult.data || [],
      skills: {
        technical: technicalSkills,
        soft: softSkills,
        all: allSkills
      },
      projects: projectsResult.data || [],
      certificates: certificatesResult.data || [],
      training: trainingResult.data || [],
      opportunities: opportunitiesResult.data || []
    };

    logger.info('Dashboard data fetched successfully', { learnerId, userId });
    return apiSuccess(dashboardData, context.request, { startTime });

  } catch (err) {
    logger.error('Unexpected error fetching dashboard', { error: err });
    return apiError(500, 'INTERNAL_ERROR', 'An internal error occurred', context.request, { startTime });
  }
});
