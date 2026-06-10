/**
 * College Assessment Analysis
 *
 * Calculates RIASEC, Big Five, Values, Employability scores,
 * aptitude/knowledge percentages, and links adaptive aptitude data.
 */

import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import type { RIASECScores, AdaptiveAptitudeData } from '../types';
import { getTopCategories, getTopScores } from '../lib/analysis-helpers';

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

export async function analyzeCollege(
  context: AuthenticatedContext,
  supabase: any,
  attemptId: string,
  learnerId: string
) {
  try {
    console.log('[ANALYZE-COLLEGE] Starting analysis:', { attemptId, learnerId });
    
    // Step 1: Fetch attempt with all_responses
    const { data: attempt, error: attemptError } = await supabase
      .from('personal_assessment_attempts')
      .select('id, all_responses, grade_level, stream_id, started_at, adaptive_aptitude_session_id')
      .eq('id', attemptId)
      .eq('learner_id', learnerId)
      .single();

    console.log('[ANALYZE-COLLEGE] Attempt query result:', { attempt, attemptError });

    if (attemptError || !attempt) {
      console.error('[ANALYZE-COLLEGE] Attempt not found:', attemptError);
      return Response.json({ error: 'Attempt not found', details: attemptError?.message }, { status: 404 });
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

    // Index questions by UUID for O(1) lookup
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

    // Step 4: Calculate Big Five scores from bigfive section
    const bigFiveScores: Record<string, number[]> = {
      openness: [],
      conscientiousness: [],
      extraversion: [],
      agreeableness: [],
      neuroticism: [],
    };

    // Step 5: Calculate Values scores from values section
    const valuesScores: Record<string, number[]> = {};

    // Step 6: Calculate Employability scores from employability section
    const employabilityScores: Record<string, number[]> = {};

    // Step 7: Process aptitude scores (stream-based aptitude)
    let aptitudeCorrect = 0;
    let aptitudeTotal = 0;

    // Step 8: Process knowledge scores (stream knowledge)
    let knowledgeCorrect = 0;
    let knowledgeTotal = 0;
    
    // Step 8b: Fetch AI-generated knowledge questions for this attempt
    // These are stored separately in career_assessment_ai_questions table
    console.log('[ANALYZE-COLLEGE] Fetching AI knowledge questions for learner:', learnerId);
    const { data: aiKnowledgeQuestions, error: aiKnowledgeError } = await supabase
      .from('career_assessment_ai_questions')
      .select('id, questions, question_type, stream_id')
      .eq('learner_id', learnerId)
      .eq('question_type', 'knowledge')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    console.log('[ANALYZE-COLLEGE] AI knowledge query result:', { 
      found: !!aiKnowledgeQuestions, 
      error: aiKnowledgeError,
      learnerId 
    });
    
    // Create a map of AI knowledge questions for lookup
    const aiKnowledgeMap = new Map();
    if (aiKnowledgeQuestions && aiKnowledgeQuestions.questions) {
      const questionsArray = Array.isArray(aiKnowledgeQuestions.questions) 
        ? aiKnowledgeQuestions.questions 
        : JSON.parse(aiKnowledgeQuestions.questions);
      
      questionsArray.forEach((q: any, index: number) => {
        // AI questions use keys like "knowledge_1", "knowledge_2", etc.
        const key = `knowledge_${index + 1}`;
        aiKnowledgeMap.set(key, {
          question: q.question || q.text,
          correctAnswer: q.correct_answer || q.correct,
          options: q.options
        });
      });
    }
    
    // Step 8c: Fetch AI-generated aptitude questions for this attempt
    console.log('[ANALYZE-COLLEGE] Fetching AI aptitude questions for learner:', learnerId);
    const { data: aiAptitudeQuestions, error: aiAptitudeError } = await supabase
      .from('career_assessment_ai_questions')
      .select('id, questions, question_type, stream_id')
      .eq('learner_id', learnerId)
      .eq('question_type', 'aptitude')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    console.log('[ANALYZE-COLLEGE] AI aptitude query result:', { 
      found: !!aiAptitudeQuestions, 
      error: aiAptitudeError,
      learnerId 
    });
    
    // Create a map of AI aptitude questions for lookup
    const aiAptitudeMap = new Map();
    if (aiAptitudeQuestions && aiAptitudeQuestions.questions) {
      const questionsArray = Array.isArray(aiAptitudeQuestions.questions) 
        ? aiAptitudeQuestions.questions 
        : JSON.parse(aiAptitudeQuestions.questions);
      
      questionsArray.forEach((q: any, index: number) => {
        // AI questions use keys like "aptitude_1", "aptitude_2", etc.
        const key = `aptitude_${index + 1}`;
        aiAptitudeMap.set(key, {
          question: q.question || q.text,
          correctAnswer: q.correct_answer || q.correct,
          options: q.options
        });
      });
    }

    // Process all responses
    for (const [uuid, answer] of Object.entries(allResponses)) {
      const question = questionMap.get(uuid);
      if (!question) continue;

      const sectionName = sectionMap.get(question.section_id);

      // Process RIASEC section
      if (sectionName === 'riasec' && question.category_mapping && typeof question.category_mapping === 'object') {
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

      // Process Big Five section
      if (sectionName === 'bigfive' && question.metadata && typeof answer === 'number') {
        const metadata = question.metadata as any;
        const dimension = metadata.dimension || metadata.big_five_dimension;
        if (dimension && bigFiveScores[dimension.toLowerCase()]) {
          bigFiveScores[dimension.toLowerCase()].push(answer);
        }
      }

      // Process Values section
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

      // Process Employability section
      if (sectionName === 'employability' && question.metadata && typeof answer === 'number') {
        const metadata = question.metadata as any;
        const skillType = metadata.skill_type || metadata.employability_skill;
        if (skillType) {
          if (!employabilityScores[skillType]) {
            employabilityScores[skillType] = [];
          }
          employabilityScores[skillType].push(answer);
        }
      }

      // Process Aptitude section (stream-based aptitude)
      if (sectionName === 'aptitude' && question.correct_answer) {
        aptitudeTotal++;
        if (answer === question.correct_answer) {
          aptitudeCorrect++;
        }
      }

      // Process Knowledge section (stream knowledge)
      if (sectionName === 'knowledge' && question.correct_answer) {
        knowledgeTotal++;
        if (answer === question.correct_answer) {
          knowledgeCorrect++;
        }
      }
    }
    
    // Step 8d: Process AI-generated knowledge answers from all_responses
    // These use keys like "knowledge_1", "knowledge_2", etc.
    for (const [key, answer] of Object.entries(allResponses)) {
      if (key.startsWith('knowledge_') && aiKnowledgeMap.has(key)) {
        const aiQuestion = aiKnowledgeMap.get(key);
        knowledgeTotal++;
        if (answer === aiQuestion.correctAnswer) {
          knowledgeCorrect++;
        }
      }
      
      if (key.startsWith('aptitude_') && aiAptitudeMap.has(key)) {
        const aiQuestion = aiAptitudeMap.get(key);
        aptitudeTotal++;
        if (answer === aiQuestion.correctAnswer) {
          aptitudeCorrect++;
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
        employabilityAggregated[skillType] = Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100;
      }
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

    // Step 14: Build profile snapshot
    const topCategories = getTopCategories(riasecScores);
    const riasecCode = topCategories.map((c) => c[0]).join('');

    const profileSnapshot = {
      grade_level: attempt.grade_level,
      stream_id: attempt.stream_id,
      started_at: attempt.started_at,
      completed_at: new Date().toISOString(),
      riasec_profile: topCategories,
      top_big_five: getTopScores(bigFiveAggregated, 3),
      top_values: getTopScores(valuesAggregated, 3),
      top_employability: getTopScores(employabilityAggregated, 3),
      aptitude_percentage: aptitudePercentage,
      knowledge_percentage: knowledgePercentage,
    };

    // Step 15: Validate results before storing - prevent empty data insertion
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

    // Step 16: Store results — upsert so re-running analyze on the same attempt updates rather than errors
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
          big_five_scores: bigFiveAggregated,
          values_scores: valuesAggregated,
          employability_scores: employabilityAggregated,
          aptitude_scores: adaptiveData,
          aptitude_overall: aptitudeOverall,
          stream_aptitude_score: aptitudePercentage,
          stream_knowledge_score: knowledgePercentage,
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

    // Step 17: Follow-up UPDATE to guarantee adaptive aptitude data is correct
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

    console.log('[ANALYZE-COLLEGE] ✅ Scores calculated and stored successfully');
    console.log('[ANALYZE-COLLEGE] 🤖 Now triggering AI analysis for career suggestions...');

    // Step 18: Trigger AI analysis to generate career suggestions
    // This calls the /api/analyze-assessment endpoint which uses AI to generate
    // career fit clusters, skill gaps, roadmaps, etc.
    try {
      const url = new URL(context.request.url);
      const analyzeAssessmentUrl = `${url.protocol}//${url.host}/api/analyze-assessment/analyze`;
      
      console.log('[ANALYZE-COLLEGE] Calling AI analysis at:', analyzeAssessmentUrl);
      
      // Prepare assessment data for AI analysis
      // We need to fetch the full attempt data with all responses
      const { data: fullAttempt } = await supabase
        .from('personal_assessment_attempts')
        .select('*')
        .eq('id', attemptId)
        .single();
      
      if (!fullAttempt) {
        console.error('[ANALYZE-COLLEGE] Could not fetch full attempt for AI analysis');
        // Non-fatal - scores are already saved
      } else {
        // Call the AI analysis endpoint
        const aiResponse = await fetch(analyzeAssessmentUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': context.request.headers.get('Authorization') || '',
          },
          body: JSON.stringify({
            assessmentData: {
              attemptId: attemptId,
              learnerId: learnerId,
              gradeLevel: attempt.grade_level,
              stream: attempt.stream_id,
              // The AI endpoint will fetch the rest of the data from the database
            }
          })
        });
        
        if (aiResponse.ok) {
          const aiResults = await aiResponse.json();
          console.log('[ANALYZE-COLLEGE] ✅ AI analysis completed successfully');
          
          // Update the results with AI-generated data
          const { error: aiUpdateError } = await supabase
            .from('personal_assessment_results')
            .update({
              career_fit: aiResults.careerFit,
              skill_gap: aiResults.skillGap,
              roadmap: aiResults.roadmap,
              gemini_results: aiResults,
            })
            .eq('attempt_id', attemptId);
          
          if (aiUpdateError) {
            console.error('[ANALYZE-COLLEGE] Failed to update AI results:', aiUpdateError);
          }
        } else {
          const errorText = await aiResponse.text();
          console.error('[ANALYZE-COLLEGE] AI analysis failed:', aiResponse.status, errorText);
          // Non-fatal - scores are already saved
        }
      }
    } catch (aiError) {
      console.error('[ANALYZE-COLLEGE] Error during AI analysis:', aiError);
      // Non-fatal - scores are already saved, user can still see basic results
    }

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
        profileSnapshot,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ANALYZE-COLLEGE] Error during analysis:', error);
    console.error('[ANALYZE-COLLEGE] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('[ANALYZE-COLLEGE] Error message:', error instanceof Error ? error.message : String(error));
    
    return Response.json(
      {
        error: 'College analysis failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
