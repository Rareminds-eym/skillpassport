/**
 * Adaptive Assessment - Stability Confirmation Handler
 * Generates exactly 4 stability confirmation questions (Phase 3: Q18-Q21)
 * Questions are at or near the student's provisional aptitude band
 */

import type { Env, AdaptiveQuestion, DifficultyLevel, Subtag, TestPhase, AdaptiveQuestionGenerationResult } from '../../types';
import { jsonResponse, errorResponse } from '../../utils/response';
import { generateQuestionId } from '../../utils/uuid';
import { parseAIArrayResponse } from '../../utils/jsonParser';
import { getAdaptiveCachedQuestions, cacheAdaptiveQuestions } from '../../services/cacheService';
import { callOpenRouterForAdaptive } from '../../services/openRouterService';
import { buildAdaptiveSystemPrompt, buildAdaptiveUserPrompt } from '../../prompts/adaptive';
import { getFallbackQuestion } from '../../fallbacks';

type GradeLevel = 'middle_school' | 'high_school';

interface StabilityRequestBody {
  gradeLevel: GradeLevel;
  provisionalBand?: DifficultyLevel;
  count?: number;
  excludeQuestionIds?: string[];
  excludeQuestionTexts?: string[];
}

export async function handleStabilityGeneration(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const body = await request.json() as StabilityRequestBody;
    const { gradeLevel, provisionalBand = 3, count = 4, excludeQuestionIds = [], excludeQuestionTexts = [] } = body;

    if (!gradeLevel || !['middle_school', 'high_school'].includes(gradeLevel)) {
      return errorResponse('Valid gradeLevel is required (middle_school or high_school)', 400);
    }

    const result = await generateStabilityConfirmationQuestions(
      env, gradeLevel, provisionalBand as DifficultyLevel, count, excludeQuestionIds, excludeQuestionTexts
    );
    return jsonResponse(result);
  } catch (error: any) {
    console.error('❌ Error generating stability questions:', error);
    return errorResponse(error.message || 'Failed to generate questions', 500);
  }
}

function generateStabilityDifficulties(provisionalBand: DifficultyLevel, count: number): DifficultyLevel[] {
  const difficulties: DifficultyLevel[] = [];
  const minDifficulty = Math.max(1, provisionalBand - 1) as DifficultyLevel;
  const maxDifficulty = Math.min(5, provisionalBand + 1) as DifficultyLevel;
  const hasBoundaryItem = { lower: false, upper: false };
  
  for (let i = 0; i < count; i++) {
    let difficulty: DifficultyLevel;
    
    if (i === 0) {
      difficulty = provisionalBand;
    } else if (i === 1 && !hasBoundaryItem.lower && minDifficulty < provisionalBand) {
      difficulty = minDifficulty;
      hasBoundaryItem.lower = true;
    } else if (i === 2 && !hasBoundaryItem.upper && maxDifficulty > provisionalBand) {
      difficulty = maxDifficulty;
      hasBoundaryItem.upper = true;
    } else {
      const range = [minDifficulty, provisionalBand, maxDifficulty].filter(
        (d, idx, arr) => arr.indexOf(d) === idx
      );
      difficulty = range[Math.floor(Math.random() * range.length)];
    }
    
    difficulties.push(difficulty);
  }

  return difficulties;
}

function generateMixedFormatSubtags(count: number, maxConsecutive: number): Subtag[] {
  const dataFormats: Subtag[] = ['data_interpretation', 'pattern_recognition'];
  const logicFormats: Subtag[] = ['logical_reasoning', 'numerical_reasoning', 'verbal_reasoning', 'spatial_reasoning'];
  
  const sequence: Subtag[] = [];
  let useDataFormat = true;
  
  for (let i = 0; i < count; i++) {
    let consecutiveCount = 0;
    let lastSubtag: Subtag | null = null;
    
    for (let j = sequence.length - 1; j >= 0 && j >= sequence.length - maxConsecutive; j--) {
      if (lastSubtag === null) {
        lastSubtag = sequence[j];
        consecutiveCount = 1;
      } else if (sequence[j] === lastSubtag) {
        consecutiveCount++;
      } else {
        break;
      }
    }

    const pool = useDataFormat ? dataFormats : logicFormats;
    let selectedSubtag: Subtag;
    
    if (consecutiveCount >= maxConsecutive && lastSubtag !== null) {
      const available = pool.filter((s) => s !== lastSubtag);
      if (available.length > 0) {
        selectedSubtag = available[Math.floor(Math.random() * available.length)];
      } else {
        const otherPool = useDataFormat ? logicFormats : dataFormats;
        selectedSubtag = otherPool[Math.floor(Math.random() * otherPool.length)];
      }
    } else {
      selectedSubtag = pool[Math.floor(Math.random() * pool.length)];
    }
    
    sequence.push(selectedSubtag);
    useDataFormat = !useDataFormat;
  }

  return sequence;
}

async function generateStabilityConfirmationQuestions(
  env: Env,
  gradeLevel: GradeLevel,
  provisionalBand: DifficultyLevel,
  count: number = 4,
  excludeQuestionIds: string[] = [],
  excludeQuestionTexts: string[] = []
): Promise<AdaptiveQuestionGenerationResult> {
  console.log('🎯 generateStabilityConfirmationQuestions:', { gradeLevel, provisionalBand, count });
  const startTime = Date.now();
  
  const apiKey = env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const phase: TestPhase = 'stability_confirmation';
  // Phase 3: Exactly 4 stability confirmation questions (Q18-Q21)
  const questionCount = 4;

  const difficulties = generateStabilityDifficulties(provisionalBand, questionCount);
  const subtags = generateMixedFormatSubtags(questionCount, 2);
  
  const questionSpecs = difficulties.map((difficulty, i) => ({
    difficulty,
    subtag: subtags[i],
  }));

  const usedQuestionIds = new Set<string>(excludeQuestionIds);
  const usedQuestionTexts = new Set<string>(excludeQuestionTexts);
  
  const allQuestions: (AdaptiveQuestion | undefined)[] = new Array(questionCount);
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
      const uniqueQuestion = cached.find(q => !usedQuestionIds.has(q.id) && !usedQuestionTexts.has(q.text));
      if (uniqueQuestion) {
        allQuestions[index] = uniqueQuestion;
        usedQuestionIds.add(uniqueQuestion.id);
        usedQuestionTexts.add(uniqueQuestion.text);
        cachedCount++;
      } else {
        missingSpecs.push({ ...spec, index });
      }
    } else {
      missingSpecs.push({ ...spec, index });
    }
  }

  let generatedCount = 0;

  if (missingSpecs.length > 0) {
    try {
      const systemPrompt = buildAdaptiveSystemPrompt(gradeLevel, 'stability_confirmation');
      const userPrompt = buildAdaptiveUserPrompt(
        missingSpecs.map(s => ({ difficulty: s.difficulty, subtag: s.subtag })),
        gradeLevel,
        'stability_confirmation'
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
        if (question && missingSpecs[i] && !usedQuestionIds.has(question.id) && !usedQuestionTexts.has(question.text)) {
          allQuestions[missingSpecs[i].index] = question;
          usedQuestionIds.add(question.id);
          usedQuestionTexts.add(question.text);
          generatedCount++;
        }
      });
      
      if (batchGenerated.length > 0) {
        await cacheAdaptiveQuestions(env, batchGenerated);
      }
    } catch (genError) {
      console.error('❌ Batch generation failed:', genError);
    }
  }

  // Fallback for any still missing
  questionSpecs.forEach((spec, i) => {
    if (!allQuestions[i]) {
      const fallback = getFallbackQuestion(gradeLevel, phase, spec.difficulty, spec.subtag, usedQuestionTexts);
      usedQuestionTexts.add(fallback.text);
      allQuestions[i] = fallback;
    }
  });

  const validQuestions = allQuestions.filter(q => q !== undefined) as AdaptiveQuestion[];

  const elapsed = Date.now() - startTime;
  console.log(`✅ Generated ${validQuestions.length} unique questions in ${elapsed}ms`);

  return {
    questions: validQuestions,
    fromCache: cachedCount > 0,
    generatedCount,
    cachedCount,
  };
}
