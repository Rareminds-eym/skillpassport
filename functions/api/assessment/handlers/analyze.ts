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
      .eq('user_id', user.sub)
      .maybeSingle();

    if (learnerError || !learnerData?.id) {
      return Response.json({ error: 'Learner not found' }, { status: 404 });
    }

    const learnerId = learnerData.id;
    const userId = learnerData.user_id;

    // Ownership and the canonical grade are required even when the caller
    // supplies a grade. A request field cannot redirect another attempt.
    const { data: ownedAttempt, error: attemptError } = await supabase.from('personal_assessment_attempts')
      .select('id,grade_level').eq('id', attemptId).eq('learner_id', learnerId).maybeSingle();
    if (attemptError || !ownedAttempt) return Response.json({ error: 'Attempt not found' }, { status: 404 });
    if (gradeLevel && gradeLevel !== ownedAttempt.grade_level) return Response.json({ error: 'Assessment grade mismatch' }, { status: 400 });
    gradeLevel = ownedAttempt.grade_level;
    const withGrading = async (analysis: Promise<Response>) => {
      const response = await analysis;
      if (!response.ok) return response;
      const grading = await supabase.rpc('grade_owned_assessment', { p_owner: user.sub, p_attempt: attemptId });
      if (grading.error || !grading.data) return Response.json({ error: 'Assessment grading unavailable' }, { status: 503 });
      return response;
    };

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
        return withGrading(analyzeMiddleSchool(context, supabase, attemptId, learnerId));

      // DEPRECATED (highschool, higher_secondary, after10, after12): the frontend
      // no longer calls this endpoint for these grade levels. Their submissions were
      // reverted to the legacy flow (useAssessmentSubmission → /api/analyze-assessment
      // Gemini report → completeAttempt), so these analyzers are kept only for direct
      // API callers. Middle school and college still use this endpoint.
      case 'highschool':
        return withGrading(analyzeHighSchool(context, supabase, attemptId, learnerId));

      case 'higher_secondary':
        return withGrading(analyzeHigherSecondary(context, supabase, attemptId, learnerId));

      case 'after10':
        return withGrading(analyzeAfter10(context, supabase, attemptId, learnerId));

      case 'after12':
        return withGrading(analyzeAfter12(context, supabase, attemptId, learnerId));

      case 'college':
        return withGrading(analyzeCollege(context, supabase, attemptId, learnerId, userId));

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