/**
 * Course API Service
 * Connects to Cloudflare Pages Function for course-related API calls
 */

import { getPagesApiUrl, getAuthHeaders } from '../utils/pagesUrl';

const API_URL = getPagesApiUrl('course');
const STORAGE_API_URL = getPagesApiUrl('storage');

/**
 * Get presigned URL for R2 file
 * Note: This uses the Storage API, not Course API, as file URL generation is a storage concern
 */
export async function getFileUrl(fileKey: string): Promise<string> {
  const response = await fetch(`${STORAGE_API_URL}/get-file-url`, {
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
export async function getAiTutorSuggestions(lessonId: string, token?: string): Promise<any> {
  const response = await fetch(`${API_URL}/ai-tutor-suggestions`, {
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

interface AiTutorMessageParams {
  conversationId?: string;
  courseId: string;
  lessonId: string;
  message: string;
}

/**
 * Send message to AI tutor chat (streaming)
 */
export async function sendAiTutorMessage(
  params: AiTutorMessageParams,
  token?: string,
  onToken?: (content: string) => void,
  onDone?: (data: any) => void,
  onError?: (error: Error) => void
): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/ai-tutor-chat`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(params),
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
    onError?.(error as Error);
  }
}

interface AiTutorFeedbackParams {
  conversationId: string;
  messageIndex: number;
  rating: number;
  feedbackText?: string;
}

/**
 * Submit feedback for AI tutor response
 */
export async function submitAiTutorFeedback(
  params: AiTutorFeedbackParams,
  token?: string
): Promise<any> {
  const response = await fetch(`${API_URL}/ai-tutor-feedback`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(params),
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
export async function getAiTutorProgress(courseId: string, token?: string): Promise<any> {
  const response = await fetch(`${API_URL}/ai-tutor-progress?courseId=${encodeURIComponent(courseId)}`, {
    method: 'GET',
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to get progress');
  }

  return response.json();
}

interface UpdateProgressParams {
  courseId: string;
  lessonId: string;
  status: string;
}

/**
 * Update student progress
 */
export async function updateAiTutorProgress(
  params: UpdateProgressParams,
  token?: string
): Promise<any> {
  const response = await fetch(`${API_URL}/ai-tutor-progress`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to update progress');
  }

  return response.json();
}

interface SummarizeVideoParams {
  videoUrl: string;
  lessonId: string;
  courseId: string;
  language?: string;
}

/**
 * Request video summarization
 */
export async function summarizeVideo(
  params: SummarizeVideoParams,
  token?: string
): Promise<any> {
  const response = await fetch(`${API_URL}/ai-video-summarizer`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ ...params, language: params.language || 'en' }),
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
};
