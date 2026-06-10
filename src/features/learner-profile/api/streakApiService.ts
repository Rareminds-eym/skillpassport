import { ssoClient } from '@/shared/api/ssoClient';
/**
 * Streak API Service
 * Connects to Cloudflare Pages Function
 */

import { getApiUrl, getAuthHeaders } from '@/shared/api/apiUtils';

const API_URL = getApiUrl('streak');

async function getAuthToken(): Promise<string> {
  try {
    return ssoClient.getAccessToken() || '';
  } catch {
    return '';
  }
}

/**
 * Get learner's streak information
 */
export async function getlearnerStreak(learnerId: string, token?: string): Promise<unknown> {
  const authToken = token || await getAuthToken();

  const response = await ssoClient.fetch(`${API_URL}/${learnerId}`, {
    method: 'GET',
    headers: getAuthHeaders(authToken),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(error.error || 'Failed to get streak');
  }

  return response.json();
}

/**
 * Mark activity as complete (update streak)
 */
export async function completeStreak(learnerId: string, token?: string): Promise<unknown> {
  const authToken = token || await getAuthToken();

  const response = await ssoClient.fetch(`${API_URL}/${learnerId}/complete`, {
    method: 'POST',
    headers: getAuthHeaders(authToken),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(error.error || 'Failed to complete streak');
  }

  return response.json();
}

/**
 * Get notification history for a learner
 */
export async function getNotificationHistory(learnerId: string, limit = 10, token?: string): Promise<unknown> {
  const authToken = token || await getAuthToken();

  const response = await ssoClient.fetch(`${API_URL}/${learnerId}/notifications?limit=${limit}`, {
    method: 'GET',
    headers: getAuthHeaders(authToken),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(error.error || 'Failed to get notification history');
  }

  return response.json();
}

/**
 * Process streak check for a learner
 */
export async function processStreak(learnerId: string, token?: string): Promise<unknown> {
  const authToken = token || await getAuthToken();

  const response = await ssoClient.fetch(`${API_URL}/${learnerId}/process`, {
    method: 'POST',
    headers: getAuthHeaders(authToken),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(error.error || 'Failed to process streak');
  }

  return response.json();
}

/**
 * Health check
 */
export async function healthCheck(): Promise<unknown> {
  const response = await ssoClient.fetch(`${API_URL}/health`, {
    method: 'GET',
  });

  return response.json();
}

export default {
  getlearnerStreak,
  completeStreak,
  getNotificationHistory,
  processStreak,
  healthCheck,
};
