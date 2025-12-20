/**
 * Course API Service
 * Connects to Cloudflare Worker for course-related API calls
 * Falls back to Supabase edge functions if worker URL not configured
 */

const WORKER_URL = import.meta.env.VITE_COURSE_API_URL;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use Cloudflare Worker if configured, otherwise fall back to Supabase
const getBaseUrl = () => WORKER_URL || `${SUPABASE_URL}/functions/v1`;
const isUsingWorker = () => !!WORKER_URL;

/**
 * Get auth headers for API calls
 */
const getAuthHeaders = (token) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Add Supabase API key if using Supabase functions
  if (!isUsingWorker() && SUPABASE_ANON_KEY) {
    headers['apikey'] = SUPABASE_ANON_KEY;
  }
  
  return headers;
};

/**
 * Get presigned URL for R2 file
 */
export async function getFileUrl(fileKey) {
  const response = await fetch(`${getBaseUrl()}/get-file-url`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ fileKey }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Failed to get file URL: ${response.statusText}`);
  }

  const data = await response.json();
  return data.url;
}

/**
 * Get AI tutor suggestions for a lesson
 */
export async function getAiTutorSuggestions(lessonId, token) {
  const response = await fetch(`${getBaseUrl()}/ai-tutor-suggestions`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ lessonId }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to get suggestions');
  }

  return response.json();
}

/**
 * Send message to AI tutor chat (streaming)
 */
export async function sendAiTutorMessage({ conversationId, courseId, lessonId, message }, token, onToken, onDone, onError) {
  try {
    const response = await fetch(`${getBaseUrl()}/ai-tutor-chat`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ conversationId, courseId, lessonId, message }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
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
          const dataLine = lines[lines.indexOf(line) + 1];
          
          if (dataLine?.startsWith('data: ')) {
            try {
              const data = JSON.parse(dataLine.slice(6));
              
              if (eventType === 'token' && data.content) {
                onToken?.(data.content);
              } else if (eventType === 'done') {
                onDone?.(data);
              } else if (eventType === 'error') {
                onError?.(new Error(data.error));
              }
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
 * Submit feedback for AI tutor response
 */
export async function submitAiTutorFeedback({ conversationId, messageIndex, rating, feedbackText }, token) {
  const response = await fetch(`${getBaseUrl()}/ai-tutor-feedback`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ conversationId, messageIndex, rating, feedbackText }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to submit feedback');
  }

  return response.json();
}

/**
 * Get student progress for a course
 */
export async function getAiTutorProgress(courseId, token) {
  const url = new URL(`${getBaseUrl()}/ai-tutor-progress`);
  url.searchParams.set('courseId', courseId);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to get progress');
  }

  return response.json();
}

/**
 * Update student progress
 */
export async function updateAiTutorProgress({ courseId, lessonId, status }, token) {
  const response = await fetch(`${getBaseUrl()}/ai-tutor-progress`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ courseId, lessonId, status }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to update progress');
  }

  return response.json();
}

/**
 * Request video summarization
 */
export async function summarizeVideo({ videoUrl, lessonId, courseId, language = 'en' }, token) {
  const response = await fetch(`${getBaseUrl()}/ai-video-summarizer`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ videoUrl, lessonId, courseId, language }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to summarize video');
  }

  return response.json();
}

export default {
  getFileUrl,
  getAiTutorSuggestions,
  sendAiTutorMessage,
  submitAiTutorFeedback,
  getAiTutorProgress,
  updateAiTutorProgress,
  summarizeVideo,
  isUsingWorker,
};
