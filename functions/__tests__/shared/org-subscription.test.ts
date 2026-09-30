import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveUserEntitlement } from '../../shared/lib/org-subscription';

/**
 * Minimal typed stub of the PostgREST fluent query-builder chain used by
 * `resolveUserEntitlement`. Every filter method returns the stub so chains
 * of any shape resolve; `maybeSingle` terminates the chain.
 */
interface QueryStub {
  select: () => QueryStub;
  eq: (...args: unknown[]) => QueryStub;
  in: (...args: unknown[]) => QueryStub;
  or: (...args: unknown[]) => QueryStub;
  order: (...args: unknown[]) => QueryStub;
  limit: (...args: unknown[]) => QueryStub;
  maybeSingle: () => Promise<{ data: unknown }>;
}

type TableResolver = (table: string) => QueryStub;

/**
 * Build a query stub whose `maybeSingle` resolves via `resolveResult`,
 * receiving every filter argument captured from eq/in/or calls in order.
 */
function createQueryStub(
  resolveResult: (filters: unknown[][]) => Promise<{ data: unknown }>
): QueryStub {
  const filters: unknown[][] = [];
  const stub: QueryStub = {
    select: () => stub,
    eq: (...args: unknown[]) => {
      filters.push(args);
      return stub;
    },
    in: (...args: unknown[]) => {
      filters.push(args);
      return stub;
    },
    or: (...args: unknown[]) => {
      filters.push(args);
      return stub;
    },
    order: () => stub,
    limit: () => stub,
    maybeSingle: () => resolveResult(filters),
  };
  return stub;
}

/**
 * Wrap a table resolver in a mock typed as SupabaseClient. The single
 * documented cast here replaces scattered `as any` mocks; the runtime shape
 * is exercised by `resolveUserEntitlement` itself.
 */
function createMockSupabaseClient(resolveTable: TableResolver): SupabaseClient {
  const from = vi.fn((table: string) => resolveTable(table));
  return { from } as unknown as SupabaseClient;
}

describe('resolveUserEntitlement', () => {
  it('returns null for missing user ID', async () => {
    const mockSupabase = createMockSupabaseClient(() =>
      createQueryStub(async () => ({ data: null }))
    );
    const result = await resolveUserEntitlement(mockSupabase, '');
    expect(result).toBeNull();
  });

  it('halts resolution and returns null when seat is explicitly revoked (STEP 1.5)', async () => {
    const mockSupabase = createMockSupabaseClient((table) => {
      if (table === 'license_assignments') {
        return createQueryStub(async (filters) => {
          const status = filters.at(-1)?.[1];
          if (status === 'active') return { data: null };
          if (status === 'revoked') return { data: { id: 'revoked_1' } };
          return { data: null };
        });
      }
      return createQueryStub(async () => ({ data: null }));
    });

    const result = await resolveUserEntitlement(mockSupabase, 'user_123');
    expect(result).toBeNull();
  });

  it('resolves organization-wide entitlement for active imported student (STEP 1.7)', async () => {
    const tableResults: Record<string, unknown> = {
      learners: { college_id: 'org_college_1', status: 'active' },
      subscription_cache: {
        id: 'sub_cache_99',
        plan_id: 'plan_college',
        plan_code: 'COLLEGE_ORG_v1',
        organization_name: 'Test College',
        status: 'active',
        features: ['dashboard', 'skills'],
      },
      organizations: { name: 'Test College', email: 'admin@testcollege.edu' },
    };

    const mockSupabase = createMockSupabaseClient((table) =>
      createQueryStub(async () => ({ data: tableResults[table] ?? null }))
    );

    const result = await resolveUserEntitlement(mockSupabase, 'student_456');
    expect(result).not.toBeNull();
    expect(result?.is_organization_license).toBe(true);
    expect(result?.organization_wide).toBe(true);
    expect(result?.organization_id).toBe('org_college_1');
    expect(result?.organization_name).toBe('Test College');
  });
});
