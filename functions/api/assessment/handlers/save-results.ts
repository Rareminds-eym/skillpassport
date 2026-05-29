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

    console.log('[save-results] Auth user:', user.sub);
    console.log('[save-results] Attempt ID:', attemptId);
    console.log('[save-results] Learner ID:', learnerId);
    console.log('[save-results] Adaptive Session ID from request:', adaptiveAptitudeSessionId);

    // Determine if this is a simplified assessment (middle/high school)
    const isSimplifiedAssessment = gradeLevel === 'middle' || gradeLevel === 'highschool';

    // STEP 1: Get adaptive session ID from multiple sources (in priority order)
    let resolvedSessionId = adaptiveAptitudeSessionId;
    
    // If not provided in request, fetch from attempts table
    if (!resolvedSessionId) {
      console.log('[save-results] No session ID in request, fetching from attempts table...');
      
      const { data: attemptData, error: attemptError } = await supabase
        .from('personal_assessment_attempts')
        .select('adaptive_aptitude_session_id')
        .eq('id', attemptId)
        .maybeSingle();
      
      if (attemptError) {
        console.error('[save-results] Error fetching attempt:', attemptError);
      } else if (attemptData?.adaptive_aptitude_session_id) {
        resolvedSessionId = attemptData.adaptive_aptitude_session_id;
        console.log('[save-results] Session ID fetched from attempts table:', resolvedSessionId);
      } else {
        console.log('[save-results] No session ID in attempts table');
      }
    }

    // STEP 2: If still not found, try to auto-link by learner_id
    if (!resolvedSessionId) {
      console.log('[save-results] Attempting auto-link by learner_id...');
      
      // Try to find by learner_id first
      let { data: completedSession } = await supabase
        .from('adaptive_aptitude_sessions')
        .select('id, learner_id')
        .eq('learner_id', learnerId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // If not found by learner_id, try a broader search
      if (!completedSession) {
        console.log('[save-results] No adaptive session found for learner_id:', learnerId);
        console.log('[save-results] Searching all completed sessions...');

        const { data: allSessions } = await supabase
          .from('adaptive_aptitude_sessions')
          .select('id, learner_id, status')
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(5);

        console.log('[save-results] Recent sessions found:', allSessions?.length || 0);
        if (allSessions?.length) {
          console.log('[save-results] Sample sessions:', allSessions.map(s => ({ id: s.id, learner_id: s.learner_id })));
        }
      }

      if (completedSession) {
        resolvedSessionId = completedSession.id;
        console.log('[save-results] Auto-linked adaptive session:', resolvedSessionId);
      } else {
        console.log('[save-results] No completed adaptive session found for learner');
      }
    }
    
    // CRITICAL: Validate that adaptive results exist before using the session ID
    // The foreign key constraint requires that adaptive_aptitude_results.session_id exists
    let validatedSessionId = null;
    
    if (resolvedSessionId) {
      console.log('[save-results] Validating adaptive results exist for session:', resolvedSessionId);
      
      const { data: adaptiveResults, error: adaptiveError } = await supabase
        .from('adaptive_aptitude_results')
        .select('session_id')
        .eq('session_id', resolvedSessionId)
        .maybeSingle();
      
      if (adaptiveError) {
        console.error('[save-results] Error checking adaptive results:', adaptiveError);
        console.error('[save-results] Will NOT save adaptive_aptitude_session_id to avoid foreign key constraint error');
      } else if (adaptiveResults) {
        console.log('[save-results] Adaptive results exist - safe to save session ID');
        validatedSessionId = resolvedSessionId;
      } else {
        console.warn('[save-results] Adaptive session exists but NO results found in adaptive_aptitude_results table');
        console.warn('[save-results] This means the adaptive test was started but not completed');
        console.warn('[save-results] Will NOT save adaptive_aptitude_session_id to avoid foreign key constraint error');
      }
    } else {
      console.log('[save-results] No adaptive session ID - learner did not take adaptive test');
    }
    
    console.log('[save-results] Final validated session ID:', validatedSessionId);

    // Extract RIASEC scores with backup handling
    const riasecScoresRaw = geminiResults?.riasec?.scores || null;
    let riasecScores = riasecScoresRaw;
    let riasecCode = geminiResults?.riasec?.code || null;
    
    // If RIASEC scores are all zeros, try backup fields
    if (riasecScoresRaw && Object.values(riasecScoresRaw).every((v: any) => v === 0)) {
      console.log('[save-results] RIASEC scores are all zeros, checking backup fields...');
      
      // Priority 1: Check preserved scores
      if (geminiResults?.riasec?._preservedScores && !Object.values(geminiResults.riasec._preservedScores).every((v: any) => v === 0)) {
        console.log('[save-results] Using _preservedScores');
        riasecScores = geminiResults.riasec._preservedScores;
        // Recalculate code from preserved scores
        const sorted = Object.entries(riasecScores)
          .sort(([, a]: any, [, b]: any) => b - a)
          .slice(0, 3)
          .map(([type]) => type);
        riasecCode = sorted.join('');
      } 
      // Priority 2: Check score backup
      else if (geminiResults?.riasec?._scoreBackup && !Object.values(geminiResults.riasec._scoreBackup).every((v: any) => v === 0)) {
        console.log('[save-results] Using _scoreBackup');
        riasecScores = geminiResults.riasec._scoreBackup;
        const sorted = Object.entries(riasecScores)
          .sort(([, a]: any, [, b]: any) => b - a)
          .slice(0, 3)
          .map(([type]) => type);
        riasecCode = sorted.join('');
      } 
      // Priority 3: Check original scores
      else if (geminiResults?.riasec?._originalScores && !Object.values(geminiResults.riasec._originalScores).every((v: any) => v === 0)) {
        console.log('[save-results] Using _originalScores');
        riasecScores = geminiResults.riasec._originalScores;
        const sorted = Object.entries(riasecScores)
          .sort(([, a]: any, [, b]: any) => b - a)
          .slice(0, 3)
          .map(([type]) => type);
        riasecCode = sorted.join('');
      }
      // Priority 4: Check if pre-calculated scores were passed in geminiResults
      else if (geminiResults?.preCalculatedRiasec?.scores && !Object.values(geminiResults.preCalculatedRiasec.scores).every((v: any) => v === 0)) {
        console.log('[save-results] Using preCalculatedRiasec from geminiResults');
        riasecScores = geminiResults.preCalculatedRiasec.scores;
        riasecCode = geminiResults.preCalculatedRiasec.code || null;
      }
      else {
        console.warn('[save-results] All backup RIASEC scores are also zeros or missing');
      }
    }
    
    console.log('[save-results] Final RIASEC scores to save:', {
      scores: riasecScores,
      code: riasecCode,
      allZeros: riasecScores ? Object.values(riasecScores).every((v: any) => v === 0) : true
    });

    // Prepare data to insert - matching exact database schema
    const dataToInsert = {
      attempt_id: attemptId,
      learner_id: learnerId,
      stream_id: streamId,
      grade_level: gradeLevel,
      status: 'completed',
      
      // RIASEC
      riasec_scores: riasecScores,
      riasec_code: riasecCode,
      
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
      
      // Adaptive aptitude session link (only if validated to exist in adaptive_aptitude_results)
      adaptive_aptitude_session_id: validatedSessionId,
      
      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('[save-results] Saving assessment results:', {
      attemptId,
      learnerId,
      streamId,
      gradeLevel,
      adaptiveAptitudeSessionId: validatedSessionId
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
