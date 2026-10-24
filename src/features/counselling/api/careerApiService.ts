/**
 * Career API Service
 * Connects to Cloudflare Pages Function for career-related API calls
 */

import { getApiUrl, getAuthHeaders } from '@/shared/api/apiUtils';
import { getGlobalCareerApiInterceptor } from './careerApiInterceptor';
import { getLogger } from '@/shared/config/logging';
import { readCareerStream } from './careerStream';

const logger = getLogger('career-api-service');

const API_URL = getApiUrl('career');

function getInterceptor() {
  return getGlobalCareerApiInterceptor();
}

interface CareerChatParams {
  conversationId?: string;
  message: string;
  selectedChips?: string[];
  /**
   * Stable client turn UUID (30-credit plan). Created once per send and
   * reused across transport retries so the backend dedupes instead of
   * rebilling. Omitted only by legacy callers (server mints single-use).
   */
  turnId?: string;
}

export interface CareerCreditBalance {
  granted_credits: string;
  spent_credits: string;
  remaining_credits: string;
  revision: number;
  active_operation_id?: string | null;
  has_pending_cost?: boolean;
  synced_at?: string;
  fresh?: boolean;
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
  { conversationId, message, selectedChips = [], turnId }: CareerChatParams,
  onToken?: (content: string) => void,
  onDone?: (data: unknown) => void,
  onError?: (error: Error) => void,
  abortSignal?: AbortSignal
): Promise<void> {
  try {
    // Use interceptor to handle token validation and refresh
    const response = await getInterceptor().request(`${API_URL}/chat`, {
      method: 'POST',
      body: JSON.stringify({ conversationId, message, selectedChips, turnId }),
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

    const receipt = await readCareerStream(response, onToken);
    onDone?.(receipt);
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      onError?.(new Error('TURN_STATE_UNKNOWN: Connection stopped; retry the same message to recover it.'));
      return;
    }
    onError?.(error as Error);
  }
}

/**
 * Career AI credit balance (30-credit plan). Display-only; the SSO wallet
 * stays canonical. `refresh` pulls the authoritative balance and updates
 * the server cache; otherwise the last-known snapshot is returned.
 */
export async function getCareerCredits(refresh = false): Promise<CareerCreditBalance> {
  const response = await getInterceptor().request(`${API_URL}/credits${refresh ? '?refresh=1' : ''}`, {
    method: 'GET',
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      error?: { code?: string; message?: string } | string;
      message?: string;
    };
    const errorDetail = body?.error;
    const errorCode = typeof errorDetail === 'object' ? errorDetail?.code : null;
    const errorMsg = typeof errorDetail === 'string' ? errorDetail : errorDetail?.message || body?.message || 'Failed to load credit balance';
    throw new Error(errorCode ? `${errorCode}: ${errorMsg}` : errorMsg);
  }

  const body = (await response.json()) as { data?: CareerCreditBalance };
  return (body?.data ?? body) as CareerCreditBalance;
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
  getCareerCredits,
  getRecommendations,
  generateEmbedding,
  healthCheck,
};
