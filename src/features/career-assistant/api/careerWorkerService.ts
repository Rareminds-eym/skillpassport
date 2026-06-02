/**
 * Career AI Worker Service
 * Calls the Cloudflare Worker for career AI processing
 */

import { careerApiService } from '@/features/counselling';
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
    const sessionError = null;

    if (sessionError || !session) {
      logger.error('Authentication failed for career AI service', sessionError as Error);
      return { success: false, error: 'Please log in to use Career AI' };
    }

    let result: CareerChatResult = { success: true };

    await new Promise<void>((resolve) => {
      careerApiService.sendCareerChatMessage(
        { conversationId: conversationId || undefined, message, selectedChips },
        ssoClient.getAccessToken(),
        (content) => onChunk(content),
        (data) => {
          const response = data as any;
          if (response.conversationId) result.conversationId = response.conversationId;
          if (response.messageId) result.messageId = response.messageId;
          if (response.intent) result.intent = response.intent;
          if (response.intentConfidence) result.intentConfidence = response.intentConfidence;
          if (response.phase) result.phase = response.phase;
          if (response.error) {
            result.success = false;
            result.error = response.error;
          }
          resolve();
        },
        (error) => {
          logger.error('Career AI service request failed', error as Error);
          result.success = false;
          result.error = error.message;
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
  checkWorkerHealth
};
