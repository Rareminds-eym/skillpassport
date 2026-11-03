# Saved AI materials and document assignments

## Agreed scope

Use five generic tables: `ai_assignments`, `ai_lesson_plans`, `ai_assignment_learners`, `ai_assignment_submissions`, `ai_assignment_results`. Material content and grading rules are JSONB. No organization/visibility/instructions columns on the generic material tables. No typed answers, attempt numbers, or persisted extraction text on submissions.

## Implementation order

1. Add service-only tables and transaction RPCs. Materials are immutable snapshots; repeated saves are idempotent. Allocation authorization uses existing mapped school/college learners. Existing task lists receive linked tasks, with unique references preventing duplicates.
2. Add explicit Save / Not now prompts for completed worksheet and lesson-plan messages. Persist choices in conversation metadata. Only Save creates library content. Check compatible saved materials before new generation using request and context fingerprints.
3. Add recipient/deadline confirmation after saving. Publish one task per school class/college section, referencing the saved snapshot. Keep older worksheet delivery intact.
4. Add a single document submission endpoint. Validate ownership, deadline, extension, signature and size before storing bytes in a private R2 bucket. Generate `courses/{courseId}/ai-assignments/{assignmentId}/submissions/{allocationId}/{submissionId}/{fileId}.{ext}` on the backend. Never accept arbitrary storage keys from clients.
5. Extract the uploaded bytes, then evaluate against saved questions and private rules. Keep submission if extraction/provider evaluation fails. Explicit educator retry loads bytes from R2. Store question-level marks, recomputed totals and feedback. Objective matching is deterministic; descriptive marks require educator review. No automatic release.
6. Add educator progress/review/override/release and learner released feedback. Mirror released marks into existing school/college task records. Refresh server state using user-scoped TanStack Query keys.
7. Validate SQL in a disposable database, test privacy/idempotency/upload failures/grading, and run relevant UI checks and builds. Document configuration and deployment requirements; do not deploy or apply production migrations during implementation.

## Storage and failure behavior

Use a dedicated private `AI_ASSIGNMENT_FILES` R2 binding (no public domain). Existing generic storage handlers have broad legacy access rules and must not serve these documents. File reads are submission-ID based and verify educator/learner ownership. Clean up an uploaded object if submission persistence fails. Never delete a successfully submitted document merely because evaluation fails.

## Deferred work

The older full-flow stash remains intact. It uses a different table layout and will not be applied wholesale. Legacy DOC/PPT conversion and full-length video transcription are separate from this assignment flow.
