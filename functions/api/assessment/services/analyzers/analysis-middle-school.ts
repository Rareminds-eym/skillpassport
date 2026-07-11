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
import { generateMiddleSchoolReports } from '../core/report-generator';

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
    const questionMap = new Map<string, any>(questions.map((q: any) => [q.id, q]));

    // Step 2b: Look up section names/scales to identify learning preference questions
    // and to know each section's max rating value (scales differ: 1-5 for most sections, 0-4 for exposure_index).
    const sectionIds = [...new Set(questions.map((q: any) => q.section_id).filter(Boolean))];
    let learningPrefSectionId: string | null = null;
    const sectionScaleMax = new Map<string, number>();
    // Section name lookup (e.g. 'middle_interest_discovery') so the growth map can
    // group the same rating responses by the section they came from.
    const sectionNameById = new Map<string, string>();
    if (sectionIds.length > 0) {
      const { data: sections } = await supabase
        .from('personal_assessment_sections')
        .select('id, name, response_scale')
        .in('id', sectionIds);
      if (sections) {
        const lpSection = sections.find((s: any) => s.name === 'middle_learning_preferences');
        learningPrefSectionId = lpSection?.id ?? null;

        for (const section of sections) {
          sectionNameById.set(section.id, section.name);
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

    // Step 3c: Build the learner-facing "Growth Map" — per-section groupings that a flat
    // strength_scores list cannot represent unambiguously (e.g. "Leadership"/"Reflection"
    // appear in both middle_strengths_character and middle_eq_sq). Everything here is derived
    // from the same rating responses; this is purely presentation grouping for the frontend
    // "My Beyond Marks Growth Map" and adds no new scoring logic.
    type GrowthItem = {
      label: string;
      capability_area: string | null;
      mission_trigger: string | null;
      score: number;
      max: number;
      percentage: number;
      score_out_of_5: number;
      status: string;
    };

    const interestWorlds: GrowthItem[] = [];
    const characterStrengths: GrowthItem[] = [];
    const selfEq: GrowthItem[] = [];
    const socialSq: GrowthItem[] = [];
    const exposureExplored: GrowthItem[] = [];
    const exposureToExplore: GrowthItem[] = [];

    for (const [uuid, answer] of Object.entries(allResponses)) {
      const question = questionMap.get(uuid);
      if (!question || typeof answer !== 'number' || !question.metadata) continue;

      const meta = question.metadata as any;
      const strengthType: string | undefined = meta.strength_type;
      if (!strengthType) continue;

      const sectionName = sectionNameById.get(question.section_id) ?? '';
      const maxValue = sectionScaleMax.get(question.section_id) ?? 5;
      const percentage = maxValue > 0 ? Math.round((answer / maxValue) * 10000) / 100 : 0;
      const scoreOutOf5 = Math.round((percentage / 20) * 100) / 100;

      const item: GrowthItem = {
        label: strengthType,
        capability_area: meta.capability_area ?? null,
        mission_trigger: meta.mission_trigger ?? null,
        score: answer,
        max: maxValue,
        percentage,
        score_out_of_5: scoreOutOf5,
        status: getCapabilityStatusLabel(scoreOutOf5),
      };

      switch (sectionName) {
        case 'middle_interest_discovery':
          interestWorlds.push(item);
          break;
        case 'middle_strengths_character':
          characterStrengths.push(item);
          break;
        case 'middle_eq_sq':
          if (meta.capability_area === 'Social / SQ') socialSq.push(item);
          else selfEq.push(item);
          break;
        case 'exposure_index':
          // Exposure scale (0-4): 3-4 visited/tried => already explored; 0-2 => next to explore.
          if (answer >= 3) exposureExplored.push(item);
          else if (answer <= 2) exposureToExplore.push(item);
          break;
        default:
          break;
      }
    }

    const byScoreDesc = (a: GrowthItem, b: GrowthItem) => b.score - a.score || b.percentage - a.percentage;
    interestWorlds.sort(byScoreDesc);
    characterStrengths.sort(byScoreDesc);
    selfEq.sort(byScoreDesc);
    socialSq.sort(byScoreDesc);
    exposureExplored.sort(byScoreDesc);
    exposureToExplore.sort((a, b) => a.score - b.score);

    // "What I Have" = capability areas the learner is already strong in (Growing and above);
    // "What I Need Next" = areas still Starting/Practicing. Both drawn from the same wheel scores.
    const capabilitySorted = [...capabilityScores].sort((a, b) => b.score_out_of_5 - a.score_out_of_5);
    const whatIHave = capabilitySorted.filter((c) => c.score_out_of_5 >= 3.0).slice(0, 4);
    const whatINeedNext = [...capabilityScores]
      .sort((a, b) => a.score_out_of_5 - b.score_out_of_5)
      .filter((c) => c.score_out_of_5 < 3.0)
      .slice(0, 4);

    // Recommended missions: the learner's strongest interest worlds carry a mission_trigger
    // (e.g. "Maker mission"); surface the top few as suggested next actions.
    const recommendedMissions = interestWorlds
      .filter((i) => i.mission_trigger)
      .slice(0, 3)
      .map((i) => ({
        title: i.mission_trigger as string,
        interest: i.label,
        capability_area: i.capability_area,
      }));

    const growthMap = {
      interest_worlds: interestWorlds,
      character_strengths: characterStrengths,
      self_social: { self_eq: selfEq, social_sq: socialSq },
      explorer_map: { explored: exposureExplored, to_explore: exposureToExplore },
      capability_wheel: capabilityScores,
      what_i_have: whatIHave,
      what_i_need_next: whatINeedNext,
      recommended_missions: recommendedMissions,
    };

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
      growth_map: growthMap,
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
          growth_map: growthMap, // Dedicated column for faster querying
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
          growth_map: growthMap, // Keep growth_map in sync
        })
        .eq('attempt_id', attemptId);

      if (aptitudeUpdateError) {
        // Non-fatal — main upsert succeeded; continue
      }
    }

    // Step 11: Generate learner and school context for reports
    let learnerName = 'Learner';
    let schoolName = 'School';

    const { data: learner } = await supabase
      .from('users')
      .select('first_name, last_name')
      .eq('id', learnerId)
      .maybeSingle();

    if (learner?.first_name) {
      learnerName = `${learner.first_name} ${learner.last_name || ''}`.trim();
    }

    const { data: school } = await supabase
      .from('schools')
      .select('name')
      .eq('id', attempt.school_id)
      .maybeSingle();

    if (school?.name) {
      schoolName = school.name;
    }

    // Step 12: Generate reports using LLM (non-fatal: continues if fails)
    // Generates all 8 outputs: character strengths, capability insights, assessment report, missions, interest worlds, explorer insights, thinking styles, what I have/need
    // Pass aptitude scores so thinking_styles is based on actual problem-solving performance
    const reports = await generateMiddleSchoolReports(
      growthMap,
      learnerName,
      attempt.grade_level,
      schoolName,
      context.env as Record<string, string>,
      adaptiveData  // ← Pass adaptive aptitude data for thinking_styles
    );

    // Step 13: Store reports in gemini_results (non-fatal update)
    // Stores complete growthMap (evaluated data) + all LLM-generated insights including what_i_have/what_i_need (BRD FR-33)
    if (reports) {
      const { error: reportUpdateError } = await supabase
        .from('personal_assessment_results')
        .update({
          gemini_results: {
            ...growthMap,
            character_strengths_descriptions: reports.character_strengths_descriptions,
            capability_insights: reports.capability_insights,
            assessmentReport: reports.assessmentReport,
            mission_recommendations: reports.mission_recommendations,
            my_interest_worlds: reports.my_interest_worlds,
            explorer_insights: reports.explorer_insights,
            thinking_styles: reports.thinking_styles,
            what_i_have: reports.what_i_have,
            what_i_need: reports.what_i_need,
          },
        })
        .eq('attempt_id', attemptId);

      if (reportUpdateError) {
        console.error('[MIDDLE-SCHOOL-ANALYSIS] Failed to store reports:', reportUpdateError.message);
        // Non-fatal — continue even if report storage fails
      }
    }

    return Response.json(
      {
        success: true,
        strengthScores,
        capabilityScores,
        growthMap,
        learningPreferences,
        adaptiveData,
        aptitudeOverall,
        adaptiveSessionId: resolvedSessionId,
        profileSnapshot,
        reportsGenerated: !!reports,
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
