
import { PagesEnv } from '../../../../src/functions-lib/types';
import { GradeLevel, DifficultyLevel, Subtag, QuestionGenerationResult, Question } from '../adaptive-types';
import { getFallbackQuestion, reorderToPreventConsecutiveSubtags, generateQuestionId } from '../adaptive-utils';
import { ALL_SUBTAGS, buildSystemPrompt } from '../adaptive-constants';

// ---- AI Helpers ----

// Helper function to delay execution
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to repair and parse JSON from AI responses
function repairAndParseJSON(text: string): any {
    // Clean markdown
    let cleaned = text
        .replace(/```json\n?/gi, '')
        .replace(/```\n?/g, '')
        .trim();

    // Find JSON boundaries
    const startIdx = cleaned.indexOf('[');
    const endIdx = cleaned.lastIndexOf(']');
    if (startIdx === -1 || endIdx === -1) {
        throw new Error('No JSON array found in response');
    }
    cleaned = cleaned.substring(startIdx, endIdx + 1);

    try {
        return JSON.parse(cleaned);
    } catch (e) {
        console.log('⚠️ JSON parse failed, trying aggressive repair...');
        cleaned = cleaned.replace(/,\s*([\]}])/g, '$1'); // Remove trailing commas
        return JSON.parse(cleaned);
    }
}

// List of models to try in order (using reliable free models)
const FREE_MODELS = [
    'google/gemini-2.0-flash-001',
    'meta-llama/llama-3-8b-instruct:free',
    'google/gemini-pro',
];

// Call OpenRouter with retry
async function callOpenRouterWithRetry(
    openRouterKey: string,
    messages: Array<{ role: string, content: string }>,
    maxRetries: number = 3
): Promise<any[]> {
    let lastError: Error | null = null;

    for (const model of FREE_MODELS) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                console.log(`🔄 Trying ${model} (attempt ${attempt + 1}/${maxRetries})`);

                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${openRouterKey}`,
                        'HTTP-Referer': 'https://skillpassport.pages.dev',
                        'X-Title': 'SkillPassport Assessment'
                    },
                    body: JSON.stringify({
                        model: model,
                        max_tokens: 3000,
                        temperature: 0.7,
                        messages: messages
                    })
                });

                if (response.status === 429) {
                    const waitTime = Math.pow(2, attempt) * 2000;
                    await delay(waitTime);
                    continue;
                }

                if (!response.ok) {
                    throw new Error(`${model} failed: ${await response.text()}`);
                }

                const data = await response.json() as any;
                const content = data.choices?.[0]?.message?.content;

                if (content) {
                    return repairAndParseJSON(content);
                }

                throw new Error('Empty response');
            } catch (e: any) {
                console.error(`❌ ${model} error:`, e.message);
                lastError = e;
                if (attempt < maxRetries - 1) await delay(1000);
            }
        }
    }
    throw lastError || new Error('All models failed');
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
    const openRouterKey = env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY;
    const claudeKey = env.CLAUDE_API_KEY || env.VITE_CLAUDE_API_KEY;

    if (openRouterKey || claudeKey) {
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

            // Use helper to call AI
            // For now assume OpenRouter logic carries over (can add Claude specific path if needed)
            const aiQuestionsRaw = await callOpenRouterWithRetry(openRouterKey!, [
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
        console.warn('⚠️ No API keys found, skipping AI generation');
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
        generatedBy: result.usedAI ? 'ai' : 'fallback',
        modelUsed: result.usedAI ? 'gemini/openrouter' : 'offline-fallback'
    };
}
