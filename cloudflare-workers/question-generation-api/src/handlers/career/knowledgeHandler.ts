/**
 * Career Assessment - Knowledge Question Handler
 * Generates 20 stream-specific knowledge questions
 */

import type { Env } from '../../types';
import { jsonResponse, errorResponse } from '../../utils/response';
import { repairAndParseJSON } from '../../utils/jsonParser';
import { generateUUID } from '../../utils/uuid';
import { delay } from '../../utils/delay';
import { callOpenRouterWithRetry } from '../../services/openRouterService';
import { callClaudeAPI } from '../../services/claudeService';
import { getCareerCachedQuestions, saveCareerQuestions } from '../../services/cacheService';
import { buildKnowledgePrompt } from '../../prompts/career/knowledge';

interface KnowledgeRequestBody {
  streamId: string;
  streamName: string;
  topics: string[];
  questionCount?: number;
  studentId?: string;
  attemptId?: string;
  gradeLevel?: string; // Add gradeLevel
}

export async function handleKnowledgeGeneration(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const body = await request.json() as KnowledgeRequestBody;
    console.log('📥 Knowledge request body:', JSON.stringify(body));
    
    const { streamId, streamName, topics, questionCount = 20, studentId, attemptId, gradeLevel } = body;

    if (!streamId || !streamName || !topics) {
      console.error('❌ Missing required fields:', { streamId, streamName, topics: !!topics });
      return errorResponse('Stream ID, name, and topics are required', 400);
    }

    // Check cache first
    if (studentId) {
      const cached = await getCareerCachedQuestions(env, studentId, streamId, 'knowledge');
      if (cached) {
        return jsonResponse({ questions: cached, cached: true });
      }
    }

    console.log('🎯 Generating knowledge questions for:', streamName, 'topics:', topics.length);

    const openRouterKey = env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY;
    const claudeKey = env.CLAUDE_API_KEY || env.VITE_CLAUDE_API_KEY;
    
    if (!openRouterKey && !claudeKey) {
      return errorResponse('No API key configured (OpenRouter or Claude)', 500);
    }

    // Split topics into two groups for variety
    const halfTopics = Math.ceil(topics.length / 2);
    const topics1 = topics.slice(0, halfTopics);
    const topics2 = topics.slice(halfTopics);

    // Generate two batches of 10 questions each
    console.log('📦 Generating knowledge batch 1 (10 questions)...');
    const batch1 = await generateKnowledgeBatch(1, 10, topics1.length > 0 ? topics1 : topics, streamName, claudeKey, openRouterKey);
    console.log(`✅ Knowledge batch 1 complete: ${batch1.length} questions`);

    console.log('⏳ Waiting 3s before batch 2...');
    await delay(3000);

    console.log('📦 Generating knowledge batch 2 (10 questions)...');
    const batch2 = await generateKnowledgeBatch(2, 10, topics2.length > 0 ? topics2 : topics, streamName, claudeKey, openRouterKey);
    console.log(`✅ Knowledge batch 2 complete: ${batch2.length} questions`);

    // Combine batches and assign UUIDs
    const allQuestions = [...batch1, ...batch2].map((q: any, idx: number) => ({
      ...q,
      id: generateUUID(),
      originalIndex: idx + 1
    }));

    console.log(`✅ Total knowledge questions generated: ${allQuestions.length}`);

    // Save to cache
    if (studentId) {
      await saveCareerQuestions(env, studentId, streamId, 'knowledge', allQuestions, attemptId, gradeLevel);
    }

    return jsonResponse({ questions: allQuestions, generated: true });
  } catch (error: any) {
    console.error('❌ Knowledge generation error:', error.message, error.stack);
    return errorResponse(error.message || 'Failed to generate knowledge questions', 500);
  }
}

async function generateKnowledgeBatch(
  batchNum: number,
  count: number,
  topicSubset: string[],
  streamName: string,
  claudeKey?: string,
  openRouterKey?: string
): Promise<any[]> {
  const prompt = buildKnowledgePrompt(streamName, topicSubset, count);
  const systemPrompt = `Generate ONLY valid JSON with ${count} questions. No markdown.`;

  let jsonText: string;

  if (claudeKey) {
    console.log(`🔑 Knowledge Batch ${batchNum}: Using Claude API`);
    try {
      jsonText = await callClaudeAPI(claudeKey, {
        systemPrompt,
        userPrompt: prompt,
        maxTokens: 3000,
        temperature: 0.7 + (batchNum * 0.05)
      });
    } catch (claudeError: any) {
      console.error('Claude error:', claudeError.message);
      if (openRouterKey) {
        console.log(`🔑 Knowledge Batch ${batchNum}: Claude failed, trying OpenRouter`);
        jsonText = await callOpenRouterWithRetry(openRouterKey, [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]);
      } else {
        throw claudeError;
      }
    }
  } else if (openRouterKey) {
    console.log(`🔑 Knowledge Batch ${batchNum}: Using OpenRouter`);
    jsonText = await callOpenRouterWithRetry(openRouterKey, [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ]);
  } else {
    throw new Error('No API key configured');
  }

  const result = repairAndParseJSON(jsonText);
  return result.questions || [];
}
