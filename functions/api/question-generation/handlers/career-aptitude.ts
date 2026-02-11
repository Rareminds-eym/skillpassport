
import { createSupabaseAdminClient } from '../../../../src/functions-lib/supabase';
import { PagesEnv } from '../../../../src/functions-lib/types';
import { SCHOOL_SUBJECT_PROMPT, APTITUDE_PROMPT } from '../prompts';
import {
    callOpenRouterWithRetry,
    repairAndParseJSON,
    generateUUID,
    getAPIKeys
} from '../../shared/ai-config';
import { STREAM_CONTEXTS } from '../stream-contexts';

// All utility functions are now imported from centralized ai-config.ts

// Categories with specific question counts to match UI expectations (total: 50)
const APTITUDE_CATEGORIES = [
    { id: 'verbal', name: 'Verbal Reasoning', description: 'Language comprehension, vocabulary, analogies', count: 8 },
    { id: 'numerical', name: 'Numerical Ability', description: 'Mathematical reasoning, data interpretation', count: 20 },
    { id: 'abstract', name: 'Abstract / Logical Reasoning', description: 'Pattern recognition, deductive reasoning, sequences', count: 9 },
    { id: 'spatial', name: 'Spatial / Mechanical Reasoning', description: 'Visual-spatial relationships, gears, rotation', count: 8 },
    { id: 'clerical', name: 'Clerical Speed & Accuracy', description: 'String comparison, attention to detail - mark Same or Different', count: 5 }
];

// School Subject Categories for After 10th students (total: 50 questions)
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
    studentId?: string,
    attemptId?: string,
    gradeLevel?: string
) {
    console.log('🧠 ============================================');
    console.log('🧠 APTITUDE QUESTION GENERATION STARTED');
    console.log('🧠 ============================================');
    console.log(`📋 Stream ID: ${streamId}`);
    console.log(`📋 Questions Per Category: ${questionsPerCategory}`);
    console.log(`📋 Grade Level: ${gradeLevel || 'not specified'}`);
    console.log(`📋 Student ID: ${studentId || 'not specified'}`);
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
            ? `You are an expert educational assessment creator for 10th grade students. 

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
        
        // Check for duplicate question text
        if (!normalizedText || seenTexts.has(normalizedText)) {
            console.warn(`⚠️ Filtered duplicate question: "${normalizedText.substring(0, 50)}..."`);
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
        }
        
        seenTexts.add(normalizedText);
        uniqueQuestions.push(q);
    }
    
    console.log(`🔍 After validation: ${uniqueQuestions.length}/${allGeneratedQuestions.length} valid questions (filtered: ${filteredCount})`);
    
    // If we don't have enough questions, generate more to reach the target
    if (uniqueQuestions.length < totalQuestions) {
        const needed = totalQuestions - uniqueQuestions.length;
        console.warn(`⚠️ Only ${uniqueQuestions.length}/${totalQuestions} valid questions. Generating ${needed} more...`);
        
        // Determine which categories need more questions
        const categoryCounts = new Map<string, number>();
        for (const q of uniqueQuestions) {
            const cat = q.category || 'unknown';
            categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
        }
        
        // Find categories that are short
        const shortCategories: any[] = [];
        for (const category of categories) {
            const current = categoryCounts.get(category.id) || 0;
            if (current < category.count) {
                shortCategories.push({
                    ...category,
                    count: Math.min(category.count - current, needed)
                });
            }
        }
        
        if (shortCategories.length > 0) {
            const additionalPrompt = isAfter10
                ? SCHOOL_SUBJECT_PROMPT
                    .replace(/{{QUESTION_COUNT}}/g, needed.toString())
                    .replace(/{{CATEGORIES}}/g, JSON.stringify(shortCategories, null, 2))
                : APTITUDE_PROMPT
                    .replace(/{{QUESTION_COUNT}}/g, needed.toString())
                    .replace(/{{CATEGORIES}}/g, JSON.stringify(shortCategories, null, 2))
                    .replace(/{{STREAM_NAME}}/g, streamContext?.name || 'General')
                    .replace(/{{STREAM_CONTEXT}}/g, streamContext?.context || 'General aptitude context')
                    .replace(/{{CLERICAL_EXAMPLE}}/g, streamContext?.clericalExample || 'GEN-123-TST');

            const additionalSystemPrompt = `You are an expert assessment creator. Generate EXACTLY ${needed} questions. Generate ONLY valid JSON with no markdown.`;

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
                                
                                if (uniqueQuestions.length >= totalQuestions) break;
                            }
                        }
                    }
                    console.log(`✅ Added ${uniqueQuestions.length - (totalQuestions - needed)} additional valid questions`);
                }
            } catch (error) {
                console.error(`❌ Failed to generate additional questions:`, error);
            }
        }
    }
    
    // If more than 20% were filtered, log warning
    if (filteredCount > allGeneratedQuestions.length * 0.2) {
        console.warn(`⚠️ WARNING: ${filteredCount} questions filtered (${Math.round(filteredCount/allGeneratedQuestions.length*100)}%) - AI quality may need improvement`);
    }
    
    console.log('🧠 ============================================');

    // Use sequential numeric IDs for consistency with answer storage
    // Format: 1, 2, 3, ... (not UUIDs) so answers can be matched
    const processedQuestions = uniqueQuestions.map((q: any, index: number) => ({
        ...q,
        id: index + 1, // Sequential numeric ID
        uuid: generateUUID(), // Keep UUID for database uniqueness
        stream_id: streamId,
        grade_level: gradeLevel || 'general',
        created_at: new Date().toISOString()
    }));

    if (studentId && attemptId) {
        // Use upsert to handle potential race conditions or re-generation
        const { error } = await supabase
            .from('career_assessment_ai_questions')
            .upsert({
                student_id: studentId,
                question_type: 'aptitude',
                questions: processedQuestions,
                stream_id: streamId,
                created_at: new Date().toISOString()
            }, {
                onConflict: 'student_id, stream_id, question_type',
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
