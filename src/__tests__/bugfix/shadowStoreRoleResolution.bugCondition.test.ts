/**
 * Bug-Condition Exploration Test: Shadow-Store Authorization-Resolution Violations
 *
 * Spec: rbac-architecture-violations-fix — Task 1.4 (Phase 0: Bug-Condition Exploration)
 * **Validates: Requirements 7.3, 7.4, 7.8**
 *
 * PURPOSE
 * -------
 * This test statically scans the Cloudflare Functions tree (`functions/`) and asserts
 * that the known shadow-store authorization-resolution defects documented in
 * bugfix.md §7.3 / §7.4 / §7.8 are present in the current (unfixed) source.
 *
 *   Bug — Role/identity resolved from app-DB shadow stores (bugfix.md §7.3, §7.4):
 *         When a Function needs to know a user's role/identity, 11+ handlers read it
 *         from an app-DB shadow store instead of the verified JWT `user.roles[]`.
 *         The competing shadow role sources are:
 *           a) the `users.role` column           (`.from('users').select(... role ...)`)
 *           b) the `user_roles` join table       (`.from('user_roles')`, often
 *              `.select('*, role:role_id(...)')`)
 *           c) the `teachers.role` column        (`.from('teachers').select(... role ...)`)
 *           d) the `school_educators.role` column(`.from('school_educators').select(... role ...)`)
 *         These authorities can drift from the SSO JWT (the canonical 16-role set
 *         resolved by `get_jwt_claims`).
 *
 *   Bug (§7.8) — Authorization from client-supplied stored user:
 *         `functions/api/school-admin/actions.ts` does `JSON.parse(storedUser)` and
 *         trusts `parsed.role === 'school_admin'` — deriving authorization from
 *         client-controllable data rather than the verified JWT.
 *
 * DETECTION
 * ---------
 * Uses the TypeScript compiler API to find genuine shadow-store ROLE reads:
 *   - any `.from('user_roles')` query (the table itself is a role authority); and
 *   - `.from('users' | 'teachers' | 'school_educators')` queries whose `.select(...)`
 *     column list explicitly includes the `role` column.
 * Requiring the `role` column in the `select(...)` avoids false positives from the
 * many legitimate `school_educators`/`users` reads that fetch `school_id`, names,
 * emails, etc. (which are identity/lookup reads, not role-authority reads).
 *
 * EXPECTED OUTCOME
 * ----------------
 * Because this is a Phase-0 exploration test, DETECTING these violations is the SUCCESS
 * condition: the test PASSES while the bugs exist. Once P2 (Task 12) replaces the
 * shadow-store authorization reads with JWT `user.roles`, these assertions will FAIL —
 * that flip is the signal the defect has been resolved (see Task 12 / 25.3).
 *
 * DO NOT fix the underlying bugs in this task. DO NOT modify source files other than
 * adding this test.
 */

import fc from 'fast-check';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { beforeAll, describe, expect, it } from 'vitest';

// Resolve the skillpassport project root from this test file location:
// src/__tests__/bugfix/<thisFile> -> project root is three levels up.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../');
const FUNCTIONS_ROOT = path.join(PROJECT_ROOT, 'functions');

/** The app-DB shadow tables that act as competing role authorities (bugfix.md §7.4). */
type ShadowTable = 'users' | 'user_roles' | 'teachers' | 'school_educators';

/**
 * Tables whose `role` column is the authority being read. For these, a query only
 * counts as a role read when its `.select(...)` explicitly includes the `role` column.
 */
const ROLE_COLUMN_TABLES = new Set<ShadowTable>(['users', 'teachers', 'school_educators']);

/**
 * The `user_roles` join table IS itself a role-authority store — any query against it
 * is a shadow-store role read regardless of the selected columns.
 */
const ROLE_TABLE = 'user_roles' as const;

/** Maps a shadow table to the §7.4 "source" label used in the evidence breakdown. */
function sourceLabel(table: ShadowTable): string {
    switch (table) {
        case 'users':
            return 'users.role';
        case 'user_roles':
            return 'user_roles';
        case 'teachers':
            return 'teachers.role';
        case 'school_educators':
            return 'school_educators.role';
    }
}

/** Recursively collect every .ts source file under `dir`, skipping tests / node_modules / .d.ts. */
function collectFunctionFiles(dir: string): string[] {
    const out: string[] = [];
    if (!fs.existsSync(dir)) return out;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
            out.push(...collectFunctionFiles(full));
        } else if (/\.ts$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) {
            out.push(full);
        }
    }
    return out;
}

/** Climb to the outermost node of a method chain (PropertyAccess / Call / Await / NonNull). */
function getChainRoot(node: ts.Node): ts.Node {
    let cur: ts.Node = node;
    while (
        cur.parent &&
        (ts.isPropertyAccessExpression(cur.parent) ||
            ts.isCallExpression(cur.parent) ||
            ts.isAwaitExpression(cur.parent) ||
            ts.isNonNullExpression(cur.parent) ||
            ts.isParenthesizedExpression(cur.parent))
    ) {
        cur = cur.parent;
    }
    return cur;
}

/**
 * Returns true if, somewhere inside `chainRoot`, there is a `.select('...')` call whose
 * string-literal argument names the `role` column (e.g. 'role', 'role, organizationId',
 * 'id, email, full_name, role'). Used for the role-column tables.
 */
function selectIncludesRoleColumn(chainRoot: ts.Node): boolean {
    let found = false;
    const visit = (n: ts.Node): void => {
        if (found) return;
        if (
            ts.isCallExpression(n) &&
            ts.isPropertyAccessExpression(n.expression) &&
            n.expression.name.text === 'select' &&
            n.arguments.length > 0 &&
            ts.isStringLiteralLike(n.arguments[0])
        ) {
            const cols = n.arguments[0].text.split(',').map((c) => c.trim());
            // Exact `role` column, or a `role:` embedded resource alias (e.g. role:role_id(...)).
            if (cols.some((c) => c === 'role' || /^role\s*:/.test(c))) {
                found = true;
                return;
            }
        }
        ts.forEachChild(n, visit);
    };
    visit(chainRoot);
    return found;
}

interface ShadowRoleRead {
    table: ShadowTable;
    source: string; // §7.4 source label
    snippet: string;
}

/**
 * Find genuine shadow-store role reads in a single source file.
 *
 * A `.from('<shadow table>')` query qualifies when:
 *   - the table is `user_roles` (the join table is itself a role authority), OR
 *   - the table is `users`/`teachers`/`school_educators` AND the surrounding chain's
 *     `.select(...)` explicitly includes the `role` column.
 */
function findShadowStoreRoleReads(filePath: string, source: string): ShadowRoleRead[] {
    const sf = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const results: ShadowRoleRead[] = [];

    const visit = (node: ts.Node): void => {
        if (
            ts.isCallExpression(node) &&
            ts.isPropertyAccessExpression(node.expression) &&
            node.expression.name.text === 'from' &&
            node.arguments.length === 1 &&
            ts.isStringLiteralLike(node.arguments[0])
        ) {
            const table = node.arguments[0].text as ShadowTable;
            const chainRoot = getChainRoot(node);

            const qualifies =
                table === ROLE_TABLE ||
                (ROLE_COLUMN_TABLES.has(table) && selectIncludesRoleColumn(chainRoot));

            if (qualifies) {
                results.push({
                    table,
                    source: sourceLabel(table),
                    snippet: chainRoot.getText(sf).replace(/\s+/g, ' ').slice(0, 140),
                });
            }
        }
        ts.forEachChild(node, visit);
    };
    visit(sf);
    return results;
}

/**
 * Detect the §7.8 client-supplied authorization read:
 *   `JSON.parse(storedUser)` whose parsed object's `.role` is trusted for an authz
 *   decision (e.g. `parsed.role === 'school_admin'`).
 */
function findStoredUserRoleTrust(source: string): boolean {
    return /JSON\.parse\(\s*storedUser\s*\)/.test(source) && /\bparsed\.role\b/.test(source);
}

describe('Bug Condition: Functions resolve authorization from shadow stores (static analysis)', () => {
    let functionFiles: string[] = [];

    // Evidence: relative file path -> the shadow-store role reads found in it.
    const shadowReadFiles: { file: string; reads: ShadowRoleRead[] }[] = [];

    // §7.8 evidence: files trusting role from a client-supplied stored user.
    const storedUserTrustFiles: string[] = [];

    beforeAll(() => {
        functionFiles = collectFunctionFiles(FUNCTIONS_ROOT);

        for (const abs of functionFiles) {
            const src = fs.readFileSync(abs, 'utf8');
            const rel = path.relative(PROJECT_ROOT, abs);

            // Cheap pre-filter before the AST pass.
            if (src.includes('.from(')) {
                const reads = findShadowStoreRoleReads(abs, src);
                if (reads.length > 0) {
                    shadowReadFiles.push({ file: rel, reads });
                }
            }

            if (findStoredUserRoleTrust(src)) {
                storedUserTrustFiles.push(rel);
            }
        }

        shadowReadFiles.sort((a, b) => a.file.localeCompare(b.file));
        storedUserTrustFiles.sort();

        // Surface evidence for the audit trail, broken down by §7.4 source.
        const bySource = (label: string): string[] =>
            shadowReadFiles
                .filter((f) => f.reads.some((r) => r.source === label))
                .map((f) => f.file);

        // eslint-disable-next-line no-console
        console.log(
            '\n=== Shadow-store authorization-resolution evidence (bug reproduced) ===\n' +
            `Files reading role/identity from a shadow store: ${shadowReadFiles.length}\n` +
            shadowReadFiles
                .map((f) => `  - ${f.file}\n      ${f.reads.map((r) => `[${r.source}] ${r.snippet}`).join('\n      ')}`)
                .join('\n') +
            '\n\n--- Breakdown by source ---\n' +
            `  users.role            (${bySource('users.role').length}): ${bySource('users.role').join(', ') || '(none)'}\n` +
            `  user_roles            (${bySource('user_roles').length}): ${bySource('user_roles').join(', ') || '(none)'}\n` +
            `  teachers.role         (${bySource('teachers.role').length}): ${bySource('teachers.role').join(', ') || '(none)'}\n` +
            `  school_educators.role (${bySource('school_educators.role').length}): ${bySource('school_educators.role').join(', ') || '(none)'}\n` +
            `\n§7.8 client-supplied stored-user role trust: ${storedUserTrustFiles.join(', ') || '(none)'}\n` +
            '=== end evidence ===\n',
        );
    });

    /**
     * Sanity: the scan must have found the functions tree and source files. An empty scan
     * would invalidate the exploration (e.g. wrong project root / functions path).
     */
    it('resolves the functions/ tree and scans handler files', () => {
        expect(fs.existsSync(FUNCTIONS_ROOT), `functions/ tree not found at ${FUNCTIONS_ROOT}`).toBe(true);
        expect(functionFiles.length, 'Expected to find .ts handler files under functions/').toBeGreaterThan(0);
    });

    /**
     * Bug §7.3/§7.4 — At least one handler reads role/identity from a shadow store.
     * **Validates: Requirements 7.3, 7.4**
     */
    it('detects >= 1 handler reading role from a shadow store (users.role / user_roles / teachers.role / school_educators.role)', () => {
        expect(
            shadowReadFiles.length,
            'Expected at least one Function handler to read a role from an app-DB shadow store',
        ).toBeGreaterThanOrEqual(1);

        // bugfix.md §7.3 documents 11+ such handlers; assert we reproduce the bulk of them
        // to confirm this is the systemic violation described, not an isolated match.
        expect(
            shadowReadFiles.length,
            `Expected the documented systemic violation (~8+ handlers per bugfix.md §7.3). ` +
            `Found ${shadowReadFiles.length}: ${shadowReadFiles.map((f) => f.file).join(', ')}`,
        ).toBeGreaterThanOrEqual(8);
    });

    /**
     * Spot-check known hosts from bugfix.md §7.3 to anchor the evidence to the
     * documented violation sites.
     * **Validates: Requirements 7.3**
     */
    it('reproduces the documented shadow-store host files (§7.3)', () => {
        const found = shadowReadFiles.map((f) => f.file);
        const expectedHosts = [
            'functions/api/school-admin/actions.ts',
            'functions/api/school-admin/curriculum.ts',
            'functions/api/user/handlers/actions.ts',
            'functions/api/user/handlers/authenticated.ts',
            'functions/api/user/handlers/management.ts',
            'functions/api/organization/handler.ts',
            'functions/api/learner-profile/actions.ts',
            'functions/api/college-admin/[[path]].ts',
            'functions/api/college-admin/school-admin.ts',
            'functions/api/college-admin/actions.ts',
            'functions/api/college-admin/faculty.ts',
        ];
        for (const host of expectedHosts) {
            expect(
                found.includes(host),
                `Expected a shadow-store role read in ${host}. Found: ${found.join(', ')}`,
            ).toBe(true);
        }
    });

    /**
     * §7.4 — all four competing shadow role sources are represented in the codebase,
     * confirming the "at least 5 parallel role sources" fragmentation (the JWT being the
     * 5th, canonical, source).
     * **Validates: Requirements 7.4**
     */
    it('reproduces all four shadow role sources (users.role, user_roles, teachers.role, school_educators.role)', () => {
        const sources = new Set(shadowReadFiles.flatMap((f) => f.reads.map((r) => r.source)));
        for (const expected of ['users.role', 'user_roles', 'teachers.role', 'school_educators.role']) {
            expect(
                sources.has(expected),
                `Expected at least one handler reading authorization from ${expected}. Found sources: ${[...sources].join(', ')}`,
            ).toBe(true);
        }
    });

    /**
     * Property: every detected read genuinely targets a shadow role authority — either
     * the `user_roles` table, or a `users`/`teachers`/`school_educators` query that
     * selects the `role` column. This guards the count against false positives (e.g.
     * `school_educators` reads that fetch only `school_id`/names). Sampled across all
     * discovered reads.
     * **Validates: Requirements 7.3, 7.4**
     */
    it('property: every detected read targets a shadow role authority', () => {
        const allReads = shadowReadFiles.flatMap((f) => f.reads);
        expect(allReads.length).toBeGreaterThan(0);

        fc.assert(
            fc.property(fc.constantFrom(...allReads), (read) => {
                if (read.table === 'user_roles') {
                    return read.source === 'user_roles';
                }
                // role-column tables: snippet must reference both the table and a role column.
                const isRoleColumnTable = ROLE_COLUMN_TABLES.has(read.table);
                const snippetHasRole = /\brole\b/.test(read.snippet);
                return isRoleColumnTable && snippetHasRole;
            }),
            { numRuns: Math.max(20, allReads.length * 2) },
        );
    });

    /**
     * Bug §7.8 — authorization is derived from a client-supplied stored user
     * (`JSON.parse(storedUser)` then trusting `parsed.role`) in school-admin/actions.ts.
     * **Validates: Requirements 7.8**
     */
    it('detects the client-supplied stored-user role trust in school-admin/actions.ts (§7.8)', () => {
        expect(
            storedUserTrustFiles.length,
            'Expected at least one handler trusting role from a client-supplied stored user (JSON.parse(storedUser) + parsed.role)',
        ).toBeGreaterThanOrEqual(1);

        expect(
            storedUserTrustFiles.includes('functions/api/school-admin/actions.ts'),
            `Expected the §7.8 violation in functions/api/school-admin/actions.ts. Found: ${storedUserTrustFiles.join(', ')}`,
        ).toBe(true);
    });
});
