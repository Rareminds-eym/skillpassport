/**
 * Career AI Edge Function Service
 * Calls the career-ai-chat edge function for faster, server-side AI processing
 */

import { supabase } from '../../../lib/supabaseClient';

interface StreamCallbackData {
  content?: string;
  conversationId?: string;
  messageId?: string;
  intent?: string;
  intentConfidence?: 'high' | 'medium' | 'low';
  phase?: 'opening' | 'exploring' | 'deep_dive';
  error?: string;
}

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

import careerApiService from '../../../services/careerApiService';

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
 * Stream chat response from Career AI Edge Function
 * @param message - User's message
 * @param conversationId - Optional existing conversation ID
 * @param selectedChips - Optional selected quick action chips
 * @param onChunk - Callback for each streamed chunk
 * @returns Promise with conversation metadata
 */
export async function streamCareerChat(
  message: string,
  conversationId: string | null,
  selectedChips: string[] = [],
  onChunk: (chunk: string) => void
): Promise<CareerChatResult> {
  try {
    // Get current session for auth token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error('Auth error:', sessionError);
      return { success: false, error: 'Please log in to use Career AI' };
    }

    console.log('🚀 Calling Career AI via careerApiService');

    let result: CareerChatResult = { success: true };

    // Wrap callback-based service in a promise
    await new Promise<void>((resolve, reject) => {
      careerApiService.sendCareerChatMessage(
        { conversationId: conversationId || undefined, message, selectedChips },
        session.access_token,
        (content) => {
          onChunk(content);
        },
        (data) => {
          // Map service response to local result format
          if (data.conversationId) result.conversationId = data.conversationId;
          if (data.messageId) result.messageId = data.messageId;
          if (data.intent) result.intent = data.intent;
          if (data.intentConfidence) result.intentConfidence = data.intentConfidence;
          if (data.phase) result.phase = data.phase;
          if (data.error) {
            result.success = false;
            result.error = data.error;
          }
          resolve();
        },
        (error) => {
          console.error('Career AI service error:', error);
          result.success = false;
          result.error = error.message;
          resolve(); // Resolve to return the error result instead of rejecting
        }
      );
    });

    console.log('✅ Career AI stream complete:', result);
    return result;

  } catch (error: any) {
    console.error('❌ Career AI stream error:', error);
    return {
      success: false,
      error: error.message || 'Failed to connect to Career AI service'
    };
  }
}

/**
 * Check if the edge function is available
 */
export async function checkEdgeFunctionHealth(): Promise<boolean> {
  try {
    await careerApiService.healthCheck();
    return true;
  } catch {
    return false;
  }
}

export default {
  streamCareerChat,
  checkEdgeFunctionHealth
};
