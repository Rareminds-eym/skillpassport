/**
 * Regression Guard: No phantom roles (design Property 3 / FC-3).
 *
 * Spec: rbac-architecture-violations-fix — Task 7.4 (Phase P1)
 * **Validates: Requirements 2.2, 2.3, 2.4**
 *
 * PURPOSE
 * -------
 * This is the FIXED-state counterpart to the Phase-0 exploration test
 * (`src/__tests__/bugfix/typeFragmentationAndPhantomRoles.bugCondition.test.ts`,
 * task 1.2). Where that test asserts phantom literals (`college_lecturer`,
 * `recruitment_admin`) EXIST, this test asserts design Property 3 (FC-3):
 *
 *   Every role literal used in a role context ∈ the canonical union
 *     SSO_ROLES ∪ SchoolInternalRole ∪ RecruitmentRole
 *
 * with ONE documented exception: the UI-only `recruitment_admin` redirect
 * label, which is permitted ONLY inside `src/features/auth/ui/UnifiedSignup.tsx`
 * (it is never sent to the backend and never used in any authorization check —
 * see the file header there and RBAC migration §2.4 / §6.4).
 *
 * DETECTION SCOPE (and why)
 * -------------------------
 * A fully general "every string literal in src/" scan is far too noisy: role
 * variables are legitimately compared against non-RBAC sentinels such as the
 * chat-message role `'user'` (`message.role === 'user'`) and the members-filter
 * sentinel `'all'` (`options.role !== 'all'`). Flagging those would be false
 * positives. We therefore scope detection to two robust, low-false-positive
 * surfaces:
 *
 *   (A) CURATED ROLE-LIST CONSTANTS — authoritative enumerations of roles where
 *       EVERY member is, by construction, meant to be a real role:
 *         - `VALID_ROLES`         (entities/user/model/validation.ts)        [AST]
 *         - `ROLE_CATEGORIES`     (shared/types/generated/roles.ts)          [import]
 *         - `ROLE_PERMISSIONS`    (entities/recruitment/model/types.ts)      [import]
 *         - `SIGNUP_ROLE_OPTIONS` (features/auth/ui/UnifiedSignup.tsx)       [AST]
 *       The fast-check property asserts every literal pulled from these lists ∈
 *       the canonical union (applying the UI-only allowlist for the signup list).
 *
 *   (B) TARGETED FORMER-PHANTOM GUARDS — precise assertions that the two
 *       literals removed in tasks 7.1–7.2 do not reappear in role contexts:
 *         - No `=== 'college_lecturer'` / `'college_lecturer' ===` ROLE
 *           comparison anywhere in src/. The pattern requires the singular
 *           form bounded by a closing quote, so the `college_lecturers` TABLE
 *           name and any `recipient.type` messaging labels are NOT matched.
 *         - `recruitment_admin` appears ONLY in the one documented UI-only host
 *           (`UnifiedSignup.tsx`); it is not an SSO role and is absent from
 *           every other source file (no authorization role-array contains it).
 *
 * The canonical union is sourced from the ACTUAL modules so this guard
 * self-updates:
 *   - `SSO_ROLES`          — imported from `@/shared/types/generated/roles`.
 *   - `SchoolInternalRole` — a TYPE (no runtime value), so its union members are
 *     parsed from `shared/types/permissions.ts` via the TS compiler API.
 *   - `RecruitmentRole`    — a TYPE, so its union members are parsed from
 *     `entities/recruitment/model/types.ts` via the TS compiler API.
 * A guard test cross-checks the parsed members against an explicit mirror so a
 * parsing regression (e.g. the type shape changing) surfaces loudly.
 *
 * EXPECTED OUTCOME
 * ----------------
 * PASSES on the post-7.1–7.3 source and must stay green. Any reintroduced
 * phantom literal (a non-canonical role in a curated list, a resurrected
 * `college_lecturer` comparison, or a stray `recruitment_admin` outside the
 * documented host) turns it red.
 *
 * DO NOT modify the task-1.2 exploration test.
 */

import fc from 'fast-check';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { beforeAll, describe, expect, it } from 'vitest';

import { ROLE_PERMISSIONS } from '@/entities/recruitment/model/types';
import { ROLE_CATEGORIES, SSO_ROLES } from '@/shared/types/generated/roles';

// Resolve the skillpassport project root from this test file location:
// src/__tests__/rbac/<thisFile> -> project root is three levels up.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../');
const SRC_ROOT = path.join(PROJECT_ROOT, 'src');

// --- Canonical role-source modules (parsed for their union members) ---------
const PERMISSIONS_MODULE = path.join(SRC_ROOT, 'shared/types/permissions.ts');
const RECRUITMENT_TYPES_MODULE = path.join(SRC_ROOT, 'entities/recruitment/model/types.ts');
const VALIDATION_MODULE = path.join(SRC_ROOT, 'entities/user/model/validation.ts');
const UNIFIED_SIGNUP_REL = 'src/features/auth/ui/UnifiedSignup.tsx';
const UNIFIED_SIGNUP_MODULE = path.join(SRC_ROOT, 'features/auth/ui/UnifiedSignup.tsx');

/**
 * The single documented UI-only redirect label (NOT a real role). Permitted
 * ONLY in UnifiedSignup.tsx. See that file's header + RBAC migration §2.4/§6.4.
 */
const UI_ONLY_LABEL = 'recruitment_admin';

/**
 * Explicit mirrors of the school-internal / recruitment role taxonomies. These
 * exist ONLY so a parsing regression is caught (the parsed members must equal
 * these); the canonical union below is built from the PARSED members so the
 * guard still self-updates from source.
 */
const EXPECTED_SCHOOL_INTERNAL_ROLES = [
    'principal',
    'vice_principal',
    'it_admin',
    'class_teacher',
    'subject_teacher',
    'accountant',
    'librarian',
    'parent',
    'career_counselor',
    'school_admin',
].sort();

const EXPECTED_RECRUITMENT_ROLES = ['company_admin', 'recruiter', 'viewer'].sort();

// ---------------------------------------------------------------------------
// TS-compiler-API helpers
// ---------------------------------------------------------------------------

function parseSourceFile(filePath: string): ts.SourceFile {
    const source = fs.readFileSync(filePath, 'utf8');
    const scriptKind = filePath.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    return ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, scriptKind);
}

/**
 * Extract the string-literal members of a named string-union `type` alias, e.g.
 *   `export type RecruitmentRole = 'company_admin' | 'recruiter' | 'viewer';`
 * Returns the sorted literal values, or [] if the alias is absent.
 */
function extractUnionMembers(filePath: string, typeName: string): string[] {
    const sf = parseSourceFile(filePath);
    const members: string[] = [];

    const collectFromType = (typeNode: ts.TypeNode): void => {
        if (ts.isUnionTypeNode(typeNode)) {
            for (const t of typeNode.types) collectFromType(t);
            return;
        }
        if (ts.isLiteralTypeNode(typeNode) && ts.isStringLiteral(typeNode.literal)) {
            members.push(typeNode.literal.text);
        }
    };

    const visit = (node: ts.Node): void => {
        if (ts.isTypeAliasDeclaration(node) && node.name.text === typeName) {
            collectFromType(node.type);
        }
        ts.forEachChild(node, visit);
    };
    visit(sf);

    return members.sort();
}

/**
 * Extract the literal members of a named array const, resolving simple
 * single-file `const NAME = 'literal'` identifier references (e.g. the
 * `RECRUITMENT_ADMIN_REDIRECT` entry in `SIGNUP_ROLE_OPTIONS`). Unwraps
 * `as const` / `satisfies` expressions. Returns sorted unique literals.
 */
function extractArrayLiterals(filePath: string, constName: string): string[] {
    const sf = parseSourceFile(filePath);

    // First pass: map `const NAME = 'literal'` so identifier elements resolve.
    const constStringMap = new Map<string, string>();
    const mapVisit = (node: ts.Node): void => {
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
            let init: ts.Node = node.initializer;
            while (ts.isAsExpression(init) || ts.isSatisfiesExpression(init)) init = init.expression;
            if (ts.isStringLiteral(init)) constStringMap.set(node.name.text, init.text);
        }
        ts.forEachChild(node, mapVisit);
    };
    mapVisit(sf);

    const out: string[] = [];
    const unwrap = (n: ts.Node): ts.Node => {
        let cur = n;
        while (ts.isAsExpression(cur) || ts.isSatisfiesExpression(cur)) cur = cur.expression;
        return cur;
    };

    const visit = (node: ts.Node): void => {
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === constName && node.initializer) {
            const init = unwrap(node.initializer);
            if (ts.isArrayLiteralExpression(init)) {
                for (const el of init.elements) {
                    if (ts.isStringLiteral(el)) {
                        out.push(el.text);
                    } else if (ts.isIdentifier(el) && constStringMap.has(el.text)) {
                        out.push(constStringMap.get(el.text)!);
                    }
                }
            }
        }
        ts.forEachChild(node, visit);
    };
    visit(sf);

    return [...new Set(out)].sort();
}

/** Recursively collect every .ts/.tsx source file under `dir`, skipping the test tree. */
function collectSourceFiles(dir: string): string[] {
    const out: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === '__tests__' || entry.name === 'node_modules') continue;
            out.push(...collectSourceFiles(full));
        } else if (/\.(ts|tsx)$/.test(entry.name) && !/\.d\.ts$/.test(entry.name)) {
            out.push(full);
        }
    }
    return out;
}

const toRel = (abs: string): string => path.relative(PROJECT_ROOT, abs).split(path.sep).join('/');

// ---------------------------------------------------------------------------

describe('No phantom roles: every role literal ∈ canonical union (regression guard, FC-3)', () => {
    let schoolInternalRoles: string[] = [];
    let recruitmentRoles: string[] = [];
    let canonicalUnion: Set<string>;

    let sourceFiles: string[] = [];

    // Curated role-list literals (surface A).
    let validRoles: string[] = [];
    let signupRoleOptions: string[] = [];
    const roleCategoryMembers: string[] = [...new Set(Object.values(ROLE_CATEGORIES).flat())].sort();
    const recruitmentPermissionRoles: string[] = Object.keys(ROLE_PERMISSIONS).sort();

    beforeAll(() => {
        schoolInternalRoles = extractUnionMembers(PERMISSIONS_MODULE, 'SchoolInternalRole');
        recruitmentRoles = extractUnionMembers(RECRUITMENT_TYPES_MODULE, 'RecruitmentRole');

        canonicalUnion = new Set<string>([
            ...SSO_ROLES,
            ...schoolInternalRoles,
            ...recruitmentRoles,
        ]);

        sourceFiles = collectSourceFiles(SRC_ROOT);

        validRoles = extractArrayLiterals(VALIDATION_MODULE, 'VALID_ROLES');
        signupRoleOptions = extractArrayLiterals(UNIFIED_SIGNUP_MODULE, 'SIGNUP_ROLE_OPTIONS');

        // eslint-disable-next-line no-console
        console.log(
            '\n=== No-phantom-roles evidence (post-fix) ===\n' +
            `Canonical union (${canonicalUnion.size}): ${[...canonicalUnion].sort().join(', ')}\n` +
            `  SSO_ROLES (${SSO_ROLES.length})\n` +
            `  SchoolInternalRole (${schoolInternalRoles.length}): ${schoolInternalRoles.join(', ')}\n` +
            `  RecruitmentRole (${recruitmentRoles.length}): ${recruitmentRoles.join(', ')}\n` +
            `Curated role lists:\n` +
            `  VALID_ROLES (${validRoles.length}): ${validRoles.join(', ')}\n` +
            `  ROLE_CATEGORIES members (${roleCategoryMembers.length}): ${roleCategoryMembers.join(', ')}\n` +
            `  recruitment ROLE_PERMISSIONS keys (${recruitmentPermissionRoles.length}): ${recruitmentPermissionRoles.join(', ')}\n` +
            `  SIGNUP_ROLE_OPTIONS (${signupRoleOptions.length}): ${signupRoleOptions.join(', ')}\n` +
            `UI-only allowlisted label: '${UI_ONLY_LABEL}' (only in ${UNIFIED_SIGNUP_REL})\n` +
            '=== end evidence ===\n',
        );
    });

    /** Sanity: an empty scan would invalidate the guard (e.g. wrong project root). */
    it('scans the src/ tree successfully', () => {
        expect(sourceFiles.length).toBeGreaterThan(0);
    });

    /**
     * Guard: the parsed taxonomies match their explicit mirrors, and the
     * canonical union is well-formed (so a parsing regression is caught).
     */
    it('parses SchoolInternalRole / RecruitmentRole members from source', () => {
        expect(schoolInternalRoles).toEqual(EXPECTED_SCHOOL_INTERNAL_ROLES);
        expect(recruitmentRoles).toEqual(EXPECTED_RECRUITMENT_ROLES);

        // SSO_ROLES contributes the 16 canonical roles; union is their superset.
        expect(SSO_ROLES.length).toBe(16);
        expect(canonicalUnion.size).toBeGreaterThanOrEqual(16);
        for (const r of SSO_ROLES) expect(canonicalUnion.has(r)).toBe(true);

        // The UI-only label must NOT leak into the canonical union.
        expect(canonicalUnion.has(UI_ONLY_LABEL)).toBe(false);
    });

    /**
     * Surface (B) — the phantom `college_lecturer` ROLE comparison removed in
     * task 7.1 must not reappear anywhere in src/. The pattern is scoped
     * PRECISELY to role comparisons: it requires a role-like identifier
     * (`...Role` / `...role`, e.g. `userRole`) on one side of an `===`/`!==`
     * against the SINGULAR `college_lecturer` literal bounded by a closing
     * quote. This deliberately excludes:
     *   - the `college_lecturers` TABLE name (plural — no closing quote after
     *     the singular form),
     *   - messaging `recipient.type === 'college_lecturer'` recipient-type
     *     labels (the LHS identifier is `type`, not role-like).
     * **Validates: Requirements 2.2**
     */
    it('has no `college_lecturer` role comparison anywhere in src/ (Bug B fixed)', () => {
        const comparisonRe = /\b\w*[rR]ole\b\s*(===|!==)\s*['"]college_lecturer['"]|['"]college_lecturer['"]\s*(===|!==)\s*\w*[rR]ole\b/;
        const offenders: string[] = [];

        for (const file of sourceFiles) {
            const src = fs.readFileSync(file, 'utf8');
            if (comparisonRe.test(src)) offenders.push(toRel(file));
        }

        expect(
            offenders,
            `Phantom 'college_lecturer' role comparison reintroduced in: ${offenders.join(', ')}`,
        ).toEqual([]);
    });

    /**
     * Surface (B) — `recruitment_admin` is permitted ONLY in the documented
     * UI-only host (UnifiedSignup.tsx). It must be absent from every other
     * source file, must not be an SSO role, and must not be in the canonical
     * union (it is a redirect label, not a role).
     * **Validates: Requirements 2.2, 2.4**
     */
    it('confines `recruitment_admin` to the documented UI-only host (Bug C fixed)', () => {
        const literalRe = /['"]recruitment_admin['"]/;
        const offenders: string[] = [];

        for (const file of sourceFiles) {
            const rel = toRel(file);
            if (rel === UNIFIED_SIGNUP_REL) continue; // documented UI-only allowlist
            const src = fs.readFileSync(file, 'utf8');
            if (literalRe.test(src)) offenders.push(rel);
        }

        expect(
            offenders,
            `'${UI_ONLY_LABEL}' (UI-only label) must appear only in ${UNIFIED_SIGNUP_REL}, but also found in: ${offenders.join(', ')}`,
        ).toEqual([]);

        // It is not a real role.
        expect(SSO_ROLES.includes(UI_ONLY_LABEL as never)).toBe(false);
        expect(canonicalUnion.has(UI_ONLY_LABEL)).toBe(false);
    });

    /**
     * Surface (A) — every literal in `VALID_ROLES` (the user-data validator)
     * is a canonical role. `recruitment_admin` is intentionally NOT allowlisted
     * here: the validator must never accept the UI-only label.
     * **Validates: Requirements 2.2, 2.3**
     */
    it('every VALID_ROLES literal ∈ canonical union (no phantom, no UI-only label)', () => {
        expect(validRoles.length).toBeGreaterThan(0);

        const phantom = validRoles.filter((r) => !canonicalUnion.has(r));
        expect(
            phantom,
            `VALID_ROLES contains non-canonical role literal(s): ${phantom.join(', ')}`,
        ).toEqual([]);

        // De-dup invariant from task 7.3: a single 'learner' entry.
        expect(validRoles.filter((r) => r === 'learner').length).toBe(1);
    });

    /**
     * Property (FC-3) — over the UNION of all curated role-list literals, each
     * literal ∈ the canonical union. The UI-only `recruitment_admin` label is
     * permitted ONLY when it originates from the signup options list (its
     * documented host); everywhere else it is treated as a phantom.
     * **Validates: Requirements 2.2, 2.3, 2.4**
     */
    it('property: every curated role-list literal ∈ canonical union (UI-only label allowlisted)', () => {
        // Tag each literal with its source so the allowlist can be scoped.
        type TaggedLiteral = { literal: string; source: string; uiOnlyAllowed: boolean };
        const tagged: TaggedLiteral[] = [
            ...validRoles.map((literal) => ({ literal, source: 'VALID_ROLES', uiOnlyAllowed: false })),
            ...roleCategoryMembers.map((literal) => ({ literal, source: 'ROLE_CATEGORIES', uiOnlyAllowed: false })),
            ...recruitmentPermissionRoles.map((literal) => ({ literal, source: 'ROLE_PERMISSIONS', uiOnlyAllowed: false })),
            ...signupRoleOptions.map((literal) => ({ literal, source: 'SIGNUP_ROLE_OPTIONS', uiOnlyAllowed: true })),
        ];

        // Pre-condition: the curated lists must actually have been extracted.
        expect(tagged.length).toBeGreaterThan(0);

        fc.assert(
            fc.property(fc.constantFrom(...tagged), ({ literal, uiOnlyAllowed }) => {
                if (canonicalUnion.has(literal)) return true;
                // The only permitted non-canonical literal is the UI-only label,
                // and only from its documented host (SIGNUP_ROLE_OPTIONS).
                return uiOnlyAllowed && literal === UI_ONLY_LABEL;
            }),
            { numRuns: Math.min(50, tagged.length) },
        );
    });
});
