
import { createSupabaseAdminClient } from '../../../lib/supabase';
import { PagesEnv } from '../../../lib/types';
import { SCHOOL_SUBJECT_PROMPT, APTITUDE_PROMPT } from '../prompts';
import {
    callOpenRouterWithRetry,
    repairAndParseJSON,
    generateUUID,
    getAPIKeys
} from '../../shared/ai-config';
import { STREAM_CONTEXTS } from '../stream-contexts';

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

// Categories with specific question counts to match UI expectations (total: 50)
const APTITUDE_CATEGORIES = [
    { id: 'verbal', name: 'Verbal Reasoning', description: 'Language comprehension, vocabulary, analogies', count: 8 },
    { id: 'numerical', name: 'Numerical Ability', description: 'Mathematical reasoning, data interpretation', count: 20 },
    { id: 'abstract', name: 'Abstract / Logical Reasoning', description: 'Pattern recognition, deductive reasoning, sequences', count: 9 },
    { id: 'spatial', name: 'Spatial / Mechanical Reasoning', description: 'Visual-spatial relationships, gears, rotation', count: 8 },
    { id: 'clerical', name: 'Clerical Speed & Accuracy', description: 'String comparison, attention to detail - mark Same or Different', count: 5 }
];

// School Subject Categories for After 10th learners (total: 50 questions)
const SCHOOL_SUBJECT_CATEGORIES = [
    { id: 'mathematics', name: 'Mathematics', description: 'Algebra, geometry, arithmetic, problem-solving - tests analytical and numerical skills', count: 10 },
    { id: 'science', name: 'Science (Physics, Chemistry, Biology)', description: 'Scientific concepts, experiments, formulas, natural phenomena', count: 10 },
    { id: 'english', name: 'English Language', description: 'Grammar, vocabulary, comprehension, communication skills', count: 10 },
    { id: 'social_studies', name: 'Social Studies (History, Geography, Civics)', description: 'Historical events, geography, civics, current affairs, society', count: 10 },
    { id: 'computer', name: 'Computer & Logical Thinking', description: 'Basic computer concepts, logical reasoning, problem-solving, digital literacy', count: 10 }
];

// Aptitude question generation handler
export async function generateAptitudeQuestions(
    env: PagesEnv,
    streamId: string,
    questionsPerCategory: number = 5,
    learnerId?: string,
    attemptId?: string,
    gradeLevel?: string
) {
    console.log('🧠 ============================================');
    console.log('🧠 APTITUDE QUESTION GENERATION STARTED');
    console.log('🧠 ============================================');
    console.log(`📋 Stream ID: ${streamId}`);
    console.log(`📋 Questions Per Category: ${questionsPerCategory}`);
    console.log(`📋 Grade Level: ${gradeLevel || 'not specified'}`);
    console.log(`📋 Learner ID: ${learnerId || 'not specified'}`);
    console.log(`📋 Attempt ID: ${attemptId || 'not specified'}`);
    
    const supabase = createSupabaseAdminClient(env);
    const isAfter10 = gradeLevel === 'after10';

    console.log(`📚 Grade level detection: streamId=${streamId}, gradeLevel=${gradeLevel}, isAfter10=${isAfter10}`);

    const categories = isAfter10 ? SCHOOL_SUBJECT_CATEGORIES : APTITUDE_CATEGORIES;
    const totalQuestions = categories.reduce((sum, cat) => sum + cat.count, 0);

    console.log(`📊 Categories being used:`, JSON.stringify(categories, null, 2));
    console.log(`📊 Total questions expected: ${totalQuestions}`);
    console.log(`📝 Generating fresh aptitude questions in 2 batches for stream: ${streamId}`);

    const { openRouter: openRouterKey } = getAPIKeys(env);

    if (!openRouterKey) {
        throw new Error('OpenRouter API key not configured');
    }

    // Determine stream context once for reuse
    let contextKey = streamId;
    if (!isAfter10 && !STREAM_CONTEXTS[contextKey]) {
        if (streamId.includes('btech') || streamId.includes('engineering')) contextKey = 'engineering';
        else if (streamId.includes('mbbs') || streamId.includes('medical')) contextKey = 'medical';
        else if (streamId.includes('bba') || streamId.includes('mba') || streamId.includes('management')) contextKey = 'management';
        else if (streamId.includes('bca') || streamId.includes('mca') || streamId.includes('cs') || streamId.includes('it')) contextKey = 'it_software';
        else if (streamId.includes('com')) contextKey = 'commerce';
        else if (streamId.includes('sc')) contextKey = 'science';
        else if (streamId.includes('economics')) contextKey = 'arts_economics';
        else if (streamId.includes('psychology')) contextKey = 'arts_psychology';
        else if (streamId.includes('art') || streamId.includes('ba')) contextKey = 'arts';
        else contextKey = 'college';
    }
    const streamContext = !isAfter10 ? (STREAM_CONTEXTS[contextKey] || STREAM_CONTEXTS.college || STREAM_CONTEXTS.general) : null;

    const allGeneratedQuestions: any[] = [];
    const batchSize = Math.ceil(totalQuestions / 2);

    for (let batchNum = 1; batchNum <= 2; batchNum++) {
        const startIdx = (batchNum - 1) * batchSize;
        const endIdx = Math.min(batchNum * batchSize, totalQuestions);
        let questionsSoFar = 0;
        const batchCategories: any[] = [];

        for (const category of categories) {
            if (questionsSoFar >= endIdx) break;
            if (questionsSoFar + category.count <= startIdx) {
                questionsSoFar += category.count;
                continue;
            }

            const skipCount = Math.max(0, startIdx - questionsSoFar);
            const takeCount = Math.min(category.count - skipCount, endIdx - questionsSoFar - skipCount);

            if (takeCount > 0) {
                batchCategories.push({
                    ...category,
                    count: takeCount
                });
            }
            questionsSoFar += category.count;
        }

        const batchTotal = batchCategories.reduce((sum, cat) => sum + cat.count, 0);

        console.log(`📦 Batch ${batchNum} categories:`, JSON.stringify(batchCategories, null, 2));
        console.log(`📦 Batch ${batchNum} total questions: ${batchTotal}`);

        let prompt: string;
        if (isAfter10) {
            prompt = SCHOOL_SUBJECT_PROMPT
                .replace(/{{QUESTION_COUNT}}/g, batchTotal.toString())
                .replace(/{{CATEGORIES}}/g, JSON.stringify(batchCategories, null, 2));
        } else {
            // Use pre-determined stream context
            console.log(`🧠 Using stream context: '${contextKey}' for streamId: '${streamId}'`);
            console.log(`📝 Stream name: ${streamContext?.name || 'Unknown'}`);

            prompt = APTITUDE_PROMPT
                .replace(/{{QUESTION_COUNT}}/g, batchTotal.toString())
                .replace(/{{CATEGORIES}}/g, JSON.stringify(batchCategories, null, 2))
                .replace(/{{STREAM_NAME}}/g, streamContext?.name || 'General')
                .replace(/{{STREAM_CONTEXT}}/g, streamContext?.context || 'General aptitude context')
                .replace(/{{CLERICAL_EXAMPLE}}/g, streamContext?.clericalExample || 'GEN-123-TST');
        }

        const systemPrompt = isAfter10
            ? `You are an expert educational assessment creator for 10th grade learners. 

🎯 CRITICAL: You MUST generate EXACTLY ${batchTotal} questions total covering school subjects. This is a strict requirement.

Before responding, verify you have EXACTLY ${batchTotal} questions. Generate ONLY valid JSON with no markdown.`
            : `You are an expert psychometric assessment creator. 

🎯 CRITICAL: You MUST generate EXACTLY ${batchTotal} questions total. This is a strict requirement.

Before responding, verify you have EXACTLY ${batchTotal} questions. Generate ONLY valid JSON with no markdown.`;

        // Use OpenRouter with automatic retry and fallback
        // Calculate token limit: ~150 tokens per question + 500 buffer
        const estimatedTokens = batchTotal * 150 + 500;
        console.log(`🔑 Batch ${batchNum}: Using OpenRouter with retry for ${batchTotal} questions (maxTokens: ${estimatedTokens})`);

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

        allGeneratedQuestions.push(...batchQuestions);
        console.log(`✅ Batch ${batchNum}/${2} complete: ${batchQuestions.length} questions generated`);
    }

    console.log(`✅ Generated ${allGeneratedQuestions.length} total questions via AI`);
    
    // COMPREHENSIVE VALIDATION: Check for duplicate questions and validate answer options
    const uniqueQuestions: any[] = [];
    const seenTexts = new Set<string>();
    let filteredCount = 0;
    
    for (const q of allGeneratedQuestions) {
        const normalizedText = q.question?.toLowerCase().trim() || q.text?.toLowerCase().trim() || '';
        
        // Check for duplicate question text (exact match only)
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
        
        // Check for image references (REFINED: only explicit image references, not general words)
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
    
    console.log(`🔍 After validation: ${uniqueQuestions.length}/${allGeneratedQuestions.length} valid questions (filtered: ${filteredCount})`);
    
    // STRICT REQUIREMENT: Must have EXACTLY 50 questions
    if (uniqueQuestions.length < totalQuestions) {
        const needed = totalQuestions - uniqueQuestions.length;
        console.warn(`⚠️ CRITICAL: Only ${uniqueQuestions.length}/${totalQuestions} valid questions. Need ${needed} more.`);
        console.warn(`⚠️ Generating additional batch to reach exactly ${totalQuestions} questions...`);
        
        // Determine which categories need more questions
        const categoryCounts = new Map<string, number>();
        for (const q of uniqueQuestions) {
            const cat = q.category || 'unknown';
            categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
        }
        
        console.log(`📊 Current category distribution:`, Object.fromEntries(categoryCounts));
        
        // Find categories that are short - distribute needed questions proportionally
        const shortCategories: any[] = [];
        let totalShortage = 0;
        
        for (const category of categories) {
            const current = categoryCounts.get(category.id) || 0;
            if (current < category.count) {
                const shortage = category.count - current;
                shortCategories.push({
                    ...category,
                    shortage,
                    count: shortage // Will adjust below
                });
                totalShortage += shortage;
            }
        }
        
        console.log(`📊 Categories needing more questions:`, shortCategories.map(c => `${c.id}: ${c.shortage}`).join(', '));
        
        // Distribute the needed questions proportionally, but request 50% more to account for filtering
        const requestAmount = Math.ceil(needed * 1.5);
        console.log(`📡 Requesting ${requestAmount} questions (50% buffer) to get ${needed} valid ones`);
        
        if (shortCategories.length > 0) {
            // Distribute proportionally
            for (const cat of shortCategories) {
                cat.count = Math.ceil((cat.shortage / totalShortage) * requestAmount);
            }
            
            const additionalPrompt = isAfter10
                ? SCHOOL_SUBJECT_PROMPT
                    .replace(/{{QUESTION_COUNT}}/g, requestAmount.toString())
                    .replace(/{{CATEGORIES}}/g, JSON.stringify(shortCategories, null, 2))
                : APTITUDE_PROMPT
                    .replace(/{{QUESTION_COUNT}}/g, requestAmount.toString())
                    .replace(/{{CATEGORIES}}/g, JSON.stringify(shortCategories, null, 2))
                    .replace(/{{STREAM_NAME}}/g, streamContext?.name || 'General')
                    .replace(/{{STREAM_CONTEXT}}/g, streamContext?.context || 'General aptitude context')
                    .replace(/{{CLERICAL_EXAMPLE}}/g, streamContext?.clericalExample || 'GEN-123-TST');

            const additionalSystemPrompt = `You are an expert assessment creator. 

🎯 CRITICAL: Generate ${requestAmount} HIGH-QUALITY questions with NO duplicates, NO image references, and VALID options.
Each question MUST have exactly 4 unique options (A, B, C, D) with one correct answer.
Generate ONLY valid JSON with no markdown.

IMPORTANT: Avoid these words that suggest images: "shown below", "shown above", "given figure", "following figure", "refer to the diagram"`;

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
                        if (uniqueQuestions.length >= totalQuestions) break;
                        
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
                            const uniqueOptions = new Set(optionValues);
                            
                            if (uniqueOptions.size === 4 && optionValues.length === 4 && optionValues.every(v => v && v.length > 0)) {
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
                                const uniqueOptions = new Set(optionValues);
                                
                                if (uniqueOptions.size === 4) {
                                    seenTexts.add(normalizedText);
                                    uniqueQuestions.push(q);
                                    addedCount++;
                                }
                            }
                        }
                    }
                    console.log(`✅ Added ${addedCount} additional valid questions (total now: ${uniqueQuestions.length}/${totalQuestions})`);
                }
            } catch (error) {
                console.error(`❌ Failed to generate additional questions:`, error);
            }
        }
    }
    
    // Final check - if still short, throw error
    if (uniqueQuestions.length < totalQuestions) {
        const deficit = totalQuestions - uniqueQuestions.length;
        console.error(`❌ FAILED: Only generated ${uniqueQuestions.length}/${totalQuestions} questions (${deficit} short)`);
        throw new Error(`Failed to generate required ${totalQuestions} questions. Only got ${uniqueQuestions.length} valid questions. AI quality may be insufficient.`);
    }
    
    // If we have more than needed (shouldn't happen), trim to exact count
    if (uniqueQuestions.length > totalQuestions) {
        console.log(`✂️ Trimming ${uniqueQuestions.length} questions down to exactly ${totalQuestions}`);
        uniqueQuestions.splice(totalQuestions);
    }
    
    // If more than 20% were filtered, log warning
    if (filteredCount > allGeneratedQuestions.length * 0.2) {
        console.warn(`⚠️ WARNING: ${filteredCount} questions filtered (${Math.round(filteredCount/allGeneratedQuestions.length*100)}%) - AI quality may need improvement`);
    }
    
    console.log('🧠 ============================================');

    // Use UUIDs for all question IDs (required for database consistency)
    const processedQuestions = uniqueQuestions.map((q: any) => {
        const questionUuid = generateUUID();
        return {
            ...q,
            id: questionUuid, // Use UUID as the ID
            uuid: questionUuid, // Keep UUID field for consistency
            stream_id: streamId,
            grade_level: gradeLevel || 'general',
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
                question_type: 'aptitude',
                questions: processedQuestions,
                stream_id: streamId,
                attempt_id: null,
                created_at: new Date().toISOString()
            }, {
                onConflict: 'learner_id, stream_id, question_type',
                ignoreDuplicates: false // Update if exists
            });

        if (error) {
            console.error('❌ Database error saving aptitude questions:', error);
            // Don't throw error here to allow the generated questions to be returned to frontend
            // identifying this as a non-fatal error for the user experience
        }
    }

    console.log(`📦 Returning ${processedQuestions.length} questions`);
    return processedQuestions;
}
