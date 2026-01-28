
import { createSupabaseClient } from '../../../../src/functions-lib/supabase';
import { PagesEnv } from '../../../../src/functions-lib/types';

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

    // Try parsing as-is first
    try {
        return JSON.parse(cleaned);
    } catch (e) {
        console.log('⚠️ Initial JSON parse failed, attempting repair...');
    }

    // Repair common issues
    cleaned = cleaned
        .replace(/,\s*]/g, ']')           // Remove trailing commas in arrays
        .replace(/,\s*}/g, '}')           // Remove trailing commas in objects
        .replace(/[\x00-\x1F\x7F]/g, ' ') // Remove control characters
        .replace(/\n/g, ' ')              // Remove newlines
        .replace(/\r/g, '')               // Remove carriage returns
        .replace(/\t/g, ' ')              // Replace tabs with spaces
        .replace(/"\s*\n\s*"/g, '", "')   // Fix broken string arrays
        .replace(/}\s*{/g, '},{')         // Fix missing commas between objects
        .replace(/]\s*\[/g, '],[')        // Fix missing commas between arrays
        .replace(/"\s+"/g, '","');        // Fix missing commas between strings

    try {
        return JSON.parse(cleaned);
    } catch (e) {
        console.log('⚠️ Repair attempt 1 failed, trying more aggressive repair...');
    }

    // More aggressive: try to extract just the questions array
    const questionsMatch = cleaned.match(/"questions"\s*:\s*\[([\s\S]*)\]/);
    if (questionsMatch) {
        try {
            const questionsStr = questionsMatch[1];
            const questions: any[] = [];

            const parts = questionsStr.split(/}\s*,\s*{/);
            for (let i = 0; i < parts.length; i++) {
                let part = parts[i].trim();
                if (!part.startsWith('{')) part = '{' + part;
                if (!part.endsWith('}')) part = part + '}';

                try {
                    const q = JSON.parse(part);
                    questions.push(q);
                } catch (qe) {
                    console.log(`⚠️ Skipping malformed question ${i + 1}`);
                }
            }

            if (questions.length > 0) {
                console.log(`✅ Recovered ${questions.length} questions from malformed JSON`);
                return { questions };
            }
        } catch (e) {
            console.log('⚠️ Questions extraction failed');
        }
    }

    throw new Error('Failed to parse JSON after all repair attempts');
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
                        max_tokens: 2500,
                        temperature: 0.7,
                        messages: messages
                    })
                });

                if (response.status === 429) {
                    const waitTime = Math.pow(2, attempt) * 2000;
                    console.log(`⏳ Rate limited, waiting ${waitTime}ms before retry...`);
                    await delay(waitTime);
                    continue;
                }

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`❌ ${model} failed (${response.status}):`, errorText.substring(0, 200));
                    lastError = new Error(`${model} failed: ${response.status}`);
                    break;
                }

                const data = await response.json() as any;
                const content = data.choices?.[0]?.message?.content;
                if (content) {
                    console.log(`✅ ${model} succeeded`);
                    return content;
                }

                lastError = new Error('Empty response from API');
                break;
            } catch (e: any) {
                console.error(`❌ ${model} error:`, e.message);
                lastError = e;
                if (attempt < maxRetries - 1) {
                    await delay(1000);
                }
            }
        }
    }

    throw lastError || new Error('All models failed');
}

// Knowledge question generation handler
export async function generateKnowledgeQuestions(
    env: PagesEnv,
    streamId: string,
    streamName: string,
    topics: string[],
    questionCount: number = 20,
    studentId?: string,
    attemptId?: string,
    gradeLevel?: string
) {
    const supabase = createSupabaseClient(env);

    if (studentId) {
        try {
            const { data: existing, error } = await supabase
                .from('career_assessment_ai_questions')
                .select('*')
                .eq('student_id', studentId)
                .eq('stream_id', streamId)
                .eq('question_type', 'knowledge')
                .eq('is_active', true)
                .maybeSingle();

            if (!error && existing?.questions?.length >= 20) {
                console.log('✅ Returning saved knowledge questions for student:', studentId);
                return { questions: existing.questions, cached: true };
            }
        } catch (e: any) {
            console.warn('⚠️ Error checking existing questions:', e.message);
        }
    }

    console.log('📝 Generating fresh knowledge questions in 2 batches for:', streamName);

    const openRouterKey = env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY;
    const claudeKey = env.CLAUDE_API_KEY || env.VITE_CLAUDE_API_KEY;

    if (!openRouterKey && !claudeKey) {
        throw new Error('No API key configured (OpenRouter or Claude)');
    }

    async function generateBatch(batchNum: number, count: number, topicSubset: string[]): Promise<any[]> {
        const topicsText = topicSubset.map(t => `- ${t}`).join('\n');
        const prompt = `You are an expert assessment creator for ${streamName} education.

Generate exactly ${count} knowledge assessment questions covering these topics:
${topicsText}

Question Requirements:
1. All questions must be MCQ with exactly 4 options
2. Each question must have exactly ONE correct answer
3. Difficulty distribution: 30% easy, 50% medium, 20% hard
4. Test practical understanding, not memorization

Output Format - Respond with ONLY valid JSON (no markdown, no explanation):
{"questions":[{"id":1,"type":"mcq","difficulty":"easy","question":"Question text","options":["A","B","C","D"],"correct_answer":"A","skill_tag":"topic"}]}`;

        let jsonText: string;

        if (claudeKey) {
            console.log(`🔑 Knowledge Batch ${batchNum}: Using Claude API`);
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
                        temperature: 0.7 + (batchNum * 0.05),
                        system: `You are an expert assessment creator. Generate ONLY valid JSON with ${count} questions. No markdown.`,
                        messages: [{ role: 'user', content: prompt }]
                    })
                });

                if (!response.ok) {
                    throw new Error(`Claude API failed: ${response.status}`);
                }

                const data = await response.json() as any;
                jsonText = data.content[0].text;
            } catch (claudeError: any) {
                console.error('Claude error:', claudeError.message);
                if (openRouterKey) {
                    console.log(`🔑 Knowledge Batch ${batchNum}: Claude failed, trying OpenRouter with retry`);
                    jsonText = await callOpenRouterWithRetry(openRouterKey, [
                        { role: 'system', content: `Generate ONLY valid JSON with ${count} questions. No markdown.` },
                        { role: 'user', content: prompt }
                    ]);
                } else {
                    throw claudeError;
                }
            }
        } else if (openRouterKey) {
            console.log(`🔑 Knowledge Batch ${batchNum}: Using OpenRouter with retry`);
            jsonText = await callOpenRouterWithRetry(openRouterKey, [
                { role: 'system', content: `Generate ONLY valid JSON with ${count} questions. No markdown.` },
                { role: 'user', content: prompt }
            ]);
        } else {
            throw new Error('No API key configured');
        }

        const result = repairAndParseJSON(jsonText);
        return result.questions || [];
    }

    const halfTopics = Math.ceil(topics.length / 2);
    const topics1 = topics.slice(0, halfTopics);
    const topics2 = topics.slice(halfTopics);

    console.log('📦 Generating knowledge batch 1 (10 questions)...');
    const batch1 = await generateBatch(1, 10, topics1.length > 0 ? topics1 : topics);
    console.log(`✅ Knowledge batch 1 complete: ${batch1.length} questions`);

    console.log('⏳ Waiting 3s before batch 2...');
    await delay(3000);

    console.log('📦 Generating knowledge batch 2 (10 questions)...');
    const batch2 = await generateBatch(2, 10, topics2.length > 0 ? topics2 : topics);
    console.log(`✅ Knowledge batch 2 complete: ${batch2.length} questions`);

    const allQuestions = [...batch1, ...batch2].map((q: any, idx: number) => ({
        ...q,
        id: generateUUID(),
        originalIndex: idx + 1
    }));

    console.log(`✅ Total knowledge questions generated: ${allQuestions.length}`);

    if (studentId) {
        try {
            await supabase.from('career_assessment_ai_questions').upsert({
                student_id: studentId,
                stream_id: streamId,
                question_type: 'knowledge',
                attempt_id: attemptId || null,
                questions: allQuestions,
                generated_at: new Date().toISOString(),
                grade_level: gradeLevel || 'Grade 10',
                is_active: true
            }, { onConflict: 'student_id,stream_id,question_type' });
            console.log('✅ Knowledge questions saved for student:', studentId);
        } catch (e: any) {
            console.warn('⚠️ Could not save questions:', e.message);
        }
    }

    return { questions: allQuestions, generated: true };
}
