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
  token: string,
  onToken?: (content: string) => void,
  onDone?: (data: unknown) => void,
  onError?: (error: Error) => void,
  abortSignal?: AbortSignal
): Promise<void> {
  try {
    // Use interceptor to handle token validation and refresh
    const response = await getInterceptor().fetch(`${API_URL}/chat`, {
      method: 'POST',
            body: JSON.stringify({ conversationId, message, selectedChips }),
      signal: abortSignal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as { error?: string };
      logger.error('Career chat API request failed', new Error(error.error || 'Chat request failed'), {
        status: response.status
      });
      onError?.(new Error(error.error || 'Chat request failed'));
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError?.(new Error('No response stream'));
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue; // Skip empty lines

        if (line.startsWith('event: ')) {
          continue; // Process next line for data
        }

        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));

            // Handle different event types based on data structure
            if (data.content) {
              onToken?.(data.content);
            } else if (data.conversationId || data.messageId || data.intent) {
              onDone?.(data);
            } else if (data.error) {
              onError?.(new Error(data.error));
            }
          } catch (parseError) {
            logger.warn('Failed to parse career chat SSE data', {
              error: parseError instanceof Error ? parseError.message : String(parseError)
            });
          }
        }
      }
    }
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      return;
    }
    onError?.(error as Error);
  }
}

/**
 * Get job recommendations for a learner
 */
export async function getRecommendations(
  learnerId: string,
  { forceRefresh = false, limit = 20 }: RecommendationsParams = {}
): Promise<unknown> {
  const response = await getInterceptor().fetch(`${API_URL}/recommend-opportunities`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ learnerId, forceRefresh, limit }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(error.error || 'Failed to get recommendations');
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
  const response = await getInterceptor().fetch(`${API_URL}/generate-embedding`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ text, table, id, type }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(error.error || 'Failed to generate embedding');
  }

  return response.json();
}

export default {
  sendCareerChatMessage,
  getRecommendations,
  generateEmbedding,
  healthCheck,
};
