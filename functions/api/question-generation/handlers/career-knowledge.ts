
import { createSupabaseAdminClient } from '../../../../src/functions-lib/supabase';
import { PagesEnv } from '../../../../src/functions-lib/types';
import {
    callOpenRouterWithRetry,
    repairAndParseJSON,
    generateUUID,
    getAPIKeys
} from '../../shared/ai-config';

// All utility functions are now imported from centralized ai-config.ts

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
function calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
}

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

// Knowledge question generation handler
export async function generateKnowledgeQuestions(
    env: PagesEnv,
    streamId: string,
    streamName: string,
    topics: string[] | string | null,
    questionCount: number = 50,
    studentId?: string,
    attemptId?: string,
    gradeLevel?: string,
    isCollegeStudent?: boolean
) {
    console.log('🎓 ============================================');
    console.log('🎓 KNOWLEDGE QUESTION GENERATION STARTED');
    console.log('🎓 ============================================');
    console.log(`📋 Stream ID: ${streamId}`);
    console.log(`📋 Stream Name: ${streamName}`);
    console.log(`📋 Topics: ${topics ? (Array.isArray(topics) ? topics.join(', ') : topics) : 'AI will determine dynamically'}`);
    console.log(`📋 Question Count: ${questionCount}`);
    console.log(`📋 Grade Level: ${gradeLevel || 'not specified'}`);
    console.log(`📋 Is College Student: ${isCollegeStudent || false}`);
    console.log(`📋 Student ID: ${studentId || 'not specified'}`);
    console.log(`📋 Attempt ID: ${attemptId || 'not specified'}`);
    
    // Treat higher_secondary (11th/12th) same as college for dynamic topic generation
    const usesDynamicTopics = isCollegeStudent || gradeLevel === 'higher_secondary';
    
    const supabase = createSupabaseAdminClient(env);

    const { openRouter: openRouterKey } = getAPIKeys(env);

    if (!openRouterKey) {
        throw new Error('OpenRouter API key not configured');
    }

    const allQuestions: any[] = [];

    // For college students and higher secondary (11th/12th) with 20 questions, use single batch for better consistency
    // For larger counts, split into batches
    const useSingleBatch = usesDynamicTopics && questionCount <= 20;
    const batchCount = useSingleBatch ? 1 : 2;

    console.log(`📝 Generating fresh knowledge questions in ${batchCount} batch${batchCount > 1 ? 'es' : ''} for: ${streamName}`);

    for (let batchNum = 1; batchNum <= batchCount; batchNum++) {
        const count = Math.floor(questionCount / batchCount);
        const totalQuestions = batchNum === batchCount ? questionCount - (count * (batchCount - 1)) : count;

        let prompt: string;
        
        if (usesDynamicTopics && !topics) {
            // For college students and 11th/12th students without predefined topics, let AI determine topics dynamically
            const studentLevel = gradeLevel === 'higher_secondary' ? '11th-12th grade' : 'college/university';
            prompt = `🎯 CRITICAL REQUIREMENT: You MUST generate EXACTLY ${totalQuestions} questions. Count them before responding.

Generate EXACTLY ${totalQuestions} multiple-choice knowledge questions for a ${studentLevel} student studying ${streamName}.

⚠️ CRITICAL: ALL questions MUST be about ${streamName} - DO NOT generate questions about other subjects!
- If the stream is "Science (PCM)", generate questions about Physics, Chemistry, and Mathematics at ${studentLevel} level
- If the stream is "Science (PCB)", generate questions about Physics, Chemistry, and Biology at ${studentLevel} level
- If the stream is "Commerce", generate questions about Accounting, Business, Economics at ${studentLevel} level
- If the stream is "Arts with Economics", generate questions about Economics, Political Science, History, Sociology at ${studentLevel} level
- NEVER generate questions about subjects not related to ${streamName}

IMPORTANT: Analyze the stream/course name "${streamName}" and generate questions covering the core subjects and topics typically taught in this program at ${studentLevel}.

Requirements:
1. All questions must be MCQ with exactly 4 options
2. Each question must have exactly ONE correct answer
3. ALL 4 OPTIONS MUST BE UNIQUE - no duplicate answers allowed
4. The correct answer MUST be one of the 4 options provided
5. Difficulty distribution: 30% easy, 50% medium, 20% hard
6. Test practical understanding and application, not just memorization
7. Cover fundamental concepts, theories, and real-world applications relevant to ${streamName}
8. Questions should be appropriate for ${studentLevel} students
9. VERIFY: For each question, ensure the correct answer actually appears in the options

⚠️ VERIFICATION STEP: Before responding, count your questions. You must have EXACTLY ${totalQuestions} questions in your response.

Output Format - Respond with ONLY valid JSON (no markdown, no explanation):
{"questions":[{"id":1,"type":"mcq","difficulty":"easy","question":"Question text","options":["A","B","C","D"],"correct_answer":"A","skill_tag":"topic"}]}

REMINDER: Generate EXACTLY ${totalQuestions} questions about ${streamName}. No more, no less.`;
        } else {
            // For non-college students or when topics are provided, use the existing approach
            prompt = `🎯 CRITICAL REQUIREMENT: You MUST generate EXACTLY ${totalQuestions} questions. Count them before responding.

Generate EXACTLY ${totalQuestions} multiple-choice questions about ${streamName}.

Requirements:
1. All questions must be MCQ with exactly 4 options
2. Each question must have exactly ONE correct answer
3. ALL 4 OPTIONS MUST BE UNIQUE - no duplicate answers allowed
4. Difficulty distribution: 30% easy, 50% medium, 20% hard
5. Test practical understanding, not memorization

⚠️ VERIFICATION STEP: Before responding, count your questions. You must have EXACTLY ${totalQuestions} questions in your response.

Output Format - Respond with ONLY valid JSON (no markdown, no explanation):
{"questions":[{"id":1,"type":"mcq","difficulty":"easy","question":"Question text","options":["A","B","C","D"],"correct_answer":"A","skill_tag":"topic"}]}

REMINDER: Generate EXACTLY ${totalQuestions} questions. No more, no less.`;
        }

        const systemPrompt = usesDynamicTopics 
            ? `You are an expert educational assessment creator for ${gradeLevel === 'higher_secondary' ? '11th-12th grade' : 'college/university'} students. 

🎯 CRITICAL: You MUST generate EXACTLY ${totalQuestions} knowledge-based questions. This is a strict requirement.

Analyze the stream/course name and generate questions covering core topics of that program. 

Before responding, verify you have EXACTLY ${totalQuestions} questions. Generate ONLY valid JSON with no markdown.`
            : `You are an expert educational assessment creator. 

🎯 CRITICAL: You MUST generate EXACTLY ${totalQuestions} knowledge-based questions about ${streamName}. This is a strict requirement.

Before responding, verify you have EXACTLY ${totalQuestions} questions. Generate ONLY valid JSON with no markdown.`;

        // Use OpenRouter with automatic retry and fallback
        // Calculate token limit: ~150 tokens per question + 500 buffer
        const estimatedTokens = totalQuestions * 150 + 500;
        console.log(`🔑 Batch ${batchNum}/${batchCount}: Using OpenRouter with retry for ${totalQuestions} ${streamName} questions (maxTokens: ${estimatedTokens})`);

        const jsonText = await callOpenRouterWithRetry(openRouterKey, [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ], {
            maxTokens: estimatedTokens
        });

        const parsed = repairAndParseJSON(jsonText);
        const batchQuestions = parsed.questions || parsed;

        if (!Array.isArray(batchQuestions)) {
            throw new Error(`Expected array of questions, got: ${typeof batchQuestions}`);
        }

        allQuestions.push(...batchQuestions);
        console.log(`✅ Batch ${batchNum}/${batchCount} complete: ${batchQuestions.length} questions`);
    }

    console.log(`✅ Generated ${allQuestions.length} total knowledge questions via AI`);
    
    // COMPREHENSIVE VALIDATION: Check for duplicate questions and validate answer options
    const uniqueQuestions: any[] = [];
    const seenTexts = new Set<string>();
    let filteredCount = 0;
    
    for (const q of allQuestions) {
        const normalizedText = q.question?.toLowerCase().trim() || q.text?.toLowerCase().trim() || '';
        
        // Check for duplicate question text (exact match)
        if (!normalizedText || seenTexts.has(normalizedText)) {
            console.warn(`⚠️ Filtered duplicate question: "${normalizedText.substring(0, 50)}..."`);
            filteredCount++;
            continue;
        }
        
        // Check for similar questions (80% similarity threshold)
        let isSimilar = false;
        for (const seenText of seenTexts) {
            const similarity = calculateSimilarity(normalizedText, seenText);
            if (similarity > 0.80) {
                console.warn(`⚠️ Filtered similar question (${(similarity * 100).toFixed(0)}% match): "${normalizedText.substring(0, 50)}..."`);
                filteredCount++;
                isSimilar = true;
                break;
            }
        }
        if (isSimilar) continue;
        
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
        if (imageKeywords.some(keyword => normalizedText.includes(keyword))) {
            console.warn(`⚠️ Filtered question with image reference: "${normalizedText.substring(0, 50)}..."`);
            filteredCount++;
            continue;
        }
        
        // Validate options structure
        const options = q.options || {};
        const correctAnswer = (q.correct_answer || q.correctAnswer || '').toString().trim().toUpperCase();
        
        // Check all 4 options exist (handle both array and object formats)
        let optionValues: string[];
        if (Array.isArray(options)) {
            if (options.length !== 4) {
                console.warn(`⚠️ Filtered question with ${options.length} options (need 4): "${normalizedText.substring(0, 50)}..."`);
                filteredCount++;
                continue;
            }
            optionValues = options.map((v: any) => String(v).toLowerCase().trim());
        } else {
            const requiredOptions = ['A', 'B', 'C', 'D'];
            for (const opt of requiredOptions) {
                if (!options[opt] || typeof options[opt] !== 'string' || options[opt].trim().length === 0) {
                    console.warn(`⚠️ Filtered question missing or empty option ${opt}: "${normalizedText.substring(0, 50)}..."`);
                    filteredCount++;
                    continue;
                }
            }
            optionValues = Object.values(options).map((v: any) => String(v).toLowerCase().trim());
        }
        
        // Validate answer options are unique
        const uniqueOptions = new Set(optionValues);
        
        if (uniqueOptions.size < optionValues.length) {
            console.warn(`⚠️ Filtered question with duplicate options: "${normalizedText.substring(0, 50)}..."`);
            console.warn(`   Options: ${JSON.stringify(options)}`);
            filteredCount++;
            continue;
        }
        
        // Validate all options are non-empty
        if (optionValues.some(v => !v || v.length === 0)) {
            console.warn(`⚠️ Filtered question with empty options: "${normalizedText.substring(0, 50)}..."`);
            filteredCount++;
            continue;
        }
        
        // CRITICAL: Validate correct answer exists in options
        if (Array.isArray(options)) {
            // For array format, correct_answer should be the actual value
            const answerExists = optionValues.some(opt => opt === correctAnswer.toLowerCase());
            if (!answerExists) {
                console.warn(`⚠️ Filtered question where correct answer "${correctAnswer}" not in options: "${normalizedText.substring(0, 50)}..."`);
                console.warn(`   Options: ${JSON.stringify(options)}`);
                filteredCount++;
                continue;
            }
        } else {
            // For object format, correct_answer should be A/B/C/D
            if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
                console.warn(`⚠️ Filtered question with invalid correctAnswer "${correctAnswer}": "${normalizedText.substring(0, 50)}..."`);
                filteredCount++;
                continue;
            }
            
            const correctAnswerValue = options[correctAnswer];
            if (!correctAnswerValue || correctAnswerValue.trim().length === 0) {
                console.warn(`⚠️ Filtered question where correctAnswer "${correctAnswer}" does not map to valid option: "${normalizedText.substring(0, 50)}..."`);
                console.warn(`   Options: ${JSON.stringify(options)}`);
                filteredCount++;
                continue;
            }
            
            // AUTO-CORRECT: Check if explanation matches a different option better
            const explanation = q.explanation || '';
            const explanationNumbers = explanation.match(/=\s*(\d+\.?\d*)/g);
            
            if (explanationNumbers && explanationNumbers.length > 0) {
                const explanationFinalAnswer = explanationNumbers[explanationNumbers.length - 1].replace(/[=\s]/g, '');
                const explanationNum = parseFloat(explanationFinalAnswer);
                
                if (!isNaN(explanationNum)) {
                    let bestMatchOption: string | null = null;
                    let bestMatchDiff = Infinity;
                    
                    for (const [optKey, optVal] of Object.entries(options)) {
                        const optNumbers = String(optVal).match(/\d+\.?\d*/g);
                        if (optNumbers && optNumbers.length > 0) {
                            const optNum = parseFloat(optNumbers[0]);
                            if (!isNaN(optNum)) {
                                const diff = Math.abs(explanationNum - optNum);
                                if (diff < bestMatchDiff) {
                                    bestMatchDiff = diff;
                                    bestMatchOption = optKey;
                                }
                            }
                        }
                    }
                    
                    if (bestMatchOption && bestMatchOption !== correctAnswer && bestMatchDiff <= 1) {
                        console.warn(`🔧 [Auto-Correct] Fixing wrong answer letter mapping`);
                        console.warn(`   Explanation calculates: ${explanationFinalAnswer}`);
                        console.warn(`   Was marked as: ${correctAnswer} = "${correctAnswerValue}"`);
                        console.warn(`   Auto-correcting to: ${bestMatchOption} = "${options[bestMatchOption]}"`);
                        
                        q.correct_answer = bestMatchOption;
                        q.correctAnswer = bestMatchOption;
                        
                        console.log(`✅ [Auto-Correct] Question corrected successfully`);
                    }
                }
            }
        }
        
        seenTexts.add(normalizedText);
        uniqueQuestions.push(q);
    }
    
    console.log(`🔍 After validation: ${uniqueQuestions.length}/${allQuestions.length} valid questions (filtered: ${filteredCount})`);
    
    // If we don't have enough questions, generate more to reach the target
    if (uniqueQuestions.length < questionCount) {
        const needed = questionCount - uniqueQuestions.length;
        console.warn(`⚠️ Only ${uniqueQuestions.length}/${questionCount} valid questions. Generating ${needed} more...`);
        
        const studentLevel = gradeLevel === 'higher_secondary' ? '11th-12th grade' : 'college/university';
        const additionalPrompt = usesDynamicTopics && !topics
            ? `Generate EXACTLY ${needed} additional multiple-choice knowledge questions for a ${studentLevel} student studying ${streamName}.

⚠️ CRITICAL: ALL questions MUST be about ${streamName} - DO NOT generate questions about other subjects!

Requirements:
1. All questions must be MCQ with exactly 4 options
2. Each question must have exactly ONE correct answer
3. ALL 4 OPTIONS MUST BE UNIQUE - no duplicate answers allowed
4. The correct answer MUST be one of the 4 options provided
5. Difficulty distribution: 30% easy, 50% medium, 20% hard
6. Test practical understanding and application
7. Questions should be appropriate for ${studentLevel} students

Output Format - Respond with ONLY valid JSON (no markdown):
{"questions":[{"id":1,"type":"mcq","difficulty":"easy","question":"Question text","options":["A","B","C","D"],"correct_answer":"A","skill_tag":"topic"}]}`
            : `Generate EXACTLY ${needed} additional multiple-choice questions about ${streamName}.

Requirements:
1. All questions must be MCQ with exactly 4 options
2. Each question must have exactly ONE correct answer
3. ALL 4 OPTIONS MUST BE UNIQUE - no duplicate answers allowed
4. Difficulty distribution: 30% easy, 50% medium, 20% hard

Output Format - Respond with ONLY valid JSON (no markdown):
{"questions":[{"id":1,"type":"mcq","difficulty":"easy","question":"Question text","options":["A","B","C","D"],"correct_answer":"A","skill_tag":"topic"}]}`;

        const additionalSystemPrompt = `You are an expert educational assessment creator. Generate EXACTLY ${needed} questions. Generate ONLY valid JSON with no markdown.`;

        try {
            const additionalJsonText = await callOpenRouterWithRetry(openRouterKey, [
                { role: 'system', content: additionalSystemPrompt },
                { role: 'user', content: additionalPrompt }
            ], {
                maxTokens: needed * 150 + 500
            });

            const additionalParsed = repairAndParseJSON(additionalJsonText);
            const additionalQuestions = additionalParsed.questions || additionalParsed;

            if (Array.isArray(additionalQuestions)) {
                // Validate additional questions with same criteria
                for (const q of additionalQuestions) {
                    const normalizedText = q.question?.toLowerCase().trim() || q.text?.toLowerCase().trim() || '';
                    
                    if (!normalizedText || seenTexts.has(normalizedText)) continue;
                    
                    const options = q.options || {};
                    if (Array.isArray(options) && options.length === 4) {
                        const optionValues = options.map((v: any) => String(v).toLowerCase().trim());
                        const uniqueOptions = new Set(optionValues);
                        
                        if (uniqueOptions.size === 4 && optionValues.every(v => v && v.length > 0)) {
                            seenTexts.add(normalizedText);
                            uniqueQuestions.push(q);
                            
                            if (uniqueQuestions.length >= questionCount) break;
                        }
                    }
                }
                console.log(`✅ Added ${uniqueQuestions.length - (questionCount - needed)} additional valid questions`);
            }
        } catch (error) {
            console.error(`❌ Failed to generate additional questions:`, error);
        }
    }
    
    // If more than 20% were filtered, log warning
    if (filteredCount > allQuestions.length * 0.2) {
        console.warn(`⚠️ WARNING: ${filteredCount} questions filtered (${Math.round(filteredCount/allQuestions.length*100)}%) - AI quality may need improvement`);
    }
    
    console.log('🎓 ============================================');

    // Use sequential numeric IDs for consistency with answer storage
    // Format: 1, 2, 3, ... (not UUIDs) so answers can be matched
    const processedQuestions = uniqueQuestions.map((q: any, index: number) => ({
        ...q,
        id: index + 1, // Sequential numeric ID
        uuid: generateUUID(), // Keep UUID for database uniqueness
        stream_id: streamId,
        stream_name: streamName,
        created_at: new Date().toISOString()
    }));

    if (studentId && attemptId) {
        // Use upsert to handle potential race conditions or re-generation
        const { error } = await supabase
            .from('career_assessment_ai_questions')
            .upsert({
                student_id: studentId, // Use studentId (UUID) not attemptId
                question_type: 'knowledge',
                questions: processedQuestions, // Store the entire array as JSONB
                stream_id: streamId,
                created_at: new Date().toISOString()
            }, {
                onConflict: 'student_id, stream_id, question_type',
                ignoreDuplicates: false // Update if exists
            });

        if (error) {
            console.error('❌ Database error saving knowledge questions:', error);
            // Don't throw error here to allow the generated questions to be returned to frontend
        }
    }

    console.log(`📦 Returning ${processedQuestions.length} questions`);
    return processedQuestions;
}
