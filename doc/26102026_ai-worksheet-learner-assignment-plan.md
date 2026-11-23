# AI worksheets: differentiated assignment and learner exports

Date: 26 October 2026. Status: implementation plan; application changes not implemented by this document.

## Outcome

An educator generates a worksheet in a course, reviews each generated difficulty variant, selects eligible learners within their organization separately for each variant, and publishes. Learners see only their assigned variant in My Class, can read its full content, and export it as PDF or Word. Keep course and lesson identifiers so the worksheet remains associated with its source course. A future global entry point may omit course and lesson identifiers without changing recipient isolation.

## Existing implementation and gaps

- `functions/api/ai-tutor/handlers/ai-tutor-chat.ts` validates one to three difficulty levels and 5–30 questions per selected level, and generates levels separately. The conversation response is combined; conversation text is not a reliable assignment/version model.
- `src/features/ai-tutor/ui/AITutorPanel.tsx` is the educator generation interface. Add Assign only for completed, saved, reviewed worksheets. Streaming, failed and stopped results cannot be published.
- `src/features/ai-tutor/model/exportToPDF.ts` and `exportToDOCX.ts` already render document content. Reuse these renderers for educator previews and learner exports after retrieving authorized content.
- `functions/api/educator/handlers/assignments.ts` and `src/features/educator/api/assignmentsService.js` already create assignments and class assignments. The inspected creation path accepts assignmentData and class targeting; it does not provide the required variant-specific recipient selection. Do not use caller-provided educator IDs as authorization.
- My Class has assignment helpers under `src/features/myclass`. Integrate worksheet deliveries there, while validating the separate school and college flows before implementation. Do not assume their assignment schemas are identical.

## User flow

1. Educator selects question count and difficulty checkboxes. Count remains per selected level, not a fixed 20: selecting 20 and three levels produces 60 questions.
2. Generation produces independently identified Beginner, Intermediate and Advanced variants. Persist structured variant boundaries rather than splitting headings from Markdown later.
3. After generation, educator reviews each variant. Questions and solutions must be separate structured fields; never remove answer keys with a text regex.
4. Assign opens a modal with title, instructions, optional due date, difficulty tabs, search and class/section filters. Each tab has its own learner checkbox selection and recipient count.
5. List only active learners in the current organization whom this educator is authorized to teach. Same organization alone is insufficient where class or program permissions restrict access. Support authorized school classes and college sections.
6. Default to one variant per learner for this publication. If a learner is selected under another difficulty, ask the educator to move them before publishing; do not silently duplicate assignments. Multiple worksheets can still be assigned separately.
7. Show a confirmation preview: Beginner → selected learners, Intermediate → selected learners, Advanced → selected learners. Include validation for empty selections and a final total.
8. Publish all recipients transactionally. Learners find the worksheet in My Class → Assignments, including course, difficulty, educator and due date.
9. Learner opens a read-only worksheet page showing full question content and any learner-facing rubric. Export PDF and Export Word use this exact authorized snapshot. Educator solutions stay private until an explicit release policy permits access.

## Proposed persistence

Names are provisional until checked against the actual local schema and existing facilitator plan. Reuse equivalent planned tables rather than introducing duplicate lifecycle systems.

| Table | Purpose and essential fields |
| --- | --- |
| `ai_worksheet_sets` | id, organization_id, educator_user_id, course_id nullable, lesson_id nullable, source_message_id, title, generation_config, status, created_at |
| `ai_worksheet_variants` | id, worksheet_set_id, difficulty, version, student_content JSONB, question_count, completion_status, created_at; unique set/difficulty/version |
| `ai_worksheet_solutions` | variant_id, private solution content; never joined into learner responses |
| `ai_worksheet_publications` | id, organization_id, educator_user_id, title, instructions, due_at nullable, status, idempotency_key, created_at |
| `ai_worksheet_recipients` | id, publication_id, learner_id, variant_id, version snapshot, assigned_at, opened_at nullable; unique publication/learner |

Use learners.id for recipient learner_id and users.id for educator_user_id, with explicit foreign keys. Freeze published versions: subsequent edits create a new version and do not mutate worksheets already delivered. Keep all required learner-facing content in the frozen version; browser exports need not require permanent generated files. If files are stored, use private storage with short-lived authorized download links and tenant-scoped paths.

Delivery/read tracking is distinct from assessed progress. Downloads and opens are not proof of learning or completion. Reuse existing submission/review tables only after verifying their school/college compatibility; online answering, grading and scoring are a separate follow-on scope.

## Proposed authenticated endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /api/ai-worksheets/:setId` | Educator review of owned/authorized set and variants |
| `GET /api/ai-worksheets/eligible-learners?setId=...&classId=...&search=...&cursor=...` | Paginated, permission-filtered learner picker |
| `POST /api/ai-worksheets/:setId/publish` | Validated difficulty-to-recipient mapping, due date and idempotency key |
| `GET /api/myclass/ai-worksheets` | Current learner's deliveries only |
| `GET /api/myclass/ai-worksheets/:recipientId` | Authorized frozen student content and metadata |
| `POST /api/myclass/ai-worksheets/:recipientId/open` | Idempotent first-open tracking |

Publication request example: `{ selections: [{ variantId, learnerIds: [...] }], instructions, dueAt, idempotencyKey }`. Server derives educator and organization from authenticated identity and verified membership; it revalidates every variant, learner membership, teaching permission, completion status and duplicate selection. Use a database transaction/RPC for atomic publication and enforce uniqueness for retries. Browser export calls the authorized detail endpoint then uses existing renderers; no export endpoint is required initially.

## Authorization and content rules

- Use existing withAuth/auth-client flow. No Supabase Auth calls or browser service keys.
- Restrict reads with RLS where applicable and enforce checks in server handlers using service-role clients, which bypass RLS.
- Learners cannot access another learner's recipient record or unassigned difficulty variants by changing IDs.
- Recheck educator membership and teaching authority at publication time. Reject stale recipients rather than partially publishing.
- Store questions and solutions separately from initial generation; learner APIs must never return educator conversation text containing answer keys.
- Avoid whole-organization or cross-tenant learner listings. Paginate search and show class/section labels to distinguish similar names.

## Implementation sequence

1. Inspect school and college membership, assignment, submission and My Class schemas; map integration points and existing plan tables. Confirm existing generation response metadata and document renderer behavior.
2. Add repeat-safe migrations for versioned variants, private solutions, publications, recipient uniqueness and authorization policies.
3. Extend generation completion persistence to save structured variants and bind them to the source conversation. Legacy combined conversations remain viewable/exportable; require regeneration or explicit educator review before structured assignment.
4. Implement eligible learner queries and atomic publish API with permission and idempotency checks.
5. Add review/Assign interface with per-difficulty learner selections and publication summary.
6. Add learner My Class list/detail integration and PDF/Word exports using frozen student content.
7. Verify complete school and college flows, including permission failures, duplicate clicks, stopped generation, long document pagination and learners assigned different levels.

## Acceptance checks

- A completed three-level worksheet can be assigned to three independent learner groups; question counts match generation selections.
- No publication button during generation, failure or stop; invalid/incomplete variants are rejected server-side too.
- Educator cannot publish to another organization or an unauthorized class by altering request IDs.
- Each learner sees only their assigned version; solutions are absent from detail responses and exports.
- PDF and DOCX contain readable headings, numbering, options and page breaks matching the preview.
- Retry creates no duplicate deliveries, and a failed recipient validation leaves no partial publication.
- Existing class assignments and educator exports remain functional.
