
import { PagesEnv } from '../../../../src/functions-lib/types';
import { GradeLevel, DifficultyLevel, Subtag, QuestionGenerationResult, Question } from '../adaptive-types';
import { getFallbackQuestion, reorderToPreventConsecutiveSubtags, generateQuestionId } from '../adaptive-utils';
import { ALL_SUBTAGS, buildSystemPrompt } from '../adaptive-constants';
import {
    callOpenRouterWithRetry,
    repairAndParseJSON,
    delay,
    getAPIKeys
} from '../../shared/ai-config';

// ---- AI Helpers ----
// All AI utility functions are now imported from centralized ai-config.ts

// Wrap callOpenRouterWithRetry to parse JSON and return array
async function callOpenRouterAndParse(
    openRouterKey: string,
    messages: Array<{ role: string, content: string }>,
    maxRetries: number = 3
): Promise<any[]> {
    const content = await callOpenRouterWithRetry(openRouterKey, messages, {
        maxRetries,
        maxTokens: 3000,
        temperature: 0.7,
    });
    return repairAndParseJSON(content);
}

/**
 * Common function to generate questions via AI with fallback
 */
async function generateQuestionsWithAI(
    env: PagesEnv,
    gradeLevel: GradeLevel,
    phase: string,
    subtags: Subtag[],
    difficulty: DifficultyLevel,
    count: number,
    excludeTexts: Set<string>
): Promise<{ questions: Question[], usedAI: boolean }> {
    const { openRouter: openRouterKey } = getAPIKeys(env);

    if (openRouterKey) {
        try {
            console.log(`🤖 Generating ${count} questions for ${gradeLevel} (${phase}) - Difficulty ${difficulty}`);

            const systemPrompt = buildSystemPrompt(gradeLevel);
            const userPrompt = `Generate EXACTLY ${count} unique aptitude questions.
      
      Requirements:
      - Difficulty Level: ${difficulty} (Scale 1-5)
      - Subtags to cover: ${subtags.join(', ')}
      - Ensure questions are evenly distributed among these subtags.
      - Do NOT use these question texts (they are duplicate): ${Array.from(excludeTexts).slice(0, 10).join(' | ')}
      
      Output ONLY valid JSON array.`;

            // Use centralized OpenRouter call with retry
            const aiQuestionsRaw = await callOpenRouterAndParse(openRouterKey, [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]);

            if (Array.isArray(aiQuestionsRaw) && aiQuestionsRaw.length > 0) {
                const questions: Question[] = aiQuestionsRaw.map((q: any, idx: number) => ({
                    id: generateQuestionId(gradeLevel, phase as any, difficulty, subtags[idx % subtags.length]),
                    text: q.text,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation,
                    difficulty: difficulty,
                    subtag: subtags[idx % subtags.length] || 'logical_reasoning', // robust fallback assignment
                    gradeLevel: gradeLevel,
                    phase: phase as any,
                    createdAt: new Date().toISOString()
                }));

                console.log(`✅ AI generated ${questions.length} questions`);
                return { questions, usedAI: true };
            }
        } catch (e: any) {
            console.error('⚠️ AI generation failed, falling back:', e.message);
        }
    } else {
        console.warn('⚠️ OpenRouter API key not configured, using fallback questions');
    }

    // Fallback Logic
    console.log('🔄 Using fallback logic');
    const questions: Question[] = [];
    for (let i = 0; i < count; i++) {
        const subtag = subtags[i % subtags.length];
        const question = getFallbackQuestion(gradeLevel, phase as any, difficulty, subtag, excludeTexts);
        questions.push(question);
        excludeTexts.add(question.text);
    }
    return { questions, usedAI: false };
}


// ---- Handler Implementations ----

export async function generateDiagnosticScreenerQuestions(
    env: PagesEnv,
    gradeLevel: GradeLevel,
    excludeQuestionIds: string[] = [],
    excludeQuestionTexts: string[] = []
): Promise<QuestionGenerationResult> {
    const count = 8;
    const difficulty = 3;
    // Cyclical subtags for balanced variety
    const subtags = Array.from({ length: count }, (_, i) => ALL_SUBTAGS[i % ALL_SUBTAGS.length]);

    const result = await generateQuestionsWithAI(
        env,
        gradeLevel,
        'diagnostic',
        subtags,
        difficulty,
        count,
        new Set(excludeQuestionTexts)
    );

    const reordered = reorderToPreventConsecutiveSubtags(result.questions, 2);

    return {
        questions: reordered,
        fromCache: false,
        generatedCount: reordered.length,
        cachedCount: 0,
        generatedBy: result.usedAI ? 'ai' : 'fallback',
        modelUsed: result.usedAI ? 'gemini/openrouter' : 'offline-fallback'
    };
}

export async function generateAdaptiveCoreQuestions(
    env: PagesEnv,
    gradeLevel: GradeLevel,
    startingDifficulty: DifficultyLevel,
    count: number = 10,
    excludeQuestionIds: string[] = [],
    excludeQuestionTexts: string[] = []
): Promise<QuestionGenerationResult> {
    const subtags = Array.from({ length: count }, (_, i) => ALL_SUBTAGS[i % ALL_SUBTAGS.length]);

    const result = await generateQuestionsWithAI(
        env,
        gradeLevel,
        'core',
        subtags,
        startingDifficulty,
        count,
        new Set(excludeQuestionTexts)
    );

    const reordered = reorderToPreventConsecutiveSubtags(result.questions, 2);

    return {
        questions: reordered,
        fromCache: false,
        generatedCount: reordered.length,
        cachedCount: 0,
        generatedBy: result.usedAI ? 'ai' : 'fallback',
        modelUsed: result.usedAI ? 'gemini/openrouter' : 'offline-fallback'
    };
}

export async function generateStabilityConfirmationQuestions(
    env: PagesEnv,
    gradeLevel: GradeLevel,
    provisionalBand: DifficultyLevel,
    count: number = 4,
    excludeQuestionIds: string[] = [],
    excludeQuestionTexts: string[] = []
): Promise<QuestionGenerationResult> {
    const subtags = Array.from({ length: count }, (_, i) => ALL_SUBTAGS[i % ALL_SUBTAGS.length]);

    const result = await generateQuestionsWithAI(
        env,
        gradeLevel,
        'stability',
        subtags,
        provisionalBand,
        count,
        new Set(excludeQuestionTexts)
    );

    return {
        questions: result.questions,
        fromCache: false,
        generatedCount: result.questions.length,
        cachedCount: 0,
        generatedBy: result.usedAI ? 'ai' : 'fallback',
        modelUsed: result.usedAI ? 'gemini/openrouter' : 'offline-fallback'
    };
}

export async function generateSingleQuestion(
    env: PagesEnv,
    gradeLevel: GradeLevel,
    phase: string,
    difficulty: DifficultyLevel,
    subtag: Subtag,
    excludeQuestionIds: string[] = []
): Promise<QuestionGenerationResult> {
    // Try to generate 1 question of specific subtag
    const result = await generateQuestionsWithAI(
        env,
        gradeLevel,
        phase,
        [subtag],
        difficulty,
        1,
        new Set() // Can pass exclusions here if needed, but usually redundant for single generation retry
    );

    return {
        questions: result.questions,
        fromCache: false,
        generatedCount: result.questions.length,
        cachedCount: 0,
        generatedBy: result.usedAI ? 'ai' : 'fallback',
        modelUsed: result.usedAI ? 'gemini/openrouter' : 'offline-fallback'
    };
}
