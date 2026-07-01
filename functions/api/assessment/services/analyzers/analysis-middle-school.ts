/**
 * Middle School Assessment Analysis (Grades 6-8)
 *
 * Calculates the 8-area capability wheel (per BRD section 10.1: Self/EQ, Social/SQ,
 * Thinking & Problem Solving, Communication, Digital & AI Literacy, Execution &
 * Independence, Exposure & Career Awareness, Portfolio & Evidence), strength
 * aggregation, learning preferences, and links adaptive aptitude session data.
 *
 * RIASEC (Realistic/Investigative/Artistic/Social/Enterprising/Conventional) is
 * intentionally not computed here: it does not appear anywhere in the BRD's
 * middle-school capability model, and its only data source (the now-deactivated
 * middle_interest_explorer section's category_mapping) no longer exists in the
 * active middle-school flow.
 */

import type { StrengthScore, AdaptiveAptitudeData } from '../../types';
import { getTopStrengths } from '../../lib/analysis-helpers';
import { generateMiddleSchoolCareerClusters } from '../core/career-cluster-generator';
import type { StudentProfile } from '../core/scoring-service';

/**
 * Flatten the adaptive `accuracy_by_subtag` shape ({ subtag: { total, correct, accuracy } })
 * into the { subtag: number } form the scoring service expects. Accuracy stays on the 0-100 scale.
 */
function flattenAccuracyBySubtag(
  raw: Record<string, any> | null | undefined
): Record<string, number> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const out: Record<string, number> = {};
  for (const [subtag, value] of Object.entries(raw)) {
    if (typeof value === 'number') out[subtag] = value;
    else if (value && typeof value === 'object' && typeof value.accuracy === 'number') {
      out[subtag] = value.accuracy;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * Status label conversion (evalution.txt section 6/9) — same scale used across all grade bands.
 */
function getCapabilityStatusLabel(score: number): string {
  if (score === 0) return 'Not Yet Evidenced';
  if (score < 2.0) return 'Starting';
  if (score < 3.0) return 'Practicing';
  if (score < 3.8) return 'Growing';
  if (score < 4.5) return 'Confident';
  return 'Ready for Next Level';
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

export async function analyzeMiddleSchool(
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

    // Step 2b: Look up section names/scales to identify learning preference questions
    // and to know each section's max rating value (scales differ: 1-5 for most sections, 0-4 for exposure_index).
    const sectionIds = [...new Set(questions.map((q: any) => q.section_id).filter(Boolean))];
    let learningPrefSectionId: string | null = null;
    const sectionScaleMax = new Map<string, number>();
    if (sectionIds.length > 0) {
      const { data: sections } = await supabase
        .from('personal_assessment_sections')
        .select('id, name, response_scale')
        .in('id', sectionIds);
      if (sections) {
        const lpSection = sections.find((s: any) => s.name === 'middle_learning_preferences');
        learningPrefSectionId = lpSection?.id ?? null;

        for (const section of sections) {
          const scale = Array.isArray(section.response_scale) ? section.response_scale : [];
          const maxValue = scale.length > 0
            ? Math.max(...scale.map((s: any) => s.value))
            : 5; // default 1-5 rating scale when section has no explicit response_scale
          sectionScaleMax.set(section.id, maxValue);
        }
      }
    }

    // Step 3: Aggregate ratings into strength dimensions and capability areas
    const strengthsByDimension = new Map<string, number[]>();

    // Doc-aligned capability-area aggregation (evalution.txt section 4/12): groups the same
    // rating responses by the coarse metadata.capability_area (e.g. "Self / EQ", "Social / SQ")
    // instead of the fine-grained strength_type, so EQ and SQ each produce one combined
    // percentage score rather than a flat list of single-item dimensions.
    const capabilityRawByArea = new Map<string, { total: number; max: number; count: number }>();

    for (const [uuid, answer] of Object.entries(allResponses)) {
      const question = questionMap.get(uuid);
      if (!question) continue;

      // Process strength dimensions from metadata
      if (question.metadata && typeof answer === 'number') {
        const strengthType = (question.metadata as any).strength_type;
        if (strengthType) {
          if (!strengthsByDimension.has(strengthType)) {
            strengthsByDimension.set(strengthType, []);
          }
          strengthsByDimension.get(strengthType)!.push(answer);
        }

        // Process capability-area grouping (Self/EQ, Social/SQ, etc.) for combined scores
        const capabilityArea = (question.metadata as any).capability_area;
        if (capabilityArea) {
          const maxValue = sectionScaleMax.get(question.section_id) ?? 5;
          const entry = capabilityRawByArea.get(capabilityArea) ?? { total: 0, max: 0, count: 0 };
          entry.total += answer;
          entry.max += maxValue;
          entry.count += 1;
          capabilityRawByArea.set(capabilityArea, entry);
        }
      }
    }

    // Step 3b: Convert raw capability totals into percentage + 5-point score + status label,
    // following evalution.txt section 4 (percentage = raw/max*100, score_out_of_5 = percentage/20)
    // and section 6 (status label conversion table).
    const capabilityScores = Array.from(capabilityRawByArea.entries()).map(([capabilityArea, { total, max, count }]) => {
      const percentage = max > 0 ? (total / max) * 100 : 0;
      const scoreOutOf5 = Math.round((percentage / 20) * 100) / 100;
      return {
        capability_area: capabilityArea,
        raw_score: total,
        max_score: max,
        question_count: count,
        percentage: Math.round(percentage * 100) / 100,
        score_out_of_5: scoreOutOf5,
        status: getCapabilityStatusLabel(scoreOutOf5),
      };
    });

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

    if (resolvedSessionId) {
      const fetched = await tryFetchAdaptiveResults(supabase, resolvedSessionId);

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
      top_strengths: getTopStrengths(strengthScores, 3),
      capability_scores: capabilityScores,
      reflections,
    };

    // Step 8: Validate results before storing - prevent empty data insertion
    const hasValidStrengths = strengthScores.length > 0;
    const hasValidCapabilities = capabilityScores.length > 0;

    if (!hasValidStrengths && !hasValidCapabilities) {
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
        // Non-fatal — main upsert succeeded; continue
      }
    }

    // Step 11: Generate career clusters (deterministic retrieval/scoring + OpenRouter narrative)
    // and merge them into gemini_results.careerFit. Non-fatal: analysis succeeds regardless.
    // Note: middle school no longer computes a RIASEC code (see file header), so
    // generateMiddleSchoolCareerClusters will skip cluster generation gracefully
    // (it already no-ops on an empty riasec_code) until it's updated to score by
    // the 8-area capability wheel instead.
    let careerFit: { clusters: unknown[] } | null = null;
    try {
      const student: StudentProfile = {
        strength_scores: strengthScores,
        // Adaptive overall_accuracy is 0-100; the scorer expects a 0-1 fraction.
        aptitude_overall: aptitudeOverall != null ? aptitudeOverall / 100 : undefined,
        accuracy_by_subtag: flattenAccuracyBySubtag(adaptiveData?.accuracyBySubtag as any),
        learning_preferences: learningPreferences,
      };

      careerFit = await generateMiddleSchoolCareerClusters(
        supabase,
        student,
        context.env as Record<string, string>,
        { adaptive: adaptiveData as any, reflections }
      );

      if (careerFit) {
        // Preserve existing gemini_results fields; only merge/overwrite the careerFit key.
        const { data: existing } = await supabase
          .from('personal_assessment_results')
          .select('gemini_results')
          .eq('attempt_id', attemptId)
          .single();

        const mergedGemini = { ...(existing?.gemini_results || {}), careerFit };

        const { error: geminiUpdateError } = await supabase
          .from('personal_assessment_results')
          .update({ gemini_results: mergedGemini })
          .eq('attempt_id', attemptId);

        if (geminiUpdateError) {
          console.error('[ANALYZE-MIDDLE] Failed to store careerFit:', geminiUpdateError.message);
        }
      }
    } catch (clusterError) {
      console.error('[ANALYZE-MIDDLE] Career cluster generation failed (non-fatal):', clusterError);
    }

    return Response.json(
      {
        success: true,
        strengthScores,
        capabilityScores,
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
        error: 'Middle school analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
