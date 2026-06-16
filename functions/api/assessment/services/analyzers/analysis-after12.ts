/**
 * After 12th Assessment Analysis
 *
 * For students who have completed 12th grade and are deciding between higher education, immediate employment, certifications, or gap year,
 * aptitude/knowledge percentages, and links adaptive aptitude data.
 */

import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import type { RIASECScores, AdaptiveAptitudeData } from '../../types';
import { getTopCategories, getTopScores } from '../../lib/analysis-helpers';
import { generateAfter12CareerClusters } from '../core/career-cluster-generator';
import { generateAfter12Synthesis } from '../generators/synthesis-after12';
import type { StudentProfile } from '../core/scoring-service';

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

interface StreamMcqScores {
  streamAptitudeScore: number | null;     // 0-100 overall
  streamAptitudeDetails: any | null;       // { score, correctCount, totalQuestions, byDifficulty }
  knowledgeScore: number | null;           // 0-100 overall
  knowledgeDetails: any | null;            // { score, correctCount, totalQuestions, byTopic, strongTopics, weakTopics, recommendation }
}

async function scoreStreamMcq(
  supabase: any,
  learnerId: string,
  allResponses: Record<string, any>
): Promise<StreamMcqScores> {
  const { data: sets } = await supabase
    .from('career_assessment_ai_questions')
    .select('question_type, questions')
    .eq('learner_id', learnerId)
    .eq('is_active', true);

  const apt = { correct: 0, total: 0, byDiff: {} as Record<string, { correct: number; total: number }> };
  const know = { correct: 0, total: 0, byTopic: {} as Record<string, { correct: number; total: number }> };

  const toFullOption = (v: any, options: any): string => {
    const s = String(v ?? '').trim();
    const opts: string[] = Array.isArray(options) ? options.map((o) => String(o).trim()) : [];
    const exact = opts.find((o) => o.toLowerCase() === s.toLowerCase());
    if (exact) return exact.toLowerCase();
    const m = s.match(/^([A-Za-z])(?:[.).:\s]|$)/);
    if (m && opts.length) {
      const opt = opts.find((o) => new RegExp(`^${m[1]}[.).:\\s]`, 'i').test(o));
      if (opt) return opt.toLowerCase();
    }
    return s.toLowerCase();
  };

  for (const row of sets || []) {
    let qs = row.questions;
    if (typeof qs === 'string') { try { qs = JSON.parse(qs); } catch { qs = []; } }
    if (!Array.isArray(qs)) continue;

    for (const q of qs) {
      const qid = q.id || q.uuid;
      if (qid == null || !(qid in allResponses)) continue;
      const isCorrect = toFullOption(allResponses[qid], q.options) === toFullOption(q.correct_answer, q.options);

      if (row.question_type === 'aptitude') {
        apt.total++; if (isCorrect) apt.correct++;
        const d = (q.difficulty || 'unknown').toLowerCase();
        (apt.byDiff[d] ||= { correct: 0, total: 0 }).total++;
        if (isCorrect) apt.byDiff[d].correct++;
      } else if (row.question_type === 'knowledge') {
        know.total++; if (isCorrect) know.correct++;
        const topic = q.skill_tag || q.category || 'General';
        (know.byTopic[topic] ||= { correct: 0, total: 0 }).total++;
        if (isCorrect) know.byTopic[topic].correct++;
      }
    }
  }

  const pct = (c: number, t: number) => (t > 0 ? Math.round((c / t) * 100) : 0);

  const streamAptitudeScore = apt.total > 0 ? pct(apt.correct, apt.total) : null;
  const streamAptitudeDetails = apt.total > 0
    ? {
        score: streamAptitudeScore,
        correctCount: apt.correct,
        totalQuestions: apt.total,
        byDifficulty: Object.fromEntries(
          Object.entries(apt.byDiff).map(([k, v]) => [
            k,
            { correct: v.correct, total: v.total, percentage: pct(v.correct, v.total) },
          ])
        ),
      }
    : null;

  const knowledgeScore = know.total > 0 ? pct(know.correct, know.total) : null;
  const byTopic = Object.fromEntries(
    Object.entries(know.byTopic).map(([k, v]) => [k, { correct: v.correct, total: v.total, percentage: pct(v.correct, v.total) }])
  );
  const strongTopics = Object.entries(byTopic).filter(([, v]: any) => v.percentage >= 100).map(([k]) => k);
  const weakTopics = Object.entries(byTopic).filter(([, v]: any) => v.percentage < 50).map(([k]) => k);
  const knowledgeDetails = know.total > 0
    ? {
        score: knowledgeScore,
        correctCount: know.correct,
        totalQuestions: know.total,
        byTopic,
        strongTopics,
        weakTopics,
        recommendation: weakTopics.length
          ? `Strengthen these areas: ${weakTopics.join(', ')}.`
          : 'Solid domain knowledge across the assessed topics.',
      }
    : null;

  return { streamAptitudeScore, streamAptitudeDetails, knowledgeScore, knowledgeDetails };
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

export async function analyzeAfter12(
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
      .select('id, section_id, category_mapping, metadata, question_type, question_text, correct_answer')
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

    // Step 2b: Look up section names to identify section types
    const sectionIds = [...new Set(questions.map((q: any) => q.section_id).filter(Boolean))];
    const { data: sections } = await supabase
      .from('personal_assessment_sections')
      .select('id, name')
      .in('id', sectionIds);

    const sectionMap = new Map((sections || []).map((s: any) => [s.id, s.name]));

    // Step 3: Calculate RIASEC scores from riasec section
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

    const riasecCounts: RIASECScores = {
      realistic: 0,
      investigative: 0,
      artistic: 0,
      social: 0,
      enterprising: 0,
      conventional: 0,
    };

    // Step 4: Calculate Big Five scores from bigfive section
    const bigFiveScores: Record<string, number[]> = {
      openness: [],
      conscientiousness: [],
      extraversion: [],
      agreeableness: [],
      neuroticism: [],
    };

    const BIGFIVE_LETTER_MAP: Record<string, string> = {
      O: 'openness',
      C: 'conscientiousness',
      E: 'extraversion',
      A: 'agreeableness',
      N: 'neuroticism',
    };

    // Step 5: Calculate Values scores from values section
    const valuesScores: Record<string, number[]> = {};

    // Step 6: Calculate Employability scores
    // Part A (likert, 1-5) â†’ per-skill self-ratings. Part B (sjt) â†’ situational judgment:
    // the chosen option is graded best=1.0 / worst=0.0 / neutral=0.5 and folded into an
    // overall SJT score so behaviour (not just self-rating) contributes to employability.
    const employabilityScores: Record<string, number[]> = {};
    let sjtCredits = 0;
    let sjtCount = 0;

    // Step 7: Process aptitude scores (stream-based aptitude)
    let aptitudeCorrect = 0;
    let aptitudeTotal = 0;

    // Step 8: Process knowledge scores (stream knowledge)
    let knowledgeCorrect = 0;
    let knowledgeTotal = 0;

    // Process all responses
    for (const [uuid, answer] of Object.entries(allResponses)) {
      const question = questionMap.get(uuid);
      if (!question) continue;

      const sectionName = sectionMap.get(question.section_id);

      if (sectionName === 'riasec' && question.category_mapping && typeof question.category_mapping === 'object') {
        const mapping = question.category_mapping as Record<string, string>;
        if (typeof mapping.type === 'string' && typeof answer === 'number') {
              const key = RIASEC_LETTER_MAP[mapping.type];
          if (key) {
            riasecScores[key] += answer;
            riasecCounts[key] += 1;
          }
        } else {
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

      if (sectionName === 'bigfive' && typeof answer === 'number') {
        const letter = (question.category_mapping as any)?.type;
        const dimension = letter ? BIGFIVE_LETTER_MAP[letter] : undefined;
        if (dimension && bigFiveScores[dimension]) {
          bigFiveScores[dimension].push(answer);
        }
      }

      if (sectionName === 'values' && question.metadata && typeof answer === 'number') {
        const metadata = question.metadata as any;
        const valueType = metadata.value_type || metadata.work_value;
        if (valueType) {
          if (!valuesScores[valueType]) {
            valuesScores[valueType] = [];
          }
          valuesScores[valueType].push(answer);
        }
      }

      if (sectionName === 'employability' && typeof answer === 'number') {
        const skillType = (question.category_mapping as any)?.type
          || (question.metadata as any)?.skill_type;
        if (skillType) {
          if (!employabilityScores[skillType]) {
            employabilityScores[skillType] = [];
          }
          employabilityScores[skillType].push(answer);
        }
      }

      if (sectionName ===  "employability" && question.question_type === "sjt" && answer && typeof answer === 'object' && !Array.isArray(answer)) {
        const mapping = (question.category_mapping as any) || {};
        const sjtAnswer = answer as { best?: string; worst?: string };
        const best = typeof mapping.best === 'string' ? mapping.best.trim() : undefined;
        const worst = typeof mapping.worst === 'string' ? mapping.worst.trim() : undefined;
        let credit = 0;
        if (best && typeof sjtAnswer.best === 'string' && sjtAnswer.best.trim() === best) credit += 0.5;
        if (worst && typeof sjtAnswer.worst === 'string' && sjtAnswer.worst.trim() === worst) credit += 0.5;
        sjtCredits += credit;
        sjtCount += 1;
      }

      if (sectionName === 'aptitude' && question.correct_answer) {
        aptitudeTotal++;
        if (answer === question.correct_answer) {
          aptitudeCorrect++;
        }
      }

      if (sectionName === 'knowledge' && question.correct_answer) {
        knowledgeTotal++;
        if (answer === question.correct_answer) {
          knowledgeCorrect++;
        }
      }
    }

    // Step 9: Aggregate Big Five scores
    const bigFiveAggregated: Record<string, number> = {};
    for (const [dimension, ratings] of Object.entries(bigFiveScores)) {
      if (ratings.length > 0) {
        bigFiveAggregated[dimension] = Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100;
      }
    }

    // Step 10: Aggregate Values scores
    const valuesAggregated: Record<string, number> = {};
    for (const [valueType, ratings] of Object.entries(valuesScores)) {
      if (ratings.length > 0) {
        valuesAggregated[valueType] = Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100;
      }
    }

    // Step 11: Aggregate Employability scores
    const employabilityAggregated: Record<string, number> = {};
    for (const [skillType, ratings] of Object.entries(employabilityScores)) {
      if (ratings.length > 0) {
        const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
        employabilityAggregated[skillType] = Math.round((avg / 5) * 100);
      }
    }
    if (sjtCount > 0) {
      employabilityAggregated.SJT = Math.round((sjtCredits / sjtCount) * 100);
    }

    // Step 12: Calculate aptitude and knowledge percentages
    const aptitudePercentage = aptitudeTotal > 0 ? Math.round((aptitudeCorrect / aptitudeTotal) * 100) : null;
    const knowledgePercentage = knowledgeTotal > 0 ? Math.round((knowledgeCorrect / knowledgeTotal) * 100) : null;

    // Step 13: Link adaptive aptitude session if exists
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

    // Step 13b: Score stream MCQ
    const streamMcq = await scoreStreamMcq(supabase, learnerId, allResponses);
    const effectiveKnowledgeScore = streamMcq.knowledgeScore ?? knowledgePercentage;

    // Step 13b2: Generate aptitude insights
    const aptitudeInsights = (() => {
      const subtags = adaptiveData?.accuracyBySubtag as Record<string, any> | undefined;
      const diffByDifficulty = adaptiveData?.accuracyByDifficulty as Record<string, any> | undefined;

      if (!subtags && !diffByDifficulty) return null;

      const subtag_strengths: string[] = [];
      const subtag_weaknesses: string[] = [];

      if (subtags && typeof subtags === 'object') {
        Object.entries(subtags).forEach(([key, value]: [string, any]) => {
          const acc = typeof value === 'object' && value ? (value.accuracy ?? 0) : 0;
          if (typeof acc === 'number' && value?.total > 0) {
            const label = key.replace(/_/g, ' ');
            if (acc >= 85) subtag_strengths.push(label);
            else if (acc < 60) subtag_weaknesses.push(label);
          }
        });
      }

      const diff_strong: string[] = [];
      const diff_weak: string[] = [];

      if (diffByDifficulty && typeof diffByDifficulty === 'object') {
        Object.entries(diffByDifficulty)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .forEach(([level, data]: [string, any]) => {
            const acc = typeof data === 'object' && data ? (data.accuracy ?? 0) : 0;
            if (typeof acc === 'number' && data?.total > 0) {
              if (acc >= 80) diff_strong.push(`level ${level}`);
              else if (acc < 65) diff_weak.push(`level ${level}`);
            }
          });
      }

      const strengths = [
        ...subtag_strengths.slice(0, 2),
        ...(diff_strong.length > 0 ? [`excels at ${diff_strong.join(' and ')}`] : [])
      ].filter(Boolean).slice(0, 3);

      const weaknesses = [
        ...subtag_weaknesses.slice(0, 2),
        ...(diff_weak.length > 0 ? [`struggles with ${diff_weak.join(' and ')}`] : [])
      ].filter(Boolean).slice(0, 2);

      let pattern = 'Stable performance across difficulty levels';
      if (diff_strong.length > 0 && diff_weak.length > 0) {
        pattern = `Excels at ${diff_strong.join(', ')} problems; weak at ${diff_weak.join(', ')} problems`;
      } else if (diff_strong.length > 0) {
        pattern = `Excels at ${diff_strong.join(', ')} problems`;
      } else if (diff_weak.length > 0) {
        pattern = `Struggles most with ${diff_weak.join(', ')} problems`;
      }

      return strengths.length > 0 || weaknesses.length > 0
        ? { strengths, weaknesses, pattern }
        : null;
    })();

    // Step 13c: RIASEC code
    const topCategories = getTopCategories(riasecScores);
    const riasecCode = topCategories.map((c) => c[0]).join('');

    const riasecPercentages: Record<string, number> = {};
    for (const key of Object.keys(riasecScores) as Array<keyof RIASECScores>) {
      const count = riasecCounts[key];
      riasecPercentages[key] = count > 0 ? Math.round((riasecScores[key] / (count * 5)) * 100) : 0;
    }

    // Step 13d: Build student profile
    const studentProfile: StudentProfile = {
      riasec_scores: riasecPercentages,
      riasec_code: riasecCode,
      strength_scores: [], // college has no character strengths section (uses Big Five)
      aptitude_overall: aptitudeOverall != null ? aptitudeOverall / 100 : undefined,
      accuracy_by_subtag: flattenAccuracyBySubtag(adaptiveData?.accuracyBySubtag as any),
      big_five_scores: bigFiveAggregated,
      work_values: valuesAggregated,
      knowledge_score: effectiveKnowledgeScore ?? undefined,
      knowledge_strengths: streamMcq.knowledgeDetails?.strongTopics || [],
      knowledge_weaknesses: streamMcq.knowledgeDetails?.weakTopics || [],
      employability_scores: employabilityAggregated,
      stream_aptitude_score: streamMcq.streamAptitudeScore ?? undefined,
      stream:
        (attempt.learner_context as any)?.programName ||
        (attempt.learner_context as any)?.selectedStream ||
        attempt.stream_id ||
        undefined,
      degreeLevel: (attempt.learner_context as any)?.degreeLevel || undefined,
    };
    // Extract knowledge insights from knowledge_details (strongTopics/weakTopics already in DB)
    const knowledgeInsights = streamMcq.knowledgeDetails?.strongTopics || streamMcq.knowledgeDetails?.weakTopics
      ? {
          strengths: streamMcq.knowledgeDetails.strongTopics || [],
          weaknesses: streamMcq.knowledgeDetails.weakTopics || []
        }
      : null;

    const narrativeContext = {
      adaptive: adaptiveData as any,
      reflections: [] as any[],
      aptitudeInsights: aptitudeInsights,
      knowledgeInsights: knowledgeInsights
    };

    // Step 13e: AI profile synthesis
    const synthesis = await generateAfter12Synthesis(
      studentProfile,
      narrativeContext,
      context.env as Record<string, string>
    );

    // Step 14: Build profile snapshot
    const profileSnapshot = {
      grade_level: attempt.grade_level,
      stream_id: attempt.stream_id,
      started_at: attempt.started_at,
      completed_at: new Date().toISOString(),
      riasec_profile: topCategories,
      top_big_five: getTopScores(bigFiveAggregated, 3),
      top_values: getTopScores(valuesAggregated, 3),
      top_employability: getTopScores(employabilityAggregated, 3),
      stream_aptitude_percentage: streamMcq.streamAptitudeScore,
      knowledge_percentage: effectiveKnowledgeScore,
    };

    // Step 15: Validate results
    const hasValidRIASEC = Object.values(riasecScores).some(score => score > 0);
    const hasValidBigFive = Object.keys(bigFiveAggregated).length > 0;
    const hasValidValues = Object.keys(valuesAggregated).length > 0;
    const hasValidEmployability = Object.keys(employabilityAggregated).length > 0;

    if (!hasValidRIASEC && !hasValidBigFive && !hasValidValues && !hasValidEmployability) {
      return Response.json(
        { error: 'Failed to calculate assessment scores', details: 'No valid data could be extracted' },
        { status: 400 }
      );
    }

    // Step 16: Store results
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
          bigfive_scores: bigFiveAggregated,
          work_values_scores: valuesAggregated,
          employability_scores: employabilityAggregated,
          aptitude_scores: adaptiveData,
          aptitude_overall: aptitudeOverall,
          stream_aptitude_score: streamMcq.streamAptitudeScore,
          stream_aptitude_details: {
            ...streamMcq.streamAptitudeDetails,
            aptitudeInsights: aptitudeInsights
          },
          knowledge_score: effectiveKnowledgeScore,
          knowledge_details: streamMcq.knowledgeDetails,
          adaptive_aptitude_session_id: resolvedSessionId,
          profile_snapshot: profileSnapshot,
          employability_readiness: synthesis?.employability?.overallReadiness ?? null,
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

    // Step 17: Update adaptive aptitude data
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
        // Continue on error
      }
    }

    // ════════════════════════════════════════════════════════════════════════════════════
    // CLUSTERING BLOCKED FOR RAG TESTING
    // Purpose: Test RAG retrieval independently before clustering
    // To unblock: Remove the /* and */ comment markers below and delete this comment block
    // ════════════════════════════════════════════════════════════════════════════════════

    /*
    // Step 18: Generate career clusters
    let careerFit: { clusters: unknown[]; specificOptions?: unknown; overallSummary?: string } | null = null;
    try {
      careerFit = await generateAfter12CareerClusters(
        supabase,
        studentProfile,
        context.env as Record<string, string>,
        { ...narrativeContext, profileNarrative: synthesis?.profileNarrative }
      );

      const clusterSummary = careerFit?.overallSummary;
      const careerFitForStorage = careerFit
        ? { clusters: careerFit.clusters, specificOptions: careerFit.specificOptions }
        : null;

      const mergedGemini: Record<string, unknown> = {};
      if (synthesis?.profileNarrative) mergedGemini.profileNarrative = synthesis.profileNarrative;
      if (careerFitForStorage) mergedGemini.careerFit = careerFitForStorage;
      const geminiUpdate: Record<string, unknown> = { gemini_results: mergedGemini };
      if (clusterSummary) geminiUpdate.overall_summary = clusterSummary;
      const { error: geminiUpdateError } = await supabase
        .from('personal_assessment_results')
        .update(geminiUpdate)
        .eq('attempt_id', attemptId);
      if (geminiUpdateError) {
        console.error('[ANALYZE-AFTER12] Failed to store gemini_results:', geminiUpdateError.message);
      }
    } catch (clusterError) {
      console.error('[ANALYZE-AFTER12] Career cluster generation failed (non-fatal):', clusterError);
    }
    */

    // CLUSTERING BLOCKED: Skipped for RAG testing
    let careerFit: { clusters: unknown[]; specificOptions?: unknown; overallSummary?: string } | null = null;

    // Log learner context and RAG input for testing
    console.log('[ANALYZE-AFTER12] RAG TESTING MODE - Clustering blocked');
    console.log('[LEARNER-CONTEXT] Stream:', studentProfile.stream);
    console.log('[LEARNER-CONTEXT] RIASEC Code:', studentProfile.riasec_code);
    console.log('[LEARNER-CONTEXT] RIASEC Scores:', JSON.stringify(studentProfile.riasec_scores));
    console.log('[LEARNER-CONTEXT] Big Five:', JSON.stringify(studentProfile.big_five_scores));
    console.log('[LEARNER-CONTEXT] Work Values:', JSON.stringify(studentProfile.work_values));
    console.log('[LEARNER-CONTEXT] Employability:', JSON.stringify(studentProfile.employability_scores));
    console.log('[LEARNER-CONTEXT] Knowledge Score:', studentProfile.knowledge_score);
    console.log('[LEARNER-CONTEXT] Aptitude Overall:', studentProfile.aptitude_overall);
    console.log('[LEARNER-CONTEXT] Adaptive Aptitude:', narrativeContext.adaptive?.overallAccuracy + '%');
    console.log('[LEARNER-CONTEXT] Profile Narrative:', synthesis?.profileNarrative?.substring(0, 150) + '...');

    return Response.json(
      {
        success: true,
        riasecScores,
        riasecCode,
        bigFiveScores: bigFiveAggregated,
        valuesScores: valuesAggregated,
        employabilityScores: employabilityAggregated,
        aptitudePercentage,
        knowledgePercentage,
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
        error: 'After 12th analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
