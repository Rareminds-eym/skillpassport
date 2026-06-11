/**
 * Regression Guard: every exported Pages Function handler is guarded or explicitly public.
 *
 * Spec: rbac-architecture-violations-fix — Task 11.4 (Phase P2)
 * **Validates: Requirements 7.1, 7.2, 3.2**
 * Design: Property 6 (Guarded handlers) · FC-9 · invariant CC-2.
 *
 * WHY THIS MATTERS (CC-2 — no DB backstop)
 * ----------------------------------------
 * Cloudflare Functions access the database with the `service_role` client, which
 * BYPASSES Postgres RLS. The Function guard is therefore the ONLY server-side gate:
 * a handler that ships without a guard equals open access — there is no second line
 * of defence. This test makes "no handler without a guard" a build-time invariant.
 *
 * THE INVARIANT
 * -------------
 * For EVERY file under `functions/` that exports a Pages handler
 * (`onRequest` / `onRequestGet|Post|Put|Patch|Delete|Options|Head`), the file MUST be
 * one of:
 *
 *   (a) GUARDED — the file applies the app authentication wrapper `withAuth(` /
 *       `withAuthAllowUnverified(`. This is the core CC-2 signal. The role/feature
 *       guards (`requireAdmin` / `requireRole` / `requireProduct` / `requireFeatureAccess`)
 *       compose INSIDE `withAuth`, so the presence of the `withAuth` wrapper is what we
 *       detect — it proves authentication runs before the handler body.
 *
 *   (b) PUBLIC — the file carries an explicit, in-code, self-documenting marker
 *       `// @public-endpoint: <justification>` AND is one of the handlers documented as
 *       public in the RBAC guard-matrix (task 11.1). The marker makes "explicitly marked
 *       public" real and reviewable in source, not just an external list.
 *
 *   (c) DELEGATING ROUTER / PARENT-GUARDED SUB-HANDLER — the file is a `[[path]]`/router
 *       dispatcher whose data handlers delegate to a `withAuth`-guarded `actions` module,
 *       OR a sub-handler that is dispatched by a `withAuth`-guarded parent router. These
 *       are enumerated in a MAINTAINED allowlist (derived from the matrix `router`/`parent`
 *       classification) AND are structurally re-verified on every run (the allowlist cannot
 *       silently rot: an entry that no longer delegates to / is dispatched by a guarded
 *       module fails the test).
 *
 * Any handler file matching NONE of the above is a CC-2 violation: an unguarded,
 * non-public, non-delegating endpoint. This is the real regression we guard against —
 * someone adding a new endpoint without a guard. The failure message names each offender
 * and the exact remediation.
 *
 * DETECTION STRATEGY (documented)
 * -------------------------------
 *  - `usesWithAuth(file)`     : regex for `withAuth(` / `withAuthAllowUnverified(` after
 *                               stripping comments (so a wrapper mentioned in a comment is
 *                               not mistaken for a real guard).
 *  - `hasPublicMarker(file)`  : regex for `@public-endpoint:` on the RAW source (the marker
 *                               is itself a comment).
 *  - `delegatesToGuarded(F)`  : F imports a symbol from a relative module M where M
 *                               `usesWithAuth`, and F references that symbol (the router
 *                               dispatches to the guarded action).
 *  - `guardedByParent(F)`     : some `usesWithAuth` router R imports a symbol resolving to
 *                               F and references it (R wraps the dispatch in `withAuth`).
 *
 * The allowlists are intentionally explicit so that ANY change to the public surface or the
 * router/sub-handler set is a deliberate, reviewable edit to this file — defence in depth on
 * top of the structural checks. This test underpins design Property 6 / CC-2 and is re-run by
 * tasks 14 and 25.2.
 *
 * This test PASSES against the current tree (post 11.2/11.3) and must stay green.
 */

import fc from 'fast-check';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';

// src/__tests__/rbac/<thisFile> -> project root is three levels up.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../');
const FUNCTIONS_ROOT = path.join(PROJECT_ROOT, 'functions');

/**
 * (b) PUBLIC allowlist — the 11 handlers documented as public in the RBAC guard-matrix
 * (`.kiro/plans/2026-06-07_rbac-guard-matrix.md` → `publicHandlers`). Paths are relative to
 * `functions/` with forward slashes. Each MUST also carry the `// @public-endpoint:` marker.
 */
const PUBLIC_ALLOWLIST = new Set<string>([
    'auth/[[path]].ts',
    'api/auth/forgot-password.ts',
    'api/auth/reset-password.ts',
    'api/otp/[[path]].ts',
    'api/email/verification.ts',
    'api/email/password-reset.ts',
    'api/payments/handlers/create-registration-order.ts',
    'api/payments/handlers/update-registration-payment-status.ts',
    'api/cron/reconcile-subscriptions.ts',
    'api/realtime-stream/index.ts',
    'api/fetch-certificate/[[path]].ts',
]);

/**
 * (c) ROUTER / PARENT-GUARDED SUB-HANDLER allowlist — handlers that carry no `withAuth`
 * wrapper of their own because the guard lives in the module they delegate to (a router
 * dispatching to a `withAuth`-wrapped `actions` module) or in the parent router that
 * dispatches them (a sub-handler). Derived from the matrix `router`/`parent` rows.
 * Every entry is STRUCTURALLY re-verified below (`delegatesToGuarded` or `guardedByParent`),
 * so a stale entry — one that no longer routes through a guard — fails the test.
 */
const ROUTER_PARENT_ALLOWLIST = new Set<string>([
    // delegating routers -> guarded actions module
    'api/class-management/[[path]].ts',
    'api/co-curriculars/[[path]].ts',
    'api/educator/[[path]].ts',
    'api/events/[[path]].ts',
    'api/exams/[[path]].ts',
    'api/explorer/[[path]].ts',
    'api/kpi-dashboard/[[path]].ts',
    'api/learner-activity/[[path]].ts',
    'api/learner-dashboard-widgets/[[path]].ts',
    'api/learner-pages/[[path]].ts',
    'api/placement/[[path]].ts',
    'api/promotional/[[path]].ts',
    'api/receipts/[[path]].ts',
    'api/shared-widgets/[[path]].ts',
    'api/subscription/[[path]].ts',
    'api/teacher/[[path]].ts',
    'api/university-admin/[[path]].ts',
    'api/university-ai/[[path]].ts',
    // sub-handlers dispatched by a withAuth-guarded parent router
    'api/adaptive-session/link-to-attempt.ts',
    'api/ai-tutor/handlers/ai-tutor-feedback.ts',
    'api/ai-tutor/handlers/ai-tutor-progress.ts',
    'api/ai-tutor/handlers/get-generation-usage.ts',
    'api/ai-tutor/handlers/get-learner-type.ts',
    'api/course/handlers/ai-video-summarizer.ts',
]);

const HANDLER_EXPORT_RE =
    /export\s+(?:const|async\s+function|function)\s+(onRequest(?:Get|Post|Put|Patch|Delete|Options|Head)?)\b/g;
const REEXPORT_FROM_RE = /export\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g;
const BARE_EXPORT_RE = /export\s*\{([^}]*)\}\s*;/g;
const IMPORT_RE = /import\s+([^;]*?)\s+from\s+['"]([^'"]+)['"]/g;
const WITHAUTH_RE = /\bwithAuth(?:AllowUnverified)?\s*\(/;
const PUBLIC_MARKER_RE = /@public-endpoint:/;

/** Remove block and line comments so `withAuth(` in a comment is not mistaken for a guard. */
function stripComments(src: string): string {
    return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

/** Recursively collect every .ts file under `dir`, skipping tests / node_modules / .d.ts. */
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

const rel = (abs: string): string => path.relative(FUNCTIONS_ROOT, abs).split(path.sep).join('/');

/** Resolve a relative import specifier to an absolute .ts file path (or null). */
function resolveImport(fromAbs: string, spec: string): string | null {
    if (!spec.startsWith('.')) return null;
    const p = path.resolve(path.dirname(fromAbs), spec);
    for (const c of [p + '.ts', path.join(p, 'index.ts'), p]) {
        if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
    }
    return null;
}

interface ImportInfo { spec: string; target: string | null; locals: string[]; raw: string; }

/** Parse all `import ... from '...'` statements, capturing local binding names + resolved target. */
function parseImports(abs: string, src: string): ImportInfo[] {
    const out: ImportInfo[] = [];
    let m: RegExpExecArray | null;
    const re = new RegExp(IMPORT_RE.source, 'g');
    while ((m = re.exec(src))) {
        const clause = m[1];
        const spec = m[2];
        const locals: string[] = [];
        const brace = clause.match(/\{([^}]*)\}/);
        if (brace) {
            for (const s of brace[1].split(',')) {
                const a = s.trim().split(/\s+as\s+/).pop()?.trim();
                if (a) locals.push(a);
            }
        }
        const def = clause.replace(/\{[^}]*\}/, '').replace(/\*\s+as\s+\w+/, '').replace(/,/g, '').trim();
        if (def && /^[A-Za-z_$][\w$]*$/.test(def)) locals.push(def);
        out.push({ spec, target: resolveImport(abs, spec), locals, raw: m[0] });
    }
    return out;
}

/** Names of exported Pages handlers (direct, `export { x } from`, and bare `export { x }`). */
function exportedHandlerNames(src: string): string[] {
    const names = new Set<string>();
    let m: RegExpExecArray | null;
    const re1 = new RegExp(HANDLER_EXPORT_RE.source, 'g');
    while ((m = re1.exec(src))) names.add(m[1]);
    const re2 = new RegExp(REEXPORT_FROM_RE.source, 'g');
    while ((m = re2.exec(src))) {
        for (const part of m[1].split(',')) {
            const nm = part.trim().split(/\s+as\s+/).pop()?.trim();
            if (nm && /^onRequest/.test(nm)) names.add(nm);
        }
    }
    const re3 = new RegExp(BARE_EXPORT_RE.source, 'g');
    while ((m = re3.exec(src))) {
        for (const part of m[1].split(',')) {
            const nm = part.trim().split(/\s+as\s+/).pop()?.trim();
            if (nm && /^onRequest/.test(nm)) names.add(nm);
        }
    }
    return [...names];
}

interface HandlerFile {
    abs: string;
    rel: string;
    raw: string;
    code: string; // comment-stripped
    names: string[];
    imports: ImportInfo[];
}

function usesWithAuth(h: HandlerFile): boolean {
    return WITHAUTH_RE.test(h.code);
}

function hasPublicMarker(h: HandlerFile): boolean {
    return PUBLIC_MARKER_RE.test(h.raw);
}

/** F dispatches to a guarded action: imports a symbol from a `withAuth` module and references it. */
function delegatesToGuarded(h: HandlerFile, byAbs: Map<string, HandlerFile>, srcOf: (abs: string) => string): { via: string; local: string } | null {
    for (const im of h.imports) {
        if (!im.target) continue;
        const targetCode = byAbs.get(im.target)?.code ?? stripComments(srcOf(im.target));
        if (!WITHAUTH_RE.test(targetCode)) continue;
        const body = h.code.replace(im.raw, '');
        for (const local of im.locals) {
            if (new RegExp(`\\b${local}\\b`).test(body)) return { via: rel(im.target), local };
        }
    }
    return null;
}

/** Some `withAuth` router imports a symbol resolving to F and references it (parent guards F). */
function guardedByParent(h: HandlerFile, all: HandlerFile[]): { parent: string; local: string } | null {
    for (const r of all) {
        if (r.abs === h.abs || !WITHAUTH_RE.test(r.code)) continue;
        for (const im of r.imports) {
            if (!im.target || path.resolve(im.target) !== path.resolve(h.abs)) continue;
            const body = r.code.replace(im.raw, '');
            for (const local of im.locals) {
                if (new RegExp(`\\b${local}\\b`).test(body)) return { parent: r.rel, local };
            }
        }
    }
    return null;
}

type Category = 'guarded' | 'public' | 'router-or-parent';
interface Classification { category: Category | 'VIOLATION'; detail: string; }

describe('CC-2 / Property 6: every exported Function handler is guarded or explicitly public', () => {
    let handlers: HandlerFile[] = [];
    let byAbs = new Map<string, HandlerFile>();
    const rawByAbs = new Map<string, string>();
    const srcOf = (abs: string): string => {
        if (!rawByAbs.has(abs)) rawByAbs.set(abs, fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '');
        return rawByAbs.get(abs)!;
    };

    const classifications = new Map<string, Classification>();
    let publicMarked: string[] = [];

    function classify(h: HandlerFile): Classification {
        if (usesWithAuth(h)) return { category: 'guarded', detail: 'withAuth wrapper present' };
        if (hasPublicMarker(h)) {
            return PUBLIC_ALLOWLIST.has(h.rel)
                ? { category: 'public', detail: '@public-endpoint marker (documented public)' }
                : { category: 'VIOLATION', detail: '@public-endpoint marker on a file NOT in the documented public allowlist' };
        }
        if (ROUTER_PARENT_ALLOWLIST.has(h.rel)) {
            const d = delegatesToGuarded(h, byAbs, srcOf);
            if (d) return { category: 'router-or-parent', detail: `delegates to guarded ${d.via} (${d.local})` };
            const p = guardedByParent(h, handlers);
            if (p) return { category: 'router-or-parent', detail: `guarded by parent ${p.parent} (${p.local})` };
            return { category: 'VIOLATION', detail: 'allowlisted as router/parent but no longer delegates to / is dispatched by a guarded module (stale allowlist)' };
        }
        return { category: 'VIOLATION', detail: 'no withAuth wrapper, no @public-endpoint marker, not a known delegating router/sub-handler' };
    }

    beforeAll(() => {
        const files = collectFunctionFiles(FUNCTIONS_ROOT).filter(
            (f) => !f.includes(`${path.sep}lib${path.sep}`) && !/_middleware\.ts$/.test(f),
        );
        for (const abs of files) {
            const raw = srcOf(abs);
            const names = exportedHandlerNames(raw);
            if (names.length === 0) continue;
            const code = stripComments(raw);
            handlers.push({ abs, rel: rel(abs), raw, code, names, imports: parseImports(abs, code) });
        }
        handlers.sort((a, b) => a.rel.localeCompare(b.rel));
        byAbs = new Map(handlers.map((h) => [h.abs, h]));

        for (const h of handlers) classifications.set(h.rel, classify(h));
        publicMarked = handlers.filter((h) => hasPublicMarker(h)).map((h) => h.rel).sort();

        const counts = { guarded: 0, public: 0, 'router-or-parent': 0, VIOLATION: 0 } as Record<string, number>;
        for (const c of classifications.values()) counts[c.category]++;
        // eslint-disable-next-line no-console
        console.log(
            `\n=== Guard-presence sweep (CC-2) ===\n` +
            `functions/ handler files: ${handlers.length}\n` +
            `  guarded (withAuth): ${counts.guarded}\n` +
            `  public (annotated): ${counts.public}\n` +
            `  router/parent-guarded: ${counts['router-or-parent']}\n` +
            `  VIOLATIONS: ${counts.VIOLATION}\n` +
            `=== end sweep ===\n`,
        );
    });

    it('resolves the functions/ tree and finds the handler files', () => {
        expect(fs.existsSync(FUNCTIONS_ROOT), `functions/ tree not found at ${FUNCTIONS_ROOT}`).toBe(true);
        expect(handlers.length, 'Expected to find exported Pages handlers under functions/').toBeGreaterThan(100);
    });

    /**
     * CORE INVARIANT (CC-2 / Property 6): no exported handler lacks a guard or explicit public
     * annotation. Lists every offender with the exact remediation.
     * **Validates: Requirements 7.1, 3.2**
     */
    it('every exported handler is guarded, explicitly public, or a verified delegating router/sub-handler', () => {
        const offenders = handlers
            .map((h) => ({ rel: h.rel, c: classifications.get(h.rel)! }))
            .filter((x) => x.c.category === 'VIOLATION');

        const message =
            offenders.length === 0
                ? ''
                : `CC-2 violation — ${offenders.length} exported Function handler(s) without a guard:\n` +
                offenders.map((o) => `  - functions/${o.rel}\n      reason: ${o.c.detail}`).join('\n') +
                `\n\nFunctions use the service_role client (RLS is bypassed), so the Function guard is the ONLY ` +
                `server-side gate. Fix each handler by EITHER:\n` +
                `  1) wrapping the exported handler with a guard from functions/lib/auth.ts ` +
                `(withAuth / withAuthAllowUnverified, composing requireAdmin/requireRole/requireProduct/requireFeatureAccess as needed), OR\n` +
                `  2) if it is genuinely public, add a top-of-file marker ` +
                `'// @public-endpoint: <justification>' AND add the file to PUBLIC_ALLOWLIST in this test (with review), OR\n` +
                `  3) if it is a router/sub-handler guarded by a parent, ensure the dispatch goes through a withAuth module ` +
                `and add it to ROUTER_PARENT_ALLOWLIST in this test (with review).`;

        expect(offenders.map((o) => o.rel), message).toEqual([]);
    });

    /**
     * The `// @public-endpoint:` markers in source must EXACTLY match the documented public set.
     * This keeps "explicitly public" honest: no endpoint can be silently opened by slapping on a
     * marker, and every documented-public file must actually carry the marker.
     * **Validates: Requirements 7.1**
     */
    it('public markers in source exactly match the documented public allowlist', () => {
        const expected = [...PUBLIC_ALLOWLIST].sort();
        const undocumented = publicMarked.filter((f) => !PUBLIC_ALLOWLIST.has(f));
        const missing = expected.filter((f) => !publicMarked.includes(f));

        expect(
            undocumented,
            `These files carry a // @public-endpoint: marker but are NOT in the documented public ` +
            `allowlist. Either remove the marker and guard them, or add them to PUBLIC_ALLOWLIST with review: ` +
            `${undocumented.join(', ')}`,
        ).toEqual([]);

        expect(
            missing,
            `These documented-public files are MISSING the '// @public-endpoint: <justification>' marker: ` +
            `${missing.join(', ')}`,
        ).toEqual([]);

        expect(publicMarked).toEqual(expected);
    });

    /**
     * The router/sub-handler allowlist must not rot: every entry must exist as a handler file AND
     * structurally route through a guard (delegate to a withAuth module, or be dispatched by a
     * withAuth parent). An entry that stops doing so is flagged so the allowlist stays meaningful.
     * **Validates: Requirements 7.1, 3.2**
     */
    it('every router/parent allowlist entry exists and is structurally verified to route through a guard', () => {
        const known = new Set(handlers.map((h) => h.rel));
        const missing = [...ROUTER_PARENT_ALLOWLIST].filter((f) => !known.has(f)).sort();
        expect(
            missing,
            `ROUTER_PARENT_ALLOWLIST references handler files that no longer exist (remove or update): ${missing.join(', ')}`,
        ).toEqual([]);

        const unverified: string[] = [];
        for (const f of ROUTER_PARENT_ALLOWLIST) {
            const h = handlers.find((x) => x.rel === f);
            if (!h) continue;
            const ok = !!delegatesToGuarded(h, byAbs, srcOf) || !!guardedByParent(h, handlers);
            if (!ok) unverified.push(f);
        }
        expect(
            unverified.sort(),
            `These allowlisted router/sub-handlers no longer delegate to / are dispatched by a withAuth ` +
            `module (stale allowlist or a guard was removed): ${unverified.join(', ')}`,
        ).toEqual([]);
    });

    /**
     * Property: for EVERY handler file (sampled across the whole tree), its classification is an
     * allowed category — never a VIOLATION. This is the universal form of the CC-2 invariant.
     * **Validates: Requirements 7.1, 7.2, 3.2**
     */
    it('property: every handler file classifies as guarded | public | router-or-parent', () => {
        expect(handlers.length).toBeGreaterThan(0);
        fc.assert(
            fc.property(fc.constantFrom(...handlers), (h) => {
                const c = classifications.get(h.rel)!;
                return c.category === 'guarded' || c.category === 'public' || c.category === 'router-or-parent';
            }),
            { numRuns: Math.min(50, handlers.length) },
        );
    });
});
