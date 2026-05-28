/**
 * Save Assessment Results Handler
 *
 * Handles POST /api/assessment/save-results
 * Saves AI-analyzed assessment results to personal_assessment_results table
 * Uses service role to bypass RLS policies
 */

import { getServiceClient } from '../../../lib/supabase';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

interface SaveResultsRequest {
  attemptId: string;
  learnerId: string;
  streamId: string;
  gradeLevel: string;
  geminiResults: any;
  adaptiveAptitudeSessionId?: string | null;
  sectionTimings?: Record<string, number>;
}

export async function saveResultsHandler(context: AuthenticatedContext) {
  const user = context.data.user;
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  try {
    const body = (await context.request.json()) as SaveResultsRequest;

    const {
      attemptId,
      learnerId,
      streamId,
      gradeLevel,
      geminiResults,
      adaptiveAptitudeSessionId = null,
      sectionTimings = {}
    } = body;

    // Validate required fields
    if (!attemptId || !learnerId || !streamId || !gradeLevel || !geminiResults) {
      return Response.json(
        { error: 'Missing required fields: attemptId, learnerId, streamId, gradeLevel, geminiResults' },
        { status: 400 }
      );
    }

    // Verify the attempt exists and belongs to the user
    const { data: attempt, error: attemptError } = await supabase
      .from('personal_assessment_attempts')
      .select('id, learner_id')
      .eq('id', attemptId)
      .maybeSingle();

    if (attemptError || !attempt) {
      return Response.json({ error: 'Assessment attempt not found' }, { status: 404 });
    }

    // Verify the learner belongs to the authenticated user
    const { data: learner } = await supabase
      .from('learners')
      .select('user_id')
      .eq('id', learnerId)
      .maybeSingle();

    if (learner?.user_id !== user.sub) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (attempt.learner_id !== learnerId) {
      return Response.json({ error: 'Learner ID mismatch' }, { status: 400 });
    }

    // Determine if this is a simplified assessment (middle/high school)
    const isSimplifiedAssessment = gradeLevel === 'middle' || gradeLevel === 'highschool';

    // Extract RIASEC scores with backup handling
    const riasecScoresRaw = geminiResults?.riasec?.scores || null;
    let riasecScores = riasecScoresRaw;
    
    // If RIASEC scores are all zeros, try backup fields
    if (riasecScoresRaw && Object.values(riasecScoresRaw).every((v: any) => v === 0)) {
      console.log('[save-results] RIASEC scores are all zeros, checking backup fields...');
      
      if (geminiResults?.riasec?._preservedScores && !Object.values(geminiResults.riasec._preservedScores).every((v: any) => v === 0)) {
        riasecScores = geminiResults.riasec._preservedScores;
      } else if (geminiResults?.riasec?._scoreBackup && !Object.values(geminiResults.riasec._scoreBackup).every((v: any) => v === 0)) {
        riasecScores = geminiResults.riasec._scoreBackup;
      } else if (geminiResults?.riasec?._originalScores && !Object.values(geminiResults.riasec._originalScores).every((v: any) => v === 0)) {
        riasecScores = geminiResults.riasec._originalScores;
      }
    }

    // Prepare data to insert - matching exact database schema
    const dataToInsert = {
      attempt_id: attemptId,
      learner_id: learnerId,
      stream_id: streamId,
      grade_level: gradeLevel,
      status: 'completed',
      
      // RIASEC
      riasec_scores: riasecScores,
      riasec_code: geminiResults?.riasec?.code || null,
      
      // Aptitude (available for all grade levels)
      aptitude_scores: geminiResults?.aptitude?.scores || null,
      aptitude_overall: geminiResults?.aptitude?.overallScore ?? null,
      
      // Big Five (note: column is 'bigfive_scores' not 'big_five_scores')
      bigfive_scores: geminiResults?.bigFive || null,
      
      // Work Values (only for comprehensive assessments)
      work_values_scores: isSimplifiedAssessment ? null : (geminiResults?.workValues?.scores || null),
      
      // Employability (only for comprehensive assessments)
      employability_scores: isSimplifiedAssessment ? null : (geminiResults?.employability?.skillScores || null),
      employability_readiness: isSimplifiedAssessment ? null : (geminiResults?.employability?.overallReadiness || null),
      
      // Knowledge (only for comprehensive assessments)
      knowledge_score: isSimplifiedAssessment ? null : (geminiResults?.knowledge?.score ?? null),
      knowledge_details: isSimplifiedAssessment ? null : (geminiResults?.knowledge || null),
      
      // Career recommendations
      career_fit: geminiResults?.careerFit || null,
      skill_gap: geminiResults?.skillGap || null,
      skill_gap_courses: geminiResults?.skillGapCourses || null,
      platform_courses: geminiResults?.platformCourses || null,
      courses_by_type: geminiResults?.coursesByType || null,
      roadmap: geminiResults?.roadmap || null,
      
      // Additional fields
      profile_snapshot: geminiResults?.profileSnapshot || null,
      timing_analysis: geminiResults?.timingAnalysis || null,
      final_note: geminiResults?.finalNote || null,
      overall_summary: geminiResults?.overallSummary || null,
      
      // Learning preferences and strengths (if available)
      learning_preferences: geminiResults?.learningPreferences || null,
      strength_scores: geminiResults?.strengthScores || null,
      
      // Full AI results
      gemini_results: geminiResults,
      
      // Adaptive aptitude session link
      adaptive_aptitude_session_id: adaptiveAptitudeSessionId,
      
      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('[save-results] Saving assessment results:', {
      attemptId,
      learnerId,
      streamId,
      gradeLevel,
      adaptiveAptitudeSessionId
    });

    // STEP 1: Save results using service role (bypasses RLS)
    const { data: results, error: resultsError } = await supabase
      .from('personal_assessment_results')
      .upsert(dataToInsert, {
        onConflict: 'attempt_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (resultsError) {
      console.error('[save-results] Failed to save results:', resultsError);
      return Response.json(
        {
          error: 'Failed to save assessment results',
          message: resultsError.message,
          details: resultsError.details
        },
        { status: 500 }
      );
    }

    console.log('[save-results] Results saved successfully:', results.id);

    // STEP 2: Mark attempt as completed
    const { error: attemptUpdateError } = await supabase
      .from('personal_assessment_attempts')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        section_timings: sectionTimings,
        updated_at: new Date().toISOString()
      })
      .eq('id', attemptId);

    if (attemptUpdateError) {
      console.error('[save-results] Failed to update attempt status:', attemptUpdateError);
      // Results are saved, so we don't fail the request
      // Just log the warning
    } else {
      console.log('[save-results] Attempt marked as completed');
    }

    return Response.json({
      success: true,
      message: 'Assessment results saved successfully',
      data: {
        resultId: results.id,
        attemptId: attemptId
      }
    });
  } catch (error) {
    console.error('[save-results] Exception:', error);
    return Response.json(
      {
        error: 'Failed to save assessment results',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
