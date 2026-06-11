/**
 * Bug-Condition Exploration Test: Functions Enforcement-Boundary Violations
 *
 * Spec: rbac-architecture-violations-fix — Task 1.3 (Phase 0: Bug-Condition Exploration)
 * **Validates: Requirements 7.1, 7.2**
 *
 * PURPOSE
 * -------
 * This test statically scans the Cloudflare Functions tree (`functions/`) and asserts
 * that the two known enforcement-boundary defects documented in bugfix.md §7.1 / §7.2
 * are present in the current (unfixed) source.
 *
 *   Bug A — Inline admin role-array checks (bugfix.md §7.1):
 *           At least one (documented: 15+) handler under `functions/` re-implements a
 *           hardcoded admin role-array check (an array/`Set` of role-name string
 *           literals combined with `.includes(...)` / `.some(...)` / `.has(...)` over
 *           the user's roles) instead of using `requireRole` from `auth-core`.
 *           The canonical admin literal set is, in various orderings / as a `Set`:
 *             ['admin','company_admin','owner','college_admin','university_admin','school_admin']
 *
 *   Bug B — `requireRole` / `requireProduct` applied in ZERO handlers (bugfix.md §7.2):
 *           `auth-core` exports `requireRole`/`requireProduct` and `functions/lib/auth.ts`
 *           re-exports them, but NO handler actually APPLIES (invokes / wraps with) them.
 *           The single intended authorization primitive is dead code.
 *           IMPORTANT: the re-export/definition site (`functions/lib/auth.ts`) and the
 *           `auth-core` package itself are NOT usages — they are excluded from the count.
 *
 * DETECTION
 * ---------
 * Uses the TypeScript compiler API to find genuine inline role-array authorization
 * checks (array/`Set` literals whose elements are all role-name string literals, that
 * include at least one admin literal, and that are consumed by a membership check). This
 * AST approach avoids false positives from DB query filters (e.g.
 * `.eq('recipient_type', 'college_admin')`) and `switch`/`case` role handling, which are
 * NOT authorization role-array checks.
 *
 * EXPECTED OUTCOME
 * ----------------
 * Because this is a Phase-0 exploration test, DETECTING these violations is the SUCCESS
 * condition: the test PASSES while the bugs exist. Once P2 (Tasks 9–14) converts handlers
 * to use `requireRole`/`requireProduct` guards and removes the inline literals, these
 * assertions will FAIL — that flip is the signal the defects have been resolved
 * (see Task 14 / 25.2 / 25.3).
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

// The re-export / definition site for requireRole/requireProduct. Referencing the
// symbols here is NOT an enforcement usage — it must be excluded from the usage count.
const AUTH_REEXPORT_SITE = path.join(FUNCTIONS_ROOT, 'lib', 'auth.ts');

/**
 * The canonical 16 SSO roles (sso-worker `roles` seed) plus the school-internal /
 * recruitment role-name literals that legitimately co-occur inside authorization
 * arrays. Used to decide whether an array literal is composed of role names.
 * Source: bugfix.md Introduction + §7/§8.
 */
const ROLE_VOCAB = new Set<string>([
    // 16 canonical SSO roles
    'owner', 'admin', 'member', 'super_admin', 'rm_admin', 'rm_manager', 'company_admin',
    'educator', 'school_educator', 'college_educator', 'school_admin', 'college_admin',
    'university_admin', 'recruiter', 'hr', 'learner',
    // school-internal / legacy / recruitment role literals that appear alongside the above
    'principal', 'vice_principal', 'it_admin', 'class_teacher', 'subject_teacher',
    'hod', 'faculty', 'dean', 'director', 'accountant', 'librarian', 'parent',
    'career_counselor', 'viewer', 'recruiter_admin', 'recruitment_admin', 'university_educator',
]);

/**
 * The admin role literals. An array qualifies as an admin role-array check only if it
 * contains at least one of these (otherwise it is some other role grouping).
 */
const ADMIN_LITERALS = new Set<string>([
    'admin', 'company_admin', 'owner', 'college_admin', 'university_admin', 'school_admin',
]);

/** Membership-test methods that turn a role array/Set into an authorization check. */
const MEMBER_METHODS = new Set<string>(['includes', 'some', 'every', 'has']);

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

/** Returns true if any ancestor (within a few levels) is a `.includes/.some/.every/.has(...)` call. */
function hasMembershipCallAncestor(node: ts.Node): boolean {
    let cur: ts.Node | undefined = node.parent;
    let depth = 0;
    while (cur && depth < 4) {
        if (ts.isCallExpression(cur) && ts.isPropertyAccessExpression(cur.expression)) {
            if (MEMBER_METHODS.has(cur.expression.name.text)) return true;
        }
        cur = cur.parent;
        depth++;
    }
    return false;
}

/** Returns the name of an enclosing `const X = ...` declaration (within a few levels), if any. */
function getDeclaredVarName(node: ts.Node): string | undefined {
    let cur: ts.Node | undefined = node.parent;
    let depth = 0;
    while (cur && depth < 4) {
        if (ts.isVariableDeclaration(cur) && ts.isIdentifier(cur.name)) {
            return cur.name.text;
        }
        cur = cur.parent;
        depth++;
    }
    return undefined;
}

interface RoleArrayCheck {
    roles: string[];
    snippet: string;
}

/**
 * Find genuine inline admin role-array authorization checks in a single source file.
 *
 * An array (or `Set`-wrapped array) literal qualifies when ALL of the following hold:
 *   1. It has >= 2 string-literal elements and EVERY element is a role-name literal
 *      (so arbitrary string arrays / DB filter lists are ignored).
 *   2. At least one element is an ADMIN literal (so it is an *admin* role-array check).
 *   3. It is consumed by a membership check — either directly (`[...].includes(r)` /
 *      inside `.some(...)`), or via a `const NAME = [...]` / `new Set([...])` whose
 *      name is later used with `.includes(` / `.has(` / `.some(` / `.every(`.
 */
function findInlineAdminRoleArrayChecks(filePath: string, source: string): RoleArrayCheck[] {
    const sf = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const results: RoleArrayCheck[] = [];

    const visit = (node: ts.Node): void => {
        if (ts.isArrayLiteralExpression(node)) {
            const elements = node.elements;
            const literals = elements.filter(ts.isStringLiteralLike).map((e) => e.text);

            // (1) non-trivial, and every element is a string literal that is a role name
            const allRoleLiterals =
                elements.length >= 2 &&
                literals.length === elements.length &&
                literals.every((l) => ROLE_VOCAB.has(l));

            // (2) contains at least one admin literal
            const hasAdminLiteral = literals.some((l) => ADMIN_LITERALS.has(l));

            if (allRoleLiterals && hasAdminLiteral) {
                // (3) used in a membership check (directly or via a declared variable)
                let isAuthCheck = hasMembershipCallAncestor(node);
                if (!isAuthCheck) {
                    const varName = getDeclaredVarName(node);
                    if (varName) {
                        const usageRe = new RegExp(
                            `\\b${varName}\\b\\s*\\.\\s*(${[...MEMBER_METHODS].join('|')})\\s*\\(`,
                        );
                        isAuthCheck = usageRe.test(source);
                    }
                }

                if (isAuthCheck) {
                    results.push({
                        roles: literals,
                        snippet: node.getText(sf).replace(/\s+/g, ' ').slice(0, 120),
                    });
                }
            }
        }
        ts.forEachChild(node, visit);
    };
    visit(sf);
    return results;
}

/**
 * Count genuine invocations of `requireRole(` / `requireProduct(` in a source file
 * (i.e. the guard is actually APPLIED, not merely imported or re-exported).
 */
function countGuardInvocations(source: string): number {
    const re = /\brequire(?:Role|Product)\s*\(/g;
    return (source.match(re) ?? []).length;
}

/** Returns true if the file references the `requireRole`/`requireProduct` identifiers at all. */
function referencesGuardIdentifiers(source: string): boolean {
    return /\brequireRole\b|\brequireProduct\b/.test(source);
}

describe('Bug Condition: Functions enforcement-boundary violations (static analysis)', () => {
    let functionFiles: string[] = [];

    // Bug A evidence: relative file path -> the inline admin role-array checks found.
    const inlineCheckFiles: { file: string; checks: RoleArrayCheck[] }[] = [];

    // Bug B evidence.
    let guardInvocationFiles: { file: string; count: number }[] = [];
    let guardReferenceFilesExclReexport: string[] = [];

    beforeAll(() => {
        functionFiles = collectFunctionFiles(FUNCTIONS_ROOT);

        for (const abs of functionFiles) {
            const src = fs.readFileSync(abs, 'utf8');
            const rel = path.relative(PROJECT_ROOT, abs);

            // --- Bug A: inline admin role-array checks (cheap pre-filter, then AST) ---
            if (src.includes('.includes') || src.includes('.some') || src.includes('.has') || src.includes('.every')) {
                const checks = findInlineAdminRoleArrayChecks(abs, src);
                if (checks.length > 0) {
                    inlineCheckFiles.push({ file: rel, checks });
                }
            }

            // --- Bug B: requireRole/requireProduct application (exclude re-export site) ---
            const isReexportSite = path.resolve(abs) === path.resolve(AUTH_REEXPORT_SITE);
            if (!isReexportSite) {
                const invocations = countGuardInvocations(src);
                if (invocations > 0) {
                    guardInvocationFiles.push({ file: rel, count: invocations });
                }
                if (referencesGuardIdentifiers(src)) {
                    guardReferenceFilesExclReexport.push(rel);
                }
            }
        }

        inlineCheckFiles.sort((a, b) => a.file.localeCompare(b.file));
        guardReferenceFilesExclReexport.sort();

        // Surface evidence for the audit trail.
        // eslint-disable-next-line no-console
        console.log(
            '\n=== Functions enforcement-boundary evidence (bug reproduced) ===\n' +
            `Inline admin role-array checks found in ${inlineCheckFiles.length} file(s):\n` +
            inlineCheckFiles
                .map((f) => `  - ${f.file}\n      ${f.checks.map((c) => c.snippet).join('\n      ')}`)
                .join('\n') +
            `\n\nrequireRole/requireProduct invocations in handlers (excluding re-export site` +
            ` ${path.relative(PROJECT_ROOT, AUTH_REEXPORT_SITE)}): ${guardInvocationFiles.length}\n` +
            `Files referencing the guard identifiers at all (excluding re-export site): ` +
            `${guardReferenceFilesExclReexport.length === 0 ? '(none)' : guardReferenceFilesExclReexport.join(', ')}\n` +
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
     * Bug A — At least one handler performs an inline admin role-array check.
     * **Validates: Requirements 7.1**
     */
    it('detects >= 1 handler with an inline admin role-array check (Bug A)', () => {
        expect(
            inlineCheckFiles.length,
            'Expected at least one Function handler with an inline admin role-array check ' +
            '(hardcoded role-name array/Set used in a membership check)',
        ).toBeGreaterThanOrEqual(1);

        // bugfix.md §7.1 documents 15+ such handlers; assert we reproduce the bulk of them
        // to confirm this is the systemic violation described, not an isolated match.
        expect(
            inlineCheckFiles.length,
            `Expected the documented systemic violation (~15+ handlers per bugfix.md §7.1). ` +
            `Found ${inlineCheckFiles.length}: ${inlineCheckFiles.map((f) => f.file).join(', ')}`,
        ).toBeGreaterThanOrEqual(10);

        // Spot-check known hosts from bugfix.md §7.1 to anchor the evidence.
        const found = inlineCheckFiles.map((f) => f.file);
        const expectedHosts = [
            'functions/api/storage/upload-url.ts',
            'functions/api/storage/download-url.ts',
            'functions/api/learners/management.ts',
            'functions/api/educator/dashboard/[[path]].ts',
        ];
        for (const host of expectedHosts) {
            expect(
                found.includes(host),
                `Expected an inline admin role-array check in ${host}. Found: ${found.join(', ')}`,
            ).toBe(true);
        }
    });

    /**
     * Property: every detected inline role-array check is genuinely an *admin* role
     * grouping — all its elements are role-name literals and at least one is an admin
     * literal. This guards the Bug-A count against false positives (DB filters, switch
     * arms). Sampled across all discovered checks.
     * **Validates: Requirements 7.1**
     */
    it('property: every detected check is an all-roles array containing an admin literal', () => {
        const allChecks = inlineCheckFiles.flatMap((f) => f.checks);
        expect(allChecks.length).toBeGreaterThan(0);

        fc.assert(
            fc.property(fc.constantFrom(...allChecks), (check) => {
                const everyElemIsRole = check.roles.every((r) => ROLE_VOCAB.has(r));
                const hasAdmin = check.roles.some((r) => ADMIN_LITERALS.has(r));
                return check.roles.length >= 2 && everyElemIsRole && hasAdmin;
            }),
            { numRuns: Math.max(20, allChecks.length * 2) },
        );
    });

    /**
     * Bug B — `requireRole`/`requireProduct` are APPLIED in zero handlers.
     * The re-export/definition site (functions/lib/auth.ts) and the auth-core package
     * (under node_modules, outside the functions/ scan) are excluded from the count.
     * **Validates: Requirements 7.2**
     */
    it('detects ZERO handlers applying requireRole/requireProduct (Bug B)', () => {
        expect(
            guardInvocationFiles.length,
            `Expected ZERO handlers to invoke requireRole/requireProduct, but found usage in: ` +
            `${guardInvocationFiles.map((f) => `${f.file} (${f.count})`).join(', ')}`,
        ).toBe(0);

        // Stronger: no handler file even references the guard identifiers once the
        // re-export site is excluded — confirming the primitive is wholly dead code.
        expect(
            guardReferenceFilesExclReexport,
            `Expected no handler (excluding the re-export site ` +
            `${path.relative(PROJECT_ROOT, AUTH_REEXPORT_SITE)}) to reference requireRole/requireProduct, ` +
            `but found: ${guardReferenceFilesExclReexport.join(', ')}`,
        ).toEqual([]);
    });

    /**
     * Anchor: confirm the re-export site actually exists and references the guards, so the
     * exclusion in Bug B is meaningful (we excluded a real re-export, not a typo'd path).
     */
    it('confirms the re-export site exists and re-exports the guards (exclusion is valid)', () => {
        expect(fs.existsSync(AUTH_REEXPORT_SITE), `re-export site missing at ${AUTH_REEXPORT_SITE}`).toBe(true);
        const reexportSrc = fs.readFileSync(AUTH_REEXPORT_SITE, 'utf8');
        expect(referencesGuardIdentifiers(reexportSrc)).toBe(true);
        // It re-exports but does NOT apply them (no invocation at the re-export site).
        expect(countGuardInvocations(reexportSrc)).toBe(0);
    });
});
