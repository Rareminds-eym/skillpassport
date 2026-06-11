
import { createSupabaseAdminClient } from '../../../lib/supabase';
import { PagesEnv } from '../../../lib/types';
import {
    callOpenRouterWithRetry,
    repairAndParseJSON,
    generateUUID,
    getAPIKeys
} from '../../shared/ai-config';

// All utility functions are now imported from centralized ai-config.ts
const STREAM_KNOWLEDGE_QUESTION_COUNT = 20;

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
    questionCount: number = STREAM_KNOWLEDGE_QUESTION_COUNT,  // Default to 20 questions for stream knowledge test
    learnerId?: string,
    attemptId?: string,
    gradeLevel?: string,
    isCollegeLearner?: boolean
) {
    const requestedQuestionCount = questionCount;
    questionCount = STREAM_KNOWLEDGE_QUESTION_COUNT;
    if (requestedQuestionCount !== questionCount) {
        console.log(`[Knowledge] Requested question count ignored: ${requestedQuestionCount}; using ${questionCount}`);
    }

    console.log('🎓 ============================================');
    console.log('🎓 KNOWLEDGE QUESTION GENERATION STARTED');
    console.log('🎓 ============================================');
    console.log(`📋 Stream ID: ${streamId}`);
    console.log(`📋 Stream Name: ${streamName}`);
    console.log(`📋 Topics: ${topics ? (Array.isArray(topics) ? topics.join(', ') : topics) : 'AI will determine dynamically'}`);
    console.log(`📋 Question Count: ${questionCount}`);
    console.log(`📋 Grade Level: ${gradeLevel || 'not specified'}`);
    console.log(`📋 Is College Learner: ${isCollegeLearner || false}`);
    console.log(`📋 Learner ID: ${learnerId || 'not specified'}`);
    console.log(`📋 Attempt ID: ${attemptId || 'not specified'}`);
    
    // Treat higher_secondary (11th/12th) same as college for dynamic topic generation
    const usesDynamicTopics = isCollegeLearner || gradeLevel === 'higher_secondary';
    
    const supabase = createSupabaseAdminClient(env);

    const { openRouter: openRouterKey } = getAPIKeys(env);

    if (!openRouterKey) {
        throw new Error('OpenRouter API key not configured');
    }

    const allQuestions: any[] = [];

    // For college learners and higher secondary (11th/12th) with 20 questions, use single batch for better consistency
    // For larger counts, split into batches
    const useSingleBatch = usesDynamicTopics && questionCount <= 20;
    const batchCount = useSingleBatch ? 1 : 2;

    console.log(`📝 Generating fresh knowledge questions in ${batchCount} batch${batchCount > 1 ? 'es' : ''} for: ${streamName}`);

    for (let batchNum = 1; batchNum <= batchCount; batchNum++) {
        const count = Math.floor(questionCount / batchCount);
        const totalQuestions = batchNum === batchCount ? questionCount - (count * (batchCount - 1)) : count;

        let prompt: string;
        
        if (usesDynamicTopics && !topics) {
            // For college learners and 11th/12th learners without predefined topics, let AI determine topics dynamically
            const learnerLevel = gradeLevel === 'higher_secondary' ? '11th-12th grade' : 'college/university';
            prompt = `🎯 CRITICAL REQUIREMENT: You MUST generate EXACTLY ${totalQuestions} questions. Count them before responding.

Generate EXACTLY ${totalQuestions} multiple-choice knowledge questions for a ${learnerLevel} learner studying ${streamName}.

⚠️ CRITICAL: ALL questions MUST be about ${streamName} - DO NOT generate questions about other subjects!
- If the stream is "Science (PCM)", generate questions about Physics, Chemistry, and Mathematics at ${learnerLevel} level
- If the stream is "Science (PCB)", generate questions about Physics, Chemistry, and Biology at ${learnerLevel} level
- If the stream is "Commerce", generate questions about Accounting, Business, Economics at ${learnerLevel} level
- If the stream is "Arts with Economics", generate questions about Economics, Political Science, History, Sociology at ${learnerLevel} level
- NEVER generate questions about subjects not related to ${streamName}

IMPORTANT: Analyze the stream/course name "${streamName}" and generate questions covering the core subjects and topics typically taught in this program at ${learnerLevel}.

Requirements:
1. All questions must be MCQ with exactly 4 options
2. Each question must have exactly ONE correct answer
3. ALL 4 OPTIONS MUST BE UNIQUE - no duplicate answers allowed
4. The correct answer MUST be one of the 4 options provided
5. Difficulty distribution: 30% easy, 50% medium, 20% hard
6. Test practical understanding and application, not just memorization
7. Cover fundamental concepts, theories, and real-world applications relevant to ${streamName}
8. Questions should be appropriate for ${learnerLevel} learners
9. VERIFY: For each question, ensure the correct answer actually appears in the options

⚠️ VERIFICATION STEP: Before responding, count your questions. You must have EXACTLY ${totalQuestions} questions in your response.

Output Format - Respond with ONLY valid JSON (no markdown, no explanation):
{"questions":[{"id":1,"type":"mcq","difficulty":"easy","question":"Question text","options":["A","B","C","D"],"correct_answer":"A","skill_tag":"topic"}]}

REMINDER: Generate EXACTLY ${totalQuestions} questions about ${streamName}. No more, no less.`;
        } else {
            // For non-college learners or when topics are provided, use the existing approach
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
            ? `You are an expert educational assessment creator for ${gradeLevel === 'higher_secondary' ? '11th-12th grade' : 'college/university'} learners. 

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
        
        // Check for similar questions (RELAXED: 95% similarity threshold - only near-exact matches)
        let isSimilar = false;
        for (const seenText of seenTexts) {
            const similarity = calculateSimilarity(normalizedText, seenText);
            if (similarity > 0.95) {
                console.warn(`⚠️ Filtered similar question (${(similarity * 100).toFixed(0)}% match): "${normalizedText.substring(0, 50)}..."`);
                filteredCount++;
                isSimilar = true;
                break;
            }
        }
        if (isSimilar) continue;
        
        // Check for image references (REFINED: only explicit image references)
        const imageKeywords = [
            'shown below', 'shown above', 'given figure', 'following figure', 
            'above figure', 'below figure', 'see the diagram', 'see the image',
            'look at the diagram', 'look at the image', 'refer to the diagram',
            'refer to the image', 'as depicted in the figure', 'as shown in the figure',
            'observe the diagram', 'observe the image'
        ];
        const hasImageReference = imageKeywords.some(keyword => normalizedText.includes(keyword));
        if (hasImageReference) {
            console.warn(`⚠️ Filtered question with image reference: "${normalizedText.substring(0, 50)}..."`);
            filteredCount++;
            continue;
        }
        
        // Validate options structure
        const options = q.options || {};
        const correctAnswer = (q.correct_answer || q.correctAnswer || '').toString().trim().toUpperCase();
        
        // Check all 4 options exist (handle both array and object formats)
        let optionValues: string[];
        let isValid = true;
        
        if (Array.isArray(options)) {
            if (options.length !== 4) {
                console.warn(`⚠️ Filtered question with ${options.length} options (need 4): "${normalizedText.substring(0, 50)}..."`);
                filteredCount++;
                continue;
            }
            optionValues = options.map((v: any) => String(v || '').toLowerCase().trim()).filter(v => v.length > 0);
            
            if (optionValues.length < 4) {
                console.warn(`⚠️ Filtered question with empty options: "${normalizedText.substring(0, 50)}..."`);
                filteredCount++;
                continue;
            }
        } else {
            const requiredOptions = ['A', 'B', 'C', 'D'];
            const optionEntries: [string, string][] = [];
            
            for (const opt of requiredOptions) {
                const optValue = options[opt];
                if (!optValue || typeof optValue !== 'string' || optValue.trim().length === 0) {
                    console.warn(`⚠️ Filtered question missing or empty option ${opt}: "${normalizedText.substring(0, 50)}..."`);
                    isValid = false;
                    break;
                }
                optionEntries.push([opt, String(optValue).toLowerCase().trim()]);
            }
            
            if (!isValid) {
                filteredCount++;
                continue;
            }
            
            optionValues = optionEntries.map(([_, v]) => v);
        }
        
        // Validate answer options are unique (allow minor variations)
        const uniqueOptions = new Set(optionValues);
        
        if (uniqueOptions.size < optionValues.length) {
            // Check if duplicates are significant (not just minor variations)
            const hasTrueDuplicates = optionValues.some((v1, i1) => 
                optionValues.some((v2, i2) => i1 !== i2 && v1 === v2)
            );
            
            if (hasTrueDuplicates) {
                console.warn(`⚠️ Filtered question with duplicate options: "${normalizedText.substring(0, 50)}..."`);
                console.warn(`   Options: ${JSON.stringify(options)}`);
                filteredCount++;
                continue;
            }
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
    
    // STRICT REQUIREMENT: Must have EXACTLY the requested question count (typically 20)
    if (uniqueQuestions.length < questionCount) {
        const needed = questionCount - uniqueQuestions.length;
        console.warn(`⚠️ CRITICAL: Only ${uniqueQuestions.length}/${questionCount} valid questions. Need ${needed} more.`);
        console.warn(`⚠️ Generating additional batch to reach exactly ${questionCount} questions...`);
        
        // Request 50% more to account for filtering
        const requestAmount = Math.ceil(needed * 1.5);
        console.log(`📡 Requesting ${requestAmount} questions (50% buffer) to get ${needed} valid ones`);
        
        const learnerLevel = gradeLevel === 'higher_secondary' ? '11th-12th grade' : 'college/university';
        const additionalPrompt = usesDynamicTopics && !topics
            ? `🎯 CRITICAL: Generate EXACTLY ${requestAmount} additional multiple-choice knowledge questions for a ${learnerLevel} learner studying ${streamName}.

⚠️ ALL questions MUST be about ${streamName} - DO NOT generate questions about other subjects!
⚠️ DO NOT use image references like "shown below", "given figure", "refer to the diagram"
⚠️ ALL 4 OPTIONS MUST BE UNIQUE - no duplicate answers allowed

Requirements:
1. All questions must be MCQ with exactly 4 unique options
2. Each question must have exactly ONE correct answer
3. Difficulty distribution: 30% easy, 50% medium, 20% hard
4. Test practical understanding and application
5. Questions should be appropriate for ${learnerLevel} learners

Output Format - Respond with ONLY valid JSON (no markdown):
{"questions":[{"id":1,"type":"mcq","difficulty":"easy","question":"Question text","options":["A","B","C","D"],"correct_answer":"A","skill_tag":"topic"}]}

Generate EXACTLY ${requestAmount} questions.`
            : `🎯 CRITICAL: Generate EXACTLY ${requestAmount} additional multiple-choice questions about ${streamName}.

⚠️ DO NOT use image references
⚠️ ALL 4 OPTIONS MUST BE UNIQUE

Requirements:
1. All questions must be MCQ with exactly 4 unique options
2. Each question must have exactly ONE correct answer
3. Difficulty distribution: 30% easy, 50% medium, 20% hard

Output Format - Respond with ONLY valid JSON (no markdown):
{"questions":[{"id":1,"type":"mcq","difficulty":"easy","question":"Question text","options":["A","B","C","D"],"correct_answer":"A","skill_tag":"topic"}]}

Generate EXACTLY ${requestAmount} questions.`;

        const additionalSystemPrompt = `You are an expert educational assessment creator. 

🎯 CRITICAL: Generate ${requestAmount} HIGH-QUALITY questions with NO duplicates, NO image references, and VALID unique options.
Generate ONLY valid JSON with no markdown.`;

        try {
            console.log(`🔄 Generating additional batch with ${requestAmount} questions...`);
            
            const additionalJsonText = await callOpenRouterWithRetry(openRouterKey, [
                { role: 'system', content: additionalSystemPrompt },
                { role: 'user', content: additionalPrompt }
            ], {
                maxTokens: requestAmount * 150 + 500
            });

            const additionalParsed = repairAndParseJSON(additionalJsonText);
            const additionalQuestions = additionalParsed.questions || additionalParsed;

            console.log(`✅ Additional batch generated: ${additionalQuestions?.length || 0} questions`);

            if (Array.isArray(additionalQuestions)) {
                let addedCount = 0;
                // Validate additional questions with same criteria
                for (const q of additionalQuestions) {
                    // Stop if we've reached the target
                    if (uniqueQuestions.length >= questionCount) break;
                    
                    const normalizedText = q.question?.toLowerCase().trim() || q.text?.toLowerCase().trim() || '';
                    
                    if (!normalizedText || seenTexts.has(normalizedText)) continue;
                    
                    // Check for image references
                    const imageKeywords = [
                        'shown below', 'shown above', 'given figure', 'following figure', 
                        'above figure', 'below figure', 'see the diagram', 'see the image',
                        'look at the diagram', 'look at the image', 'refer to the diagram',
                        'refer to the image', 'as depicted in the figure', 'as shown in the figure'
                    ];
                    if (imageKeywords.some(keyword => normalizedText.includes(keyword))) continue;
                    
                    const options = q.options || {};
                    if (Array.isArray(options) && options.length === 4) {
                        const optionValues = options.map((v: any) => String(v || '').toLowerCase().trim()).filter(v => v.length > 0);
                        const uniqueOptionsSet = new Set(optionValues);
                        
                        if (uniqueOptionsSet.size === 4 && optionValues.length === 4 && optionValues.every(v => v && v.length > 0)) {
                            seenTexts.add(normalizedText);
                            uniqueQuestions.push(q);
                            addedCount++;
                        }
                    } else if (typeof options === 'object') {
                        const hasAllOptions = ['A', 'B', 'C', 'D'].every(opt => 
                            options[opt] && typeof options[opt] === 'string' && options[opt].trim().length > 0
                        );
                        
                        if (hasAllOptions) {
                            const optionValues = Object.values(options).map((v: any) => String(v).toLowerCase().trim());
                            const uniqueOptionsSet = new Set(optionValues);
                            
                            if (uniqueOptionsSet.size === 4) {
                                seenTexts.add(normalizedText);
                                uniqueQuestions.push(q);
                                addedCount++;
                            }
                        }
                    }
                }
                console.log(`✅ Added ${addedCount} additional valid questions (total now: ${uniqueQuestions.length}/${questionCount})`);
            }
        } catch (error) {
            console.error(`❌ Failed to generate additional questions:`, error);
        }
    }
    
    // Final check - if still short, throw error
    if (uniqueQuestions.length < questionCount) {
        const deficit = questionCount - uniqueQuestions.length;
        console.error(`❌ FAILED: Only generated ${uniqueQuestions.length}/${questionCount} questions (${deficit} short)`);
        throw new Error(`Failed to generate required ${questionCount} questions. Only got ${uniqueQuestions.length} valid questions. AI quality may be insufficient.`);
    }
    
    // If we have more than needed, trim to exact count
    if (uniqueQuestions.length > questionCount) {
        console.log(`✂️ Trimming ${uniqueQuestions.length} questions down to exactly ${questionCount}`);
        uniqueQuestions.splice(questionCount);
    }
    
    console.log(`✅ FINAL COUNT: ${uniqueQuestions.length} questions (target was ${questionCount})`);
    
    // If more than 20% were filtered, log warning
    if (filteredCount > allQuestions.length * 0.2) {
        console.warn(`⚠️ WARNING: ${filteredCount} questions filtered (${Math.round(filteredCount/allQuestions.length*100)}%) - AI quality may need improvement`);
    }
    
    console.log('🎓 ============================================');

    // Use UUIDs for all question IDs (required for database consistency)
    const processedQuestions = uniqueQuestions.map((q: any) => {
        const questionUuid = generateUUID();
        return {
            ...q,
            id: questionUuid, // Use UUID as the ID
            uuid: questionUuid, // Keep UUID field for consistency
            stream_id: streamId,
            stream_name: streamName,
            created_at: new Date().toISOString()
        };
    });

    if (learnerId) {
        // Use upsert to handle potential race conditions or re-generation.
        // Save whenever learnerId is known — attemptId is nullable metadata only;
        // the uniqueness constraint is (learner_id, stream_id, question_type).
        const { error } = await supabase
            .from('career_assessment_ai_questions')
            .upsert({
                learner_id: learnerId,
                question_type: 'knowledge',
                questions: processedQuestions,
                stream_id: streamId,
                attempt_id: null,
                created_at: new Date().toISOString()
            }, {
                onConflict: 'learner_id, stream_id, question_type',
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
