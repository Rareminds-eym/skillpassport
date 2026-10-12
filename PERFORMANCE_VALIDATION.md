# Learner Settings: verified optimization results

Date: 2026-09-29. Scope: the staged learner-settings performance changes and the follow-up corrections in this working tree. No deployment was performed.

This report supersedes the numerical claims and deployment-readiness statements in the five earlier performance documents. Those documents are historical proposals, not measured results. In particular, the requests are not all sequential, controlled input updates must not be debounced, and adding `React.memo` does not establish a render-count reduction.

## Measured production artifacts

Both snapshots passed `npm run build`. The baseline was the user's staged working tree before the follow-up changes; the updated snapshot includes the corrections and optimizations below.

| Settings route static JavaScript dependency closure | Baseline | Updated |
| --- | ---: | ---: |
| JavaScript chunks | 19 | 11 |
| Uncompressed bytes | 7,467,579 | 5,782,871 |
| Sum of gzip bytes per chunk | 1,895,695 | 1,422,569 |

**Gzipped static dependencies decreased by 24.96% (473,126 bytes).** This includes shared vendor chunks. It is not a measured improvement in page-load time, interaction latency, or the complete application's initial download. Already-cached dependencies, the application shell, API timings, CSS, and dynamic imports affect browser results.

The emitted Academic, Certificates, Experience, Institution, Notifications, Privacy, Security, and ResumeParser chunks are absent from the settings route's static import closure. Other profile subtabs are also lazy-loaded. Removing unused public re-exports was necessary to make the optional tab imports effective; a focused settings public entry point avoids importing the entire widget barrel from the route. The other resume-parser caller was also converted to a lazy import.

To reproduce the artifact comparison after building both revisions into separate directories:

```bash
node scripts/audit-settings-bundle.mjs /tmp/skillpassport-before /tmp/skillpassport-final
```

## Runtime work removed

- Settings no longer mounts `useLearnerRealtimeActivities`, whose values it never rendered. This removes that instance's learner-ID lookup, two activity requests, six WebSocket subscriptions, and timestamp refresh interval. Successful saves and message notifications now invalidate the existing activity cache; mounted consumers still refresh.
- Institution options load only when Institution Details is opened. A user-scoped React Query cache shares fresh results for five minutes, deduplicates requests, and does not reuse another user's options. The assessment form retains the default eager behavior.
- The message callback retains its identity while typing, avoiding repeated subscription cleanup/setup.
- Personal Info no longer waits for unrelated collection loading. Collection tabs display placeholders until their data is ready, while the surrounding form remains mounted.
- Removed the duplicate native scroll listener; React's existing `onScroll` handles tab indicators.
- Replaced the accumulating save-timeout array with one cancellable timeout; starting a new save cancels the previous unlock timer.

These are source- and test-verified changes in work performed, not production network or CPU measurements.

## Correctness fixes

- Controlled inputs and textareas update immediately; rapid typing and immediate Save preserve every character.
- Guardian Info imports its state hook correctly.
- Pending experience edits preserve the verified snapshot's badge and the original fallback fields.
- Malformed certificate and experience dates render a fallback instead of throwing.
- Production `esbuild` options are configured at Vite's top level. Unused `console.log`, `console.debug`, and `console.info` calls are removed by minification; argument side effects and warnings/errors are retained. Development logging remains intact. This is not a blanket guarantee that no sensitive information can be logged.

## Validation

- **16 targeted tests passed** across input/save behavior, Guardian Info, verified experience, invalid dates, lazy navigation, drafts, loading isolation, subscription callback stability, activity-cache invalidation, institution loading/retry, auth readiness, and cache isolation.
- Command: `node node_modules/vitest/vitest.mjs run src/widgets/learner-dashboard/ui/settings/__tests__`
- Baseline and final full production builds passed. Existing large-chunk and circular-export warnings remain elsewhere in the application.
- A focused production build probe verified debug-call removal while preserving argument side effects and `console.warn`; the development config retained logging.
- `git diff --check` passed for the follow-up changes.

## Remaining performance questions

No authenticated browser profiling, real-user measurement, or full repository test suite was performed. There is no defensible claim here of “zero risk,” “80–90% faster,” or a specific reduction in re-renders.

The page still has separate profile/collection data sources, and large shared vendor chunks remain. Before consolidating those sources or changing global chunk boundaries, measure a cold authenticated navigation and a cached revisit with browser network/CPU traces, then verify fallback records, approval/versioning data, and mutation refresh behavior. Consolidation needs a defined response contract; deleting one hook because the data looks similar can lose fields or stale-record recovery.
