import { ssoClient } from './ssoClient';

const API_BASE = '/api';

/**
 * Error class for API responses with non-2xx status codes.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Helper to extract error message safely from varying response shapes
function extractError(body: any): { message: string, code?: string } {
  if (!body) return { message: 'Request failed' };
  if (typeof body.error === 'string') return { message: body.error };
  if (body.error && typeof body.error === 'object') {
    return { 
      message: body.error.message || 'Request failed', 
      code: body.error.code 
    };
  }
  return { message: 'Request failed' };
}

/**
 * Authenticated GET request via Pages Functions.
 * Uses ssoClient.fetch() for automatic token attachment and 401 retry.
 */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await ssoClient.fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = extractError(body);
    throw new ApiError(res.status, err.message, err.code);
  }
  return res.json() as Promise<T>;
}

/**
 * Authenticated POST request via Pages Functions.
 */
export async function apiPost<T>(path: string, data?: unknown): Promise<T> {
  const res = await ssoClient.fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = extractError(body);
    throw new ApiError(res.status, err.message, err.code);
  }
  return res.json() as Promise<T>;
}

/**
 * Authenticated PUT request via Pages Functions.
 */
export async function apiPut<T>(path: string, data?: unknown): Promise<T> {
  const res = await ssoClient.fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = extractError(body);
    throw new ApiError(res.status, err.message, err.code);
  }
  return res.json() as Promise<T>;
}

/**
 * Authenticated PATCH request via Pages Functions.
 */
export async function apiPatch<T>(path: string, data?: unknown): Promise<T> {
  const res = await ssoClient.fetch(`${API_BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = extractError(body);
    throw new ApiError(res.status, err.message, err.code);
  }
  return res.json() as Promise<T>;
}

/**
 * Authenticated DELETE request via Pages Functions.
 */
export async function apiDelete<T>(path: string): Promise<T> {
  const res = await ssoClient.fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = extractError(body);
    throw new ApiError(res.status, err.message, err.code);
  }
  return res.json() as Promise<T>;
}
