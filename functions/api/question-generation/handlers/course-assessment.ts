
import { createSupabaseClient } from '../../../../src/functions-lib/supabase';
import { PagesEnv } from '../../../../src/functions-lib/types';
import { SYSTEM_PROMPT } from '../prompts';

// Helper function to delay execution
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Generate a UUID v4
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Helper function to repair and parse JSON from AI responses
function repairAndParseJSON(text: string): any {
    // Clean markdown
    let cleaned = text
        .replace(/```json\n?/gi, '')
        .replace(/```\n?/g, '')
        .trim();

    // Find JSON boundaries
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');
    if (startIdx === -1 || endIdx === -1) {
        throw new Error('No JSON object found in response');
    }
    cleaned = cleaned.substring(startIdx, endIdx + 1);

    try {
        return JSON.parse(cleaned);
    } catch (e) {
        console.log('⚠️ JSON parse failed, trying aggressive repair...');
        // Simple repair for common trailing commas
        cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');
        return JSON.parse(cleaned);
    }
}

// List of models to try in order (using reliable free models)
const FREE_MODELS = [
    'google/gemini-2.0-flash-001',
    'meta-llama/llama-3-8b-instruct:free',
    'google/gemini-pro',
];

// Helper function to call OpenRouter with retry and model fallback
async function callOpenRouterWithRetry(
    openRouterKey: string,
    messages: Array<{ role: string, content: string }>,
    maxRetries: number = 3
): Promise<string> {
    let lastError: Error | null = null;

    for (const model of FREE_MODELS) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                console.log(`🔄 Trying ${model} (attempt ${attempt + 1}/${maxRetries})`);

                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${openRouterKey}`,
                        'HTTP-Referer': 'https://skillpassport.pages.dev',
                        'X-Title': 'SkillPassport Assessment'
                    },
                    body: JSON.stringify({
                        model: model,
                        max_tokens: 3000,
                        temperature: 0.7,
                        messages: messages
                    })
                });

                if (response.status === 429) {
                    const waitTime = Math.pow(2, attempt) * 2000;
                    await delay(waitTime);
                    continue;
                }

                if (!response.ok) {
                    throw new Error(`${model} failed: ${await response.text()}`);
                }

                const data = await response.json() as any;
                const content = data.choices?.[0]?.message?.content;
                if (content) return content;

                throw new Error('Empty response');
            } catch (e: any) {
                console.error(`❌ ${model} error:`, e.message);
                lastError = e;
                if (attempt < maxRetries - 1) await delay(1000);
            }
        }
    }

    throw lastError || new Error('All models failed');
}

// Course assessment generation handler
export async function generateAssessment(
    env: PagesEnv,
    courseName: string,
    level: string,
    questionCount: number = 10
) {
    console.log(`📝 Generating course assessment for: ${courseName} (${level})`);

    const openRouterKey = env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY;
    const claudeKey = env.CLAUDE_API_KEY || env.VITE_CLAUDE_API_KEY;

    if (!openRouterKey && !claudeKey) {
        throw new Error('No API key configured');
    }

    const prompt = SYSTEM_PROMPT
        .replace(/\{\{COURSE_NAME\}\}/g, courseName)
        .replace(/\{\{LEVEL\}\}/g, level)
        .replace(/\{\{QUESTION_COUNT\}\}/g, questionCount.toString());

    let jsonText: string;

    if (claudeKey) {
        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': claudeKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 3000,
                    messages: [{ role: 'user', content: prompt }]
                })
            });

            if (!response.ok) throw new Error('Claude API failed');
            const data = await response.json() as any;
            jsonText = data.content[0].text;
        } catch (e) {
            if (!openRouterKey) throw e;
            jsonText = await callOpenRouterWithRetry(openRouterKey, [{ role: 'user', content: prompt }]);
        }
    } else {
        jsonText = await callOpenRouterWithRetry(openRouterKey!, [{ role: 'user', content: prompt }]);
    }

    const result = repairAndParseJSON(jsonText);
    const questions = (result.questions || []).map((q: any, idx: number) => ({
        ...q,
        id: generateUUID(),
        originalIndex: idx + 1
    }));

    return { questions, generated: true };
}
