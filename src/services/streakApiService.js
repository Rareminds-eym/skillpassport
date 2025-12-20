/**
 * Streak API Service
 * Communicates with the streak-api Cloudflare Worker
 * Falls back to Backend/server.js if worker URL not configured
 */

const STREAK_API_URL = import.meta.env.VITE_STREAK_API_URL;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

function getBaseUrl() {
    if (STREAK_API_URL) {
        return STREAK_API_URL;
    }
    // Fall back to Express backend
    return `${BACKEND_URL}/api/streaks`;
}

function isUsingWorker() {
    return !!STREAK_API_URL;
}

async function getAuthToken() {
    try {
        const { supabase } = await import('../lib/supabaseClient');
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || '';
    } catch {
        return '';
    }
}

function getAuthHeaders(token) {
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
}

/**
 * Get student's streak information
 */
export async function getStudentStreak(studentId, token) {
    const authToken = token || await getAuthToken();
    const endpoint = isUsingWorker() ? `/${studentId}` : `/${studentId}`;

    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
        method: 'GET',
        headers: getAuthHeaders(authToken),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to get streak');
    }

    return response.json();
}

/**
 * Mark activity as complete (update streak)
 */
export async function completeStreak(studentId, token) {
    const authToken = token || await getAuthToken();
    const endpoint = isUsingWorker() ? `/${studentId}/complete` : `/${studentId}/complete`;

    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(authToken),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to complete streak');
    }

    return response.json();
}

/**
 * Get notification history for a student
 */
export async function getNotificationHistory(studentId, limit = 10, token) {
    const authToken = token || await getAuthToken();
    const endpoint = isUsingWorker()
        ? `/${studentId}/notifications?limit=${limit}`
        : `/${studentId}/notifications?limit=${limit}`;

    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
        method: 'GET',
        headers: getAuthHeaders(authToken),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to get notification history');
    }

    return response.json();
}

/**
 * Process streak check for a student
 */
export async function processStreak(studentId, token) {
    const authToken = token || await getAuthToken();
    const endpoint = isUsingWorker() ? `/${studentId}/process` : `/${studentId}/process`;

    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
        method: 'POST',
        headers: getAuthHeaders(authToken),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to process streak');
    }

    return response.json();
}

/**
 * Health check
 */
export async function healthCheck() {
    const response = await fetch(`${getBaseUrl()}/health`, {
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
    isUsingWorker,
};
