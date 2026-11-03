# Recommendation release evidence and remaining acceptance

Updated 29 October 2026. Local implementation is ready for review; release acceptance is **open**. The local application and LTE databases were migrated after verification; no remote database or deployment was changed. See the [local migration report](./LOCAL_MIGRATION_REPORT.md).

## Local implementation

| Area | Implemented | Evidence / remaining limit |
| --- | --- | --- |
| Preferences | Owned storage, revision-guarded authenticated save, stale-write rejection, validation, Settings → Career preferences, explicit required/soft choices and context sources enabled by default, respecting saved opt-outs | API/form tests cover background refresh, draft conflicts, explicit reload and detached saves; disposable SQL covers ownership, privileges, stale creation/update rejection and opt-out preservation. No assumed learner preference columns. |
| Producer refresh | Existing acknowledged-save bridge, canonical feedback/application acknowledgments, cross-tab notifications, actor/org/learner metadata query every 30 seconds while visible, on focus/reconnect | Unchanged revisions do not regenerate; server-side approval changes reset matching active/inactive result scopes. Requires new database triggers/functions. |
| Assessment | Enabled-by-default latest completed assessment, respecting saved opt-outs, bounded curated role examples, inferred-intent labels | No personality, assessment scores, raw responses or inferred skill claims enter vector text or readiness evidence. |
| LTE | Signed bounded evaluated-achievement summary, maximum 50 selected completed levels, current authoritative qualification policy, truncation flag | Service boundary tests and SQL selection/projection fixture. SQL fixture represents the existing verifier with a stub; it is not a restoration/test of the complete LTE database. |
| Source freshness | Only a dependency hash is stored locally. Changed learning approvals/policy/content invalidate recommendation revisions. Local source fences surround reads and final response publication. | Runtime context-change and disposable SQL checks; live cross-service revocation remains a signed-in acceptance case. |
| Candidate/ranking policy | Shared deterministic evidence ordering and structured source-labelled reasons. Required preferences, applications and dismissals are excluded before SQL candidate limits. | SQL executes both semantic and dashboard candidate paths; exact skill/location controls. Generic location, employment, work-mode or department preferences alone cannot admit an unrelated job. General-skill overlap cannot replace unmatched specialist requirements; approved soft-skill types supplement a bounded list of common general skills. Evaluated-learning relevance and boosts require the learning setting to be enabled; application eligibility remains independently checked. Ordering is a conservative policy proposal, not calibrated quality. |
| UI state | No additional Zustand server cache; widget dismissal scoped by actor/org/learner | Existing authentication stores and QueryClient lifecycle retained. |
| Evaluation | Reproducible synthetic persona comparison and local pure-ranking benchmark | [Diagnostic report](./LOCAL_RELEVANCE_EVALUATION.json). Twelve agent-authored scenarios are not a blinded human-labelled holdout. |

## Local verification

- 416 recommendation tests across 14 files pass in an isolated run. The full LTE suite passes 1,850 tests with one skipped, including the 17 signed summary/qualification checks.
- Full application suite: 2,840 passed, 168 failed, four skipped, with one runner timeout. All 39 failing files and all current failure headings reproduce against committed source; the timeout also reproduces. Application lint has 10,879 errors and 6,641 warnings. These broader checks are not clean; see the [local test report](./LOCAL_TEST_REPORT.md).
- Five Chrome preference scenarios pass with real components/QueryClient and isolated HTTP/auth fixtures. This does not replace signed-in acceptance.
- Disposable PostgreSQL checks pass for owned context, preference writes, semantic/dashboard exclusions before limits, source/dependency invalidation, summary bounds and privacy.
- Application production build and both local Pages Functions bundles pass, with existing warnings.
- No introduced type diagnostics: frontend 7,976 → 7,971; backend 6,912 → 6,912. Whole-repository type checks are not clean.
- LTE frontend type check, ESLint and CSS lint pass. Changed LTE TypeScript files previously passed the repository's Biome formatting/import check. Both knowledge graphs were refreshed after code edits.

## Migration and deployment order

1. Identify the development site, Cloudflare Pages project/environment and actual Supabase project. The checked-in default points to production; the writable connector is localhost. Neither establishes the requested development target. The read-only remote ledger inspected during this continuation still ends at `20270120000000`.
2. Reconcile the already observed jobs-only ledger/function discrepancy. Verify live function bodies and deployment provenance rather than blindly replaying history.
3. Take the required backup, verify restore, and dry-run the exact release against a restored development copy.
4. Confirm existing prerequisites, including [jobs-only matching](../../../supabase/migrations/20270121000000_jobs_only_recommendations.sql), then apply the reviewed forward application migrations in order:
   - [Context revisions](../../../supabase/migrations/20270122000000_recommendation_context_revisions.sql).
   - [Career preferences](../../../supabase/migrations/20270123000000_learner_career_preferences.sql).
   - [Candidate filters and producer triggers](../../../supabase/migrations/20270124000000_recommendation_candidate_filters.sql).
   - [Learning dependency hashes](../../../supabase/migrations/20270125000000_recommendation_learning_dependency.sql).
   - [Owned profile/catalogue freshness](../../../supabase/migrations/20270126000000_recommendation_freshness.sql).
   - [Preference compare-and-save](../../../supabase/migrations/20270127000000_career_preferences_concurrency.sql), which removes the unguarded v1 writer. Apply before the matching API/client; saves require the current UUID token (null only for first creation).
5. Apply the [LTE bounded-summary migration](../../../../lte/supabase/migrations/20261022105000_recommendation_learning_summary.sql) after its existing authoritative qualification migration and deploy the LTE endpoint before enabling verified-learning preferences. The new endpoint retains `LTE_INTERNAL_SECRET` and the existing method/path/body signature contract.
6. Deploy the matching API and migrated client together. Current preprocessing is `learner-text-7-default-career-context`; matching policy identity is `semantic-ranking-8-context-defaults`; shared ordering is `evidence-order-4`; readiness is `career-readiness-4`.

Missing schema or an opted-in external-source outage is unavailable, never an empty profile or silently ignored required preference. Old preprocessing/ranking identities must not be re-labelled current.

## Signed-in acceptance required

- Sparse learner, education/project-only fresher, approved-skill learner and opted-in evaluated-learning learner; exact expected readiness and separate eligibility.
- Save preferences; verify persisted values after reload, required/soft behavior, account changes while saving, and no preference visibility in another account. From two sessions, opt out of learning context and confirm an older draft cannot restore the opt-in; explicitly reload before retrying.
- Change/revoke an approved source from another session. Verify source revision refresh, inactive caches, multiple tabs, and one shared request for duplicate observers.
- Revoke learning approval or change its policy/content during generation; verify obsolete work is rejected and existing application verification remains authoritative.
- Apply/dismiss from each entry point; verify exclusion before candidate limits and correct user-ID/learner-ID namespaces.
- Shared SSO token refresh, denied/restored entitlement, user and organization transitions, cancelled late responses, 409 restart, 429 cooldown and bounded 202 handling.
- Observe HTTP p50/p95, database load, actual embedding/provider calls and cost at representative concurrency. The local pure-ranking benchmark does not measure these.

## Relevance and release gates

Obtain a separate blinded, independently human-labelled holdout with persona and industry coverage. Evaluate recall, nDCG/precision, sparse/fresher behavior and explanation faithfulness; justify or revise thresholds/feature priorities from that evidence. The synthetic report deliberately sets `releaseAcceptance=false`.

Rehearse rollback on the restored copy. Keep the additive tables/revision guards and current truthful readiness enforcement; do not roll back to unsafe length-only matching. Preserve prior deployment artifacts and compatible client/API pairs. Record migration ledger, function definitions, deployment hashes, provider configuration and acceptance outcomes before broader release.

These remaining gates require a confirmed development target, a signed-in test environment and independent relevance labels. They cannot be completed by passing local fixtures alone.
