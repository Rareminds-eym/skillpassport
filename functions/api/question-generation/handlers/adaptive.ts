
import { PagesEnv } from '../../../../src/functions-lib/types';
import { GradeLevel, DifficultyLevel, Subtag, QuestionGenerationResult, Question } from '../adaptive-types';
import { getFallbackQuestion, reorderToPreventConsecutiveSubtags, generateQuestionId } from '../adaptive-utils';
import { ALL_SUBTAGS, buildSystemPrompt } from '../adaptive-constants';
import {
    callOpenRouterWithRetry,
    repairAndParseJSON,
    getAPIKeys
} from '../../shared/ai-config';

// ---- AI Helpers ----
// All AI utility functions are now imported from centralized ai-config.ts

/**
 * Calculate similarity between two strings using Levenshtein distance
 * Returns a value between 0 (completely different) and 1 (identical)
 */
function calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
}

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
    
    const parsed = repairAndParseJSON(content);
    
    // Strict validation: Must be an array
    if (!Array.isArray(parsed)) {
        // Try to extract array from object wrapper
        if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed.questions)) {
                console.log('⚠️ Extracted questions array from wrapper object');
                return validateQuestionStructure(parsed.questions);
            }
            // Single object - wrap in array
            console.log('⚠️ Single object returned, wrapping in array');
            return validateQuestionStructure([parsed]);
        }
        throw new Error('Response is not an array or valid object');
    }
    
    // Validate array structure
    return validateQuestionStructure(parsed);
}

/**
 * Validate and enforce question structure
 * Ensures each question has required fields with correct types
 */
function validateQuestionStructure(questions: any[]): any[] {
    if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('Questions must be a non-empty array');
    }
    
    const validated = questions.map((q, index) => {
        // Check required fields
        if (!q || typeof q !== 'object') {
            throw new Error(`Question ${index + 1} is not an object`);
        }
        
        if (!q.text || typeof q.text !== 'string' || q.text.trim().length === 0) {
            throw new Error(`Question ${index + 1} missing or invalid 'text' field`);
        }
        
        if (!q.options || typeof q.options !== 'object') {
            throw new Error(`Question ${index + 1} missing or invalid 'options' field`);
        }
        
        // Validate options has A, B, C, D
        const requiredOptions = ['A', 'B', 'C', 'D'];
        for (const opt of requiredOptions) {
            if (!q.options[opt] || typeof q.options[opt] !== 'string') {
                throw new Error(`Question ${index + 1} missing or invalid option '${opt}'`);
            }
        }
        
        if (!q.correctAnswer || typeof q.correctAnswer !== 'string') {
            throw new Error(`Question ${index + 1} missing or invalid 'correctAnswer' field`);
        }
        
        if (!['A', 'B', 'C', 'D'].includes(q.correctAnswer.toUpperCase())) {
            throw new Error(`Question ${index + 1} correctAnswer must be A, B, C, or D, got: ${q.correctAnswer}`);
        }
        
        if (!q.explanation || typeof q.explanation !== 'string') {
            throw new Error(`Question ${index + 1} missing or invalid 'explanation' field`);
        }
        
        // Return validated and normalized question
        return {
            text: q.text.trim(),
            options: {
                A: q.options.A.trim(),
                B: q.options.B.trim(),
                C: q.options.C.trim(),
                D: q.options.D.trim(),
            },
            correctAnswer: q.correctAnswer.toUpperCase(),
            explanation: q.explanation.trim(),
        };
    });
    
    console.log(`✅ Validated ${validated.length} questions with correct structure`);
    return validated;
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
            const excludeTextsArray = Array.from(excludeTexts);
            const userPrompt = `Generate EXACTLY ${count} unique aptitude questions.
      
Requirements:
- Difficulty Level: ${difficulty} (Scale 1-5)
- Subtags to cover: ${subtags.join(', ')}
- Ensure questions are evenly distributed among these subtags
- CRITICAL: Each question MUST have completely different text from all others
- CRITICAL: Do NOT generate questions similar to these already used questions:
${excludeTextsArray.length > 0 ? excludeTextsArray.slice(0, 20).map((t, i) => `  ${i + 1}. "${t.substring(0, 100)}..."`).join('\n') : '  (No exclusions)'}

IMPORTANT OUTPUT FORMAT:
You MUST return a JSON array starting with [ and ending with ].
Each question object must have these exact fields:
- "text": string (the question text, keep it on one line)
- "options": object with keys "A", "B", "C", "D"
- "correctAnswer": string (one of "A", "B", "C", or "D")
- "explanation": string (brief explanation)

Example of correct format:
[
  {
    "text": "What is 2+2?",
    "options": {"A": "3", "B": "4", "C": "5", "D": "6"},
    "correctAnswer": "B",
    "explanation": "2+2=4"
  },
  {
    "text": "What is 3+3?",
    "options": {"A": "5", "B": "6", "C": "7", "D": "8"},
    "correctAnswer": "B",
    "explanation": "3+3=6"
  }
]

CRITICAL RULES:
1. Start your response with [ (opening bracket)
2. End your response with ] (closing bracket)
3. Do NOT wrap in markdown code blocks
4. Do NOT add any text before or after the JSON array
5. Keep question text concise and on single lines where possible
6. Ensure all strings are properly quoted
7. Ensure all commas are in the right places

Return ONLY the JSON array, nothing else.`;

            // Use centralized OpenRouter call with retry
            const aiQuestionsRaw = await callOpenRouterAndParse(openRouterKey, [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ]);

            if (Array.isArray(aiQuestionsRaw) && aiQuestionsRaw.length > 0) {
                // Filter out any questions that match excluded texts
                const filteredQuestions = aiQuestionsRaw.filter((q: any) => {
                    const questionText = q.text?.toLowerCase().trim();
                    if (!questionText) return false;
                    
                    // Check if this question text is too similar to any excluded text
                    for (const excludedText of excludeTexts) {
                        const excluded = excludedText.toLowerCase().trim();
                        // Exact match
                        if (questionText === excluded) {
                            console.warn(`⚠️ AI generated duplicate question (exact match): "${questionText.substring(0, 50)}..."`);
                            return false;
                        }
                        // Very similar (>90% match)
                        const similarity = calculateSimilarity(questionText, excluded);
                        if (similarity > 0.9) {
                            console.warn(`⚠️ AI generated very similar question (${(similarity * 100).toFixed(0)}% match): "${questionText.substring(0, 50)}..."`);
                            return false;
                        }
                    }
                    return true;
                });
                
                if (filteredQuestions.length === 0) {
                    console.error('❌ All AI-generated questions were duplicates, falling back');
                    throw new Error('All generated questions were duplicates');
                }
                
                const questions: Question[] = filteredQuestions.map((q: any, idx: number) => ({
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

                console.log(`✅ AI generated ${questions.length} unique questions (filtered from ${aiQuestionsRaw.length})`);
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
    // FIXED: Generate only 1 question at difficulty 1 for initial diagnostic
    // The diagnostic screener should be adaptive - generating questions one-by-one
    // based on student performance, not all upfront
    const count = 1;
    const difficulty = 1;
    
    // Select a random subtag for variety
    const subtags = [ALL_SUBTAGS[Math.floor(Math.random() * ALL_SUBTAGS.length)]];

    const result = await generateQuestionsWithAI(
        env,
        gradeLevel,
        'diagnostic',
        subtags,
        difficulty,
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
    excludeQuestionIds: string[] = [],
    excludeQuestionTexts: string[] = []
): Promise<QuestionGenerationResult> {
    // Try to generate 1 question of specific subtag
    const result = await generateQuestionsWithAI(
        env,
        gradeLevel,
        phase,
        [subtag],
        difficulty,
        1,
        new Set(excludeQuestionTexts) // Pass exclusion texts for duplicate detection
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
