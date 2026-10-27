# Learner Job Recommendation Audit

Audit date: 2026-10-12  
Audit ID / revision: `LJR-2026-10-12` / `2.1`  
Workspace: `skill-echosystem`  
Application audited: `skillpassport/`  
Application HEAD at inspection: `4ffc0237a2604729927e8aa9749890d9d3552778`  
Scope: current workspace source, checked-in migrations, schema backup, and isolated executions of actual application code.

Document status: completed source-level audit; production assurance remains open. Prepared by Codex through source inspection and controlled execution. Independent human review, product-policy approval, and production validation are not represented as completed.

Evidence bundle: [reproduction instructions](audit-evidence/learner-job-recommendations/README.md), [verification suite](audit-evidence/learner-job-recommendations/verify.cjs), [recorded results and source fingerprints](audit-evidence/learner-job-recommendations/verification-results.json), [read-only catalog verification](audit-evidence/learner-job-recommendations/read-only-verification.sql).

## Reader navigation

- Sections 1–2: assurance conclusion, scope, and evidence limits.
- Section 3: what learners receive and how each implementation works.
- Sections 4–6: findings, causal evidence, impact, and corrections.
- Sections 7–8: policy decisions and false-positive dispositions.
- Sections 9–11: reproducibility, remediation, and live verification.
- Sections 12–15: threat model, risk rationale, control coverage, and closure criteria.

## 1. Executive assessment

Learners receive job suggestions through three different implementations:

1. The learner dashboard uses a rules-based scoring endpoint.
2. Opportunities and My Skills use an embedding recommendation endpoint, database caching, and fallback listings.
3. Career AI chat uses conversational search and ranking followed by a generated response.

The implementations have different candidate selection rules, scoring meanings, access checks, and refresh behavior. There is no single recommendation contract shared by these surfaces.

The audit retains **eleven findings in active application code**, **one confirmed legacy-path defect**, and **five groups of schema or deployment-dependent risks**. Architectural differences and product choices are documented separately; they are not automatically counted as defects.

The highest-priority source findings are the missing learner ownership check, missing backend matching entitlement check, inconsistent dashboard job selection, misleading score transformation, and stale cached recommendations. These are confirmed at the code level. This audit does **not** assert that a production account was compromised or that a particular production learner received the synthetic examples used in testing.

No application code was changed. The project had unrelated user changes before the audit; they were preserved. The initial temporary harness has been replaced by a durable evidence bundle in the workspace, with **31 passing characterization checks and SHA-256 fingerprints of 133 source/evidence inputs**. These checks reproduce both defects and successful controls; a passing suite is not a healthy-system verdict.

**Decision supported by this report:** authorize remediation and controlled validation of the recommendation module. The audited source contains unresolved authorization and correctness defects, so approval of a release of this implementation should require disposition of C01–C06, C10/C11, and the environment/return-contract checks below. This is a source-based release recommendation, not a claim that the current production deployment is identical to this workspace.

**Decision not supported:** certifying production security, ranking quality, fairness, throughput, or recommendation outcomes. Those require current deployment evidence, representative data, and independent review. Professional audit quality comes from traceable evidence and bounded conclusions; the report makes no accreditation or compliance-certification claim.

## 2. Evidence and limits

### Evidence classes

| Class | Meaning |
|---|---|
| Confirmed source behavior | Directly established by active source code and, where applicable, an isolated reproduction. |
| Schema-dependent risk | Established in checked-in SQL; production impact requires the deployed definitions to match. |
| Confirmed legacy defect | Reproduced code defect, but no active learner route was found using the affected client flow. |
| Observation / policy decision | Verified behavior whose desirability depends on product requirements. |
| Unverified deployment condition | Missing local evidence or an external dependency whose actual deployed state was not inspected. |

### Method

- Queried the project knowledge graph before source inspection, then verified relationships against actual imports and routes.
- Traced frontend consumers, request payloads, authentication wrappers, backend handlers, SQL scoring, cache functions, and mutation paths.
- Rechecked earlier findings for compensating middleware, intentional UI behavior, inactive consumers, and deployment assumptions.
- Executed actual TypeScript modules after transpilation, using local dependencies and controlled fixtures.
- Executed the actual application `withAuth` wrapper and Supabase client factory in the route reproduction. The SSO provider and Supabase transport were mocked; the application authorization logic was retained.
- Added successful-path, rejected-input, verified-email, self-target, service-binding, rate-limit, and fallback controls to challenge overbroad conclusions.
- Preserved deterministic fixtures, executable checks, runtime versions, and fingerprints in a permanent evidence bundle.
- Used static inspection for SQL and React refresh dependencies. No PostgreSQL server, browser session, or deployed service was exercised.

### Important limits

The directory named `supabase/backups/latest/` is **not a current production snapshot**. Its [manifest](skillpassport/supabase/backups/latest/manifest.json) dates the backup to **2026-09-18T07:58:09Z**. The audit date is October 12. Missing objects in that backup or local migrations establish a reproducibility gap, not proof of their absence from today's production database.

The mock reproductions establish how application code handles specified inputs and dependency responses. They do not establish actual database row counts, production data formats, deployed feature entitlements, external worker uptime, or production failure frequency.

## 3. Current recommendation flows

### 3.1 Surface map

| Surface | Active consumer | Backend | Result behavior |
|---|---|---|---|
| `/learner/dashboard` | `useLearnerAIRecommendations` | `GET /api/learners/ai-recommendations` | Up to 20 scored results; dashboard displays up to five and can fill with regular opportunities. |
| `/learner/opportunities`, My Jobs tab | `RecommendedJobs` → `useAIJobMatching` | `POST /api/career/recommend-opportunities` | Requests three results; uses `ai_job_matching` UI gate and a refresh button. |
| `/learner/my-skills` | `useAIJobMatching` → `SuggestedNextSteps` | Same career recommendation endpoint | Requests three results; no matching-specific `FeatureGate` at this call site. |
| `/learner/career-ai` | `CareerAssistant` → `streamCareerChat` | `POST /api/career/chat` | Conversation-dependent results; `career_ai` is checked by the UI and backend. |
| `/learner/browse-jobs` | `BrowseJobs` | None for the displayed list | Four hardcoded sample jobs; no personalized recommendation fetch. |

Evidence: [learner routes, L21 and L68](skillpassport/src/app/routes/learnerRoutes.jsx), [dashboard, L886](skillpassport/src/pages/learner/Dashboard.jsx), [Opportunities, L1223](skillpassport/src/pages/learner/Opportunities.jsx), [My Skills, L68](skillpassport/src/pages/learner/MySkills.jsx), [matching widget, L466](skillpassport/src/widgets/learner-dashboard/ui/RecommendedJobs.jsx), [Career AI page](skillpassport/src/pages/learner/CareerAI.tsx), [chat service](skillpassport/src/features/career-assistant/api/careerWorkerService.ts), [Browse Jobs, L8](skillpassport/src/pages/learner/BrowseJobs.jsx).

The route parent also contains `SubscriptionProtectedRoute`. This is an application navigation guard; it does not replace authorization on backend requests.

### 3.2 Dashboard rules-based scoring

The frontend uses the current origin and SSO client to call `/api/learners/ai-recommendations`. The backend resolves `learners.user_id` from the authenticated subject, so this particular endpoint does not accept an arbitrary learner ID from the client.

It reads technical and soft skills from `skills`, limited to rows with `training_id IS NULL`. It then takes the newest 50 opportunities with `status = 'active'`, calculates scores, sorts descending, and returns the top 20. There is no minimum-score exclusion: the `isAIRecommended` boolean is a flag, not a result filter.

| Component | Maximum points | Actual comparison |
|---|---:|---|
| Required skills | 40 | Case-insensitive containment of each required skill in a learner skill name; required skills must be an array. |
| Preferred employment type | 15 | Exact membership in learner `preferred_employment_types`. |
| Preferred location | 15 | Case-insensitive containment in job location. |
| Preferred department / sector | 15 | Exact membership in learner `preferred_departments`. |
| Experience level | 10 | Exact equality between learner and opportunity `experience_level`. |
| Recent posting | 5 | Calculated days since `posted_date` are at most seven. |

The endpoint returns `cached: false` and `fallback: false`. It does not perform semantic matching or read assessment results. `proficiency_level` is fetched but not used in the score.

The dashboard removes results without a nonblank company name, maps the results to display fields, and uses regular opportunities to fill available slots. Its regular opportunity hook accepts `learnerSkills`, but the inspected fetch implementation uses that value as a dependency rather than a ranking input; these fill-in listings should not be assumed personalized.

Evidence: [dashboard API, L29, L73, L93, L109 and L199](skillpassport/functions/api/learners/ai-recommendations.ts), [frontend service, L69](skillpassport/src/features/learner-profile/api/learnerAIRecommendationsService.ts), [dashboard display mapping, L114](skillpassport/src/pages/learner/Dashboard.jsx), [regular opportunities hook](skillpassport/src/features/opportunities/model/useOpportunities.ts).

### 3.3 Embedding-based matching and fallback

The frontend sends `{ learnerId, limit: 3, forceRefresh }`. The handler validates the UUID, applies a local rate limit, creates a service-role Supabase client, and follows this sequence:

1. Unless forced, call `get_cached_job_matches` and immediately return cached JSON if valid.
2. Load the target learner's existing embedding.
3. Only if the embedding is missing, build profile text, call the embedding worker through the service binding, and store the vector.
4. Read dismissed opportunity IDs.
5. Try `match_opportunities_enhanced_v2`; on error or no results, try `match_opportunities_enhanced`.
6. On matching failure or no matches, call `get_popular_opportunities`.
7. On matching success, enrich and cache up to 50 results, then return the requested subset.

The profile text builder includes profile information, approved enabled skills, approved enabled unexpired certificates, approved enabled projects, approved trainings, and completed course details. It does not directly read assessment results or LTE readiness. Limits include 15 skills, 10 certificates, five projects, five trainings, and five completed courses.

When the checked-in V2 SQL succeeds, it considers `is_active = true`, `status = 'open'`, unexpired opportunities with embeddings, excluding supplied dismissed IDs. It takes up to 100 candidates by vector similarity and returns up to 50 after ranking.

```text
V2 base score =
  0.40 × profile cosine similarity
+ 0.25 × skill overlap
+ 0.20 × best certificate similarity
+ 0.15 × best project similarity
```

The SQL also attempts a fresher/senior-role adjustment: a 30% penalty and a narrower exclusion for certain senior jobs. This depends on `is_learner_fresher`, whose deployed availability was not verified. There is no demonstrated comprehensive eligibility engine for every school grade, location, backlog, or qualification requirement in this endpoint.

The handler's `MATCH_THRESHOLD = 0.01` is used as a minimum **raw similarity** in V2; it is not a 1% minimum final suitability score. The requested UI limit is three; the backend limit cap is 50.

The checked-in cache SQL uses a 24-hour TTL and a profile hash. Fallback listings are ordered by posting date and are not saved by this handler's matching cache-save path.

Evidence: [request and response mapping](skillpassport/src/features/opportunities/api/aiJobMatchingService.ts), [recommendation handler](skillpassport/functions/api/career/handlers/recommend.ts), [profile text builder, L73](skillpassport/functions/api/embedding/services/textBuilder.ts), [embedding limits](skillpassport/functions/api/embedding/config/constants.ts), [V2 SQL, L6448; cache save, L8799](skillpassport/supabase/migrations/20260526000000_schema.sql).

### 3.4 Career AI chat

Chat builds learner, assessment, career progress, and course context. For job-related intents it calls `fetchSmartOpportunities`. Short generic queries use the learner's top skills directly; other queries attempt AI extraction of search terms, location, and employment type.

The search fetches up to 100 newest active `open` opportunities, optionally constraining location and employment type. It filters and ranks them in memory, then returns up to 15 for the response context. Its ranking gives up to 60 points for skill overlap and up to 40 for query terms matching required skills. A zero-result text search can be relaxed back to the fetched candidates. The response prompt instructs the model to recommend only provided database opportunities.

This flow computes an experience-level filter value, but the inspected `buildQuery` does not apply that value. It also does not check job deadlines in that query. These are source observations for this chat path; no claim is made that the model always recommends an expired or unsuitable role.

The backend checks `career_ai`. It additionally imposes a two-user-message quota in the inspected chat handler. Subscription access should not be interpreted as proof of unlimited messages.

Evidence: [chat handler, L110–170](skillpassport/functions/api/career/handlers/chat.ts), [smart search, L193, L231 and L304](skillpassport/functions/api/career/context/smart-opportunities.ts), [grounding prompt, L272](skillpassport/functions/api/career/ai/prompts/enhanced-system-prompt.ts).

## 4. Confirmed active-source findings

Severity is a proposed remediation priority, not a statement of observed production loss. Authentication, caching, and matching dependencies were isolated in tests; deployed exploitability and prevalence remain unmeasured.

| ID | Priority | Finding | Evidence |
|---|---|---|---|
| C01 | High | Target learner ID is not authorized against the authenticated caller. | Source + T08, with T09 control. |
| C02 | Medium | Recommendation endpoint does not enforce the matching entitlement. | Source + T08. |
| C03 | High | Dashboard uses inconsistent job status and incomplete availability filtering. | Source + T01. |
| C04 | Medium | Dashboard overwrites the API's recommendation threshold flag. | Actual mapping + T04. |
| C05 | Medium | Displayed match metric differs from ranking; fallback receives an invented percentage. | Actual service + T05/T06. |
| C06 | Medium | Cached JSON returns without rechecking deadlines or dismissal state. | Source + T07. |
| C07 | Medium | Relevant edits do not reliably refresh active recommendations; forced refresh reuses the vector. | Source + T10. |
| C08 | Medium | Embedding client's truncation and malformed-response paths reference undefined identifiers. | Actual client + T12/T13. |
| C09 | Low | Cache RPC error objects are ignored while success is logged. | Actual handler + T10/T11. |
| C10 | Medium | Partial database failures are interpreted as absent evidence/feedback, or as successful empty fallback. | Actual builder/handlers + T23–T25/T30, with T31 control. |
| C11 | Medium | A malformed required-skills element can fail the entire dashboard recommendation response. | Actual dashboard handler + T26. |

### C01 — Missing target-learner ownership check

**Evidence:** [career route, L79–105](skillpassport/functions/api/career/[[path]].ts), [handler, L77–105](skillpassport/functions/api/career/handlers/recommend.ts), [authentication wrapper, L88–143](skillpassport/functions/lib/auth.ts), [service-role factory, L38–60](skillpassport/functions/lib/supabase.ts).

The route obtains the authenticated user but invokes the recommendation handler with only request and environment. The handler trusts a valid client-supplied learner UUID. Neither the route nor handler compares that UUID to the caller's learner record. The shared authentication wrapper adds authentication and verified-email checks, but no learner ownership check for this endpoint. The handler uses the service-role client, so RLS is not the compensating boundary here.

**Reproduction:** T08 uses a verified fixture user A and target learner B, whose fixture owner is a different SSO subject. This matters because a learner UUID normally differs from its own user's UUID; merely comparing those two IDs would not establish cross-user access. The actual application auth wrapper, route, validation, and recommendation handler accept B's mocked cache response without reading the owner mapping. T09 confirms that the real verified-email check still returns 403 for an unverified fixture user.

**Impact:** A verified authenticated caller who knows another learner's UUID can target that learner's recommendation results. A cache miss also reaches computation and cache/embedding write paths for the supplied learner. The demonstrated exposure is recommendations derived from another profile; this test does not demonstrate disclosure of the entire learner profile or a production intrusion.

**Recommendation:** Resolve the learner from the authenticated subject. If delegated access is required, authorize it explicitly before any cache read or computation. Add a cross-learner rejection test and an allowed self-access control.

### C02 — Backend matching entitlement is absent

**Evidence:** [career route, L86–105](skillpassport/functions/api/career/[[path]].ts), [matching UI gate, L466](skillpassport/src/widgets/learner-dashboard/ui/RecommendedJobs.jsx), [My Skills, L68](skillpassport/src/pages/learner/MySkills.jsx).

The route's feature check covers `career_ai` paths such as chat, but excludes `/recommend-opportunities` and `/recommend`. The matching handler performs no `ai_job_matching` check. T08 configures a denying entitlement dependency and confirms that the route never calls it.

**Impact:** The matching-specific UI lock is not enforced by this endpoint. The My Skills consumer also calls matching without that specific UI gate. This is a server enforcement gap relative to the widget's stated paid-feature contract, not an assertion that every authenticated account has access to every other feature.

**Recommendation:** Decide the entitlement policy for all matching surfaces and enforce it at the backend boundary. If matching is intentionally free, remove contradictory paid-feature presentation rather than maintaining two policies.

### C03 — Dashboard selects a different and incompletely filtered job pool

**Evidence:** [dashboard API, L93–99](skillpassport/functions/api/learners/ai-recommendations.ts), [recruiter import, L513–520](skillpassport/functions/api/recruiter/actions.ts), [V2 filtering, L6473–6481](skillpassport/supabase/migrations/20260526000000_schema.sql).

The dashboard requires `status = 'active'`. Recruiter import derives `is_active` from `status = 'open'`; V2 and chat also use `open`. The dashboard recommendation query does not require `is_active = true` or a future deadline. It considers only the newest 50 matching-status jobs, so older relevant jobs never enter its ranking.

**Reproduction:** T01 supplies an open, active job and an expired, inactive job whose status is active. The actual dashboard handler excludes the former and retains the latter. Synthetic fixtures prove selection semantics, not the prevalence of either row type in production.

**Recommendation:** Establish one publish/availability predicate and reuse it across recommendation and browsing paths. Include deadline and inactive-state controls. Evaluate whether the newest-50 candidate cap is acceptable for recall.

### C04 — Dashboard ignores the API's recommendation flag

**Evidence:** [API flag, L172–185](skillpassport/functions/api/learners/ai-recommendations.ts), [dashboard mapping, L118–154](skillpassport/src/pages/learner/Dashboard.jsx).

The API returns low-scoring candidates with `isAIRecommended: false` below 30 points. Both UI mapping branches set the field to true. T04 executes the actual pre-render mapping and confirms that a 5-point result becomes AI Recommended.

**Impact:** The UI contradicts the backend threshold. Zero-score rows can receive the label while their score badge is hidden because the display expression treats zero as falsy. The rules-based method itself is an architectural choice; the concrete defect is discarding the returned flag and presenting a stronger claim than its score supports.

**Recommendation:** Preserve the flag or define one shared threshold. Distinguish ranked candidates and ordinary filler listings. Render a score of zero explicitly when the score is displayed.

### C05 — Ranking and displayed percentage have different meanings

**Evidence:** [frontend transformation, L67–79](skillpassport/src/features/opportunities/api/aiJobMatchingService.ts), [widget score label, L336](skillpassport/src/widgets/learner-dashboard/ui/RecommendedJobs.jsx), [V2 final score, L6565–6611](skillpassport/supabase/migrations/20260526000000_schema.sql).

V2 ranks using `final_score` and returns `match_percentage`. The frontend creates `match_score` from `(similarity || 0.5) * 100`. T05 supplies a synthetic result with similarity 0.90 and weighted score 0.485; the UI-facing value is 90 while the returned overall percentage is 49.

Raw similarity is a legitimate separate metric, so 90 is not intrinsically mathematically false. The issue is using it under a Match label while job order uses another metric. It is not a probability of hiring success.

T06 confirms that a fallback job lacking similarity receives 50 and that the frontend discards `fallback` and `reason`. A legitimate similarity of zero also becomes 50 because of `||`.

**Recommendation:** Display the overall percentage consistently, or label profile similarity separately. Preserve fallback provenance, show fallback listings as such, and do not invent match percentages when no matching calculation exists. Populate explanations from real breakdowns; the current service supplies generic reasons and empty matching-skill/gap arrays.

### C06 — Cached results bypass per-job freshness checks

**Evidence:** [cache return, L102–121](skillpassport/functions/api/career/handlers/recommend.ts), [SQL cache validation, L6225–6258](skillpassport/supabase/migrations/20260526000000_schema.sql), [cache retrieval, L4442](skillpassport/supabase/migrations/20260526000000_schema.sql).

On a cache hit, the handler returns stored opportunity JSON before reading the learner or current dismissals. Checked-in SQL validates cache TTL, an invalidation flag, and profile hash; it does not evaluate each job's deadline or dismissal state. T07 proves the handler will return a cached record whose deadline has passed.

**Impact:** Passing a deadline does not itself update a database row, so a snapshot can stay eligible until another invalidation or TTL expiry. Changes to dismissals likewise require an independent invalidation mechanism. The inspected migrations contain no interaction-driven job-cache invalidation trigger. SQL deployment or external maintenance can affect the duration; the source test does not assume they are absent everywhere.

**Recommendation:** Rehydrate/filter cached IDs against current availability and dismissals, or make these conditions part of cache validity. Add a time-boundary test and dismissal-after-cache test. Deadline, `is_active`, location, and experience changes should be evaluated when defining opportunity invalidation coverage.

### C07 — Profile edits and refresh do not imply fresh semantic input

**Evidence:** [dashboard hook, L29–64](skillpassport/src/features/learner-profile/model/useLearnerAIRecommendations.ts), [dashboard consumer, L887–895](skillpassport/src/pages/learner/Dashboard.jsx), [matching hook, L64–96](skillpassport/src/features/opportunities/model/useAIJobMatching.ts), [skill save path, L1020](skillpassport/src/entities/learner/api/learnerService.ts), [entity upsert, L262](skillpassport/functions/api/learners/data/[[path]].ts), [learner embedding branch, L148–173](skillpassport/functions/api/career/handlers/recommend.ts).

The dashboard fetch effect watches enablement and a refresh key, not learner skill content. Its consumer does not connect the returned refresh action to saves. The matching hook watches identity, email, department, nested branch field, enablement, and result limit; it does not watch skill/certificate/project collections.

Force refresh bypasses the job-results cache but uses an existing learner embedding. T10 confirms that neither the text builder nor worker is called when that vector exists. That proves the meaning of force refresh, not that every vector is stale: another writer could have refreshed it already.

**Recommendation:** Define dependencies explicitly: learner-data mutation → embedding invalidation/regeneration → result-cache invalidation → frontend refetch. Tie mutation success to the relevant refetch or version change, and expose when results were computed. Account for the SQL risks in R02 and R03.

### C08 — Undefined identifiers in embedding error paths

**Evidence:** [embedding client, L39–85](skillpassport/functions/api/embedding/services/embeddingWorkerClient.ts), [maximum text length](skillpassport/functions/api/embedding/config/constants.ts).

The module uses `logger.warn` and `logger.error` without defining or importing `logger`. Its malformed-response details reference `embedding`, which is also undefined. No relevant global injection was found in the inspected configuration.

T12 supplies 10,001 characters and gets `logger is not defined` before the worker call. T13 supplies a malformed worker response and gets an API error mentioning `embedding is not defined`, rather than the intended invalid-response classification. Error logging can also mask an `EmbeddingError` with the undefined logger.

**Impact:** Long inputs fail instead of following the intended truncation path, and certain failure paths lose their original diagnosis. The recommendation handler catches embedding-generation failures and can return fallback jobs. A well-formed short worker response still follows the normal success path; this is not evidence that all embeddings fail. The malformed-response test deliberately injects an error response and does not establish that the current worker produces it.

**Recommendation:** Define the logger and reference the actual worker response. Verify normal success, truncation, missing binding, malformed response, and error propagation.

### C09 — Cache-save errors are logged as success

**Evidence:** [cache save, L242–252](skillpassport/functions/api/career/handlers/recommend.ts).

The handler awaits `supabase.rpc('save_job_matches_cache', ...)` but ignores its returned error field. Supabase errors can be returned as `{ data, error }` without rejecting the promise. T10/T11 inject that response shape and confirm the request still succeeds and logs CACHE SAVE.

**Impact:** Matching can correctly succeed while persistence fails. That may cause repeated computation and misleading operational logs; this audit does not claim any actual cache-save failure occurred in production. Returning fresh recommendations despite an optional cache failure can be a valid availability policy. The defect is failing to detect and report that failure.

**Recommendation:** Check the RPC's error field. Keep the fresh result if desired, but emit an accurate cache-failure metric and do not log a successful save.

### C10 — Partial data failures are not represented as degraded results

**Evidence:** [profile builder, L107–163](skillpassport/functions/api/embedding/services/textBuilder.ts), [dashboard skills read, L73–85](skillpassport/functions/api/learners/ai-recommendations.ts), [dismissal read, L176–183 and fallback, L39–64](skillpassport/functions/api/career/handlers/recommend.ts).

The profile builder checks the core learner query, but destructures only `data` from the five related queries. Returned errors for skills, certificates, projects, enrollments, or trainings therefore become missing sections in the text. T23 injects errors for all five related queries and confirms that a sufficiently detailed core profile still produces embedding text without a degradation indication. The normal missing-vector handler can then persist that incomplete representation. T31 is an important control: a failed **core learner query is rejected**; this is not a claim that every database failure is ignored.

The dashboard logs a skills-query failure but continues with empty skills and returns `success` with `fallback: false`. T25 confirms a fixture's score drops from 100 to 60 while the response treats the failed read as an empty technical-skills profile. Fresh embedding matching also ignores an error from the dismissal query and sends `dismissed_ids: []`; T24 exercises that path. If matching and generic fallback both fail, T30 confirms the handler returns a successful empty recommendation array, preserving the original matching reason rather than exposing the fallback failure as a separate degraded state.

**Impact:** Operational outages can alter ranking or admit previously excluded candidates without the consumer knowing its data is incomplete. A persisted partial vector can outlast the initial outage because an existing embedding is subsequently reused. Production occurrence and duration are unmeasured. Returning fallback data during an outage can be intentional; the defect is conflating query failure with valid empty evidence or feedback and losing the distinction needed for accurate labels, persistence decisions, and recovery.

**Recommendation:** Check related-query error fields and define a minimum complete input contract. Preserve the last good vector/cache when required evidence is unavailable, or mark degradation explicitly and schedule recovery. Treat unavailable dismissal state deliberately rather than automatically as no dismissals. Differentiate an empty catalog from failed fallback retrieval. Add per-source failure metrics without logging private profile content.

### C11 — One malformed job can fail the whole dashboard feed

**Evidence:** [scoring loop, L109–118 and outer error handler](skillpassport/functions/api/learners/ai-recommendations.ts), [opportunity create/update, L249–265](skillpassport/functions/api/opportunities/index.ts), [JSONB skills column, L14031](skillpassport/supabase/migrations/20260526000000_schema.sql).

The dashboard verifies that `skills_required` is an array, but assumes every element supports `toLowerCase()`. T26 adds one eligible fixture job with `skills_required: [null]` alongside valid jobs. The actual handler returns an internal error for the entire request rather than returning the valid candidates. The inspected create/update path does not validate element types, and the baseline JSONB column does not include a string-element constraint.

**Impact:** A malformed stored job can prevent all dashboard recommendations from loading. This reproduction does not establish that production contains malformed rows or that any particular user can create them. String/array representation differences also need a shared normalization contract; a plain non-array value currently receives no required-skill score rather than causing this particular exception.

**Recommendation:** Validate and normalize stored skill fields at ingestion and defensively at matching. Decide whether to quarantine a malformed job or fail with a precise data-quality signal; avoid losing unrelated valid candidates. Test null/object elements, valid arrays, supported legacy string representations, and mixed valid/invalid candidate sets.

## 5. Schema and deployment-dependent risks

### R01 — Dashboard expects learner fields absent from inspected schema

The baseline learner table and September 18 backup do not define `preferred_employment_types`, `preferred_locations`, `preferred_departments`, or learner `experience_level`. No later local migration defining those fields was found. The API expects these as top-level learner fields; it does not derive them from metadata, city, branch, or work-experience records.

If the deployed table matches this schema, the 55 preference/experience points never contribute, leaving at most 45 from skills and recency. T02 verifies that condition. **T03 disproves a universal 45% ceiling:** supplying those fields produces 100 in the same actual handler.

Action: inspect the deployed learner columns and actual resolved profile shape. Then implement or remove unsupported scoring inputs. Do not advertise a production maximum based only on local SQL.

Evidence: [baseline learner table, L12233](skillpassport/supabase/migrations/20260526000000_schema.sql), [older remote schema](skillpassport/supabase/backups/latest/migration_schema.sql), [API input accesses, L127–159](skillpassport/functions/api/learners/ai-recommendations.ts).

### R02 — Checked-in cache invalidation omits direct evidence changes

The profile hash includes core learner fields, metadata, course enrollment state/progress, and training IDs/statuses. It does not include skills, certificates, projects, or opportunity interactions. Dedicated cache invalidation triggers cover selected learner fields, enrollments, trainings, and selected opportunity columns; they do not directly cover evidence tables or interactions.

For opportunities, the listed update columns include title, description, requirements, skills, status, and embedding, but omit deadline and `is_active` among other fields. A change that affects a monitored learner field or regenerates an embedding can still invalidate the cache, so it is too strong to say that every skills edit necessarily stays stale for exactly 24 hours.

Action: compare deployed hashes/triggers with the complete matching input set. Test a direct evidence edit that leaves `skill_summary`, metadata, and existing embeddings untouched. Define invalidation for relevant availability changes.

Evidence: [profile hash, L3036](skillpassport/supabase/migrations/20260526000000_schema.sql), [triggers, L25742–25754](skillpassport/supabase/migrations/20260526000000_schema.sql), [entity save backend](skillpassport/functions/api/learners/data/[[path]].ts).

### R03 — Existing entity embeddings can be skipped during content updates

`trigger_entity_embedding_generation` returns early for an UPDATE whenever `NEW.embedding IS NOT NULL`. The trigger's column lists already target content fields, so this condition also skips relevant content updates when the old vector was retained. That SQL behavior is confirmed by inspection, but its presence in the current deployed database is unverified.

The trigger calls a legacy `career-api...workers.dev/backfill-embeddings` URL asynchronously. It requests specified entity types. No conclusion is drawn that the external worker is down, that its behavior matches older source, or that another updater cannot refresh the learner's aggregate vector.

Action: inspect deployed trigger bodies and request outcomes; test edits to an already-embedded skill/project/certificate. Avoid guessing worker availability from its hostname. Audit regeneration of both entity and aggregate learner embeddings.

Evidence: [trigger body, L9757–9795](skillpassport/supabase/migrations/20260526000000_schema.sql), [entity triggers, L25694, L25770 and L25794](skillpassport/supabase/migrations/20260526000000_schema.sql).

### R04 — Database and background-job dependencies are not locally reproducible in full

V2 calls `is_learner_fresher`, and the handler's V1 path calls `match_opportunities_enhanced`. Definitions for those exact objects were not found in the inspected migrations or September 18 schema backup. A differently named `match_opportunities` and a `match_opportunities_smart` function exist; neither is the exact V1 RPC called by this handler. The smart function should not be treated as the active automatic matching algorithm.

The SQL also includes embedding queue functions. The inspected opportunity embedding trigger logs a need for an embedding rather than generating one. A queue-trigger function is defined, but no corresponding attachment was found in the baseline trigger list, and no queue consumer was found in the inspected application/embedding/realtime source. A course-completion queue trigger exists; therefore a blanket claim that no embedding queue mechanism exists would be false.

These facts indicate gaps in the locally traceable pipeline. They do not prove that current production lacks SQL helpers, a queue attachment, an external cron job, or a legacy worker deployment.

Action: inspect live RPC definitions, trigger attachments, scheduling, and worker bindings. Obtain successful V2 and V1 responses before declaring either algorithm operational or broken.

Evidence: [V2 call, L6454; queue functions, L4716, L8508; triggers, L9742, L9805 and L9850](skillpassport/supabase/migrations/20260526000000_schema.sql), [handler RPC names, L191–213](skillpassport/functions/api/career/handlers/recommend.ts), [backup manifest](skillpassport/supabase/backups/latest/manifest.json).

### R05 — V2's thin result is passed to Details/Apply without full opportunity hydration

The checked-in V2 return type omits `application_link`, `requirements`, `responsibilities`, `benefits`, `posted_date`, `created_at`, company logo, and numeric salary-range fields. The recommendation handler enriches scoring fields but does not fetch a full opportunity row. The frontend stores this result directly in `opportunity`; the widget passes it to both `onSelectJob` and `onApply`. The inspected preview reads its props without a full-row fetch.

T27 verifies omissions in the local SQL signature, transforms a V2-shaped fixture through the actual frontend service, and executes the actual Apply function extracted from the page. The thin fixture records an internal application but never calls the external redirect. A hydrated control containing `application_link` records the application and calls the redirect. Browser rendering, popup policy, a real application write, and the deployed V2 return shape were not tested.

**Impact if the deployed RPC matches the local contract:** recommended jobs can show incomplete Details and lose their external application destination, even when the underlying full opportunity has that destination. Existing fallback rows are fuller; this is not a claim that every job or every application path is affected. The fixture is constructed from the SQL contract, not from a production learner response.

**Recommendation:** Define a full opportunity DTO or rehydrate ranked IDs before Details/Apply. Preserve ranking metadata while fetching authoritative current job fields. Verify a real external-link job through both the recommended card and ordinary list in a controlled environment, including current availability and error handling.

Evidence: [V2 return signature, L6448](skillpassport/supabase/migrations/20260526000000_schema.sql), [handler response enrichment, L228–237](skillpassport/functions/api/career/handlers/recommend.ts), [frontend mapping, L67–79](skillpassport/src/features/opportunities/api/aiJobMatchingService.ts), [recommended Details/Apply, L428 and L445](skillpassport/src/widgets/learner-dashboard/ui/RecommendedJobs.jsx), [page Apply, L848–913 and preview props, L2100](skillpassport/src/pages/learner/Opportunities.jsx), [active preview, L664–758](skillpassport/src/widgets/learner-dashboard/ui/OpportunityPreview.jsx).

## 6. Confirmed legacy defect with limited active relevance

### L01 — Legacy interaction endpoint cannot consume its client's action payload

**Evidence:** [legacy service, L181–215](skillpassport/src/features/ai-tutor/api/aiRecommendationService.ts), [interaction handler, L18–43](skillpassport/functions/api/ai-tutor/handlers/actions.ts), [legacy hook](skillpassport/src/features/ai-tutor/model/useAIRecommendations.ts), [unrouted composite widget](skillpassport/src/widgets/learner-dashboard/ui/LearnerDashboardWidget.tsx).

The client sends `action: 'track-interaction'` and `interaction_type: 'dismiss'`. The backend first removes top-level `action` into the dispatcher variable, then attempts to read another `action` from the remaining params. The required interaction action is missing. T14 reproduces the rejection before database writes. The legacy `invalidateCache` method also returns success without modifying a cache.

False-positive correction: no active learner route was found using this legacy hook or its interaction methods. The only located composite widget calls the hook without a learner ID and is not the routed dashboard. This is a real endpoint/legacy-client defect, but it must not be cited as proof that the current Opportunities widget's dismiss button fails to persist a per-job rejection. That button has different intended behavior, described below.

Recommendation: repair the request contract if this flow is retained, or retire the legacy implementation. Use a separate dispatcher field and interaction field, validate ownership, and invalidate the actual cache. Verify route reachability before assigning current-user impact.

## 7. Observations and decisions that are not automatically defects

| Observation | Verified behavior | Classification / decision |
|---|---|---|
| Multiple recommendation implementations | Dashboard, embeddings, and chat use different scoring and data paths. | Architectural inconsistency; decide whether a shared contract is wanted. Three implementations alone are not a bug. |
| Already-applied jobs remain visible | The matching widget deliberately shows an Applied state for IDs in `appliedJobs`. | Supported UI behavior. Withdraw the earlier implication that retention is itself a defect. |
| Widget dismissal | The X hides the entire recommendation section; Show AI Recommendations restores it. | Intentional section-level preference, not per-job negative feedback. |
| Dismissal preference scope | `recommendations_dismissed` has no learner/user suffix. Relevant logout code does not explicitly remove it. | Low-priority account-scoping risk on a shared same-origin browser. No cross-origin storage sharing is implied; an account-switch browser test was not run. |
| Evidence approval | Dashboard reads skills regardless of enabled/approval state and excludes training-linked skills. Profile text building requires approved enabled evidence. V2 direct scoring checks enabled state but omits approval and certificate expiry. | Confirmed inconsistency; determine whether recommendations are allowed to use self-declared or expired evidence before calling it a policy violation. |
| Availability of fallback | `get_popular_opportunities` returns newest active open unexpired jobs and does not use its learner argument or dismissal/application history. | Generic fallback can be an intentional availability choice. C05 addresses its misleading personalized presentation. |
| Browse Jobs samples | Four hardcoded jobs appear on the routed Browse Jobs page. | Confirmed placeholder behavior. Product decision: remove/hide the route or connect it to real listings if presented as live. |
| Assessment / LTE influence | Neither automatic recommendation API directly reads assessment results or LTE readiness. Chat does read assessment context; completed courses can enter new profile embedding text. | Do not equate finishing an assessment or course with automatic re-ranking of every job feed. No full assessment-to-job automation was established. |
| Chat candidate restrictions | Search uses newest 100 rows and up to 15 contextual results; computed experience level is not enforced by the database query, which lacks a deadline check. | Scoped filtering limitations. Evaluate desired eligibility rules; generated text is not a guaranteed eligibility check. |
| Rate limiter | Five requests per learner ID per 60 seconds in memory; rate check precedes cache lookup. | Per-instance throttle, not a distributed user quota. Cache hits consume the local count; production rate-limit frequency is unmeasured. |
| Request shape validation | A nonnumeric limit reaches numeric clamping and produces zero cached results; JSON null reaches destructuring and throws rather than a structured validation rejection. | Confirmed input-validation gaps, T28/T29. Low-priority hardening; the exact deployed HTTP treatment of the thrown error was not tested. |

Evidence: [widget dismissal, L50–108 and Applied UI, L433](skillpassport/src/widgets/learner-dashboard/ui/RecommendedJobs.jsx), [logout, L202](skillpassport/src/shared/model/authStore.ts), [builder approval filters, L115–148](skillpassport/functions/api/embedding/services/textBuilder.ts), [V2 evidence joins, L6483–6539 and fallback, L5556](skillpassport/supabase/migrations/20260526000000_schema.sql), [sample jobs](skillpassport/src/pages/learner/BrowseJobs.jsx), [chat query](skillpassport/functions/api/career/context/smart-opportunities.ts), [rate limiter](skillpassport/functions/api/career/utils/rate-limit.ts).

## 8. False-positive review and corrections to earlier explanations

| Earlier statement or possible inference | Final disposition |
|---|---|
| All dashboard matches are capped at 45%. | Narrowed: 45 is conditional on missing preference/experience inputs. T03 reaches 100 with populated inputs. Live columns remain unverified. |
| Missing SQL definitions prove V2/V1 are broken now. | Not established. The definitions are missing locally and from an older backup; live installation must be checked. |
| Automatic embedding generation always works because the handler has an auto-generation branch. | Not established. Normal success is possible, but C08 and deployment dependencies affect other branches. |
| A 90% similarity value is inherently incorrect. | Narrowed: raw similarity may be 90, while overall match is 49. The display/ranking contract and invented fallback score are the issues. |
| Expired cached jobs always remain for 24 hours. | Narrowed: they can remain until another invalidation, refresh, or expiry. Exact duration and deployed maintenance are unknown. |
| Every skill edit misses cache invalidation. | Narrowed: direct evidence edits are not covered by the inspected hash/triggers, but a concurrent learner/metadata/embedding update can invalidate. |
| A recommendation refresh necessarily refreshes the learner embedding. | Rejected: T10 proves the force flag only bypasses results cache when the vector already exists. |
| The current dismiss button is a broken per-job feedback action. | Rejected: the current widget intentionally hides the section. The separately reproduced interaction defect belongs to a legacy flow. |
| Already-applied jobs appearing in the feed are a defect. | Withdrawn as a defect: the UI intentionally supports Applied state. |
| Using pending evidence violates an established policy. | Not established. Filtering differs between stages; the authoritative evidence policy was not supplied. |
| A legacy worker hostname proves its endpoint is unavailable. | Rejected. External availability was not checked. |
| `latest/` reflects today's deployed schema. | Rejected: its manifest dates it to September 18. |
| Missing matching authorization means the endpoint is unauthenticated. | Rejected: SSO authentication and verified-email checks remain. The defects are target ownership and feature-specific enforcement. |
| Local tests demonstrate a live production exploit or live incorrect learner score. | Rejected: fixtures and external dependencies were controlled; no production session was tested. |
| All query failures are treated as empty data. | Narrowed: related-evidence and selected feedback reads lose errors, but T31 proves the core learner query is rejected. |
| Every recommendation loses its external application link. | Rejected: R05 applies to the inspected thin V2 contract; full ordinary/fallback rows and a changed deployed RPC can behave differently. |
| Passing schema text assertions proves the live SQL executes. | Rejected: T27 checks the checked-in return signature; no PostgreSQL execution is represented. |

## 9. Verification record

The final verification run passed **31 focused checks**. It transpiled actual application source with local TypeScript and executed it in isolated Node contexts. Database, provider, and SSO transport responses were fixtures. The real application auth wrapper, target UUID validation, service-role client factory, embedding binding lookup, profile text builder, and local rate limiter ran in their respective checks.

Response-envelope helpers were simplified to inspect handler outcomes. The real verified-email guard returns a real 403 `Response` in T09. React JSX was not rendered: T04 executed the actual source slice that maps API recommendations before rendering. SQL was inspected but not executed. These distinctions prevent overstating the test coverage.

T27 extracts the actual Apply callback using the TypeScript AST and intercepts `window.open` with a fixture function. It proves callback behavior for supplied rows, not browser navigation or employer submission. Its SQL checks inspect declared return fields, not database execution. Harness chain-method and VM-realm assertion issues were corrected before the successful extended run; they were setup issues, not classified application defects.

| Test | Input / setup | Observed result |
|---|---|---|
| T01 | One open active job; one active-status inactive job with a passed deadline. | Dashboard excludes the open row and keeps the expired inactive row. |
| T02 | Disabled pending Python skill with no training ID; no preference fields. | Matching row scores 45; unrelated recent row scores 5 and API flag is false. |
| T03 | Same handler with all preferred fields and experience populated to match. | Score reaches 100; universal 45% claim disproved. |
| T04 | Actual dashboard mapping with the 5-point false-flag row. | UI-facing flag becomes true. |
| T05 | Similarity 0.90, final score 0.485, returned percentage 49. | Frontend match score becomes 90. |
| T06 | Fallback job without similarity, with fallback reason in API envelope. | Frontend match score becomes 50; fallback marker is omitted. |
| T07 | Valid mocked cache containing an expired job snapshot. | Job is returned; no learner or interaction table read occurs. |
| T08 | Verified SSO subject A, target learner B assigned a different fixture owner, denying entitlement dependency. | Actual route and app auth wrapper accept cache result without reading ownership; entitlement dependency is never called. |
| T09 | Same route with unverified SSO fixture subject. | Actual email-verification guard returns 403. |
| T10 | Force refresh, existing vector, successful mocked V2 matching. | Text building and embedding worker counters remain zero. |
| T11 | Cache-save RPC resolves with an error object. | Fresh request succeeds and CACHE SAVE is logged. |
| T12 | Embedding input of 10,001 characters. | Throws `logger is not defined` before worker call. |
| T13 | Short valid input; worker returns an empty vector. | Error mentions undefined `embedding`; intended invalid-response diagnosis is lost. |
| T14 | Legacy frontend track-interaction payload with interaction_type=dismiss. | Backend validation rejects it before an interaction write. |
| T15 | Well-formed short input and a fixture 1536-dimensional worker vector. | Actual embedding client returns the vector successfully; universal generation-failure claim is disproved. |
| T16 | Invalid learner UUID. | Validation rejects it with 400 before matching. |
| T17 | GET request to the POST-only recommendation handler. | Handler rejects it with 405. |
| T18 | Existing learner with a missing vector and successful isolated dependencies. | Builder, worker, and persistence each run once; matching succeeds. |
| T19 | Target learner explicitly owned by the authenticated fixture subject. | Current route allows the request; self-access is a positive control. |
| T20 | Six same-key requests within the fixed local rate window. | Actual limiter permits five and rejects the sixth; another key remains allowed. |
| T21 | Empty V2 result followed by V1 error and successful generic fallback. | Exact RPC sequence is exercised; backend reports fallback=true and reason=match_error. |
| T22 | Valid text with no embedding service binding. | Actual binding lookup reports an API error rather than silently producing matching data. |
| T23 | Detailed core profile; all five related evidence queries return error objects. | Actual builder returns profile-only text without representing the query failures. |
| T24 | Fresh matching; dismissal query returns an error. | V2 receives an empty dismissal list and the result is returned without degradation provenance. |
| T25 | Dashboard skills query fails; matched preference fields remain present. | Request succeeds with score 60 rather than the fixture's full score 100, empty technical skills, and fallback=false. |
| T26 | One otherwise eligible job contains skills_required=[null]. | Entire dashboard recommendation request returns INTERNAL_ERROR, including valid candidates. |
| T27 | Local V2 signature plus thin external-job fixture; actual page Apply callback. | Thin data produces an internal application call without external redirect; hydrated control calls the redirect. |
| T28 | Cached request with limit='invalid-limit'. | Request succeeds with count=0 rather than rejecting invalid input. |
| T29 | Valid JSON body null. | Handler throws TypeError rather than returning its structured 400 validation result. |
| T30 | Both matching RPCs and the generic fallback RPC return errors. | Backend returns success with an empty array, fallback=true, and the original match_error reason. |
| T31 | Core learner query in text builder returns an error. | Builder rejects with INSUFFICIENT_DATA; control limits the partial-error finding. |

Permanent reproduction command, from the workspace root:

```bash
node audit-evidence/learner-job-recommendations/verify.cjs --assert-snapshot
```

The [recorded result](audit-evidence/learner-job-recommendations/verification-results.json) contains the fixture time, collection time, harness fingerprint, 133 input fingerprints, and environment: Node 22.22.3, TypeScript 5.5.3, Zod 3.24.0, and Supabase JS 2.57.4. The [revision 2.0 evidence record](audit-evidence/learner-job-recommendations/v2.0-verification-results.json) is retained separately. Every local SQL migration is included so new migrations invalidate earlier absence claims. Snapshot mode refuses changed source, dependency/runtime versions, or harness contents. Fingerprints are consistency checks, not an external signature or proof that the bundle cannot be altered.

The runner fixes application time to October 12 for repeatable recency/throttle assertions, prints JSON, performs no network requests, and writes no files. The suite is **characterization evidence**: its defect assertions should fail when corresponding behavior is repaired. Updating the baseline requires reviewing the changed behavior; changing a hash or expected value merely to regain a pass is not a valid closure.

It is not a production test suite or browser end-to-end test. Harness setup errors caused by missing VM globals/dependency mappings were corrected before the successful run; they were not classified as application defects. Tests stop on failed assertions or unexpected dependencies.

## 10. Suggested remediation order and acceptance criteria

These are recommendations only; implementation was not requested or performed in this audit.

| Order | Work | Acceptance criteria |
|---|---|---|
| 1 | Resolve/authorize target learner and enforce matching access. | Self-access succeeds; unauthorized target fails before cache/computation; entitlement policy is identical across API and UI. |
| 2 | Align published-job selection and displayed scoring. | Open active unexpired jobs are eligible; unavailable jobs are excluded; API threshold is preserved; overall score and similarity are clearly distinguished; fallback has no invented percentage. |
| 3 | Complete cache freshness and mutation refresh. | A deadline crossing, dismissal, availability change, or relevant profile/evidence edit produces current results without an unrelated navigation action. |
| 4 | Repair embedding client failure paths and regeneration. | Short valid text succeeds; long text truncates successfully; original provider/binding errors survive; changed evidence updates both relevant vectors and result caches. |
| 5 | Verify and capture live SQL/background dependencies. | Exact V2/helper/V1 definitions, triggers, bindings, and schedules are recorded in migrations; successful matching is observed in the intended environment. |
| 6 | Improve cache observability and consolidate retained flows. | Returned RPC errors emit failure metrics; removed legacy code cannot be mistaken for the active pipeline; sample listings are visibly samples or replaced. |

For scoring, agree on a contract before implementation: what a percentage means, whether there is a minimum recommendation score, which evidence approval states are admissible, and whether already-applied jobs should remain visible.

## 11. Remaining live verification

To close the production-specific part of the investigation, obtain read-only evidence for:

1. Actual deployed learner columns and representative profile preference shapes.
2. Exact definitions of `match_opportunities_enhanced_v2`, `is_learner_fresher`, `match_opportunities_enhanced`, cache RPCs, and attached triggers.
3. Current cache rows, TTL/invalidation behavior, and recommendation responses for controlled learners before and after a skill edit and deadline crossing.
4. Whether existing vectors use a consistent embedding model, dimension, and source-data version; the provider code currently requests a 1536-dimensional vector, but stored vector provenance was not checked.
5. Embedding service bindings, legacy backfill outcomes, queue processing, and scheduling.
6. Matching entitlement policy and behavior for an allowed and disallowed test account.
7. Browser account-switch behavior for section-dismissal storage and actual mutation-driven refetches.

No secrets, personal learner records, production tokens, external messages, or production writes are included in this audit. Deployment-dependent conditions remain explicitly unverified until the corresponding live evidence is collected.

## 12. Threat model and trust boundaries

The attacker considered for C01 is a verified authenticated application user who can send a valid request and knows a target learner UUID. The audit does not demonstrate UUID discovery or assume unauthenticated access. The assets are learner-derived recommendation results, matching entitlements, recommendation/embedding cache state, and computation resources.

| Boundary | Input / authority | Expected control | Observed condition |
|---|---|---|---|
| Browser → SSO-authenticated API | Session/token and client request body. | Authenticate the caller, apply applicable browser security controls, and verify email. | Application wrapper verifies email; SSO token verification and browser CSRF enforcement are provider-level dependencies not exercised by the fixture suite. |
| Authenticated identity → selected learner | Client `learnerId` is a selector, not authority. | Resolve subject-to-learner ownership or an explicit delegated permission. | C01: the career matching route does not resolve this relationship before cache reads/computation. Dashboard GET correctly resolves `user_id`. |
| UI purchase gate → backend computation | UI gate reports `ai_job_matching` access. | Backend applies the same feature policy. | C02: gate exists on one UI surface, but the matching API has no corresponding entitlement check. |
| Application → service-role database client | Service key is supplied by the server environment. | Complete caller/target authorization before privileged queries. | Service-role factory is present; its existence is not itself a defect. Missing authorization is the boundary failure. |
| Current database → cached recommendation JSON | Snapshot contains jobs and matching values. | Preserve per-job availability and user feedback across cache lifetime. | C06/R02: TTL and profile checks do not independently establish current per-job availability. |
| Profile/evidence → external embedding provider | Builder serializes selected profile and evidence text. | Correct ownership, consistent evidence policy, a versioned input contract, and governed provider processing. | C07/R03 concern input freshness. Provider data-governance terms and existing vector lineage were not evaluated. |
| Backend metrics → learner-facing labels | Similarity, weighted score, fallback marker. | A label accurately names its metric and provenance. | C04/C05: threshold and provenance are lost or overridden. |

The builder includes name, age, gender, institution, location, and interests when present. Their inclusion in semantic input is established by [builder source, L166–212](skillpassport/functions/api/embedding/services/textBuilder.ts); discriminatory outcomes are **not** established. Whether these fields are necessary and permitted for job ranking is a product/data-governance decision and a quality-evaluation requirement.

C01 maps to the object-level authorization pattern in [OWASP API1:2023](https://api-security.owasp.org/editions/2023/en/0xa1-broken-object-level-authorization/): authenticated access to an endpoint does not establish permission for a client-selected object. The resource-control review is informed by [OWASP API4:2023](https://api-security.owasp.org/editions/2023/en/0xa4-unrestricted-resource-consumption/), but the local rate limiter is present, and this report does not claim that all consumption is unrestricted. These are targeted mappings, not a complete OWASP assessment or certification.

## 13. Risk rationale and control coverage

### 13.1 Rating method

Ratings separate **impact**, **exposure/preconditions**, and **evidence confidence**. They are qualitative engineering priorities. No CVSS score, quantitative loss estimate, or production incident probability is assigned without the data needed to support it.

- **High:** a demonstrated source path crosses an intended identity boundary, or a primary published-job selection contract is contradicted in a way that can broadly alter the feed.
- **Medium:** a demonstrated active path affects feature policy, learner-facing integrity, or freshness under identifiable conditions.
- **Low:** an operational diagnostic issue or noncritical behavior whose direct consequence is narrower.
- **Conditional:** a SQL/environment claim awaiting current deployment confirmation; it is not merged into the confirmed-source defect count.

These are audit priorities, not mathematically comparable damage scores. In particular, C03's High priority describes a core product correctness failure, while C01's High priority describes authorization risk. They should not be interpreted as identical security severity.

| Finding | Impact and precondition | Confidence / coverage | Proposed responsible role |
|---|---|---|---|
| C01 | Access to another target's derived recommendations; verified caller plus known target UUID. | High for source boundary; no live exploitation test. | Backend/security engineering. |
| C02 | Matching access can differ from the advertised paid-feature contract; authenticated caller. | High for absent API check; product entitlement policy needs approval. | Backend + subscription product owner. |
| C03 | Available open jobs are missed; active-status unavailable rows can be ranked. | High for selection semantics; production row prevalence unknown. | Opportunities backend + product owner. |
| C04 | Low-score candidates receive a stronger recommendation label. | High for mapping; no browser screenshot assertion. | Learner frontend. |
| C05 | Learner sees a different metric from ranking and synthetic fallback percentages. | High for transformation; no hiring-outcome calibration measured. | Matching backend/frontend contract owner. |
| C06 | A previously eligible job can stay visible after its deadline or feedback changes. | High for return ordering; deployed invalidation coverage conditional. | Database + matching backend. |
| C07 | UI/refetch and vector version can lag relevant edits. | High for dependency list/force-refresh semantics; external regeneration unverified. | Learner frontend + embedding pipeline owner. |
| C08 | Long inputs or selected failure paths produce wrong errors and fallback. | High for reproduced branches; provider success is covered by a control. | Embedding integration owner. |
| C09 | Cache persistence failures can be invisible while fresh results succeed. | High for returned-error handling; actual database failure rate unknown. | Backend/observability engineering. |
| C10 | Partial evidence or feedback reads can alter ranking/filtering while being presented as valid empty data. | High for exercised code branches; outage prevalence and recovery writers unknown. | Matching/embedding backend + observability engineering. |
| C11 | One malformed stored job can fail the entire dashboard recommendation request. | High for reproduced input; malformed production rows not established. | Opportunity ingestion + matching backend. |
| L01 | Legacy client cannot persist its interaction payload. | High for defect; active consumer exposure not established. | Owner of retained legacy code. |
| R01–R05 | Missing scoring inputs, stale evidence, incomplete dependencies, or thin job details if live state matches local evidence. | Conditional on deployment inventory and RPC return contract. | Database/embedding/opportunity owners; deployment verification first. |

Role suggestions do not represent actual assignments. Named owners, target dates, and approved risk acceptance must be filled in by the project team.

### 13.2 Coverage by control domain

| Domain | What was established | What remains outside the evidence |
|---|---|---|
| Authentication | Real wrapper blocks an unverified fixture identity; invalid UUID/method rejected. | Cryptographic JWT/session validation, cookie/CSRF behavior, logout revocation, external SSO uptime. |
| Object authorization | Supplied-target path reaches the privileged recommendation handler without owner lookup; self-access control passes. | Current production access control outside inspected code; unknown UUID-discovery paths. |
| Feature authorization | Matching API does not call the feature check; UI gate inspected. | Authoritative commercial policy and actual account entitlement state. |
| Scoring integrity | Rules, transformations, flag overwrite, and fallback provenance traced/reproduced. | Relevant-job ground truth, statistical quality, acceptance by learners/recruiters. |
| Freshness | Existing-vector reuse and snapshot-return ordering reproduced; SQL inputs inspected. | Deployed triggers, background consumers, browser refetch timing, race/concurrency behavior. |
| Provider robustness | Valid short response, missing binding, long input, and malformed response covered. | Provider network retries/latency/error frequencies and stored-model migration history. |
| Throttling | Local five-request window exercised. | Cross-instance/global limits, load/cost envelope, concurrent contention. |
| Observability | Cache-save error object can be ignored; misleading success log reproduced. | Production dashboards, retention, alerts, telemetry sampling, operational incident history. |
| Partial failures / malformed data | Related-query failures, missing dismissals, failed fallback, null skill elements, and invalid request shapes exercised. | Actual production data distributions and approved graceful-degradation policy. |
| Recommendation → Apply contract | Thin V2 fields and actual Apply callback exercised, with hydrated control. | Browser behavior, real employer redirect/submission, deployed RPC projection, full application security review. |

No pass/fail claim is made for an untested domain. Mock boundaries and SQL-inspection coverage remain visible even when the source-level conclusion is strong.

## 14. Closure criteria, residual risk, and validation handoff

### 14.1 Definition of finding closure

Each finding should close only when a reviewer has the final source diff, relevant passing acceptance tests, the applicable deployed version/configuration, and any required product-policy decision. A screenshot, a changed label, or a new cache timestamp alone is insufficient for underlying authorization or freshness findings.

| Finding group | Required acceptance evidence | Residual risk after the narrow fix |
|---|---|---|
| C01 | Unauthorized A→B fails before database/cache/provider side effects; valid A→own learner succeeds; explicitly authorized delegated access is separately tested if supported. | Other learner endpoints were not comprehensively security-audited. |
| C02 | Allowed/disallowed accounts follow one documented matching policy across dashboard, My Skills, Opportunities, and direct API requests. | Broader subscription enforcement outside matching remains out of scope. |
| C03/C04 | Fixtures cover open/closed/inactive/expired jobs and zero/low/high scores; displayed flags agree with the approved scoring contract. | A finite candidate cap can still reduce relevant-job recall. |
| C05 | Weighted score and similarity have distinct labels; absent/zero values are handled intentionally; generic fallback carries its provenance and no invented percentage. | A mathematically correct score can still be a poor job-ranking signal. |
| C06/C07/R02/R03 | Time-boundary and mutation tests cover skill addition/removal, certificate expiry/approval, project changes, opportunity availability, and dismissal; vector/cache versions change when the dependency changes. | Distributed races and out-of-order workers need explicit consistency tests. |
| C08 | Normal response, long-input truncation, missing binding, provider error, and malformed response preserve the intended error contract and correct fallback behavior. | External provider availability/cost remains an operational dependency. |
| C09 | A returned RPC error yields an accurate persistence-failure metric and no false success log; optional cache failure does not discard valid fresh matches. | Cache store performance/availability still needs environment measurements. |
| C10 | Required evidence failures cannot silently replace a healthy vector; unavailable feedback and failed fallback are distinct from valid empty data; partial results carry explicit provenance. | External outages and policy decisions still require recovery monitoring. |
| C11 | Stored/ingested skill types are validated; a malformed candidate cannot unexpectedly take down valid recommendations; legacy supported representations are normalized. | New data formats and import paths require the same contract. |
| R01/R04/R05 | Current catalog outputs and deployment identifiers resolve field/function/trigger/binding/return-contract assumptions; required job detail fields survive recommendation → preview → apply. | Configuration drift and downstream employer behavior remain dependencies. |
| L01 | Retire the unused path, or prove its retained consumer and repaired request/authorization/invalidation contract. | Unused duplicate code can continue to confuse maintenance until removed. |

### 14.2 Production verification protocol

The supplied [catalog SQL](audit-evidence/learner-job-recommendations/read-only-verification.sql) opens a READ ONLY transaction, reads function/trigger/column metadata, and rolls back. It deliberately does not call application RPCs or read learner records. Record the intended environment, deployment identifier, collection time, connection role, and the exact outputs for R01–R04. Do not paste credentials or sensitive cron command text into the report.

Behavioral verification is separate. Recommendation POST can store embeddings/cache data, and authentication self-heal can create or repair records. Such calls are not read-only probes. Use approved controlled accounts and an intended test environment for A→B authorization, entitlement, mutation, and cache-lifecycle scenarios. These activities were not performed during this source audit.

The deployment handoff should include a ledger with `finding ID`, `owner`, `environment/build`, `evidence reference`, `decision`, `remaining risk`, `reviewer`, and `review date`. Leave unknown fields explicitly pending; do not fabricate sign-off.

### 14.3 Recommendation-quality evaluation required for product assurance

Correct filtering and accurate labels are necessary, but they do not establish that the system recommends good jobs. Use a representative, consented or synthetic evaluation set with reviewer-defined relevance and eligibility labels. Evaluate each feed separately before deciding whether to consolidate them.

| Quality dimension | Evaluation | Decision needed |
|---|---|---|
| Ranking relevance | Precision@3 and NDCG@3 on labeled learner/job pairs; compare against a newest-job and simple skill-overlap baseline. | Minimum acceptable quality and material improvement over baselines. |
| Candidate recall | Measure relevant jobs lost by newest-50/newest-100/vector candidate caps. | Whether caps need widening or a different retrieval strategy. |
| Eligibility precision | Count recommendations violating hard requirements using the approved job/learner eligibility rules. | Which conditions are hard exclusions versus advisory gaps. |
| Coverage / fallback | Measure empty-feed rate, fallback rate, and successful personalization across representative profile completeness levels. | Acceptable fallback behavior and honest presentation. |
| Freshness | Measure time from a controlled profile/job change to vector/cache/UI update. | Freshness target and responsibility for each pipeline stage. |
| Stability | Repeat identical inputs; examine ranking changes after small relevant and irrelevant edits. | Expected deterministic behavior versus acceptable model variability. |
| Fairness / data necessity | Review whether name, age, gender, or institution should enter ranking; conduct approved counterfactual/cohort checks. | Permitted inputs, legitimate evaluation cohorts, and escalation criteria. |
| Performance / cost | Measure warm-cache and cold-compute latency percentiles, provider calls, cache hit rate, and cost under an approved load profile. | Service/cost targets; these were not inferred from isolated tests. |

No numeric threshold is invented here. Use product requirements and representative measurements; report sample sizes, uncertainty, and disagreement between reviewers. Raw semantic similarity is not calibrated as a probability of placement or hiring success.

## 15. Document control and evidence integrity

| Revision | Change | Assurance change |
|---|---|---|
| 1.0 | Initial detailed source audit, false-positive correction table, 14 temporary checks. | Source-level findings only; live environment unresolved. |
| 2.0 | Permanent suite, 22 checks, 130 input fingerprints, read-only catalog script, threat/risk/coverage/closure models. | Stronger reproducibility and controls; no additional production assurance implied. |
| 2.1 | Partial-failure and malformed-job findings, thin-V2 Details/Apply contract risk, request-shape checks; 31 checks and 133 input fingerprints. | Broader source/callback coverage; live database and browser assurance still open. |

The machine-readable result is the reference for exact runtime versions and input SHA-256 values. The report's source labels identify the relevant function/line at the audited snapshot; after edits, use fingerprints and function names rather than assuming line numbers remain stable. The workspace root contains the report/evidence bundle; no commit or external publication was performed.

Final disposition: **source audit complete, remediation and production validation open**. Confirmed findings retain bounded claims; intentional behavior, legacy relevance, and environment assumptions remain separate. Formal approval requires the project team's reviewed evidence and risk decisions, not an adjective attached to the report.
