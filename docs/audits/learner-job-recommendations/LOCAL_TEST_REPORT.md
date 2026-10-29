# Local recommendation verification — 29 October 2026

The recommendation regression suite, full LTE suite, SQL assertions, production builds and local preference browser checks pass. The complete application suite and application lint are not clean. No application database migration, deployment or remote write was performed. No application source code was changed during this validation.

## Results

| Check | Result |
| --- | --- |
| Full application Vitest run | 267 files: 228 passed, 39 failed. 2,840 tests passed, 168 failed, four skipped. One unhandled worker RPC timeout means this run is not clean. |
| Isolated recommendation Vitest run | 398 tests across 14 files passed; no runner errors. This is a subset of the application suite, not an additional 398 unique tests. |
| Full LTE Vitest run | 236 files passed; 1,850 tests passed and one skipped. Includes signed summary and qualification regressions. |
| New recommendation PostgreSQL checks | Pass: owned revision reads, source changes/expiry, preference ownership/privileges, stale creation/update rejection, opt-out preservation, pre-limit candidate exclusions and bounded LTE summary projection. |
| Existing recommendation PostgreSQL checks | Pass: cache/model/preprocessing/ranking isolation, stale publication, verified job-vector provenance and jobs-only catalogue/index behavior. |
| Chrome preference checks | Five scenarios passed; no uncaught page errors. Real preference component and QueryClient with test auth/HTTP fixtures, not a signed-in application journey. |
| Application and LTE production builds | Both pass; existing application circular import/chunk warnings remain. |
| Application and LTE Pages Functions bundles | Both compile locally. LTE is built with the configured compatibility date and `nodejs_compat`. |
| Application frontend diagnostic comparison | 7,976 committed baseline → 7,971 current; no introduced diagnostics. Not a clean repository type check. |
| Application backend diagnostic comparison | 6,912 → 6,912; no introduced diagnostics. Not a clean repository type check. |
| LTE frontend type check | Pass. |
| Application lint | Fails: 10,879 errors and 6,641 warnings. These counts describe the current repository; lint was not baseline-compared. |
| LTE lint | ESLint and CSS checks pass. |
| Synthetic ranking diagnostics | Seven agent-authored scenarios rerun. The location-only unrelated candidate is excluded. These do not establish independently measured relevance or release acceptance. |

## Baseline comparison of application failures

All 39 failing application files also fail against a scratch copy of committed application source using the same installed dependencies. Every failure heading reported by the current run reproduced on that baseline; no current-only failure heading remained. The worker `onTaskUpdate` timeout also reproduced on committed source. This distinguishes the observed failures from newly introduced recommendation failures; it does not repair or dismiss them.

The first baseline run lacked a sibling repository link for the email-verification integration test. After restoring that link, the file ran and reproduced the same five failing tests and one passing test as the working tree. The comparison uses the currently installed dependencies and sibling repositories, not a historical dependency restoration.

The failing files include old import/collection tests, storage handler/error contracts, auth/role/guard sweeps, assessment/course expectations, email-verification integration and attendance/navigation tests. Historical bug-exploration tests are included by the repository's default test discovery. Their failures remain recorded rather than being removed from discovery to obtain a green result.

| Failing application file | Committed-source comparison |
| --- | --- |
| [.kiro/specs/missing-imports-fix/bug-condition-exploration.property.test.js](../../../.kiro/specs/missing-imports-fix/bug-condition-exploration.property.test.js) | Failure reproduced |
| [.kiro/specs/missing-imports-fix/preservation.property.test.js](../../../.kiro/specs/missing-imports-fix/preservation.property.test.js) | Failure reproduced |
| [functions/__tests__/email-verification-sync.test.ts](../../../functions/__tests__/email-verification-sync.test.ts) | Failure reproduced |
| [functions/__tests__/logout.test.ts](../../../functions/__tests__/logout.test.ts) | Failure reproduced |
| [functions/__tests__/property/shared-utilities.property.test.ts](../../../functions/__tests__/property/shared-utilities.property.test.ts) | Failure reproduced |
| [functions/api/storage/handlers/__tests__/certificate.test.ts](../../../functions/api/storage/handlers/__tests__/certificate.test.ts) | Failure reproduced |
| [functions/api/storage/handlers/__tests__/document-access.test.ts](../../../functions/api/storage/handlers/__tests__/document-access.test.ts) | Failure reproduced |
| [functions/api/storage/handlers/__tests__/extract-content.test.ts](../../../functions/api/storage/handlers/__tests__/extract-content.test.ts) | Failure reproduced |
| [functions/api/storage/handlers/__tests__/list-files.test.ts](../../../functions/api/storage/handlers/__tests__/list-files.test.ts) | Failure reproduced |
| [functions/api/storage/handlers/__tests__/payment-receipt.test.ts](../../../functions/api/storage/handlers/__tests__/payment-receipt.test.ts) | Failure reproduced |
| [functions/api/storage/utils/__tests__/error-handling.test.ts](../../../functions/api/storage/utils/__tests__/error-handling.test.ts) | Failure reproduced |
| [functions/api/teaching/__tests__/actions.test.ts](../../../functions/api/teaching/__tests__/actions.test.ts) | Failure reproduced |
| [functions/lib/__tests__/sync-handler.transport.test.ts](../../../functions/lib/__tests__/sync-handler.transport.test.ts) | Failure reproduced |
| [src/__tests__/bugfix/compileErrors.bugCondition.test.ts](../../../src/__tests__/bugfix/compileErrors.bugCondition.test.ts) | Failure reproduced |
| [src/__tests__/bugfix/functionsEnforcementBoundary.bugCondition.test.ts](../../../src/__tests__/bugfix/functionsEnforcementBoundary.bugCondition.test.ts) | Failure reproduced |
| [src/__tests__/bugfix/shadowStoreRoleResolution.bugCondition.test.ts](../../../src/__tests__/bugfix/shadowStoreRoleResolution.bugCondition.test.ts) | Failure reproduced |
| [src/__tests__/bugfix/typeFragmentationAndPhantomRoles.bugCondition.test.ts](../../../src/__tests__/bugfix/typeFragmentationAndPhantomRoles.bugCondition.test.ts) | Failure reproduced |
| [src/__tests__/bugfix/verifyEmailRedirect.property.test.ts](../../../src/__tests__/bugfix/verifyEmailRedirect.property.test.ts) | Failure reproduced |
| [src/__tests__/integration/addOnPurchaseFlow.test.js](../../../src/__tests__/integration/addOnPurchaseFlow.test.js) | Failure reproduced |
| [src/__tests__/property/environment-specific-configuration.property.test.ts](../../../src/__tests__/property/environment-specific-configuration.property.test.ts) | Failure reproduced |
| [src/__tests__/property/environment-variable-accessibility.property.test.ts](../../../src/__tests__/property/environment-variable-accessibility.property.test.ts) | Failure reproduced |
| [src/__tests__/property/file-based-routing.property.test.ts](../../../src/__tests__/property/file-based-routing.property.test.ts) | Failure reproduced |
| [src/__tests__/property/import-export-mismatch.property.test.ts](../../../src/__tests__/property/import-export-mismatch.property.test.ts) | Failure reproduced |
| [src/__tests__/rbac/featureEnforcement.deny.test.ts](../../../src/__tests__/rbac/featureEnforcement.deny.test.ts) | Failure reproduced |
| [src/__tests__/rbac/guardPresence.property.test.ts](../../../src/__tests__/rbac/guardPresence.property.test.ts) | Failure reproduced |
| [src/__tests__/rbac/jwtOnlyResolution.property.test.ts](../../../src/__tests__/rbac/jwtOnlyResolution.property.test.ts) | Failure reproduced |
| [src/__tests__/services/assessmentService.validation.test.js](../../../src/__tests__/services/assessmentService.validation.test.js) | Failure reproduced |
| [src/__tests__/services/careerAssessmentAIService.test.js](../../../src/__tests__/services/careerAssessmentAIService.test.js) | Failure reproduced |
| [src/__tests__/services/geminiAssessmentService.test.js](../../../src/__tests__/services/geminiAssessmentService.test.js) | Failure reproduced |
| [src/features/assessment/api/__tests__/assessmentIntegration.test.ts](../../../src/features/assessment/api/__tests__/assessmentIntegration.test.ts) | Failure reproduced |
| [src/features/assessment/api/__tests__/assessmentResultTransformer.test.js](../../../src/features/assessment/api/__tests__/assessmentResultTransformer.test.js) | Failure reproduced |
| [src/features/assessment/lib/__tests__/employabilityCalculator.test.js](../../../src/features/assessment/lib/__tests__/employabilityCalculator.test.js) | Failure reproduced |
| [src/features/assessment/ui/__tests__/courseCardDataCompleteness.property.test.tsx](../../../src/features/assessment/ui/__tests__/courseCardDataCompleteness.property.test.tsx) | Failure reproduced |
| [src/features/courses/api/__tests__/embeddingConsistency.property.test.ts](../../../src/features/courses/api/__tests__/embeddingConsistency.property.test.ts) | Failure reproduced |
| [src/features/educator/ui/__tests__/Sidebar.assigned-teaching.test.tsx](../../../src/features/educator/ui/__tests__/Sidebar.assigned-teaching.test.tsx) | Failure reproduced |
| [src/features/subscription/__tests__/ReceiptComponents.test.jsx](../../../src/features/subscription/__tests__/ReceiptComponents.test.jsx) | Failure reproduced |
| [src/features/subscription/__tests__/subscription-validation.test.ts](../../../src/features/subscription/__tests__/subscription-validation.test.ts) | Failure reproduced |
| [src/pages/admin/collegeAdmin/__tests__/Attendancetracking.test.tsx](../../../src/pages/admin/collegeAdmin/__tests__/Attendancetracking.test.tsx) | Failure reproduced |
| [src/shared/model/__tests__/stores.test.ts](../../../src/shared/model/__tests__/stores.test.ts) | Failure reproduced |

## Browser coverage and fixture corrections

Chrome exercised a clean form adopting another session's learning opt-out before saving unrelated edits; a dirty draft blocked by a new revision; an unseen HTTP 409 followed by explicit reload and a successful save; a refresh failure retaining the draft; and a detached save finishing after cache clearing without repopulation or a saved event.

Two scratch browser-harness problems were corrected: its auth alias initially resolved the real unsigned session, and a button locator continued looking for the old label after it changed to “Saving…”. Neither required an application change. The independent legacy SQL fixture also needed its service-role grant and removal of seed rows between separate catalogue-count assertions. The original SQL assertions were retained and passed after those setup corrections.

## Reproduction and limitations

Run from the application root:

```sh
node node_modules/vitest/vitest.mjs run --reporter=dot
node scripts/checks/test-recommendation-context-sql.mjs
npm run build
npm run lint
```

Run from the LTE root:

```sh
node node_modules/vitest/vitest.mjs run --reporter=dot
npm run build
npm run typecheck
npm run lint
node node_modules/wrangler/bin/wrangler.js pages functions build --compatibility-date=2026-06-08 --compatibility-flags=nodejs_compat --outdir /tmp/lte-local-functions-check
```

SQL runs use newly created disposable fixture databases in the existing local PostgreSQL container and remove them afterward. They are not a full restoration of either application database. LTE summary projection stubs the existing qualification engine; the actual qualification service is covered separately by the LTE tests. Browser fixtures do not prove real SSO refresh, entitlements, signed-in cross-service revocation or real provider behavior. Independent relevance labels, real operational measurements and rollout rehearsal remain open in the [release checklist](./RELEASE_CHECKLIST.md).

## Subsequent specificity/consent fix verification

After the full-suite snapshot above, two further ranking defects were reproduced and corrected. Fifteen new regression/control cases were added; twelve failed before the corrections. The focused ranker/context suite now passes 77 tests; the complete recommendation subset passes **413 tests across 14 files**, with no runner errors. Application production and API bundle builds pass. The diagnostic evaluation now has twelve synthetic scenarios under `evidence-order-3`; it remains unsuitable as independent release evidence. General-skill-only roles, genuine specialist matches and opted-in learning remain supported, while learning opt-out does not change application eligibility checks. The broad application and LTE suite counts above are historical results from before this fix; they were not rerun for these changes. No new SQL migration or remote deployment was performed.

Final specificity/consent verification: frontend 7,976 → 7,971; backend 6,912 → 6,912; no introduced diagnostics. Existing repository type errors remain. The application knowledge graph was refreshed, local documentation links resolve and the CRLF-aware diff check passes.

## Additional career context enabled by default

At the user's request, both assessment suggestions and evaluated LTE learning now default to enabled when no value has been saved. Explicit stored false values are preserved in API reads, context collection, form rendering and unrelated saves. Existing opt-outs are not overwritten or backfilled. Fixtures for evidence-only tests now declare their saved opt-outs; a separate no-preferences case checks that both default sources are read. UI and API controls verify the checked defaults and saved opt-outs.

Preprocessing is `learner-text-7-default-career-context`, ranking identity is `semantic-ranking-8-context-defaults`, shared ordering is `evidence-order-4`. The version changes prevent reuse of results collected under the previous defaults. No SQL migration or user-record update is needed.

Default-setting verification: all 416 recommendation tests across 14 files pass; application production and local API bundle builds pass with existing warnings. Evidence-outage fixtures explicitly disable external sources and assert the intended failing table is reached, preventing an LTE fixture configuration error from masking the failure under test. No user records were changed. Full repository type/lint checks were not rerun for this boolean-default/version change; earlier baseline results remain historical.
