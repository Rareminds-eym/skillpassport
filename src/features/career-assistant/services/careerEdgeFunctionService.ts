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

interface CareerChatResult {
  success: boolean;
  conversationId?: string;
  messageId?: string;
  intent?: string;
  intentConfidence?: 'high' | 'medium' | 'low';
  phase?: 'opening' | 'exploring' | 'deep_dive';
  error?: string;
}

/**
 * Get the Supabase Edge Function URL
 */
function getEdgeFunctionUrl(): string {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL is not configured');
  }
  return `${supabaseUrl}/functions/v1/career-ai-chat`;
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

    const url = getEdgeFunctionUrl();
    console.log('🚀 Calling Career AI Edge Function:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        message,
        conversationId,
        selectedChips
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Edge function error:', response.status, errorData);
      return { success: false, error: errorData.error || `Error: ${response.status}` };
    }

    // Handle SSE streaming response
    const reader = response.body?.getReader();
    if (!reader) {
      return { success: false, error: 'No response stream available' };
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let result: CareerChatResult = { success: true };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('event: ')) {
          // Event type line (token, done, error) - skip to data line
          continue;
        }
        
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          try {
            const parsed: StreamCallbackData = JSON.parse(data);
            
            if (parsed.content) {
              // Stream token to UI
              onChunk(parsed.content);
            }
            
            if (parsed.conversationId) {
              result.conversationId = parsed.conversationId;
            }
            
            if (parsed.messageId) {
              result.messageId = parsed.messageId;
            }
            
            if (parsed.intent) {
              result.intent = parsed.intent;
            }

            if (parsed.intentConfidence) {
              result.intentConfidence = parsed.intentConfidence;
            }

            if (parsed.phase) {
              result.phase = parsed.phase;
            }
            
            if (parsed.error) {
              result.success = false;
              result.error = parsed.error;
            }
          } catch {
            // Skip parse errors for non-JSON data
          }
        }
      }
    }

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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const url = getEdgeFunctionUrl();
    const response = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      }
    });

    return response.ok;
  } catch {
    return false;
  }
}

export default {
  streamCareerChat,
  checkEdgeFunctionHealth
};
