/**
 * Shared validation utilities for question generation
 * Ensures AI-generated questions have valid structure and correct answers
 */

/**
 * Validates that a question has proper structure and the correct answer exists in options
 * @param question - The question object to validate
 * @param index - Question index for error messages
 * @returns Validation result with isValid flag and reason
 */
export function validateQuestionAnswerInOptions(
    question: any,
    index: number
): { isValid: boolean; reason?: string } {
    // Normalize question structure (handle both formats)
    const questionText = question.question || question.text || '';
    const options = question.options || {};
    const correctAnswer = (question.correct_answer || question.correctAnswer || '').toString().trim().toUpperCase();

    // Basic structure validation
    if (!questionText || questionText.trim().length === 0) {
        return { isValid: false, reason: `Question ${index + 1}: Missing question text` };
    }

    if (!options || typeof options !== 'object') {
        return { isValid: false, reason: `Question ${index + 1}: Missing or invalid options` };
    }

    // Check all 4 options exist
    const requiredOptions = ['A', 'B', 'C', 'D'];
    for (const opt of requiredOptions) {
        if (!options[opt] || typeof options[opt] !== 'string' || options[opt].trim().length === 0) {
            return { isValid: false, reason: `Question ${index + 1}: Missing or empty option ${opt}` };
        }
    }

    // Check correct answer is valid
    if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
        return { isValid: false, reason: `Question ${index + 1}: Invalid correct answer "${correctAnswer}" (must be A, B, C, or D)` };
    }

    // Check all options are unique (case-insensitive)
    const optionValues = Object.values(options).map((v: any) => String(v).toLowerCase().trim());
    const uniqueValues = new Set(optionValues);
    
    if (uniqueValues.size < 4) {
        return { 
            isValid: false, 
            reason: `Question ${index + 1}: Duplicate options found - ${JSON.stringify(options)}` 
        };
    }

    // CRITICAL: Verify the correct answer text exists in the options
    const correctAnswerText = options[correctAnswer];
    if (!correctAnswerText || correctAnswerText.trim().length === 0) {
        return {
            isValid: false,
            reason: `Question ${index + 1}: Correct answer "${correctAnswer}" does not map to any option value`
        };
    }

    return { isValid: true };
}

/**
 * Validates an array of questions and filters out invalid ones
 * @param questions - Array of questions to validate
 * @param logPrefix - Prefix for console logs
 * @returns Filtered array of valid questions
 */
export function validateAndFilterQuestions(
    questions: any[],
    logPrefix: string = '[Validation]'
): any[] {
    if (!Array.isArray(questions) || questions.length === 0) {
        console.error(`${logPrefix} No questions to validate`);
        return [];
    }

    const validQuestions: any[] = [];
    const seenTexts = new Set<string>();
    let filteredCount = 0;

    for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const questionText = (q.question || q.text || '').toLowerCase().trim();

        // Check for duplicate question text
        if (!questionText || seenTexts.has(questionText)) {
            console.warn(`${logPrefix} ⚠️ Filtered duplicate question ${i + 1}: "${questionText.substring(0, 50)}..."`);
            filteredCount++;
            continue;
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
            console.warn(`${logPrefix} ⚠️ Filtered question ${i + 1} with image reference: "${questionText.substring(0, 50)}..."`);
            filteredCount++;
            continue;
        }

        // Validate answer in options
        const validation = validateQuestionAnswerInOptions(q, i);
        if (!validation.isValid) {
            console.warn(`${logPrefix} ⚠️ ${validation.reason}`);
            filteredCount++;
            continue;
        }

        seenTexts.add(questionText);
        validQuestions.push(q);
    }

    console.log(`${logPrefix} ✅ Validated ${validQuestions.length}/${questions.length} questions (filtered: ${filteredCount})`);

    if (filteredCount > questions.length * 0.2) {
        console.warn(`${logPrefix} ⚠️ WARNING: ${filteredCount} questions filtered (${Math.round(filteredCount / questions.length * 100)}%) - AI quality may need improvement`);
    }

    return validQuestions;
}
