# Learner recommendation audit evidence

Audit ID: `LJR-2026-10-12`. Main report: [LEARNER_JOB_RECOMMENDATION_AUDIT.md](../../LEARNER_JOB_RECOMMENDATION_AUDIT.md).

This bundle makes the source-level findings independently reproducible. It does not certify deployed behavior or recommendation quality.

Current implementation overlay: [implementation and release record](../../LEARNER_JOB_RECOMMENDATION_IMPLEMENTATION.md). October 16 evidence: [186 native tests across nine files](20261016-followup-tests.json), [24 passing boundary checks with two historical skips](20261016-followup-boundaries.json), [isolated PostgreSQL/pgvector migration assertions](20261016-followup-sql.json), and [source fingerprints](20261016-followup-manifest.json). The [live catalog-only preflight](post-remediation-read-only-preflight.sql) is separate and includes the new generic RPC. October 15 `post-remediation-*` JSON, the prior [WP01-only record](WP01_IMPLEMENTATION.md), and older snapshots remain historical. Their hashes may differ from current source; do not regenerate historical snapshots to force green output.

The [selected-file type guard](verify-followup-types.cjs) checks ten named changed/new files using the existing compiler options and test setup; [recorded result](20261016-followup-types.json). Run `node audit-evidence/learner-job-recommendations/verify-followup-types.cjs` from the workspace root. Zero selected diagnostics is **not** a passing full-project typecheck; existing learner-service and broader repository diagnostics remain outside this guard.

## Files

| File | Purpose |
|---|---|
| [verify.cjs](verify.cjs) | Executes actual application source with deterministic fixtures and isolated external dependencies. |
| [verification-results.json](verification-results.json) | Recorded outcomes, runtime versions, fixture time, SHA-256 source fingerprints, and harness fingerprint. |
| [v2.0-verification-results.json](v2.0-verification-results.json) | Retained historical 22-check record; the later October 12 historical baseline is the separate 31-check record. |
| [read-only-verification.sql](read-only-verification.sql) | Transaction-enforced read-only catalog queries for closing live schema gaps; not executed during this audit. |
| [verify-boundaries.cjs](verify-boundaries.cjs) | Independent October 15 WP00 verifier with selector-aware fixtures, characterization/regression modes, and mutation controls. Does not change the historical harness. |
| [boundary-verification-results.json](boundary-verification-results.json) | Recorded October 15 boundary characterization: 26 passes, 16 input fingerprints, and runtime information. PASS includes known defects. |
| [boundary-regression-results.json](boundary-regression-results.json) | Recorded desired-behavior run: 15 passes, nine failures, two characterization-only skips, no setup errors; exit code 1. Not a healthy-system result. |
| [WP01_IMPLEMENTATION.md](WP01_IMPLEMENTATION.md) | Implemented ownership/request-boundary changes, verification, remaining failures, and release limits. |
| [wp01-boundary-regression-results.json](wp01-boundary-regression-results.json) | Post-WP01 desired behavior: 19 passes, five failures, two historical mutation skips, zero setup errors; all four ownership cases pass. |
| [wp01-focused-tests.json](wp01-focused-tests.json) | Native Vitest result: 46 focused tests passed. |
| [wp01-typecheck-comparison.json](wp01-typecheck-comparison.json) | Before/after Functions diagnostic comparison; no changed-file errors, but repository-wide typecheck remains failing. |

## October 15 WP00 boundary verification

From the workspace root:

```bash
node audit-evidence/learner-job-recommendations/verify-boundaries.cjs
node audit-evidence/learner-job-recommendations/verify-boundaries.cjs --assert-snapshot
node audit-evidence/learner-job-recommendations/verify-boundaries.cjs --regression
```

The first two characterize and assert the separately recorded **pre-WP01** October 15 boundary baseline; source changes now invalidate that old snapshot/characterization. At WP00 the third asserted desired behavior and exited 1. The following table describes the nine **pre-WP01** failures; four ownership cases were fixed in WP01, leaving five at that historical phase. All nine now pass in the separately named current regression record; the old failing records are retained:

| Failing cases | Count | Required correction |
|---|---:|---|
| Foreign learner, both matching aliases, cache hit/miss | 4 | Reject before target cache/profile/provider/write work. The miss fixture has no vector and proves the current path reaches provider and persistence. |
| Denied matching entitlement, both aliases | 2 | Check the correct actor and `ai_job_matching` before matching work. |
| Standalone own learner/skill generation with distinct user and learner IDs | 2 | Use the operation's correct identity space without breaking profile/admin user-keyed checks. |
| Zero-row vector update reported as successful persistence | 1 | Explicitly reject or report not published. A structured rejection or the application's typed embedding error is supported by the regression oracle. |

These are nine cases across four issue groups, not nine newly discovered vulnerabilities. The suite does not replace the historical 31 checks or claim broader coverage merely by adding their counts.

Positive controls cover authorized self access through both aliases and cache paths, existing verified-email/UUID rejection, equal-ID generation, profile-user identity, allowed/denied administrative generation, existing foreign-target rejection on standalone generation, one-row persistence, and existing dimension/non-finite validation. The checked-in six-foreign-key map is asserted separately; no PostgreSQL server is executed.

The database fixture dispatches cached rows by the actual `p_learner_id`; query filters and projection determine returned fixture rows. It cannot return a foreign learner's cached job when the application actually selects self. Two characterization-only in-memory router mutations demonstrate that the old success-only oracle misses self-redirection, the selector-aware oracle distinguishes it, and the rejection oracle detects an unsafe route. A hardcoded fixture-only denial is a test control, **not** an application fix. These two historical mutations are explicitly skipped in regression mode so they do not demand that repaired production behavior remain unsafe; no desired-behavior failure is skipped.

Scope: actual application auth wrapper, router, handlers, response builders, UUID validation, local limiter, embedding worker client, and database updater execute. Auth-core transport/verification, Supabase/RPC transport, canonical profile text construction, and embedding provider are fixtures. There is no real JWT verification, deployed service request, SQL execution, browser, network, or production write. The runner prints JSON and writes no files. Runtime is Node 22.22.3, TypeScript 5.5.3, and Zod 3.24.0; fixture time is October 15 at 00:00 UTC.

Exit code 0 means the selected assertions passed, **not** production readiness; 1 means failed assertions; 2 means setup/unexpected execution errors. Snapshot checks cover the 16 recorded source/harness inputs, outcomes, and runtime—not every workspace file or deployed configuration. After source changes, preserve these records and review differences before any explicit new baseline. Change desired-behavior assertions only when the approved contract changes, not to silence failures.

WP00 remains partial: environment inventory, deployed definitions/grants, production entitlement-shadow readiness, independent review, and full browser/SQL acceptance are still open.

## Historical audit reproduction

From the workspace root, with the application's existing dependencies installed:

```bash
node audit-evidence/learner-job-recommendations/verify.cjs --assert-snapshot
```

The recorded runtime is Node 22.22.3, TypeScript 5.5.3, Zod 3.24.0, and Supabase JS 2.57.4. Snapshot mode rejects source changes, runtime/dependency version differences, and harness changes. It deliberately hashes every local SQL migration so additions invalidate older absence claims. SHA-256 fingerprints support consistency checking; these files are not externally signed or tamper-proof.

To characterize a deliberately changed source snapshot without claiming it matches the old audit:

```bash
node audit-evidence/learner-job-recommendations/verify.cjs
```

An optional positional argument selects the `skillpassport` directory. The runner prints JSON to stdout, performs no network requests, and writes no files. It uses local modules from `skillpassport/node_modules`.

## Interpretation

The historical suite has 31 characterization checks and its October 12 record contains 133 input fingerprints. On October 15 the current input set contains 134: the Supabase factory changed and a migration was added, so the old `--assert-snapshot` correctly fails. The new boundary snapshot is separate and does not overwrite that history. A PASS means an assertion about the observed behavior was reproduced. Several assertions intentionally reproduce defects; PASS does **not** mean those defects are fixed or the application is production-ready. After remediation, update expectations only with an explicit re-audit and new source fingerprints.

Actual application modules are transpiled and run in Node VM contexts. External SSO transport, Supabase transport, embedding responses, and response-envelope helpers are isolated. The application auth wrapper, UUID validation, service-role factory, embedding binding lookup, and rate limiter execute actual source. React mapping is exercised before JSX rendering; SQL is not executed; deployed JWT validation and browser behavior are not covered.

The extension also executes the actual profile text builder with related-query failures and extracts the actual page Apply callback using the TypeScript AST. Redirects are intercepted fixture calls, not a browser test. SQL return-field assertions inspect the checked-in function signature; they do not prove that the same function is deployed. Controls cover successful hydration and rejection of core-profile read failure.

Fixture user IDs and job names are synthetic. The clock supplied to application modules is fixed at `2026-10-12T00:00:00Z` to keep recency and rate-limit tests deterministic. The evidence JSON's collection timestamp uses the real runner clock.

The suite stops on a failed assertion or an unexpected dependency. Missing local tooling is a setup failure, not proof of an application defect. When source fingerprints differ, review the difference rather than rewriting the baseline to force a pass.

## Close the deployment gaps

Run the catalog SQL through an approved read-only connection to the intended environment and retain the output with a timestamp and deployment identifier. The script does not invoke application RPCs that could update caches or embeddings. No connection credentials are stored in this bundle.

Behavioral API testing is a separate exercise: the recommendation POST can persist embeddings and cache results; authentication self-heal can write application records. Use controlled test accounts and the intended test environment for those scenarios. Do not describe them as read-only probes merely because they retrieve recommendations.
