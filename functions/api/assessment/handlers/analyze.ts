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
import { analyzeCollege } from '../services/analysis-college';

export async function analyzeHandler(context: AuthenticatedContext) {
  console.log('[ANALYZE] ========== HANDLER START ==========');
  
  try {
    console.log('[ANALYZE] Step 1: Getting user from context');
    const user = context.data.user;
    console.log('[ANALYZE] Step 2: User obtained:', { sub: user.sub, email: user.email });
    
    console.log('[ANALYZE] Step 3: Getting env');
    const env = context.env as Record<string, string>;
    console.log('[ANALYZE] Step 4: Creating supabase client');
    const supabase = getServiceClient(env as any);
    console.log('[ANALYZE] Step 5: Supabase client created');

    console.log('[ANALYZE] Step 6: Parsing request body');
    const body = (await context.request.json()) as AnalyzeRequest;
    console.log('[ANALYZE] Step 7: Body parsed:', body);
    
    let { attemptId, gradeLevel } = body;

    console.log('[ANALYZE] Request received:', { attemptId, gradeLevel, userSub: user.sub });

    if (!attemptId) {
      return Response.json({ error: 'attemptId required' }, { status: 400 });
    }

    // Step 0: Get learner ID from user
    console.log('[ANALYZE] Fetching learner with user.sub:', user.sub);
    console.log('[ANALYZE] user.sub type:', typeof user.sub);
    
    // Build the query more explicitly to debug
    const learnerQuery = supabase
      .from('learners')
      .select('id');
    
    console.log('[ANALYZE] About to execute .or() with:', `user_id.eq.${user.sub},id.eq.${user.sub}`);
    
    const { data: learnerData, error: learnerError } = await learnerQuery
      .or(`user_id.eq.${user.sub},id.eq.${user.sub}`)
      .maybeSingle();

    console.log('[ANALYZE] Learner query result:', { learnerData, learnerError });

    if (learnerError || !learnerData?.id) {
      console.error('[ANALYZE] Learner not found:', learnerError);
      return Response.json({ error: 'Learner not found', details: learnerError?.message }, { status: 404 });
    }

    const learnerId = learnerData.id;
    console.log('[ANALYZE] Using learnerId:', learnerId);

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
        return analyzeCollege(context, supabase, attemptId, learnerId);

      default:
        return Response.json(
          { error: `Unknown grade level: ${gradeLevel}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[ANALYZE] Error during analysis:', error);
    console.error('[ANALYZE] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return Response.json(
      {
        error: 'Analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
