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
import type {
  AnalyzeRequest,
  RIASECScores,
  StrengthScore,
  AdaptiveAptitudeData,
} from '../types';

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
      console.error('[analyze] Learner not found:', learnerError);
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
          { error: 'College analysis handled separately' },
          { status: 400 }
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

// ============================================================================
// MIDDLE SCHOOL ANALYSIS (Grades 6-8, grade_level='middle')
// ============================================================================

async function analyzeMiddleSchool(
  context: AuthenticatedContext,
  supabase: any,
  attemptId: string,
  learnerId: string
) {
  try {
    // Step 1: Fetch attempt with all_responses
    const { data: attempt, error: attemptError } = await supabase
      .from('personal_assessment_attempts')
      .select('id, all_responses, grade_level, stream_id, started_at, adaptive_aptitude_session_id')
      .eq('id', attemptId)
      .eq('learner_id', learnerId)
      .single();

    if (attemptError || !attempt) {
      console.error('[analyzeMiddleSchool] Attempt not found:', attemptError || 'no data');
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
      console.error('[analyzeMiddleSchool] Failed to fetch questions:', questionsError);
      return Response.json(
        { error: 'Failed to fetch question metadata', message: questionsError.message },
        { status: 500 }
      );
    }

    if (!questions || questions.length === 0) {
      console.error('[analyzeMiddleSchool] No questions found for UUIDs:', questionUUIDs);
      return Response.json(
        { error: 'Questions not found', details: 'Could not match responses to question metadata' },
        { status: 400 }
      );
    }

    // Index questions by UUID for O(1) lookup
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    // Step 2b: Look up section names to identify learning preference questions
    const sectionIds = [...new Set(questions.map((q: any) => q.section_id).filter(Boolean))];
    let learningPrefSectionId: string | null = null;
    if (sectionIds.length > 0) {
      const { data: sections } = await supabase
        .from('personal_assessment_sections')
        .select('id, name')
        .in('id', sectionIds);
      if (sections) {
        const lpSection = sections.find((s: any) => s.name === 'middle_learning_preferences');
        learningPrefSectionId = lpSection?.id ?? null;
      }
    }

    // Step 3: Calculate RIASEC scores from database metadata
    const riasecScores: RIASECScores = {
      realistic: 0,
      investigative: 0,
      artistic: 0,
      social: 0,
      enterprising: 0,
      conventional: 0,
    };

    // DB category_mapping format: {"option text": "R"} where letter maps to full category name
    const RIASEC_LETTER_MAP: Record<string, keyof RIASECScores> = {
      R: 'realistic',
      I: 'investigative',
      A: 'artistic',
      S: 'social',
      E: 'enterprising',
      C: 'conventional',
    };

    const strengthsByDimension = new Map<string, number[]>();

    for (const [uuid, answer] of Object.entries(allResponses)) {
      const question = questionMap.get(uuid);
      if (!question) continue;

      // Process RIASEC category mapping (format: {"option text": "R/I/A/S/E/C"})
      if (question.category_mapping && typeof question.category_mapping === 'object') {
        const mapping = question.category_mapping as Record<string, string>;
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

      // Process strength dimensions from metadata
      if (question.metadata && typeof answer === 'number') {
        const strengthType = (question.metadata as any).strength_type;
        if (strengthType) {
          if (!strengthsByDimension.has(strengthType)) {
            strengthsByDimension.set(strengthType, []);
          }
          strengthsByDimension.get(strengthType)!.push(answer);
        }
      }
    }

    // Step 4: Aggregate strength scores
    const strengthScores: StrengthScore[] = Array.from(strengthsByDimension.entries()).map(
      ([dimension, ratings]) => ({
        dimension,
        ratings,
        average: Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100,
      })
    );

    // Step 5: Extract learning preferences — questions in the middle_learning_preferences section
    const learningPreferences = Object.entries(allResponses)
      .filter(([uuid]) => {
        const q = questionMap.get(uuid);
        return q && learningPrefSectionId && q.section_id === learningPrefSectionId;
      })
      .reduce(
        (acc, [uuid, answer]) => {
          acc[uuid] = answer;
          return acc;
        },
        {} as Record<string, any>
      );

    // Step 6: Link adaptive aptitude session if exists
    let adaptiveData: AdaptiveAptitudeData | null = null;
    let aptitudeOverall: number | null = null;
    let resolvedSessionId: string | null = attempt.adaptive_aptitude_session_id ?? null;

    const tryFetchAdaptiveResults = async (sessionId: string) => {
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
    };

    if (resolvedSessionId) {
      const fetched = await tryFetchAdaptiveResults(resolvedSessionId);

      // If linked session has no results, find the latest completed session for this learner
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
          const fallback = await tryFetchAdaptiveResults(resolvedSessionId);
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

    // Step 7: Build profile snapshot
    const topCategories = getTopCategories(riasecScores);
    const riasecCode = topCategories.map((c) => c[0]).join('');

    // Collect free-text reflections (type='text' questions)
    const reflections: Array<{ question: string; answer: string }> = [];
    for (const [uuid, answer] of Object.entries(allResponses)) {
      const q = questionMap.get(uuid) as any;
      if (q?.question_type === 'text' && typeof answer === 'string' && answer.trim()) {
        reflections.push({ question: q.question_text, answer: answer.trim() });
      }
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

    // Step 8: Validate results before storing - prevent empty data insertion
    const hasValidRIASEC = Object.values(riasecScores).some(score => score > 0);
    const hasValidStrengths = strengthScores.length > 0;

    if (!hasValidRIASEC && !hasValidStrengths) {
      console.error('[analyzeMiddleSchool] No valid scores calculated:', {
        riasecScores,
        strengthScoresCount: strengthScores.length,
      });
      return Response.json(
        { error: 'Failed to calculate assessment scores', details: 'No valid data could be extracted' },
        { status: 400 }
      );
    }

    // Step 9: Store results — upsert so re-running analyze on the same attempt updates rather than errors
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
          created_at: new Date().toISOString(),
        },
        { onConflict: 'attempt_id' }
      );

    if (insertError) {
      console.error('[analyzeMiddleSchool] Failed to insert results:', insertError);
      return Response.json(
        { error: 'Failed to store results', message: insertError.message },
        { status: 500 }
      );
    }

    // Step 10: Follow-up UPDATE to guarantee adaptive aptitude data is correct.
    // The calculate_assessment_scores BEFORE INSERT trigger zeros aptitude_scores on fresh INSERTs;
    // a plain UPDATE bypasses BEFORE INSERT triggers and always wins.
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
        console.error('[analyzeMiddleSchool] Failed to update adaptive aptitude scores:', aptitudeUpdateError);
        // Non-fatal — main upsert succeeded; log but continue
      }
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
        profileSnapshot,
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      {
        error: 'Middle school analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function getTopCategories(scores: RIASECScores): string[] {
  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([key]) => key.toUpperCase());
}

function getTopStrengths(strengths: StrengthScore[], n: number): StrengthScore[] {
  return strengths.sort((a, b) => b.average - a.average).slice(0, n);
}
