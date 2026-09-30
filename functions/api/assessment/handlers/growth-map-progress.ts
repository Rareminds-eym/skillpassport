/**
 * Growth Map Progress Handler
 *
 * Handles POST /api/assessment/growth-map-progress
 * Persists which Growth Map stages a learner has completed, so progress
 * survives a page refresh or navigating away and back.
 *
 * Stored inside the existing gemini_results JSONB column (as a
 * "growth_map_progress" key) rather than a new database column — this is a
 * read-then-merge write so every other existing gemini_results key
 * (stage_guidance, thinking_styles, growth_map, assessmentReport, etc.) is
 * preserved untouched.
 */

import { getServiceClient } from '../../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

interface GrowthMapProgressRequest {
  attemptId: string;
  completedStageIds: string[];
}

export async function growthMapProgressHandler(context: AuthenticatedContext) {
  const user = context.data.user;
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  try {
    const body = (await context.request.json()) as GrowthMapProgressRequest;
    const { attemptId, completedStageIds } = body;

    if (!attemptId || !Array.isArray(completedStageIds)) {
      return Response.json(
        { error: 'attemptId and completedStageIds (array) are required' },
        { status: 400 }
      );
    }

    // Verify the attempt belongs to the authenticated learner before writing.
    const { data: attempt, error: attemptError } = await supabase
      .from('personal_assessment_attempts')
      .select('id, learner_id')
      .eq('id', attemptId)
      .maybeSingle();

    if (attemptError || !attempt) {
      return Response.json({ error: 'Attempt not found' }, { status: 404 });
    }

    const { data: learner } = await supabase
      .from('learners')
      .select('user_id')
      .eq('id', attempt.learner_id)
      .maybeSingle();

    if (learner?.user_id !== user.sub) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Read the current gemini_results first so we only add/replace the
    // growth_map_progress key — never overwrite any other existing key.
    const { data: existing, error: fetchError } = await supabase
      .from('personal_assessment_results')
      .select('gemini_results')
      .eq('attempt_id', attemptId)
      .maybeSingle();

    if (fetchError || !existing) {
      return Response.json({ error: 'Assessment result not found' }, { status: 404 });
    }

    const currentGeminiResults = (existing.gemini_results as Record<string, unknown> | null) ?? {};

    const { error: updateError } = await supabase
      .from('personal_assessment_results')
      .update({
        gemini_results: {
          ...currentGeminiResults,
          growth_map_progress: { completedStageIds },
        },
      })
      .eq('attempt_id', attemptId);

    if (updateError) {
      return Response.json(
        { error: 'Failed to save progress', message: updateError.message },
        { status: 500 }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      {
        error: 'Failed to save growth map progress',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
