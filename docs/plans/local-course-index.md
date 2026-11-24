# Local course indexing

## Plan

1. Remove the separate `workers/course-processing` scheduled worker.
2. Add `npm run course:index -- --course-id <UUID>` with environment credentials loaded locally. A service-role administrator runs it; no browser-selected user identity is needed.
3. Discover only the selected course's lessons/resources, queue unchanged-safe versions, and claim only that course's jobs. Reuse extraction/chunking and the existing embedding worker's provider implementation, using Gemini embedding-2-preview at 1,536 dimensions. No Worker runtime is needed for this script.
4. Store processing/extracted evidence in `course_resource_analysis`, and text/source references/vectors in `course_content_chunks`. Activate complete versions atomically. Print counts, never secrets or provider payloads; exit unsuccessfully when sources fail or another process owns incomplete work.
5. Remove web enqueue/retry controls. Source edits invalidate stale evidence; rerun the local script to create updated vectors. Chat continues authorized retrieval using the existing embedding service for query vectors.
6. Test course isolation, arguments, idempotent discovery, document embeddings, failures and migration behavior. Provide exact local setup commands. No production database writes are performed during implementation.

`--force` explicitly rebuilds unchanged sources and restarts failed work. Initial runs resume pending work. Only these two new indexing tables are required. Deferred assessment changes stay in their existing Git stash.
