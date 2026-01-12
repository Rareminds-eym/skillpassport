/**
 * Adaptive Assessment - Diagnostic Screener Handler
 * Generates 6 diagnostic questions to determine starting difficulty
 */

import type { Env, AdaptiveQuestion, DifficultyLevel, Subtag, TestPhase, AdaptiveQuestionGenerationResult } from '../../types';
import { jsonResponse, errorResponse } from '../../utils/response';
import { generateQuestionId } from '../../utils/uuid';
import { parseAIArrayResponse } from '../../utils/jsonParser';
import { ALL_SUBTAGS } from '../../config';
import { getAdaptiveCachedQuestions, cacheAdaptiveQuestions } from '../../services/cacheService';
import { callOpenRouterForAdaptive } from '../../services/openRouterService';
import { buildAdaptiveSystemPrompt, buildAdaptiveUserPrompt } from '../../prompts/adaptive';
import { getFallbackQuestion } from '../../fallbacks';

type GradeLevel = 'middle_school' | 'high_school';

interface DiagnosticRequestBody {
  gradeLevel: GradeLevel;
  excludeQuestionIds?: string[];
  excludeQuestionTexts?: string[];
}

export async function handleDiagnosticGeneration(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const body = await request.json() as DiagnosticRequestBody;
    const { gradeLevel, excludeQuestionIds = [], excludeQuestionTexts = [] } = body;

    if (!gradeLevel || !['middle_school', 'high_school'].includes(gradeLevel)) {
      return errorResponse('Valid gradeLevel is required (middle_school or high_school)', 400);
    }

    const result = await generateDiagnosticScreenerQuestions(
      env, gradeLevel, excludeQuestionIds, excludeQuestionTexts
    );
    return jsonResponse(result);
  } catch (error: any) {
    console.error('❌ Error generating diagnostic questions:', error);
    return errorResponse(error.message || 'Failed to generate questions', 500);
  }
}

function selectSubtagsForScreener(totalQuestions: number, minSubtags: number): Subtag[] {
  const shuffled = [...ALL_SUBTAGS].sort(() => Math.random() - 0.5);
  const selected: Subtag[] = [];
  
  for (let i = 0; i < Math.min(minSubtags, shuffled.length); i++) {
    selected.push(shuffled[i]);
  }
  
  while (selected.length < totalQuestions) {
    const nextSubtag = shuffled[selected.length % shuffled.length];
    selected.push(nextSubtag);
  }
  
  return selected;
}

function reorderToPreventConsecutiveSubtags(
  questions: AdaptiveQuestion[],
  maxConsecutive: number
): AdaptiveQuestion[] {
  if (questions.length <= 1) return questions;

  const result: AdaptiveQuestion[] = [];
  const remaining = [...questions];

  while (remaining.length > 0) {
    let consecutiveCount = 0;
    let lastSubtag: Subtag | null = null;
    
    for (let i = result.length - 1; i >= 0 && i >= result.length - maxConsecutive; i--) {
      if (lastSubtag === null) {
        lastSubtag = result[i].subtag;
        consecutiveCount = 1;
      } else if (result[i].subtag === lastSubtag) {
        consecutiveCount++;
      } else {
        break;
      }
    }

    let selectedIndex = 0;
    if (consecutiveCount >= maxConsecutive && lastSubtag !== null) {
      const differentIndex = remaining.findIndex((q) => q.subtag !== lastSubtag);
      if (differentIndex !== -1) {
        selectedIndex = differentIndex;
      }
    }

    result.push(remaining[selectedIndex]);
    remaining.splice(selectedIndex, 1);
  }

  return result;
}

async function generateDiagnosticScreenerQuestions(
  env: Env,
  gradeLevel: GradeLevel,
  excludeQuestionIds: string[] = [],
  excludeQuestionTexts: string[] = []
): Promise<AdaptiveQuestionGenerationResult> {
  console.log('🎯 generateDiagnosticScreenerQuestions:', { gradeLevel, excludeCount: excludeQuestionIds.length });
  const startTime = Date.now();
  
  const apiKey = env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const phase: TestPhase = 'diagnostic_screener';
  const selectedSubtags = selectSubtagsForScreener(6, 3);
  
  const questionSpecs: { difficulty: DifficultyLevel; subtag: Subtag }[] = [
    { difficulty: 2, subtag: selectedSubtags[0] },
    { difficulty: 2, subtag: selectedSubtags[1] },
    { difficulty: 3, subtag: selectedSubtags[2] },
    { difficulty: 3, subtag: selectedSubtags[3] },
    { difficulty: 4, subtag: selectedSubtags[4] },
    { difficulty: 4, subtag: selectedSubtags[5] },
  ];

  const usedQuestionIds = new Set<string>(excludeQuestionIds);
  const allQuestions: (AdaptiveQuestion | undefined)[] = new Array(6);
  const missingSpecs: { difficulty: DifficultyLevel; subtag: Subtag; index: number }[] = [];
  let cachedCount = 0;

  // Check cache sequentially
  console.log('📦 Checking cache sequentially...');
  for (let index = 0; index < questionSpecs.length; index++) {
    const spec = questionSpecs[index];
    const cached = await getAdaptiveCachedQuestions(
      env, gradeLevel, phase, spec.difficulty, spec.subtag, 5, Array.from(usedQuestionIds)
    );
    
    if (cached.length > 0) {
      const uniqueQuestion = cached.find(q => !usedQuestionIds.has(q.id));
      if (uniqueQuestion) {
        allQuestions[index] = uniqueQuestion;
        usedQuestionIds.add(uniqueQuestion.id);
        cachedCount++;
      } else {
        missingSpecs.push({ ...spec, index });
      }
    } else {
      missingSpecs.push({ ...spec, index });
    }
  }

  console.log(`📊 Cache hit: ${cachedCount}/6, need to generate: ${missingSpecs.length}`);

  let generatedCount = 0;

  // Generate missing questions
  if (missingSpecs.length > 0) {
    try {
      const systemPrompt = buildAdaptiveSystemPrompt(gradeLevel, 'diagnostic_screener');
      const userPrompt = buildAdaptiveUserPrompt(
        missingSpecs.map(s => ({ difficulty: s.difficulty, subtag: s.subtag })),
        gradeLevel,
        'diagnostic_screener'
      );

      const content = await callOpenRouterForAdaptive(apiKey, systemPrompt, userPrompt);
      const rawQuestions = parseAIArrayResponse(content);
      
      const batchGenerated = rawQuestions.map((raw: any, index: number) => {
        const spec = missingSpecs[index] || missingSpecs[0];
        return {
          id: generateQuestionId(gradeLevel, phase, spec.difficulty, spec.subtag),
          text: raw.text,
          options: raw.options,
          correctAnswer: raw.correctAnswer,
          difficulty: spec.difficulty,
          subtag: spec.subtag,
          gradeLevel,
          phase,
          explanation: raw.explanation,
          createdAt: new Date().toISOString(),
        };
      });
      
      batchGenerated.forEach((question: AdaptiveQuestion, i: number) => {
        if (question && missingSpecs[i] && !usedQuestionIds.has(question.id)) {
          allQuestions[missingSpecs[i].index] = question;
          usedQuestionIds.add(question.id);
          generatedCount++;
        }
      });
      
      // Cache generated questions
      if (batchGenerated.length > 0) {
        await cacheAdaptiveQuestions(env, batchGenerated);
      }
    } catch (genError) {
      console.error('❌ Batch generation failed:', genError);
    }
  }

  // Fallback for any still missing
  const usedFallbackTexts = new Set<string>(excludeQuestionTexts || []);
  allQuestions.forEach(q => { if (q) usedFallbackTexts.add(q.text); });
  
  questionSpecs.forEach((spec, i) => {
    if (!allQuestions[i]) {
      const fallback = getFallbackQuestion(gradeLevel, phase, spec.difficulty, spec.subtag, usedFallbackTexts);
      usedFallbackTexts.add(fallback.text);
      allQuestions[i] = fallback;
    }
  });

  const validQuestions = allQuestions.filter(q => q !== undefined) as AdaptiveQuestion[];
  const orderedQuestions = reorderToPreventConsecutiveSubtags(validQuestions, 1);

  const elapsed = Date.now() - startTime;
  console.log(`✅ Generated ${orderedQuestions.length} unique questions in ${elapsed}ms`);

  return {
    questions: orderedQuestions,
    fromCache: cachedCount > 0,
    generatedCount,
    cachedCount,
  };
}
