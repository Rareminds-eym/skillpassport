/**
 * Assessment API Service
 * Connects to Cloudflare Pages Function for assessment-related API calls
 */

import { getPagesApiUrl, getAuthHeaders } from '../utils/pagesUrl';

const API_URL = getPagesApiUrl('assessment');

interface GenerateAssessmentParams {
  role: string;
  difficulty: string;
  numQuestions: number;
  topics?: string[];
  language?: string;
}

/**
 * Generate assessment questions
 */
export async function generateAssessment(
  params: GenerateAssessmentParams,
  token?: string
): Promise<any> {
  const response = await fetch(`${API_URL}/generate`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to generate assessment');
  }

  return response.json();
}

interface SubmitAssessmentParams {
  assessmentId: string;
  answers: Record<string, any>;
  timeSpent: number;
}

/**
 * Submit assessment answers for grading
 */
export async function submitAssessment(
  params: SubmitAssessmentParams,
  token?: string
): Promise<any> {
  const response = await fetch(`${API_URL}/submit`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to submit assessment');
  }

  return response.json();
}

/**
 * Get assessment results
 */
export async function getAssessmentResults(
  assessmentId: string,
  token?: string
): Promise<any> {
  const response = await fetch(`${API_URL}/results/${assessmentId}`, {
    method: 'GET',
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to get assessment results');
  }

  return response.json();
}

/**
 * Get user's assessment history
 */
export async function getAssessmentHistory(token?: string): Promise<any> {
  const response = await fetch(`${API_URL}/history`, {
    method: 'GET',
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to get assessment history');
  }

  return response.json();
}

interface StreamGenerateParams {
  role: string;
  difficulty: string;
  numQuestions: number;
  topics?: string[];
  language?: string;
}

/**
 * Generate assessment with streaming (for real-time question generation)
 */
export async function streamGenerateAssessment(
  params: StreamGenerateParams,
  token?: string,
  onQuestion?: (question: any) => void,
  onComplete?: (assessment: any) => void,
  onError?: (error: Error) => void
): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/stream-generate`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      onError?.(new Error(error.error || 'Failed to generate assessment'));
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
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'question') {
              onQuestion?.(data.question);
            } else if (data.type === 'complete') {
              onComplete?.(data.assessment);
            } else if (data.type === 'error') {
              onError?.(new Error(data.error));
            }
          } catch { /* skip */ }
        }
      }
    }
  } catch (error) {
    onError?.(error as Error);
  }
}

/**
 * Validate assessment answer
 */
export async function validateAnswer(
  questionId: string,
  answer: any,
  token?: string
): Promise<any> {
  const response = await fetch(`${API_URL}/validate`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ questionId, answer }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to validate answer');
  }

  return response.json();
}

/**
 * Get assessment analytics
 */
export async function getAssessmentAnalytics(
  assessmentId: string,
  token?: string
): Promise<any> {
  const response = await fetch(`${API_URL}/analytics/${assessmentId}`, {
    method: 'GET',
    headers: getAuthHeaders(token),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to get assessment analytics');
  }

  return response.json();
}

export default {
  generateAssessment,
  submitAssessment,
  getAssessmentResults,
  getAssessmentHistory,
  streamGenerateAssessment,
  validateAnswer,
  getAssessmentAnalytics,
};
