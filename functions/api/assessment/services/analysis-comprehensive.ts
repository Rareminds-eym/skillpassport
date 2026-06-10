/**
 * Comprehensive Assessment Analysis
 *
 * Handles: higher_secondary (Grades 11-12), after10 (Grade 11), after12 (Grade 12+)
 *
 * Comprehensive assessments include:
 * - RIASEC interests
 * - Big Five personality
 * - Work Values
 * - Employability skills
 * - Knowledge/Stream expertise
 * - Career recommendations
 */

import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import type { RIASECScores, StrengthScore, AdaptiveAptitudeData } from '../types';
import { getTopCategories, getTopStrengths } from '../lib/analysis-helpers';

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

export async function analyzeComprehensive(
  context: AuthenticatedContext,
  supabase: any,
  attemptId: string,
  learnerId: string,
  gradeLevel: string
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
      return Response.json({ error: 'Attempt not found' }, { status: 404 });
    }

    const allResponses = attempt.all_responses || {};
    const questionUUIDs = Object.keys(allResponses);

    if (questionUUIDs.length === 0) {
      return Response.json({ error: 'No responses found in attempt' }, { status: 400 });
    }

    // Step 2: Fetch all question metadata
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

    const questionMap = new Map(questions.map((q) => [q.id, q]));

    // Step 2b: Look up section names
    const sectionIds = [...new Set(questions.map((q: any) => q.section_id).filter(Boolean))];
    const sectionMap = new Map<string, string>();

    if (sectionIds.length > 0) {
      const { data: sections } = await supabase
        .from('personal_assessment_sections')
        .select('id, name')
        .in('id', sectionIds);
      if (sections) {
        sections.forEach((s: any) => sectionMap.set(s.id, s.name));
      }
    }

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

    const strengthsByDimension = new Map<string, number[]>();
    let bigFiveScores: Record<string, number> = {};
    let workValuesScores: Record<string, number> = {};
    let employabilityScores: Record<string, number> = {};

    for (const [uuid, answer] of Object.entries(allResponses)) {
      const question = questionMap.get(uuid);
      if (!question) continue;

      // RIASEC
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

      // Strengths
      if (question.metadata && typeof answer === 'number') {
        const strengthType = (question.metadata as any).strength_type;
        if (strengthType) {
          if (!strengthsByDimension.has(strengthType)) {
            strengthsByDimension.set(strengthType, []);
          }
          strengthsByDimension.get(strengthType)!.push(answer);
        }
      }

      // Big Five, Work Values, Employability (numeric scores from metadata)
      if (question.metadata && typeof answer === 'number') {
        const metadata = question.metadata as any;

        if (metadata.big_five_trait) {
          bigFiveScores[metadata.big_five_trait] = (bigFiveScores[metadata.big_five_trait] || 0) + answer;
        }
        if (metadata.work_value_trait) {
          workValuesScores[metadata.work_value_trait] = (workValuesScores[metadata.work_value_trait] || 0) + answer;
        }
        if (metadata.employability_skill) {
          employabilityScores[metadata.employability_skill] = (employabilityScores[metadata.employability_skill] || 0) + answer;
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

    // Step 5: Extract learning preferences
    const learningPreferences = Object.entries(allResponses)
      .filter(([uuid]) => {
        const q = questionMap.get(uuid);
        const sectionName = q && q.section_id ? sectionMap.get(q.section_id) : null;
        return sectionName && (sectionName.includes('learning_preference') || sectionName.includes('learning_style'));
      })
      .reduce(
        (acc, [uuid, answer]) => {
          acc[uuid] = answer;
          return acc;
        },
        {} as Record<string, any>
      );

    // Step 6: Link adaptive aptitude
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

    // Step 7: Build profile snapshot
    const topCategories = getTopCategories(riasecScores);
    const riasecCode = topCategories.map((c) => c[0]).join('');

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

    // Step 8: Validate results
    const hasValidRIASEC = Object.values(riasecScores).some(score => score > 0);
    const hasValidStrengths = strengthScores.length > 0;

    if (!hasValidRIASEC && !hasValidStrengths) {
      return Response.json(
        { error: 'Failed to calculate assessment scores', details: 'No valid data could be extracted' },
        { status: 400 }
      );
    }

    // Step 9: Store results
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
          bigfive_scores: Object.keys(bigFiveScores).length > 0 ? bigFiveScores : null,
          work_values_scores: Object.keys(workValuesScores).length > 0 ? workValuesScores : null,
          employability_scores: Object.keys(employabilityScores).length > 0 ? employabilityScores : null,
          aptitude_scores: adaptiveData,
          aptitude_overall: aptitudeOverall,
          adaptive_aptitude_session_id: resolvedSessionId,
          profile_snapshot: profileSnapshot,
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

    // Step 10: Follow-up UPDATE for aptitude data
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

    return Response.json(
      {
        success: true,
        riasecScores,
        riasecCode,
        strengthScores,
        learningPreferences,
        bigFiveScores,
        workValuesScores,
        employabilityScores,
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
        error: 'Comprehensive analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
