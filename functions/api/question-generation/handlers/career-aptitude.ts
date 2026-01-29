
import { createSupabaseClient } from '../../../../src/functions-lib/supabase';
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

// Aptitude question generation handler
export async function generateAptitudeQuestions(
    env: PagesEnv,
    streamId: string,
    questionsPerCategory: number = 5,
    studentId?: string,
    attemptId?: string,
    gradeLevel?: string
) {
    const supabase = createSupabaseClient(env);
    const isAfter10 = gradeLevel === 'after10';

    console.log(`📚 Grade level detection: streamId=${streamId}, gradeLevel=${gradeLevel}, isAfter10=${isAfter10}`);

    const categories = isAfter10 ? SCHOOL_SUBJECT_CATEGORIES : APTITUDE_CATEGORIES;
    const totalQuestions = categories.reduce((sum, cat) => sum + cat.count, 0);

    console.log(`📝 Generating fresh aptitude questions in 2 batches for stream: ${streamId}`);

    const { openRouter: openRouterKey } = getAPIKeys(env);

    if (!openRouterKey) {
        throw new Error('OpenRouter API key not configured');
    }

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

        let prompt: string;
        if (isAfter10) {
            prompt = SCHOOL_SUBJECT_PROMPT
                .replace(/{{QUESTION_COUNT}}/g, batchTotal.toString())
                .replace(/{{CATEGORIES}}/g, JSON.stringify(batchCategories, null, 2));
        } else {
            const streamContext = STREAM_CONTEXTS[streamId] || STREAM_CONTEXTS.general;
            prompt = APTITUDE_PROMPT
                .replace(/{{QUESTION_COUNT}}/g, batchTotal.toString())
                .replace(/{{CATEGORIES}}/g, JSON.stringify(batchCategories, null, 2))
                .replace(/{{STREAM_CONTEXT}}/g, streamContext.context)
                .replace(/{{CLERICAL_EXAMPLE}}/g, streamContext.clericalExample);
        }

        const systemPrompt = isAfter10
            ? `You are an expert educational assessment creator for 10th grade students. Generate EXACTLY ${batchTotal} questions total covering school subjects. Generate ONLY valid JSON.`
            : `You are an expert psychometric assessment creator. Generate EXACTLY ${batchTotal} questions total. Generate ONLY valid JSON.`;

        // Use OpenRouter with automatic retry and fallback
        console.log(`🔑 Batch ${batchNum}: Using OpenRouter with retry for ${batchTotal} questions`);

        const jsonText = await callOpenRouterWithRetry(openRouterKey, [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ]);

        const parsed = repairAndParseJSON(jsonText);
        const batchQuestions = parsed.questions || parsed;

        if (!Array.isArray(batchQuestions)) {
            throw new Error(`Expected array of questions, got: ${typeof batchQuestions}`);
        }

        allGeneratedQuestions.push(...batchQuestions);
        console.log(`✅ Batch ${batchNum}/${2} complete: ${batchQuestions.length} questions generated`);
    }

    console.log(`✅ Generated ${allGeneratedQuestions.length} total questions via AI`);

    const processedQuestions = allGeneratedQuestions.map((q: any) => ({
        id: generateUUID(),
        ...q,
        stream_id: streamId,
        grade_level: gradeLevel || 'general',
        created_at: new Date().toISOString()
    }));

    if (studentId && attemptId) {
        const { error } = await supabase
            .from('aptitude_questions')
            .insert(processedQuestions);

        if (error) throw error;
    }

    console.log(`📦 Returning ${processedQuestions.length} questions`);
    return processedQuestions;
}
