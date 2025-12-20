/**
 * User API Service
 * Connects to Cloudflare Worker for user management API calls
 * Falls back to Supabase edge functions if worker URL not configured
 */

const WORKER_URL = import.meta.env.VITE_USER_API_URL;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const getBaseUrl = () => WORKER_URL || `${SUPABASE_URL}/functions/v1`;
const isUsingWorker = () => !!WORKER_URL;

const getAuthHeaders = (token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!isUsingWorker() && SUPABASE_ANON_KEY) headers['apikey'] = SUPABASE_ANON_KEY;
  return headers;
};

/**
 * Create a new student
 */
export async function createStudent(studentData, token) {
  const response = await fetch(`${getBaseUrl()}/create-student`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(studentData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to create student');
  }

  return response.json();
}

/**
 * Create a new teacher/educator
 */
export async function createTeacher(teacherData, token) {
  const response = await fetch(`${getBaseUrl()}/create-teacher`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(teacherData),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to create teacher');
  }

  return response.json();
}

/**
 * Reset user password (admin function)
 */
export async function resetPassword({ userId, newPassword }, token) {
  const response = await fetch(`${getBaseUrl()}/reset-password`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ userId, newPassword }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to reset password');
  }

  return response.json();
}

/**
 * Create event user (after event registration payment)
 */
export async function createEventUser({ email, firstName, lastName, role, phone, registrationId, metadata }, token) {
  const response = await fetch(`${getBaseUrl()}/create-event-user`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ email, firstName, lastName, role, phone, registrationId, metadata }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to create event user');
  }

  return response.json();
}

/**
 * Send interview reminder email
 */
export async function sendInterviewReminder({ interviewId, recipientEmail, recipientName, interviewDetails }, token) {
  const response = await fetch(`${getBaseUrl()}/send-interview-reminder`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ interviewId, recipientEmail, recipientName, interviewDetails }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to send interview reminder');
  }

  return response.json();
}

export default {
  createStudent,
  createTeacher,
  createEventUser,
  sendInterviewReminder,
  resetPassword,
  isUsingWorker,
};
