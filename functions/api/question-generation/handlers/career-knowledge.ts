
import { createSupabaseClient } from '../../../../src/functions-lib/supabase';
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
    topics: string[] | string,
    questionCount: number = 50,
    studentId?: string,
    attemptId?: string,
    gradeLevel?: string
) {
    const supabase = createSupabaseClient(env);

    console.log(`📝 Generating fresh knowledge questions in 2 batches for: ${streamName} (topics: ${Array.isArray(topics) ? topics.join(', ') : topics})`);


    const { openRouter: openRouterKey } = getAPIKeys(env);

    if (!openRouterKey) {
        throw new Error('OpenRouter API key not configured');
    }

    const allQuestions: any[] = [];

    // Split into 2 batches for stability
    for (let batchNum = 1; batchNum <= 2; batchNum++) {
        const count = Math.floor(questionCount / 2);
        const totalQuestions = batchNum === 2 ? questionCount - count : count;

        const prompt = `Generate EXACTLY ${totalQuestions} multiple-choice questions about ${streamName}.

Requirements:
1. All questions must be MCQ with exactly 4 options
2. Each question must have exactly ONE correct answer
3. Difficulty distribution: 30% easy, 50% medium, 20% hard
4. Test practical understanding, not memorization

Output Format - Respond with ONLY valid JSON (no markdown, no explanation):
{"questions":[{"id":1,"type":"mcq","difficulty":"easy","question":"Question text","options":["A","B","C","D"],"correct_answer":"A","skill_tag":"topic"}]}`;

        const systemPrompt = `You are an expert educational assessment creator. Generate EXACTLY ${totalQuestions} knowledge-based questions about ${streamName}. Generate ONLY valid JSON with no markdown.`;

        // Use OpenRouter with automatic retry and fallback
        console.log(`🔑 Batch ${batchNum}: Using OpenRouter with retry for ${totalQuestions} ${streamName} questions`);

        const jsonText = await callOpenRouterWithRetry(openRouterKey, [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ]);

        const parsed = repairAndParseJSON(jsonText);
        const batchQuestions = parsed.questions || parsed;

        if (!Array.isArray(batchQuestions)) {
            throw new Error(`Expected array of questions, got: ${typeof batchQuestions}`);
        }

        allQuestions.push(...batchQuestions);
        console.log(`✅ Batch ${batchNum}/${2} complete: ${batchQuestions.length} questions`);
    }

    console.log(`✅ Generated ${allQuestions.length} total knowledge questions via AI`);

    const processedQuestions = allQuestions.map((q: any) => ({
        id: generateUUID(),
        ...q,
        stream_id: streamId,
        stream_name: streamName,
        created_at: new Date().toISOString()
    }));

    if (studentId && attemptId) {
        const { error } = await supabase
            .from('knowledge_questions')
            .insert(processedQuestions);

        if (error) throw error;
    }

    console.log(`📦 Returning ${processedQuestions.length} questions`);
    return processedQuestions;
}
