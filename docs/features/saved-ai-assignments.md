# Saved AI assignments and lesson plans

## Current flow

Generated assignments and lesson plans stay in the conversation until an educator explicitly chooses **Save**. **Not now** records the decision in conversation metadata without creating a library entry. Ordinary chat replies do not receive material controls. Saved choices survive refreshes; a repeated save returns the same record.

The generic library uses `ai_assignments` and `ai_lesson_plans`, with JSONB content and no organization, visibility or instructions columns. Assignment grading rules remain backend-only. Material rows are immutable; a revision saves a new snapshot. An exact normalized request/configuration and matching course context can reuse a saved material without another generation call. This is deterministic matching, not semantic similarity search. Revision requests include their previous material in the fingerprint and are not automatically served from cache.

After saving an assignment, the educator reviews questions and private grading rules, selects mapped learners, supplies a deadline and explicitly confirms allocation. `ai_assignment_learners` links the exact saved material to learners. The transaction also creates linked school/class or college/section tasks; repeat allocation does not duplicate tasks. A previously allocated material keeps its existing deadline for that educator.

The learner can select, preview, remove or replace one document before clicking **Submit document**. PDF/image previews use local object URLs; TXT/CSV and DOCX previews display local text. Word previews do not reproduce document layout or embedded images. Selection and preview alone do not upload or evaluate. The course assistant's **Course assignments** view supports submission and released feedback. Existing school/college upload screens call the same AI submission endpoint for linked tasks. Older non-AI assignments retain their previous upload behavior.

`ai_assignment_submissions` stores the R2 key, filename, MIME type and submission time. It has no typed-answer, extracted-content or attempt columns. There is one immutable submission per allocation. The API verifies ownership/deadline, accepts one PDF/DOCX/TXT/CSV/PNG/JPEG up to 5 MiB, checks signatures and bounds the request body before parsing multipart data.

## Existing R2 bucket

Use the existing `R2_BUCKET` binding and `skill-echosystem` bucket. No new bucket or scheduled worker is required. The backend generates keys:

```text
courses/{courseId}/ai-assignments/{assignmentId}/
  submissions/{assignmentLearnerId}/{submissionId}/{fileId}.{extension}
```

Original filenames are database metadata, not directory components. The submission endpoint returns a submission ID, not a public file URL. Downloads use authenticated requests and check the assigned learner or assigning educator. Existing generic storage endpoints are not used for new document downloads.

If the existing bucket is exposed through a public domain or r2.dev, direct bucket access exists independently of app authorization. Folder organization alone does not make objects private. No public-access settings were changed by this implementation.

## Evaluation and release

Initial evaluation uses the uploaded bytes already in the request. Text/CSV and DOCX text are extracted locally; PDF/images and DOCX image content use the existing Gemini Flash Lite extraction model with a transcription-only prompt. Oversized/incomplete/unsupported evidence is not silently accepted. Legacy DOC/PPT conversion and full video transcription are outside this flow.

GPT-4o mini maps explicitly filled document answers to saved question IDs. Objective answers are scored using deterministic normalized answer rules. Descriptive answers use private rubrics with validated, bounded question-level marks. Scores are provisional and never released automatically.

`ai_assignment_results` stores processing status, question-level feedback/marks and the model used. Provider/extraction failures preserve the submitted file and allow educator retry or manual review. Retry reloads the object through `R2_BUCKET`. A processing result can be reclaimed after five minutes if an interrupted request left it stuck. There is no persistent extraction text and no multiple-attempt learner flow.

The educator downloads the submitted document, reviews every score, explains overrides and explicitly releases results. The original AI rows and the final review are retained together in JSONB; totals are recalculated by the database. Released marks and feedback are synchronized into existing school/college learner tasks. Database guards prevent older status/grade endpoints from bypassing submission or release. Learner responses omit all unreleased marks/feedback.

The educator workspace shows submission/release counts, average released scores and question/skill gaps. **Draft targeted follow-up** prepares a chat prompt from released evidence; it does not silently generate, save or assign another task.

## Activation

1. Apply the existing course-index migration first, then `20261103150000_ai_saved_assignments.sql` in staging. The latter expects the existing school/college assignment tables and worksheet educator-mapping RPCs.
2. Keep the existing `R2_BUCKET` binding available to Pages. Configure `OPENROUTER_API_KEY` and the existing Supabase server credentials.
3. Set `AI_ASSIGNMENTS_ENABLED=true` after the migration is available. The checked-in default remains false, preserving the existing publication path before activation.
4. Validate with a mapped educator and learner in staging, including a document submission, manual review and release. No production migrations, provider calls with real learner documents, or deployments were performed during implementation.

## Checks

Focused tests cover explicit save/deferral, saved-question reuse, learner result privacy, file signatures/path validation, objective grading, descriptive score bounds, submission ownership, database-failure cleanup and preservation after evaluation failure. `scripts/test-saved-assignments-db.mjs` uses a dedicated disposable pgvector Docker database to validate school/college allocation idempotency, immutable material snapshots, grade guards and result release. Its compatibility fixture is not a substitute for staging validation against the full deployed schema.

The older full-flow stash is left intact and has not been applied wholesale.

The combined handler test covers explicit save without duplication, allocation, file upload, stored evaluation, learner privacy before release, educator release and repeated submission. Its failure case verifies that a provider error retains the submission and R2 object. Local preview tests cover text, DOCX and object URL cleanup. Live OpenRouter checks using synthetic content passed for PDF transcription and GPT-4o mini descriptive grading. These checks did not send real learner documents. The production Vite build passed after adding the preview.

## Local activation on 3 November 2026

Both migrations were checked against the full local Skillpassport schema in a rollback-only transaction, then applied to the configured local Supabase instance on port 54321 and recorded in its migration ledger. `AI_ASSIGNMENTS_ENABLED=true` is set in the ignored local `.dev.vars`; the production default in `wrangler.toml` remains false.

The local sample school educator has no eligible learners. College profiles have eligible learners, but none currently combine that educator mapping with a valid active section in the same college and accessible course, so a real-account allocation/submission smoke test cannot finish yet. The allocation picker now excludes these incomplete mappings and explains the missing class/section requirement. No learner mappings were changed to force a passing test, and the failed smoke-test writes rolled back. The disposable school/college flow checks passed independently.
