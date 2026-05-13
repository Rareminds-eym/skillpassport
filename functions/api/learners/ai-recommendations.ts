/**
 * Learner AI Recommendations API
 *
 * GET /api/learners/ai-recommendations
 *
 * Fetches AI-powered job recommendations for a learner including:
 * - Matched jobs based on skills and profile
 * - Match scores and reasons
 * - Opportunity details
 *
 * Uses service_role to bypass RLS. Requires SSO authentication.
 */
import { withAuth } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import { createLogger } from '../../lib/logger';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { apiSuccess, apiError } from '../../lib/response';

const logger = createLogger('learner-ai-recommendations-api');

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  const startTime = Date.now();
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);
  const user = context.data.user;

  try {
    const userId = user.sub;
    const userEmail = user.email;
    logger.info('Fetching AI recommendations', { userId, userEmail });
    
    // Step 1: Get learner by user_id
    const { data: learnerData, error: learnerError } = await supabase
      .from('learners')
      .select('*')
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

    // Step 2: Get learner's skills for matching
    const { data: skillsData, error: skillsError } = await supabase
      .from('skills')
      .select('name, type, proficiency')
      .eq('learner_id', learnerId)
      .is('training_id', null);

    if (skillsError) {
      logger.error('Error fetching skills', { learnerId, error: skillsError });
    }

    const learnerSkills = skillsData || [];
    const technicalSkills = learnerSkills.filter(s => s.type === 'technical').map(s => s.name);
    const softSkills = learnerSkills.filter(s => s.type === 'soft').map(s => s.name);

    logger.info('Fetched learner skills', { 
      learnerId, 
      technicalCount: technicalSkills.length,
      softCount: softSkills.length 
    });

    // Step 3: Get active opportunities
    const { data: opportunities, error: oppError } = await supabase
      .from('opportunities')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50); // Get top 50 for matching

    if (oppError) {
      logger.error('Error fetching opportunities', { error: oppError });
      return apiError(500, 'DATABASE_ERROR', 'Failed to fetch opportunities', context.request, { startTime });
    }

    logger.info('Fetched opportunities', { count: opportunities?.length || 0 });

    // Step 4: Calculate match scores for each opportunity
    const matchedJobs = (opportunities || []).map((opp: any) => {
      let matchScore = 0;
      const matchReasons: any = {};

      // Skills matching (40% weight)
      const oppSkills = Array.isArray(opp.skills_required) ? opp.skills_required : [];
      const matchedSkills = oppSkills.filter((skill: string) => 
        technicalSkills.some(ls => ls.toLowerCase().includes(skill.toLowerCase())) ||
        softSkills.some(ls => ls.toLowerCase().includes(skill.toLowerCase()))
      );
      
      if (oppSkills.length > 0) {
        const skillMatchPercent = (matchedSkills.length / oppSkills.length) * 100;
        matchScore += skillMatchPercent * 0.4;
        matchReasons.skill_match = matchedSkills.length > 0;
        matchReasons.matched_skills = matchedSkills;
      }

      // Employment type matching (15% weight)
      if (learnerData.preferred_employment_types && Array.isArray(learnerData.preferred_employment_types)) {
        if (learnerData.preferred_employment_types.includes(opp.employment_type)) {
          matchScore += 15;
          matchReasons.employment_type_match = true;
        }
      }

      // Location matching (15% weight)
      if (learnerData.preferred_locations && Array.isArray(learnerData.preferred_locations)) {
        if (learnerData.preferred_locations.some((loc: string) => 
          opp.location?.toLowerCase().includes(loc.toLowerCase())
        )) {
          matchScore += 15;
          matchReasons.location_match = true;
        }
      }

      // Department/sector matching (15% weight)
      if (learnerData.preferred_departments && Array.isArray(learnerData.preferred_departments)) {
        if (learnerData.preferred_departments.includes(opp.department) || 
            learnerData.preferred_departments.includes(opp.sector)) {
          matchScore += 15;
          matchReasons.department_match = true;
        }
      }

      // Experience level matching (10% weight)
      if (learnerData.experience_level && opp.experience_level) {
        if (learnerData.experience_level === opp.experience_level) {
          matchScore += 10;
          matchReasons.experience_match = true;
        }
      }

      // Recent post bonus (5% weight)
      const daysSincePosted = opp.posted_date 
        ? Math.floor((Date.now() - new Date(opp.posted_date).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      
      if (daysSincePosted <= 7) {
        matchScore += 5;
        matchReasons.recent_post = true;
      }

      return {
        ...opp,
        match_percentage: Math.round(matchScore),
        match_reasons: matchReasons,
        final_score: matchScore / 100,
        isAIRecommended: matchScore >= 30 // Consider it AI recommended if 30% or higher match
      };
    });

    // Sort by match score descending
    matchedJobs.sort((a, b) => b.match_percentage - a.match_percentage);

    // Take top 20 recommendations
    const topRecommendations = matchedJobs.slice(0, 20);

    logger.info('Generated AI recommendations', { 
      learnerId, 
      userId,
      totalOpportunities: opportunities?.length || 0,
      recommendations: topRecommendations.length,
      topScore: topRecommendations[0]?.match_percentage || 0
    });

    const responseData = {
      recommendations: topRecommendations,
      cached: false,
      fallback: false,
      learnerProfile: {
        skills: {
          technical: technicalSkills,
          soft: softSkills
        },
        preferences: {
          employmentTypes: learnerData.preferred_employment_types || [],
          locations: learnerData.preferred_locations || [],
          departments: learnerData.preferred_departments || []
        }
      }
    };

    return apiSuccess(responseData, context.request, { startTime });

  } catch (err) {
    logger.error('Unexpected error fetching AI recommendations', { error: err });
    return apiError(500, 'INTERNAL_ERROR', 'An internal error occurred', context.request, { startTime });
  }
});
