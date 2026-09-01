import { describe, it, expect, vi } from 'vitest';
import { resolveUserEntitlement } from '../../shared/lib/org-subscription';

describe('resolveUserEntitlement', () => {
  it('returns null for missing user ID', async () => {
    const mockSupabase = {} as any;
    const result = await resolveUserEntitlement(mockSupabase, '');
    expect(result).toBeNull();
  });

  it('halts resolution and returns null when seat is explicitly revoked (STEP 1.5)', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'license_assignments') {
          return {
            select: () => ({
              eq: (col: string, val: string) => ({
                eq: (col2: string, status: string) => ({
                  maybeSingle: async () => {
                    if (status === 'active') return { data: null };
                    if (status === 'revoked') return { data: { id: 'revoked_1' } };
                    return { data: null };
                  },
                }),
              }),
            }),
          };
        }
        return {};
      }),
    } as any;

    const result = await resolveUserEntitlement(mockSupabase, 'user_123');
    expect(result).toBeNull();
  });

  it('resolves organization-wide entitlement for active imported student (STEP 1.7)', async () => {
    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'license_assignments') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: null }),
                }),
              }),
            }),
          };
        }
        if (table === 'learners') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: { college_id: 'org_college_1', status: 'active' },
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'subscription_cache') {
          return {
            select: () => ({
              eq: () => ({
                in: () => ({
                  or: () => ({
                    order: () => ({
                      order: () => ({
                        limit: () => ({
                          maybeSingle: async () => ({
                            data: {
                              id: 'sub_cache_99',
                              plan_id: 'plan_college',
                              plan_code: 'COLLEGE_ORG_v1',
                              organization_name: 'Test College',
                              status: 'active',
                              features: ['dashboard', 'skills'],
                            },
                          }),
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'organizations') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { name: 'Test College', email: 'admin@testcollege.edu' },
                }),
              }),
            }),
          };
        }
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null }),
            }),
          }),
        };
      }),
    } as any;

    const result = await resolveUserEntitlement(mockSupabase, 'student_456');
    expect(result).not.toBeNull();
    expect(result?.is_organization_license).toBe(true);
    expect(result?.organization_wide).toBe(true);
    expect(result?.organization_id).toBe('org_college_1');
    expect(result?.organization_name).toBe('Test College');
  });
});
