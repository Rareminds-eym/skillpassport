/**
 * RBAC Property Test: Vestigial-RLS-removal invariant (Phase P4 / FC-12)
 *
 * Spec: rbac-architecture-violations-fix — Task 21.3 (Phase P4)
 * **Validates: Requirements 8.2, 8.2a, 8.3**
 *
 * Backs:
 *   - Assessment .kiro/verifications/2026-06-07_p4-rls-assessment.md (task 21.2)
 *   - Migration skillpassport/supabase/migrations/20260603000005_reconcile_users_role_rls_policies.sql
 *
 * ───────────────────────────────────────────────────────────────────────────
 * THE EQUIVALENCE / "CONFIRMED-VESTIGIAL" ARGUMENT THIS TEST ENCODES
 * ───────────────────────────────────────────────────────────────────────────
 * Task 21.2 concluded that DROPping the 28 assessed RLS policies (the
 * `users.role` / `public.user_role` enum / `auth.jwt()->>'role'` /
 * `auth.users.raw_user_meta_data->>'role'` "Admins can…/Super admins can…"
 * gates) is BEHAVIOR-PRESERVING. A row-level-security policy only gates access
 * when BOTH (a) the querying client is NOT `service_role` AND (b) the policy's
 * predicate can ever evaluate TRUE for that client. In this architecture there
 * are exactly TWO client types, and the policies gate NOTHING for either:
 *
 *   PREMISE 1 — server side bypasses RLS.
 *     Every server-side read/write of the scoped tables happens in Cloudflare
 *     Functions via the `service_role` client (`functions/lib/supabase.ts ::
 *     getServiceClient` / `createSupabaseAdminClient`, built with
 *     `SUPABASE_SERVICE_ROLE_KEY`). `service_role` BYPASSES RLS entirely, so the
 *     policies gate nothing on the server (bugfix.md CC-2).
 *
 *   PREMISE 2 — the frontend client is anon AND sessionless ⇒ auth.uid() is NULL.
 *     `src/shared/api/supabaseClient.ts` builds the ONLY frontend client with the
 *     ANON key and NO auth/session options. Per the `no-supabase-auth` steering
 *     the app authenticates via the SSO worker and NEVER calls `supabase.auth.*`
 *     to establish a Supabase-Auth session. Therefore for that client:
 *       • `auth.uid()` is NULL  → every `auth.uid() = …` / `… IN (users WHERE …)`
 *         / `users.id = auth.uid()` predicate is FALSE;
 *       • `auth.jwt() ->> 'role'` is the anon token's claim → never 'admin' / an
 *         enum value;
 *       • the `raw_user_meta_data` subqueries hang off `auth.uid()` → empty.
 *
 *   PREMISE 3 — the anon frontend never even touches the scoped tables.
 *     Independent of (2): the frontend `supabase` client issues NO `.from(<scoped
 *     table>)` against any of the 28 policies' tables, so the dropped predicates
 *     never participated in any anon-client query in the first place.
 *
 *   PREMISE 4 — the removal is SCOPED to vestigial policies only.
 *     The migration performs `DROP POLICY` statements EXCLUSIVELY (no table/type/
 *     data mutation, no `CREATE POLICY` rewrite) and drops EXACTLY the assessed
 *     28-policy set — nothing more, nothing less.
 *
 * Under premises 1–4, allow/deny outcomes are IDENTICAL before and after the
 * policies are dropped, for the only clients that exist. ⇒ confirmed vestigial.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * WHY THIS TEST IS A REAL GUARD (not trivially green)
 * ───────────────────────────────────────────────────────────────────────────
 * It FAILS — flagging that the dropped policies are NO LONGER vestigial — if any
 * premise is broken on the current tree:
 *   • Someone makes the frontend establish a Supabase-Auth session
 *     (supabase.auth signIn / signUp / setSession / getSession / onAuthStateChange)
 *     → breaks Premise 2 (auth.uid() would no longer be NULL).               [P2]
 *   • The anon frontend starts reading/writing one of the 28 scoped tables
 *     directly (`supabase.from('<scoped table>')`)                            [P3]
 *   • `getServiceClient` / `createSupabaseAdminClient` stops being built with
 *     `SUPABASE_SERVICE_ROLE_KEY` (loses the RLS-bypass basis)                 [P1]
 *   • The migration grows a non-DROP-POLICY statement, or drifts away from the
 *     assessed 28-policy set                                                   [P4]
 *
 * DO NOT weaken these assertions to force a pass. If a premise genuinely breaks,
 * the dropped policies may have become real gates — re-open the 21.2 assessment
 * (rewrite/keep the affected policy) rather than relaxing the test.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * LIVE READ-ONLY CONFIRMATION (recorded 2026-06-07, against the local DB)
 * ───────────────────────────────────────────────────────────────────────────
 * A read-only `pg_policies` query (no mutation, migration NOT applied) confirmed
 * the assessment inventory: all 28 target policies CURRENTLY EXIST and every one
 * carries the vestigial signature —
 *   13 reference the `public.user_role` enum / `users.role`  (Group A, 22.x blockers)
 *   11 reference `auth.users.raw_user_meta_data ->> 'role'`  (Group C, library)
 *    4 reference `auth.jwt() ->> 'role' = 'admin'`           (Group B ×1 + Group D ×3)
 *   24 of 28 also reference `auth.uid()`.
 * None reference `service_role` as an allow rule (those allow-policies are kept,
 * not in this set). This static test pins that same inventory in-tree.
 */

import fc from 'fast-check';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

// src/__tests__/rbac/<thisFile> -> project root (skillpassport/) is three levels up.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../');
const SRC_ROOT = path.join(PROJECT_ROOT, 'src');

const MIGRATION_REL = 'supabase/migrations/20260603000005_reconcile_users_role_rls_policies.sql';
const FRONTEND_CLIENT_REL = 'src/shared/api/supabaseClient.ts';
const SERVICE_CLIENT_REL = 'functions/lib/supabase.ts';

const read = (relPath: string): string => fs.readFileSync(path.join(PROJECT_ROOT, relPath), 'utf8');
const exists = (relPath: string): boolean => fs.existsSync(path.join(PROJECT_ROOT, relPath));

// ════════════════════════════════════════════════════════════════════════════
// The 28 assessed policies (assessment §1 Groups A–D / migration sections 1–4).
// Each is { table, policy }. This is the authoritative in-tree inventory that
// the migration must match EXACTLY (Premise 4) and that lives on the 18 tables
// the anon frontend must never touch (Premise 3).
// ════════════════════════════════════════════════════════════════════════════

interface ScopedPolicy {
    table: string;
    policy: string;
    /** signature class — for documentation + the per-group property assertions. */
    sig: 'enum' | 'raw_user_meta_data' | 'auth.jwt';
    group: 'A' | 'B' | 'C' | 'D';
}

const EXPECTED_DROPPED_POLICIES: ScopedPolicy[] = [
    // ── Group A (13): public.user_role enum / users.role — task 22.x blockers ──
    { table: 'license_assignments', policy: 'Admins can create license assignments', sig: 'enum', group: 'A' },
    { table: 'license_pools', policy: 'Admins can create license pools', sig: 'enum', group: 'A' },
    { table: 'license_pools', policy: 'Admins can delete license pools', sig: 'enum', group: 'A' },
    { table: 'license_pools', policy: 'Admins can update license pools', sig: 'enum', group: 'A' },
    { table: 'license_pools', policy: 'Admins can view own organization license pools', sig: 'enum', group: 'A' },
    { table: 'class_swap_requests', policy: 'Admins can manage all swap requests', sig: 'enum', group: 'A' },
    { table: 'class_swap_history', policy: 'Admins can view all swap history', sig: 'enum', group: 'A' },
    { table: 'external_assessment_attempts', policy: 'Admins can view all external assessment attempts', sig: 'enum', group: 'A' },
    { table: 'college_curriculums', policy: 'College admins can update their curriculum', sig: 'enum', group: 'A' },
    { table: 'college_curriculums', policy: 'College admins can view their curriculum', sig: 'enum', group: 'A' },
    { table: 'college_curriculums', policy: 'University admins can update curriculum for approval', sig: 'enum', group: 'A' },
    { table: 'college_curriculums', policy: 'University admins can view affiliated college curriculum', sig: 'enum', group: 'A' },
    { table: 'adaptive_question_bank', policy: 'Super admins can manage questions', sig: 'enum', group: 'A' },

    // ── Group B (1): user_categories — auth.jwt() (named in task) ──
    { table: 'user_categories', policy: 'Admins can manage categories', sig: 'auth.jwt', group: 'B' },

    // ── Group C (11): library — auth.users.raw_user_meta_data ->> 'role' ──
    { table: 'library_book_issues', policy: 'Admins can view all book issues', sig: 'raw_user_meta_data', group: 'C' },
    { table: 'library_book_issues_college', policy: 'Admins can view all book issues', sig: 'raw_user_meta_data', group: 'C' },
    { table: 'library_settings', policy: 'Admins can view library settings', sig: 'raw_user_meta_data', group: 'C' },
    { table: 'library_settings_college', policy: 'Admins can view library settings', sig: 'raw_user_meta_data', group: 'C' },
    { table: 'library_book_issues', policy: 'Only admins can manage book issues', sig: 'raw_user_meta_data', group: 'C' },
    { table: 'library_book_issues_college', policy: 'Only admins can manage book issues', sig: 'raw_user_meta_data', group: 'C' },
    { table: 'library_books_college', policy: 'Only admins can manage library books', sig: 'raw_user_meta_data', group: 'C' },
    { table: 'library_categories', policy: 'Only admins can manage library categories', sig: 'raw_user_meta_data', group: 'C' },
    { table: 'library_categories_college', policy: 'Only admins can manage library categories', sig: 'raw_user_meta_data', group: 'C' },
    { table: 'library_settings', policy: 'Only admins can manage library settings', sig: 'raw_user_meta_data', group: 'C' },
    { table: 'library_settings_college', policy: 'Only admins can manage library settings', sig: 'raw_user_meta_data', group: 'C' },

    // ── Group D (3): other auth.jwt() ->> 'role' = 'admin' gates (optional/flagged) ──
    { table: 'document_access_history', policy: 'Admins can view all document access', sig: 'auth.jwt', group: 'D' },
    { table: 'user_profiles', policy: 'Admins can view all profiles', sig: 'auth.jwt', group: 'D' },
    { table: 'user_state_history', policy: 'Admins can view all state history', sig: 'auth.jwt', group: 'D' },
];

/** The 18 distinct tables carrying the scoped policies (Premise 3 set). */
const SCOPED_TABLES = Array.from(new Set(EXPECTED_DROPPED_POLICIES.map((p) => p.table))).sort();

const polKey = (table: string, policy: string): string => `${table}::${policy} `;

// ════════════════════════════════════════════════════════════════════════════
// Helpers — collect non-test frontend source, strip SQL line comments, parse the
// migration's DROP POLICY statements.
// ════════════════════════════════════════════════════════════════════════════

/** Recursively collect frontend .ts/.tsx source files, EXCLUDING tests / .d.ts. */
function collectFrontendSourceFiles(dir: string): string[] {
    const out: string[] = [];
    if (!fs.existsSync(dir)) return out;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
            out.push(...collectFrontendSourceFiles(full));
        } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.d\.ts$/.test(entry.name) && !/\.test\.(ts|tsx)$/.test(entry.name)) {
            out.push(full);
        }
    }
    return out;
}

/** Remove `-- …` line comments so comment prose can't trip the statement scan. */
function stripSqlLineComments(sql: string): string {
    return sql.replace(/--[^\n]*/g, '');
}

/** Parse every `DROP POLICY IF EXISTS "<name>" ON[public.]<table>; ` statement. */
function parseDropPolicyStatements(sql: string): { table: string; policy: string }[] {
    const re = /DROP\s+POLICY\s+IF\s+EXISTS\s+"([^"]+)"\s+ON\s+(?:public\.)?(\w+)\s*;/gi;
    const out: { table: string; policy: string }[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(sql)) !== null) {
        out.push({ policy: m[1], table: m[2] });
    }
    return out;
}

// Supabase-Auth session-establishing surface (Premise 2). If any of these appear
// in the (non-test) frontend, the app has a Supabase-Auth session and auth.uid()
// is no longer guaranteed NULL — the dropped policies could become real gates.
const SUPABASE_AUTH_SESSION_RE =
    /\bsupabase\s*\.\s*auth\s*\.\s*(signInWithPassword|signInWithOtp|signInWithOAuth|signIn|signUp|setSession|getSession|refreshSession|onAuthStateChange|verifyOtp|exchangeCodeForSession)\b/;

// Anon-frontend access to a scoped table (Premise 3): supabase.from('<table>').
function frontendScopedTableHits(source: string): string[] {
    const hits: string[] = [];
    for (const table of SCOPED_TABLES) {
        const re = new RegExp(`\\bsupabase\\s *\\.\\s * from\\(\\s * ['"\`]${table}['"\`]\\s*\\)`, 'g');
        if (re.test(source)) hits.push(table);
    }
    return hits;
}

// ════════════════════════════════════════════════════════════════════════════

describe('RBAC FC-12: vestigial-RLS-removal invariant (P4 / backs 21.2 + 20260603000005)', () => {
    let frontendFiles: string[] = [];
    let migrationSql = '';
    let migrationSqlNoComments = '';
    let droppedPolicies: { table: string; policy: string }[] = [];

    // Premise-2 violations: non-test frontend files that establish a Supabase-Auth session.
    const sessionViolations: string[] = [];
    // Premise-3 violations: non-test frontend files reading a scoped table via the anon client.
    const scopedTableViolations: { file: string; tables: string[] }[] = [];

    beforeAll(() => {
        frontendFiles = collectFrontendSourceFiles(SRC_ROOT);
        migrationSql = read(MIGRATION_REL);
        migrationSqlNoComments = stripSqlLineComments(migrationSql);
        droppedPolicies = parseDropPolicyStatements(migrationSqlNoComments);

        for (const abs of frontendFiles) {
            const src = fs.readFileSync(abs, 'utf8');
            const relPath = path.relative(PROJECT_ROOT, abs).split(path.sep).join('/');
            if (SUPABASE_AUTH_SESSION_RE.test(src)) sessionViolations.push(relPath);
            const tables = frontendScopedTableHits(src);
            if (tables.length > 0) scopedTableViolations.push({ file: relPath, tables });
        }
        sessionViolations.sort();
        scopedTableViolations.sort((a, b) => a.file.localeCompare(b.file));
    });

    it('resolves the frontend src/ tree and the migration', () => {
        expect(fs.existsSync(SRC_ROOT), `src/ tree not found at ${SRC_ROOT}`).toBe(true);
        expect(frontendFiles.length, 'Expected to find frontend .ts/.tsx source files').toBeGreaterThan(0);
        expect(exists(MIGRATION_REL), `Migration not found: ${MIGRATION_REL}`).toBe(true);
    });

    // ──────────────────────────────────────────────────────────────────────────
    // PREMISE 1 — server side bypasses RLS (service_role basis).
    // ──────────────────────────────────────────────────────────────────────────
    describe('Premise 1: Functions use service_role (RLS bypassed)', () => {
        it('getServiceClient is built with SUPABASE_SERVICE_ROLE_KEY (the RLS-bypass basis)', () => {
            expect(exists(SERVICE_CLIENT_REL), `${SERVICE_CLIENT_REL} must exist`).toBe(true);
            const src = read(SERVICE_CLIENT_REL);
            expect(
                /export\s+function\s+getServiceClient\b/.test(src),
                `${SERVICE_CLIENT_REL} must export getServiceClient (the server-side service_role client).`,
            ).toBe(true);
            // getServiceClient's body must construct the client with the service-role key.
            const body = src.slice(src.indexOf('getServiceClient'));
            expect(
                /createClient\([^)]*SUPABASE_SERVICE_ROLE_KEY/.test(body),
                'getServiceClient must build the client with SUPABASE_SERVICE_ROLE_KEY — this is the basis for ' +
                '"server side bypasses RLS". If it switched to the anon key, the dropped policies would no longer ' +
                'be vestigial on the server.',
            ).toBe(true);
        });

        it('createSupabaseAdminClient (privileged client) also uses SUPABASE_SERVICE_ROLE_KEY', () => {
            const src = read(SERVICE_CLIENT_REL);
            expect(
                /createSupabaseAdminClient[\s\S]*?createClient\([^)]*SUPABASE_SERVICE_ROLE_KEY/.test(src),
                'createSupabaseAdminClient must build with SUPABASE_SERVICE_ROLE_KEY (privileged, RLS-bypassing).',
            ).toBe(true);
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    // PREMISE 2 — frontend client is anon + sessionless ⇒ auth.uid() is NULL.
    // ──────────────────────────────────────────────────────────────────────────
    describe('Premise 2: frontend client is anon + sessionless (auth.uid() is NULL)', () => {
        it('supabaseClient.ts builds the frontend client with the ANON key', () => {
            expect(exists(FRONTEND_CLIENT_REL), `${FRONTEND_CLIENT_REL} must exist`).toBe(true);
            const src = read(FRONTEND_CLIENT_REL);
            expect(
                /createClient\(\s*[\w$]*[Uu]rl[\w$]*\s*,\s*[\w$]*[Aa]non[\w$]*\s*[,)]/.test(src),
                'The frontend client must be constructed with the ANON key (VITE_SUPABASE_ANON_KEY), not a service key. ' +
                'An anon client with no session is the basis for "auth.uid() is NULL on the frontend".',
            ).toBe(true);
            expect(
                /VITE_SUPABASE_ANON_KEY/.test(src),
                'The frontend client key must come from VITE_SUPABASE_ANON_KEY.',
            ).toBe(true);
            expect(
                /SERVICE_ROLE/.test(src),
                'The frontend client must NEVER reference a SERVICE_ROLE key.',
            ).toBe(false);
        });

        it('supabaseClient.ts establishes NO Supabase-Auth session (no persistSession / auth.* session options)', () => {
            const src = read(FRONTEND_CLIENT_REL);
            // No session-persistence / auth-session option object on the frontend client.
            expect(/persistSession\s*:\s*true/.test(src), 'frontend client must not persist a Supabase-Auth session.').toBe(false);
            expect(
                SUPABASE_AUTH_SESSION_RE.test(src),
                'supabaseClient.ts must not call supabase.auth.* to establish a session.',
            ).toBe(false);
        });

        it('NO non-test frontend file establishes a Supabase-Auth session (no-supabase-auth steering)', () => {
            expect(
                sessionViolations,
                'Premise 2 VIOLATED — the following frontend file(s) establish a Supabase-Auth session ' +
                '(supabase.auth.signIn*/signUp/setSession/getSession/onAuthStateChange/…):\n' +
                sessionViolations.map((f) => `  - ${f}`).join('\n') +
                '\n\nIf the frontend establishes a Supabase-Auth session, `auth.uid()` is no longer NULL and the 28 ' +
                'dropped RLS policies may become REAL gates — i.e. removing them in 20260603000005 would NO LONGER be ' +
                'behavior-preserving. Re-open the 21.2 assessment for the affected tables instead of relaxing this test.',
            ).toEqual([]);
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    // PREMISE 3 — the anon frontend never touches the 18 scoped tables.
    // ──────────────────────────────────────────────────────────────────────────
    describe('Premise 3: anon frontend never queries the scoped tables', () => {
        it('no non-test frontend file reads/writes a scoped table via the anon supabase client', () => {
            expect(
                scopedTableViolations,
                'Premise 3 VIOLATED — frontend file(s) access a scoped (policy-bearing) table via the anon client:\n' +
                scopedTableViolations.map((v) => `  - ${v.file}: ${v.tables.join(', ')}`).join('\n') +
                '\n\nThese 28 policies sit on tables the anon frontend is not supposed to touch (all access is via ' +
                'service_role Functions). If the anon client now queries one, the dropped predicate could change its ' +
                'allow/deny outcome — the policy would no longer be vestigial. Route the access through an enforcing ' +
                'Function, or re-assess the affected policy.',
            ).toEqual([]);
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    // PREMISE 4 — the migration is DROP-POLICY-only and matches the assessed set.
    // ──────────────────────────────────────────────────────────────────────────
    describe('Premise 4: migration is scoped to dropping exactly the assessed vestigial policies', () => {
        it('contains ONLY DROP POLICY statements — no table/type/data mutation, no CREATE POLICY rewrite', () => {
            const sql = migrationSqlNoComments;
            const forbidden: { label: string; re: RegExp }[] = [
                { label: 'CREATE POLICY (a rewrite — out of scope; assessment chose DROP not REWRITE)', re: /\bCREATE\s+POLICY\b/i },
                { label: 'ALTER POLICY', re: /\bALTER\s+POLICY\b/i },
                { label: 'CREATE/ALTER/DROP TABLE', re: /\b(CREATE|ALTER|DROP)\s+TABLE\b/i },
                { label: 'DROP/CREATE TYPE (that is task 22, not 21.3)', re: /\b(DROP|CREATE|ALTER)\s+TYPE\b/i },
                { label: 'DROP COLUMN (users.role drop is task 22)', re: /\bDROP\s+COLUMN\b/i },
                { label: 'DML INSERT/UPDATE/DELETE/TRUNCATE', re: /\b(INSERT\s+INTO|UPDATE\s+\w|DELETE\s+FROM|TRUNCATE)\b/i },
                { label: 'GRANT/REVOKE', re: /\b(GRANT|REVOKE)\b/i },
                { label: 'CREATE/DROP FUNCTION/TRIGGER/INDEX/VIEW', re: /\b(CREATE|DROP|ALTER)\s+(FUNCTION|TRIGGER|INDEX|VIEW|MATERIALIZED)\b/i },
                { label: 'ENABLE/DISABLE ROW LEVEL SECURITY', re: /ROW\s+LEVEL\s+SECURITY/i },
            ];
            const found = forbidden.filter((f) => f.re.test(sql)).map((f) => f.label);
            expect(
                found,
                `Migration ${MIGRATION_REL} must contain ONLY \`DROP POLICY\` statements (plus BEGIN/COMMIT). ` +
                `Found out-of-scope statement(s): ${found.join('; ')}. ` +
                `Vestigial-policy removal must not mutate tables/types/data or rewrite policies.`,
            ).toEqual([]);
        });

        it('every executable statement is a DROP POLICY (BEGIN/COMMIT aside)', () => {
            const statements = migrationSqlNoComments
                .split(';')
                .map((s) => s.trim())
                .filter((s) => s.length > 0)
                .map((s) => s.replace(/\s+/g, ' '));
            const nonConforming = statements.filter(
                (s) => !/^DROP\s+POLICY\s+IF\s+EXISTS\b/i.test(s) && !/^BEGIN$/i.test(s) && !/^COMMIT$/i.test(s),
            );
            expect(
                nonConforming,
                `Migration must consist solely of BEGIN / COMMIT / DROP POLICY statements. Offending statement(s):\n` +
                nonConforming.map((s) => `  - ${s.slice(0, 120)}`).join('\n'),
            ).toEqual([]);
        });

        it('drops EXACTLY the assessed 28-policy set (no missing, no extra)', () => {
            const expectedKeys = new Set(EXPECTED_DROPPED_POLICIES.map((p) => polKey(p.table, p.policy)));
            const actualKeys = new Set(droppedPolicies.map((p) => polKey(p.table, p.policy)));

            const missing = [...expectedKeys].filter((k) => !actualKeys.has(k)).sort();
            const extra = [...actualKeys].filter((k) => !expectedKeys.has(k)).sort();

            expect(
                missing,
                `Migration is MISSING DROP statements for assessed vestigial policies:\n${missing.map((k) => `  - ${k}`).join('\n')}`,
            ).toEqual([]);
            expect(
                extra,
                `Migration drops policies NOT in the assessed 28-policy set (scope creep — re-assess before dropping):\n${extra.map((k) => `  - ${k}`).join('\n')}`,
            ).toEqual([]);
            expect(actualKeys.size, 'Expected exactly 28 distinct dropped policies.').toBe(28);
        });

        it('the non-role "Learners can read active questions" policy on adaptive_question_bank is NOT dropped (kept intact)', () => {
            const keys = new Set(droppedPolicies.map((p) => polKey(p.table, p.policy)));
            expect(
                keys.has(polKey('adaptive_question_bank', 'Learners can read active questions')),
                'The learner read policy must NOT be dropped — only the super_admin gate is removed.',
            ).toBe(false);
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    // PROPERTY assertions (fast-check) over the inventory.
    // ──────────────────────────────────────────────────────────────────────────
    describe('properties over the assessed inventory', () => {
        it('property: every assessed policy carries a recognized vestigial signature and is on a scoped table', () => {
            fc.assert(
                fc.property(fc.constantFrom(...EXPECTED_DROPPED_POLICIES), (p) => {
                    return (
                        ['enum', 'raw_user_meta_data', 'auth.jwt'].includes(p.sig) &&
                        ['A', 'B', 'C', 'D'].includes(p.group) &&
                        SCOPED_TABLES.includes(p.table) &&
                        p.policy.length > 0
                    );
                }),
                { numRuns: Math.min(50, EXPECTED_DROPPED_POLICIES.length) },
            );
        });

        it('property: every assessed policy appears as a DROP POLICY in the migration', () => {
            const actualKeys = new Set(droppedPolicies.map((p) => polKey(p.table, p.policy)));
            fc.assert(
                fc.property(fc.constantFrom(...EXPECTED_DROPPED_POLICIES), (p) => actualKeys.has(polKey(p.table, p.policy))),
                { numRuns: Math.min(50, EXPECTED_DROPPED_POLICIES.length) },
            );
        });

        it('property: the signature-group counts match the assessment (13 enum / 11 raw_user_meta_data / 4 auth.jwt)', () => {
            const count = (sig: ScopedPolicy['sig']) => EXPECTED_DROPPED_POLICIES.filter((p) => p.sig === sig).length;
            expect(count('enum')).toBe(13);
            expect(count('raw_user_meta_data')).toBe(11);
            expect(count('auth.jwt')).toBe(4);
            expect(EXPECTED_DROPPED_POLICIES.length).toBe(28);
        });
    });
});
