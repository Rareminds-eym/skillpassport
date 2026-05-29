/**
 * Generic Assessment Analysis Handler
 *
 * Handles POST /api/assessment/analyze
 * Routes to grade-level-specific analysis logic based on gradeLevel parameter
 *
 * Supported Grade Levels:
 * - middle: Grades 6-8 (RIASEC + Strengths + Learning Prefs + Adaptive) ✅
 * - highschool: Grades 9-10 (TODO)
 * - higher_secondary: Grades 11-12 (TODO)
 * - after10: Post 10th std (TODO)
 * - after12: Post 12th std (TODO)
 * - college: College/Higher ed (separate endpoint)
 */

import { getServiceClient } from '../../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import type { AnalyzeRequest } from '../types';
import { analyzeMiddleSchool } from '../services/analysis-middle-school';

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

    // Step 0: Get learner ID from user
    const { data: learnerData, error: learnerError } = await supabase
      .from('learners')
      .select('id')
      .or(`user_id.eq.${user.sub},id.eq.${user.sub}`)
      .maybeSingle();

    if (learnerError || !learnerData?.id) {
      return Response.json({ error: 'Learner not found' }, { status: 404 });
    }

    const learnerId = learnerData.id;

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

      case 'highschool':
        return Response.json(
          { error: 'High school analysis not yet implemented' },
          { status: 501 }
        );

      case 'higher_secondary':
        return Response.json(
          { error: 'Higher secondary analysis not yet implemented' },
          { status: 501 }
        );

      case 'after10':
        return Response.json(
          { error: 'Post-10th analysis not yet implemented' },
          { status: 501 }
        );

      case 'after12':
        return Response.json(
          { error: 'Post-12th analysis not yet implemented' },
          { status: 501 }
        );

      case 'college':
        return Response.json(
          { error: 'College analysis not yet implemented' },
          { status: 501 }
        );

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
