# Worksheet server-state migration

Implemented scope:

1. Reuse the application's existing TanStack Query provider.
2. Centralize worksheet context, source, and learner list queries in `worksheetQueries.ts`.
3. Scope every cache key to the authenticated user; source keys also include conversation/message, and list keys include course/page.
4. Replace publication and assignment opening with mutations. Neither mutation retries automatically. The publication form retains its stable group ID and immediate duplicate-click guard.
5. Invalidate the publishing user's worksheet queries after confirmed publication. Invalidate the learner's course assignment pages after an authorized open records activity.
6. Share teaching context between generator settings and assignment review. Preserve the mapped grade in generation requests.
7. Keep form values, confirmation visibility, pagination, and PDF download state local. Keep the existing chat streaming implementation.

Read failures remain visible and can be retried explicitly. Publication success comes only from mutation success. A failed publication preserves the form and never reports learners as assigned. Cached source/context data are fresh for 30 seconds; assignment lists refresh on mount. No new provider, dependency, backend route, or migration is required.

Invalidation affects the current browser's QueryClient. It does not push live updates to other learners' browsers; learners can refresh or reopen the assignment list.

Validation covers shared-query deduplication, user isolation, source fetching only during review, mutation invalidation, failure without automatic publication retry, course/page query scoping, authorized downloads, and the existing educator/learner UI workflows.
