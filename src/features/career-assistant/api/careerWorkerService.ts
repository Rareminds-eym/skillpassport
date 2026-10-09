/**
 * Career AI Worker Service
 * Calls the Cloudflare Worker for career AI processing
 */

import { careerApiService } from '@/features/counselling';
import { useAuthStore } from '@/shared/model/authStore';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('career-worker-service');

export interface CareerChatResult {
  success: boolean;
  conversationId?: string;
  messageId?: string;
  intent?: string;
  intentConfidence?: 'high' | 'medium' | 'low';
  phase?: 'opening' | 'exploring' | 'deep_dive';
  error?: string;
  /** Typed backend failure code (credit denials, turn conflicts). */
  errorCode?: string | null;
  /** True when the answer replayed a saved turn (no new billing). */
  replayed?: boolean;
  interactive?: any;
}

/** Backend failure codes the UI distinguishes (30-credit plan). */
export const CREDIT_ERROR_CODES = [
  'AI_CREDITS_EXHAUSTED',
  'AI_REQUEST_IN_PROGRESS',
  'AI_CREDITS_PENDING',
  'IDEMPOTENCY_CONFLICT',
  'TURN_STATE_UNKNOWN',
  'TURN_PAYLOAD_CONFLICT',
] as const;

/** Extract a `CODE` prefix (`CODE: message`) or typed error payload. */
export function parseCreditErrorCode(error: unknown): string | null {
  if (typeof error === 'string') {
    const code = error.split(':')[0]?.trim();
    return code && (CREDIT_ERROR_CODES as readonly string[]).includes(code) ? code : null;
  }
  if (error instanceof Error) return parseCreditErrorCode(error.message);
  if (error && typeof error === 'object') {
    const type = (error as { type?: unknown }).type;
    if (typeof type === 'string' && (CREDIT_ERROR_CODES as readonly string[]).includes(type)) return type;
  }
  return null;
}

/**
 * Stream chat response from Career AI Cloudflare Worker
 * @param message - User's message
 * @param conversationId - Optional existing conversation ID
 * @param selectedChips - Optional selected quick action chips
 * @param onChunk - Callback for each streamed chunk
 * @param abortSignal - Optional AbortSignal to cancel the request
 * @param turnId - Stable client turn UUID (created once per send, reused on retry)
 * @returns Promise with conversation metadata
 */
export async function streamCareerChat(
  message: string,
  conversationId: string | null,
  selectedChips: string[] = [],
  onChunk: (chunk: string) => void,
  abortSignal?: AbortSignal,
  turnId?: string,
): Promise<CareerChatResult> {
  try {
    const user = useAuthStore.getState().user;

    if (!user) {
      logger.error('Authentication failed for career AI service');
      return { success: false, error: 'Please log in to use Career AI' };
    }

    let result: CareerChatResult = { success: true };

    await new Promise<void>((resolve) => {
      careerApiService.sendCareerChatMessage(
        { conversationId: conversationId || undefined, message, selectedChips, turnId },
        (content) => onChunk(content),
        (data) => {
          const response = data as any;
          if (response.conversationId) result.conversationId = response.conversationId;
          if (response.messageId) result.messageId = response.messageId;
          if (response.intent) result.intent = response.intent;
          if (response.intentConfidence) result.intentConfidence = response.intentConfidence;
          if (response.phase) result.phase = response.phase;
          if (response.replayed) result.replayed = true;
          if (response.error) {
            result.success = false;
            result.error = typeof response.error === 'string' ? response.error : response.error.message;
            result.errorCode = parseCreditErrorCode(response.error);
          }
          resolve();
        },
        (error) => {
          logger.error('Career AI service request failed', error as Error);
          result.success = false;
          result.error = error.message;
          result.errorCode = parseCreditErrorCode(error);
          resolve();
        },
        abortSignal
      );
    });

    return result;

  } catch (error: any) {
    logger.error('Career AI stream processing failed', error as Error);
    return {
      success: false,
      error: error.message || 'Failed to connect to Career AI service'
    };
  }
}

/**
 * Career AI credit balance (30-credit plan). Display-only snapshot.
 */
export async function fetchCareerCredits(refresh = false): Promise<{
  granted: string;
  spent: string;
  remaining: string;
  pending: boolean;
  revision: number;
} | null> {
  try {
    const balance = await careerApiService.getCareerCredits(refresh);
    return {
      granted: balance.granted_credits,
      spent: balance.spent_credits,
      remaining: balance.remaining_credits,
      pending: (balance.has_pending_cost ?? false) || balance.active_operation_id != null,
      revision: balance.revision ?? 0,
    };
  } catch (error) {
    logger.error('Failed to load Career AI credits', error as Error);
    return null;
  }
}

/**
 * Check if the worker is available
 */
export async function checkWorkerHealth(): Promise<boolean> {
  try {
    await careerApiService.healthCheck();
    return true;
  } catch {
    return false;
  }
}

export default {
  streamCareerChat,
  fetchCareerCredits,
  checkWorkerHealth
};
