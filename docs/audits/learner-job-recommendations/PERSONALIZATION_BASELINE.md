# Personalization remediation: WP00 baseline

Recorded: 28 October 2026. Source baseline: `bf346e09da08de15c00f03b98fb7ecdb6793d8b2`.

This records baseline evidence and the initial readiness/context implementation for the workspace's [AI job recommendations plan](../../../../AI_JOB_RECOMMENDATIONS_REMEDIATION_PLAN.md). It does not supersede the historical ownership/jobs-only remediation. WP00 remains **in progress**. Readiness, normalized education/experience, source selection/privacy corrections, runtime response validation and minimal profile-needed UI are implemented locally. Preferences, complete producer integration, assessment/LTE relevance integration, shared reranking/evaluation, full producer coverage and deployment remain open.

## Reproduction and retained controls

Run from the application root:

```sh
node node_modules/vitest/vitest.mjs run \
  functions/__tests__/api/recommendation-readiness.test.ts \
  functions/__tests__/api/recommendation-context-baseline.test.ts \
  functions/__tests__/api/career-recommend-ownership.test.ts \
  functions/__tests__/api/recommendation-embedding.test.ts \
  functions/__tests__/api/recommendation-surfaces.test.ts \
  src/features/opportunities/api/__tests__/aiJobMatchingService.test.ts \
  src/features/opportunities/model/__tests__/recommendation-lifecycle.test.tsx \
  src/features/learner-profile/api/__tests__/recommendation-envelope.test.ts \
  src/widgets/learner-dashboard/ui/__tests__/RecommendedJobs.test.jsx \
  src/widgets/learner-dashboard/ui/__tests__/DashboardReadiness.test.jsx
```

Current readiness/source suite uses **10 files, no `it.fails` markers**. The earlier 151-check baseline contained nine expected failures. Review identified that such markers accept any exception, including an unrelated fixture/runtime failure. All added baseline assertions are now ordinary desired-behavior regressions; generic filler, normalized sources and cached-profile cases have actual local fixes. Final test counts and validation are recorded in the execution section below.

The new [context fixtures](../../../functions/__tests__/api/recommendation-context-baseline.test.ts) execute the real text builder. The database double applies learner ownership, enabled/approval predicates, certificate expiry, ordering and limits; unsupported operations throw. It is not a PostgreSQL integration test. Identity rows, provider calls and RPC results remain controlled doubles in the existing handler tests, so those tests do not prove deployed SQL authorization or vector validity.

| Finding | Current local evidence | Next gate |
| --- | --- | --- |
| G01 | Implemented locally: source-semantic readiness replaces character count. Identity, generic bio text and unsupported assessment labels do not qualify; one useful skill, specific study field or described approved project can qualify a fresher. Bare intent/ongoing learning is limited context. | Signed-in persona validation and broader reviewed policy fixtures remain. No claim of relevance-quality calibration. |
| G02 | Implemented locally: both surfaces build owned readiness before global index, cached cards or existing vectors. Profile-needed replies have no personalized cards or embedding provenance. Tests cover force refresh, old cache and unavailable model/index paths. | Remote cache/vector transition and signed-in validation remain. |
| G03 | Implemented locally: approved visible normalized education/experience supplement legacy fields with deterministic deduplication. Context revision reads bracket profile and evidence queries; changed snapshots fail before publication. Migration extends their recommendation triggers. | New migration must be applied before backend deployment; connected app DBs have not been migrated. More alias/legacy and producer fixtures remain. |
| G04 | Fixed locally: completed status is filtered before MAX_COURSES. Regression places a completed enrollment after a full page of ongoing enrollments. | Signed-in/rollout validation and canonical-context integration remain. Ongoing training remains separately labelled. |
| G05 | Fixed locally: false visibility is filtered before the training limit; legacy NULL remains visible, matching profile semantics. Certificate-parent training context also checks visibility, approval and learner ownership. | Canonical-context integration and signed-in verification remain; no claim about how many users were affected. |
| G06 | Fixed locally: name/age/gender and dedicated raw profile-link fields no longer enter builder text. Unused identity/contact columns are no longer selected. Contact fields were not previously appended. | No claim of automatic PII removal from user-authored biographies or descriptions. Full readiness and source contracts remain. |
| G07 | Still open: connected database metadata has no `learners.preferred_*` or `learners.experience_level` columns. Dashboard reads those fields. | Verify alternative preference storage, then implement owned typed persistence/API/UI. Connected metadata does not establish the development deployment's identity. |
| G08 | Partial: sidebar/My Skills and dashboard now share context/readiness. Semantic matching and dashboard rules are still separate ranking engines. | Shared ranking/explanations and compatibility migration remain. |
| G09 | Partially fixed: dashboard now uses exact names after Unicode/whitespace/case normalization. JavaScript no longer supports Java; exact normalized Python cases remain. Shared structured reranking/cutoff are still absent. | Reviewed alias mappings, shared reranking, measured cutoff and holdout evaluation. No claim of calibrated quality from this correction. |
| G10 | Builder queries neither assessment summaries nor LTE qualifications. Existing learning eligibility runs after retrieval. | Audit permitted final assessment producers and bounded authoritative LTE snapshots with revision coverage. |
| G11 | Partial: server emits schema-v2 validated envelopes. Profile-needed metadata survives the compatibility service/hook and dashboard service. The semantic hook now consumes the validated envelope directly, including empty-result metadata and successful profile guidance. The array API remains as a compatibility adapter for other callers. | Both hooks consume validated envelopes through QueryClient. Keep legacy array callers until covered; signed-in processing/rollout verification remains. |
| G12 | Implemented locally: name-only/filler profiles receive HTTP 200 guidance, not retryable embedding failures. Sidebar, My Skills and dashboard render profile actions. Real source failures remain unavailable, distinct from empty evidence. | Signed-in validation remains; generic legacy embedding requests still have their separate error contract. |
| G13 | Both hooks now use a shared QueryClient adapter; actor/org/learner keys, shared regeneration deduplication, abort signals and provider-lifetime save resets have real QueryClient regression coverage. | Complete producer integration before removing the event bridge; signed-in auth-refresh/cancellation and rollout verification remain. |
| G14 | Current preprocessing is `learner-text-5-evidence-budgets`. Handler regression exercises an RPC double that rejects old preprocessing, forcing regeneration only for ready context. Connected SQL confirms the same version predicate. Ranking identity remains `semantic-ranking-4-jobs-only`; semantic SQL policy was not changed. | Real deployment transition/old-vector rejection remains a rollout check. No mass learner backfill or job-vector rebuild. |

Passing controls also cover foreign/hidden/pending skill exclusion, certificate expiry, evidence outages, distinct user/learner identifiers, cache publication guards, request validation, feature denial on the career route, visits/closed jobs, provider output validation and late-response/account transitions. Keep these controls through subsequent changes.

## Callers and server boundaries

Paths in this report are relative links into the application.

| Surface / boundary | Current path | Migration obligation |
| --- | --- | --- |
| Sidebar | [RecommendedJobs](../../../src/widgets/learner-dashboard/ui/RecommendedJobs.jsx) → [semantic hook](../../../src/features/opportunities/model/useAIJobMatching.ts) → [matching service](../../../src/features/opportunities/api/aiJobMatchingService.ts) | Envelope ownership moved to QueryClient locally; retain dismissal/account isolation and finish producer integration. |
| My Skills | [MySkills](../../../src/pages/learner/MySkills.jsx) → same semantic hook/service | Keep existing access gate; add profile-needed UI and source-backed explanations. |
| Dashboard | [Dashboard](../../../src/pages/learner/Dashboard.jsx) → [dashboard hook](../../../src/features/learner-profile/model/useLearnerAIRecommendations.ts) → [dashboard service](../../../src/features/learner-profile/api/learnerAIRecommendationsService.ts) | Adapt legacy DTO to common policy; preserve current account sequencing. |
| Career endpoint aliases | [career router](../../../functions/api/career/[[path]].ts): `recommend-opportunities`, `recommend` → [handler](../../../functions/api/career/handlers/recommend.ts) | Preserve `ai_job_matching` gate and owner resolution before context/results. |
| Dashboard endpoint | [AI recommendations](../../../functions/api/learners/ai-recommendations.ts) | Unconditional matching entitlement is now checked before reading career context. Owner/readiness guards and a final context revision check protect the compatibility rules response. |
| Generic embedding endpoint | Career `generate-embedding` → [embedding handler](../../../functions/api/embedding/handlers/generateEmbedding.ts) → same learner builder | Corrected scope: this endpoint writes legacy entity vectors via [databaseUpdater](../../../functions/api/embedding/services/databaseUpdater.ts). It cannot publish a trusted recommendation-state vector or overwrite that vector's provenance. Builder changes affect database mode; direct text is a separate legacy path. Do not report it as a current recommendation-cache bypass. |
| Application eligibility | [learning eligibility](../../../functions/lib/learning-eligibility.ts) | Preserve authoritative application-time checks, human/AI policy and signed LTE requests. |
| Shared client state | [QueryProvider](../../../src/app/providers/QueryProvider.tsx), [App](../../../src/App.tsx) | Reuse existing provider and auth cache clearing. Global `refetchOnMount=false` requires a feature-level decision. |

The similarly named `matchJobsWithAI` inside the career-assistant find-jobs handler is a separate local function, not a caller of the semantic matching service. Do not migrate it solely on a name match; inspect its actual contract if expanding scope.

## Source and mutation inventory

| Source | Existing selection / producer | Freshness work |
| --- | --- | --- |
| Learner core/legacy education and experience | [text builder](../../../functions/api/embedding/services/textBuilder.ts); [learner service](../../../src/entities/learner/api/learnerService.ts) `updateLearner`, `updatelearnerByEmail`; [profile actions](../../../functions/api/learner-profile/actions.ts) | Existing learners revision trigger. Audit which core updates affect relevant context and ensure acknowledged revisions reach clients. |
| Skills/projects/certificates/trainings | Same builder; learner service's `updateTechnicalSkillsByEmail`, `updateSoftSkillsByEmail`, `updateSkillsByEmail`, `updateProjectsByEmail`, `updateCertificatesByEmail`, `updateTrainingByEmail`, `updateSingleTrainingById` | Existing evidence revision triggers. Inventory other approval/revocation/import producers before removing the event bridge. Training visibility and certificate expiry need explicit semantics. |
| Normalized education/experience | Canonical builder; profile actions and [career context reader](../../../functions/api/career/context/learner.ts); learner service's `updateEducationByEmail`, `updateExperienceByEmail` | Included locally; [new revision migration](../../../supabase/migrations/20270122000000_recommendation_context_revisions.sql) adds both input triggers and an owned context-revision RPC. Apply schema before deploying this reader. |
| Course enrollments | Builder and profile `update-enrollment` action | Existing input trigger; repair status-before-limit. Audit completion, withdrawal and import producers. |
| Preferences | Dashboard reads assumed learner fields | Confirm real persistence or introduce a typed owned record, mutation API and UI; never assume schema from reads. |
| Assessments | Career assessment context/handlers and assessment APIs | Select final, permitted career signals and identify their revision producer; inferred interests cannot become verified skills. Full producer audit pending. |
| LTE achievements | `readLearningSnapshot`, `learningDecisions`, equivalency RPCs in learning eligibility | Existing signed qualification contract and policy/fingerprint checks. New context use must be bounded and revision-aware; external producer coverage pending. |
| Job catalogue | Verified job SQL, [hydration](../../../functions/lib/job-recommendations.ts), opportunities API | Preserve jobs-only model/source provenance and current-field hydration; check dismissal/applied exclusions before ranking limits. |

The current browser save event is emitted by the learner service as `learner-profile-updated` with a learner ID. The provider-lifetime recommendation bridge resets matching learner keys on both surfaces, including inactive caches; other learners and unrelated features remain intact. This is an initial producer inventory, not evidence that all approval, revocation, settings, resume-import or cross-tab updates already notify both surfaces.

Relevant migration chain:

- [Training visibility/approval](../../../supabase/migrations/20260629000000_add_approval_tracking_columns.sql): `trainings.enabled` with default true, no NOT NULL requirement here.
- [Recommendation revisions](../../../supabase/migrations/20261015090000_recommendation_boundaries_and_revisions.sql): learners update trigger and skills/certificates/projects/trainings/course_enrollments/interactions input triggers.
- [Normalized learning evidence](../../../supabase/migrations/20261022133000_normalized_learning_evidence.sql).
- [Verified matching](../../../supabase/migrations/20270118000000_verified_ai_job_matching.sql).
- [Jobs-only matching](../../../supabase/migrations/20270121000000_jobs_only_recommendations.sql): latest migration before this context slice. The new context migration follows it; no applied history was edited.
- [Context revisions](../../../supabase/migrations/20270122000000_recommendation_context_revisions.sql): new forward migration, tested in a disposable DB; not applied to application databases.

## Remaining WP00 exit gates

- Reverify development project/runtime bindings and the current sparse account. Read-only connected metadata/aggregate checks below do not identify the prior development deployment. No deployment or database mutation was performed.
- Complete producer coverage for approval/revocation, assessment finalization, LTE policy/qualification changes, profile settings and resume import. Training NULL visibility is now explicitly tested against the existing `enabled !== false` profile convention.
- Extend the new cache/vector/index, source-race and non-result regressions with signed-in cross-org transitions and applied/dismissed exclusion before candidate limits. Legacy generic vector writes remain separate from trusted recommendation state.
- Establish sanitized persona fixtures and a separate labelled evaluation holdout. Current deterministic regression assertions do not establish recommendation quality or justify ranking weights.
- Only then close WP00 and advance dependent source/persistence/rollout packages. WP01 contract/readiness fixture work can proceed against the verified local evidence while live checks remain explicitly pending.

## Tooling provenance

The sandbox has no usable Node.js or Graphify binary (its Node symlink points outside the mounted environment). Host execution supplied Node.js `v22.22.3` and ran the tests. Graphify queries ran on the host; the application-specific `buildlearnerTextFromDatabase` query located the builder, recommendation handler, generic embedding handler and tests. Some graph locations/symbols were stale, so code inspection was used to verify findings. A graph query is navigation evidence, not proof of current runtime behavior.

Backend type checking fails at the repository level: comparison against committed source found **6,912 diagnostics on both baseline and changed code, with no introduced diagnostics** at the time of comparison. This is not a clean type-check claim. The comparison overlays committed versions in a compiler host without resetting the checkout.

## Read-only connected-database findings and deployment discrepancy

The `supabase_skillpassport` read-only connection reports PostgreSQL 17.6. Metadata confirms `trainings.enabled`, education/experience approval and visibility fields, missing assumed learner preference fields, and no recommendation input triggers on education/experience. Experience does have separate learning revision/invalidation triggers; those must not be described as wholly absent freshness controls.

The migration ledger includes `20260629000000`, `20261015090000`, `20261022133000` and `20270118000000`, but **not `20270121000000`**. Full definitions of all four job-index/ranking/publishing functions were inspected: they query opportunities directly without jobs-only filtering. Aggregate active catalogue counts were **633 jobs and 50 visits** at query time. Application hydration excludes visits, but cannot prove pre-limit ranker/index correctness on this database.

This is a verified discrepancy in the connected database, not proof that the previously verified remote development deployment regressed. The connection's project identity has not been tied to that deployment. Reconcile the target and ledger before any rollout; do not blindly rerun a migration or overwrite functions based on this observation.

The separate `skillpassport_dev_local_supabase` connector reports `http://127.0.0.1:54321` and has recommendation-state storage. It must not be substituted for a remote development target. Neither connector's application database was changed. SQL integration verification used a separately created synthetic fixture database in the local container, then removed it.

## Readiness/context implementation and schema gate

- [Readiness policy](../../../functions/lib/recommendation-readiness.ts) accepts only selected structured career signals; biographies/identity and unsupported assessment properties cannot create readiness. This policy describes available matching context, not a qualification or hiring prediction.
- [Shared response schema](../../../shared/contracts/job-recommendations.ts) validates ready, no-match, profile-needed and limited-context envelopes, rejecting contradictory provenance/cards. Processing/rate-limit transport behavior remains the existing API contract pending the complete query migration.
- [Canonical reader](../../../functions/api/embedding/services/textBuilder.ts) loads approved visible education/experience alongside existing evidence, brackets all profile/evidence reads with owned revision checks, preserves source outages, deduplicates normalized lines and budgets text by category below the worker cap.
- Career and dashboard endpoints share this readiness; dashboard also checks matching entitlement. Minimal UI actions accompany normal profile-needed responses. The compatibility array service still exists; both hooks now consume envelopes through the shared QueryClient adapter described below.
- [Disposable SQL runner](../../../scripts/checks/test-recommendation-context-sql.mjs) creates a fresh local fixture DB, applies the actual existing revision migration plus the new migration, checks ownership, stable reads, source insert/update/move/delete, clock expiry and effective execution privileges, then drops only that DB. It does not clone private data or apply SQL to an app DB.

**Deployment prerequisite:** apply the new context-revision migration on the verified target before deploying this backend. Absence of its RPC is a real unavailable dependency, not an empty-profile result. First reconcile the observed jobs-only migration/function discrepancy; do not assume the connected target is the previously verified development deployment. Preferences, complete producer integration, assessment/LTE relevance, shared reranking/evaluation and deployment acceptance remain uncompleted packages.

## Follow-up audit corrections

All four confirmed follow-up findings are fixed locally:

- [Readiness policy](../../../functions/lib/recommendation-readiness.ts) rejects whole-field no-experience/zero-duration placeholders and generic experience filler. It preserves substantive role descriptions containing negative or zero-related words.
- Generic degree aliases use consistent Unicode and punctuation normalization. `BSc`, `B.Sc.` and `B.Tech.` remain limited context; named study fields still qualify.
- [Text building](../../../functions/api/embedding/services/textBuilder.ts) shares normalized legacy experience with readiness before category budgeting. Leading whitespace cannot consume the experience budget and erase the sole useful signal.
- [Dashboard readiness](../../../src/pages/learner/Dashboard.jsx) wraps catalogue rendering, so empty, loading and error states cannot hide profile actions. Ready profiles retain catalogue behavior. The [integration regression](../../../src/widgets/learner-dashboard/ui/__tests__/DashboardReadiness.test.jsx) extracts the actual Dashboard branches and executes the shared gate; it is not a signed-in browser test.

The added regressions reproduced these failures before production edits and pass afterward. Readiness policy is now `career-readiness-3`; preprocessing is `learner-text-5-evidence-budgets`, invalidating prior readiness/vector provenance. These fixes do not close the remaining work packages or deployment gates.

## Client envelope continuation

The [semantic matching service](../../../src/features/opportunities/api/aiJobMatchingService.ts) exposes `getJobRecommendations`, returning mapped cards alongside the validated schema-v2 envelope. The [semantic hook](../../../src/features/opportunities/model/useAIJobMatching.ts), used by the sidebar and My Skills, consumes it directly. Empty results retain cache/computation/revision metadata; profile-needed states are successful data. The hook exposes the result state and envelope while preserving existing UI fields and account/generation/save guards.

The legacy `matchJobsWithAI` and `refreshJobMatches` array APIs retain their compatibility behavior. Unversioned responses are accepted only by that adapter; unsupported advertised versions and contradictory envelopes fail validation. Deploy the migrated client together with the schema-v2 backend, after its required context migration. An unversioned backend intentionally yields an unavailable state in this client. The subsequent QueryClient migration below replaces the earlier local result state in both hooks.

Added service and hook regressions cover empty metadata, both profile-needed states, ready mappings including zero scores, force-refresh requests, unsupported versions, contradictory/failed responses and clearing envelope metadata after an acknowledged save. Existing account, disablement and late-response controls remain passing. Response mocks now create a fresh HTTP response per call, preventing consumed response-body errors from masquerading as schema rejection; schema-negative tests assert `ZodError` explicitly.

## Evidence-budget follow-up fixes

All three further audit findings are fixed locally. Legacy `branch_field` and `course_name` are normalized once and shared between readiness and emitted text. Placeholder skill names use the same usefulness predicate in readiness and text selection; each selected skill receives a bounded share of its category budget, including separators and heading overhead. Verbose earlier descriptions cannot erase later short skill names. Generic bachelor/master technology and engineering degree aliases remain limited context, while named specializations or a separately recorded field remain useful education.

The new ordinary regressions failed before production edits (nine failing cases) and pass afterward. Controls preserve specific engineering fields, the single-letter skill R, all 15 selected ordinary skill names, deterministic ordering and the 10,000-character total cap. These checks cover the reported inputs; they do not establish a comprehensive degree taxonomy or unlimited text preservation. Current identities are `career-readiness-4` and `learner-text-5-evidence-budgets`; prior cached readiness/vector provenance must be rejected.

## QueryClient migration

Both recommendation hooks now adapt the [shared query hook](../../../src/shared/model/recommendations/useRecommendationQuery.ts), backed by the existing [QueryProvider](../../../src/app/providers/QueryProvider.tsx). The [key factory](../../../src/shared/lib/queryKeys/recommendations.ts) includes actor, organization, learner, schema version, surface and normalized request options. Known profile revisions from props may partition semantic requests; server-returned revisions remain response metadata and never change their own query key. The dashboard waits for the resolved learner ID. Known foreign profile owners disable semantic requests; server ownership remains authoritative.

QueryClient owns complete envelopes, results, readiness, request/error state and regeneration mutation state. Queries use a 30-second stale window and five-minute inactive GC window, override global stale-mount suppression, and use no previous-scope placeholder data. Only a 409 source conflict retries once; auth, rate, provider and successful profile-needed results do not retry automatically. Manual regeneration is a dedicated mutation with shared in-flight deduplication, cancellation of obsolete query work and Retry-After cooldown. Query publication handles cancelled late results without copying response state into Zustand.

The provider-lifetime compatibility listener resets matching learner caches before active refetch. It remains installed when widgets are hidden/unmounted, preventing a recent inactive cache from restoring pre-save cards. Existing logout clearing and organization handling in App are retained. The event bridge stays until all editors/approval/import producers have an acknowledged scoped invalidation path.

Both services pass AbortSignal to `ssoClient.fetch`. Installed auth-client 2.0.0 source preserves the signal for initial and replayed resource requests, while its shared refresh operation receives no caller signal. Regression tests verify the service handoff and real QueryClient cancellation/isolation; a signed-in browser test during shared authentication refresh remains pending. This follows TanStack's [cancellation contract](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation) and explicit [query options](https://tanstack.com/query/latest/docs/framework/react/reference/functions/useQuery).

Lifecycle regressions use real QueryClients and controlled service promises. They cover shared observers, duplicate clicks, source-save/late-response races, account/org transitions, disabled/missing/foreign profiles, unmount during regeneration, stale mounting, known source revisions, option normalization, no-match metadata, 409 restart and rate cooldown. Dashboard transport tests enforce schema-v2, profile guidance, structured errors and cancellation propagation. Bounded 202 processing/index polling is implemented in the continuation below; full producer/rollout integration remains open. Query migration does not establish ranking quality.

## Query audit corrections

All three confirmed Query audit findings are fixed locally:

- Retry-After metadata has an actor/org/endpoint key in QueryClient, separate from result keys. Automatic queries and manual regeneration check the same deadline, which survives remounts, result resets and option changes. The small policy record is retained for the client lifetime so a long server deadline cannot expire from cache early; existing logout clearing removes it. Cooldown expiry permits the next request, without adding an automatic polling timer.
- The query adapter suppresses cached data/readiness after 401 or 403. Dashboard now consumes the recommendation error and renders an unavailable/retry state before catalogue cards or stale guidance. Successful requests after access restoration can show cards again.
- Regeneration checks the live observers of the exact query scope after cancellation, rather than the initiating component alone. A surviving automatic or manual-only observer can receive the shared result; no remaining observer means no new regeneration request starts.

The four added negative cases reproduced the failures before edits. Added controls cover cooldown expiry, restored access, independent actor/endpoint scopes, the last observer unmounting, and a surviving manual-only dashboard observer. Dashboard source-derived rendering coverage verifies that recommendation errors override both populated cards and old profile guidance. Existing stale-response/account/save guards remain passing. This is local synthetic regression coverage; signed-in auth/entitlement transitions remain a rollout check.

## Bounded preparation responses

The schema-v2 contract now accepts `processing` and `index_building` with ready source context, no cards, provenance `none`, `cached=false`, and a validated 1–60 second suggested interval. Services require HTTP 202 for these states and HTTP 200-style terminal responses for results/profile guidance; mismatched pending statuses fail validation. The [shared transport parser](../../../src/shared/api/recommendationResponse.ts) preserves the later of the response-body interval and Retry-After header. Legacy array callers get `MATCHING_PROCESSING`, preventing an in-progress result from being mistaken for an empty job list.

The career endpoint still repairs at most three index entries per ordinary request. After a batch, it returns 202 `index_building` only when valid verified counts increased while catalogue size stayed unchanged, then rechecks the owned source revision. This acknowledges incremental progress, not a background job or a generated learner vector. Complete repair continues to ranking; stalled/failed repair remains 503, invalid counters are unavailable, and changed context remains 409. Actual rate limiting now supplies its window's Retry-After header.

The [polling policy](../../../src/shared/model/recommendations/polling.ts) limits each result scope to five pending acknowledgments total (initial response included) and two minutes from the first acknowledgment. QueryClient retains counters/deadlines across remounts. Polling uses ordinary reads even after a forced first request; waiting refresh clicks cannot restart it. A long server wait is honored without issuing a request after the processing deadline. A deadline wrapper aborts a hanging resource request and prevents even an abort-ignoring transport's late success from publishing.

Sidebar/My Skills loading states and Dashboard's readiness gate retain a waiting state without presenting matches or empty results. Exhaustion produces a bounded unavailable state with explicit retry. Success/profile guidance ends polling; errors stop it; disablement, account changes and saves retain cancellation/isolation. A manually started dashboard request can follow preparation with auto-fetch initially disabled. No timer or result state was added to Zustand.

Regressions use real QueryClients and controlled clocks/promises, checking wait intervals, terminal success, shared observers, remount budgets, attempt/time limits, hanging/late responses, ordinary polling after force, disablement, account changes, save resets and explicit recovery. Server checks distinguish real verified progress from stalled repair and context changes. Production deployment, signed-in persona/auth-refresh checks, full producer integration, preferences and relevance evaluation remain pending.

## Empty-experience follow-up correction

The readiness policy now rejects whole-field statements such as “I don't have any work experience” and “I have never worked before”, including curly-apostrophe variants. Both role and description fields use this rule. The checks stay anchored to the whole field so descriptions that also identify substantive work, projects or skills retain their evidence. Other useful sources still qualify a learner without falsely adding experience coverage.

Regressions cover both fields, legacy and normalized database records, independent skill evidence, and substantive negative-wording controls. Seventeen new cases failed before the production change; the complete suite now passes 350 cases. Readiness policy is now `career-readiness-4`; the shared envelope rejects the prior policy version, and transport/lifecycle fixtures use the new version. Text preprocessing remains `learner-text-5-evidence-budgets` because text selection and normalization did not change. This correction does not close preferences, producer integration, relevance evaluation or rollout.

## Execution validation

- **350 tests passed across 10 files**, without expected-failure markers. Includes sparse/fresher/intent/unsupported-assessment fixtures, source visibility/approval/ownership, mixed-snapshot rejection, old preprocessing, profile-needed cache/index behavior, contradictory envelopes, UI guidance, account/save lifecycle and the final profile/catalogue fence after asynchronous eligibility enrichment.
- **Disposable PostgreSQL migration test passed** via the runner linked above. Its baseline is the existing recommendation revision fixture/migration, not a complete restoration of every application migration or a signed-in app environment.
- **Production app build passed**. Rollup reported circular-import and chunk-size warnings; this validation does not claim those warnings were resolved.
- Both frontend and backend type comparisons were rerun after bounded preparation handling. The adapters bind query result types explicitly to their validated service return types. Type comparison against committed code: backend **6,912 before and after**; frontend **7,976 before, 7,971 after**; **no introduced diagnostics** in either comparison. These are not clean repository type checks.
- Markdown links and CRLF-aware diff whitespace checks passed. Graphify AST refresh was run; no remote deployment or application-database change was made.

The empty-experience correction was checked with the complete 350-case recommendation suite and a fresh production build. The earlier frontend/backend diagnostic comparisons above predate this regex/contract-literal correction; they were not rerun for this change. Graphify was refreshed after the edit. No application database or deployment was changed.

## 29 October implementation continuation

The [release checklist](./RELEASE_CHECKLIST.md) records the current implementation and remaining acceptance gates. Saved preferences now have service-only owned persistence, an authenticated read/write API and a settings form. Required choices are separate from soft preferences, and assessment/LTE source use is explicit opt-in. Both surfaces consume saved preferences and the shared deterministic ranking policy; the old arbitrary dashboard weights and assumed learner preference columns are removed.

Source producers now have a periodic owned profile/catalogue revision bridge as well as acknowledged save/application/feedback and cross-tab notifications. Approval/import/server-side changes invalidate the matching learner scope without consuming embedding/provider budgets when metadata is unchanged. Assessment finalization and application writes have source triggers. LTE evidence uses a signed bounded summary; only an external dependency hash is persisted. Context and final-response fences reject changed approvals/policy revisions. New text preprocessing is `learner-text-6-verified-learning`; ranking identity is `semantic-ranking-5-evidence-preferences` and shared ordering is `evidence-order-1`.

The expanded application suite passes **384 tests across 14 files**, including API/form ownership, strict preference behavior, inferred-versus-evidence controls, LTE context/revision races, metadata refresh and explanation controls. The signed LTE endpoint/qualification subset passes **17 tests**. The disposable PostgreSQL runner tests all new application migrations plus LTE summary selection/projection; the LTE selector fixture stubs its existing qualification engine and is not a full LTE database restoration. Application production and both service bundles passed with existing warnings. The final type and build evidence is recorded at completion rather than treating earlier snapshots as a clean repository type check.

[Local evaluation](./LOCAL_RELEVANCE_EVALUATION.json) compares semantic-only ordering with the shared policy on six synthetic agent-authored diagnostic scenarios. It is not a blinded human-labelled holdout and does not calibrate thresholds, prove production relevance, or measure HTTP/provider latency. Release acceptance remains false.

The remote read-only migration ledger was rechecked and still ends at `20270120000000`; this does not identify it as the previously verified development deployment. The user was asked for the development site/project identity. The checked-in default is production and the writable connector is localhost, so neither was substituted for that missing target. No application database was changed and nothing was deployed. Live target reconciliation, backup/restore/exact dry-run, signed-in acceptance, independent holdout quality evaluation, real operational budgets and rollback rehearsal remain open.

Final continuation verification: frontend baseline/current diagnostics **7,976 / 7,971**, backend **6,912 / 6,912**, with **no introduced diagnostics** in either comparison. These remain baseline comparisons rather than clean repository type checks. The complete application regression suite passes 384 tests; application production build and both local Pages Functions bundles pass. Both code graphs were refreshed, local Markdown links resolve and diff whitespace checks pass. LTE's existing formatting/import check passed on the three changed TypeScript files.

## 29 October audit corrections: concurrent preferences and unrelated candidates

Both confirmed follow-up findings are corrected locally. A clean preference form adopts refreshed server values; an edited draft is preserved but blocked when its saved revision changes. A 409 requires explicit reload. Detached saves cannot repopulate an account cache after unmount. The [forward migration](../../../supabase/migrations/20270127000000_career_preferences_concurrency.sql) adds a changing UUID token, serializes first creation and updates against the owned learner, rejects stale tokens, and removes the unguarded v1 writer and direct service-role writes. The API and client require the expected token. This preserves another session's learning opt-out even when a stale session edits unrelated preferences.

The shared ranker now requires skill/evaluated-learning evidence, positive semantic retrieval, or explicit/opted-in role intent before generic preferences may affect ordering. Sole location, employment, work-mode and department matches cannot admit unrelated candidates. Ranking identity is `semantic-ranking-6-career-relevance`; shared ordering is `evidence-order-2`. Text preprocessing and readiness identities remain unchanged.

Regression checks reproduced the original failures before the fixes. The complete application suite now passes **398 tests across 14 files**. Disposable PostgreSQL checks pass, including stale first-create/update rejection, token advancement, opt-out preservation and absence of an unguarded writer. The [synthetic diagnostic report](./LOCAL_RELEVANCE_EVALUATION.json) now contains seven scenarios, including an unrelated job in the preferred city. No-relevant-item scenarios have a separate no-match metric rather than an artificial nDCG success. These remain agent-authored diagnostics, with `releaseAcceptance=false`. Live deployment and independent acceptance gates remain open in the [release checklist](./RELEASE_CHECKLIST.md).

The production application build and local Pages Functions bundle pass after these corrections, with existing warnings. Local Markdown links and the CRLF-aware diff check pass. No application database or deployment was changed.

Final comparison after the corrections: frontend **7,976 baseline / 7,971 current**, backend **6,912 / 6,912**, with no introduced diagnostics. Whole-repository type checks retain existing errors. The application AST knowledge graph was refreshed successfully.

## Full local verification requested before rollout

The [local test report](./LOCAL_TEST_REPORT.md) records a fresh full application/LTE test run, isolated recommendation run, database assertions, Chrome fixture checks, builds, lint and type checks. Recommendation coverage remains green at 398 tests; LTE passes 1,850 tests with one skipped. The full application suite reports 2,840 passed, 168 failed, four skipped and a worker RPC timeout. All 39 failing files and every current failure heading reproduce against committed source, as does the timeout. Application lint is also not clean; LTE lint and frontend type checks pass. No application code, database or deployment was changed by this validation.

## Specificity and evaluated-learning consent corrections

The two confirmed follow-up ranking defects are fixed locally. The [shared ranker](../../../functions/lib/recommendation-ranking.ts) separates general skill overlap from specialist requirements: “Communication” cannot by itself establish relevance to a job requiring Cardiology. General-skill-only roles remain discoverable, and genuine domain matches retain priority. The canonical reader supplies only approved, visible soft-skill names; a bounded list of common general skills covers older rows lacking a type. This is an explicit policy, not an exhaustive skill ontology or a calibrated semantic threshold. Truthful general-skill overlap remains available in explanations for otherwise relevant jobs.

Confirmed-learning features now require `useVerifiedLearning=true` for both admission and ordering. The original per-job application eligibility object remains attached and application-time verification is unchanged. Opt-out does not grant eligibility or bypass an employer requirement.

Fifteen added cases cover the failures and positive controls, including owned soft-skill metadata, general-skill-only roles, genuine specialist support, default/explicit opt-out, retained eligibility and opt-in ordering. Twelve failed before production changes; after the fixes all 77 focused tests and all **413 recommendation tests across 14 files** pass. The application production build and local API bundle pass with existing warnings.

Ranking identity is `semantic-ranking-7-specificity-consent`; shared ordering is `evidence-order-3`. This invalidates prior matching order without changing learner text preprocessing. No additional SQL migration is required. The [synthetic report](./LOCAL_RELEVANCE_EVALUATION.json) now contains twelve diagnostic scenarios; independent release acceptance remains false.

Final specificity/consent verification: frontend 7,976 → 7,971; backend 6,912 → 6,912; no introduced diagnostics. Existing repository type errors remain. The application knowledge graph was refreshed, local documentation links resolve and the CRLF-aware diff check passes.

## Additional career context enabled by default

At the user's request, both assessment suggestions and evaluated LTE learning now default to enabled when no value has been saved. Explicit stored false values are preserved in API reads, context collection, form rendering and unrelated saves. Existing opt-outs are not overwritten or backfilled. Fixtures for evidence-only tests now declare their saved opt-outs; a separate no-preferences case checks that both default sources are read. UI and API controls verify the checked defaults and saved opt-outs.

Preprocessing is `learner-text-7-default-career-context`, ranking identity is `semantic-ranking-8-context-defaults`, shared ordering is `evidence-order-4`. The version changes prevent reuse of results collected under the previous defaults. No SQL migration or user-record update is needed.

Default-setting verification: all 416 recommendation tests across 14 files pass; application production and local API bundle builds pass with existing warnings. Evidence-outage fixtures explicitly disable external sources and assert the intended failing table is reached, preventing an LTE fixture configuration error from masking the failure under test. No user records were changed. Full repository type/lint checks were not rerun for this boolean-default/version change; earlier baseline results remain historical.
