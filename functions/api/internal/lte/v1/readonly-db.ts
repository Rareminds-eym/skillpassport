/**
 * Read-Only Database Facade — the ONLY way internal LTE gateway actions touch
 * the SkillPassport database.
 *
 * SECURITY CONTRACT
 * ----------------
 * This client is structurally read-only: it issues ONLY PostgREST `GET`
 * requests, which PostgREST executes as `SELECT`. There is no method exposed
 * that can issue POST/PATCH/DELETE (INSERT/UPDATE/DELETE), so a write is
 * impossible at both the type level and the runtime level — not merely
 * discouraged.
 *
 * Usage: a gateway handler receives `ctx.db: ReadOnlyDb`; nothing else is
 * injected. If a future action ever needs a write, it MUST be reviewed
 * separately and given its own write-capable client — never this one.
 */

import type { PagesEnv } from '../../../../lib/types';

export interface ReadOnlyDb {
  /** Execute a SELECT against `${table}?<filter>&select=...`. Returns all rows. */
  query<T = unknown>(path: string): Promise<T[]>;
  /** Like `query` but returns the first row (or null). */
  queryOne<T = unknown>(path: string): Promise<T | null>;
}

// The ONLY HTTP method this client is allowed to use. PostgREST maps GET -> SELECT.
const SELECT_ONLY_METHOD = 'GET';

export function createReadOnlyDb(env: PagesEnv): ReadOnlyDb {
  const baseUrl = env.SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!baseUrl || !serviceRoleKey) {
    throw new Error('Read-only DB requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }

  const base = `${baseUrl}/rest/v1`;
  const headers: Record<string, string> = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    Accept: 'application/json',
  };

  async function select<T>(path: string): Promise<T[]> {
    // method is hardcoded to GET; callers cannot override it (options are not accepted).
    const response = await fetch(`${base}/${path}`, { method: SELECT_ONLY_METHOD, headers });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Read-only SELECT failed [${response.status}]: ${body.slice(0, 500)}`);
    }
    const text = await response.text();
    return text ? (JSON.parse(text) as T[]) : [];
  }

  return {
    query: select,
    queryOne: async <T>(path: string): Promise<T | null> => {
      const rows = await select<T>(path);
      return rows[0] ?? null;
    },
  };
}
