# Technical Solution Design (TSD)

## 1. Task Information

| Field | Value |
|---|---|
| Task ID | ASSESS-PERSIST-2026-08 |
| Title | External Certificate Import Fix, Assessment Loading Fix, and Assessment Persistence Backend Refactor |
| Task Type | Bug Fix (Sections A, B) + Architectural Refactor (Section C) |
| Priority | High |
| Estimated Effort | Bug fixes: Small (< 1 day each). Refactor: Medium (1–2 days) |

---

## Section A: External Certificate Import Failure

### 2. Problem Statement

**Business Requirement**
Learners must be able to import an external certificate (Coursera, Udemy, LinkedIn Learning, etc.) into their learning profile.

**Current Behaviour**
`POST /api/learners/trainings` returned `500 Internal Server Error` with a PostgREST `PGRST204` error: *"Could not find the 'course' column of 'trainings' in the schema cache."*

**Expected Behaviour**
The certificate import completes successfully and a row is created in `trainings`.

### 3. Scope

**In Scope**: `POST /api/learners/trainings` insert payload construction.
**Out of Scope**: Schema migration (no schema change was needed or made); training approval workflow (see Section C).

### 4. Current Analysis

**Files/Modules Reviewed**: `functions/api/learners/trainings.ts`, `src/widgets/learner-dashboard/ui/AddLearningCourseModal.jsx`, `supabase/migrations/20260526000000_schema.sql`.

**Existing Flow**: The backend insert payload included `course: training?.course || training?.title || ''` and `progress: training?.progress ?? 0`. Neither `course` nor `progress` exists as a column on `trainings` — the live schema only defines `title` (text) and `course_id` (UUID FK to `courses.course_id`). These fields were never introduced by any migration; the handler was written against an assumed schema shape that never matched reality.

### 5. Proposed Solution

**Solution Overview**: Remove `course` and `progress` from the insert payload. Use `title` as the sole text label. Only set `course_id` when the caller supplies a real course UUID — never derive it from text.

**Why this approach?**: `title` already serves the "course name" purpose; `course_id` is a proper FK, not a free-text mirror. No new column is needed.

**Alternatives Considered**: Adding a `course` column via migration — rejected, since it would duplicate `title` with no distinct purpose.

### 6. Technical Design

**Database Changes**: None.

**API Contract**: `POST /api/learners/trainings` — request body unchanged; insert payload no longer references non-existent columns.

### 7. Impact Analysis

**Affected Components**: `functions/api/learners/trainings.ts` (`onRequestPost`), `src/widgets/learner-dashboard/ui/AddLearningCourseModal.jsx` (removed matching dead fields from the request body: `course`, `progress`).

### 8. Business Logic

**Execution Flow**: Learner submits certificate form → `AddLearningCourseModal` posts `{learnerId, training, certificate, skills}` → backend builds `trainingRecord` from only valid `trainings` columns → insert succeeds → linked `certificates`/`skills` rows created.

### 9. Edge Cases

Audited all fields inserted into `certificates` and `skills` in the same handler against live schema — no further mismatches found.

### 10. Security

N/A — no change to auth/authorization in this fix.

### 11. Testing Plan

**Manual**: Verified insert payload against live schema via direct DB inspection (`\d public.trainings`). Confirmed no remaining `total_questions`/column mismatches via query.
**Regression**: N/A — isolated to one insert path.

### 12. Risks

None. Pure removal of invalid fields; no behavior change for valid fields.

### 13. Open Questions

None.

### 14. Developer Self Review

- [x] Payload matches live schema
- [x] No new migration required
- [x] Certificate/skills inserts audited for the same class of error

---

## Section B: Assessment Loading Failure

### 2. Problem Statement

**Business Requirement**
Learners must be able to start an AI-generated, course-specific assessment.

**Current Behaviour**
Clicking "Start Assessment" always failed with an alert: *"Failed to load assessment. Please try again."* — on every attempt, regardless of course.

**Expected Behaviour**
A successfully generated assessment loads and the learner proceeds to the question flow.

### 3. Scope

**In Scope**: Response handling in `generateAssessment()` (frontend).
**Out of Scope**: AI question-generation quality, token-limit tuning (handled separately as a bug fix, not part of this TSD).

### 4. Current Analysis

**Files/Modules Reviewed**: `src/features/assessment/api/assessmentGenerationService.js`, `functions/api/question-generation/[[path]].ts`, `functions/lib/response.ts`.

**Existing Flow**: The backend's `/generate` endpoint wraps all responses via `apiSuccess()`, producing `{success, data, error, meta}`. The frontend's `generateAssessment()` read `const assessment = await response.json()` and used the top-level envelope directly as the assessment object. Every field access (`assessment.course`, `.level`, `.questions`) was `undefined`, so `validateAssessment()` failed unconditionally with `"Missing course name", "Invalid level", "No questions found"`.

### 5. Proposed Solution

**Solution Overview**: Unwrap `envelope.data` before validating or using the response.

**Why this approach?**: Matches the same unwrapping convention already used elsewhere in the same file (`saveGeneratedAssessment`, `loadGeneratedAssessment`), and matches the backend's actual, unchanged response contract.

**Alternatives Considered**: Changing the backend to return an unwrapped body — rejected, since it would break the shared `apiSuccess()` envelope convention used by every other endpoint in the codebase.

### 6. Technical Design

**API Contract**: No change to the backend contract. Frontend now correctly consumes the existing `{success, data, error, meta}` shape.

### 7. Impact Analysis

**Affected Components**: `src/features/assessment/api/assessmentGenerationService.js` — `generateAssessment()` (success-path unwrapping) and its error-path handling (`errorData.error` is an object `{code, message}` under `apiError()`, not a string; fixed to read `.message`).

### 8. Business Logic

**Execution Flow**: Click "Start Assessment" → `generateAssessment()` → `POST /api/question-generation/generate` → backend returns `{success, data: {course, level, questions, total_questions}}` → frontend reads `envelope.data` → `validateAssessment(assessment)` passes → learner proceeds to questions.

### 9. Edge Cases

Handles the case where `envelope.data` is missing/null (throws an explicit error rather than passing `undefined` into validation).

### 10. Security

N/A.

### 11. Testing Plan

**Manual**: Confirmed via user report that assessment generation and loading now succeeds end-to-end after this fix.

### 12. Risks

None — isolated response-parsing correction.

### 13. Open Questions

None.

### 14. Developer Self Review

- [x] Matches existing envelope-unwrapping convention in the same file
- [x] Error path also corrected (object vs. string message)
- [x] Verified against live user test

---

## Section C: Assessment Persistence Architecture Refactor

### 2. Problem Statement

**Business Requirement**
Assessment attempts (start, progress, completion, history) must be persisted reliably, and a passed assessment must be reflected in the learner's training record.

**Current Behaviour**
`src/features/assessment/api/externalAssessmentService.js` referenced a `supabase` client that was never imported or instantiated anywhere in the file or the codebase. Every exported function (`checkAssessmentStatus`, `createAssessmentAttempt`, `updateAssessmentProgress`, `completeAssessment`, `saveAssessmentAttempt`, `getAssessmentHistory`, `getAssessmentByCourse`) would throw `ReferenceError: supabase is not defined` on every call. Errors were caught and silently swallowed, so the UI proceeded to show a "Congratulations, you passed" screen even though **zero rows were ever written** to `external_assessment_attempts`.

**Expected Behaviour**
Assessment attempts persist correctly; a passed assessment automatically updates the linked `trainings` record's approval status; failures are surfaced to the user instead of silently ignored.

### 3. Scope

**In Scope**: Persistence layer for `external_assessment_attempts`; new endpoint to sync assessment outcome to `trainings`; error-visibility in `DynamicAssessment.jsx`.
**Out of Scope**: The pre-existing, separate career/aptitude assessment system (`learner-pages/actions.ts` → `mark-assessment-completed`, used by `AssessmentResults.tsx`) — a different feature that happens to share the same table; not modified.

### 4. Current Analysis

**Files/Modules Reviewed**: `src/features/assessment/api/externalAssessmentService.js`, `src/pages/learner/DynamicAssessment.jsx`, `functions/api/learners/trainings.ts`, `functions/api/learner-pages/actions.ts` (evaluated as a possible existing home for this logic; not reused — see Section 5).

**Existing Flow**: No frontend Supabase client exists anywhere else in `src/` (confirmed by codebase-wide search) — this file was the sole exception, and it never actually worked. This repo's CLAUDE.md mandates all Supabase writes route through backend Pages Functions; this feature was, in its written form, a violation of that standard that had never been exercised successfully.

### 5. Proposed Solution

**Solution Overview**: Move all `external_assessment_attempts` reads/writes into a new backend Pages Function. Add a new endpoint to sync a passed assessment's outcome into the linked `trainings` row. Make attempt-creation and completion failures hard stops in the UI instead of silent no-ops.

**Why this approach?**: Aligns with the codebase's existing backend-first convention (all other Supabase access in the app already goes through Pages Functions using the service-role client). Enables server-side authorization checks that a frontend client cannot enforce safely.

**Alternatives Considered**:
- *Extend `functions/api/learner-pages/actions.ts`* (which already has one related action, `mark-assessment-completed`, for a different assessment feature) — considered, but that file has no ownership/authorization checks anywhere, and folding six new write-actions into a shared, unguarded file used by 8 other pages was judged higher-risk than a dedicated file. Decision: keep persistence logic in a new, dedicated file with ownership checks built in from the start.
- *Add a frontend Supabase client* — rejected outright; would introduce the first direct frontend-to-DB client in the codebase and violate the CLAUDE.md architecture mandate.

### 6. Technical Design

**Architecture Diagram (textual)**
```
Before:
  DynamicAssessment.jsx → externalAssessmentService.js → (undefined) supabase client → [never reaches DB]

After:
  DynamicAssessment.jsx → externalAssessmentService.js → apiPost/apiPut
      → POST /api/external-assessment/actions  (check-status, create-attempt, update-progress, complete, history, get-by-course)
      → PUT  /api/learners/trainings            (assessment-outcome → training approval sync)
          → getServiceClient() (service-role) → Supabase
```

**Sequence Diagram (textual)**
```
Learner clicks Start Assessment
  → createAssessmentAttempt() → POST /external-assessment/actions {action:'create-attempt', ...}
      → ownership check → INSERT external_assessment_attempts → returns attemptId
  → learner answers, auto-saves via updateAssessmentProgress() → action:'update-progress'
  → learner submits
      → completeAssessment(attemptId) → action:'complete' → UPDATE status='completed', score
      → IF attemptId missing OR complete fails → hard stop, show error (no false success screen)
      → updateTrainingAfterAssessment(learnerId, trainingId, score, passed)
          → PUT /learners/trainings {learnerId, trainingId, score, passed}
              → ownership check → IF passed AND not already approved →
                  UPDATE trainings SET approval_status='approved', status='completed',
                                       approved_by, approved_at, approval_notes
  → My Learning re-fetches trainings on next mount, reflects updated status
```

**Database Changes**: None (no migration). Only application-level read/write logic changed.

**API Contract**:

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/external-assessment/actions` | POST | Action-dispatch: `check-status`, `create-attempt`, `update-progress`, `complete`, `history`, `get-by-course` — all scoped to `external_assessment_attempts` |
| `/api/learners/trainings` | PUT (new) | `{learnerId, trainingId, score, passed}` → auto-approves the training on a passing score; idempotent (no-op if already approved or not passed) |

### 7. Impact Analysis

**Affected Components**:
- `functions/api/external-assessment/actions.ts` (new)
- `functions/api/learners/trainings.ts` (added `onRequestPut`)
- `src/features/assessment/api/externalAssessmentService.js` (rewritten: direct Supabase calls → `apiPost`/`apiPut`)
- `src/pages/learner/DynamicAssessment.jsx` (added `updateTrainingAfterAssessment` call after completion; replaced silent-failure gates with hard stops and user-visible errors)

**Not affected**: `functions/api/learner-pages/actions.ts` and `src/pages/learner/AssessmentResults.tsx` (separate career-assessment feature, out of scope).

**Known follow-up (not yet built)**: `src/widgets/learner-dashboard/ui/ModernLearningCard.jsx`'s "Assessment Completed"/"Assessment Pending" badge and score display read exclusively from `external_assessment_attempts` (via `checkAssessmentStatus`) and do not consult `trainings.approval_status` at all. This was confirmed by direct testing (manually setting `trainings.approval_status = 'pending'` did not change the card's badge). This is a pre-existing UI/data-model divergence, not introduced by this refactor, and is not yet resolved.

### 8. Business Logic

**Execution Flow**: See Sequence Diagram above. Passing threshold is `score >= 60`, applied consistently in both the results-screen display logic and the training-update gate in `DynamicAssessment.jsx`.

### 9. Edge Cases

- **Non-UUID `courseId`** (general/non-training-linked assessments use a `'default'` placeholder): guarded by a UUID-format regex check before calling `updateTrainingAfterAssessment` — skipped safely, no error.
- **Already-approved training**: PUT handler checks `existing.approval_status === 'approved'` and returns `{updated: false, reason: 'already_approved'}` without re-touching `approved_by`/`approved_at` — idempotent, verified against the live DB.
- **Failed assessment**: PUT handler returns `{updated: false, reason: 'assessment_not_passed'}` without modifying the training row.
- **Attempt-creation failure**: now a hard stop with a user-visible error (`setError(...)`), replacing the previous silent `console.warn` + continue-anyway behavior.

### 10. Security

**Authentication**: Both endpoints wrapped in `withAuth`.
**Authorization**: Each action/handler verifies the requesting user owns `learnerId` (via `learners.user_id = user.id`) or holds an admin role (`ADMIN_ROLES`), mirroring the existing pattern in `trainings.ts`. This did not exist in the original (non-functional) direct-Supabase design.
**Data Protection**: Writes use the service-role client server-side only; no credentials or direct DB access are exposed to the frontend.

### 11. Testing Plan

**Manual**: Verified end-to-end via live browser test — confirmed a real row in `external_assessment_attempts` (`status: completed, score: 67, total_questions: 15`) and confirmed the PUT handler's idempotency guard behavior against a live DB row.
**Integration**: Verified route resolution (`/api/external-assessment/actions`, `/api/learners/trainings`) returns proper `401` (not `404`) when unauthenticated, confirming correct Pages Functions routing.
**Regression**: N/A for this refactor — no existing working callers of the old (non-functional) code path existed to regress.
**Not yet verified**: Auto-approval on a training that starts genuinely `pending` (every test so far hit a training already `approved` via an unrelated fix, so the actual UPDATE branch of the PUT handler has not been exercised end-to-end).

### 12. Risks

- The `ModernLearningCard.jsx` badge/score UI does not read `trainings.approval_status`, so the training-approval feature has no visible UI effect on that specific card today (see Impact Analysis). No breaking change, but the feature is currently "backend-complete, UI-incomplete."
- `functions/api/learner-pages/actions.ts` retains a separate, unguarded `mark-assessment-completed` action on the same table for a different feature; not a regression risk from this change, but a pre-existing inconsistency worth separate attention.

### 13. Open Questions

- Should `ModernLearningCard.jsx` be updated to also reflect `trainings.approval_status`, or should the training-approval concept be considered independent of the assessment-completion badge by design? (Not yet decided.)
- Should the PUT handler's auto-approval also flip a broader "training completed" signal read elsewhere (e.g. `total_modules`/`completed_modules`), or is `status: 'completed'` sufficient on its own?

### 14. Developer Self Review

- [x] No direct frontend Supabase access remains in `externalAssessmentService.js`
- [x] All new endpoints have ownership/authorization checks
- [x] Idempotency verified for the training-approval PUT handler
- [x] Silent failure paths converted to user-visible errors
- [ ] `ModernLearningCard.jsx` UI alignment with `trainings.approval_status` — **not done, tracked as open question above**

---

## Versioning

| Version | Scope | Status |
|---|---|---|
| v1.0 | Sections A + B (bug fixes) | Modified — existing endpoints corrected, no new surface |
| v1.1 | Section C (persistence refactor) | New — `functions/api/external-assessment/actions.ts` (New), `PUT /api/learners/trainings` (New), `externalAssessmentService.js` (Modified — internal implementation only, external function signatures unchanged) |
