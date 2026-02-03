
import { PagesEnv } from '../../../../src/functions-lib/types';
import { GradeLevel, DifficultyLevel, Subtag, QuestionGenerationResult, Question } from '../adaptive-types';
import { reorderToPreventConsecutiveSubtags, generateQuestionId } from '../adaptive-utils';
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
    maxRetries: number = 3,
    maxTokens: number = 1500  // Increased default for better completion
): Promise<any[]> {
    const content = await callOpenRouterWithRetry(openRouterKey, messages, {
        maxRetries,
        maxTokens,  // Use provided maxTokens
        temperature: 0.7,
    });
    
    console.log(`📄 [JSON-Parser] Received content length: ${content.length} characters`);
    console.log(`📄 [JSON-Parser] First 200 chars: ${content.substring(0, 200)}`);
    console.log(`📄 [JSON-Parser] Last 200 chars: ${content.substring(Math.max(0, content.length - 200))}`);
    
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
        console.error('❌ [JSON-Parser] Response is not an array or valid object:', typeof parsed);
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
        
        // Normalize correctAnswer to uppercase
        const normalizedAnswer = q.correctAnswer.trim().toUpperCase();
        
        if (!['A', 'B', 'C', 'D'].includes(normalizedAnswer)) {
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
            correctAnswer: normalizedAnswer,
            explanation: q.explanation.trim(),
        };
    });
    
    console.log(`✅ Validated ${validated.length} questions with correct structure`);
    return validated;
}

/**
 * Generate questions via AI only - no fallback questions
 */
async function generateQuestionsWithAI(
    env: PagesEnv,
    gradeLevel: GradeLevel,
    phase: string,
    subtags: Subtag[],
    difficulty: DifficultyLevel,
    count: number,
    excludeTexts: Set<string>
): Promise<Question[]> {
    console.log(`🎯 [Adaptive-Handler] Starting AI question generation`);
    console.log(`📋 [Adaptive-Handler] Parameters:`, {
        gradeLevel,
        phase,
        subtags: subtags.join(', '),
        difficulty,
        count,
        excludeTextsCount: excludeTexts.size
    });

    const { openRouter: openRouterKey } = getAPIKeys(env);

    if (!openRouterKey) {
        console.error(`❌ [Adaptive-Handler] No OpenRouter API key configured`);
        throw new Error('OpenRouter API key not configured. AI question generation requires API access.');
    }

    console.log(`🔑 [Adaptive-Handler] OpenRouter API key found (length: ${openRouterKey.length})`);

    const systemPrompt = buildSystemPrompt(gradeLevel);
    const excludeTextsArray = Array.from(excludeTexts);
    
    console.log(`📝 [Adaptive-Handler] System prompt length: ${systemPrompt.length} characters`);
    console.log(`🚫 [Adaptive-Handler] Excluding ${excludeTextsArray.length} previous questions`);

    const userPrompt = `Generate EXACTLY ${count} unique aptitude questions.
      
Requirements:
- Difficulty Level: ${difficulty} (Scale 1-5)
- Subtags to cover: ${subtags.join(', ')}
- Ensure questions are evenly distributed among these subtags
- CRITICAL: Each question MUST have completely different text from all others
- CRITICAL: Do NOT generate questions similar to these already used questions:
${excludeTextsArray.length > 0 ? excludeTextsArray.slice(0, 30).map((t, i) => `  ${i + 1}. "${t.substring(0, 150)}..."`).join('\n') : '  (No exclusions)'}

⚠️ UNIQUENESS REQUIREMENTS (CRITICAL):
- Use COMPLETELY DIFFERENT scenarios and contexts from the excluded questions above
- Change numerical values by at least 50% from any similar questions
- Use different measurement units (if one uses dollars, use meters/hours/pieces/etc.)
- Vary the problem structure (if one is about profit/loss, use time-speed-distance/ratio/percentage/etc.)
- Use different subjects (if one mentions fruits, use vehicles/animals/students/books/etc.)
- Create ORIGINAL contexts - do not repeat or slightly modify excluded scenarios
- If you see a pattern in excluded questions, deliberately avoid that pattern
- Think creatively - each question should feel fresh and unique

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
8. MOST IMPORTANT: Ensure questions are COMPLETELY UNIQUE and different from excluded questions

Return ONLY the JSON array, nothing else.`;

    console.log(`📤 [Adaptive-Handler] User prompt length: ${userPrompt.length} characters`);

    // Calculate appropriate token limit based on question count
    // Each question needs ~150-200 tokens, add buffer for formatting
    const estimatedTokens = Math.max(1500, count * 200 + 500);
    console.log(`🎯 [Adaptive-Handler] Using ${estimatedTokens} max tokens for ${count} questions`);

    // Use centralized OpenRouter call with retry
    console.log(`🚀 [Adaptive-Handler] Calling OpenRouter API...`);
    const aiQuestionsRaw = await callOpenRouterAndParse(
        openRouterKey, 
        [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ],
        3,  // maxRetries
        estimatedTokens  // maxTokens
    );

    console.log(`📥 [Adaptive-Handler] Received AI response, validating...`);

    if (!Array.isArray(aiQuestionsRaw) || aiQuestionsRaw.length === 0) {
        console.error(`❌ [Adaptive-Handler] AI response validation failed:`, {
            isArray: Array.isArray(aiQuestionsRaw),
            length: aiQuestionsRaw?.length || 0,
            type: typeof aiQuestionsRaw
        });
        throw new Error('AI failed to generate valid questions');
    }

    console.log(`✅ [Adaptive-Handler] AI generated ${aiQuestionsRaw.length} raw questions`);

    // Filter out any questions that match excluded texts
    // CHANGED: Use 85% threshold instead of 90% to allow more questions through
    console.log(`🔍 [Adaptive-Handler] Filtering for duplicates (85% similarity threshold)...`);
    const filteredQuestions = aiQuestionsRaw.filter((q: any, index: number) => {
        const questionText = q.text?.toLowerCase().trim();
        if (!questionText) {
            console.warn(`⚠️ [Adaptive-Handler] Question ${index + 1} has no text, filtering out`);
            return false;
        }
        
        // Check if this question text is too similar to any excluded text
        for (const excludedText of excludeTexts) {
            const excluded = excludedText.toLowerCase().trim();
            // Exact match
            if (questionText === excluded) {
                console.warn(`⚠️ [Adaptive-Handler] Question ${index + 1} is exact duplicate: "${questionText.substring(0, 50)}..."`);
                return false;
            }
            // Very similar (>85% match) - CHANGED from 90% to 85%
            const similarity = calculateSimilarity(questionText, excluded);
            if (similarity > 0.85) {
                console.warn(`⚠️ [Adaptive-Handler] Question ${index + 1} is ${(similarity * 100).toFixed(0)}% similar: "${questionText.substring(0, 50)}..."`);
                return false;
            }
        }
        return true;
    });
    
    console.log(`🔍 [Adaptive-Handler] After filtering: ${filteredQuestions.length}/${aiQuestionsRaw.length} questions remain`);

    // CHANGED: Don't throw error if all filtered out, just log warning and return what we have
    if (filteredQuestions.length === 0) {
        console.warn(`⚠️ [Adaptive-Handler] All questions were filtered as duplicates, using best available`);
        // Use the least similar question from the raw set
        let leastSimilar = aiQuestionsRaw[0];
        let lowestSimilarity = 1.0;
        
        for (const q of aiQuestionsRaw) {
            const questionText = q.text?.toLowerCase().trim();
            if (!questionText) continue;
            
            let maxSimilarity = 0;
            for (const excludedText of excludeTexts) {
                const similarity = calculateSimilarity(questionText, excludedText.toLowerCase().trim());
                maxSimilarity = Math.max(maxSimilarity, similarity);
            }
            
            if (maxSimilarity < lowestSimilarity) {
                lowestSimilarity = maxSimilarity;
                leastSimilar = q;
            }
        }
        
        console.log(`📊 [Adaptive-Handler] Using least similar question (${(lowestSimilarity * 100).toFixed(0)}% similarity)`);
        return [leastSimilar].map((q: any, idx: number) => {
            const assignedSubtag = subtags[idx % subtags.length] || 'logical_reasoning';
            return {
                id: generateQuestionId(gradeLevel, phase as any, difficulty, assignedSubtag),
                text: q.text,
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
                difficulty: difficulty,
                subtag: assignedSubtag,
                gradeLevel: gradeLevel,
                phase: phase as any,
                createdAt: new Date().toISOString()
            };
        });
    }
    
    console.log(`🏗️ [Adaptive-Handler] Building final question objects...`);
    const questions: Question[] = filteredQuestions.map((q: any, idx: number) => {
        const assignedSubtag = subtags[idx % subtags.length] || 'logical_reasoning';
        console.log(`📝 [Adaptive-Handler] Question ${idx + 1}: "${q.text?.substring(0, 50)}..." -> ${assignedSubtag}`);
        
        return {
            id: generateQuestionId(gradeLevel, phase as any, difficulty, assignedSubtag),
            text: q.text,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            difficulty: difficulty,
            subtag: assignedSubtag,
            gradeLevel: gradeLevel,
            phase: phase as any,
            createdAt: new Date().toISOString()
        };
    });

    console.log(`✅ [Adaptive-Handler] Successfully generated ${questions.length} unique questions`);
    console.log(`📊 [Adaptive-Handler] Question distribution:`, 
        questions.reduce((acc, q) => {
            acc[q.subtag] = (acc[q.subtag] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
    );

    return questions;
}


// ---- Handler Implementations ----

export async function generateDiagnosticScreenerQuestions(
    env: PagesEnv,
    gradeLevel: GradeLevel,
    excludeQuestionIds: string[] = [],
    excludeQuestionTexts: string[] = []
): Promise<QuestionGenerationResult> {
    console.log(`🎯 [Diagnostic-Handler] Starting diagnostic screener generation`);
    console.log(`📋 [Diagnostic-Handler] Parameters:`, {
        gradeLevel,
        excludeQuestionIds: excludeQuestionIds.length,
        excludeQuestionTexts: excludeQuestionTexts.length
    });

    const count = 8;
    const difficulty = 3;
    // Cyclical subtags for balanced variety
    const subtags = Array.from({ length: count }, (_, i) => ALL_SUBTAGS[i % ALL_SUBTAGS.length]);

    console.log(`⚙️ [Diagnostic-Handler] Configuration:`, {
        count,
        difficulty,
        subtags: subtags.join(', ')
    });

    try {
        const startTime = Date.now();
        let questions = await generateQuestionsWithAI(
            env,
            gradeLevel,
            'diagnostic',
            subtags,
            difficulty,
            count,
            new Set(excludeQuestionTexts)
        );

        // If we got fewer questions than requested due to filtering, try to generate more
        if (questions.length < count) {
            console.warn(`⚠️ [Diagnostic-Handler] Only got ${questions.length}/${count} questions after filtering`);
            console.log(`🔄 [Diagnostic-Handler] Attempting to generate ${count - questions.length} more questions...`);
            
            const remainingCount = count - questions.length;
            const remainingSubtags = Array.from({ length: remainingCount }, (_, i) => ALL_SUBTAGS[i % ALL_SUBTAGS.length]);
            
            // Add already generated questions to exclusion list
            const updatedExcludeTexts = new Set([
                ...excludeQuestionTexts,
                ...questions.map(q => q.text)
            ]);
            
            try {
                const additionalQuestions = await generateQuestionsWithAI(
                    env,
                    gradeLevel,
                    'diagnostic',
                    remainingSubtags,
                    difficulty,
                    remainingCount,
                    updatedExcludeTexts
                );
                
                questions = [...questions, ...additionalQuestions];
                console.log(`✅ [Diagnostic-Handler] Generated ${additionalQuestions.length} additional questions`);
            } catch (retryError: any) {
                console.error(`❌ [Diagnostic-Handler] Failed to generate additional questions:`, retryError.message);
                // Continue with what we have
            }
        }

        const reordered = reorderToPreventConsecutiveSubtags(questions, 2);
        const duration = Date.now() - startTime;

        console.log(`✅ [Diagnostic-Handler] Successfully generated ${reordered.length} questions in ${duration}ms`);
        console.log(`🔄 [Diagnostic-Handler] Reordered to prevent consecutive subtags`);
        
        if (reordered.length < count) {
            console.warn(`⚠️ [Diagnostic-Handler] WARNING: Expected ${count} questions but only generated ${reordered.length}`);
        }

        return {
            questions: reordered,
            fromCache: false,
            generatedCount: reordered.length,
            cachedCount: 0,
            generatedBy: 'ai',
            modelUsed: 'openai/chatgpt-4o-latest'
        };
    } catch (error: any) {
        console.error(`❌ [Diagnostic-Handler] Failed to generate diagnostic questions:`, error.message);
        console.error(`🔍 [Diagnostic-Handler] Error details:`, {
            name: error.name,
            stack: error.stack?.substring(0, 500)
        });
        throw new Error(`Failed to generate diagnostic questions: ${error.message}`);
    }
}

export async function generateAdaptiveCoreQuestions(
    env: PagesEnv,
    gradeLevel: GradeLevel,
    startingDifficulty: DifficultyLevel,
    count: number = 10,
    excludeQuestionIds: string[] = [],
    excludeQuestionTexts: string[] = []
): Promise<QuestionGenerationResult> {
    console.log(`🎯 [Adaptive-Core-Handler] Starting adaptive core generation`);
    console.log(`📋 [Adaptive-Core-Handler] Parameters:`, {
        gradeLevel,
        startingDifficulty,
        count,
        excludeQuestionIds: excludeQuestionIds.length,
        excludeQuestionTexts: excludeQuestionTexts.length
    });

    const subtags = Array.from({ length: count }, (_, i) => ALL_SUBTAGS[i % ALL_SUBTAGS.length]);

    console.log(`⚙️ [Adaptive-Core-Handler] Configuration:`, {
        subtags: subtags.join(', ')
    });

    try {
        const startTime = Date.now();
        const questions = await generateQuestionsWithAI(
            env,
            gradeLevel,
            'core',
            subtags,
            startingDifficulty,
            count,
            new Set(excludeQuestionTexts)
        );

        const reordered = reorderToPreventConsecutiveSubtags(questions, 2);
        const duration = Date.now() - startTime;

        console.log(`✅ [Adaptive-Core-Handler] Successfully generated ${reordered.length} questions in ${duration}ms`);
        console.log(`🔄 [Adaptive-Core-Handler] Reordered to prevent consecutive subtags`);

        return {
            questions: reordered,
            fromCache: false,
            generatedCount: reordered.length,
            cachedCount: 0,
            generatedBy: 'ai',
            modelUsed: 'openai/chatgpt-4o-latest'
        };
    } catch (error: any) {
        console.error(`❌ [Adaptive-Core-Handler] Failed to generate adaptive core questions:`, error.message);
        console.error(`🔍 [Adaptive-Core-Handler] Error details:`, {
            name: error.name,
            stack: error.stack?.substring(0, 500)
        });
        throw new Error(`Failed to generate adaptive core questions: ${error.message}`);
    }
}

export async function generateStabilityConfirmationQuestions(
    env: PagesEnv,
    gradeLevel: GradeLevel,
    provisionalBand: DifficultyLevel,
    count: number = 6,  // Default to 6 questions for stability confirmation
    excludeQuestionIds: string[] = [],
    excludeQuestionTexts: string[] = []
): Promise<QuestionGenerationResult> {
    console.log(`🎯 [Stability-Handler] Starting stability confirmation generation`);
    console.log(`📋 [Stability-Handler] Parameters:`, {
        gradeLevel,
        provisionalBand,
        count,
        excludeQuestionIds: excludeQuestionIds.length,
        excludeQuestionTexts: excludeQuestionTexts.length
    });

    const subtags = Array.from({ length: count }, (_, i) => ALL_SUBTAGS[i % ALL_SUBTAGS.length]);

    console.log(`⚙️ [Stability-Handler] Configuration:`, {
        subtags: subtags.join(', ')
    });

    try {
        const startTime = Date.now();
        let questions = await generateQuestionsWithAI(
            env,
            gradeLevel,
            'stability',
            subtags,
            provisionalBand,
            count,
            new Set(excludeQuestionTexts)
        );

        console.log(`📊 [Stability-Handler] After generateQuestionsWithAI: ${questions.length} questions`);

        // If we got fewer questions than requested due to filtering, try to generate more
        // CRITICAL: Use multiple retry attempts to ensure we get exactly 6 questions
        let retryAttempts = 0;
        const maxRetryAttempts = 3;
        
        while (questions.length < count && retryAttempts < maxRetryAttempts) {
            const missing = count - questions.length;
            retryAttempts++;
            
            console.warn(`⚠️ [Stability-Handler] Only got ${questions.length}/${count} questions (attempt ${retryAttempts}/${maxRetryAttempts})`);
            console.log(`🔄 [Stability-Handler] Attempting to generate ${missing} more questions...`);
            
            const remainingSubtags = Array.from({ length: missing }, (_, i) => ALL_SUBTAGS[i % ALL_SUBTAGS.length]);
            
            // Add already generated questions to exclusion list
            const updatedExcludeTexts = new Set([
                ...excludeQuestionTexts,
                ...questions.map(q => q.text)
            ]);
            
            console.log(`📋 [Stability-Handler] Retry ${retryAttempts} parameters:`, {
                missing,
                remainingSubtags: remainingSubtags.join(', '),
                totalExclusions: updatedExcludeTexts.size
            });
            
            try {
                // On later retries, use slightly different difficulty to get more variety
                const retryDifficulty = retryAttempts > 1 
                    ? Math.max(1, Math.min(5, provisionalBand + (retryAttempts % 2 === 0 ? 1 : -1))) as DifficultyLevel
                    : provisionalBand;
                
                if (retryAttempts > 1) {
                    console.log(`🎲 [Stability-Handler] Using adjusted difficulty ${retryDifficulty} for variety`);
                }
                
                const additionalQuestions = await generateQuestionsWithAI(
                    env,
                    gradeLevel,
                    'stability',
                    remainingSubtags,
                    retryDifficulty,
                    missing,
                    updatedExcludeTexts
                );
                
                if (additionalQuestions.length > 0) {
                    questions = [...questions, ...additionalQuestions];
                    console.log(`✅ [Stability-Handler] Generated ${additionalQuestions.length} additional questions. Total: ${questions.length}`);
                } else {
                    console.warn(`⚠️ [Stability-Handler] Retry ${retryAttempts} returned no questions`);
                }
            } catch (retryError: any) {
                console.error(`❌ [Stability-Handler] Retry ${retryAttempts} failed:`, retryError.message);
                // Continue to next retry attempt
            }
        }
        
        // Final check - if still don't have 6, log critical warning but continue
        if (questions.length < count) {
            console.error(`❌ [Stability-Handler] CRITICAL: Only have ${questions.length}/${count} questions after ${maxRetryAttempts} retry attempts`);
            console.error(`❌ [Stability-Handler] Test will complete with fewer stability questions than expected`);
        }

        const duration = Date.now() - startTime;

        console.log(`✅ [Stability-Handler] Successfully generated ${questions.length} questions in ${duration}ms`);
        
        if (questions.length < count) {
            console.warn(`⚠️ [Stability-Handler] WARNING: Expected ${count} questions but only generated ${questions.length}`);
        }

        return {
            questions: questions,
            fromCache: false,
            generatedCount: questions.length,
            cachedCount: 0,
            generatedBy: 'ai',
            modelUsed: 'openai/chatgpt-4o-latest'
        };
    } catch (error: any) {
        console.error(`❌ [Stability-Handler] Failed to generate stability confirmation questions:`, error.message);
        console.error(`🔍 [Stability-Handler] Error details:`, {
            name: error.name,
            stack: error.stack?.substring(0, 500)
        });
        throw new Error(`Failed to generate stability confirmation questions: ${error.message}`);
    }
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
    console.log(`🎯 [Single-Question-Handler] Starting single question generation`);
    console.log(`📋 [Single-Question-Handler] Parameters:`, {
        gradeLevel,
        phase,
        difficulty,
        subtag,
        excludeQuestionIds: excludeQuestionIds.length,
        excludeQuestionTexts: excludeQuestionTexts.length
    });

    try {
        const startTime = Date.now();
        const questions = await generateQuestionsWithAI(
            env,
            gradeLevel,
            phase,
            [subtag],
            difficulty,
            1,
            new Set(excludeQuestionTexts)
        );

        const duration = Date.now() - startTime;

        console.log(`✅ [Single-Question-Handler] Successfully generated ${questions.length} question in ${duration}ms`);

        return {
            questions: questions,
            fromCache: false,
            generatedCount: questions.length,
            cachedCount: 0,
            generatedBy: 'ai',
            modelUsed: 'openai/chatgpt-4o-latest'
        };
    } catch (error: any) {
        console.error(`❌ [Single-Question-Handler] Failed to generate single question:`, error.message);
        console.error(`🔍 [Single-Question-Handler] Error details:`, {
            name: error.name,
            stack: error.stack?.substring(0, 500)
        });
        throw new Error(`Failed to generate single question: ${error.message}`);
    }
}
