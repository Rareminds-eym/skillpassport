# Learner Job Recommendation — Engineering Remediation Plan

Version: 1.6  
Prepared: 2026-10-15  
Updated: 2026-10-16  
Application: `skillpassport/`  
Planning baseline: `1a9c21575b303b838831e35670f5d338966342f7`  
Status: core repository-side fixes implemented; producer/lifecycle, policy, quality and deployed-validation gates remain open.

Revision 1.6 follow-up overlay: four missed implementation gaps are repaired locally—explicit preprocessing/ranking-policy cache identity and cached algorithm provenance; invalidation after acknowledged saves independent of refresh success; generic dismissal/availability filtering before limits; and centralized safe external navigation plus truthful, acknowledged application outcomes across Apply, Details and Saved Jobs. The [updated implementation record](LEARNER_JOB_RECOMMENDATION_IMPLEMENTATION.md) contains current tests, SQL evidence and remaining limitations. Historical evidence below is preserved; production closure is still gated.

Revision 1.5 implementation overlay: core access, identity, failure, availability/hydration, response, frontend-race, legacy-feedback and versioned aggregate publication/cache fixes are implemented locally. The [implementation and release record](LEARNER_JOB_RECOMMENDATION_IMPLEMENTATION.md) has the current evidence and per-package disposition. Earlier counts below remain historical; this is not complete production closure.

Revision 1.2 incorporates the false-positive review: it withdraws the requirement that every selector equal `learners.id`, adds the table-specific identity contract in section 2.4, and distinguishes existing controls from proposed safeguards. Revision 1.1 added the adversarial re-review in section 14. Neither revision silently changes the historical audit's finding count or recorded evidence.

Revision 1.3 recorded partial WP00 execution in section 2.6: a permanent selector-aware boundary verifier, independent snapshots, mutation controls, and an explicitly failing desired-behavior suite. At that revision, application fixes and deployed environment verification remained open.

Revision 1.4 implementation overlay: WP01 ownership and request-boundary fixes are implemented in the working tree, with 46 focused tests passing and all four ownership boundary failures resolved locally. Five other boundary failures remain. [Implementation, evidence, and release limits](audit-evidence/learner-job-recommendations/WP01_IMPLEMENTATION.md). No deployment or complete audit closure is claimed; earlier baseline counts describe the pre-fix source.

Source audit: [Learner Job Recommendation Audit, revision 2.1](LEARNER_JOB_RECOMMENDATION_AUDIT.md).  
Evidence: [reproduction guide](audit-evidence/learner-job-recommendations/README.md), [characterization harness](audit-evidence/learner-job-recommendations/verify.cjs), [recorded October 12 results](audit-evidence/learner-job-recommendations/verification-results.json), [read-only database verification](audit-evidence/learner-job-recommendations/read-only-verification.sql).

## 1. Engineering decision

Repair the existing recommendation paths incrementally. Do not start with a replacement recommendation engine, a global schema rewrite, or an indiscriminate embedding backfill.

The execution order is:

1. Strengthen the evidence and contain cross-learner access immediately.
2. Enforce matching entitlements using the existing authoritative server resolver, after checking shadow-data readiness.
3. Correct availability, response semantics, error handling, and the Details/Apply data contract.
4. Make cache and embedding freshness explicit, versioned, and safe under concurrent edits.
5. Validate deployed SQL, ranking quality, operational limits, and staged rollout before broad promotion.

Ownership protection does **not** depend on finishing ranking, migrations, or product-policy discussions. If a deployed recommendation path cannot be made safe promptly, disable that path through an authorized operational change while preserving ordinary opportunity browsing. This document does not itself authorize deployment or production data changes.

### What completion means

A learner receives only authorized recommendations for their own profile; paid matching cannot be obtained by bypassing the UI; returned jobs satisfy the current availability contract; generic fallback is not presented as a personalized percentage; edits cannot silently publish stale vectors or caches as current; Details/Apply receives authoritative job data; failures are distinguishable from a genuinely empty result; and the deployed system has reproducible tests, bounded operating costs, and an exercised rollback procedure.

That is a remediation outcome, not a claim that ranking is statistically calibrated, independently certified, or already proven effective in production.

## 2. Baseline, evidence, and false-positive controls

### 2.1 What has actually been checked

On October 15, at the planning baseline above:

- The application working tree was clean.
- The existing source-characterization harness again reported **31 passed, 0 failed**. Several checks deliberately assert defective behavior. Their passing is evidence of reproduction, not evidence of repair.
- The historical snapshot assertion failed as expected: `functions/lib/supabase.ts` changed, and migration `20261014090000_replace_gotrue_user_lookups.sql` was added. The current input set contains 134 fingerprints versus the recorded 133.
- The Supabase factory change supplies keys through `accessToken`; the recommendation handler still creates a service-role client and still lacks the target-ownership boundary. The new migration changes user lookups for notification/approver/email functions; it does not repair the recommendation pipeline.
- No production database, live learner session, browser journey, deployed worker, or real recommendation quality dataset was exercised. The backup named `latest` is dated September 18, not today.

The audit remains a historical October 12 document at an earlier commit. Do not relabel its recorded results as October 15 production evidence or overwrite its baseline merely to make snapshot verification pass.

### 2.2 Known weakness in the existing evidence

T08's cache mock does not enforce the learner ID supplied to the cache RPC. A route that correctly substitutes the authenticated learner can still satisfy that old test. An in-memory mutation check demonstrated this weakness; asserting the actual RPC selector distinguishes the cases.

The ownership finding remains supported by the active route and handler. Nevertheless, T08 must be strengthened before using it as a closure test. Test the authorization boundary and the actual target selectors, not just a successful response or fixture metadata.

### 2.3 Conclusions this plan deliberately does not make

- Learner primary IDs and SSO user IDs belong to different identifier namespaces; their UUID values may coincide for some records. Do not assume either equality or inequality. Resolve ownership through `learners.user_id`, then use the key required by each verified table/RPC contract.
- A raw similarity of 90 and an overall ranking score of 49 are not inherently contradictory. Incorrect labeling and the invented fallback percentage are the actionable issues.
- Reusing a current vector on Refresh is valid. Reusing a vector whose input revision changed is not a valid freshness guarantee.
- Missing local SQL definitions do not prove production functions are absent.
- The entitlement gap is documented deferred backend enforcement, not evidence of a newly introduced regression. Closing it still requires readiness and explicit rollout.
- Applied jobs remaining visible and the widget X hiding the section are intentional behaviors, not per-job feedback defects.
- A 45-point dashboard ceiling is conditional on missing preference inputs; it is not a universal production maximum.
- Different algorithms on dashboard, embeddings, and chat are not intrinsically defects. Shared access, availability, freshness, and presentation contracts are the initial objective.

### 2.4 Table-specific identity contract — correction to revision 1.1

The old acceptance statement “actual selectors all equal authorized learner” is withdrawn. Authorization means every operation is scoped to the authorized subject; it does **not** mean every foreign-key column stores the same UUID.

Retain distinct server-resolved values in the internal context: the authenticated actor's user ID and the authorized learner's primary ID, with their relationship verified through `learners.user_id`. Do not obtain either authority from an untrusted request body. Any explicitly authorized delegation needs its own actor/subject mapping.

| Operation / table | Checked-in identity contract | Implementation requirement |
|---|---|---|
| Resolve the caller's learner | `learners.user_id` equals authenticated user ID | Resolve the authorized learner record first; retain its `id` and verified `user_id`. |
| Learner vector row | `learners.id` is the target row's primary key | Read/write the authorized learner's primary ID. |
| Skills, projects, certificates, trainings | Their `learner_id` foreign keys reference `learners.id` | Scope these evidence selectors to the authorized learner's primary ID. |
| Match cache | `learner_job_matches.learner_id` references `learners.id` | Use the primary-ID contract for the corresponding cache RPCs after verifying their deployed bodies. |
| Persisted opportunity interactions | `opportunity_interactions.learner_id` references `learners.user_id` | Under this schema, scope feedback/dismissal reads to the authorized subject's verified user ID, not blindly to the learner primary ID. |
| Standalone profile/admin checks | Inspected generation code checks profile/admin `user_id` against the user identity | Keep actor-user identity separate from learner-primary identity; do not fix learner checks by globally substituting the learner ID into user/admin checks. Verify administrative permissions independently. |
| Other tables and RPC parameters | A column/parameter named `learner_id` is not sufficient evidence of its key space | Inventory actual foreign keys, function bodies, writer payloads, and retained clients before choosing the selector. |

Evidence: [checked-in schema](skillpassport/supabase/migrations/20260526000000_schema.sql), foreign keys at L26501, L27721, L28171, L28301, L28426, and L28546; [standalone generation checks](skillpassport/functions/api/embedding/handlers/generateEmbedding.ts). This is a checked-in contract map, **not** a claim that today's deployed constraints are identical. WP00/WP09 must reconcile live definitions. Do not bulk migrate keys or reinterpret existing interaction rows without that evidence.

### 2.5 False-positive review dispositions

- **Confirmed plan error:** uniform raw-ID selector equality. Replace it with table-specific authorized selectors and regression fixtures covering both equal-ID and distinct-ID records.
- **Existing control:** vector persistence already rejects wrong dimensions and non-finite values. Earlier worker-response validation and vector-norm checks are additional safeguards; do not claim these existing persistence checks are absent.
- **Existing partial control / preventive work:** auth-core-generated errors already include `Cache-Control: no-store`. Application recommendation success responses do not gain that policy from the inspected response builder. CDN leakage was not demonstrated; scoped transport hardening remains a preventive requirement.
- **Conditional source defect:** standalone learner/child generation rejects the distinct-ID fixture when given the router's user ID, but the equal-ID control succeeds. It is not universally broken, and existing ownership checks mean it is not an unrestricted writer.
- **Narrow confirmed behavior:** an empty update result is reported as `success: true, rowsAffected: 0`; this demonstrates misleading publication acknowledgement in callers that treat it as a completed write, not data resurrection or corruption.
- **Proposed design requirements:** coherent snapshots, queue crash recovery, deletion fencing, and backlog-aware rollback are failure scenarios to validate for the chosen implementation. They are not reports of observed production incidents or proof that a deployed queue lacks those controls.

### 2.6 WP00 local evidence progress — not completed remediation

The [independent boundary verifier](audit-evidence/learner-job-recommendations/verify-boundaries.cjs) now preserves selector-aware ownership cases for both matching aliases, real cache-hit/miss paths, entitlement checks, standalone identity cases, write acknowledgement, existing validation controls, and checked-in key-space assertions. The historical `verify.cjs` and its October 12 JSON records were not edited.

| Mode / evidence | Recorded October 15 result | Meaning |
|---|---|---|
| [Boundary characterization](audit-evidence/learner-job-recommendations/boundary-verification-results.json) | 26 passed; zero failures/setup errors; 16 input fingerprints | Current defects and successful controls reproduce. Two in-memory mutation controls expose the weakness of the historical success-only assertion. |
| [Desired-behavior regression](audit-evidence/learner-job-recommendations/boundary-regression-results.json) | 15 passed; nine failed; two characterization-only mutation skips; zero setup errors; exit 1 | Four ownership cases, two entitlement cases, two distinct-ID generation cases, and zero-row persistence acknowledgement still need correction. These are cases, not nine new vulnerability categories. |

Run instructions, scope, exit-code meanings, and limitations are in the [evidence guide](audit-evidence/learner-job-recommendations/README.md). The new cache fixture returns rows based on the actual selector, and foreign cache-miss cases exercise the real handler's provider/persistence branch using mocked transports. Actor verification transport, database/RPC execution, profile text construction, and provider remain fixtures; no live SQL, JWT verification, browser, or network was exercised.

WP00's local evidence-hardening slice has progressed; live inventory, grants/RLS verification, shadow readiness, and independent review are not done. Continue to WP01 ownership implementation only as an explicitly authorized application-change task; this evidence work has not repaired application behavior.

WP01 update: the user subsequently authorized implementation. The [new post-WP01 regression record](audit-evidence/learner-job-recommendations/wp01-boundary-regression-results.json) shows 19 passed, five failed, two historical mutation skips, and zero setup errors. Ownership is repaired at the source/local-test level; production verification and all other packages remain separately tracked. The pre-fix records above were retained, not overwritten.

## 3. Scope and implementation boundaries

### In scope

- Rules-based dashboard recommendations.
- Embedding recommendations used by Opportunities and My Skills, including both backend aliases.
- Matching-related authentication, authorization, entitlement enforcement, request validation, fallback, and error handling.
- Recommendation DTOs, current job hydration, cached-result validation, and embedding lifecycle.
- The directly used SQL RPCs, attached triggers, grants, worker bindings, and queue dependencies.
- Chat's shared job availability contract and explicit disposition of its unused experience filter.
- Regression tests, migration/backfill safety, telemetry, release controls, and operational ownership.
- Explicit disposition of legacy interactions, sample listings, evidence policy, and preference fields.

### Not in scope without a separate decision

- Replacing all three engines with one new algorithm or vendor.
- Building an assessment/LTE-to-job engine, retraining models, or changing chat quotas.
- Rebuilding global SSO, subscriptions, application workflows, or the shared Supabase factory.
- Treating an application record or external redirect as proof of employer submission.
- Bulk rewriting opportunity statuses, creating guessed preference columns, or deleting existing vectors/caches without a bounded migration plan.
- Turning section-level hiding into a per-job dismissal feature.

## 4. Required invariants

| Invariant | Required behavior |
|---|---|
| Actor and subject | Resolve `learners.user_id` from the authenticated SSO subject. Every operation derives its table-specific user/learner selector from authorized context, using section 2.4 rather than one universal UUID. |
| Access before work | Ownership and the feature entitlement applicable to the path are checked before target cache reads, evidence reads, embedding work, or recommendation writes. Do not impose the paid matching feature on rules-based or other paths without D02's approved policy. Identity/entitlement lookups and existing auth-wrapper behavior are not classified as matching side effects. |
| Availability | Fresh, cached, and generic results use the same approved active/open/deadline predicate at the documented final backend-validation instant. Chat follows the same job-availability rule; later state changes require action-time revalidation rather than an impossible guarantee that jobs remain open after validation. |
| Honest presentation | Result provenance and score meaning survive every adapter. Missing similarity is absent, not 50%. A normalized score is not a probability of employment. |
| Complete actions | A ranked ID is not an actionable opportunity object until current fields needed by Details/Apply have been loaded and validated. |
| Freshness | A cache or vector is current only for its recorded input and algorithm/model versions. TTL alone does not establish correctness. |
| Concurrent writes | An old computation cannot overwrite or mark current a result for a newer profile revision. |
| Consistent reads | A multi-query input build or cache read must not combine incompatible revisions and then label the result current. |
| Transport isolation | Personalized HTTP responses cannot be served from a shared cache or reused across accounts; the deliberate database match cache remains separately authorized. |
| Failure isolation | Database/provider failures are not silently converted into an ordinary empty personalized result. Incomplete evidence does not overwrite a healthy vector as complete. |
| Security rollback | Disabling new matching must not restore cross-learner access or bypass entitlement enforcement. |

## 5. Priority and traceability

P0 means immediate authorization containment. P1 means required for the corrected recommendation release. P2 means follow-up hardening or a conditional/product decision. These are execution priorities, not CVSS ratings or claims of observed production loss.

| Audit item | Disposition / intended repair | Work package | Priority |
|---|---|---|---|
| C01 — target ownership | Implemented locally: resolved self, foreign-target rejection before matching work, both aliases and cache paths verified. Deployed closure remains open. | WP01 | P0 source fix implemented |
| C02 — matching entitlement | Apply canonical server check; verify shadow readiness and both frontend entry points. | WP02 | P1 |
| C03 — dashboard selection | Align status, active state, and deadlines with the approved availability predicate. | WP04 | P1 |
| C04 — threshold overwritten | Preserve backend classification; distinguish ordinary fill-in jobs. | WP05 | P1 |
| C05 — metric/provenance | Preserve score semantics; remove fabricated fallback percentages on all consumers. | WP05 | P1 |
| C06 — cached snapshots | Revalidate current eligibility/dismissals and hydrate ranked IDs before responding. | WP06 | P1 |
| C07 — refresh lifecycle | Version inputs/vectors; refresh consumers after relevant saved edits. Do not re-embed current inputs unnecessarily. | WP07, WP08 | P1 |
| C08 — embedding client | Remove undefined references; validate worker output and error paths. | WP03 | P1 |
| C09 — cache-save errors | Inspect returned RPC error; report cache not saved without discarding valid fresh results. | WP03 | P2; ship with WP03 |
| C10 — partial query failures | Classify dependency failures; prevent incomplete-vector persistence and false healthy emptiness. | WP03, WP07 | P1 |
| C11 — malformed skill rows | Defensive read normalization plus write validation; isolate bad rows. | WP03, WP04 | P1 |
| R01 — preference fields | Inspect live schema and profile shape, then map supported fields or approve an additive feature. | WP00, WP09 | P2 decision before score claims |
| R02 — invalidation coverage | Compare live definitions; cover every adopted input and eligibility mutation. | WP06, WP07, WP09 | P1 if deployed gap confirmed |
| R03 — entity regeneration | Compare live trigger; replace stale-content skip logic if present. | WP07, WP09 | P1 if deployed gap confirmed |
| R04 — dependency inventory | Capture exact RPCs, grants, helpers, triggers, workers, and consumers; repair only verified gaps. | WP00, WP09 | P1 release verification |
| R05 — thin V2 payload | Verify deployed return shape; make handler hydration authoritative regardless of ranker projection. | WP05, WP06 | P1 |
| L01 — legacy interactions | Prove a retained consumer, then repair contract/authorization/invalidation, or retire deliberately. | WP10 | P2, unless an active affected consumer is found |
| Request shape, T28/T29 | Implemented locally: strict object/limit/boolean validation and structured 400 responses. Supported/default UI limits preserved. | WP01 | P1 hardening implemented |
| Other scoped observations | Decide evidence policy, chat experience filtering, sample listings, and storage scoping without inventing new defects. | WP08, WP10, WP11 | P2 or policy-dependent |

## 6. Decisions and dependencies

The accountable people below are **roles to assign**, not named owners or approvals already obtained. An engineering lead owns sequencing and closure; Security reviews access controls; Product owns recommendation policy; the database/platform owner owns database and worker rollout; QA owns independent acceptance evidence.

| Decision | Recommended starting position | Decision owner | What it blocks |
|---|---|---|---|
| D01 — target selection | Self-service only. Keep the existing `learnerId` for compatibility, but reject a mismatch against the resolved self. No implicit delegated access. | Engineering + Security | WP01 API contract; no need to wait for other decisions |
| D02 — paid matching | Enforce `ai_job_matching` for both aliases using the existing server resolver. Confirm entitled, non-entitled, expired, and add-on controls against shadow data first. Explicitly map access policy for rules-based dashboard, chat, and standalone embedding work; do not assume one feature key applies to every surface. | Product + platform/subscriptions | WP02 broad rollout; not WP01 |
| D03 — availability | Start from V2's open, active, unexpired intent; verify published status values, deadline type, time zone, and boundary semantics against actual writes/data. | Product + database owner | WP04 and cache filtering |
| D04 — evidence eligibility | Explicitly decide enabled/approval/expiry and training-linked evidence rules, consistently across text building and scoring. | Product + domain owner | Evidence-policy changes and final quality evaluation; not access fixes |
| D05 — score labels | Separate similarity from overall ranking index; generic results have no personal percentage. Preserve the dashboard threshold until deliberately changed. | Product + engineering | Final WP05 UI labels; removal of fabricated fallback score can proceed |
| D06 — refresh expectations | Refresh reranks current inputs; changed inputs require a current vector or explicit pending/degraded state. Set a measurable propagation target. | Product + platform | WP07/WP08 acceptance target |
| D07 — preference inputs | Prefer mapping existing supported profile fields. Add collection/storage only if missing fields are a real product requirement. | Product + database owner | R01 resolution; not core security/correctness |
| D08 — model/input policy | Record model/dimensions/preprocessing and decide which profile fields belong in matching text. Review existing name/age/gender inclusion; do not assume it is necessary. | ML/search + Product + privacy/security reviewers | Model backfill and quality promotion |
| D09 — availability budget | Approve latency, error, freshness, cost, and quality budgets from measured baselines, with alert thresholds and observation windows. | Engineering lead + operations + Product | Broad rollout, not unit-test implementation |

Implementation dependency structure:

- WP00 evidence hardening and environment inventory begin immediately; inventory can run alongside WP01.
- WP01 ownership can ship independently. WP02 follows resolver-readiness checks and must not weaken WP01.
- WP03 failure-path repairs can proceed alongside WP01/WP02.
- WP04 defines eligibility; WP05 defines response semantics and hydration. WP06 consumes both contracts.
- WP07 needs verified SQL/worker details from WP00/WP09; WP08 consumes the resulting revision contract.
- WP09 is an inventory-driven database track, not a blanket instruction to execute all proposed migrations.
- WP10 policy/legacy work runs separately unless it reveals an active security exposure.
- WP11/WP12 quality and rollout validate the integrated result. Quality redesign is not a prerequisite to closing authorization exposure.

## 7. Work packages and review boundaries

Each package should produce a small reviewable PR, or multiple PRs when backend compatibility, migrations, and frontend adoption need separate deployment. Tests travel with the fix. Do not combine unrelated subscription, SSO, or application-platform refactors into these changes.

### WP00 — Repair evidence and establish environment facts

Suggested owner: engineering lead + QA, with database/platform support.

1. Retain the October 12 evidence as immutable historical material. Review the October 15 factory/migration differences before creating a separately dated baseline.
2. Strengthen T08 or replace it with desired-behavior tests. The fake database must dispatch by the actual learner selector and record every RPC argument. A fixture belonging to B must not be returned for a request actually scoped to A.
3. Separate characterization from regression: new tests assert the required behavior, initially fail against affected code, and pass after the corresponding repair. When an old defect assertion stops reproducing, document that disposition rather than weakening it to keep a green count.
   Local progress: section 2.6 records the independent verifier and failing desired-behavior cases. Use it instead of treating historical T08 alone as closure evidence; complete missing environment checks before marking all of WP00 done.
4. Through an approved read-only connection, collect the provided catalog SQL output for the intended staging and production environments. Extend catalog-only inspection as needed for exact signatures, grants, RLS, return shapes, shadow readiness, and trigger/queue attachments. Do not invoke write-capable recommendation RPCs in a read-only verification exercise.
5. Record application deployment revision, migration state, worker deployment/binding identifiers, provider model/dimensions, queue consumer/schedule ownership, and redacted representative payload shapes. If application and database versions cannot be established, record the uncertainty as an open release gate.
6. Inventory every writer of recommendation-related vectors and revisions, not only the recommendation handler: standalone generation, database triggers, service bindings, bulk/backfill tooling, and administrative paths. Record each caller's actor/subject identifiers, input source, and publication mechanism; section 14 identifies a concrete identity-contract inconsistency to test.
7. Reconcile section 2.4 against deployed foreign keys, exact RPC parameter usage, and existing write payloads. Record whether each operation expects a user ID, learner primary ID, or another identifier. A mismatched historical schema is an investigation task, not authorization to rewrite stored keys.

Deliverables: strengthened test review; new dated evidence manifest; environment inventory; each R-item marked confirmed, absent, or unresolved with an evidence reference.

Acceptance: mutation-testing the target selector makes the new test fail; a legitimate self request succeeds; historical evidence remains intact; missing production definitions are not inferred from the old backup.

### WP01 — Enforce ownership and validate the request boundary

Suggested owner: backend engineer; Security reviewer.

Local status: implemented and verified; see [WP01 implementation record](audit-evidence/learner-job-recommendations/WP01_IMPLEMENTATION.md). This is not deployment approval. Entitlement, ranking, availability, and embedding-lifecycle work were not bundled into this change.

Primary files: [career router](skillpassport/functions/api/career/[[path]].ts), [recommendation handler](skillpassport/functions/api/career/handlers/recommend.ts), [auth helpers](skillpassport/functions/lib/auth.ts), [rate limiter](skillpassport/functions/api/career/utils/rate-limit.ts).

1. Pass authenticated actor context into matching. Resolve the canonical learner through `learners.user_id = authenticated user.id`, reusing existing identity conventions. A UUID is not authorization, and an email supplied by the client is not identity.
2. Recommended compatibility contract: continue accepting the client's learner ID, verify it equals the resolved learner ID, and reject a foreign target with a uniform 403 or non-enumerating 404 chosen by the existing API convention. Do not reveal whether the foreign learner exists. A missing own learner mapping is an explicit state, not permission to run generic matching for another ID.
3. Make an authorized actor/learner context the handler's internal input. Cache, dismissal, embedding, ranking, and cache-save selectors must all derive from it, but use each operation's verified key space. In the checked-in schema, evidence/cache selectors use the learner primary ID while interaction selectors use the subject's user ID. Do not protect only the first query while leaving later writes client-scoped, and do not replace every `learner_id` value with one raw UUID.
4. Validate a JSON object: UUID, boolean `forceRefresh`, and finite integer `limit` in 1–50; retain default 20 when omitted. Reject null, arrays, strings, fractional/out-of-range/non-numeric limits, and invalid booleans with structured 400 responses. Retain method/auth/verified-email checks.
5. Key matching throttling by the authenticated actor or authorized subject, never an arbitrary client target. Document the current limiter as per-instance; add shared enforcement only if load/cost testing requires a distributed quota. An authentication-layer abuse limiter may run earlier, but must not read a foreign target cache.
6. Apply the same boundary to `/recommend-opportunities` and `/recommend`. If delegation is later needed, introduce a separately reviewed permission and subject policy rather than a role-name bypass.

Acceptance: A→B is denied before target cache/evidence/provider/computation writes; A→A works with both distinct-ID and equal-ID fixtures; cache-hit and cache-miss paths are both covered; each actual selector matches its verified table/RPC identity contract; unauthorized requests cannot vary a target UUID to bypass the intended matching quota. Existing identity resolution/auth self-heal is not falsely asserted to perform zero database work.

### WP02 — Enforce matching entitlement without inventing a new source of truth

Suggested owner: backend + subscriptions/platform; Product confirms access policy.

Primary files: [server entitlement resolver](skillpassport/functions/lib/entitlements.ts), career router, [frontend gate](skillpassport/src/features/subscription/model/useFeatureGate.ts), [My Skills](skillpassport/src/pages/learner/MySkills.jsx), [matching widget](skillpassport/src/widgets/learner-dashboard/ui/RecommendedJobs.jsx).

1. Use the existing canonical server feature check for `ai_job_matching`, with its SSO-synced application shadows. Do not authorize from frontend booleans, `auth.users`, or a new competing subscription lookup.
2. Verify shadow population and reconciliation for controlled entitled, denied, expired, and purchased-add-on accounts. Record mismatches and repair the shadow pipeline under its owner's process before broad enforcement rollout.
3. Enforce access for both matching aliases before matching cache/provider work. Unknown resolver state or resolver failure must not grant matching. Follow the canonical resolver's fail-closed behavior; distinguish dependency outage from a known denial where its contract supports that distinction.
4. Align My Skills and Opportunities UI gates, denied/loading states, and direct-request behavior. The UI reduces confusing calls; it is not the security boundary.
5. If readiness is insufficient, keep ownership protection deployed and use an approved matching-disable/cohort mechanism. Do not create an undocumented allow-all or silently grandfather paid access.

Acceptance: direct API calls cannot bypass denied matching; allowed subscription/add-on accounts still work; expired/unknown/error controls do not execute matching; other career features retain their own feature contracts.

### WP03 — Fix failure paths, malformed data, and false success

Suggested owner: backend engineer + QA.

Primary files: [embedding client](skillpassport/functions/api/embedding/services/embeddingWorkerClient.ts), [text builder](skillpassport/functions/api/embedding/services/textBuilder.ts), recommendation handler, [dashboard handler](skillpassport/functions/api/learners/ai-recommendations.ts), [opportunity API](skillpassport/functions/api/opportunities/index.ts).

1. Replace undefined `logger`/`embedding` references with established logging and the actual response variable. Preserve existing persistence validation: `databaseUpdater` already rejects incorrect dimensions and non-finite values. Validate worker response shape/values earlier where they can otherwise be returned or consumed without persistence, and add a usable-vector-norm check where required. Treat these boundary checks as defense in depth, not proof that invalid values can currently pass the existing persistence guard. Test truncation, malformed output, binding failure, provider error, timeout, and normal success. Keep existing truncation limits unless deliberately revised.
2. Inspect both thrown failures and returned Supabase `error` values for related-evidence reads, dismissal reads, and cache-save RPCs. Log structured stage/error codes without raw profile text or embeddings.
3. Proposed failure policy: a related-evidence read error prevents building/persisting a new supposedly complete vector; a dismissal read error prevents claiming a fully filtered personalized result; an actual empty query result is not an error. A fresh valid result may still be served when cache save fails, but cache persistence must be marked unsuccessful and observable.
4. If dashboard skills cannot be read, return a controlled error or an explicitly non-personalized degraded result under the approved response contract. Do not silently score an empty skill set as a healthy personalization result.
5. If both ranking and generic fallback dependencies fail, return a structured service error rather than successful empty recommendations. Preserve genuinely empty catalog results as successful emptiness. Use bounded, sanitized reason codes rather than exposing SQL/provider internals.
6. Normalize required skills defensively at the read boundary; malformed elements cannot crash the full dashboard response. Validate supported string-array shapes on opportunity writes, while retaining defensive reads for existing/imported rows. Produce a bounded data-quality inventory and targeted cleanup proposal instead of a blind bulk rewrite.

Acceptance: tests distinguish empty data, partial failure, full dependency failure, and cache-save-only failure; no incomplete new vector replaces a healthy one; malformed skill entries do not cause an unhandled 500; long/malformed worker responses fail predictably rather than with undefined identifiers.

### WP04 — Establish one job-availability contract

Suggested owner: backend + database owner; Product approves boundary semantics.

Primary files: dashboard handler, [chat opportunity search](skillpassport/functions/api/career/context/smart-opportunities.ts), current matching/fallback RPCs, opportunity mutation paths.

1. Inventory actual opportunity status values and which API/admin writes publish them. Agree canonical open/published semantics before replacing dashboard `status = 'active'`. A compatibility period may be needed; do not include both states indefinitely without policy.
2. Define active state and deadline nullability/boundary semantics, with an explicit clock/time-zone convention. Use equivalent SQL/backend predicates and shared contract fixtures; a TypeScript helper alone cannot guarantee SQL parity.
3. Apply the predicate before candidate limits in dashboard, fresh matching, generic fallback, and chat. Apply it again when cached IDs are hydrated. A job expiring merely because time passes must disappear without waiting for a database update trigger.
4. Keep ranking metadata separate from current job fields. Preserve the dashboard's existing ID-based exclusion of duplicate fill-in jobs and regression-test it after hydration/contract changes; this is not a newly demonstrated duplicate-card defect. Filling a slot does not make that job personalized.
5. Test chat's computed-but-unused experience filter. Apply an approved filter or remove the dead calculation and misleading implication. Do not broaden this into a chat rewrite or quota change.
6. Include the dashboard's ordinary fill-in branch from `useOpportunities`/`opportunitiesService`. Correcting the dedicated recommendation endpoint does not sanitize these other cards. Enforce learner-feed eligibility before candidate limits through a scoped API contract, without removing draft/closed records from authorized recruiter/admin views.

Acceptance: open active unexpired control is included; closed, inactive, deleted, expired, and exact-deadline controls follow the agreed policy across all affected paths; null deadlines are intentional; cache and fresh behavior agree.

### WP05 — Define the response contract and repair Details/Apply

Suggested owner: backend + frontend engineer; Product approves labels.

Primary files: recommendation handler, [matching service adapter](skillpassport/src/features/opportunities/api/aiJobMatchingService.ts), [dashboard mapping](skillpassport/src/pages/learner/Dashboard.jsx), matching widget, [Suggested Next Steps](skillpassport/src/widgets/learner-dashboard/ui/SuggestedNextSteps.jsx), [Opportunities page](skillpassport/src/pages/learner/Opportunities.jsx), [preview](skillpassport/src/widgets/learner-dashboard/ui/OpportunityPreview.jsx).

Introduce an additive, documented contract using existing envelope conventions. The following names describe the **proposed semantics**, not existing fields or a required new endpoint:

| Concept | Required semantics |
|---|---|
| Provenance | Distinguish rules-based, embedding-personalized, and generic results; separately indicate degraded dependency state and sanitized reason. |
| Score fields | Nullable, explicitly named raw similarity and overall ranking index, each with documented scale/version. Zero remains zero; missing remains null. Neither is a hiring probability. |
| Classification | Preserve the dashboard's recommendation flag/threshold; ordinary fill-in items remain ordinary. |
| Freshness metadata | Computed time, cache status, input/algorithm/model version where relevant, and current/pending/stale state according to the chosen contract. |
| Opportunity | A current allowlisted job DTO adequate for Details/Apply, not a raw ranker projection or unrestricted database row. |
| Failure | Distinguish legitimate emptiness, generic fallback, refresh pending, dependency outage, and authorization denial. |

Implementation requirements:

1. Hydrate ranked IDs in a bounded batch from authoritative opportunities, retain ranking order/scores, and apply current eligibility. Include application destination, requirements, responsibilities, benefits, dates, logo, and salary fields actually consumed by existing UI, subject to field visibility rules.
2. Remove `(similarity || 0.5)`: it fabricates missing values and replaces a legitimate zero. Preserve fallback and reason metadata through the client service and both consumers.
3. Label raw similarity as similarity. If Product chooses an overall match index, display that explicitly instead. Generic fallback shows a label such as “Recent opportunities,” without a personalized percentage. Inspect both RecommendedJobs and My Skills, not only the first card component.
4. Stop forcing every dashboard item to `isAIRecommended: true`. Preserve the API classification and mark regular fill-in separately.
5. Deploy server additions before clients consume them. For older envelopes, the new client must choose conservative presentation—unknown score/provenance, never invented certainty. Do not prematurely remove fields used by an older deployed client.
6. Exercise Details and Apply from recommended cards and the ordinary list. Validate current eligibility at the action boundary using existing application controls or a narrowly scoped integration change. If an external application link is expected but cannot be loaded, show an explicit failure/retry; do not silently pretend the external journey occurred.

Acceptance: raw similarity 0.90 and weighted index 0.49 remain distinct; generic/no-score results have no invented 50%; full details are present; an external-link job follows the expected application/redirect path in a real controlled browser, including popup behavior and failure handling. Internal application creation is verified separately from employer submission.

### WP06 — Make cache reuse safe

Suggested owner: backend + database owner.

1. Cache ranked IDs and ranking metadata, or treat existing JSON as an untrusted historical snapshot that must be rehydrated. Fetch current availability and the authorized subject's dismissal state using section 2.4's verified interaction key before returning a cache hit. Preserve order; remove unavailable/dismissed IDs; refill only within a bounded candidate/query budget.
2. Define a cache identity covering authorized learner, relevant input revision, algorithm/scoring-policy version, and embedding model/preprocessing version. Include interaction and opportunity scoring revisions where those affect results. Do not confuse filtering expired jobs with refreshing a ranking after job content changes.
3. Reject or safely adapt old cache entries lacking required version metadata. Do not re-label an old snapshot with a new version. Retain TTL as a backstop, not the primary correctness condition.
4. Invalidate on the adopted input matrix: learner profile/preferences; skills/certificates/projects and their enabled/approval/expiry transitions; relevant courses/trainings; persisted per-job feedback; opportunity eligibility and score-relevant content. Apply the chosen evidence policy rather than assuming every database column changes ranking.
5. Check revision again when publishing freshly computed cache results, so an edit between cache validation and cache save cannot publish an old result as current. Use transactional comparison or equivalent atomic guards, not two independent reads claimed to be race-free.
6. Avoid full-cache invalidation on every unrelated opportunity edit. Start with bounded revalidation/scoped invalidation; if a catalog generation is necessary, measure fan-out and add jitter, concurrency caps, and single-flight/deduplication protection to prevent a regeneration storm. Do not add a broad global version merely because it is easy.
7. Guard the cache-read path, not only publication: validate relevant revisions around cache lookup and hydration, with bounded retry or an explicit pending/degraded response if they change. Capture a documented final eligibility-validation instant. No response can guarantee that a job will remain open after that instant; recheck at Apply and expire visible cards as required by the product contract.
8. Apply route-scoped `Cache-Control: private, no-store` or the project's equivalent reviewed non-cache policy where missing on personalized success and application-error responses. Preserve existing auth-core error `no-store` headers; do not claim they are absent. Verify CDN/proxy/browser behavior and any conditional responses. This is preventive hardening, not a demonstrated cache leak. Do not confuse this HTTP policy with the intentional database match cache, and do not broadly change unrelated public response caching.

Acceptance: a cache hit after deadline crossing, close/deactivate/delete, or persisted dismissal never returns the now-ineligible job; input/scoring version mismatch does not return an old ranking as current; concurrent mutation/save tests reject obsolete publication; cache failure does not erase a valid fresh result.

### WP07 — Repair embedding freshness and concurrency

Suggested owner: backend/worker engineer + database owner; ML/search review for model compatibility.

This is a versioned lifecycle repair, not “generate an embedding on every Refresh.” Prefer extending existing state/queue mechanisms after inventory; new tables are not mandatory if existing primitives satisfy the invariants.

1. Record a stable input revision or deterministic canonical input hash, plus model identifier, dimensions, and preprocessing version. Use normalized, stably ordered evidence and the approved evidence policy. A vector's length alone does not prove model compatibility.
2. On a relevant saved mutation, atomically mark the derived representation dirty/increment its revision and invalidate affected matches. Make that mutation reliably visible to the worker, using an existing durable queue or an outbox/queue design if verified absent. Do not rely solely on a best-effort network call inside a trigger.
3. Generate outside long database transactions. The worker records the revision it read; persistence uses compare-and-set against that revision. Discard/requeue obsolete output if a newer edit occurred. Deduplicate equivalent work, make retries idempotent, bound attempts/backoff, and expose terminal failures for repair.
4. Repair entity update triggers if live inspection confirms the inspected skip-on-nonnull behavior. Compare content fields/input versions rather than treating any existing embedding as current. Prevent embedding-only updates from retriggering endless work. Deletion, approval removal, and expiry must also invalidate derived evidence even when there is no replacement entity vector to generate.
5. For time-dependent evidence such as certificate expiry, use input-validity checks or a scheduled expiry mechanism; an UPDATE trigger alone cannot notice the clock crossing an expiry boundary.
6. Refresh bypasses match cache. It may reuse a version-compatible vector; stale/missing vectors trigger bounded regeneration or an explicit pending/degraded response. If pending work is asynchronous, the UI must not report success with stale personalized results presented as current.
7. Related-query failures from WP03 must not produce a complete/current vector. Preserve the previous stored vector if useful for recovery, but never mark it current for the new revision. Do not silently use a stale vector as current personalization.
8. Inventory existing vector model provenance before backfill. If unknown or incompatible, use a version-isolated rollout and resumable bounded batches for all compared vector types—learner, opportunity, and scored entities. Do not compare embeddings from different model spaces even if dimensions match.
9. Apply the revision/model publication contract to all identified writers. Standalone direct-text generation must not mark arbitrary supplied text as the current canonical database-profile representation. Separate non-persisted/scratch embeddings from authoritative matching inputs, or record an explicitly approved input source and version.
10. Build a coherent input snapshot: either use a supported consistent database read or read the input revision before and after the multi-query build and discard/retry on change. Require every relevant writer to update that revision atomically. Define stable ordering and a unique tie-breaker before capped evidence selection; sorting an unstable selected subset afterward is insufficient.
11. Where durable work is retained or adopted, verify or add crash recovery semantics: claim lease/visibility timeout, bounded retry/backoff, safe acknowledgement after successful guarded persistence, recovery of abandoned claims, and a terminal-failure/dead-letter replay procedure. A replay must re-resolve current input/version and must not revive obsolete or deleted work. These are acceptance requirements for the selected pipeline, not a claim that the deployed queue is currently broken or missing these controls.
12. Treat a deleted target or a zero-row guarded update as not published, never success. Fence deletion/recreation with an appropriate generation/tombstone or equivalent predicate. Delayed jobs must not recreate derived data for a removed profile/entity. Integrate with the existing deletion/retention workflow rather than inventing a new retention policy in this fix.

Acceptance: edits to already-embedded entities change the applicable input revision; a slow old job cannot overwrite a newer vector; duplicates are safe; deletion/approval/expiry affect the result; worker outages preserve explicit dirty/pending status; unchanged valid inputs do not create unnecessary provider calls.

### WP08 — Connect saved edits and frontend state to the freshness contract

Suggested owner: frontend engineer + QA.

Primary files: [matching hook](skillpassport/src/features/opportunities/model/useAIJobMatching.ts), [dashboard hook](skillpassport/src/features/learner-profile/model/useLearnerAIRecommendations.ts), profile mutation/query invalidation paths, Dashboard, Opportunities, My Skills, matching widget.

1. Invalidate/refetch recommendation queries after successful saves of relevant skills, projects, certificates, preferences, and other adopted inputs. Prefer an existing query/event/revision mechanism over an unstable serialized whole-profile dependency.
2. Reset data when learner/account changes, cancel or ignore obsolete requests, and prevent an old response from overwriting newer results. Include authenticated account, learner, and relevant request parameters in cache/query keys.
3. Implement distinct initial loading, refresh-in-progress, pending embedding, empty catalog, generic fallback, denied access, and recoverable error states. A failed refresh must not falsely announce newly personalized results; last-known cards, if retained, need explicit stale/error treatment and current availability checks.
4. Scope the section-hide preference by account/learner and define logout/account-switch behavior. Keep its section-level meaning. Do not write a per-job dismissal merely because the learner hid the widget.
5. Keep already-applied jobs' Applied state unless Product explicitly changes it. Confirm that interaction with these cards does not create a second application through this integration.

Acceptance: successful relevant edits trigger the correct refresh; failed saves do not claim new data; account switching leaks neither recommendations nor section preference; race tests retain the newest authorized response; all three surfaces present the same provenance/failure semantics.

### WP09 — Reconcile SQL and deploy additive migrations safely

Suggested owner: database/platform owner; backend and Security review.

1. Capture deployed definitions/signatures for `match_opportunities_enhanced_v2`, exact V1 `match_opportunities_enhanced`, `is_learner_fresher`, cache RPCs, generic fallback, trigger functions/attachments, and the actual embedding queue/consumer. A differently named smart matcher is not a substitute for the exact V1 contract.
2. For each gap, either check in the verified intended definition, repair the confirmed defect, or remove/disable an obsolete fallback after compatibility review. Do not invent SQL to make local text searches look complete.
3. Inventory RPC `EXECUTE` grants and actual direct-call exposure, function owners, `SECURITY DEFINER` settings/search paths, and relevant RLS. Test with the application's actual SSO identity model; do not assume Supabase `auth.uid()` maps this system's SSO users. Service-role handler access still requires WP01 authorization. Restrict grants only after identifying legitimate callers; avoid broad revocation outside this module.
4. Use expand/contract: additive metadata/schema and versioned functions first, compatible backend next, consumers next, backfill/validation next, retirement last. PostgreSQL return-type changes may require a new function/version; do not assume `CREATE OR REPLACE` can change the return contract in place.
5. Test migrations on a disposable database with the representative prior schema and permissions. Record before/after signatures and grants. Use measured query plans and data volume to justify indexes; use deployment-safe index/lock strategies as appropriate. Keep transactions short and provider calls outside them.
6. Do not run project reset scripts against production. Set bounded migration lock/statement budgets, monitor contention, and rehearse forward-fix or reversible application cutover. Preserve old data/schema until rollback and backfill validation no longer need it.
7. For R01, verify live columns and profile payloads. Map a supported source or document a separately approved preference feature with collection UI, defaults, validation, and migration. Do not silently rebalance score weights to hide absent inputs.

Acceptance: clean install and upgrade paths reproduce the used SQL; V2, intended V1, and generic fallback are integration-tested independently; grants cannot bypass the intended access model; migrations meet agreed lock/query budgets; any unresolved dependency has a disabled path or explicit approved disposition.

### WP10 — Close legacy and product-policy loose ends

Suggested owner: engineering lead + Product.

1. Search current routes/imports and deployed consumers for L01. If retained, separate dispatcher action from interaction type, enforce ownership, validate supported actions, and invalidate the real cache after persistence. If unused, retire behind a documented compatibility check rather than spending release-critical effort reviving dead code.
2. Approve the evidence eligibility matrix from D04. Cover enabled, pending/approved/rejected, expired/unexpired, training-linked, deleted, and absent evidence. If different surfaces intentionally use different evidence, make that distinction explicit and version it rather than asserting universal consistency.
3. Resolve the hardcoded Browse Jobs route: clearly label samples, hide the route, or connect real data as a separately scoped product change. Do not present sample listings as live opportunities.
4. Document that assessment/LTE signals are not directly used by the automatic feeds today. Do not promise assessment-driven re-ranking as part of a cache fix.
5. Record chat experience-filter disposition, rate-limit scope, and the account-scoped section preference. Each can be closed as an approved behavior where appropriate; not every observation needs a code change.

Acceptance: no audit item remains ambiguously described as both a confirmed active defect and a policy choice; legacy reachability and the chosen action have evidence.

### WP11 — Verify recommendation quality and operational behavior

Suggested owner: QA + ML/search/domain reviewer + operations.

1. Build a consented/de-identified representative evaluation set covering sparse and rich profiles, school/college/professional contexts, freshers/experienced learners, varied skills/locations, missing preferences, no eligible jobs, and fallback-only cases. Keep test labels independent of the engine being evaluated.
2. Evaluate each existing engine separately before/after; algorithm consolidation is not required. Use judged precision/relevance at the UI's top three/five, catalog coverage, duplicate rate, invalid-job rate, fallback rate, and evidence-policy compliance. Version the sample, judgments, and scoring code. Declare sample limits; do not turn a tiny fixture set into a statistical quality claim.
3. Check candidate truncation effects from newest-50/newest-100 pools. Expand retrieval only after measuring relevance/cost and approving the changed behavior; this is quality work, not a hidden prerequisite to the ownership patch.
4. Measure cold/warm p50/p95 latency, error rate, cache hits, rejected obsolete results, regeneration lag, queue age/depth, provider timeouts/calls/cost, and DB query/load behavior under measured expected concurrency plus an agreed safety margin.
5. Capture request correlation, surface, algorithm/model version, cache outcome, sanitized fallback/error reason, entitlement/ownership denial category, and stage timings. Do not emit raw bios, emails, embeddings, or high-cardinality learner IDs as metrics labels; keep necessary security logs under existing restricted retention/access policy.
6. Set alert/runbook ownership for unauthorized-target attempts, resolver outages, empty-result spikes, unexpected fallback, queue backlog, stale-version rejection, and embedding spend. Establish approved numerical budgets and observation windows before promotion; no unmeasured “world-class” SLO is claimed here.

Acceptance: deterministic correctness/security tests pass; no ineligible job appears in the acceptance corpus; quality is compared against the recorded baseline; measured latency/cost/freshness stay within approved budgets; operations can distinguish a legitimate sparse profile from an outage.

### WP12 — Release, observe, and close

Suggested owner: release owner + operations; independent QA/Security sign-off for their gates.

1. Identify the existing server-side configuration/cohort mechanism. If none meets the need, add a small reviewed kill switch and cohort control. Proposed cohorts are rollout design, not flags known to exist in this repository.
2. Release WP01 containment promptly after its focused tests. Do not wait for model migration. If production is exposed and the fix is not ready, obtain the authorized operator's containment action.
3. Roll additive database/response changes before dependent clients. Deploy compatible readers/writers before marking new versions current. Clear or bypass incompatible cache generations deliberately; do not wipe unrelated cache data.
4. Validate in staging with controlled accounts and a real browser. Then use internal accounts, an approved small cohort, and staged expansion—illustratively 5%, 25%, then 100%—only after gates hold for a traffic-representative window. Percentages and durations must be approved from actual traffic, not treated as universal safe values.
5. Shadow scoring, if used, must remain authorized/entitled, have bounded provider spend, and not mutate the primary cache/vector state or create applications. Read-only catalog checks and behavioral recommendation calls are separate activities: the latter can persist data.
6. Halt expansion on any access-control failure, invalid-job return, false application behavior, incompatible-vector comparison, data-loss signal, or approved latency/error/cost/freshness-budget breach.
   The kill-switch runbook must also address queued/in-flight work: stop new paid/provider work, pause or safely drain consumers under the approved policy, and retain recoverable queue state. Disabling only the HTTP route does not stop already queued provider spend. Already-issued requests may finish; stale/deleted output must still be rejected.
7. Roll back by disabling the affected matching cohort/path or reverting the non-security algorithm/client change while retaining ownership and entitlement controls. If the old implementation is insecure, feature-off is the rollback—not restoration of the vulnerable endpoint. Preserve ordinary browsing where safe.
8. Close each finding only with the evidence specified below. Refresh the audit with new revision/deployment references; unresolved items require a named accountable role, rationale, compensating control, review date, and approval. Do not count a risk acceptance as a verified fix.

## 8. Regression and acceptance matrix

These are required **new desired-behavior tests**, not claims that the existing 31 checks already cover them. The suggested test grouping is a plan, not an assertion that these test files exist.

| Test group | Required negative cases | Required successful controls | Layer / closure |
|---|---|---|---|
| Authorization, C01 | A requests B through both aliases, cache hit/miss, no mapping, forged/delegated target. Assert no target recommendation reads/writes/provider calls; deliberately swap user/learner selectors to ensure key-space errors are caught. | A requests A with distinct-ID and equal-ID fixtures; actual evidence/cache selectors and interaction selectors match their respective verified contracts. | Actual auth/router/handler + controlled API; WP01 |
| Entitlements, C02 | Denied/expired/unknown/error resolver states, direct API bypass, My Skills. | Valid subscription and matching add-on; unrelated career gates unchanged. | Resolver integration + API + UI; WP02 |
| Input boundary | Null/array/string JSON, malformed JSON/UUID, invalid limit/boolean, unsupported method. | Default 20; normal UI limit 3; bounds 1 and 50. | Handler; WP01 |
| Availability, C03/C06 | Closed/inactive/deleted/expired job, deadline crosses after cache save, exact boundary. | Active open valid job; intentional null deadline. | Real SQL + backend fake-clock fixtures + browser; WP04/WP06 |
| Presentation, C04/C05 | False threshold flag overwritten, zero similarity changed, fallback given percent, metadata lost. | Distinct similarity/index; ordinary fill-in; valid personalized explanation. | Service, component, dashboard mapping; WP05 |
| Details/Apply, R05 | Thin RPC row, missing/deleted job, link fetch failure, job closes before action. | Real external-link and internal-only jobs via recommended and ordinary cards. | SQL DTO + API + controlled browser; WP05/WP06 |
| Freshness, C07/R02/R03 | Skill/project/certificate/profile mutation, approval change, delete, expiry, slow old result, out-of-order job. | Unchanged input reuses compatible vector; force refresh reranks; new revision eventually current. | Database/worker integration + hook tests; WP06–WP09 |
| Failure handling, C08–C10 | Long/malformed/invalid worker vector, partial evidence error, dismissal error, cache-save error, all fallbacks fail. | Normal vector, truly empty evidence/catalog, fresh valid response despite cache-save-only error. | Actual source + service/SQL integration; WP03 |
| Data shape, C11/R01 | Null/non-string skill entry, unsupported preference fields, malformed imported rows. | Valid skills; missing-vs-populated preference fixtures. | Handler/write validation + data inventory; WP03/WP09 |
| Dependency/grants, R04 | Missing exact RPC/helper, wrong signature, unavailable binding/consumer, unauthorized direct SQL call. | Intended V2/V1/fallback independently execute; approved callers retain access. | Disposable DB + controlled environment; WP00/WP09 |
| Account/race UI | Account switch, hidden-widget preference carryover, obsolete response, failed save/refresh. | Latest response wins; new account isolated; Applied state preserved. | Component + controlled browser; WP08 |
| Alternate writers | Distinct-ID standalone generation uses the wrong identity; unauthorized target; direct text violates the proposed canonical input/version contract; obsolete alternate writer publishes. | Own learner/child entity, profile user identity, and authorized administrative paths use their respective correct identities; equal-ID control remains supported. | Router + actual generation handler + worker integration; WP00/WP01/WP07 |
| Transport/read races | Shared-cache/account reuse, profile change during hydration, inconsistent multi-query input, unstable capped selection. | Route-scoped no-store policy; coherent revision; deterministic selection; bounded retry/pending state. | Real headers + controlled proxy/browser + concurrent integration; WP06/WP07 |
| Worker/deletion recovery | Crash after claim/before acknowledgement, duplicate/poison job, deletion during provider call, zero-row update, kill switch with backlog. | Lease recovery, idempotent guarded write, authorized replay, no deleted-data resurrection, safe pause/drain. | Database/worker fault injection + runbook rehearsal; WP07/WP12 |
| Ordinary fill-in eligibility | Dedicated recommendations are empty/partial but ordinary source contains closed/expired rows. | Only eligible learner fill-in cards appear; recruiter/admin management visibility is unchanged. | Scoped listing API + dashboard/browser; WP04 |
| Legacy/policy, L01 | Retained malformed interaction contract or unowned target; samples shown as live. | Valid authorized retained interaction, or proven safe retirement; explicit policy dispositions. | Reachability + API/product evidence; WP10 |

Mutation controls are mandatory for the ownership regression and valuable for freshness: deliberately substitute a foreign selector, remove an authorization check, or permit an obsolete worker write in a test-only variant, and verify that the corresponding test fails. A mock that ignores the changed argument is not acceptable evidence.

## 9. Verification workflow and evidence handling

### Current executable baseline checks

From the workspace root, with existing dependencies installed:

```bash
node audit-evidence/learner-job-recommendations/verify.cjs
node audit-evidence/learner-job-recommendations/verify.cjs --assert-snapshot
```

At the planning baseline, the first reproduces 31 behaviors; the second intentionally rejects the historical snapshot drift. Neither is the post-fix pass criterion. After fixes, preserve the historical results, retain explicit characterization dispositions, and run the new regression suite against the repaired source.

The separately recorded WP00 boundary checks are now executable:

```bash
node audit-evidence/learner-job-recommendations/verify-boundaries.cjs --assert-snapshot
node audit-evidence/learner-job-recommendations/verify-boundaries.cjs --regression
```

At revision 1.3's pre-fix baseline, the boundary snapshot passed and regression exited 1 with nine failures. After WP01 in revision 1.4, the old snapshot is intentionally stale; use `--regression` for the repaired working tree. It exits 1 with five remaining non-WP01 failures, while all four ownership cases pass. See section 2.6 and the implementation record for scope and the two explicitly historical mutation skips. Do not overwrite historical expectations just to obtain green output.

### Application checks during implementation

From `skillpassport/`:

```bash
npm run typecheck
./node_modules/.bin/tsc --noEmit -p tsconfig.functions.json
npm run test -- --run
npm run build
```

The existing `typecheck` targets the frontend; the separate Functions configuration must also be checked. The full Vitest command is not a production assurance test and must be run in an isolated test environment with no production credentials or unintended live-test configuration. Run the applicable targeted tests first; for packages beyond the new boundary verifier, select their actual paths after adding them. Record unrelated baseline failures instead of suppressing them or describing unrun suites as passed.

A Vite build is not validation of the deployed Pages Functions bundle. Add/verify the actual Functions bundling and worker integration checks in the project's deployment workflow. Verify SQL in a disposable database, then in staging; do not substitute schema-string assertions for SQL execution. Browser tests must exercise the real routed components and application controls.

After implementation changes, refresh the modified project's knowledge graph with `graphify update .` from that project directory, following its applicable instructions. This plan itself changes documentation only and does not require a code graph rebuild.

### Required retained artifacts

- Commit, deployment, environment, migration, worker, model, and test-run identifiers.
- Fingerprints plus reviewed diffs against the prior evidence baseline.
- Strengthened selector assertions and mutation-control results.
- Unit/integration/browser outputs, with failures and exclusions retained.
- Read-only catalog output and exact SQL/grant definitions, redacted as necessary.
- Migration/backfill rehearsal, lock/query observations, resumable checkpoints, counts of dirty/current/failed vectors, and incompatible-cache handling.
- Quality dataset/judgment versions, baseline comparison, operational budgets, cohort observations, and rollback rehearsal.
- Finding-by-finding closure register and reviewer approvals; no credentials or raw learner profile corpus in this root document.

## 10. Migration, backfill, and rollback safeguards

1. Scope every migration to verified objects. Record affected-row estimates and model-generation inventory before any write. Production execution requires the project's normal operator approval.
2. Backfill with bounded batches, concurrency caps, resumable cursors, idempotent writes, provider spend limits, and observable checkpoints. Start with a controlled cohort. Never launch an unbounded re-embed-all from an HTTP recommendation request.
3. Prevent incompatible-model comparisons throughout cutover. If retaining old/new generations side by side, isolate all compared entity types. If that cannot be done safely, temporarily serve honestly labeled generic opportunities rather than mixing vector spaces.
4. Quarantine unknown/failed revisions from “current” status. A successful job count is not sufficient: sample content/version alignment, vector validity, eligible result shape, and end-to-end readiness.
5. Retain old columns/functions/vector generations long enough for the agreed rollback window; retire them only after callers and recovery needs are verified. Do not drop provenance or mark unknown old vectors as newly generated.
6. Rehearse feature-off, provider outage, broken queue, migration lock contention, and frontend/server version skew. Document who performs recovery and which metrics demonstrate recovery.
7. Never roll back by removing the actor/subject boundary, trusting client entitlement, replaying a database reset, or restoring unvalidated cached snapshots.

## 11. Release gates

| Gate | Evidence required | If unmet |
|---|---|---|
| G0 — immediate containment | Hardened ownership tests, both aliases, self-access control, unauthorized side-effect assertions; environment exposure assessed by authorized operator. | Do not expose the unsafe matching route; retain/ship containment independently. |
| G1 — feature access | Shadow-readiness controls and authoritative matching entitlement tests pass; UI/API behavior agrees. | Do not broadly enable paid matching; no fail-open workaround. |
| G2 — functional correctness | C03–C06 and C08–C11 acceptance passes; full action DTO verified; empty/fallback/error distinctions visible. | Hold promotion of the corrected experience; ordinary browsing can remain. |
| G3 — freshness/dependencies | Revision/race tests; deployed SQL/grants/triggers/workers inventoried; R02–R05 repaired where present; model-compatible current results proven. | No claim of fresh personalized matching; keep affected cohort off or explicitly degraded. |
| G4 — production readiness | Representative quality review; measured budgets, alerts/runbooks, controlled browser/API tests, compatibility and rollback rehearsal. | Hold broad expansion; continue bounded authorized validation. |
| G5 — closure | Independent review, timestamped deployed evidence, closed/dispositioned findings, accountable ownership for accepted residual risks. | Report incomplete remediation honestly; do not declare production assurance. |

Zero tolerance in acceptance applies to authorization bypass and returning jobs that violate the agreed availability predicate. Quality, latency, spend, and propagation thresholds require explicit measured budgets; this plan does not manufacture numerical guarantees.

## 12. Ownership, estimation, and first execution slice

Suggested accountability:

| Role to assign | Accountable output |
|---|---|
| Engineering lead | Scope, dependencies, API compatibility, closure register, release recommendation. |
| Backend engineer | WP01–WP06 route/handler/contract changes and focused tests. |
| Frontend engineer | Consumer contracts, My Skills/Opportunities/dashboard states, account/race safety. |
| Database/platform owner | Live inventory, migration/grant safety, queue/worker lifecycle, resumable backfill, rollback operations. |
| QA / independent reviewer | Mutation controls, acceptance matrix, browser and environment evidence. |
| Product/domain owner | Evidence eligibility, scores/labels, preferences, freshness expectations, quality acceptance. |
| Security reviewer | Actor/subject boundary, feature enforcement, RPC exposure, safe rollback. |

Do not commit a delivery date from the source audit alone. Estimate each PR after WP00 establishes deployment drift, queue ownership, vector provenance, and representative data size. Security containment is the first independently deliverable slice; vector/model migration is the largest uncertainty and must not delay it.

First implementation slice:

1. Assign the lead/reviewers and record D01; strengthen the ownership regression and selector-aware mocks.
2. Implement WP01 with focused tests for both aliases and malformed inputs; review and deploy through the authorized release process.
3. Run read-only environment inventory and entitlement-readiness controls alongside that work.
4. Implement WP03 and agree D03/D05 so eligibility and contract fixes can follow without a broad redesign.
5. Open the remaining packages with explicit dependencies, acceptance evidence, and assigned owners. Keep R-items conditional until deployment facts are known.

## 13. Final definition of done

The remediation is complete only when:

- C01–C11 have repaired behavior demonstrated against the intended deployed implementation, with C07 interpreted as version-correct freshness rather than mandatory regeneration on every click.
- R01–R05 each have current environment evidence and an explicit repair or documented not-applicable/accepted disposition; missing local definitions alone are not closure evidence.
- L01 and scoped observations have explicit retained/fixed/retired/policy decisions without falsely attributing legacy behavior to active widgets.
- Every supported surface preserves authorization, availability, provenance, score meaning, and action metadata.
- Alternate writers honor the same identity/input-version contract; HTTP cache isolation, coherent read snapshots, worker crash recovery, and deletion fencing have explicit acceptance evidence.
- The new regression suite catches deliberately reintroduced ownership and stale-publication defects; historical characterization results are preserved separately.
- Migrations, model cutover, browser journeys, observability, quality review, and safe rollback have been exercised at the appropriate layer.
- The audit is updated with actual commits/deployments, independent review, remaining limits, and ownership of any accepted residual risk.

Until then, describe the state precisely: contained, partially remediated, under validation, or accepted with specified residual risk—not “production certified.”

## 14. Adversarial re-review additions and evidence boundaries

The first plan mapped every historical audit item, but that did not prove the implementation boundary was complete. This re-review identified five areas needing more explicit work. Items below distinguish additional source observations from preventive design requirements; they are not five newly proven production vulnerabilities.

| Addition | Evidence / qualification | Required disposition |
|---|---|---|
| A01 — alternate writers and identity contracts | The [career router](skillpassport/functions/api/career/[[path]].ts), L115–116, passes authenticated `userId` to [standalone generation](skillpassport/functions/api/embedding/handlers/generateEmbedding.ts). That handler's learner and child-entity checks compare it with learner IDs, while profile/admin checks use user IDs. Isolated actual-handler execution reproduced own-learner/child rejection when the actor and learner IDs differ, with successful resolved-learner, profile-user, and equal-ID controls. Deployed frequency and impact were not tested. The handler has ownership checks; this is neither an unrestricted writer nor a universal generation failure. | WP00 inventories callers; WP01 carries distinct actor-user and resolved-learner identities and uses section 2.4's per-operation map; WP07 covers every retained writer's versioned publication. Add permanent actual-handler self/foreign/entity/admin controls before claiming closure. |
| A02 — HTTP isolation versus database caching | The inspected [response builder](skillpassport/functions/lib/response.ts) and [global middleware](skillpassport/functions/_middleware.ts) do not add a non-cache policy to application recommendation success responses. [Auth-core-generated errors](skill-echosystem-packages/auth-core/src/internal/errors.ts) already include `no-store`, as confirmed by isolated execution; do not generalize the gap to every response. Deployed CDN/proxy settings were not inspected. Absence of an explicit success-response header does not prove that Cloudflare currently caches or leaks these responses. | WP06 preserves existing protections and adds scoped isolation where missing, with real-header/account-switch tests for dashboard GET and matching POST aliases. Keep the database cache authorized independently. |
| A03 — read-side races and deterministic inputs | The plan previously emphasized compare-and-set publication. The [text builder](skillpassport/functions/api/embedding/services/textBuilder.ts) performs separate profile/evidence queries, and several evidence selections are capped without a unique deterministic order. Revision checks only at final persistence do not specify how a coherent input is established or how a cached response is validated during a concurrent edit. | WP06 guards cache reads/hydration; WP07 defines coherent input reads, stable selection, bounded retries, and a final eligibility-validation instant. Do not promise an impossible guarantee that a job cannot close after the response's validation instant. |
| A04 — durable recovery and deletion fencing | The previous plan required retries and idempotency but did not specify claim recovery, crash/ack ordering, deletion fencing, or backlog behavior under the kill switch. Additionally, [databaseUpdater](skillpassport/functions/api/embedding/services/databaseUpdater.ts), L115–132, accepts an empty returned array as `success: true, rowsAffected: 0`; the [standalone handler](skillpassport/functions/api/embedding/handlers/generateEmbedding.ts), L465–468, checks success but not the affected-row count. Isolated execution of the actual updater reproduced zero-row success and a successful one-row control. This is a success-reporting gap, not evidence of observed data resurrection. | WP03/WP07 require meaningful publication acknowledgement; WP07/WP12 add crash/delete/replay/backlog tests and operational recovery. A guarded stale update may legitimately affect zero rows, but it must be reported as discarded/not published. |
| A05 — ordinary dashboard fill-in | [Dashboard](skillpassport/src/pages/learner/Dashboard.jsx) fills recommendation slots from ordinary opportunities. [The service](skillpassport/src/features/opportunities/api/opportunitiesService.ts), L83–96, applies active filtering but does not request the proposed full open/deadline predicate; the inspected [listing handler](skillpassport/functions/api/opportunities/index.ts) likewise lacks those learner-feed restrictions in that GET path. Therefore fixing only the dedicated recommendation endpoint leaves this branch outside the proposed guarantee. Actual production rows were not inspected. | WP04 applies the learner availability contract to this branch before limits, adds explicit fallback/fill-in tests, and preserves authorized recruiter/admin management views. |

These additions sharpen the existing work packages; they do not authorize a global embedding/admin API redesign. Where identity or retention behavior needs broader platform changes, create a separately owned dependency and keep the affected recommendation path disabled/degraded until the required invariant can be met.

Review status: the original re-review used ad hoc isolated probes; revision 1.3 preserves the relevant cases in section 2.6's independent verifier, which additionally executes the actual application auth wrapper/router and response builders. External verification, database transport, provider, and profile text construction remain mocked; no live JWT verification, SQL, or browser is represented. The historical audit, historical characterization harness/JSON records, and application code were not changed by this revision. Database design safeguards follow least privilege, scoped changes, and short guarded transactions; no production SQL or backfill was executed.
