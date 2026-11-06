# WP01 — Recommendation ownership implementation

Date: 2026-10-15  
Base application commit: `1a9c21575b303b838831e35670f5d338966342f7`  
State: implemented in the working tree; locally verified; not committed or deployed by this task.

Plan: [learner recommendation fix plan](../../LEARNER_JOB_RECOMMENDATION_FIX_PLAN.md). This implements the WP01 ownership/request-boundary slice, not the complete audit backlog.

## Changes

- Both `/api/career/recommend-opportunities` and `/api/career/recommend` pass the authenticated user ID to the matching handler.
- The handler requires that server-supplied actor and resolves `learners.id` through `learners.user_id`. It rejects a foreign or nonexistent requested target with the same 403 response before target cache, profile, embedding, ranking, or persistence work. It does not query whether that foreign target exists.
- A missing own mapping returns 404. Lookup errors/throws or an inconsistent resolved identity fail closed with a sanitized 500; they do not become generic matching requests.
- Request JSON must be an object with a valid learner UUID, boolean `forceRefresh`, and integer `limit` from 1 to 50. Defaults remain 20 and false. This intentionally replaces previous coercion/clamping of malformed/out-of-range limits with 400 responses. The current UI supplies numeric limit 3.
- All matching/cache/vector operations use the resolved learner primary ID. Feedback uses the resolved subject's user ID, matching the checked-in interaction foreign key. The fresh learner-vector read additionally constrains the row by its resolved user ID.
- Matching rate limiting is keyed by the verified subject's user ID, not the client target. This remains a local/per-instance limiter, not a new distributed quota.
- The router now types its callback as a Pages request context rather than an auth-core verified-user context. Authentication still uses the existing application wrapper; no JWT or role policy was replaced.

Production files: [router](../../skillpassport/functions/api/career/[[path]].ts), [handler](../../skillpassport/functions/api/career/handlers/recommend.ts).  
Focused tests: [career-recommend-ownership.test.ts](../../skillpassport/functions/__tests__/api/career-recommend-ownership.test.ts).

Focused test source SHA-256: `cc8129493d39e0ceaa842d704f825cd7c4ebca88a94bf9355c0cc5bc64a6eea0`. Production source fingerprints are recorded in the post-WP01 boundary result below.

## Verification

| Check | Result | Evidence / limit |
|---|---|---|
| Focused router/handler tests | 46 passed, zero failed | [Vitest JSON](wp01-focused-tests.json). Authentication transport, database/provider, and unrelated handlers are isolated; real router, matching handler, response utilities, and validation execute. |
| Independent boundary regression | 19 passed, five failed, two historical mutation skips, zero setup errors | [Post-WP01 result](wp01-boundary-regression-results.json). All four foreign-target ownership cases now pass through the actual application auth wrapper/router with fixture transports. |
| Ownership rejection mutation | All four ownership cases fail when the mismatch rejection is disabled in memory | App files were not changed by the probe. Canonical self selectors still constrain that mutated path; this proves the selected reject-foreign contract oracle, not that removing that one guard alone discloses a foreign profile. |
| Pages Functions bundle | Compiled successfully | Local Wrangler 4.120.1 build with compatibility date 2026-09-04 and `nodejs_compat`; no deployment. Generated bundle does not contain the new test name, test-only private-host marker, or Vitest import marker. |
| Functions TypeScript comparison | 6,994 baseline diagnostics; 6,991 current; zero diagnostics in the two changed production files and new test | [Comparison](wp01-typecheck-comparison.json). Compiler-host comparison used original HEAD contents for the two production files, excluding the new test from baseline roots. The repository-wide typecheck is **not green**. |
| Patch whitespace | Passed `git diff --check` | Application working tree only. |

Focused coverage includes both aliases, existing and nonexistent foreign targets, cache/forced-refresh settings, distinct-ID and equal-ID self access, canonical user/learner key selection, client identity/role spoofing, missing mappings, lookup failures, inconsistent ownership results, rate-limit key and denial, authorized vector persistence, uppercase UUID spelling, malformed JSON/body/parameters, supported/default limits, unsupported method, and a missing handler actor.

### Remaining boundary failures — not waived

1. `ENT/recommend-opportunities` and `ENT/recommend`: matching entitlement is not yet enforced. WP02 needs the existing shadow-readiness and rollout checks.
2. `GEN/distinct/learners` and `GEN/distinct/skills`: standalone generation still confuses actor and learner identities. That separate endpoint was not changed here.
3. `WRITE/zero`: the embedding updater still reports success for zero affected rows. This is separate WP03/WP07 work.

These five cases do not represent the complete remaining C02–C11/R/L backlog. Passing WP01 is not completion of ranking, availability, freshness, details/apply, model compatibility, or production security assurance.

## Reproduce the current checks

From `skillpassport/`:

```bash
./node_modules/.bin/vitest run functions/__tests__/api/career-recommend-ownership.test.ts --environment node
```

From the workspace root:

```bash
node audit-evidence/learner-job-recommendations/verify-boundaries.cjs --regression
```

The second command currently exits 1 because the five non-WP01 failures remain. It is not an allowed-to-fail release gate for those later packages.

For the Functions bundle, create a fresh temporary output directory and run the locally installed Wrangler `pages functions build functions` with `--outdir`, `--output-config-path`, and `--output-routes-path` pointing there, compatibility date `2026-09-04`, and compatibility flag `nodejs_compat`. Use a temporary `WRANGLER_LOG_PATH` and disable telemetry as appropriate. Do not use a deploy command for a build check.

### Reproduce the in-memory rejection mutation

From the workspace root; this changes no application files:

```bash
node <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const runner = path.resolve('audit-evidence/learner-job-recommendations/verify-boundaries.cjs');
const target = path.resolve('skillpassport/functions/api/career/handlers/recommend.ts');
const source = fs.readFileSync(runner, 'utf8');
const condition = 'requestedLearnerId.toLowerCase() !== identity.id.toLowerCase()';
assert.equal(fs.readFileSync(target, 'utf8').split(condition).length, 2);
const reader = Object.create(fs);
reader.readFileSync = (file, ...args) => {
  const value = fs.readFileSync(file, ...args);
  if (path.resolve(String(file)) !== target) return value;
  const changed = String(value).replace(condition, 'false');
  return Buffer.isBuffer(value) ? Buffer.from(changed) : changed;
};
const fixtureProcess = { argv: [process.execPath, runner, '--regression'], version: process.version, exitCode: 0 };
new Promise((resolve, reject) => {
  const module = { exports: {} };
  new Function('require', 'module', 'exports', '__dirname', '__filename', 'process', 'console', source)(
    name => name === 'node:fs' ? reader : require(name), module, module.exports,
    path.dirname(runner), runner, fixtureProcess,
    { log: value => resolve(JSON.parse(value)), error: reject }
  );
}).then(result => {
  const cases = result.results.filter(test => test.id.startsWith('OWN/'));
  assert.equal(cases.length, 4);
  assert(cases.every(test => test.result === 'FAIL'));
  assert.equal(result.setupErrors, 0);
  console.log('PASS: all four ownership rejection tests detect the in-memory mutation');
}).catch(error => { console.error(error); process.exitCode = 1; });
NODE
```

## Historical evidence and release limits

The October 12 audit/harness/JSON and pre-fix October 15 boundary snapshots remain unchanged. Their characterization expectations intentionally describe the old code. They are not expected to remain green against this repaired working tree, and their old mutation anchor describes the old router signature. Do not rewrite those records to pretend the old defects disappeared without a source change. Current WP01 verification uses the desired-behavior command and newly named evidence files.

No production SQL, entitlement shadow, actual learner session, external provider, browser journey, or production performance was verified. Before deployment, confirm the live identity/interaction key contracts, exercise controlled allowed/denied accounts, account for one extra indexed learner-identity lookup on cache hits, and keep the ownership guard in place during any rollback. Source-level C01 remediation is implemented; deployed closure is pending.
