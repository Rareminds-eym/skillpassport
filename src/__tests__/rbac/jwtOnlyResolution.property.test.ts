/**
 * RBAC Guard / Property Test: JWT-only authorization resolution (Property 7 / FC-10)
 *
 * Spec: rbac-architecture-violations-fix — Task 12.3 (Phase P2)
 * **Validates: Requirements 7.3, 7.4, 7.5, 7.8, 6.1**
 *
 * WHAT THIS GUARDS
 * ----------------
 * This is the durable, FIXED-state counterpart to the Task 1.4 exploration test
 * (`src/__tests__/bugfix/shadowStoreRoleResolution.bugCondition.test.ts`, which
 * asserts shadow-store authorization reads EXIST on the unfixed tree). Here we
 * encode the invariant that holds NOW (after tasks 12.1 / 12.2) and tightens as
 * later phases land:
 *
 *   INVARIANT (Property 7 / FC-10): No Cloudflare Function resolves AUTHORIZATION
 *   for the current request from an app-DB shadow role store
 *   (`users.role` / `user_roles` / `teachers.role` / `school_educators.role`) or
 *   from URL/path inference. Authorization derives ONLY from the verified JWT
 *   (`user.roles[...]`, `requireRole`/`requireAdmin`). School-FEATURE-PERMISSION
 *   resolution for the current user goes through the ONE sanctioned resolver
 *   `resolveSchoolRole` / `lookupSchoolInternalRole` in `functions/lib/schoolRole.ts`.
 *
 * WHY AN ALLOWLIST (honest detection strategy)
 * --------------------------------------------
 * Precisely classifying every `.from('users'|...).select(...role...)` read as
 * "authz" vs "statistics / display / role-assignment / param-keyed lookup /
 * signup-reconciliation / data-scope" from static text alone is not reliably
 * decidable. Several shadow reads LEGITIMATELY remain after P2 and are tracked
 * for later phases. So instead of trying to re-derive intent per call site, this
 * test:
 *
 *   1. POSITIVE assertions — pin the concrete P2 fixes (tasks 12.1 / 12.2) so they
 *      cannot silently regress. These are the core value and are exact.
 *   2. NEGATIVE / regression assertion — uses the SAME AST detector as the 1.4
 *      test to find every handler file (EXCLUDING `functions/lib/**`, the
 *      sanctioned centralized resolver) that reads a shadow role authority, and
 *      asserts that set is a SUBSET of an explicit ALLOWLIST. A NEW shadow-reading
 *      file (a re-introduced unguarded authz read) fails the build. Each allowlist
 *      entry is tagged with the task that will remove it (13 / 22.3 / P4-21-22 /
 *      never-authz), with a documented reason. Stale allowlist entries (a file that
 *      stopped reading shadow — i.e. progress) are surfaced so the allowlist can be
 *      tightened, without falsely failing the legitimately-deferred ones.
 *   3. URL-inference guard — assert no Function derives a role from the URL/path
 *      for authz (the frontend `useUserRole` URL inference is task 13; functions
 *      should already be clean — asserted as a guard).
 *
 * This catches the real regression (a new unguarded shadow authz read) without
 * being trivially green or impossibly strict.
 *
 * DO NOT weaken these assertions to force a pass. If a genuine un-allowlisted
 * authz shadow read appears, the correct response is to convert it to the JWT /
 * `resolveSchoolRole` (or add a documented deferral marker + allowlist entry with
 * the removing task), not to relax the test.
 */

import fc from 'fast-check';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { beforeAll, describe, expect, it } from 'vitest';

// src/__tests__/rbac/<thisFile> -> project root is three levels up.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../');
const FUNCTIONS_ROOT = path.join(PROJECT_ROOT, 'functions');

const rel = (abs: string): string => path.relative(PROJECT_ROOT, abs).split(path.sep).join('/');
const read = (relPath: string): string => fs.readFileSync(path.join(PROJECT_ROOT, relPath), 'utf8');

// ════════════════════════════════════════════════════════════════════════════
// Shadow-store AST detector — identical semantics to the Task 1.4 exploration
// test, so the FIXED-state guard and the bug-condition test agree on what counts
// as a shadow role read.
// ════════════════════════════════════════════════════════════════════════════

type ShadowTable = 'users' | 'user_roles' | 'teachers' | 'school_educators';
const ROLE_COLUMN_TABLES = new Set<ShadowTable>(['users', 'teachers', 'school_educators']);
const ROLE_TABLE = 'user_roles' as const;

function sourceLabel(table: ShadowTable): string {
    switch (table) {
        case 'users': return 'users.role';
        case 'user_roles': return 'user_roles';
        case 'teachers': return 'teachers.role';
        case 'school_educators': return 'school_educators.role';
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
    source: string;
    snippet: string;
}

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

/** §7.8 detector: `JSON.parse(storedUser)` whose `.role` is trusted for authz. */
function trustsStoredUserRole(source: string): boolean {
    return /JSON\.parse\(\s*storedUser\s*\)/.test(source) && /\bparsed\.role\b/.test(source);
}

// ════════════════════════════════════════════════════════════════════════════
// ALLOWLIST — the KNOWN shadow-reading handler files remaining after P2
// (tasks 12.1 / 12.2). Each entry: reason it is NOT a current-user authz read,
// and the task that removes/reconciles it. `functions/lib/**` (the sanctioned
// centralized resolver) is excluded from the scan entirely and is NOT listed.
//
// removingTask legend:
//   'task-13'      — frontend-resolver reconciliation (§7.5/7.10): param-keyed
//                    lookup endpoints / data-scoping by an arbitrary user, NOT an
//                    in-handler authz decision for the current request.
//   'task-22.3'    — P4: school-internal `school_educators.role` authority read
//                    (current-user data-scope: resolves `school_id` etc., not authz).
//   'P4-21-22'     — `user_roles` role-ASSIGNMENT store read/write; assignment
//                    ownership moves to the SSO worker in P4.
//   'never-authz'  — statistics/aggregation, display-only select, or
//                    signup/reconciliation; reads a role column but never for an
//                    authz decision (will not be "removed", just never authz).
// ════════════════════════════════════════════════════════════════════════════

type RemovingTask = 'task-13' | 'task-22.3' | 'P4-21-22' | 'never-authz';

interface AllowEntry {
    reason: string;
    removingTask: RemovingTask;
}

const SHADOW_READ_ALLOWLIST: Record<string, AllowEntry> = {
    'functions/api/college-admin/[[path]].ts': {
        reason: "`get-user-role` lookup endpoint returns users.role by arbitrary email (frontend resolver), not current-request authz.",
        removingTask: 'task-13',
    },
    'functions/api/college-admin/actions.ts': {
        reason: "`search-library-learners` role-based DATA SCOPING keyed by an arbitrary userId param (not guaranteed current user).",
        removingTask: 'task-13',
    },
    'functions/api/college-admin/curriculum-approvals.ts': {
        reason: "`review-curriculum` authorizes via `organizationId` org-scope (403); `role` is selected but not used for the authz decision (dead select — candidate cleanup).",
        removingTask: 'never-authz',
    },
    'functions/api/college-admin/faculty.ts': {
        reason: "`user_roles` role-ASSIGNMENT read+write and `get-user-role` lookup; assignment ownership reconciled to the SSO worker.",
        removingTask: 'P4-21-22',
    },
    'functions/api/college-admin/school-admin.ts': {
        reason: "`get-user-role` lookup endpoint returns users.role by arbitrary user_id (frontend resolver), not current-request authz.",
        removingTask: 'task-13',
    },
    'functions/api/educator-copilot/actions.ts': {
        reason: "`getTeacherStatistics` aggregates `school_educators.role` for stats; not an authz decision.",
        removingTask: 'never-authz',
    },
    'functions/api/learner-profile/actions.ts': {
        reason: "`fetch-user-by-id` lookup endpoint returns users.role/organizationId by arbitrary userId (frontend resolver), not current-request authz.",
        removingTask: 'task-13',
    },
    'functions/api/messaging/actions.ts': {
        reason: "participant-identity EXISTENCE check keyed by a userId PARAM and org-scoped to the conversation's school; not a current-user authz decision.",
        removingTask: 'task-13',
    },
    'functions/api/notifications/index.ts': {
        reason: "`resolve-admin-context` resolves SOMEONE ELSE's admin context by an arbitrary identifier param (frontend resolver), not current-request authz.",
        removingTask: 'task-13',
    },
    'functions/api/organization/handler.ts': {
        reason: "reads inviter's `users.role` to DERIVE the invitee's assigned role (role-assignment derivation), not a current-request authz decision.",
        removingTask: 'task-13',
    },
    'functions/api/recruitment/members/index.ts': {
        reason: "member-list DISPLAY select that includes `role` for rendering; not an authz decision.",
        removingTask: 'never-authz',
    },
    'functions/api/school-admin/settings.ts': {
        reason: "`handleFetchSchoolEducators` selects `role` for the school-admin roster DISPLAY only; current-user school_id resolution no longer reads `role` (task 22.3). Not an authz decision.",
        removingTask: 'never-authz',
    },
    'functions/api/user/handlers/actions.ts': {
        reason: "`get-current-user-role` / `get-teacher-role-by-email` / `get-educator-role-by-email` lookup endpoints (frontend resolver); `get-permissions` already uses `resolveSchoolRole`.",
        removingTask: 'task-13',
    },
    'functions/api/user/handlers/authenticated.ts': {
        reason: "provisioning/signup reads users role+organizationId for reconciliation; not a current-request authz decision.",
        removingTask: 'task-13',
    },
    'functions/api/user/handlers/management.ts': {
        reason: "`handleGetUserStats` aggregates `users.role` for stats; not an authz decision.",
        removingTask: 'never-authz',
    },
    'functions/api/user/handlers/unified.ts': {
        reason: "signup/reconciliation idempotency reads `users.id, role` while linking SSO profiles; not an authz decision.",
        removingTask: 'never-authz',
    },
};

// ════════════════════════════════════════════════════════════════════════════
// URL/path role-inference detector (§7.5). Functions should never derive an
// authz role from the request URL/path. This catches an assignment to a
// role-like variable sourced from URL/path parsing.
// ════════════════════════════════════════════════════════════════════════════

function findUrlRoleInference(source: string): string[] {
    const hits: string[] = [];
    const re =
        /\b(role\w*|userRole|currentRole)\b\s*=\s*[^;\n]*\b(pathname|location\.|req\.url|request\.url|url\.pathname|params\.path|\.split\(['"]\/['"]\))\b/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(source)) !== null) {
        hits.push(m[0].replace(/\s+/g, ' ').slice(0, 120));
    }
    return hits;
}

// ════════════════════════════════════════════════════════════════════════════

describe('RBAC Property 7 / FC-10: JWT-only authorization resolution (P2 guard)', () => {
    let functionFiles: string[] = [];
    // Handler files (excluding functions/lib/**) that read a shadow role authority.
    const detectedHandlerShadowFiles: string[] = [];
    // functions/lib/** files that read shadow (the sanctioned resolver) — for evidence only.
    const libShadowFiles: string[] = [];
    // URL-inference hits across all functions.
    const urlInferenceHits: { file: string; hits: string[] }[] = [];

    beforeAll(() => {
        functionFiles = collectFunctionFiles(FUNCTIONS_ROOT);

        for (const abs of functionFiles) {
            const src = fs.readFileSync(abs, 'utf8');
            const relPath = rel(abs);
            const isLib = relPath.startsWith('functions/lib/');

            if (src.includes('.from(')) {
                const reads = findShadowStoreRoleReads(abs, src);
                if (reads.length > 0) {
                    if (isLib) libShadowFiles.push(relPath);
                    else detectedHandlerShadowFiles.push(relPath);
                }
            }

            const urlHits = findUrlRoleInference(src);
            if (urlHits.length > 0) urlInferenceHits.push({ file: relPath, hits: urlHits });
        }

        detectedHandlerShadowFiles.sort();
        libShadowFiles.sort();
    });

    it('resolves the functions/ tree and scans handler files', () => {
        expect(fs.existsSync(FUNCTIONS_ROOT), `functions/ tree not found at ${FUNCTIONS_ROOT}`).toBe(true);
        expect(functionFiles.length, 'Expected to find .ts handler files under functions/').toBeGreaterThan(0);
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 1) POSITIVE assertions — the P2 fixes (tasks 12.1 / 12.2) stay fixed.
    // ──────────────────────────────────────────────────────────────────────────

    describe('positive: the task 12.1 / 12.2 fixes are in place', () => {
        it('school-admin/actions.ts: §7.8 stored-user role trust is removed and handleInitUser uses the JWT', () => {
            const src = read('functions/api/school-admin/actions.ts');
            expect(
                trustsStoredUserRole(src),
                'school-admin/actions.ts must NOT trust `parsed.role` from JSON.parse(storedUser) for authz (§7.8). ' +
                'Authorize from the verified JWT (`user.roles`) instead.',
            ).toBe(false);
            expect(
                /result\.isSchoolAdmin\s*=\s*user\.roles\.includes\(\s*['"]school_admin['"]\s*\)/.test(src),
                "handleInitUser must derive `isSchoolAdmin` from the JWT (`user.roles.includes('school_admin')`), " +
                'not a `users.role` select.',
            ).toBe(true);
        });

        it('school-admin/curriculum.ts: isSchoolAdmin derives from the JWT, no users.role select', () => {
            const src = read('functions/api/school-admin/curriculum.ts');
            expect(
                /result\.isSchoolAdmin\s*=\s*user\.roles\.includes\(\s*['"]school_admin['"]\s*\)/.test(src),
                "curriculum.ts must derive `isSchoolAdmin` from the JWT (`user.roles.includes('school_admin')`).",
            ).toBe(true);
            const reads = findShadowStoreRoleReads('curriculum.ts', src);
            expect(
                reads.length,
                `curriculum.ts must not read a shadow role authority for authz. Found: ${reads.map((r) => r.snippet).join(' | ')}. ` +
                'Resolve via JWT / resolveSchoolRole.',
            ).toBe(0);
        });

        it('user/handlers/actions.ts get-permissions: resolves via resolveSchoolRole, not a users.role select', () => {
            const src = read('functions/api/user/handlers/actions.ts');
            expect(
                /resolveSchoolRole\s*\(\s*supabase\s*,\s*user\s*\)/.test(src),
                "get-permissions must resolve the permission role via `resolveSchoolRole(supabase, user)`.",
            ).toBe(true);
            expect(
                /\.eq\(\s*['"]role_code['"]\s*,\s*roleCode\s*\)/.test(src),
                'get-permissions must query `college_role_module_permissions` by the resolved `roleCode` ' +
                'via the P4 `role_code` column (re-typed off the legacy `role_type` enum), ' +
                'not by a `users.role` value.',
            ).toBe(true);
            expect(
                /\.eq\(\s*['"]role_(?:type|code)['"]\s*,\s*\w*[Uu]ser\w*\.role\b/.test(src),
                'get-permissions must NOT query the role column by a shadow `users.role` select (e.g. `userData.role`).',
            ).toBe(false);
        });

        it('educator/dashboard/[[path]].ts: the educator-TYPE branch resolves via resolveSchoolRole', () => {
            const src = read('functions/api/educator/dashboard/[[path]].ts');
            expect(
                /import\s*\{[^}]*\bresolveSchoolRole\b[^}]*\}\s*from\s*['"][^'"]*schoolRole['"]/.test(src),
                'educator dashboard must import `resolveSchoolRole` from functions/lib/schoolRole.',
            ).toBe(true);
            expect(
                /const\s+roleCode\s*=\s*await\s+resolveSchoolRole\s*\(\s*supabase\s*,\s*user\s*\)/.test(src),
                'the educator-TYPE branch must resolve `roleCode` from `resolveSchoolRole(supabase, user)` (JWT-backed).',
            ).toBe(true);
            expect(
                /roleCode\s*===\s*['"](?:college_educator|school_educator)['"]/.test(src),
                'the educator-TYPE branch must decide educatorType from the resolved `roleCode`, not a `users.role` select.',
            ).toBe(true);
        });

        it('functions/lib/schoolRole.ts is the sanctioned resolver and exports resolveSchoolRole + lookupSchoolInternalRole', () => {
            const relPath = 'functions/lib/schoolRole.ts';
            expect(fs.existsSync(path.join(PROJECT_ROOT, relPath)), `${relPath} must exist (the sanctioned centralized resolver).`).toBe(true);
            const src = read(relPath);
            expect(/export\s+async\s+function\s+resolveSchoolRole\b/.test(src), 'schoolRole.ts must export `resolveSchoolRole`.').toBe(true);
            expect(/export\s+async\s+function\s+lookupSchoolInternalRole\b/.test(src), 'schoolRole.ts must export `lookupSchoolInternalRole`.').toBe(true);
        });

        it('handlers resolving current-user school roles import the sanctioned resolver', () => {
            const importsResolver = (relPath: string): boolean =>
                /import\s*\{[^}]*\bresolveSchoolRole\b[^}]*\}\s*from\s*['"][^'"]*schoolRole['"]/.test(read(relPath));
            for (const relPath of [
                'functions/api/user/handlers/actions.ts',
                'functions/api/educator/dashboard/[[path]].ts',
            ]) {
                expect(
                    importsResolver(relPath),
                    `${relPath} must import \`resolveSchoolRole\` (the sanctioned current-user school-role path).`,
                ).toBe(true);
            }
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 2) NEGATIVE / regression assertion — no NEW shadow-reading handler file.
    // ──────────────────────────────────────────────────────────────────────────

    describe('regression: shadow-reading handler files stay within the documented allowlist', () => {
        it('logs the current shadow-read evidence (allowlist audit trail)', () => {
            const byTask = (t: RemovingTask): string[] =>
                Object.entries(SHADOW_READ_ALLOWLIST).filter(([, e]) => e.removingTask === t).map(([f]) => f);
            // eslint-disable-next-line no-console
            console.log(
                '\n=== JWT-only-resolution guard: shadow-read evidence (FIXED state) ===\n' +
                `Sanctioned resolver (functions/lib, excluded from regression): ${libShadowFiles.join(', ') || '(none)'}\n` +
                `Handler files still reading a shadow role authority: ${detectedHandlerShadowFiles.length}\n` +
                detectedHandlerShadowFiles.map((f) => {
                    const e = SHADOW_READ_ALLOWLIST[f];
                    return `  - ${f}\n      [${e ? e.removingTask : 'UNALLOWLISTED'}] ${e ? e.reason : '*** NEW — not in allowlist ***'}`;
                }).join('\n') +
                '\n\n--- Allowlist by removing task ---\n' +
                `  task-13     (${byTask('task-13').length}): ${byTask('task-13').join(', ')}\n` +
                `  task-22.3   (${byTask('task-22.3').length}): ${byTask('task-22.3').join(', ')}\n` +
                `  P4-21-22    (${byTask('P4-21-22').length}): ${byTask('P4-21-22').join(', ')}\n` +
                `  never-authz (${byTask('never-authz').length}): ${byTask('never-authz').join(', ')}\n` +
                '=== end evidence ===\n',
            );
            expect(functionFiles.length).toBeGreaterThan(0);
        });

        it('NO new shadow-reading handler file appears outside the allowlist (the real regression)', () => {
            const allowed = new Set(Object.keys(SHADOW_READ_ALLOWLIST));
            const newOnes = detectedHandlerShadowFiles.filter((f) => !allowed.has(f));
            expect(
                newOnes,
                `New shadow-store role read(s) detected in handler file(s) NOT in the allowlist:\n` +
                newOnes.map((f) => `  - ${f}`).join('\n') +
                `\n\nA Function must NOT resolve current-request authorization from ` +
                `users.role / user_roles / teachers.role / school_educators.role. ` +
                `Resolve via the verified JWT (\`user.roles\` / requireRole) or, for a school FEATURE-PERMISSION ` +
                `lookup, via \`resolveSchoolRole\`. If this read is genuinely non-authz (statistics / display / ` +
                `role-assignment / param-keyed lookup / signup) or legitimately deferred, add a documented deferral ` +
                `marker in the file AND a tagged entry to SHADOW_READ_ALLOWLIST in this test.`,
            ).toEqual([]);
        });

        it('allowlist has no stale entries (a cleaned file means the allowlist can be tightened)', () => {
            const detected = new Set(detectedHandlerShadowFiles);
            const stale = Object.keys(SHADOW_READ_ALLOWLIST).filter((f) => !detected.has(f));
            expect(
                stale,
                `These allowlisted files no longer read a shadow role authority — GOOD NEWS (a later phase cleaned them). ` +
                `Tighten the invariant by removing them from SHADOW_READ_ALLOWLIST:\n` +
                stale.map((f) => `  - ${f} (was: ${SHADOW_READ_ALLOWLIST[f]?.removingTask})`).join('\n'),
            ).toEqual([]);
        });

        it('property: every allowlist entry carries a reason and a recognized removing-task tag', () => {
            const entries = Object.entries(SHADOW_READ_ALLOWLIST);
            expect(entries.length).toBeGreaterThan(0);
            const validTags = new Set<RemovingTask>(['task-13', 'task-22.3', 'P4-21-22', 'never-authz']);
            fc.assert(
                fc.property(fc.constantFrom(...entries), ([file, entry]) => {
                    return (
                        file.startsWith('functions/') &&
                        !file.startsWith('functions/lib/') &&
                        typeof entry.reason === 'string' &&
                        entry.reason.length > 20 &&
                        validTags.has(entry.removingTask)
                    );
                }),
                { numRuns: Math.max(20, entries.length * 2) },
            );
        });
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 3) URL-inference guard (§7.5).
    // ──────────────────────────────────────────────────────────────────────────

    it('no Function infers an authorization role from the URL/path (§7.5)', () => {
        expect(
            urlInferenceHits,
            `Function(s) appear to derive a role from the request URL/path:\n` +
            urlInferenceHits.map((h) => `  - ${h.file}: ${h.hits.join(' | ')}`).join('\n') +
            `\n\nAuthorization roles must come from the verified JWT (\`user.roles\`), never from URL/path inference.`,
        ).toEqual([]);
    });
});
