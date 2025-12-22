/**
 * Career API Service
 * Connects to Cloudflare Worker for career-related API calls
 */

const WORKER_URL = import.meta.env.VITE_CAREER_API_URL;

if (!WORKER_URL) {
  console.warn('⚠️ VITE_CAREER_API_URL not configured. Career API calls will fail.');
}

const getBaseUrl = () => {
  if (!WORKER_URL) {
    throw new Error('VITE_CAREER_API_URL environment variable is required');
  }
  return WORKER_URL;
};

const getAuthHeaders = (token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

/**
 * Send message to Career AI chat (streaming)
 */
export async function sendCareerChatMessage(
  { conversationId, message, selectedChips = [] },
  token,
  onToken,
  onDone,
  onError
) {
  try {
    // Debug logging
    console.log('🔍 DEBUG - Sending to worker:');
    console.log('  Worker URL:', getBaseUrl());
    console.log('  VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('  VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
    console.log('  JWT Token (FULL):', token);
    console.log('  Message:', message);
    
    const response = await fetch(`${getBaseUrl()}/chat`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ conversationId, message, selectedChips }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('❌ Worker error response:', error);
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
        if (line.startsWith('event: ')) {
          const eventType = line.slice(7);
          const dataLineIndex = lines.indexOf(line) + 1;
          const dataLine = lines[dataLineIndex];

          if (dataLine?.startsWith('data: ')) {
            try {
              const data = JSON.parse(dataLine.slice(6));
              if (eventType === 'token' && data.content) onToken?.(data.content);
              else if (eventType === 'done') onDone?.(data);
              else if (eventType === 'error') onError?.(new Error(data.error));
            } catch { /* skip */ }
          }
        }
      }
    }
  } catch (error) {
    onError?.(error);
  }
}


/**
 * Get job recommendations for a student
 */
export async function getRecommendations(studentId, { forceRefresh = false, limit = 20 } = {}) {
  const response = await fetch(`${getBaseUrl()}/recommend-opportunities`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ studentId, forceRefresh, limit }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to get recommendations');
  }

  return response.json();
}

/**
 * Health check
 */
export async function healthCheck() {
  const response = await fetch(`${getBaseUrl()}/health`, {
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
export async function generateEmbedding({ text, table, id, type = 'opportunity' }) {
  const response = await fetch(`${getBaseUrl()}/generate-embedding`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ text, table, id, type }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
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
