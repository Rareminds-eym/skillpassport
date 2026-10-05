/**
 * Streaming Aptitude Question Generation Handler
 * 
 * Implements Server-Sent Events (SSE) for real-time question streaming
 * Generates aptitude questions progressively and sends them to the client as they're created
 */

import { createSupabaseClient, createSupabaseAdminClient } from '../../../lib/supabase';
import { PagesEnv } from '../../../lib/types';
import { apiError } from '../../../lib/response';
import { SCHOOL_SUBJECT_PROMPT, APTITUDE_PROMPT } from '../prompts';
import {
    callOpenRouterWithRetry,
    repairAndParseJSON,
    generateUUID,
    getAPIKeys
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

// School Subject Categories for After 10th learners (total: 50 questions)
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
        return apiError(405, 'ERROR', 'Method not allowed', request);
    }

    // Parse request body
    let body: any;
    try {
        body = await request.json();
    } catch {
        return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON', request);
    }

    // attemptId is accepted by the request body (frontend contract unchanged) but not
    // used in this handler - verified it has no functional role beyond the old
    // "if (learnerId && attemptId)" save gate, replaced by gradeLevel below.
    const { streamId, learnerId, gradeLevel: requestedGradeLevel } = body;

    if (!streamId) {
        return apiError(400, 'VALIDATION_ERROR', 'Stream ID is required', request);
    }

    // Validate streamId against personal_assessment_streams before any AI generation or
    // canonical question creation - same pattern as start.ts, questions.ts, and the
    // non-streaming generate-aptitude/generate-knowledge endpoints in [[path]].ts. Never
    // falls back to 'college'; an unresolvable/inactive streamId is rejected outright.
    //
    // The stream's OWN registered grade_level is authoritative for the assessment
    // content tier - the client-supplied gradeLevel is only a UI/enrollment-category
    // selection and is never independently trusted once a real streamId is known.
    const adminSupabase = createSupabaseAdminClient(env);
    const { data: streamRow } = await adminSupabase
        .from('personal_assessment_streams')
        .select('id, grade_level')
        .eq('id', streamId)
        .eq('is_active', true)
        .maybeSingle();

    if (!streamRow) {
        return apiError(400, 'VALIDATION_ERROR', 'Invalid streamId', request);
    }
    const gradeLevel = streamRow.grade_level;
    if (requestedGradeLevel !== gradeLevel) {
        console.log(`ℹ️ gradeLevel reconciled to stream catalog value: requested=${requestedGradeLevel}, effective=${gradeLevel}`);
    }

    const { openRouter: openRouterKey } = getAPIKeys(env);
    if (!openRouterKey) {
        return apiError(500, 'INTERNAL_ERROR', 'OpenRouter API key not configured', request);
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
                        systemPrompt = `You are an expert educational assessment creator for 10th grade learners. Generate EXACTLY ${batchTotal} questions total covering school subjects. Generate ONLY valid JSON.`;
                    } else {
                        // Determine stream context
                        let contextKey = streamId;
                        if (!STREAM_CONTEXTS[contextKey]) {
                            // Check for specific science streams first
                            if (streamId.includes('pcm') && streamId.includes('pcb')) contextKey = 'science_pcmb';
                            else if (streamId.includes('pcms')) contextKey = 'science_pcms';
                            else if (streamId.includes('pcm')) contextKey = 'science_pcm';
                            else if (streamId.includes('pcb')) contextKey = 'science_pcb';
                            else if (streamId.includes('btech') || streamId.includes('engineering')) contextKey = 'engineering';
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

                // Shared canonical question set: identity is (stream_id, grade_level,
                // question_type), not learner_id. get_or_create_shared_questions()
                // returns the existing canonical set if one already exists for this
                // combination, or persists allGeneratedQuestions as the new canonical
                // set if none exists yet — it never overwrites an existing set (see
                // supabase/migrations/20260907044042_get_or_create_shared_questions.sql).
                //
                // attemptId is NOT used here: verified it has no functional role in this
                // file beyond the old "if (learnerId && attemptId)" gate — it was never
                // part of the save payload (the old upsert never wrote attempt_id) and
                // is not part of the new canonical identity either. gradeLevel replaces
                // it as the required gate, consistent with career-knowledge.ts /
                // career-aptitude.ts.
                //
                // IMPORTANT STREAMING-SPECIFIC NOTE: unlike the non-streaming handlers,
                // each question here is already sent to the client individually as it
                // is generated (see the per-question controller.enqueue above), before
                // this save step runs. If this request loses the race for a brand-new
                // combination (another request already created the canonical set), the
                // client has already received THIS request's generated content, not the
                // canonical content now stored in the database. This save step correctly
                // never overwrites the existing canonical set - the RPC guarantees that
                // by design - but the previously-streamed questions and the persisted
                // canonical set can differ in that case. We surface this via the
                // existing 'warning' event so the client is not silently left holding
                // mismatched content.
                if (gradeLevel) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'progress',
                        message: 'Saving questions to database...',
                        count: allGeneratedQuestions.length,
                        total: totalQuestions
                    })}\n\n`));

                    const { data, error } = await supabase.rpc('get_or_create_shared_questions', {
                        p_stream_id: streamId,
                        p_grade_level: gradeLevel,
                        p_question_type: 'aptitude',
                        p_questions: allGeneratedQuestions,
                        p_learner_id: learnerId || null
                    });

                    if (error) {
                        console.error('❌ Database error:', error);
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                            type: 'warning',
                            message: 'Questions generated but not saved to database'
                        })}\n\n`));
                    } else if (data && data.is_new === false) {
                        console.log('♻️ Another request already created the canonical aptitude set for this combination - streamed questions were not persisted');
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                            type: 'warning',
                            message: 'A shared question set for this stream and grade already exists — the questions just streamed were not saved as canonical. Please refresh to load the existing set.'
                        })}\n\n`));
                    } else {
                        console.log('✅ New canonical aptitude set created');
                    }
                } else {
                    console.warn('⚠️ No gradeLevel provided — skipping shared question set save');
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
