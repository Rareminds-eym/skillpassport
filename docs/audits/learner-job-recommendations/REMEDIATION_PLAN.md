# AI Job Recommendations: Complete Remediation Plan

Prepared: 28 October 2026  
Status: local implementation now includes preferences, source refresh, opt-in assessment/LTE context and shared ranking. Live acceptance, independent relevance evaluation and rollout remain pending.  
Primary application: `skillpassport/`  
Reviewed source baseline: `bf346e09da08de15c00f03b98fb7ecdb6793d8b2` on `dev`.  
Scope: recommendation correctness, meaningful personalization, source coverage, frontend state, evidence, quality evaluation and development rollout.

Execution update (28 October 2026): the [baseline, implementation and source/caller inventory](PERSONALIZATION_BASELINE.md) records 350 passing checks without expected-failure markers. Both recommendation surfaces now enforce structured readiness before cache/vector/index work, read approved visible normalized education/experience, and emit runtime-validated result/profile-needed envelopes. Source selection/privacy, exact dashboard skill matching, deterministic category budgets, acknowledged-save suppression and final response revision fences are implemented locally. Preprocessing is `learner-text-5-evidence-budgets`. Follow-up fixes reject placeholder experience, normalize generic degree aliases and legacy experience budgeting, and preserve dashboard profile guidance across catalogue states; readiness policy is `career-readiness-4`. The new context-revision migration passed isolated synthetic PostgreSQL tests and the app build passed; no application database was migrated and no deployment was performed. Apply the context migration before backend deployment. First reconcile the connected database's jobs-only migration/function discrepancy and its project identity. Additional audit fixes normalize legacy education before budgeting, exclude placeholder skills and bound each selected skill, and recognize generic technology/engineering degree aliases. The semantic hook now consumes complete validated envelopes, preserving no-match metadata and successful profile guidance; legacy array callers retain an adapter. Both recommendation hooks now use shared QueryClient envelope ownership, scoped actor/org/learner keys, cancellation, deduplicated regeneration and provider-lifetime saved-profile cache resets. Follow-up Query corrections preserve Retry-After across automatic requests/cache resets, suppress cards after access denial, and keep shared regeneration alive while another matching observer remains. Bounded preparation polling is implemented locally: verified incremental index progress emits 202, polling respects Retry-After and stops after five pending responses/two minutes, with ordinary reads after a forced first request. Stalled repair remains unavailable. Whole-field declarations of having no work experience are now rejected in both experience fields, while substantive descriptions remain valid. Complete producer integration and signed-in rollout remain pending. These slices do not close the full context, query, ranking, producer or rollout packages.


Execution update (29 October 2026): [release evidence and remaining gates](RELEASE_CHECKLIST.md) records owned career preference persistence/API/UI, required preference and application/dismissal filtering before candidate limits, source/catalogue revision refresh, bounded opt-in assessment/LTE evidence, external learning dependency invalidation and shared source-labelled ranking/explanations. The expanded application suite passes 384 cases; the LTE signed endpoint subset passes 17. A synthetic evaluation runner/report exists but does not replace a blinded human-labelled holdout or operational measurements. New migrations are local only. Development target identity, ledger reconciliation, backup/restore/dry-run, signed-in acceptance and rollout/rollback rehearsal remain open. Preprocessing is now `learner-text-6-verified-learning`; ranking identity is `semantic-ranking-5-evidence-preferences`.

This document is the current follow-up plan for personalization quality. It preserves the historical [learner recommendation remediation plan](../../../../LEARNER_JOB_RECOMMENDATION_FIX_PLAN.md), whose ownership and lifecycle work must not be treated as newly missing. Statements about prior development deployments describe verification earlier in this session; implementation must recheck live revisions and configuration before rollout.

## 1. Intended outcome

A learner receives job recommendations only when there is meaningful career context. Every recommendation has an honest explanation, current supporting evidence and a separate eligibility assessment. Incomplete profiles receive useful next actions, rather than arbitrary job cards or a retryable service error.

Use the existing TanStack Query client for recommendation server state. Retain existing Zustand authentication/profile integrations; add shared recommendation UI state only when a concrete cross-component need exists. Keep authoritative context, readiness, ownership, entitlements, ranking and cache validity on the server.

For the development account investigated, the embedding input contained only a profile heading, a name and a country, totaling 54 characters. The expected new behavior is `needs_profile`, without generating or reusing a personalized vector. Ordinary job browsing and applications remain available subject to their existing rules.

## 2. Verified baseline and false-positive review

### 2.1 Existing controls to preserve

| Area | Verified current behavior | Consequence for implementation |
|---|---|---|
| Ownership | Career matching resolves the authenticated user's learner and checks the requested learner. SSO user IDs and learner IDs are distinct contracts. | Preserve actor/learner checks on every request and RPC. Never substitute one identifier namespace for another. |
| Matching entitlement | The career route checks `ai_job_matching`. | Do not create an alternate paid-feature bypass through a new context/readiness endpoint. |
| Jobs-only scope | The deployed jobs-only migration excludes `factory_visit` in indexing, publication, readiness and ranking. API hydration and dashboard recommendations also filter visits. | Retain this rule. Do not repeat the migration or delete visits/their stored vectors. |
| Development index | Earlier live verification confirmed 634 eligible jobs and 634 verified vectors after visit exclusion. | Recheck readiness at rollout. Learner-context changes alone do not require rebuilding all job vectors. |
| Source freshness | Recommendation state already tracks input/catalogue revisions, expiry, model, preprocessing and ranking versions. Publication checks reject obsolete work. | Extend these contracts for additional sources instead of creating another independent cache. |
| Evidence already included | Available approved skills, projects, certificates, training and completed courses contribute to the main learner text. | Repair selection/coverage and reuse these sources; do not report that all evidence wiring is absent. |
| Learning verification | `learningDecisions` evaluates structured learning requirements after ranking; applications perform authoritative verification. | Integrate learning achievements into relevance without replacing existing human/AI evaluation policy or application proof checks. |
| Frontend lifecycle | Existing hook tests cover late responses, account changes, disablement and saved-profile events. | TanStack migration must preserve these behaviors. The current hook is not wholly unprotected. |
| Logout and org refresh | `src/App.tsx` clears QueryClient state when unauthenticated and invalidates on SSO `REFRESH`. | Preserve this integration. Test rapid account/org transitions; do not add a duplicate logout system. |
| Query/Store libraries | TanStack Query `5.90.3` and Zustand `5.0.8` are already declared; QueryProvider and a key factory exist. | No dependency replacement or application-wide state rewrite is required. |
| Score presentation | The API exposes a similarity-derived percentage; the current sidebar does not display it and includes a hiring disclaimer. | Do not claim the sidebar currently shows a hiring probability. Preserve truthful labels while improving explanation data. |

### 2.2 Confirmed gaps and newly identified omissions

The table records the original audited findings. Current local implementation status and remaining exit gates are tracked in the execution update and linked baseline report; a corrected finding is not a claim of completed deployment.

| ID | Finding | Evidence and scope | Required correction |
|---|---|---|---|
| G01 | Character count is used as readiness. | `textBuilder.ts` accepts learner text at 50 characters; boilerplate/name/country can pass. | Evaluate meaningful structured signals, independent of text length. |
| G02 | Cached vectors/results can bypass a builder-only readiness fix. | `recommend.ts` reads state and can serve cached results before rebuilding text. | Evaluate current readiness before vector/cache use, including already cached weak profiles. |
| G03 | Normalized education and experience are omitted from the main matching context. | Other profile/career code reads `education` and `experience`; the embedding builder reads legacy learner columns and five other evidence queries instead. | Include valid normalized records with provenance; deduplicate legacy representations. Extend revision coverage to these tables. |
| G04 | Completed-course coverage can be truncated incorrectly. | The query limits a mixture of completed/in-progress/active enrollments before the builder filters completed records. | Filter the intended statuses before limiting. Keep ongoing learning distinct from completed achievements. |
| G05 | Hidden training can contribute to context. | Development metadata confirms `trainings.enabled` exists; the training query filters approval but not visibility. The column is defined by the approval-tracking migration. | Respect the established visibility contract, including tested legacy NULL semantics. Do not treat ongoing training as a completed qualification. |
| G06 | Demographic and identity text can supply apparent career relevance. | Name, age and gender are appended; raw professional links can also be appended. | Remove them from semantic text. Use appropriate structured location/qualification facts only where relevant. Email/phone are selected by the current query but are not appended; do not falsely report that they are currently embedded. |
| G07 | Career preference storage is incomplete. | Read-only development metadata found no `learners.preferred_*` or `learners.experience_level` columns referenced by dashboard rules. | Add an explicit, owned, typed preference persistence contract; do not merely wire nonexistent fields into the main ranker. |
| G08 | Recommendation surfaces use different engines. | Sidebar/My Skills use the semantic career endpoint; dashboard uses a rules endpoint with skill, preference, experience and recency branches. | Share context/readiness/eligibility and move both AI-labelled surfaces to a common versioned ranking policy through compatibility adapters. |
| G09 | Main ranking lacks explicit job-fit features and a calibrated relevance cutoff. | The main SQL orders positive cosine similarity; it does not independently score skill, seniority or preference fit. | Add evidence-based reranking and evaluate a relevance threshold. Dashboard preference/experience rules already exist in code, so this finding is not universal to every endpoint. |
| G10 | Assessment and LTE achievements are not explicit inputs to the main embedding builder. | The builder does not load an assessment recommendation summary or LTE qualification snapshot. | Integrate only final, permitted, career-relevant assessment signals and authoritative learning achievements. Do not infer verified skills from personality/assessment labels. |
| G11 | Response shape loses non-result state. | Matching service returns an array and hook derives cache metadata from its first item; non-embedding states are rejected. | Preserve a typed envelope for readiness, empty results, processing and provenance. |
| G12 | Incomplete context becomes an outage-like error. | Embedding preparation failures map to a generic 503; the widget offers retry. | Give missing context an actionable normal state; reserve errors for actual failures. |
| G13 | Recommendation fetching is manually managed. | Both recommendation hooks use component state/effects and independent lifecycle logic. | Migrate recommendation server state to the existing QueryClient without weakening tested identity/race protections. |
| G14 | Existing age/name-based vectors need a controlled transition. | A fixed builder does not make an existing stored vector represent the new input contract. | Bump preprocessing identity and prevent reuse until current readiness/context is checked. |

These findings establish code/schema gaps. They do not establish how many real users have affected hidden training, missed courses or normalized experience. Measure those counts read-only before any backfill. No labelled relevance dataset has yet established that the current ranking is high quality.

### 2.3 Claims explicitly rejected or qualified

- Requiring work experience, certificates, a resume, three skills or every profile field would incorrectly exclude freshers. None is a universal readiness requirement.
- A missing user preference is not a negative preference. Missing qualifications are not proof that a requirement is met or failed.
- A short legitimate skill/qualification can be useful; a long generic biography is not automatically sufficient.
- `trainings.enabled` is present in the current schema and a later migration even though it is absent from the initial schema snapshot. Audit the migration chain and live schema, not just the base SQL.
- Fetching active courses does not currently mean active courses are embedded as completed; the actual defect is the status filter occurring after the result limit.
- Cache invalidation, logout clearing, ownership, vector provenance and learning eligibility are existing controls, not new discoveries to rebuild.
- Changing embedding task types, adding an LLM reranker or choosing fixed ranking weights is not a verified fix. Evaluate such changes before adopting them.
- Do not expose arbitrary similarity percentages as calibrated qualification coverage or hiring probability. Current sidebar behavior is already more restrained.

## 3. Scope, invariants and architecture

The canonical flow is:

```text
Authenticated request + resolved learner/org scope
  -> owned, versioned career-context snapshot
  -> readiness and source-health decision
  -> existing current-vector/cache validation
  -> job-only verified candidate retrieval
  -> structured reranking + evidence explanations
  -> current learning/mandatory-condition assessment
  -> runtime-validated result envelope
  -> TanStack Query -> recommendation widgets
```

Invariants:

1. Server readiness cannot be overridden by client profile fields, query parameters or Zustand state.
2. Authorize actor, learner, tenant scope and feature access before returning context or results.
3. Check readiness before the global job-index gate, so an empty profile is not misreported as an index outage.
4. No personalized vector, cached cards or claimed fit for a `needs_profile` account.
5. Visits, closed/inactive/expired jobs and dismissed jobs stay excluded before ranking limits. Exclude already-applied jobs from new-job suggestions, preserving application history separately.
6. Unknown evidence stays unknown. Existing approval, visibility, expiry, equivalency and human/AI learning policies remain authoritative.
7. Every feature and explanation has a source and a freshness identity.
8. Client cancellation does not prove that provider work stopped. Server publication guards and generation ownership remain necessary.
9. Empty, incomplete, low-relevance, processing, access-denied and unavailable states remain distinguishable.

Keep all ordinary browsing, visit-specific workflows and application enforcement intact. This is not an SSO replacement, global profile-store migration or new recommendation microservice.

## 4. Canonical context and source contracts

Implement one server-side context builder used by both recommendation surfaces. Reuse existing schemas and query gateways where suitable. The contract must be runtime validated and safe to share between browser/server code without importing UI or server credentials.

Recommended context categories:

| Category | Source policy | Matching use |
|---|---|---|
| Education | Valid normalized `education` records plus compatible legacy fields; apply the actual source's approval/visibility rules. | Qualification, field and fresher relevance; no institution-prestige score. |
| Experience | Valid normalized `experience` records plus nonduplicated legacy experience. Preserve self-reported versus verified status. | Role/domain/seniority features; compute durations with overlap and current-role handling. |
| Skills | Enabled approved skills, plus appropriately attributed skills from accepted projects/courses. | Canonical skill overlap and evidence strength. |
| Projects | Visible approved projects, role, technologies and relevant description. | Demonstrated domain/technical context, not automatically employment experience. |
| Certificates | Visible approved unexpired records and relevant credential facts. | Verified qualification signals with explicit expiry semantics. |
| Training | Approved, visible records; preserve ongoing/completed distinction and existing NULL visibility semantics. | Exposure versus completed achievement. |
| Courses | Select completed enrollments before limiting for completed-achievement context. | Completion and acquired skills; do not silently claim mastery from enrollment. |
| Assessment | Current final results that the learner is permitted to use; selected career/role/skill summaries only. | Inferred career intent, labelled as such; not qualification proof. |
| LTE/equivalencies | Existing authoritative policy, approved level fingerprints, current review/evaluation evidence and valid equivalencies. | Learning relevance and requirement explanations. |
| Preferences | Explicit saved target roles, job types, work modes, locations, relocation choice and strict/soft preference intent. | Structured selection and preferences; no assumed values from country alone. |

Implementation requirements:

- Inventory actual producers, schema fields, states and ownership before introducing migrations. Extend existing storage if it has an appropriate contract; the audited missing career preferences require a real persistence path.
- Use a learner-owned preference record with validated structured fields and an authenticated mutation endpoint. Do not store authoritative preferences only in localStorage/Zustand. No duplicate sensitive profile database.
- Normalize arrays/JSON strings, field aliases, whitespace, skills and dates; remove placeholders and duplicate evidence. Version any alias/taxonomy mapping.
- Avoid substring skill matches such as Java matching JavaScript. Preserve unknown aliases rather than fabricating equivalence.
- Keep original source references server-side. Return only the evidence metadata needed for explanations; no raw private submissions or review payloads.
- Allocate text budgets across categories so long biographies/credentials do not truncate all skills or completed learning. Use stable ordering and test deterministic output.
- Read context consistently: use a scoped snapshot RPC or bracket reads with revision validation. If a source changes during collection, do not publish the mixed snapshot.
- Use explicit source states: absent, available, permission-restricted and temporarily unavailable. An unavailable source must not be silently converted into an empty profile.
- Use bounded authoritative LTE summaries/subsets with revision metadata. Do not download the whole catalogue on each request or silently exceed existing payload/level limits. Add a bounded summary contract only if the current endpoint cannot provide it safely.
- Preserve `LTE_INTERNAL_SECRET` as the existing internal signing key. Do not reintroduce the retired catalogue secret.

## 5. Readiness policy

Readiness is separate from application profile-completion percentage. Persist/version the policy definition in code and test it independently of embedding length.

| State | Decision | UI and computation |
|---|---|---|
| `needs_profile` | No usable career signal; identity, country, headings, generic filler and raw links do not count. | No embedding or personalized cards. Explain useful next inputs and link directly to the relevant editor. |
| `limited_context` | Only broad career interest/target-role intent or otherwise insufficient evidence supports exploration. | Show a profile prompt. An explicitly selected exploration mode may show role-oriented suggestions labelled as limited-context exploration, never as verified personal fit. |
| `ready` | At least one substantive, validated job-relevant source category supports matching, such as a specific study field, usable skills, a described project, experience or learning achievement. | Allow matching and report actual coverage. One signal can qualify a fresher; it does not justify claims about missing experience or skills. |

The implementation must provide concrete fixtures for ambiguous inputs before coding the rule: bare role labels, arbitrary text, a legitimate single skill, a specific degree/field, an approved project without work experience, ongoing training, and unsupported assessment claims. Use source semantics and usefulness, not an invented universal field count.

Run readiness for every request against current context metadata, including stored-vector and cache paths. A revision-valid cached readiness summary may be reused only when its policy, source coverage, ownership, expiry and all dependency revisions remain current. A stale summary is not evidence of readiness.

Suggested profile actions are specific and bounded: add a skill, choose a career interest, add education/experience, finish an existing draft or review pending evidence. Do not ask the learner to repeatedly resubmit already available data.

## 6. API and compatibility contract

Return one typed envelope, rather than attaching state only to the first recommendation. Extend the existing `apiSuccess`/`apiError` conventions instead of rewriting unrelated APIs.

| Response | Meaning | Retry behavior |
|---|---|---|
| HTTP 200, `needs_profile` | Insufficient meaningful context. | No automatic retry; refetch after a relevant acknowledged save. |
| HTTP 200, `limited_context` | Exploration is possible, personal-fit evidence is limited. | No retry loop; guide the learner or accept explicit exploration mode. |
| HTTP 200, `ready` | Current ranked results with provenance. | Ordinary freshness rules. |
| HTTP 200, `no_matches` | Valid context but no suitable result above the evaluated relevance rule. | Explain unmet/unknown coverage; do not invent matches. |
| HTTP 202, `processing` or `index_building` | Bounded recoverable work is actually underway. | Honor `Retry-After` with a bounded polling/deadline policy. |
| HTTP 401/403 | Authentication, ownership or matching entitlement denied. | No blind retry; use existing auth/feature handling. |
| HTTP 409 | Source/ownership context changed during work. | One controlled restart for the new revision; avoid an unbounded loop. |
| HTTP 429 | Matching/provider rate budget reached. | Respect `Retry-After`; disable repeated manual requests during the wait. |
| HTTP 5xx | A real dependency or server failure. | Bounded classified retry; retain a useful unavailable state. |

Envelope fields should include `schemaVersion`, `state`, `readiness`, `suggestedActions`, `recommendations`, context/catalogue revisions, coverage/uncertainty, model/preprocessing/ranking/eligibility versions, computation time and cache metadata. Readiness states use truthful provenance such as `none`; they must not pretend an embedding was generated.

Each recommendation carries authoritative current job fields, structured evidence-backed reasons, eligibility states and any calibrated internal scores. Do not return a hiring probability. The server bounds result counts and validates request options.

Compatibility work is required for the current array-returning matching service, the dashboard DTO and both hooks. Introduce additive/versioned contracts and adapters. During rollout, legacy callers with insufficient context must receive a meaningful `PROFILE_CONTEXT_REQUIRED` response, never an unsafe vector-backed result just because they use the old contract. Ship the minimal profile-needed UI in the same release as the guard. Preserve ready-result compatibility while callers migrate; remove temporary adapters only after all callers are covered.

## 7. Retrieval, reranking and eligibility

Use the current verified job embeddings as candidate retrieval input. Keep the existing model/source-hash checks. Retrieve a bounded candidate set large enough for reranking, with the cap selected from measured latency/recall; do not arbitrarily increase every request to an unbounded catalogue scan.

Reranking features should be independently inspectable:

1. Semantic relevance from career-relevant text.
2. Canonical skill overlap, mandatory versus optional skills and supporting evidence.
3. Role/domain alignment and experience/seniority compatibility.
4. Education/credential compatibility where actual requirements are available.
5. Explicit employment, location, relocation and work-mode preferences.
6. Current learning achievements and policy-specific requirement coverage.
7. Freshness and diversity as controlled secondary factors, not replacements for fit.

Missing features must not automatically become zero-fit penalties or positive matches. Return feature coverage and evaluate separate sensible handling for sparse profiles. Dates must not double-count overlapping experience. Projects, ongoing courses and role interests must not be promoted to verified employment/qualifications.

Evaluate weights and a relevance cutoff against labelled examples. A positive cosine value alone is insufficient. It is acceptable to return fewer than three results. Do not train a new model or add an LLM reranker before showing that deterministic features and the existing embedding model are insufficient.

Eligibility remains separate from relevance. Preserve current authoritative learning/application checks and content fingerprints. For explicit mandatory conditions return met, unmet or unknown with a reason. Only reliably assessable non-negotiable constraints justify hard exclusions. Do not parse a vague description into an unverified hard rejection. Keep the existing ready-to-apply versus requirements-to-meet distinction for learning.

Use deterministic explanations derived from computed features, for example a named matching skill, an explicit job-type preference or an unmet mandatory learning level. Associate every positive claim with evidence. Explanations must describe what contributed, not merely say the system ranked the profile.

The sidebar/My Skills and dashboard should share this context/readiness/policy service. Keep transport adapters for existing callers during migration. Do not copy the dashboard's old arbitrary weights into the semantic ranker and declare that calibrated quality.

## 8. TanStack Query design

### Ownership and keys

Use the existing `QueryProvider` and key factory. Add a recommendation key namespace with an actor-scoped prefix, including authenticated user ID, canonical learner ID, relevant organization/policy scope, normalized request options and client contract version. Never use email alone, a JWT or the entire raw profile as a cache key.

Keep server-reported input/catalogue revisions in response metadata. Do not make a query repeatedly change its own key from a revision it just fetched. Use a known authoritative revision in a key only when its producer lifecycle is explicit and tested.

TanStack Query owns response envelopes, readiness, results, freshness, request/error state and regeneration mutation state. Do not copy these into another Zustand cache.

### Fetching and freshness

- Refactor both recommendation hooks onto a common query/service contract with narrow adapters for existing consumers.
- Gate requests on resolved authentication, feature access, enabled/visible state and a consistent owned learner identity. The server remains the authority.
- Pass the query's `AbortSignal` through the service into `ssoClient.fetch`. That wrapper already accepts `RequestInit`; verify the auth-client transport actually honors the signal across session refresh without cancelling shared authentication work for other callers.
- Preserve and extend existing out-of-order/account-switch tests. Cancellation is an optimization, not the sole isolation guarantee.
- Use explicit recommendation options. An initial proposal is a 30-second stale window and five-minute inactive garbage-collection window, subject to measurement. These are operational starting settings, not correctness guarantees.
- Override `refetchOnMount` for this feature. Global configuration currently sets it to `false`, which also suppresses stale mount refetches; its comment is not the API contract. Consider stale-on-focus/reconnect validation for cross-tab changes, without forcing regeneration on every focus.
- Do not keep previous-user, previous-org or invalidated-context data as placeholder recommendations. Suppress invalidated cards while a relevant save/review reversal is being acknowledged/rechecked.
- Configure retry by state/status. Profile-needed states are successful data; auth/access failures do not loop. Respect 429 and bounded 202 polling. Do not trigger repeated provider calls through automatic retries.

TanStack supplies cancellation signals and targeted invalidation; actual cancellation depends on consuming the signal, and invalidation does not itself erase old cached data. Design the render contract accordingly. See [query cancellation](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation) and [query invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation).

### Mutations and identity transitions

Use a dedicated regeneration mutation with duplicate-click suppression, no automatic mutation retries, and a revision check before installing its response into the matching query. Profile/preference/evidence mutations update the authoritative source, then invalidate/reset the exact actor/learner queries after acknowledged success, even if a subsequent profile refetch fails.

Replace recommendation-specific window-event plumbing only after all relevant producers call the scoped invalidation bridge. Keep a temporary compatibility bridge for current editors and remove it with coverage evidence. Include My Skills, dashboard, settings, resume-import confirmation, approval/revocation events and application/dismissal actions.

Preserve `App.tsx` logout clearing and existing organization-refresh behavior. Verify logout, rapid user A -> user B transitions while authenticated state stays true, organization switches, cancelled requests and late mutation responses. Clear or isolate only the feature's departing scope where additional cleanup is necessary; do not add redundant global invalidation handlers for every widget.

## 9. Zustand decision

No new recommendation store is required by default. Reuse the existing authentication store and current learner-store integration for identity/display needs without treating client profile data as authoritative matching input.

If multiple components genuinely need shared UI preferences, add a small user-scoped slice for dismissal/expansion/exploration selection. A single-widget dismissal can remain local state. Persist only selected non-sensitive UI fields, with a versioned and validated storage shape. Never persist recommendation results, evidence snapshots, readiness truth, provider responses, request promises or auth tokens in a new store.

Reset/isolate UI preferences on account change. Keep unsaved profile drafts local to their editor unless there is a demonstrated multi-component requirement. Do not migrate the whole existing learner/assessment store as part of this repair.

Zustand supports selective persistence through `partialize`, but persisted data still needs an appropriate schema/version policy: [persist documentation](https://zustand.docs.pmnd.rs/reference/middlewares/persist).

## 10. Server freshness, generation and operating cost

Extend the existing state tables/RPCs rather than introducing a second vector store. Recommended identity components are:

```text
context identity = owned learner + app evidence revision + normalized education/experience
                   + preference revision + permitted assessment revision
                   + authoritative LTE/equivalency revision + readiness policy

vector identity  = context identity + model + preprocessing/task contract

match identity   = vector identity + current job catalogue revision
                   + ranking/eligibility policy + tenant scope + request options
```

Use a canonical stable hash/revision representation, not serialization of an unordered client object. Keep DB-owned compare-and-swap publication checks and time-based expiry. Extend revision triggers/events to newly consumed education, experience, preferences and assessment sources; integrate LTE content/approval revisions and source freshness without depending exclusively on a browser event.

A policy change that makes a profile not ready must suppress existing cards immediately on the next authoritative check. A revoked/hidden/expired signal must not remain a positive explanation while a background query refreshes.

Add generation coordination only where needed to prevent duplicate work across tabs/Workers. Use a short database-owned lease keyed to the exact vector identity, a unique ownership token, expiry and safe release. A late worker cannot publish after its context changes or release a newer owner's lease. Polling must be bounded and observable. Client query deduplication does not provide this server-wide guarantee.

Set provider timeouts, retry budgets and per-actor quotas from measured behavior. Record cache hit, context-building time, embedding calls, lease contention and end-to-end latency. A transient optional-source failure may use a previous snapshot only if an explicit freshness/authorization policy proves it safe and the output discloses degraded coverage. Otherwise return unavailable; never silently pretend the source is empty.

Changing learner inputs/readiness requires a new preprocessing identity and lazy regeneration of affected ready learners, not an automatic full-job-index rebuild. Changing job text, embedding model or a materially different retrieval task contract requires its own evaluated job-vector transition and readiness plan. No new recurring task or production backfill is created by this planning document.

## 11. Implementation map

Paths below are relative to `skillpassport/`. New paths are proposed modules, not claims that files already exist.

| Area | Existing entry points | Planned responsibility |
|---|---|---|
| Shared contract | Existing matching/dashboard DTOs | Add a browser/server-safe runtime schema, preferably `shared/contracts/job-recommendations.ts`, with versioned state unions. |
| Context and readiness | `functions/api/embedding/services/textBuilder.ts` | Extract reusable `functions/lib/recommendation-context.ts` and `recommendation-readiness.ts`; keep a single context builder/text representation. |
| Ranking service | `functions/api/career/handlers/recommend.ts`, dashboard AI endpoint | Add a shared ranking/eligibility/explanation service; preserve auth wrappers and ready-result adapters. |
| SQL | Existing recommendation state, verified matching and jobs-only migrations | Add forward-only migrations for confirmed missing preference/context/revision/lease needs. Never edit applied migration history. |
| Context producers | Profile actions, education/experience/evidence mutations, assessment completion | Return/propagate acknowledged revisions and scoped invalidation signals; retain existing producer behavior outside the feature. |
| LTE integration | `functions/lib/learning-eligibility.ts`; LTE qualification service | Reuse signed authority/policy; add a bounded revision-aware summary only if required. |
| Query layer | `src/features/opportunities/model/useAIJobMatching.ts`, `useLearnerAIRecommendations.ts`, matching services | Typed response queries, regeneration mutation, cancellation and compatibility adapters. |
| Query keys | `src/shared/lib/queryKeys/learner.ts`, existing QueryProvider | Actor/learner/org-scoped feature keys and per-feature defaults. |
| UI | `RecommendedJobs.jsx`, Dashboard, My Skills and profile editors | State-specific cards/prompts, evidence reasons, useful links and save/refetch transitions. |
| UI store | Existing auth/learner stores | Reuse identity; optional narrow shared UI slice only after a demonstrated need. |

## 12. Work packages and dependency order

The packages below retain their complete acceptance gates. The 29 October execution update and release checklist distinguish implemented local features from outstanding live and quality acceptance; local tests alone do not satisfy every package exit gate. Do not mark packages done from historical tests or assume the jobs-only deployment applies to an unverified database target.

| Package | Deliverable | Dependencies | Exit gate |
|---|---|---|---|
| WP00 | Baseline/source inventory and independent regression fixtures | None | Reproduce G01-G14 where applicable; distinguish schema evidence, user-specific data and quality hypotheses. Inventory all callers/producers and current migration history. |
| WP01 | Shared response/context schemas and readiness policy | WP00 | Contract fixtures cover incomplete, sparse, fresher, unavailable and ready cases; compatibility behavior is specified. |
| WP02 | Canonical source reader and normalization | WP01 | Normalized education/experience, course limit ordering, training visibility, safe text selection and deterministic budgets are tested. |
| WP03 | Saved career preferences and profile actions | WP00-WP02 | Real persistence/API/UI exists for missing fields, with ownership, scoped reads and mutation invalidation. No phantom `learners.preferred_*` dependency. |
| WP04 | Readiness enforcement and minimum actionable UI | WP01-WP03 | Guard precedes all cache/vector paths; current sparse account shows the correct prompt; legacy callers never receive false personalized cards. |
| WP05 | Versioned freshness and generation coordination | WP02-WP04 | Added source revisions, expiry and policy changes invalidate safely; old weak vectors cannot be reused; concurrent generation/publication tests pass. |
| WP06 | TanStack Query migration and producer bridge | WP01, WP04-WP05 | Both hooks preserve typed metadata; existing lifecycle tests pass; all acknowledged saves and review changes refresh the correct scope. |
| WP07 | Minimal UI-state integration | WP06 | Zustand/local state decision documented; no duplicate server cache; dismissal and identity transitions verified. |
| WP08 | Curated assessment/LTE context integration | WP02, WP05 | Current, permitted, bounded evidence with revisions; self-reported/inferred/verified facts stay distinct; source outages have explicit behavior. |
| WP09 | Shared candidate reranking and explanations | WP02-WP05, WP08 | Deterministic features and source-backed reasons work across sidebar, My Skills and dashboard; relevance rule is evaluated. |
| WP10 | Offline relevance evaluation and operational budgets | WP00; evaluate WP09 | Labelled holdout comparisons and persona-level regressions are recorded; thresholds/weights justified; latency/provider budgets measured. |
| WP11 | Development migration/rollout and signed-in validation | All release-relevant packages | Backup, restore validation, exact dry-run, deployment provenance and end-to-end scenarios pass. |
| WP12 | Broader release and rollback rehearsal | WP10-WP11 | Concrete release artifacts reviewed; rollback preserves truthful readiness; no unreviewed production changes. |

Ship reviewable slices, but do not call a state-management-only refactor or a readiness prompt alone complete remediation. The full acceptance matrix governs closure.

## 13. Required validation and false-positive controls

### Data and readiness

- Name/country only, boilerplate, very long generic filler and raw URLs produce no personalized vector/cards.
- A fresher with relevant education or an approved project can qualify without work experience/certificates.
- A legitimate short canonical skill is not rejected solely for character count; sparse coverage is disclosed.
- Normalized education/experience are read even when legacy learner columns are empty; duplicate legacy/new records do not inflate scores.
- More than five mixed enrollments do not hide a relevant completed course; deterministic selection and budgets are verified.
- Hidden, rejected, pending, deleted, revoked and expired evidence follow each source's actual contract. Test legacy NULL visibility explicitly. Ongoing training does not become completed evidence.
- Empty and unavailable source responses exercise different states. Do not permit a readiness summary to be written as complete after a partial read failure.

### API, identity and lifecycle

- Both distinct and coincident learner/user UUID fixtures; foreign actors/learners, organization switches and entitlement loss.
- Pre-existing name-only vector/cache, policy change, evidence revocation, certificate expiry and LTE fingerprint/policy changes.
- Incomplete profiles do not call embedding or ranking, even with a previously valid cache or an unready global index.
- Ready, limited, empty, processing, changed-input, rate-limited and unavailable envelopes survive the API/service/hook/UI chain without becoming a generic empty array.
- Slow old success, slow old failure, disabled/dismissed widgets, StrictMode remounts, account switch without an unauthenticated gap, logout, back navigation and org refresh.
- Query cancellation reaches the transport; cancellation does not abort other users' requests or shared session refresh.
- Acknowledged saves trigger scoped invalidation even if subsequent profile loading fails; rejected saves do not publish unsaved preferences.
- Multiple consumers share eligible queries; different keys/revisions remain isolated. A forced refresh is not overwritten by an older normal fetch.
- Concurrent provider generation, lease expiry, stale lease release and source changes during publication.

### Ranking and explanations

- Industrial visits cannot enter readiness/backlog, publisher, ranker, hydrated cache or either AI-labelled surface. Separate visits/applications still work.
- Full-time, internship, part-time and contract jobs remain eligible where appropriate. Closed, inactive, expired, dismissed and already-applied jobs cannot fill new-job slots.
- Include misleading semantic positives and relevant lower-similarity jobs. Verify exclusions before ranking limits and stable tie handling.
- Java versus JavaScript and other alias/substring traps cannot create unsupported skill explanations.
- Sparse profiles do not get a fake qualification percentage; unknown requirements remain unknown.
- Identical career evidence/preferences with different names, age or gender produces the same career input and ranking, subject to deterministic ties.
- Every positive explanation maps to permitted current evidence. Assessment interests and ongoing learning are not described as verified mastery.
- Learning eligibility remains policy-correct and is still revalidated at application time.

### Evidence quality

Use real implementation paths in integration tests, not mocks that always return the requested learner, ignore query predicates or accept stale publications. Demonstrate old behavior failing the readiness/selection/ranking regressions before asserting the fix. Keep tests for controls already present, rather than deleting them during the TanStack refactor.

Maintain an anonymized labelled corpus with fresher, experienced, nontechnical, technical, career-change, limited-context and no-suitable-job cases. Separate tuning and holdout sets. Measure precision at three, ranking quality where labels support it, severe mismatch rates, explanation correctness and inappropriate confident recommendations. Compare the current ranker, semantic-only baseline and proposed reranker. Select release thresholds from the reviewed dataset; do not invent success metrics or claim statistical calibration from a few screenshots.

## 14. Telemetry and cost controls

Record structured, non-content diagnostics: readiness state/reason, policy/model versions, context coverage, input/catalogue revision identifiers, cache use, source failure classification, generation lease contention, provider calls, candidate/result counts, p50/p95 latency and mismatch/explanation test results.

Do not log raw profile text, names, contact information, private evidence, full job-response payloads or credentials. Keep evaluation data sanitized and private runtime artifacts outside source control. Persist only necessary audit metadata with a defined retention policy.

Track profile-needed rates and completion actions to identify broken data wiring versus genuinely empty profiles. Track no-match and low-coverage rates by career-context class, not demographic targeting. Establish latency/cost budgets from observed baselines before increasing candidate caps, polling or provider concurrency.

## 15. Database changes, deployment and rollback

1. Reconfirm actual development projects and runtime bindings. Historical CLI links and local `.env` files have pointed to other projects; use isolated links and explicit target assertions. The earlier verified development app project was `qidmndjtlbajwswufghf`, with LTE at `yydcuumoerqjfuakhslj`; reverify rather than assuming these remain current.
2. Back up affected definitions/schema and required development data privately. Apply forward-only migrations to an isolated restore and run SQL/ownership/lease tests before remote application.
3. Append migrations after the current repository sequence. Existing migrations use identifiers extending beyond the current calendar date; do not insert a replacement earlier in the chain and have later migrations overwrite it. Never edit applied historical files to make a reset appear correct.
4. Validate missing preferences/revision/lease needs against live schema. Do not add duplicate columns/tables or rerun already applied LTE/visit repairs. Existing human-review and application-proof contracts are preserved.
5. Deliver additive backend contracts and a minimal compatible UI before enforcing new result states broadly. No rollout flag/version may allow a caller to bypass ownership or receive personalized results for a not-ready profile. Keep a meaningful legacy response adapter until all affected clients migrate.
6. Bump preprocessing/readiness/ranking identities as appropriate, preserve job vector provenance and invalidate old personalized matches. Lazily regenerate only ready learners under the new context identity.
7. Deploy to remote development while preserving environment variables, secrets, named service entrypoints, queues, R2 and realtime bindings. Source changes must be committed/reviewable with migrations, tests and exact deployment provenance.
8. Verify signed-in name-only, fresher/ready and insufficient-match journeys. Exercise profile save, fresh generation, cache reuse, source reversal, refresh, dashboard/My Skills consistency, logout and second-account/org transitions. Recheck job-only catalogue counts and eligibility.
9. Only then prepare broader deployment artifacts for the normal release approval process. This document does not authorize a production migration, mass reindex or recurring automation.

Rollback must preserve ownership, entitlements and truthful readiness. Do not roll back to showing the old name-based recommendations. Prefer disabling affected personalized generation while retaining browsing/profile prompts. Keep additive schema compatible with the last safe backend; do not drop new evidence or reset revision counters. Record rollback versions and rehearse stale-cache/vector behavior locally.

## 16. Definition of complete

- [ ] G01-G14 are addressed or explicitly dispositioned with source/runtime evidence.
- [ ] A name-and-country profile produces a useful profile prompt and no personalized embedding/cards, including old-cache cases.
- [ ] Freshers and partial profiles are handled without universal experience/resume/certificate requirements.
- [ ] Education, experience, preferences, completed learning and visibility/approval policies have real canonical producers and freshness coverage.
- [ ] All affected callers use the typed response contract; empty-state metadata is preserved.
- [ ] TanStack Query owns recommendation server state; lifecycle regressions remain protected; existing auth cache clearing is preserved.
- [ ] Zustand is restricted to justified UI state; no second authoritative recommendation cache exists.
- [ ] Jobs-only scope, ownership, entitlements, source/model validation and application-time learning checks remain intact.
- [ ] Shared ranking and explanations demonstrate measured improvement without inventing unsupported qualification claims.
- [ ] New invalidation sources, time expiry and concurrent generation/publication are tested.
- [ ] Development schema, deployment bindings, signed-in journeys, cost/latency behavior and rollback have recorded verification.
- [ ] No source code, credentials, private profiles or historical audit artifacts are silently overwritten to claim closure.

## 17. Source references

Current implementation reviewed:

- [Learner embedding builder](../../../functions/api/embedding/services/textBuilder.ts)
- [Embedding limits and task types](../../../functions/api/embedding/config/constants.ts)
- [Semantic recommendation handler](../../../functions/api/career/handlers/recommend.ts)
- [Recommendation identity versions](../../../functions/api/career/utils/recommendation-versions.ts)
- [Dashboard rules endpoint](../../../functions/api/learners/ai-recommendations.ts)
- [Job hydration and scope helpers](../../../functions/lib/job-recommendations.ts)
- [Learning policy and eligibility](../../../functions/lib/learning-eligibility.ts)
- [Versioned recommendation state migration](../../../supabase/migrations/20261015090000_recommendation_boundaries_and_revisions.sql)
- [Verified job matching migration](../../../supabase/migrations/20270118000000_verified_ai_job_matching.sql)
- [Jobs-only migration](../../../supabase/migrations/20270121000000_jobs_only_recommendations.sql)
- [Training visibility schema](../../../supabase/migrations/20260629000000_add_approval_tracking_columns.sql)
- [Normalized learning evidence](../../../supabase/migrations/20261022133000_normalized_learning_evidence.sql)
- [Profile data producers](../../../functions/api/learner-profile/actions.ts)
- [Career context with normalized education/experience](../../../functions/api/career/context/learner.ts)
- [Matching service and DTO mapping](../../../src/features/opportunities/api/aiJobMatchingService.ts)
- [Sidebar/My Skills matching hook](../../../src/features/opportunities/model/useAIJobMatching.ts)
- [Dashboard recommendation hook](../../../src/features/learner-profile/model/useLearnerAIRecommendations.ts)
- [Recommendation widget](../../../src/widgets/learner-dashboard/ui/RecommendedJobs.jsx)
- [Existing QueryProvider](../../../src/app/providers/QueryProvider.tsx)
- [Existing query-key factory](../../../src/shared/lib/queryKeys/learner.ts)
- [Existing auth cache lifecycle](../../../src/App.tsx)
- [SSO RequestInit forwarding](../../../src/shared/api/ssoClient.ts)
- [Current frontend lifecycle tests](../../../src/features/opportunities/model/__tests__/recommendation-lifecycle.test.tsx)
- [Current ownership/cache tests](../../../functions/__tests__/api/career-recommend-ownership.test.ts)
- [Current jobs-only SQL regression](../../../functions/__tests__/sql/jobs-only-recommendations.sql)

Library references, checked against the existing v5 integrations:

- [TanStack Query keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
- [TanStack Query cancellation](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation)
- [TanStack Query invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation)
- [Zustand persist and selective persistence](https://zustand.docs.pmnd.rs/reference/middlewares/persist)


## 29 October follow-up corrections

The two confirmed follow-up defects are fixed locally: refreshed preference values are reconciled safely, and stale saves cannot reverse another session's opt-out; generic location/employment/work-mode/department matches no longer admit unrelated jobs. The [concurrency migration](../../../supabase/migrations/20270127000000_career_preferences_concurrency.sql) must precede the matched API/client release. It removes the unguarded writer and requires an expected preference revision.

The complete application suite passes **398 tests across 14 files**, and the disposable PostgreSQL concurrency/ownership/candidate checks pass. Ranking identity is `semantic-ranking-6-career-relevance`, shared ordering is `evidence-order-2`. The [diagnostic report](LOCAL_RELEVANCE_EVALUATION.json) contains seven synthetic scenarios, including a location-only unrelated-job control; it is not independent release evidence. Current rollout prerequisites and remaining acceptance gates are recorded in the [release checklist](RELEASE_CHECKLIST.md). No application database migration or deployment was performed.

Final correction verification: application production build and local API bundle pass; frontend/backend diagnostic comparisons introduce no errors (7,976 → 7,971 and 6,912 → 6,912). The application knowledge graph was refreshed.

## Full local verification before rollout

See the [local test report](LOCAL_TEST_REPORT.md). The isolated recommendation suite passes 398 tests; the full LTE suite passes 1,850 tests with one skipped. Both builds, both API bundles, SQL fixture assertions and five Chrome preference scenarios pass. The full application suite reports 2,840 passed, 168 failed and four skipped, plus one runner timeout. All 39 failing files and all current failure headings reproduce against committed source, including the timeout. Application lint remains unclean; LTE lint and frontend type checks pass. There were no introduced application type diagnostics. No application source code, application database or deployment was changed during this verification. Browser fixtures and disposable SQL databases do not close signed-in or restored-database release gates.

## Local database migrations applied

On 29 October 2026, all nine pending application migrations and the pending LTE summary migration were applied to the two local databases and recorded in their ledgers. Both repositories now have zero unapplied local migration files. Backup copies, restore-rehearsal limitations and rollback-only smoke checks are documented in the [local migration report](LOCAL_MIGRATION_REPORT.md). Existing orphaned source rows were preserved. Remote migration/deployment and acceptance gates remain open.

## Specificity and evaluated-learning opt-out corrections

The shared ranker now prevents general skill overlap from substituting for unmatched specialist requirements, with approved soft-skill metadata and a bounded fallback list. General-skill-only jobs remain discoverable. Evaluated-learning admission and ordering require explicit opt-in, while application eligibility stays independently enforced. Fifteen added regression/control cases produce a green **413-test recommendation suite**. Application production and API bundle builds pass. Ranking identities are `semantic-ranking-7-specificity-consent` / `evidence-order-3`; preprocessing is unchanged. The synthetic report now has twelve scenarios and retains `releaseAcceptance=false`. No additional database migration is needed for these code fixes; remote deployment and independent acceptance remain open.

## Default career context changed at user request

Both assessment suggestions and evaluated LTE achievements now default to enabled; explicit saved opt-outs remain respected. No data backfill or SQL migration was performed. Identities are `learner-text-7-default-career-context`, `semantic-ranking-8-context-defaults`, and `evidence-order-4`. The release checklist records current behavior.
