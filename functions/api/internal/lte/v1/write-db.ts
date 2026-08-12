/**
 * Write-capable DB facade for SkillPassport-side LTE sync writes, used by the
 * MyLearning sync module (`functions/api/learner/my-learning/...`).
 * Direct PostgREST calls: GET (SELECT), POST (INSERT), PATCH (UPDATE by row id).
 */

import type { PagesEnv } from '../../../../lib/types';

/**
 * Typed failure from the write facade. `status` is the PostgREST HTTP status;
 * `code` is the Postgres error code (e.g. `23505` unique_violation) parsed from
 * the error body when present. Lets handlers distinguish a race (unique
 * violation) from a real failure instead of guessing from a string.
 */
export class WriteDbError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'WriteDbError';
  }
}

export interface WriteDb {
  query<T = unknown>(path: string): Promise<T[]>;
  queryOne<T = unknown>(path: string): Promise<T | null>;
  insert<T = unknown>(table: string, row: Record<string, unknown>): Promise<T | null>;
  update(table: string, id: string, patch: Record<string, unknown>): Promise<boolean>;
}

export function createWriteDb(env: PagesEnv): WriteDb {
  const baseUrl = env.SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!baseUrl || !serviceRoleKey) {
    throw new Error('Write DB requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }

  const base = `${baseUrl}/rest/v1`;
  const headers: Record<string, string> = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    Accept: 'application/json',
  };

  async function request<T>(path: string, init: RequestInit): Promise<T | null> {
    const response = await fetch(`${base}/${path}`, { ...init, headers: { ...headers, ...init.headers } });
    if (!response.ok) {
      const body = await response.text();
      let code: string | undefined;
      try {
        const parsed = JSON.parse(body) as { code?: string };
        code = typeof parsed?.code === 'string' ? parsed.code : undefined;
      } catch {
        // non-JSON error body — no Postgres code to surface
      }
      throw new WriteDbError(
        `Write DB ${init.method ?? 'request'} failed [${response.status}]: ${body.slice(0, 500)}`,
        response.status,
        code,
      );
    }
    const text = await response.text();
    return text ? (JSON.parse(text) as T) : null;
  }

  return {
    query: async <T>(path: string): Promise<T[]> => {
      const rows = await request<T[]>(path, { method: 'GET' });
      return rows ?? [];
    },
    queryOne: async <T>(path: string): Promise<T | null> => {
      const rows = await request<T[]>(path, { method: 'GET' });
      return rows?.[0] ?? null;
    },
    insert: async <T>(table: string, row: Record<string, unknown>): Promise<T | null> => {
      return request<T>(table, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify(row),
      });
    },
    update: async (table: string, id: string, patch: Record<string, unknown>): Promise<boolean> => {
      await request<unknown>(`${table}?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(patch),
      });
      return true;
    },
  };
}
