// AI Counselling Service - server-side generation via authenticated Pages endpoint

import type {
  CounsellingRequest,
  CounsellingTopicType,
  MessageRole
} from '../model/types';
import { getLogger } from '@/shared/config/logging';
import { ssoClient } from '@/shared/api/ssoClient';

const logger = getLogger('counselling-service');

// Server-side LLM ops (Cloudflare Workers AI via authenticated Pages endpoint).
// Topic detection stays local (no provider involved) — unchanged.
async function getCounsellingEndpoint(): Promise<string> {
  const { getApiUrl } = await import('@/shared/api/apiUtils');
  return getApiUrl('counselling/chat');
}

async function postCounsellingOp<T>(op: string, payload: Record<string, unknown>): Promise<T> {
  const url = await getCounsellingEndpoint();
  const response = await ssoClient.fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ op, ...payload }),
  });
  if (!response.ok) {
    throw new Error(`Counselling request failed (${response.status})`);
  }
  const json = (await response.json()) as { success: boolean; data: T };
  if (!json.success) {
    throw new Error('Counselling request failed');
  }
  return json.data;
}

// System prompts are server-owned now (functions/api/counselling/lib/).
// detectTopic below stays local (no provider involved) — unchanged.

// Detect topic from user query
export function detectTopic(query: string): CounsellingTopicType {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.match(/course|class|study|exam|grade|academic|assignment|homework/)) {
    return 'academic';
  }
  if (lowerQuery.match(/career|job|internship|resume|interview|industry|profession/)) {
    return 'career';
  }
  if (lowerQuery.match(/performance|progress|improvement|score|result/)) {
    return 'performance';
  }
  if (lowerQuery.match(/stress|anxiety|mental|health|wellbeing|balance|pressure/)) {
    return 'mental-health';
  }
  
  return 'general';
}

// Stream chat completion via the server endpoint (SSE translated to chunks)
export async function* streamResponse(
  request: CounsellingRequest,
  conversationHistory: { role: MessageRole; content: string }[]
) {
  try {
    const url = await getCounsellingEndpoint();
    const response = await ssoClient.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        op: 'chat-stream',
        topic: request.topic,
        message: request.message,
        learner_context: request.learner_context,
        history: conversationHistory,
      }),
    });
    if (!response.ok || !response.body) {
      throw new Error(`Counselling stream failed (${response.status})`);
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let idx: number;
      while ((idx = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') continue;
        let event: { text?: string; error?: string };
        try {
          event = JSON.parse(payload) as { text?: string; error?: string };
        } catch {
          continue;
        }
        if (event.error) throw new Error(event.error);
        if (event.text) yield event.text;
      }
    }
    reader.releaseLock();
  } catch (error) {
    logger.error('Streaming counselling response failed', error instanceof Error ? error : new Error(String(error)), {
      topic: request.topic
    });
    throw error instanceof Error ? error : new Error('Counselling stream failed');
  }
}

// Non-streaming version for compatibility
export async function getResponse(
  request: CounsellingRequest,
  conversationHistory: { role: MessageRole; content: string }[]
): Promise<string> {
  try {
    const data = await postCounsellingOp<{ message: string }>('chat', {
      topic: request.topic,
      message: request.message,
      learner_context: request.learner_context,
      history: conversationHistory,
    });
    return data.message || '';
  } catch (error) {
    logger.error('Counselling response generation failed', error instanceof Error ? error : new Error(String(error)), {
      topic: request.topic
    });
    throw error instanceof Error ? error : new Error('Counselling request failed');
  }
}

// Generate session summary
export async function generateSessionSummary(
  messages: { role: MessageRole; content: string }[],
  topic: CounsellingTopicType
): Promise<string> {
  try {
    const data = await postCounsellingOp<{ summary: string }>('summarize', { topic, messages });
    return data.summary || 'No summary available';
  } catch (error) {
    logger.error('Session summary generation failed', error instanceof Error ? error : new Error(String(error)), {
      topic
    });
    return 'Failed to generate summary';
  }
}

export const counsellingService = {
  detectTopic,
  streamResponse,
  getResponse,
  generateSessionSummary
};
