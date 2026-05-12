/**
 * Learner Assessment Recommendations API
 *
 * GET /api/learners/assessments
 *
 * Fetches assessment recommendations for a learner including:
 * - Latest completed assessment results
 * - In-progress assessment attempts
 * - Processed recommendations (tracks, skills, careers, etc.)
 *
 * Uses service_role to bypass RLS. Requires SSO authentication.
 */
import { withAuth } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import { createLogger } from '../../lib/logger';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError } from '../../lib/response';

const logger = createLogger('learner-assessments-api');

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const startTime = Date.now();
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const user = context.data.user;

  try {
    const userId = user.sub;
    const userEmail = user.email;
    logger.info('Fetching assessment data', { userId, userEmail });
    
    // Step 1: Get learner by user_id
    const { data: learnerData, error: learnerError } = await supabase
      .from('learners')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (learnerError) {
      logger.error('Error fetching learner', { userId, error: learnerError });
      return apiError(500, 'DATABASE_ERROR', 'Failed to fetch learner data', context.request, { startTime });
    }

    if (!learnerData) {
      logger.warn('No learner found', { userId, userEmail });
      return apiError(404, 'NOT_FOUND', `No learner record found for user_id "${userId}"`, context.request, { startTime });
    }

    const learnerId = learnerData.id;
    logger.info('Learner found', { learnerId, userId });

    // Step 2: Check for in-progress assessment
    const { data: inProgressAttempt, error: inProgressError } = await supabase
      .from('personal_assessment_attempts')
      .select('*')
      .eq('learner_id', learnerId)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (inProgressError) {
      logger.error('Error fetching in-progress attempt', { learnerId, error: inProgressError });
    }

    // Step 3: Get latest completed assessment result
    const { data: latestResult, error: resultError } = await supabase
      .from('personal_assessment_results')
      .select('*')
      .eq('learner_id', learnerId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (resultError) {
      logger.error('Error fetching assessment result', { learnerId, error: resultError });
    }

    // Step 4: If we have adaptive aptitude session, fetch that data too
    let adaptiveAptitudeResults = null;
    if (latestResult?.adaptive_aptitude_session_id) {
      const { data: adaptiveData, error: adaptiveError } = await supabase
        .from('adaptive_aptitude_results')
        .select('*')
        .eq('session_id', latestResult.adaptive_aptitude_session_id)
        .maybeSingle();

      if (adaptiveError) {
        logger.warn('Error fetching adaptive aptitude results', { 
          sessionId: latestResult.adaptive_aptitude_session_id, 
          error: adaptiveError 
        });
      } else if (adaptiveData) {
        adaptiveAptitudeResults = adaptiveData;
        logger.info('Fetched adaptive aptitude results', { sessionId: latestResult.adaptive_aptitude_session_id });
      }
    }

    // Step 5: Process recommendations if we have a completed result
    let processedRecommendations = null;
    let hasCompletedAssessment = false;
    let latestAttemptId = null;

    if (latestResult && latestResult.status === 'completed') {
      hasCompletedAssessment = true;
      latestAttemptId = latestResult.attempt_id;

      const skillGap = latestResult.skill_gap || null;
      const careerFit = latestResult.career_fit || null;
      const roadmap = latestResult.roadmap || null;
      const geminiResults = latestResult.gemini_results || null;

      // Merge adaptive aptitude into gemini_results if available
      if (adaptiveAptitudeResults && geminiResults) {
        geminiResults.adaptiveAptitudeResults = adaptiveAptitudeResults;
      }

      processedRecommendations = {
        // Primary recommended track
        recommendedTrack: skillGap?.recommendedTrack || geminiResults?.skillGap?.recommendedTrack || null,
        
        // Learning tracks with topics
        learningTracks: skillGap?.learningTracks || geminiResults?.skillGap?.learningTracks || [],
        
        // Courses by type (technical and soft skills)
        coursesByType: geminiResults?.coursesByType || {
          technical: [],
          soft: []
        },
        
        // Career clusters (High fit careers)
        careerClusters: careerFit?.clusters?.filter((c: any) => c.fit === 'High') || 
                       geminiResults?.careerFit?.clusters?.filter((c: any) => c.fit === 'High') || [],
        
        // Priority skills to develop
        prioritySkills: [
          ...(skillGap?.priorityA || geminiResults?.skillGap?.priorityA || []),
          ...(skillGap?.priorityB || geminiResults?.skillGap?.priorityB || [])
        ],
        
        // Current strengths
        strengths: skillGap?.currentStrengths || geminiResults?.skillGap?.currentStrengths || [],
        
        // Certifications to pursue
        certifications: roadmap?.exposure?.certifications || geminiResults?.roadmap?.exposure?.certifications || [],
        
        // Projects to build
        projects: roadmap?.projects || geminiResults?.roadmap?.projects || [],
        
        // Overall career readiness
        readiness: latestResult.employability_readiness,
        
        // RIASEC code for interest alignment
        riasecCode: latestResult.riasec_code,
        
        // Top aptitude strengths
        aptitudeStrengths: latestResult.profile_snapshot?.aptitudeStrengths || 
                          geminiResults?.profileSnapshot?.aptitudeStrengths || [],
        
        // Assessment metadata
        assessmentDate: latestResult.created_at,
        streamId: latestResult.stream_id,
      };

      logger.info('Processed assessment recommendations', { learnerId, hasRecommendations: !!processedRecommendations });
    }

    // Build response
    const assessmentData = {
      hasAssessment: hasCompletedAssessment,
      hasInProgressAssessment: !!inProgressAttempt,
      inProgressAttempt: inProgressAttempt || null,
      latestAttemptId,
      recommendations: processedRecommendations,
      latestResult: latestResult || null,
    };

    logger.info('Assessment data fetched successfully', { 
      learnerId, 
      userId,
      hasAssessment: hasCompletedAssessment,
      hasInProgress: !!inProgressAttempt
    });
    
    return apiSuccess(assessmentData, context.request, { startTime });

  } catch (err) {
    logger.error('Unexpected error fetching assessment data', { error: err });
    return apiError(500, 'INTERNAL_ERROR', 'An internal error occurred', context.request, { startTime });
  }
});
