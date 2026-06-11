/**
 * Unit tests for resolveSchoolRole (task 19.2) and its pure helper
 * pickPermissionRoleFromJwt.
 *
 * These exercise the REAL composition (no internal mocking): the JWT fast-path
 * is verified with a Supabase stub that throws if touched, and the DB fall-through
 * is verified with a lightweight Supabase query-builder mock that reproduces the
 * `school_educators` / `teachers` chains used by lookupSchoolInternalRole.
 *
 * Covers design clause 8.5:
 *  (a) a JWT role that is itself a permission role_code → returned WITHOUT a DB read
 *  (b) precedence when the user holds several permission role_codes
 *  (c) no permission role_code in the JWT → falls through to school_educators read
 *  (d) null when neither path yields a role (no subject_teacher default)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import {
    PERMISSION_ROLE_CODE_PRECEDENCE,
    pickPermissionRoleFromJwt,
    resolveSchoolRole,
} from '../schoolRole';

// Minimal AuthUser factory — only the fields resolveSchoolRole reads matter,
// but we build the full shape so the type is satisfied at the call site.
function makeUser(overrides: Record<string, unknown> = {}): any {
    return {
        sub: 'user-1',
        id: 'user-1',
        email: 'teacher@example.com',
        org_id: 'school-1',
        roles: [],
        products: [],
        membership_status: 'active',
        is_email_verified: true,
        ...overrides,
    };
}

// A supabase stub that EXPLODES if any query method is touched — used to prove
// the JWT fast-path performs NO database read.
const explodingSupabase = new Proxy({}, {
    get() {
        throw new Error('DB should not be touched on the JWT fast-path');
    },
}) as unknown as SupabaseClient;

/**
 * Lightweight Supabase mock reproducing the query chains used by
 * lookupSchoolInternalRole:
 *   from('school_educators').select(..).eq('user_id', id)[.eq('school_id', org)]  → awaited
 *   from('teachers').select(..).eq('email', email).maybeSingle()                   → promise
 * Records every `.eq(col, val)` call per table so scoping can be asserted.
 */
function makeSupabaseMock(
    tableResults: Record<string, { data: any; error: any }>
): { client: SupabaseClient; eqCalls: Record<string, Array<[string, unknown]>> } {
    const eqCalls: Record<string, Array<[string, unknown]>> = {};
    const client = {
        from(table: string) {
            const result = tableResults[table] ?? { data: null, error: null };
            eqCalls[table] = eqCalls[table] ?? [];
            const builder: any = {
                select() { return builder; },
                eq(col: string, val: unknown) { eqCalls[table].push([col, val]); return builder; },
                maybeSingle() { return Promise.resolve(result); },
                then(onFulfilled: any, onRejected: any) {
                    return Promise.resolve(result).then(onFulfilled, onRejected);
                },
            };
            return builder;
        },
    } as unknown as SupabaseClient;
    return { client, eqCalls };
}

describe('pickPermissionRoleFromJwt', () => {
    it('returns null for empty / missing role arrays', () => {
        expect(pickPermissionRoleFromJwt([])).toBeNull();
        expect(pickPermissionRoleFromJwt(null)).toBeNull();
        expect(pickPermissionRoleFromJwt(undefined)).toBeNull();
    });

    it('returns the single permission role_code when present', () => {
        expect(pickPermissionRoleFromJwt(['school_educator'])).toBe('school_educator');
        expect(pickPermissionRoleFromJwt(['college_admin'])).toBe('college_admin');
    });

    it('returns null when no JWT role is a permission role_code', () => {
        expect(pickPermissionRoleFromJwt(['learner'])).toBeNull();
        expect(pickPermissionRoleFromJwt(['recruiter', 'company_admin'])).toBeNull();
    });

    it('prefers admin-level over educator-level regardless of array order', () => {
        expect(pickPermissionRoleFromJwt(['school_educator', 'school_admin'])).toBe('school_admin');
        expect(pickPermissionRoleFromJwt(['school_admin', 'school_educator'])).toBe('school_admin');
        expect(pickPermissionRoleFromJwt(['college_educator', 'college_admin'])).toBe('college_admin');
    });

    it('follows the declared precedence list order for cross-domain collisions', () => {
        expect(pickPermissionRoleFromJwt(['school_admin', 'college_admin'])).toBe(
            PERMISSION_ROLE_CODE_PRECEDENCE[0]
        );
    });
});

describe('resolveSchoolRole', () => {
    it('(a) returns a JWT permission role_code directly WITHOUT any DB read', async () => {
        // explodingSupabase throws if .from() is ever called.
        const result = await resolveSchoolRole(
            explodingSupabase,
            makeUser({ roles: ['school_admin'] })
        );
        expect(result).toBe('school_admin');
    });

    it('(b) applies precedence when several permission role_codes are held', async () => {
        const result = await resolveSchoolRole(
            explodingSupabase,
            makeUser({ roles: ['school_educator', 'college_admin', 'school_admin'] })
        );
        expect(result).toBe('college_admin');
    });

    it('(c) falls through to school_educators read when no JWT permission role', async () => {
        const { client, eqCalls } = makeSupabaseMock({
            school_educators: {
                data: [{ role: 'class_teacher', school_id: 'school-9', account_status: 'active' }],
                error: null,
            },
        });

        const result = await resolveSchoolRole(
            client,
            makeUser({ roles: ['learner'], org_id: 'school-9', email: 'ct@example.com' })
        );

        expect(result).toBe('class_teacher');
        // scoped by user_id and by school_id (defaulted from the user's org_id)
        expect(eqCalls.school_educators).toEqual([
            ['user_id', 'user-1'],
            ['school_id', 'school-9'],
        ]);
    });

    it('(c2) uses opts overrides for the org scope of the DB lookup', async () => {
        const { client, eqCalls } = makeSupabaseMock({
            school_educators: {
                data: [{ role: 'principal', school_id: 'other-school', account_status: 'active' }],
                error: null,
            },
        });

        const result = await resolveSchoolRole(
            client,
            makeUser({ roles: ['learner'] }),
            { orgId: 'other-school', email: 'override@example.com' }
        );

        expect(result).toBe('principal');
        expect(eqCalls.school_educators).toEqual([
            ['user_id', 'user-1'],
            ['school_id', 'other-school'],
        ]);
    });

    it('(d) returns null when neither the JWT nor the DB yields a role', async () => {
        const { client } = makeSupabaseMock({
            school_educators: { data: [], error: null },
            teachers: { data: null, error: null },
        });

        const result = await resolveSchoolRole(
            client,
            makeUser({ roles: ['learner'] })
        );

        // no subject_teacher default — caller decides
        expect(result).toBeNull();
    });
});
