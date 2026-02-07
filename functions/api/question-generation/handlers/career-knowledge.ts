
import { createSupabaseAdminClient } from '../../../../src/functions-lib/supabase';
import { PagesEnv } from '../../../../src/functions-lib/types';
import {
    callOpenRouterWithRetry,
    repairAndParseJSON,
    generateUUID,
    getAPIKeys
} from '../../shared/ai-config';

// All utility functions are now imported from centralized ai-config.ts

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
    
    const supabase = createSupabaseAdminClient(env);

    const { openRouter: openRouterKey } = getAPIKeys(env);

    if (!openRouterKey) {
        throw new Error('OpenRouter API key not configured');
    }

    const allQuestions: any[] = [];

    // For college students with 20 questions, use single batch for better consistency
    // For larger counts, split into batches
    const useSingleBatch = isCollegeStudent && questionCount <= 20;
    const batchCount = useSingleBatch ? 1 : 2;

    console.log(`📝 Generating fresh knowledge questions in ${batchCount} batch${batchCount > 1 ? 'es' : ''} for: ${streamName}`);

    for (let batchNum = 1; batchNum <= batchCount; batchNum++) {
        const count = Math.floor(questionCount / batchCount);
        const totalQuestions = batchNum === batchCount ? questionCount - (count * (batchCount - 1)) : count;

        let prompt: string;
        
        if (isCollegeStudent && !topics) {
            // For college students without predefined topics, let AI determine topics dynamically
            prompt = `🎯 CRITICAL REQUIREMENT: You MUST generate EXACTLY ${totalQuestions} questions. Count them before responding.

Generate EXACTLY ${totalQuestions} multiple-choice knowledge questions for a college student studying ${streamName}.

IMPORTANT: Analyze the course name "${streamName}" and generate questions covering the core subjects and topics typically taught in this program.

Requirements:
1. All questions must be MCQ with exactly 4 options
2. Each question must have exactly ONE correct answer
3. ALL 4 OPTIONS MUST BE UNIQUE - no duplicate answers allowed
4. Difficulty distribution: 30% easy, 50% medium, 20% hard
5. Test practical understanding and application, not just memorization
6. Cover fundamental concepts, theories, and real-world applications relevant to ${streamName}
7. Questions should be appropriate for undergraduate/graduate level students

⚠️ VERIFICATION STEP: Before responding, count your questions. You must have EXACTLY ${totalQuestions} questions in your response.

Output Format - Respond with ONLY valid JSON (no markdown, no explanation):
{"questions":[{"id":1,"type":"mcq","difficulty":"easy","question":"Question text","options":["A","B","C","D"],"correct_answer":"A","skill_tag":"topic"}]}

REMINDER: Generate EXACTLY ${totalQuestions} questions. No more, no less.`;
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

        const systemPrompt = isCollegeStudent 
            ? `You are an expert educational assessment creator for college/university students. 

🎯 CRITICAL: You MUST generate EXACTLY ${totalQuestions} knowledge-based questions. This is a strict requirement.

Analyze the course name and generate questions covering core topics of that program. 

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
    
    // STRICT validation: Check for duplicate questions and validate answer options
    const uniqueQuestions: any[] = [];
    const seenTexts = new Set<string>();
    let filteredCount = 0;
    
    for (const q of allQuestions) {
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
        
        // Validate answer options are unique
        const options = q.options || {};
        const optionValues = Object.values(options).map((v: any) => String(v).toLowerCase().trim());
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
        
        seenTexts.add(normalizedText);
        uniqueQuestions.push(q);
    }
    
    console.log(`🔍 After validation: ${uniqueQuestions.length}/${allQuestions.length} valid questions (filtered: ${filteredCount})`);
    
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
