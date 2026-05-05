import { ssoClient } from './ssoClient';

const API_BASE = '/api';

/**
 * Error class for API responses with non-2xx status codes.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Authenticated GET request via Pages Functions.
 * Uses ssoClient.fetch() for automatic token attachment and 401 retry.
 */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await ssoClient.fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, (body as Record<string, string>).error || 'Request failed');
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
    throw new ApiError(res.status, (body as Record<string, string>).error || 'Request failed');
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
    throw new ApiError(res.status, (body as Record<string, string>).error || 'Request failed');
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
    throw new ApiError(res.status, (body as Record<string, string>).error || 'Request failed');
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
    throw new ApiError(res.status, (body as Record<string, string>).error || 'Request failed');
  }
  return res.json() as Promise<T>;
}
