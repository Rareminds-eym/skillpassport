#!/usr/bin/env npx tsx
/**
 * generate-role-types.ts — emit the canonical role module from the app DB.
 *
 * Spec: rbac-architecture-violations-fix | Phase: P3 | Task: 18.1
 * Property 4 / FC-7: the generator exists and (task 18.2) CI fails on drift
 * between the DB and the generated file.
 *
 * WHAT
 *   Reads the app-DB shadow `public.roles` table (the 16 canonical SSO role
 *   names, synced from the sso-worker) and the app-owned `public.role_categories`
 *   table (the admin/educator/recruiter/learner/system grouping), then EMITS
 *   `src/shared/types/generated/roles.ts` with:
 *     - `SSO_ROLES`        (as const tuple of role names)
 *     - `UserRole`         (= (typeof SSO_ROLES)[number])
 *     - `ROLE_CATEGORIES`  (as const map: category -> role names)
 *     - `RoleCategory`     (= keyof typeof ROLE_CATEGORIES)
 *
 *   This makes the DB the single source of truth for the role taxonomy; the
 *   file is no longer hand-maintained.
 *
 * DETERMINISM (critical for drift detection in task 18.2)
 *   The emitted file MUST be byte-stable for a given DB state, independent of
 *   row insertion order. We therefore SORT everything in JS (never rely on DB
 *   row order):
 *     - SSO_ROLES            : role names sorted alphabetically (ascending).
 *     - ROLE_CATEGORIES keys : category names sorted alphabetically.
 *     - roles within category: sorted alphabetically.
 *   Alphabetical ordering is fully deterministic, requires no hand-maintained
 *   reference list, and lets a brand-new role slot in automatically. (This
 *   differs from the original hand-authored curated order; the regenerated file
 *   is the new canonical — it is generated, so reordering is expected/benign.
 *   No runtime code depends on SSO_ROLES/ROLE_CATEGORIES ordering: `UserRole`
 *   is order-independent, `pickPrimaryRole` has its own priority list, and the
 *   rbac property tests compare by set membership.)
 *
 * CONNECTION (local-by-default, READ-ONLY)
 *   Uses `@supabase/supabase-js` (already a dependency; mirrors the pattern in
 *   scripts/remove-user-addons.ts) against the LOCAL Supabase App DB by default.
 *   Only SELECTs are issued — the generator NEVER writes to the DB. Override via
 *   env for non-local runs:
 *     ROLE_GEN_SUPABASE_URL  | SUPABASE_URL              (default http://127.0.0.1:54321)
 *     ROLE_GEN_SERVICE_KEY   | SUPABASE_SERVICE_ROLE_KEY (default local service-role key)
 *
 * USAGE
 *   npm run generate:roles
 *   npx tsx scripts/generate-role-types.ts
 *   npx tsx scripts/generate-role-types.ts --check   (print would-be output to stdout, do not write)
 *   npx tsx scripts/generate-role-types.ts --verify  (drift check: compare committed file vs DB,
 *                                                     exit non-zero on drift; alias: --ci)
 *
 * DRIFT CHECK (task 18.2 — FC-7)
 *   `--verify` (alias `--ci`) regenerates the module in memory and compares it
 *   BYTE-FOR-BYTE against the committed `src/shared/types/generated/roles.ts`.
 *     - identical            → prints OK, exits 0.
 *     - differs / missing    → prints a diff + remediation, exits 1 (stale).
 *   Wired into CI (`.github/workflows/roles-drift.yml`) and the pre-commit hook
 *   (`.githooks/pre-commit`) via the `check:roles` / `check:roles:precommit`
 *   npm scripts.
 *
 *   DB AVAILABILITY (never false-green):
 *     The check needs the app DB to read from. If the DB is UNREACHABLE the
 *     check FAILS (exit 1) by default — it must never pass silently. Pass
 *     `--allow-db-unavailable` (used by the local pre-commit hook only) to
 *     downgrade an unreachable DB to an explicit skip-with-warning (exit 0).
 *     CI does NOT pass this flag, so in CI an unreachable DB is a hard failure.
 *     A real drift (DB reachable, file stale) ALWAYS fails regardless of flags.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── Config (local-only defaults; never points to production) ────────────────

const SUPABASE_URL =
    process.env.ROLE_GEN_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    'http://127.0.0.1:54321';

// Local Supabase service-role key (same constant used by remove-user-addons.ts).
// Only ever used to READ reference tables from the LOCAL instance by default.
const LOCAL_SERVICE_ROLE_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const SERVICE_KEY =
    process.env.ROLE_GEN_SERVICE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    LOCAL_SERVICE_ROLE_KEY;

// Output path relative to the repo root (this script lives in <root>/scripts).
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const OUTPUT_PATH = path.join(REPO_ROOT, 'src/shared/types/generated/roles.ts');

const KNOWN_CATEGORIES = ['admin', 'educator', 'recruiter', 'learner', 'system'] as const;

// ─── DB reads (SELECT-only) ──────────────────────────────────────────────────

interface RoleCategoryRow {
    role_name: string;
    category: string;
    priority: number | null;
}

async function readRoleNames(
    supabase: ReturnType<typeof createClient>,
): Promise<string[]> {
    const { data, error } = await supabase.from('roles').select('name');
    if (error) {
        throw new Error(`Failed to read public.roles: ${error.message}`);
    }
    const names = (data ?? [])
        .map((r) => (r as { name: unknown }).name)
        .filter((n): n is string => typeof n === 'string' && n.length > 0);
    if (names.length === 0) {
        throw new Error(
            'public.roles is empty — run the sso-worker shadow sync (or seed) before generating.',
        );
    }
    // Deterministic: sort + dedupe.
    return [...new Set(names)].sort((a, b) => a.localeCompare(b, 'en'));
}

async function readRoleCategories(
    supabase: ReturnType<typeof createClient>,
): Promise<Map<string, string[]>> {
    const { data, error } = await supabase
        .from('role_categories')
        .select('role_name, category, priority');
    if (error) {
        throw new Error(`Failed to read public.role_categories: ${error.message}`);
    }
    const rows = (data ?? []) as unknown as RoleCategoryRow[];
    if (rows.length === 0) {
        throw new Error(
            'public.role_categories is empty — seed it (seed_rbac_role_categories.sql) before generating.',
        );
    }

    const byCategory = new Map<string, Set<string>>();
    for (const row of rows) {
        if (!row.category || !row.role_name) continue;
        if (!byCategory.has(row.category)) byCategory.set(row.category, new Set());
        byCategory.get(row.category)!.add(row.role_name);
    }

    // Fail loudly on an unexpected category so drift detection (18.2) surfaces it.
    for (const category of byCategory.keys()) {
        if (!KNOWN_CATEGORIES.includes(category as (typeof KNOWN_CATEGORIES)[number])) {
            throw new Error(
                `Unexpected role category '${category}' in public.role_categories. ` +
                `Known categories: ${KNOWN_CATEGORIES.join(', ')}. ` +
                'If this is intentional, update RoleCategory in the generator/design.',
            );
        }
    }

    // Deterministic: category keys sorted alphabetically; roles within each sorted alphabetically.
    const result = new Map<string, string[]>();
    for (const category of [...byCategory.keys()].sort((a, b) => a.localeCompare(b, 'en'))) {
        const names = [...byCategory.get(category)!].sort((a, b) => a.localeCompare(b, 'en'));
        result.set(category, names);
    }
    return result;
}

// ─── Emit the TypeScript module ──────────────────────────────────────────────

function renderModule(ssoRoles: string[], categories: Map<string, string[]>): string {
    const ssoRoleLines = ssoRoles.map((r) => `    '${r}',`).join('\n');

    const categoryLines = [...categories.entries()]
        .map(([category, names]) => {
            const inner = names.map((n) => `'${n}'`).join(', ');
            return `    ${category}: [${inner}],`;
        })
        .join('\n');

    return `/**
 * Canonical role definitions for the SkillPassport RBAC system.
 *
 * ⚠️ AUTO-GENERATED — DO NOT EDIT BY HAND.
 * Regenerate with: \`npm run generate:roles\` (scripts/generate-role-types.ts).
 *
 * Source of truth: the app-DB shadow \`public.roles\` table (synced from the
 * sso-worker) and the app-owned \`public.role_categories\` table. The generator
 * reads both (READ-ONLY) and emits this file. A CI / pre-commit drift check
 * (task 18.2) re-runs the generator and fails if this file is stale.
 *
 * Ordering is alphabetical for determinism (stable diffs for drift detection);
 * no runtime code depends on the order. Runtime authorization is enforced in
 * Cloudflare Functions from the verified JWT — NOT from these constants. The
 * \`ROLE_CATEGORIES\` constant is for compile-time type-safety and frontend UX
 * only; runtime category membership is read from \`role_categories\` so a role's
 * category can change with a DB-only edit.
 */

/**
 * The canonical set of SSO roles, mirrored from the app-DB shadow \`roles\`
 * table. Used to derive the \`UserRole\` union.
 */
export const SSO_ROLES = [
${ssoRoleLines}
] as const;

/**
 * The canonical role type. This is the ONLY place \`UserRole\` is defined;
 * all other modules re-export or import it (see Phase P1, task 6.2).
 */
export type UserRole = (typeof SSO_ROLES)[number];

/**
 * Role groupings, mirrored from the app-owned \`role_categories\` table.
 *
 * NOTE: this constant is for COMPILE-TIME type-safety and frontend UX only.
 * Runtime authorization MUST read \`role_categories\` from the shadow DB so a
 * role's category membership can change with a DB-only edit (E3.2 / E3.3).
 */
export const ROLE_CATEGORIES = {
${categoryLines}
} as const;

/**
 * The set of role-category names. Derived from \`ROLE_CATEGORIES\` keys for
 * type-safe category references.
 */
export type RoleCategory = keyof typeof ROLE_CATEGORIES;
`;
}

// ─── Drift-check helpers (task 18.2) ─────────────────────────────────────────

/**
 * Heuristic: does this error indicate the app DB is UNREACHABLE (vs. a real
 * query/schema/data error)? Connection failures must be treated differently
 * from "table empty"/"unexpected category" so the drift check never reports a
 * false drift when the DB is simply down.
 */
function isDbUnavailable(message: string): boolean {
    const m = message.toLowerCase();
    return (
        m.includes('fetch failed') ||
        m.includes('econnrefused') ||
        m.includes('enotfound') ||
        m.includes('eai_again') ||
        m.includes('getaddrinfo') ||
        m.includes('socket hang up') ||
        m.includes('network') ||
        m.includes('timeout') ||
        m.includes('failed to fetch')
    );
}

/** Generate the module contents from the DB (READ-ONLY). */
async function generateContents(): Promise<string> {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
    const [ssoRoles, categories] = await Promise.all([
        readRoleNames(supabase),
        readRoleCategories(supabase),
    ]);
    return renderModule(ssoRoles, categories);
}

/** Print a compact first-difference report between expected and actual. */
function printDiff(expected: string, actual: string | null): void {
    if (actual === null) {
        console.error('   (committed file is missing entirely)');
        return;
    }
    const exp = expected.split('\n');
    const act = actual.split('\n');
    const max = Math.max(exp.length, act.length);
    let shown = 0;
    for (let i = 0; i < max && shown < 10; i++) {
        if (exp[i] !== act[i]) {
            console.error(`   L${i + 1}:`);
            console.error(`     committed : ${act[i] ?? '<missing>'}`);
            console.error(`     generated : ${exp[i] ?? '<missing>'}`);
            shown++;
        }
    }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const checkOnly = args.includes('--check');
    const verify = args.includes('--verify') || args.includes('--ci');
    const allowDbUnavailable = args.includes('--allow-db-unavailable');

    let contents: string;
    try {
        contents = await generateContents();
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // Pre-commit (local) may run without a DB up: skip-with-warning, never false-green.
        if ((verify || checkOnly) && allowDbUnavailable && isDbUnavailable(msg)) {
            console.warn(
                `⚠️  roles drift check SKIPPED — app DB unavailable (${SUPABASE_URL}).\n` +
                '   Start it with `npm run supabase:start` to enable the check. ' +
                '(CI runs this check with a live DB and will catch any drift.)',
            );
            process.exit(0);
        }
        throw err;
    }

    if (verify) {
        let existing: string | null = null;
        try {
            existing = fs.readFileSync(OUTPUT_PATH, 'utf8');
        } catch {
            existing = null;
        }
        const rel = path.relative(REPO_ROOT, OUTPUT_PATH);
        if (existing === contents) {
            console.log(`✅ ${rel} is up to date with the app DB (no drift).`);
            return;
        }
        console.error(`❌ ${rel} is STALE — it does not match the current app DB.`);
        printDiff(contents, existing);
        console.error('');
        console.error('   Fix: run `npm run generate:roles` and commit the updated file.');
        process.exit(1);
    }

    if (checkOnly) {
        process.stdout.write(contents);
        return;
    }

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, contents, 'utf8');

    console.log(`✅ Generated ${path.relative(REPO_ROOT, OUTPUT_PATH)}`);
    console.log(`   (written from ${SUPABASE_URL})`);
}

main().catch((err) => {
    console.error('❌ generate-role-types failed:', err instanceof Error ? err.message : err);
    process.exit(1);
});
