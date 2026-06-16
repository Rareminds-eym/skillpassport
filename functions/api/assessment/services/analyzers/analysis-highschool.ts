/**
 * High School Assessment Analysis (Grades 9-10)
 *
 * Calculates RIASEC, character strengths, learning preferences, aptitude,
 * and introduces basic career exploration dimensions.
 * 
 * Scoring: 3-component (Interest + Capability + Personality)
 * More sophisticated than middle school with career readiness focus.
 */

import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import type { RIASECScores, StrengthScore, AdaptiveAptitudeData } from '../../types';
import { getTopCategories, getTopStrengths } from '../../lib/analysis-helpers';
import { generateMiddleSchoolCareerClusters } from '../core/career-cluster-generator';
import { generateHighSchoolSynthesis } from '../generators/synthesis-highschool';
import type { StudentProfile } from '../core/scoring-service';

/**
 * Flatten adaptive `accuracy_by_subtag` ({ subtag: { accuracy } }) into { subtag: number }
 * (0-100) for the scoring service.
 */
function flattenAccuracyBySubtag(
  raw: Record<string, any> | null | undefined
): Record<string, number> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'number') out[k] = v;
    else if (v && typeof v === 'object' && typeof v.accuracy === 'number') out[k] = v.accuracy;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

async function tryFetchAdaptiveResults(supabase: any, sessionId: string) {
  const { data: session } = await supabase
    .from('adaptive_aptitude_sessions')
    .select('id, questions_answered, current_difficulty')
    .eq('id', sessionId)
    .maybeSingle();

  if (!session) return null;

  const { data: results } = await supabase
    .from('adaptive_aptitude_results')
    .select('aptitude_level, confidence_tag, tier, total_questions, total_correct, overall_accuracy, accuracy_by_difficulty, accuracy_by_subtag, path_classification, average_response_time_ms')
    .eq('session_id', session.id)
    .maybeSingle();

  return { session, results };
}

export async function analyzeHighSchool(
  context: AuthenticatedContext,
  supabase: any,
  attemptId: string,
  learnerId: string
) {
  try {
    // Step 1: Fetch attempt with all_responses
    const { data: attempt, error: attemptError } = await supabase
      .from('personal_assessment_attempts')
      .select('id, all_responses, grade_level, stream_id, learner_context, started_at, adaptive_aptitude_session_id')
      .eq('id', attemptId)
      .eq('learner_id', learnerId)
      .single();

    if (attemptError || !attempt) {
      return Response.json({ error: 'Attempt not found' }, { status: 404 });
    }

    const allResponses = attempt.all_responses || {};
    const questionUUIDs = Object.keys(allResponses);

    if (questionUUIDs.length === 0) {
      return Response.json({ error: 'No responses found in attempt' }, { status: 400 });
    }

    // Step 2: Fetch all question metadata (BATCH QUERY - optimized)
    const { data: questions, error: questionsError } = await supabase
      .from('personal_assessment_questions')
      .select('id, section_id, category_mapping, metadata, question_type, question_text')
      .in('id', questionUUIDs);

    if (questionsError) {
      return Response.json(
        { error: 'Failed to fetch question metadata', message: questionsError.message },
        { status: 500 }
      );
    }

    if (!questions || questions.length === 0) {
      return Response.json(
        { error: 'Questions not found', details: 'Could not match responses to question metadata' },
        { status: 400 }
      );
    }

    // Index questions by UUID for O(1) lookup
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    // Step 2b: Look up section names
    const sectionIds = [...new Set(questions.map((q: any) => q.section_id).filter(Boolean))];
    const { data: sections } = await supabase
      .from('personal_assessment_sections')
      .select('id, name')
      .in('id', sectionIds);

    const sectionMap = new Map((sections || []).map((s: any) => [s.id, s.name]));

    // Step 3: Calculate RIASEC scores
    const riasecScores: RIASECScores = {
      realistic: 0,
      investigative: 0,
      artistic: 0,
      social: 0,
      enterprising: 0,
      conventional: 0,
    };

    const RIASEC_LETTER_MAP: Record<string, keyof RIASECScores> = {
      R: 'realistic',
      I: 'investigative',
      A: 'artistic',
      S: 'social',
      E: 'enterprising',
      C: 'conventional',
    };

    // Track counts for Likert-style RIASEC (if used)
    const riasecCounts: RIASECScores = {
      realistic: 0,
      investigative: 0,
      artistic: 0,
      social: 0,
      enterprising: 0,
      conventional: 0,
    };

    // Step 4: Calculate strength scores
    const strengthsByDimension = new Map<string, number[]>();

    // Step 5: Extract learning preferences
    const learningPreferences: Record<string, any> = {};

    // Process all responses
    for (const [uuid, answer] of Object.entries(allResponses)) {
      const question = questionMap.get(uuid);
      if (!question) continue;

      const sectionName = sectionMap.get(question.section_id);

      // Process RIASEC section (supports both option-mapping and Likert formats)
      if (sectionName === 'riasec' && question.category_mapping && typeof question.category_mapping === 'object') {
        const mapping = question.category_mapping as Record<string, string>;
        
        if (typeof mapping.type === 'string' && typeof answer === 'number') {
          // Likert format: one tagged letter, rating accumulates
          const key = RIASEC_LETTER_MAP[mapping.type];
          if (key) {
            riasecScores[key] += answer;
            riasecCounts[key] += 1;
          }
        } else {
          // Option-text → letter format
          const answerArray = Array.isArray(answer) ? answer : [answer];
          for (const selectedOption of answerArray) {
            if (selectedOption && typeof selectedOption === 'string') {
              const letter = mapping[selectedOption];
              if (letter && RIASEC_LETTER_MAP[letter]) {
                riasecScores[RIASEC_LETTER_MAP[letter]] += 1;
              }
            }
          }
        }
      }

      // Process strength dimensions
      if (question.metadata && typeof answer === 'number') {
        const strengthType = (question.metadata as any).strength_type;
        if (strengthType) {
          if (!strengthsByDimension.has(strengthType)) {
            strengthsByDimension.set(strengthType, []);
          }
          strengthsByDimension.get(strengthType)!.push(answer);
        }
      }

      // Process learning preferences
      if (sectionName === 'learning_preferences' || sectionName === 'highschool_learning_preferences') {
        learningPreferences[uuid] = answer;
      }
    }

    // Step 6: Aggregate strength scores
    const strengthScores: StrengthScore[] = Array.from(strengthsByDimension.entries()).map(
      ([dimension, ratings]) => ({
        dimension,
        ratings,
        average: Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100,
      })
    );

    // Step 7: Link adaptive aptitude session if exists
    let adaptiveData: AdaptiveAptitudeData | null = null;
    let aptitudeOverall: number | null = null;
    let resolvedSessionId: string | null = attempt.adaptive_aptitude_session_id ?? null;

    if (resolvedSessionId) {
      const fetched = await tryFetchAdaptiveResults(supabase, resolvedSessionId);

      if (fetched && !fetched.results) {
        const { data: completedSession } = await supabase
          .from('adaptive_aptitude_sessions')
          .select('id, questions_answered, current_difficulty')
          .eq('learner_id', learnerId)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (completedSession && completedSession.id !== resolvedSessionId) {
          resolvedSessionId = completedSession.id;
          const fallback = await tryFetchAdaptiveResults(supabase, resolvedSessionId);
          if (fallback) {
            adaptiveData = {
              questionsAnswered: fallback.session.questions_answered,
              difficulty: fallback.session.current_difficulty,
              aptitudeLevel: fallback.results?.aptitude_level ?? null,
              confidenceTag: fallback.results?.confidence_tag ?? null,
              tier: fallback.results?.tier ?? null,
              totalQuestions: fallback.results?.total_questions ?? null,
              totalCorrect: fallback.results?.total_correct ?? null,
              overallAccuracy: fallback.results?.overall_accuracy ?? null,
              accuracyByDifficulty: fallback.results?.accuracy_by_difficulty ?? null,
              accuracyBySubtag: fallback.results?.accuracy_by_subtag ?? null,
              pathClassification: fallback.results?.path_classification ?? null,
              averageResponseTimeMs: fallback.results?.average_response_time_ms ?? null,
            };
            if (fallback.results?.overall_accuracy != null) {
              aptitudeOverall = parseFloat(fallback.results.overall_accuracy);
            }
          }
        }
      } else if (fetched) {
        adaptiveData = {
          questionsAnswered: fetched.session.questions_answered,
          difficulty: fetched.session.current_difficulty,
          aptitudeLevel: fetched.results?.aptitude_level ?? null,
          confidenceTag: fetched.results?.confidence_tag ?? null,
          tier: fetched.results?.tier ?? null,
          totalQuestions: fetched.results?.total_questions ?? null,
          totalCorrect: fetched.results?.total_correct ?? null,
          overallAccuracy: fetched.results?.overall_accuracy ?? null,
          accuracyByDifficulty: fetched.results?.accuracy_by_difficulty ?? null,
          accuracyBySubtag: fetched.results?.accuracy_by_subtag ?? null,
          pathClassification: fetched.results?.path_classification ?? null,
          averageResponseTimeMs: fetched.results?.average_response_time_ms ?? null,
        };
        if (fetched.results?.overall_accuracy != null) {
          aptitudeOverall = parseFloat(fetched.results.overall_accuracy);
        }
      }
    }

    // Step 8: Build profile snapshot
    const topCategories = getTopCategories(riasecScores);
    const riasecCode = topCategories.map((c) => c[0]).join('');

    // Collect reflections
    const reflections: Array<{ question: string; answer: string }> = [];
    for (const [uuid, answer] of Object.entries(allResponses)) {
      const q = questionMap.get(uuid) as any;
      if (q?.question_type === 'text' && typeof answer === 'string' && answer.trim()) {
        reflections.push({ question: q.question_text, answer: answer.trim() });
      }
    }

    // Convert Likert sums to 0-100 percentages for scoring
    const riasecPercentages: Record<string, number> = {};
    for (const key of Object.keys(riasecScores) as Array<keyof RIASECScores>) {
      const count = riasecCounts[key];
      riasecPercentages[key] = count > 0 ? Math.round((riasecScores[key] / (count * 5)) * 100) : riasecScores[key];
    }

    const profileSnapshot = {
      grade_level: attempt.grade_level,
      stream_id: attempt.stream_id,
      started_at: attempt.started_at,
      completed_at: new Date().toISOString(),
      riasec_profile: topCategories,
      top_strengths: getTopStrengths(strengthScores, 3),
      reflections,
    };

    // Step 9: Build student profile for AI synthesis
    const studentProfile: StudentProfile = {
      riasec_scores: riasecPercentages,
      riasec_code: riasecCode,
      strength_scores: strengthScores,
      aptitude_overall: aptitudeOverall != null ? aptitudeOverall / 100 : undefined,
      accuracy_by_subtag: flattenAccuracyBySubtag(adaptiveData?.accuracyBySubtag as any),
      learning_preferences: learningPreferences,
    };

    const narrativeContext = { adaptive: adaptiveData as any, reflections };

    // Step 10: AI profile synthesis (non-fatal)
    const synthesis = await generateHighSchoolSynthesis(
      studentProfile,
      narrativeContext,
      context.env as Record<string, string>
    );

    // Step 11: Validate results before storing
    const hasValidRIASEC = Object.values(riasecScores).some(score => score > 0);
    const hasValidStrengths = strengthScores.length > 0;

    if (!hasValidRIASEC && !hasValidStrengths) {
      return Response.json(
        { error: 'Failed to calculate assessment scores', details: 'No valid data could be extracted' },
        { status: 400 }
      );
    }

    // Step 12: Store results
    const { error: insertError } = await supabase
      .from('personal_assessment_results')
      .upsert(
        {
          attempt_id: attemptId,
          learner_id: learnerId,
          grade_level: attempt.grade_level,
          stream_id: attempt.stream_id || 'general',
          riasec_scores: riasecScores,
          riasec_code: riasecCode,
          strength_scores: strengthScores,
          learning_preferences: learningPreferences,
          aptitude_scores: adaptiveData,
          aptitude_overall: aptitudeOverall,
          adaptive_aptitude_session_id: resolvedSessionId,
          profile_snapshot: profileSnapshot,
          // AI synthesis columns
          skill_gap: synthesis?.skillGap ?? null,
          roadmap: synthesis?.roadmap ?? null,
          final_note: synthesis?.finalNote ?? null,
          overall_summary: synthesis?.overallSummary ?? null,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'attempt_id' }
      );

    if (insertError) {
      return Response.json(
        { error: 'Failed to store results', message: insertError.message },
        { status: 500 }
      );
    }

    // Step 13: Follow-up UPDATE for adaptive aptitude
    if (adaptiveData !== null || aptitudeOverall !== null) {
      const { error: aptitudeUpdateError } = await supabase
        .from('personal_assessment_results')
        .update({
          aptitude_scores: adaptiveData,
          aptitude_overall: aptitudeOverall,
          adaptive_aptitude_session_id: resolvedSessionId,
        })
        .eq('attempt_id', attemptId);

      if (aptitudeUpdateError) {
        // Non-fatal
      }
    }

    // Step 14: Generate career clusters (non-fatal)
    let careerFit: { clusters: unknown[] } | null = null;
    try {
      careerFit = await generateMiddleSchoolCareerClusters(
        supabase,
        studentProfile,
        context.env as Record<string, string>,
        { ...narrativeContext, profileNarrative: synthesis?.profileNarrative }
      );

      if (careerFit) {
        const mergedGemini: Record<string, unknown> = {};
        if (synthesis?.profileNarrative) mergedGemini.profileNarrative = synthesis.profileNarrative;
        if (careerFit) mergedGemini.careerFit = careerFit;

        const { error: geminiUpdateError } = await supabase
          .from('personal_assessment_results')
          .update({ gemini_results: mergedGemini })
          .eq('attempt_id', attemptId);

        if (geminiUpdateError) {
          console.error('[ANALYZE-HIGHSCHOOL] Failed to store gemini_results:', geminiUpdateError.message);
        }
      }
    } catch (clusterError) {
      console.error('[ANALYZE-HIGHSCHOOL] Career cluster generation failed (non-fatal):', clusterError);
    }

    return Response.json(
      {
        success: true,
        riasecScores,
        riasecCode,
        strengthScores,
        learningPreferences,
        adaptiveData,
        aptitudeOverall,
        adaptiveSessionId: resolvedSessionId,
        careerFit,
        profileSnapshot,
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      {
        error: 'High school analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}