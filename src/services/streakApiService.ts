/**
 * Streak API Service
 * Connects to Cloudflare Pages Function
 */

import { getPagesApiUrl, getAuthHeaders } from '../utils/pagesUrl';

const API_URL = getPagesApiUrl('streak');

async function getAuthToken(): Promise<string> {
  try {
    const { supabase } = await import('../lib/supabaseClient');
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || '';
  } catch {
    return '';
  }
}

/**
 * Get student's streak information
 */
export async function getStudentStreak(studentId: string, token?: string): Promise<unknown> {
  const authToken = token || await getAuthToken();

  const response = await fetch(`${API_URL}/${studentId}`, {
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
export async function completeStreak(studentId: string, token?: string): Promise<unknown> {
  const authToken = token || await getAuthToken();

  const response = await fetch(`${API_URL}/${studentId}/complete`, {
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
 * Get notification history for a student
 */
export async function getNotificationHistory(studentId: string, limit = 10, token?: string): Promise<unknown> {
  const authToken = token || await getAuthToken();

  const response = await fetch(`${API_URL}/${studentId}/notifications?limit=${limit}`, {
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
 * Process streak check for a student
 */
export async function processStreak(studentId: string, token?: string): Promise<unknown> {
  const authToken = token || await getAuthToken();

  const response = await fetch(`${API_URL}/${studentId}/process`, {
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
  const response = await fetch(`${API_URL}/health`, {
    method: 'GET',
  });

  return response.json();
}

export default {
  getStudentStreak,
  completeStreak,
  getNotificationHistory,
  processStreak,
  healthCheck,
};
