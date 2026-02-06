/**
 * Streaming Aptitude Question Generation Handler
 * 
 * Implements Server-Sent Events (SSE) for real-time question streaming
 * Generates aptitude questions progressively and sends them to the client as they're created
 */

import { createSupabaseClient } from '../../../../src/functions-lib/supabase';
import { PagesEnv } from '../../../../src/functions-lib/types';
import { jsonResponse } from '../../../../src/functions-lib/response';
import { SCHOOL_SUBJECT_PROMPT, APTITUDE_PROMPT } from '../prompts';
import {
    callOpenRouterWithRetry,
    repairAndParseJSON,
    generateUUID,
    getAPIKeys,
    API_CONFIG,
    MODEL_PROFILES
} from '../../shared/ai-config';
import { STREAM_CONTEXTS } from '../stream-contexts';

// Categories with specific question counts to match UI expectations (total: 50)
const APTITUDE_CATEGORIES = [
    { id: 'verbal', name: 'Verbal Reasoning', description: 'Language comprehension, vocabulary, analogies', count: 8 },
    { id: 'numerical', name: 'Numerical Ability', description: 'Mathematical reasoning, data interpretation', count: 8 },
    { id: 'abstract', name: 'Abstract / Logical Reasoning', description: 'Pattern recognition, deductive reasoning, sequences', count: 8 },
    { id: 'spatial', name: 'Spatial / Mechanical Reasoning', description: 'Visual-spatial relationships, gears, rotation', count: 6 },
    { id: 'clerical', name: 'Clerical Speed & Accuracy', description: 'String comparison, attention to detail - mark Same or Different', count: 20 }
];

// School Subject Categories for After 10th students (total: 50 questions)
const SCHOOL_SUBJECT_CATEGORIES = [
    { id: 'mathematics', name: 'Mathematics', description: 'Algebra, geometry, arithmetic, problem-solving - tests analytical and numerical skills', count: 10 },
    { id: 'science', name: 'Science (Physics, Chemistry, Biology)', description: 'Scientific concepts, experiments, formulas, natural phenomena', count: 10 },
    { id: 'english', name: 'English Language', description: 'Grammar, vocabulary, comprehension, communication skills', count: 10 },
    { id: 'social_studies', name: 'Social Studies (History, Geography, Civics)', description: 'Historical events, geography, civics, current affairs, society', count: 10 },
    { id: 'computer', name: 'Computer & Logical Thinking', description: 'Basic computer concepts, logical reasoning, problem-solving, digital literacy', count: 10 }
];

/**
 * Handle streaming aptitude question generation
 * Sends questions via Server-Sent Events as they're generated
 */
export async function handleStreamingAptitude(
    request: Request,
    env: PagesEnv
): Promise<Response> {
    if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    // Parse request body
    let body: any;
    try {
        body = await request.json();
    } catch {
        return jsonResponse({ error: 'Invalid JSON' }, 400);
    }

    const { streamId, studentId, attemptId, gradeLevel } = body;

    if (!streamId) {
        return jsonResponse({ error: 'Stream ID is required' }, 400);
    }

    const { openRouter: openRouterKey } = getAPIKeys(env);
    if (!openRouterKey) {
        return jsonResponse({ error: 'OpenRouter API key not configured' }, 500);
    }

    const supabase = createSupabaseClient(env);
    const isAfter10 = gradeLevel === 'after10';
    const categories = isAfter10 ? SCHOOL_SUBJECT_CATEGORIES : APTITUDE_CATEGORIES;
    const totalQuestions = categories.reduce((sum, cat) => sum + cat.count, 0);

    console.log(`📡 Starting streaming generation: streamId=${streamId}, gradeLevel=${gradeLevel}, total=${totalQuestions}`);

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            try {
                // Send initial progress
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    type: 'progress',
                    message: 'Starting question generation...',
                    count: 0,
                    total: totalQuestions
                })}\n\n`));

                const allGeneratedQuestions: any[] = [];
                const batchSize = Math.ceil(totalQuestions / 2);

                // Generate in 2 batches
                for (let batchNum = 1; batchNum <= 2; batchNum++) {
                    const startIdx = (batchNum - 1) * batchSize;
                    const endIdx = Math.min(batchNum * batchSize, totalQuestions);
                    let questionsSoFar = 0;
                    const batchCategories: any[] = [];

                    // Determine which categories to include in this batch
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

                    // Send batch progress
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'progress',
                        message: `Generating batch ${batchNum}/2 (${batchTotal} questions)...`,
                        count: allGeneratedQuestions.length,
                        total: totalQuestions
                    })}\n\n`));

                    // Build prompt
                    let prompt: string;
                    let systemPrompt: string;

                    if (isAfter10) {
                        prompt = SCHOOL_SUBJECT_PROMPT
                            .replace(/{{QUESTION_COUNT}}/g, batchTotal.toString())
                            .replace(/{{CATEGORIES}}/g, JSON.stringify(batchCategories, null, 2));
                        systemPrompt = `You are an expert educational assessment creator for 10th grade students. Generate EXACTLY ${batchTotal} questions total covering school subjects. Generate ONLY valid JSON.`;
                    } else {
                        // Determine stream context
                        let contextKey = streamId;
                        if (!STREAM_CONTEXTS[contextKey]) {
                            if (streamId.includes('btech') || streamId.includes('engineering')) contextKey = 'engineering';
                            else if (streamId.includes('mbbs') || streamId.includes('medical')) contextKey = 'medical';
                            else if (streamId.includes('bba') || streamId.includes('mba') || streamId.includes('management')) contextKey = 'management';
                            else if (streamId.includes('bca') || streamId.includes('mca') || streamId.includes('cs') || streamId.includes('it')) contextKey = 'it_software';
                            else if (streamId.includes('com')) contextKey = 'commerce';
                            else if (streamId.includes('sc')) contextKey = 'science';
                            else if (streamId.includes('art') || streamId.includes('ba')) contextKey = 'arts';
                            else contextKey = 'college';
                        }

                        const streamContext = STREAM_CONTEXTS[contextKey] || STREAM_CONTEXTS.college || STREAM_CONTEXTS.general;

                        prompt = APTITUDE_PROMPT
                            .replace(/{{QUESTION_COUNT}}/g, batchTotal.toString())
                            .replace(/{{CATEGORIES}}/g, JSON.stringify(batchCategories, null, 2))
                            .replace(/{{STREAM_CONTEXT}}/g, streamContext?.context || 'General aptitude context')
                            .replace(/{{CLERICAL_EXAMPLE}}/g, streamContext?.clericalExample || 'GEN-123-TST');
                        systemPrompt = `You are an expert psychometric assessment creator. Generate EXACTLY ${batchTotal} questions total. Generate ONLY valid JSON.`;
                    }

                    // Call AI with retry
                    console.log(`🔑 Batch ${batchNum}: Calling OpenRouter for ${batchTotal} questions`);
                    const jsonText = await callOpenRouterWithRetry(openRouterKey, [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: prompt }
                    ]);

                    // Parse response
                    const parsed = repairAndParseJSON(jsonText);
                    const batchQuestions = parsed.questions || parsed;

                    if (!Array.isArray(batchQuestions)) {
                        throw new Error(`Expected array of questions, got: ${typeof batchQuestions}`);
                    }

                    // STRICT validation: Filter invalid questions
                    const validBatchQuestions: any[] = [];
                    let filteredCount = 0;
                    const seenTexts = new Set<string>();
                    
                    for (const question of batchQuestions) {
                        const questionText = question.question?.toLowerCase().trim() || question.text?.toLowerCase().trim() || '';
                        
                        // Check for duplicate question text
                        if (!questionText || seenTexts.has(questionText)) {
                            console.warn(`⚠️ Filtered duplicate question in streaming`);
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
                            console.warn(`⚠️ Filtered question with image reference in streaming`);
                            filteredCount++;
                            continue;
                        }
                        
                        // Validate answer options are unique
                        const options = question.options || {};
                        const optionValues = Object.values(options).map((v: any) => String(v).toLowerCase().trim());
                        const uniqueOptions = new Set(optionValues);
                        
                        if (uniqueOptions.size < optionValues.length) {
                            console.warn(`⚠️ Filtered question with duplicate options in streaming`);
                            filteredCount++;
                            continue;
                        }
                        
                        // Validate all options are non-empty
                        if (optionValues.some(v => !v || v.length === 0)) {
                            console.warn(`⚠️ Filtered question with empty options in streaming`);
                            filteredCount++;
                            continue;
                        }
                        
                        seenTexts.add(questionText);
                        validBatchQuestions.push(question);
                    }
                    
                    if (filteredCount > 0) {
                        console.log(`🔍 Streaming validation: ${validBatchQuestions.length}/${batchQuestions.length} valid (filtered: ${filteredCount})`);
                    }

                    // Send each valid question individually
                    for (const question of validBatchQuestions) {
                        const processedQuestion = {
                            id: generateUUID(),
                            ...question,
                            stream_id: streamId,
                            grade_level: gradeLevel || 'general',
                            created_at: new Date().toISOString()
                        };

                        allGeneratedQuestions.push(processedQuestion);

                        // Send question to client
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                            type: 'question',
                            data: processedQuestion,
                            count: allGeneratedQuestions.length,
                            total: totalQuestions
                        })}\n\n`));
                    }

                    console.log(`✅ Batch ${batchNum}/2 complete: ${batchQuestions.length} questions streamed`);
                }

                // Save to database if studentId and attemptId provided
                if (studentId && attemptId) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'progress',
                        message: 'Saving questions to database...',
                        count: allGeneratedQuestions.length,
                        total: totalQuestions
                    })}\n\n`));

                    const { error } = await supabase
                        .from('career_assessment_ai_questions')
                        .upsert({
                            student_id: studentId,
                            question_type: 'aptitude',
                            questions: allGeneratedQuestions,
                            stream_id: streamId,
                            created_at: new Date().toISOString()
                        }, {
                            onConflict: 'student_id, stream_id, question_type',
                            ignoreDuplicates: false
                        });

                    if (error) {
                        console.error('❌ Database error:', error);
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                            type: 'warning',
                            message: 'Questions generated but not saved to database'
                        })}\n\n`));
                    }
                }

                // Send completion event
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    type: 'complete',
                    message: 'All questions generated successfully',
                    count: allGeneratedQuestions.length,
                    total: totalQuestions
                })}\n\n`));

                console.log(`✅ Streaming complete: ${allGeneratedQuestions.length} questions sent`);
                controller.close();

            } catch (error: any) {
                console.error('❌ Streaming error:', error);

                // Send error event
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                    type: 'error',
                    message: error.message || 'Failed to generate questions'
                })}\n\n`));

                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        }
    });
}
