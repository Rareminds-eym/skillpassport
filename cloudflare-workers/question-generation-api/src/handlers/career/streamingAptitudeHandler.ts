/**
 * Streaming Aptitude Question Handler
 * Uses Server-Sent Events (SSE) to stream questions as they're generated
 */

import type { Env } from '../../types';
import { repairAndParseJSON } from '../../utils/jsonParser';
import { generateUUID } from '../../utils/uuid';
import { callOpenRouterWithRetry } from '../../services/openRouterService';
import { callClaudeAPI } from '../../services/claudeService';
import { getCategories, getModuleTitles } from '../../config/aptitudeCategories';
import { getStreamContext } from '../../config/streamContexts';
import { buildAptitudePrompt } from '../../prompts/career/aptitude';

interface StreamingRequestBody {
  streamId: string;
  gradeLevel?: string;
}

export async function handleStreamingAptitudeGeneration(
  request: Request,
  env: Env
): Promise<Response> {
  const body = await request.json() as StreamingRequestBody;
  const { streamId, gradeLevel } = body;

  if (!streamId) {
    return new Response(JSON.stringify({ error: 'Stream ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Create a TransformStream for SSE
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Helper to send SSE event
  const sendEvent = async (data: any) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  // Background generation
  const generateInBackground = async () => {
    try {
      const openRouterKey = env.OPENROUTER_API_KEY || env.VITE_OPENROUTER_API_KEY;
      const claudeKey = env.CLAUDE_API_KEY || env.VITE_CLAUDE_API_KEY;
      
      if (!openRouterKey && !claudeKey) {
        await sendEvent({ type: 'error', message: 'No API key configured' });
        await writer.close();
        return;
      }

      const isAfter10 = gradeLevel === 'after10';
      const streamContext = getStreamContext(streamId);
      const categories = getCategories(isAfter10);
      const moduleTitles = getModuleTitles(isAfter10);

      // Split into 3 smaller batches for faster first response
      const batch1Categories = categories.slice(0, 2);  // ~15 questions
      const batch2Categories = categories.slice(2, 4);  // ~15 questions  
      const batch3Categories = categories.slice(4);     // ~20 questions

      let totalQuestions = 0;

      // Batch 1 - Send ASAP
      await sendEvent({ type: 'status', message: 'Generating batch 1...' });
      const batch1 = await generateBatch(batch1Categories, isAfter10, streamContext, claudeKey, openRouterKey);
      const formattedBatch1 = batch1.map((q: any, idx: number) => ({
        ...q,
        id: generateUUID(),
        originalIndex: totalQuestions + idx + 1,
        subtype: q.category,
        moduleTitle: moduleTitles[q.category] || q.category
      }));
      totalQuestions += formattedBatch1.length;
      await sendEvent({ type: 'batch', batchNumber: 1, questions: formattedBatch1, totalSoFar: totalQuestions });

      // Batch 2
      await sendEvent({ type: 'status', message: 'Generating batch 2...' });
      const batch2 = await generateBatch(batch2Categories, isAfter10, streamContext, claudeKey, openRouterKey);
      const formattedBatch2 = batch2.map((q: any, idx: number) => ({
        ...q,
        id: generateUUID(),
        originalIndex: totalQuestions + idx + 1,
        subtype: q.category,
        moduleTitle: moduleTitles[q.category] || q.category
      }));
      totalQuestions += formattedBatch2.length;
      await sendEvent({ type: 'batch', batchNumber: 2, questions: formattedBatch2, totalSoFar: totalQuestions });

      // Batch 3
      await sendEvent({ type: 'status', message: 'Generating batch 3...' });
      const batch3 = await generateBatch(batch3Categories, isAfter10, streamContext, claudeKey, openRouterKey);
      const formattedBatch3 = batch3.map((q: any, idx: number) => ({
        ...q,
        id: generateUUID(),
        originalIndex: totalQuestions + idx + 1,
        subtype: q.category,
        moduleTitle: moduleTitles[q.category] || q.category
      }));
      totalQuestions += formattedBatch3.length;
      await sendEvent({ type: 'batch', batchNumber: 3, questions: formattedBatch3, totalSoFar: totalQuestions });

      // Complete
      await sendEvent({ type: 'complete', totalQuestions });

    } catch (error: any) {
      console.error('Streaming error:', error);
      await sendEvent({ type: 'error', message: error.message || 'Generation failed' });
    } finally {
      await writer.close();
    }
  };

  // Start generation without awaiting
  generateInBackground();

  // Return streaming response immediately
  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

async function generateBatch(
  batchCategories: any[],
  isAfter10: boolean,
  streamContext: any,
  claudeKey?: string,
  openRouterKey?: string
): Promise<any[]> {
  if (batchCategories.length === 0) return [];

  const categoriesText = batchCategories.map(c => `- ${c.name} (${c.count} questions): ${c.description}`).join('\n');
  const totalQuestions = batchCategories.reduce((sum, c) => sum + c.count, 0);
  
  const prompt = buildAptitudePrompt(categoriesText, streamContext);
  const systemPrompt = `You are an expert psychometric assessment creator. Generate EXACTLY ${totalQuestions} questions total. Generate ONLY valid JSON.`;

  let jsonText: string;

  if (claudeKey) {
    try {
      jsonText = await callClaudeAPI(claudeKey, {
        systemPrompt,
        userPrompt: prompt,
        maxTokens: 4000,
        temperature: 0.7
      });
    } catch (claudeError: any) {
      console.error('Claude error:', claudeError.message);
      if (openRouterKey) {
        jsonText = await callOpenRouterWithRetry(openRouterKey, [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ]);
      } else {
        throw claudeError;
      }
    }
  } else if (openRouterKey) {
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
