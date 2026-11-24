/**
 * Career AI Worker Service
 * Calls the Cloudflare Worker for career AI processing
 */

import { sendCareerChatMessage, healthCheck } from '@/features/counselling/api/careerApiService';
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
  interactive?: any;
}

/**
 * Stream chat response from Career AI Cloudflare Worker
 * @param message - User's message
 * @param conversationId - Optional existing conversation ID
 * @param selectedChips - Optional selected quick action chips
 * @param onChunk - Callback for each streamed chunk
 * @param abortSignal - Optional AbortSignal to cancel the request
 * @returns Promise with conversation metadata
 */
export async function streamCareerChat(
  message: string,
  conversationId: string | null,
  selectedChips: string[] = [],
  onChunk: (chunk: string) => void,
  abortSignal?: AbortSignal
): Promise<CareerChatResult> {
  try {
    const user = useAuthStore.getState().user;

    if (!user) {
      logger.error('Authentication failed for career AI service');
      return { success: false, error: 'Please log in to use Career AI' };
    }

    let result: CareerChatResult = { success: false, error: 'The response did not include a completion confirmation.' };

    await sendCareerChatMessage(
      { conversationId: conversationId || undefined, message, selectedChips },
      onChunk,
      (data) => {
        const response = data as CareerChatResult;
        result = { ...response, success: true };
      },
      (error) => { result = { success: false, error: error.message }; },
      abortSignal
    );
    if (abortSignal?.aborted) throw new DOMException('Request aborted', 'AbortError');

    return result;

  } catch (error: any) {
    if (abortSignal?.aborted) throw new DOMException('Request aborted', 'AbortError');
    logger.error('Career AI stream processing failed', error as Error);
    return {
      success: false,
      error: error.message || 'Failed to connect to Career AI service'
    };
  }
}

/**
 * Check if the worker is available
 */
export async function checkWorkerHealth(): Promise<boolean> {
  try {
    await healthCheck();
    return true;
  } catch {
    return false;
  }
}

export default {
  streamCareerChat,
  checkWorkerHealth
};
