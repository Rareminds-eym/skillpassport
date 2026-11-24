/**
 * Career API Service
 * Connects to Cloudflare Pages Function for career-related API calls
 */

import { getApiUrl, getAuthHeaders } from '@/shared/api/apiUtils';
import { getGlobalCareerApiInterceptor } from './careerApiInterceptor';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('career-api-service');

const API_URL = getApiUrl('career');

function getInterceptor() {
  return getGlobalCareerApiInterceptor();
}

interface CareerChatParams {
  conversationId?: string;
  message: string;
  selectedChips?: string[];
}

interface RecommendationsParams {
  forceRefresh?: boolean;
  limit?: number;
}

interface GenerateEmbeddingParams {
  text: string;
  table: string;
  id: string;
  type?: string;
}

/**
 * Send message to Career AI chat (streaming)
 */
export async function sendCareerChatMessage(
  { conversationId, message, selectedChips = [] }: CareerChatParams,
  onToken?: (content: string) => void,
  onDone?: (data: unknown) => void,
  onError?: (error: Error) => void,
  abortSignal?: AbortSignal
): Promise<void> {
  try {
    // Use interceptor to handle token validation and refresh
    const response = await getInterceptor().request(`${API_URL}/chat`, {
      method: 'POST',
      body: JSON.stringify({ conversationId, message, selectedChips }),
      signal: abortSignal,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as any;
      const errorDetail = body?.error;
      const errorCode = typeof errorDetail === 'object' ? errorDetail?.code : null;
      const errorMsg = typeof errorDetail === 'string' ? errorDetail : errorDetail?.message || body?.message || 'Chat request failed';
      const finalError = errorCode ? `${errorCode}: ${errorMsg}` : errorMsg;
      logger.error('Career chat API request failed', new Error(finalError), {
        status: response.status
      });
      onError?.(new Error(finalError));
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError?.(new Error('No response stream'));
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let completed = false;
    const consumeLine = (line: string) => {
      if (completed || !line.startsWith('data: ')) return;
      const data = JSON.parse(line.slice(6));
      if (data.error) throw new Error(typeof data.error === 'string' ? data.error : data.error.type || data.error.message || 'Chat request failed');
      if (typeof data.content === 'string') onToken?.(data.content);
      if (data.done === true) {
        completed = true;
        onDone?.(data);
      }
    };
    try {
      while (!completed) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) consumeLine(line.trimEnd());
      }
      buffer += decoder.decode();
      if (!completed && buffer.trim()) consumeLine(buffer.trimEnd());
      if (!completed) throw new Error('The response was interrupted before it could be saved. Please try again.');
    } finally {
      await reader.cancel().catch(() => undefined);
      reader.releaseLock();
    }
  } catch (error) {
    onError?.(error instanceof Error ? error : new Error('Chat request failed'));
  }
}

/**
 * Get job recommendations for a learner
 */
export async function getRecommendations(
  learnerId: string,
  { forceRefresh = false, limit = 20 }: RecommendationsParams = {}
): Promise<unknown> {
  const response = await getInterceptor().request(`${API_URL}/recommend-opportunities`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ learnerId, forceRefresh, limit }),
  });

    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as any;
      const errorDetail = body?.error;
      const errorMsg = typeof errorDetail === 'string' ? errorDetail : errorDetail?.message || body?.message || 'Failed to get recommendations';
      throw new Error(errorMsg);
    }

  return response.json();
}

/**
 * Health check
 */
export async function healthCheck(): Promise<unknown> {
  const response = await fetch(`${API_URL}/health`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Health check failed');
  }

  return response.json();
}

/**
 * Generate embedding for text and store in database
 */
export async function generateEmbedding({
  text,
  table,
  id,
  type = 'opportunity'
}: GenerateEmbeddingParams): Promise<unknown> {
  const response = await getInterceptor().request(`${API_URL}/generate-embedding`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ text, table, id, type }),
  });

    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as any;
      const errorDetail = body?.error;
      const errorMsg = typeof errorDetail === 'string' ? errorDetail : errorDetail?.message || body?.message || 'Failed to generate embedding';
      throw new Error(errorMsg);
    }

  return response.json();
}

export default {
  sendCareerChatMessage,
  getRecommendations,
  generateEmbedding,
  healthCheck,
};
