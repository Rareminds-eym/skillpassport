
import { createSupabaseClient } from '../../../../src/functions-lib/supabase';
import { PagesEnv } from '../../../../src/functions-lib/types';
import { SYSTEM_PROMPT } from '../prompts';
import {
    callOpenRouterWithRetry,
    repairAndParseJSON,
    generateUUID,
    getAPIKeys
} from '../../shared/ai-config';

// All utility functions are now imported from centralized ai-config.ts

// Course assessment generation handler
export async function generateAssessment(
    env: PagesEnv,
    courseName: string,
    level: string,
    questionCount: number = 10
) {
    console.log(`📝 Generating course assessment for: ${courseName} (${level})`);

    const { openRouter: openRouterKey } = getAPIKeys(env);

    if (!openRouterKey) {
        throw new Error('OpenRouter API key not configured');
    }

    const prompt = SYSTEM_PROMPT
        .replace(/\{\{COURSE_NAME\}\}/g, courseName)
        .replace(/\{\{LEVEL\}\}/g, level)
        .replace(/\{\{QUESTION_COUNT\}\}/g, questionCount.toString());

    // Use OpenRouter with automatic retry and  fallback
    console.log(`🔑 Using OpenRouter with retry for ${questionCount} questions`);

    const jsonText = await callOpenRouterWithRetry(openRouterKey, [
        { role: 'user', content: prompt }
    ]);

    const data = repairAndParseJSON(jsonText);
    const questions = data.questions || data;

    console.log(`✅ Generated ${questions.length} questions for ${courseName}`);

    const processedQuestions = questions.map((q: any) => ({
        id: generateUUID(),
        ...q,
        course_name: courseName,
        level,
        created_at: new Date().toISOString()
    }));

    return processedQuestions;
}
