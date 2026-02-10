
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
        
        // Clean option text - remove any A), B), C), D) prefixes that AI might add
        const cleanOption = (text: string) => {
            return text.trim().replace(/^[A-D]\)\s*/i, '');
        };

        const cleanedOptions = {
            A: cleanOption(q.options.A),
            B: cleanOption(q.options.B),
            C: cleanOption(q.options.C),
            D: cleanOption(q.options.D),
        };

        // CRITICAL: Validate that all options are unique
        const optionValues = Object.values(cleanedOptions);
        const uniqueValues = new Set(optionValues.map(v => v.toLowerCase().trim()));
        if (uniqueValues.size < 4) {
            throw new Error(`Question ${index + 1} has duplicate options: ${JSON.stringify(cleanedOptions)}`);
        }

        // CRITICAL: Validate that all options are non-empty
        if (optionValues.some(v => !v || v.trim().length === 0)) {
            throw new Error(`Question ${index + 1} has empty options`);
        }

        // CRITICAL: Verify the correct answer actually exists in the options
        // This catches cases where AI says answer is "B" but the actual answer value isn't in any option
        const correctAnswerText = cleanedOptions[normalizedAnswer];
        if (!correctAnswerText) {
            throw new Error(`Question ${index + 1}: correctAnswer "${normalizedAnswer}" does not map to any option`);
        }

        // ENHANCED: Cross-validate the explanation with the correct answer
        const explanationLower = q.explanation?.toLowerCase() || '';
        const correctAnswerLower = correctAnswerText.toLowerCase().trim();
        
        // Check if the explanation mentions a different answer than what's in the options
        // This catches cases where AI calculates "60" in explanation but puts "55" in the option
        const explanationNumbers = explanationLower.match(/=\s*(\d+\.?\d*)/g);
        const optionNumbers = correctAnswerLower.match(/\d+\.?\d*/g);
        
        if (explanationNumbers && explanationNumbers.length > 0 && optionNumbers && optionNumbers.length > 0) {
            // Extract the final calculated value from explanation (usually after the last =)
            const lastCalc = explanationNumbers[explanationNumbers.length - 1].replace(/[=\s]/g, '');
            const optionValue = optionNumbers[0];
            
            // If they don't match, this is likely wrong
            if (lastCalc !== optionValue) {
                console.warn(`⚠️ [Validation] Question ${index + 1}: Explanation shows "${lastCalc}" but correct option has "${optionValue}"`);
                console.warn(`   This question may have incorrect answer mapping!`);
                throw new Error(`Question ${index + 1}: Explanation result (${lastCalc}) doesn't match correct answer option (${optionValue})`);
            }
        }

        // ENHANCED: Check if this is a math question and validate the answer makes sense
        const questionLower = q.text.toLowerCase();
        const hasCalculation = /\d+.*[+\-*/×÷].*\d+|calculate|compute|what is|value of|result of|find|solve/.test(questionLower);
        
        if (hasCalculation) {
            console.log(`🔢 [Validation] Question ${index + 1} appears to be a calculation question`);
            console.log(`   Question: ${q.text.substring(0, 100)}...`);
            console.log(`   Correct answer (${normalizedAnswer}): ${correctAnswerText}`);
            console.log(`   Explanation: ${q.explanation.substring(0, 100)}...`);
            console.log(`   All options: A="${cleanedOptions.A}" B="${cleanedOptions.B}" C="${cleanedOptions.C}" D="${cleanedOptions.D}"`);
            
            // Check if the question has numbers and operators
            const questionHasNumbers = /\d+/.test(questionLower);
            const answerIsNumber = /^\d+\.?\d*$/.test(correctAnswerText.trim());
            
            // CRITICAL: For math questions, verify at least one option is numeric
            const optionValues = Object.values(cleanedOptions);
            const numericOptions = optionValues.filter(v => /^\d+\.?\d*$/.test(v.trim()));
            
            if (questionHasNumbers && numericOptions.length === 0) {
                console.error(`❌ [Validation] Question ${index + 1}: Math question but NO numeric options!`);
                throw new Error(`Question ${index + 1}: Math question has no numeric answer options`);
            }
            
            if (questionHasNumbers && !answerIsNumber) {
                console.warn(`⚠️ [Validation] Question ${index + 1}: Math question but correct answer is not numeric: "${correctAnswerText}"`);
                console.warn(`   This question may have incorrect answer mapping!`);
                
                // Try to find if any option looks like a calculated answer
                if (numericOptions.length > 0) {
                    console.warn(`   Available numeric options: ${numericOptions.join(', ')}`);
                }
            }
        }
        
        // ENHANCED: For non-math questions, check if explanation contradicts the answer
        if (!hasCalculation && explanationLower.length > 0) {
            // Look for common patterns where explanation states the answer
            const answerPatterns = [
                /answer is (.+?)[\.\,]/i,
                /correct answer is (.+?)[\.\,]/i,
                /therefore (.+?)[\.\,]/i,
                /thus (.+?)[\.\,]/i,
                /so (.+?)[\.\,]/i
            ];
            
            for (const pattern of answerPatterns) {
                const match = q.explanation.match(pattern);
                if (match && match[1]) {
                    const explainedAnswer = match[1].trim().toLowerCase();
                    const actualAnswer = correctAnswerText.toLowerCase();
                    
                    // Check if they're similar (allowing for minor differences)
                    if (explainedAnswer.length > 3 && actualAnswer.length > 3) {
                        const similarity = calculateSimilarity(explainedAnswer, actualAnswer);
                        if (similarity < 0.5) {
                            console.warn(`⚠️ [Validation] Question ${index + 1}: Explanation mentions "${explainedAnswer}" but correct option is "${actualAnswer}"`);
                            console.warn(`   Similarity: ${(similarity * 100).toFixed(0)}% - This may be incorrect!`);
                        }
                    }
                }
            }
        }

        // Return validated and normalized question
        return {
            text: q.text.trim(),
            options: cleanedOptions,
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
    excludeTexts: Set<string>,
    studentCourse?: string | null
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

    const systemPrompt = buildSystemPrompt(gradeLevel, studentCourse);
    const excludeTextsArray = Array.from(excludeTexts);
    
    console.log(`📝 [Adaptive-Handler] System prompt length: ${systemPrompt.length} characters`);
    console.log(`🚫 [Adaptive-Handler] Excluding ${excludeTextsArray.length} previous questions`);
    if (studentCourse) {
        console.log(`🎓 [Adaptive-Handler] Generating course-specific questions for: ${studentCourse}`);
    }

    // Build course context for college students
    const courseContext = studentCourse
        ? `\n\n🎓 COURSE-SPECIFIC CONTEXT:\nThe student is studying ${studentCourse}. Frame questions using scenarios, examples, and contexts relevant to this field of study. Use terminology and situations that a ${studentCourse} student would encounter.`
        : '';

    const userPrompt = `Generate EXACTLY ${count} unique aptitude questions.
      
Requirements:
- Difficulty Level: ${difficulty} (Scale 1-5)
- Subtags to cover: ${subtags.join(', ')}
- Ensure questions are evenly distributed among these subtags${courseContext}
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

⚠️ CRITICAL: CORRECT ANSWER MUST BE IN OPTIONS ⚠️
**THIS IS THE MOST IMPORTANT RULE - READ CAREFULLY:**

For EVERY question type (math, logic, verbal, reasoning, etc.):
1. **DETERMINE THE CORRECT ANSWER FIRST** - Know what the right answer is before creating options
2. **PUT THE EXACT CORRECT ANSWER in one of the options** (A, B, C, or D)
3. Create 3 different WRONG answers for the other options
4. **VERIFY**: Look at your correctAnswer field - that EXACT value MUST appear in one of the options
5. **DOUBLE-CHECK**: Read through all 4 options and confirm the correct answer is there

**Example CORRECT (Math):**
{
  "text": "If a train travels 120 km in 2 hours, what is its average speed?",
  "options": {"A": "50 km/h", "B": "60 km/h", "C": "70 km/h", "D": "80 km/h"},
  "correctAnswer": "B",
  "explanation": "Speed = Distance/Time = 120/2 = 60 km/h"
}
✅ Correct answer is "60 km/h" and it IS in option B

**Example CORRECT (Logic):**
{
  "text": "If all cats are animals and some animals are furry, what can be concluded about cats?",
  "options": {"A": "Cats are furry", "B": "Cats are not furry", "C": "All cats are furry", "D": "Some cats are furry"},
  "correctAnswer": "D",
  "explanation": "We can only conclude that some cats might be furry based on the given information"
}
✅ Correct answer is "Some cats are furry" and it IS in option D

**Example WRONG (DO NOT DO THIS):**
{
  "text": "If a train travels 120 km in 2 hours, what is its average speed?",
  "options": {"A": "50 km/h", "B": "55 km/h", "C": "70 km/h", "D": "80 km/h"},
  "correctAnswer": "B",
  "explanation": "Speed = Distance/Time = 120/2 = 60 km/h"
}
❌ Correct answer is "60 km/h" but it's NOT in any option - option B has "55 km/h" instead

**Example WRONG (DO NOT DO THIS):**
{
  "text": "What is the capital of France?",
  "options": {"A": "London", "B": "Berlin", "C": "Madrid", "D": "Rome"},
  "correctAnswer": "A",
  "explanation": "Paris is the capital of France"
}
❌ Correct answer is "Paris" but it's NOT in any option

⚠️ OPTION UNIQUENESS (ABSOLUTELY CRITICAL):
- Each question MUST have 4 COMPLETELY DIFFERENT options (A, B, C, D)
- NO duplicate values (e.g., don't use "33" for both B and D)
- All options must be distinct and non-empty
- Verify all 4 options have different values before finalizing

IMPORTANT OUTPUT FORMAT:
You MUST return a JSON array starting with [ and ending with ].
Each question object must have these exact fields:
- "text": string (the question text, keep it on one line)
- "options": object with keys "A", "B", "C", "D"
- "correctAnswer": string (one of "A", "B", "C", or "D")
- "explanation": string (brief explanation)

CRITICAL RULES:
1. Start your response with [ (opening bracket)
2. End your response with ] (closing bracket)
3. Do NOT wrap in markdown code blocks
4. Do NOT add any text before or after the JSON array
5. Keep question text concise and on single lines where possible
6. Ensure all strings are properly quoted
7. Ensure all commas are in the right places
8. **MOST CRITICAL**: The value in your correctAnswer field MUST match one of the option values EXACTLY
9. VERIFY: All 4 options (A, B, C, D) must have different values - no duplicates!
10. FINAL CHECK: For each question, verify that options[correctAnswer] contains the actual correct answer

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

    // COMPREHENSIVE VALIDATION: Filter out invalid questions
    console.log(`🔍 [Adaptive-Handler] Starting comprehensive validation (80% similarity threshold)...`);
    const filteredQuestions = aiQuestionsRaw.filter((q: any, index: number) => {
        const questionText = q.text?.toLowerCase().trim();
        if (!questionText) {
            console.warn(`⚠️ [Adaptive-Handler] Question ${index + 1} has no text, filtering out`);
            return false;
        }
        
        // Check for image references
        const imageKeywords = [
            'graph', 'chart', 'table', 'diagram', 'image', 'picture', 'figure', 
            'shown below', 'shown above', 'visual', 'illustration', 'drawing',
            'sketch', 'photo', 'photograph', 'display', 'depicts', 'shows',
            'given figure', 'following figure', 'above figure', 'below figure',
            'mirror image', 'reflection', 'rotate', 'flip', 'shape', 'pattern',
            'look at', 'observe', 'see the', 'view the', 'refer to',
            'as shown', 'as depicted', 'as illustrated'
        ];
        if (imageKeywords.some(keyword => questionText.includes(keyword))) {
            console.warn(`⚠️ [Adaptive-Handler] Question ${index + 1} has image reference, filtering out: "${questionText.substring(0, 50)}..."`);
            return false;
        }
        
        // Validate options structure
        const options = q.options || {};
        const correctAnswer = (q.correctAnswer || '').toString().trim().toUpperCase();
        
        // Check all 4 options exist
        const requiredOptions = ['A', 'B', 'C', 'D'];
        for (const opt of requiredOptions) {
            if (!options[opt] || typeof options[opt] !== 'string' || options[opt].trim().length === 0) {
                console.warn(`⚠️ [Adaptive-Handler] Question ${index + 1} missing or empty option ${opt}, filtering out`);
                return false;
            }
        }
        
        // Validate answer options are unique
        const optionValues = Object.values(options).map((v: any) => String(v).toLowerCase().trim());
        const uniqueOptions = new Set(optionValues);
        
        if (uniqueOptions.size < 4) {
            console.warn(`⚠️ [Adaptive-Handler] Question ${index + 1} has duplicate options, filtering out`);
            console.warn(`   Options: ${JSON.stringify(options)}`);
            return false;
        }
        
        // CRITICAL: Validate correct answer exists in options
        if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
            console.warn(`⚠️ [Adaptive-Handler] Question ${index + 1} has invalid correctAnswer "${correctAnswer}", filtering out`);
            return false;
        }
        
        const correctAnswerValue = options[correctAnswer];
        if (!correctAnswerValue || correctAnswerValue.trim().length === 0) {
            console.warn(`⚠️ [Adaptive-Handler] Question ${index + 1} correctAnswer "${correctAnswer}" does not map to valid option, filtering out`);
            return false;
        }
        
        // ENHANCED: For math questions, verify the answer makes sense
        const qText = q.text?.toLowerCase().trim() || '';
        const hasCalculation = /\d+.*[+\-*/×÷].*\d+|calculate|compute|what is|value of|result of|find|solve/.test(qText);
        
        if (hasCalculation) {
            const questionHasNumbers = /\d+/.test(qText);
            const optionVals = Object.values(options).map((v: any) => String(v).trim());
            const numericOptions = optionVals.filter(v => /^\d+\.?\d*/.test(v));
            
            // If it's a math question with numbers, at least one option should be numeric
            if (questionHasNumbers && numericOptions.length === 0) {
                console.warn(`⚠️ [Adaptive-Handler] Question ${index + 1} is math question but has NO numeric options, filtering out`);
                console.warn(`   Question: "${qText.substring(0, 80)}..."`);
                console.warn(`   Options: ${JSON.stringify(options)}`);
                return false;
            }
            
            // Check if the correct answer is numeric for math questions
            const correctAnswerIsNumeric = /^\d+\.?\d*/.test(correctAnswerValue.trim());
            if (questionHasNumbers && !correctAnswerIsNumeric && numericOptions.length > 0) {
                console.warn(`⚠️ [Adaptive-Handler] Question ${index + 1} is math question but correct answer is not numeric, filtering out`);
                console.warn(`   Correct answer: "${correctAnswerValue}"`);
                console.warn(`   Available numeric options: ${numericOptions.join(', ')}`);
                return false;
            }
        }
        
        // Check if this question text is too similar to any excluded text (80% threshold for stricter filtering)
        for (const excludedText of excludeTexts) {
            const excluded = excludedText.toLowerCase().trim();
            // Exact match
            if (questionText === excluded) {
                console.warn(`⚠️ [Adaptive-Handler] Question ${index + 1} is exact duplicate: "${questionText.substring(0, 50)}..."`);
                return false;
            }
            // Very similar (>80% match) - stricter than before
            const similarity = calculateSimilarity(questionText, excluded);
            if (similarity > 0.80) {
                console.warn(`⚠️ [Adaptive-Handler] Question ${index + 1} is ${(similarity * 100).toFixed(0)}% similar to previous, filtering out: "${questionText.substring(0, 50)}..."`);
                return false;
            }
        }
        return true;
    });
    
    console.log(`🔍 [Adaptive-Handler] After filtering: ${filteredQuestions.length}/${aiQuestionsRaw.length} questions remain`);

    // NEW: If we filtered out questions with issues, try to regenerate just the missing ones
    if (filteredQuestions.length < count && filteredQuestions.length > 0) {
        const missingCount = count - filteredQuestions.length;
        console.log(`🔄 [Adaptive-Handler] ${missingCount} questions were filtered out. Attempting to regenerate them...`);
        
        // Add already valid questions to exclusion list
        const updatedExcludeTexts = new Set([
            ...excludeTexts,
            ...filteredQuestions.map((q: any) => q.text)
        ]);
        
        try {
            const replacementSubtags = Array.from({ length: missingCount }, (_, i) => subtags[i % subtags.length]);
            const replacementQuestions = await generateQuestionsWithAI(
                env,
                gradeLevel,
                phase,
                replacementSubtags,
                difficulty,
                missingCount,
                updatedExcludeTexts,
                studentCourse
            );
            
            console.log(`✅ [Adaptive-Handler] Generated ${replacementQuestions.length} replacement questions`);
            
            // Merge the valid questions with replacements
            const mergedRawQuestions = [
                ...filteredQuestions,
                ...replacementQuestions.map(rq => ({
                    text: rq.text,
                    options: rq.options,
                    correctAnswer: rq.correctAnswer,
                    explanation: rq.explanation
                }))
            ];
            
            console.log(`📊 [Adaptive-Handler] Total after regeneration: ${mergedRawQuestions.length} questions`);
            
            // Use the merged set for final processing
            const questions: Question[] = mergedRawQuestions.map((q: any, idx: number) => {
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
            
            console.log(`✅ [Adaptive-Handler] Successfully generated ${questions.length} unique questions`);
            return questions;
        } catch (replacementError: any) {
            console.error(`❌ [Adaptive-Handler] Failed to generate replacements:`, replacementError.message);
            // Continue with what we have
        }
    }

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
    excludeQuestionTexts: string[] = [],
    studentCourse?: string | null
): Promise<QuestionGenerationResult> {
    console.log(`🎯 [Diagnostic-Handler] Starting diagnostic screener generation`);
    console.log(`📋 [Diagnostic-Handler] Parameters:`, {
        gradeLevel,
        excludeQuestionIds: excludeQuestionIds.length,
        excludeQuestionTexts: excludeQuestionTexts.length,
        studentCourse: studentCourse || 'not provided'
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
            new Set(excludeQuestionTexts),
            studentCourse
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
                    updatedExcludeTexts,
                    studentCourse
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
    excludeQuestionTexts: string[] = [],
    studentCourse?: string | null
): Promise<QuestionGenerationResult> {
    console.log(`🎯 [Adaptive-Core-Handler] Starting adaptive core generation`);
    console.log(`📋 [Adaptive-Core-Handler] Parameters:`, {
        gradeLevel,
        startingDifficulty,
        count,
        excludeQuestionIds: excludeQuestionIds.length,
        excludeQuestionTexts: excludeQuestionTexts.length,
        studentCourse: studentCourse || 'not provided'
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
            new Set(excludeQuestionTexts),
            studentCourse
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
    excludeQuestionTexts: string[] = [],
    studentCourse?: string | null
): Promise<QuestionGenerationResult> {
    console.log(`🎯 [Stability-Handler] Starting stability confirmation generation`);
    console.log(`📋 [Stability-Handler] Parameters:`, {
        gradeLevel,
        provisionalBand,
        count,
        excludeQuestionIds: excludeQuestionIds.length,
        excludeQuestionTexts: excludeQuestionTexts.length,
        studentCourse: studentCourse || 'not provided'
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
            new Set(excludeQuestionTexts),
            studentCourse
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
                    updatedExcludeTexts,
                    studentCourse
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
    excludeQuestionTexts: string[] = [],
    studentCourse?: string | null
): Promise<QuestionGenerationResult> {
    console.log(`🎯 [Single-Question-Handler] Starting single question generation`);
    console.log(`📋 [Single-Question-Handler] Parameters:`, {
        gradeLevel,
        phase,
        difficulty,
        subtag,
        excludeQuestionIds: excludeQuestionIds.length,
        excludeQuestionTexts: excludeQuestionTexts.length,
        studentCourse: studentCourse || 'not provided'
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
            new Set(excludeQuestionTexts),
            studentCourse
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
