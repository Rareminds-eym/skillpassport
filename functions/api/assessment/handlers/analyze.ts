/**
 * Generic Assessment Analysis Handler
 *
 * Handles POST /api/assessment/analyze
 * Routes to grade-level-specific analysis logic based on gradeLevel parameter
 *
 * Supported Grade Levels:
 * - middle: Grades 6-8 (RIASEC + Strengths + Learning Prefs + Adaptive) ✅
 * - highschool: Grades 9-10 (RIASEC + Strengths + Learning Prefs + Adaptive + Career Exploration) ✅
 * - higher_secondary: Grades 11-12 (RIASEC + Strengths + Adaptive + College Prep) ✅
 * - after10: Post 10th std (RIASEC + Strengths + Vocational Focus) ✅
 * - after12: Post 12th std (RIASEC + Strengths + Career Entry/College Decision) ✅
 * - college: College/Higher ed (5-component scoring + Big Five + Values + Knowledge) ✅
 */

import { getServiceClient } from '../../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import type { AnalyzeRequest } from '../types';
import { analyzeMiddleSchool } from '../services/analyzers/analysis-middle-school';
import { analyzeHighSchool } from '../services/analyzers/analysis-highschool';
import { analyzeHigherSecondary } from '../services/analyzers/analysis-higher-secondary';
import { analyzeAfter10 } from '../services/analyzers/analysis-after10';
import { analyzeAfter12 } from '../services/analyzers/analysis-after12';
import { analyzeCollege } from '../services/analyzers/analysis-college';

export async function analyzeHandler(context: AuthenticatedContext) {
  const user = context.data.user;
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  try {
    const body = (await context.request.json()) as AnalyzeRequest;
    let { attemptId, gradeLevel } = body;

    if (!attemptId) {
      return Response.json({ error: 'attemptId required' }, { status: 400 });
    }

    // Step 0: Get learner ID and user ID from user
    const { data: learnerData, error: learnerError } = await supabase
      .from('learners')
      .select('id, user_id')
      .or(`user_id.eq.${user.sub},id.eq.${user.sub}`)
      .maybeSingle();

    if (learnerError || !learnerData?.id) {
      return Response.json({ error: 'Learner not found' }, { status: 404 });
    }

    const learnerId = learnerData.id;
    const userId = learnerData.user_id;

    // If gradeLevel not provided, fetch it from attempt
    if (!gradeLevel) {
      const { data: attempt } = await supabase
        .from('personal_assessment_attempts')
        .select('grade_level')
        .eq('id', attemptId)
        .eq('learner_id', learnerId)
        .single();

      if (!attempt) {
        return Response.json({ error: 'Attempt not found' }, { status: 404 });
      }

      gradeLevel = attempt.grade_level;
    }

    // Validate grade level (from database constraints)
    const supportedGradeLevels = ['middle', 'highschool', 'higher_secondary', 'after10', 'after12', 'college'];
    if (!supportedGradeLevels.includes(gradeLevel)) {
      return Response.json(
        {
          error: `Unsupported grade level: ${gradeLevel}`,
          supported: supportedGradeLevels,
        },
        { status: 400 }
      );
    }

    // Route to appropriate handler based on grade level
    switch (gradeLevel) {
      case 'middle':
        return analyzeMiddleSchool(context, supabase, attemptId, learnerId);

      // DEPRECATED (highschool, higher_secondary, after10, after12): the frontend
      // no longer calls this endpoint for these grade levels. Their submissions were
      // reverted to the legacy flow (useAssessmentSubmission → /api/analyze-assessment
      // Gemini report → completeAttempt), so these analyzers are kept only for direct
      // API callers. Middle school and college still use this endpoint.
      case 'highschool':
        return analyzeHighSchool(context, supabase, attemptId, learnerId);

      case 'higher_secondary':
        return analyzeHigherSecondary(context, supabase, attemptId, learnerId);

      case 'after10':
        return analyzeAfter10(context, supabase, attemptId, learnerId);

      case 'after12':
        return analyzeAfter12(context, supabase, attemptId, learnerId);

      case 'college':
        return analyzeCollege(context, supabase, attemptId, learnerId, userId);

      default:
        return Response.json(
          { error: `Unknown grade level: ${gradeLevel}` },
          { status: 400 }
        );
    }
  } catch (error) {
    return Response.json(
      {
        error: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}