/**
 * Unit tests for syncRolesShadow (task 16.1).
 *
 * Exercises the REAL function against a lightweight Supabase query-builder mock
 * and a mock `SSO_SERVICE` RPC binding (mirroring the schoolRole.test.ts style).
 *
 * Covers the design "Sync Mechanism" contract:
 *  - happy path: listRoles() roles are upserted (name-keyed) and orphans pruned
 *  - fail-soft: missing binding / RPC throw / empty source never throw and leave
 *    the shadow unchanged (authz comes from the JWT, not this shadow)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { syncRolesShadow } from '../sync-shadow';

/**
 * Records the upsert payload + onConflict, and the `.not(...)` prune filter.
 * `upsert` and the `delete().not().select()` chain resolve to the configured results.
 */
function makeSupabaseMock(opts: {
    upsertError?: { message: string } | null;
    deleted?: Array<{ name: string }>;
    deleteError?: { message: string } | null;
} = {}): {
    client: SupabaseClient;
    calls: {
        upsertRows: any[] | null;
        upsertOptions: any;
        notFilter: [string, string, string] | null;
    };
} {
    const calls = {
        upsertRows: null as any[] | null,
        upsertOptions: null as any,
        notFilter: null as [string, string, string] | null,
    };

    const client = {
        from(_table: string) {
            return {
                upsert(rows: any[], options: any) {
                    calls.upsertRows = rows;
                    calls.upsertOptions = options;
                    return Promise.resolve({ error: opts.upsertError ?? null });
                },
                delete() {
                    const builder: any = {
                        not(col: string, op: string, val: string) {
                            calls.notFilter = [col, op, val];
                            return builder;
                        },
                        select() {
                            return Promise.resolve({
                                data: opts.deleted ?? [],
                                error: opts.deleteError ?? null,
                            });
                        },
                    };
                    return builder;
                },
            };
        },
    } as unknown as SupabaseClient;

    return { client, calls };
}

function makeEnv(listRoles: () => Promise<{ roles: any[] }>): any {
    return { SSO_SERVICE: { listRoles } };
}

const ROLES = [
    { id: 'id-owner', name: 'owner', description: 'Organization owner' },
    { id: 'id-admin', name: 'admin', description: 'Administrator' },
    { id: 'id-learner', name: 'learner', description: null },
];

describe('syncRolesShadow', () => {
    it('upserts roles (name-keyed) and prunes orphans on the happy path', async () => {
        const { client, calls } = makeSupabaseMock({ deleted: [{ name: 'stale_role' }] });
        const env = makeEnv(() => Promise.resolve({ roles: ROLES }));

        const result = await syncRolesShadow(client, env);

        expect(result.error).toBeNull();
        expect(result.synced).toBe(3);
        expect(result.deleted).toBe(1);

        // upsert keyed on name, mapping sso id → sso_role_id, null-safe description
        expect(calls.upsertOptions).toEqual({ onConflict: 'name' });
        expect(calls.upsertRows).toEqual([
            expect.objectContaining({ name: 'owner', description: 'Organization owner', sso_role_id: 'id-owner' }),
            expect.objectContaining({ name: 'admin', description: 'Administrator', sso_role_id: 'id-admin' }),
            expect.objectContaining({ name: 'learner', description: null, sso_role_id: 'id-learner' }),
        ]);
        calls.upsertRows!.forEach((row) => expect(typeof row.synced_at).toBe('string'));

        // orphan prune targets names NOT in the canonical set
        expect(calls.notFilter).toEqual(['name', 'in', '("owner","admin","learner")']);
    });

    it('is fail-soft when the SSO_SERVICE binding is missing (no throw)', async () => {
        const { client, calls } = makeSupabaseMock();

        const result = await syncRolesShadow(client, { SSO_SERVICE: undefined } as any);

        expect(result.error).toBe('SSO_SERVICE binding not configured');
        expect(result.synced).toBe(0);
        expect(calls.upsertRows).toBeNull(); // never touched the shadow
    });

    it('is fail-soft when listRoles() throws (no throw, shadow untouched)', async () => {
        const { client, calls } = makeSupabaseMock();
        const env = makeEnv(() => Promise.reject(new Error('binding down')));

        const result = await syncRolesShadow(client, env);

        expect(result.error).toBe('listRoles RPC failed');
        expect(calls.upsertRows).toBeNull();
    });

    it('leaves the shadow unchanged when the source returns no roles', async () => {
        const { client, calls } = makeSupabaseMock();
        const env = makeEnv(() => Promise.resolve({ roles: [] }));

        const result = await syncRolesShadow(client, env);

        expect(result.error).toBe('no roles returned');
        expect(calls.upsertRows).toBeNull(); // guard prevents an empty-source wipe
    });

    it('surfaces an upsert error without throwing or pruning', async () => {
        const { client, calls } = makeSupabaseMock({ upsertError: { message: 'db down' } });
        const env = makeEnv(() => Promise.resolve({ roles: ROLES }));

        const result = await syncRolesShadow(client, env);

        expect(result.error).toBe('db down');
        expect(result.synced).toBe(0);
        expect(calls.notFilter).toBeNull(); // prune is skipped on upsert failure
    });
});
