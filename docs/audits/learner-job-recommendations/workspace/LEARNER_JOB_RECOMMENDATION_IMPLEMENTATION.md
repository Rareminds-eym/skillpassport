# Learner job recommendations — implementation and release record

Updated: 2026-10-16 (initial implementation: 2026-10-15)  
Baseline: `skillpassport/` commit `1a9c21575b303b838831e35670f5d338966342f7`  
State: working-tree implementation; locally verified; **not committed or deployed**.

Implementation overlay for the [audit](LEARNER_JOB_RECOMMENDATION_AUDIT.md) and [fix plan](LEARNER_JOB_RECOMMENDATION_FIX_PLAN.md). Historical evidence remains historical. Local fixes are not production closure.

## Implemented changes

### Access and identity

- Both aliases enforce verified ownership and canonical `ai_job_matching` entitlement before recommendation work. User and learner primary IDs remain distinct; feedback uses its checked-in user foreign key.
- Standalone generation resolves learner/child ownership without breaking user-keyed profile/admin checks. Options require booleans; malformed bodies receive controlled errors.
- Legacy feedback uses `interaction_type`, validates supported actions, checks ownership and persists the canonical user key. Section hiding remains section hiding, not per-job feedback.
- Application creation checks self ownership and current job availability. This is not certification of the broader application/recruiter/AI-tutor authorization surface.
- Matching uses its own actor-keyed five-per-minute, per-instance bucket rather than consuming the chat/generation bucket. No distributed quota is claimed.
- The shared canonical resolver now honors its existing tested contract for cancelled subscriptions: preserve unexpired paid time, deny expired/missing expiry. Its mock now respects status filters. No competing entitlement source was introduced.

### Failures and data contracts

- Provider output and persistence share dense-array, dimensionality, finite/float32-representability and nonzero-vector validation. Skipping persistence cannot bypass response validation.
- Long-input truncation and malformed responses no longer reference undefined identifiers. Configured model mismatches fail before publication.
- Zero-row writes fail acknowledgement, including batch callers. Required evidence errors stop aggregate text building; capped selections have deterministic ordering and bounded course selection.
- Dismissal outages are not empty feedback. Ranking plus fallback failure returns a service error, not successful emptiness. Optional cache persistence failure preserves valid fresh results with `cache_saved: false`.
- Shared availability is open, active, and null/strictly-future deadline. It applies before candidate limits in dashboard, learner browsing and chat, and again at hydration/action boundaries. Recruiter access to closed detail records is retained. This predicate is not a claim of full hiring/academic eligibility.
- Rank/cache rows supply scores only; current allowlisted opportunity fields supply Details/Apply. Closed, expired, inactive, deleted, duplicate and dismissed IDs are removed.
- Malformed skills do not crash the dashboard. Writes normalize existing comma-separated strings and reject malformed array elements.
- Overall index and similarity stay distinct. Zero remains zero; missing/generic/unknown-provenance scores remain absent. Fallback provenance/reason survives adapters; backend recommendation flags are preserved.
- My Skills has the matching UX gate. Structured errors retain message/code/status. Generic results and sample jobs are honestly labelled; sample applications are disabled.
- Details and Apply refresh authoritative job data. External navigation is not described as proof of employer submission; unknown/blocked popup outcomes have retry guidance.
- Recommendation transport is private/no-store, independently of the authorized database cache.

### Freshness and concurrency

The [additive migration](skillpassport/supabase/migrations/20261015090000_recommendation_boundaries_and_revisions.sql) creates recommendation-specific state instead of adopting unversioned legacy vectors.

1. Source changes advance monotonic learner input revisions; catalog changes advance a separate revision. Feedback resolves its user key before learner invalidation.
2. Every state/cache validation rechecks actor ownership inside a short transaction, with a key-share lock protecting ownership/deletion during the read.
3. The handler compares revisions before and after the multi-query text build, **before provider work**. Changed builds are rejected.
4. Vector publication atomically checks revision and owner. Match publication additionally checks catalog revision. Final validation rejects obsolete results.
5. Cache identity covers input/catalog revision, model, preprocessing version, ranking-policy version and expiry. Cached V1/V2 algorithm provenance is retained; cached IDs are still rehydrated. Certificate clock expiry is fenced by the next expiry/daily ceiling.
6. Content changes clear retained legacy entity/job vectors to null/pending; view-counter changes do not clear the job vector. No unknown worker is invented or deployed.
7. Matching, dashboard and profile hooks reject obsolete responses, isolate accounts/learners, clear disabled state and guard overlapping refreshes. Shared learner mutations emit saved-profile notifications; matching coalesces these with prop-driven fetches.
8. Section-hide storage is learner-scoped. Already-applied state remains intact.

The migration restricts legacy cache functions and installed enhanced ranking overloads, preserves service-role access, and restricts new state tables/functions. It does not assume Supabase `auth.uid()` equals the application's SSO identity.

### October 16 follow-up: four missed gaps repaired

1. **Version identity:** `recommendation-versions.ts` defines separately maintained preprocessing and ranking-policy versions. State reads, vector publication and match publication carry the relevant versions. A preprocessing change hides the prior vector and cache; a ranking-only change hides the cache while retaining the compatible vector. V1/V2 provenance survives cache hits. Final vector validation also rejects a concurrent vector-space replacement. Bump preprocessing for text selection/normalization/truncation changes and ranking policy for scoring/candidate/threshold/fallback changes, including deployed SQL changes; align those versions with the actual installed code before enabling personalization.
2. **Save versus refresh:** acknowledged shared learner writes emit learner-scoped invalidation before post-save profile reads. A failed read returns committed-save success plus `refreshError`, rather than inviting an unsafe duplicate save. Hooks retain the last complete profile and expose the refresh warning. Existing multi-request saves remain nontransactional; partially committed training/combined-skills updates are explicitly reported and already acknowledged writes still invalidate recommendations. Events are same-tab, not cross-tab synchronization.
3. **Generic candidate selection:** the service-only, actor-bound `get_generic_recommendations_v3` filters open/active/future-deadline opportunities and user-keyed dismissals **before LIMIT**. It returns ranked IDs for authoritative hydration. The prior legacy RPC's limited prefix could consist entirely of dismissed jobs. Foreign-owner/invalid responses and dependency errors are not healthy empty results. Concurrent job changes during subsequent hydration can still reduce the final count; this is not a claim that a full page is guaranteed under continuous catalog edits.
4. **External application journey:** a shared absolute HTTP(S)-only URL guard and opener-isolated navigation cover Apply, Saved Jobs and the active Details retry. Apply refreshes authoritative job data and propagates that DTO to Details/saved snapshots. Invalid destinations are rejected before recording. External records are labelled Recorded, not employer-submitted. Confirmation awaits an acknowledged result; false/rejected actions no longer manufacture success. A browser-opening exception after a committed record preserves success and gives retry guidance; a null opener-isolated handle does not prove failure.

The Supabase/Postgres skill guided versioned state contracts, scoped function privileges and short database transactions. Parallel implementation was followed by parent integration checks; this is not an independent external audit.

## Conservative runtime defaults

| Setting | Contract |
|---|---|
| `JOB_MATCHING_ENABLED=false` | Kill switch for both aliases; access protections remain. |
| `MATCHING_EMBEDDING_MODEL` | Must match the actual worker-reported model. No legacy model is guessed. |
| `MATCHING_CATALOG_MODEL` | Operator attestation of compatible catalog/entity vector space; dimensions alone are insufficient. |
| `MATCHING_VECTOR_PIPELINE_VERIFIED=true` | Required attestation that retained entity/job writers are inventoried and fenced or disabled. Unit tests alone do not justify setting it. |

Without model/pipeline verification, authorized requests return explicitly generic eligible opportunities without personal percentages. Missing versioned RPCs after opting into personalization cause a service error. There is no entitlement allow-all or fallback to unsafe/unversioned cache data.

Deployment order: verify shadows/contracts; rehearse/apply the migration in intended staging; validate; deploy compatible backend; deploy clients; authorize a verified personalization cohort. The revised, locally unapplied migration changes the new v3 function signatures; do not mix the prior v3 backend with this schema. Even generic fallback now needs the new generic RPC. If a prior v3 schema has been applied externally, prepare and rehearse a separate additive upgrade rather than rerunning this create-table migration. **No production migration/configuration was changed here.**

## Verification

| Check | Local result / limitation |
|---|---|
| Native regression suite | 186 tests passed across nine files; [October 16 JSON](audit-evidence/learner-job-recommendations/20261016-followup-tests.json). Actual handlers, adapters, services, rendered hooks and active Details component; external transports are fixtures. The [October 15 128-test snapshot](audit-evidence/learner-job-recommendations/post-remediation-tests.json) is historical. |
| Independent boundaries | 24 passed, zero failed/setup errors, two historical mutation-only skips; [October 16 result](audit-evidence/learner-job-recommendations/20261016-followup-boundaries.json). Skips are not waived application failures. |
| Actual SQL | Migration executed in a network-isolated disposable Supabase PostgreSQL 17/pgvector database against a representative minimal prior-schema fixture. [Fixture](skillpassport/functions/__tests__/sql/recommendation-fixture.sql), [assertions](skillpassport/functions/__tests__/sql/recommendation-revisions.sql). |
| SQL coverage | Owner/model/preprocessing/ranking-policy/revision isolation, algorithm provenance, generic pre-limit filtering, obsolete publication, catalog/feedback invalidation, expiry, owner transfer, deletion, dirty vectors, effective PUBLIC/anon/authenticated denial and retained service-role access; [October 16 record](audit-evidence/learner-job-recommendations/20261016-followup-sql.json). Not a full production-schema upgrade or load test. |
| Builds | Frontend Vite and Pages Functions compile locally. Existing chunk-size/circular-dependency warnings remain; compilation is not browser acceptance. |
| Historical October 15 Functions comparison | 6,994 baseline diagnostics versus 6,714 at that comparison; zero introduced touched-file diagnostic messages then. This is historical, not a whole-repository certification of October 16 changes. Repository typecheck is **not green**. |
| October 16 selected diagnostics | The [repeatable selected-file guard](audit-evidence/learner-job-recommendations/verify-followup-types.cjs) reports zero syntax/semantic diagnostics across four Functions and six frontend files, with existing compiler options/test setup; [result](audit-evidence/learner-job-recommendations/20261016-followup-types.json). New test fixture/import errors and touched Saved Jobs type errors were corrected without suppressions. Full frontend checking still reports learner-service issues; a new unnecessary cast was removed. This is not a passing whole-repository typecheck. |
| Whitespace | Checked using `core.whitespace=cr-at-eol`, preserving existing CRLF files. |

SQL testing caught a pgvector operator/search-path error; it was corrected, then the final migration passed a clean rerun. Failed earlier attempts are not counted as final successful validation. Historical audit/pre-fix JSON and WP01 records remain unchanged.

### Reproduce

From `skillpassport/`:

```bash
./node_modules/.bin/vitest run \
  functions/__tests__/api/career-recommend-ownership.test.ts \
  functions/__tests__/api/recommendation-embedding.test.ts \
  functions/__tests__/api/recommendation-surfaces.test.ts \
  functions/lib/__tests__/entitlements.test.ts \
  src/features/opportunities/model/__tests__/recommendation-lifecycle.test.tsx \
  src/features/opportunities/api/__tests__/aiJobMatchingService.test.ts \
  src/entities/learner/api/__tests__/mutation-invalidation.test.tsx \
  src/features/opportunities/lib/__tests__/externalApplication.test.tsx \
  src/features/opportunities/model/__tests__/saved-job-application.test.tsx
```

From the workspace root:

```bash
node audit-evidence/learner-job-recommendations/verify-boundaries.cjs --regression
node audit-evidence/learner-job-recommendations/verify-followup-types.cjs
```

For SQL, create a fresh **disposable** PostgreSQL/pgvector database and execute the fixture, actual migration, then assertions using `psql -v ON_ERROR_STOP=1`. The fixture deliberately changes local default privileges. **Never run fixtures/assertions against staging or production.** Use the separate [catalog-only preflight](audit-evidence/learner-job-recommendations/post-remediation-read-only-preflight.sql) under approved live read access. It inspects definitions/owners/effective ACLs/FKs/triggers and calls no recommendation RPC.

## Package disposition and remaining gates

| Package | Local implementation | Remaining closure evidence |
|---|---|---|
| WP00 | Permanent tests, current evidence, preserved history. | Live environment/SSO/definition inventory and independent review. |
| WP01 | Ownership, request validation, actor-bound state reads. | Controlled deployed allowed/denied accounts. |
| WP02 | Canonical entitlement enforcement and matching UX. | Shadow readiness; entitled/denied/expired/add-on accounts; shared cancellation-contract acceptance. |
| WP03 | Failure classification, complete-input checks, vector/write validation. | Real binding/provider/database outage acceptance. |
| WP04 | Shared local availability and action checks. | Actual status/deadline policy and data compatibility approval. |
| WP05 | Hydration, scores/provenance, labels/errors, action refresh. | Real Details/Apply/browser/popup journey and internal/external submission distinction. |
| WP06 | Versioned actor-bound, rehydrated cache. | Deployed contracts and concurrency/load acceptance. |
| WP07 | Aggregate publication fenced; dirty legacy vectors invalidated. | **Retained entity/job producer inventory, guarded publication/recovery, model lineage and regeneration ownership. Keep readiness off until resolved.** |
| WP08 | Hook races, account isolation, shared saved-edit notifications. | Real account-switch and all retained mutation-path acceptance. |
| WP09 | Additive migration, scoped permissions, disposable integration tests. | Full intended-schema upgrade rehearsal, dependencies, lock/query budgets and authorized application. |
| WP10 | Legacy feedback repaired, samples labelled, unused chat experience filter removed without changing chat quota. | Evidence eligibility, preferences, demographic/input policy and external consumer sign-off. |
| WP11 | Deterministic correctness/failure tests. | Representative judged quality dataset; measured relevance/recall/cost/latency/freshness budgets. |
| WP12 | Kill switch, conservative defaults and release sequence. | Authorized staging/cohort rollout, observation, rollback rehearsal and independent sign-off. |

All C/R/L items remain traceable to the original plan. No preference schema was guessed, weights secretly rebalanced, assessment/LTE feed invented, vectors bulk replaced, or deployed worker assumed healthy from a hostname.

## Release / rollback requirements

1. Collect deployment/migration/worker revisions and preflight output. Verify the live interaction FK. Review legitimate direct RPC consumers before revocation.
2. Establish exact V2, V1/helper definitions and exercise each intended branch in staging. A differently named SQL function is not a substitute for the missing historical contract.
3. Validate subscription shadows and the shared cancellation contract across affected features, not only matching.
4. Inventory every retained vector producer. Delayed legacy entity/job writers are **not automatically compare-and-set fenced by the aggregate state table**. Disable obsolete writers or verify guarded publication, retry/duplicate/crash recovery and model compatibility before setting readiness.
5. Measure daily-expiry regeneration cost and catalog revision contention. These conservative choices favor correctness; production performance is unmeasured. Do not invent indexes/backfills without measured plans.
6. Approve evidence eligibility and personal-data/model-input policy. Existing demographic builder inputs were not silently changed during correctness repairs.
7. Exercise controlled browser journeys, mutation propagation and current availability. An internal application row or opened tab is not proof of employer submission.
8. Assign release/operations/security/product owners and adopt measured budgets. No calibrated hiring probability, production quality result, or world-class certification is claimed.
9. Roll back by disabling matching or serving labelled generic results while retaining ownership, entitlement and private-RPC protections. Do not restore the original unsafe handler/PUBLIC grants. Preserve state/schema until dependents are safely retired.

Environment/policy/quality gates cannot truthfully be marked complete from repository fixtures alone. They remain explicit work, not waived defects.
