/**
 * Adaptive Assessment - Core Questions Handler
 * Generates 8-11 adaptive core questions based on starting difficulty
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

interface CoreRequestBody {
  gradeLevel: GradeLevel;
  startingDifficulty?: DifficultyLevel;
  count?: number;
  excludeQuestionIds?: string[];
  excludeQuestionTexts?: string[];
}

export async function handleCoreGeneration(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const body = await request.json() as CoreRequestBody;
    const { gradeLevel, startingDifficulty = 3, count = 10, excludeQuestionIds = [], excludeQuestionTexts = [] } = body;

    if (!gradeLevel || !['middle_school', 'high_school'].includes(gradeLevel)) {
      return errorResponse('Valid gradeLevel is required (middle_school or high_school)', 400);
    }

    const result = await generateAdaptiveCoreQuestions(
      env, gradeLevel, startingDifficulty as DifficultyLevel, count, excludeQuestionIds, excludeQuestionTexts
    );
    return jsonResponse(result);
  } catch (error: any) {
    console.error('❌ Error generating adaptive questions:', error);
    return errorResponse(error.message || 'Failed to generate questions', 500);
  }
}

function generateDifficultyRange(startingDifficulty: DifficultyLevel, count: number): DifficultyLevel[] {
  const difficulties: DifficultyLevel[] = [startingDifficulty];
  let consecutiveSameDirection = 0;
  let lastDirection: 'up' | 'down' | null = null;

  for (let i = 1; i < count; i++) {
    const current = difficulties[i - 1];
    const canGoUp = current < 5;
    const canGoDown = current > 1;
    const mustChangeDirection = consecutiveSameDirection >= 2;
    
    let nextDifficulty: DifficultyLevel;
    
    if (mustChangeDirection) {
      if (lastDirection === 'up' && canGoDown) {
        nextDifficulty = (current - 1) as DifficultyLevel;
        lastDirection = 'down';
        consecutiveSameDirection = 1;
      } else if (lastDirection === 'down' && canGoUp) {
        nextDifficulty = (current + 1) as DifficultyLevel;
        lastDirection = 'up';
        consecutiveSameDirection = 1;
      } else {
        nextDifficulty = current;
        consecutiveSameDirection = 0;
        lastDirection = null;
      }
    } else {
      const random = Math.random();
      
      if (random < 0.4 && canGoUp) {
        nextDifficulty = (current + 1) as DifficultyLevel;
        if (lastDirection === 'up') consecutiveSameDirection++;
        else { lastDirection = 'up'; consecutiveSameDirection = 1; }
      } else if (random < 0.8 && canGoDown) {
        nextDifficulty = (current - 1) as DifficultyLevel;
        if (lastDirection === 'down') consecutiveSameDirection++;
        else { lastDirection = 'down'; consecutiveSameDirection = 1; }
      } else {
        nextDifficulty = current;
        consecutiveSameDirection = 0;
        lastDirection = null;
      }
    }
    
    difficulties.push(nextDifficulty);
  }

  return difficulties;
}

function generateBalancedSubtagSequence(count: number, maxConsecutive: number): Subtag[] {
  const sequence: Subtag[] = [];
  const shuffledSubtags = [...ALL_SUBTAGS].sort(() => Math.random() - 0.5);
  
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

    let selectedSubtag: Subtag;
    
    if (consecutiveCount >= maxConsecutive && lastSubtag !== null) {
      const available = shuffledSubtags.filter((s) => s !== lastSubtag);
      selectedSubtag = available[i % available.length];
    } else {
      selectedSubtag = shuffledSubtags[i % shuffledSubtags.length];
    }
    
    sequence.push(selectedSubtag);
  }

  return sequence;
}

async function generateAdaptiveCoreQuestions(
  env: Env,
  gradeLevel: GradeLevel,
  startingDifficulty: DifficultyLevel,
  count: number = 10,
  excludeQuestionIds: string[] = [],
  excludeQuestionTexts: string[] = []
): Promise<AdaptiveQuestionGenerationResult> {
  console.log('🎯 generateAdaptiveCoreQuestions:', { gradeLevel, startingDifficulty, count });
  const startTime = Date.now();
  
  const apiKey = env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const phase: TestPhase = 'adaptive_core';
  const questionCount = Math.min(Math.max(count, 8), 11);

  const difficultyRange = generateDifficultyRange(startingDifficulty, questionCount);
  const subtagSequence = generateBalancedSubtagSequence(questionCount, 2);
  
  const questionSpecs = difficultyRange.map((difficulty, i) => ({
    difficulty,
    subtag: subtagSequence[i],
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
      const systemPrompt = buildAdaptiveSystemPrompt(gradeLevel);
      const userPrompt = buildAdaptiveUserPrompt(
        missingSpecs.map(s => ({ difficulty: s.difficulty, subtag: s.subtag })),
        gradeLevel
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
