# Industrial-Grade Career Assessment Upgrade — Requirements (SRS)

**Applies to:** Career assessment experience starting at `/student/assessment/test` and results at `/student/assessment/result`

**Status:** Draft

**Last updated:** 2026-02-02

---

## 1. Problem Statement

The current career assessment flow works end-to-end, but it is not yet “industrial-grade” in the sense expected for high-stakes, high-traffic, and audit-ready assessment systems.

To be industrial-grade, the assessment must reliably handle:

- High concurrency and partial outages
- Strong persistence and resume guarantees (including across devices)
- Strict data integrity with idempotent writes and conflict protection
- Deterministic scoring + explainability
- AI-analysis governance (safety, versioning, reproducibility)
- Production observability (metrics, logs, tracing, alerting)
- Security, privacy, and compliance requirements

---

## 2. Current Baseline (As-Is Summary)

The system today:

- Renders the assessment via `src/features/assessment/career-test/AssessmentTestPage.tsx`.
- Uses a client-side state machine `useAssessmentFlow` to manage sections/questions/timers and local answers.
- Persists attempts and progress via Supabase using `useAssessment` + `src/services/assessmentService.js`.
- Stores answers in two places:
  - UUID-based (AI-generated) questions: `personal_assessment_responses`
  - Non-UUID/static questions: `personal_assessment_attempts.all_responses` (JSONB)
- Completes attempts using `completeAttemptWithoutAI`, creating a minimal result record.
- Runs AI analysis (OpenRouter via Cloudflare Worker) on the results page (`useAssessmentResults`) when needed.

This document defines what is required to evolve this into an enterprise/industrial-grade assessment system.

---

## 3. Goals & Non-Goals

### 3.1 Goals

- **G1: Zero data loss** during navigation, refresh, tab close/reopen, and intermittent connectivity.
- **G2: Resume guarantee**: a learner can resume an in-progress attempt reliably across refresh, browser restart, and optionally across devices.
- **G3: Strong integrity**: no duplicate attempts, no corrupted states, no inconsistent scoring, no partial completion.
- **G4: Deterministic, explainable scoring** with validated computation and audit logs.
- **G5: AI governance**: safe, versioned, reproducible AI analysis with clear fallback behavior.
- **G6: Observability and operations readiness**: SLOs, alerts, dashboards, traceability.
- **G7: Security and privacy**: enforce least privilege, protect PII, defend against abuse.

### 3.2 Non-Goals (explicitly out of scope unless later approved)

- Building a full proctoring suite (webcam + screen recording) — only lightweight integrity checks are required.
- Replacing the entire UI/UX — focus is on correctness, reliability, and scalability; UX improvements are included only where necessary for robustness.
- Adding entirely new assessment instruments without validation — question content changes require separate psychometric validation.

---

## 4. Definitions

- **Attempt**: a student’s single run of the assessment (in_progress/completed/abandoned).
- **Section**: a logical block of questions with timing and scoring rules.
- **Response**: a student answer to a specific question.
- **Progress Snapshot**: persisted state needed to resume exactly (position, timers, partial answers, adaptive state).
- **Result**: computed scores + AI report (may be asynchronous).
- **Idempotency**: repeated identical requests do not create duplicates or diverging state.

---

## 5. Key User Journeys (Target Behavior)

### Journey A: Start new assessment
- Student enters `/student/assessment/test`.
- Eligibility is checked.
- A new attempt is created **exactly once**.
- The first section begins with all timers initialized consistently.

### Journey B: Resume an in-progress attempt
- Student returns after refresh/restart.
- The system locates the attempt and restores:
  - section/question position
  - all answers
  - timers and section timings
  - adaptive session progress
- Student continues without losing data.

### Journey C: Complete and see results
- Student finishes last section.
- Attempt completion is **atomic**.
- Scoring is computed.
- AI report generation is triggered asynchronously.
- Student sees an analyzing/progress state and then results.

### Journey D: Retry AI report
- If AI report fails or is incomplete, the system can retry.
- Retries are governed (rate limit, audit, idempotent job control).

---

## 6. Functional Requirements (FR)

### FR-001 Attempt lifecycle & eligibility
- The system must enforce **at most one in-progress attempt per assessment type per student**.
- The system must support:
  - create attempt
  - resume attempt
  - abandon attempt
  - complete attempt
- Eligibility rules must be enforced consistently (e.g., cooldown windows) and must be configurable per environment.
- Attempt creation must be **idempotent** for a given student/session.

### FR-002 Versioned assessment configuration
- Each attempt must record:
  - assessment definition version (sections + ordering)
  - question bank version / AI generation version
  - scoring algorithm version
- Results must be reproducible for an attempt using the stored versions.

### FR-003 Question delivery guarantees
- The system must guarantee that the question set for an attempt is stable once the attempt starts.
- AI-generated questions must be **persisted and re-used** for resume and scoring.
- If AI question generation fails:
  - fallback policy must be clearly defined (e.g., fallback static bank vs hard error)
  - failures must be captured as structured telemetry.

### FR-004 Answer validation & canonicalization
- All question types must have server-validated schemas.
- The system must reject invalid answer payloads (wrong type, missing fields).
- The system must store answers in a canonical format (e.g., option IDs, normalized strings).

### FR-005 Autosave correctness and semantics
- The system must persist answers and position such that navigation and refresh cannot lose progress.
- All writes must be:
  - idempotent (via idempotency key or deterministic upsert key)
  - conflict-safe (optimistic concurrency or server-side ordering)
- Autosave must support intermittent connectivity:
  - queue writes locally
  - retry with backoff
  - deduplicate retries

### FR-006 Timer semantics (industrial-grade)
- The system must define authoritative timer behavior:
  - what happens on refresh
  - what happens on tab switch / background
  - whether pauses are allowed
- Timers must be resilient to client-side clock manipulation:
  - server-side timestamps or signed timer state must be considered
- Timer state must be persisted frequently enough to satisfy resume guarantees.

### FR-007 Multi-device resume (optional but recommended)
- If enabled, a student can resume the same attempt on another device.
- The system must prevent concurrent progression from two devices, or define deterministic conflict resolution.

### FR-008 Adaptive aptitude integration guarantees
- Adaptive session creation, resumption, and completion must be idempotent.
- Adaptive answers and results must be stored and tied to the assessment attempt.
- If adaptive service is degraded:
  - the system must fail gracefully with a retry path
  - the attempt state must remain consistent

### FR-009 Completion must be atomic
- Completing an attempt must be a single, consistent state transition.
- After completion:
  - attempt status is completed
  - all required answers are persisted
  - scoring can run reliably
- The system must prevent “double completion” and handle retries safely.

### FR-010 Deterministic scoring pipeline
- Non-AI scoring components (RIASEC, aptitude, knowledge, etc.) must be deterministic.
- The system must store:
  - computed scores
  - the inputs used to compute them
  - a scoring version
- Suspicious pattern detection must be recorded as warnings (not silent).

### FR-011 AI analysis pipeline (governed)
- AI report generation must be executed as a managed job (not only on-demand in the UI).
- AI jobs must be:
  - idempotent per attempt + model version + prompt version
  - retriable with a bounded policy
  - auditable
- AI output must be validated against a strict schema.
- If AI output fails validation:
  - store failure reason
  - provide a deterministic fallback report, or require retry per policy

### FR-012 Results access and integrity
- Results page must load by `attemptId`.
- The system must ensure the viewer is authorized to view the attempt.
- The results UI must be able to show:
  - partial results (deterministic scores) while AI report is pending
  - final AI report when ready

### FR-013 Accessibility and UX robustness
- The assessment must be keyboard navigable.
- Must meet at least WCAG 2.1 AA for major flows.
- Error states must be actionable (retry/save status shown).

### FR-014 Audit & event trail
- The system must record key events:
  - attempt created, resumed, abandoned, completed
  - answer saved
  - timer events (optional)
  - AI job started/succeeded/failed
- Audit logs must be queryable for support investigations.

---

## 7. Non-Functional Requirements (NFR)

### NFR-001 Reliability / SLOs
- Target availability: 99.9% for core assessment flows.
- RPO (data loss) target: ~0 for answers and completion.
- RTO (recovery) target: minutes, with graceful degradation.

### NFR-002 Performance
- Question navigation must feel instant:
  - UI response time < 150ms typical
  - API save latency p95 < 500ms (excluding poor networks)
- Results page should render deterministic scores quickly; AI report may be async.

### NFR-003 Scalability
- Must support spikes in concurrent test-takers without DB timeouts.
- Writes must be minimized and batched where safe.
- AI analysis must be queued and rate limited.

### NFR-004 Security
- All operations must be authenticated.
- Authorization must ensure a student can only access their own attempt/results.
- Writes must be protected from client tampering:
  - validate payloads
  - avoid direct client writes to privileged tables where possible
- Rate limit endpoints that trigger AI or heavy operations.

### NFR-005 Privacy & retention
- Minimize PII stored in AI prompts.
- Define retention policy for:
  - attempts
  - responses
  - AI outputs
  - logs
- Provide deletion/anonymization mechanism if required.

### NFR-006 Observability
- Structured logs with correlation IDs.
- Metrics:
  - attempt starts/completions
  - save failures
  - resume failures
  - AI job success/failure and latency
- Alerts for regressions and failures.

### NFR-007 Maintainability
- Clear separation of:
  - UI state
  - domain logic
  - persistence layer
  - scoring
  - AI job orchestration
- Documented interfaces and versioning.

---

## 8. Architecture Requirements (AR)

### AR-001 Server-authoritative persistence
- The system should move from “frontend writes directly to DB” toward **server-authoritative APIs** for:
  - attempt lifecycle
  - progress updates
  - completion
  - AI job creation

### AR-002 Idempotent progress API
- Introduce an idempotent endpoint like:
  - `PATCH /assessment/attempts/:attemptId/progress`
- Must accept an idempotency key and/or monotonic sequence number.

### AR-003 Concurrency protection
- Add optimistic concurrency (e.g., `version` integer) on attempts.
- Reject or resolve concurrent updates deterministically.

### AR-004 Background AI job orchestration
- AI analysis should be triggered at completion and executed asynchronously.
- UI should poll or subscribe to job status.

### AR-005 Formal schemas
- Define JSON schemas / TypeScript types for:
  - answers payload
  - progress snapshots
  - scoring outputs
  - AI outputs

---

## 9. Data Model Requirements

Recommended additions/changes:

- Add `assessment_version`, `scoring_version`, `ai_prompt_version`, `ai_model` to `personal_assessment_attempts` and/or `personal_assessment_results`.
- Add `version` (integer) or `etag` field to `personal_assessment_attempts` for concurrency control.
- Add `personal_assessment_events` table (append-only) for audit trail:
  - `attempt_id`, `event_type`, `payload`, `created_at`, `actor_id`
- Add `ai_analysis_jobs` table:
  - `attempt_id`, `status`, `model`, `prompt_version`, `retries`, `error`, `created_at`, `updated_at`

---

## 10. Testing Requirements

### TR-001 Automated tests
- Unit tests for scoring logic and schema validation.
- Integration tests for attempt lifecycle APIs.
- E2E tests for:
  - start → answer → refresh → resume → complete → results
  - network drop during save
  - AI job failure and retry

### TR-002 Load and resilience testing
- Load tests for concurrent saves and completions.
- Chaos testing for:
  - intermittent network
  - AI provider timeouts
  - DB slow queries

### TR-003 Manual QA checklist (release gate)
- Resume correctness (position + timers + answers)
- No duplicate attempts
- Results correctness and authorization
- AI report generation stability

---

## 11. Rollout / Migration Requirements

- Introduce changes behind feature flags.
- Ensure backward compatibility for existing attempts.
- Provide migration scripts and backfill if adding new columns.
- Add production dashboards before enabling new flow broadly.

---

## 12. Acceptance Criteria (Definition of Done)

- **AC-1**: A student can refresh at any point and resume with no answer loss.
- **AC-2**: Completion is atomic; no partial completion states.
- **AC-3**: Duplicate attempts are prevented by design (idempotent create + DB constraints).
- **AC-4**: Deterministic scores are reproducible and audited.
- **AC-5**: AI analysis runs as an auditable job with bounded retries and schema validation.
- **AC-6**: Observability is in place: dashboards + alerts for failure modes.
- **AC-7**: Security verification passes (authorization, rate limits, input validation).

---

## 13. Implementation Roadmap (Suggested)

1. **Phase 1: Reliability hardening (no UX changes)**
   - Add versioning + optimistic concurrency to attempts
   - Add audit events table
   - Strengthen idempotency for saves/completion

2. **Phase 2: Server-authoritative APIs**
   - Move progress and completion writes behind an API layer
   - Enforce consistent validation and invariants

3. **Phase 3: AI analysis as a job**
   - Create AI job table + worker/queue runner
   - Results page becomes job-status driven

4. **Phase 4: Full observability + SLOs**
   - Metrics, dashboards, alerts, runbooks

---

## 14. Traceability Matrix (Current System → Requirements)

### 14.1 Key code components (current)

- **Route wiring**: `src/routes/AppRoutes.jsx`
- **Assessment test orchestrator**: `src/features/assessment/career-test/AssessmentTestPage.tsx`
- **Flow state machine**: `src/features/assessment/career-test/hooks/useAssessmentFlow.ts`
- **DB integration hook**: `src/hooks/useAssessment.js`
- **DB service layer**: `src/services/assessmentService.js`
- **AI question generation**:
  - `src/features/assessment/career-test/hooks/useAIQuestions.ts`
  - `src/services/careerAssessmentAIService.js`
- **Adaptive aptitude**:
  - `src/services/adaptiveAptitudeService.ts`
  - `src/features/assessment/career-test/hooks/useAdaptiveAptitude.ts` (integration hook)
- **Submission**: `src/features/assessment/career-test/hooks/useAssessmentSubmission.ts`
- **Results UI**: `src/features/assessment/assessment-result/AssessmentResult.jsx`
- **Results data + AI regeneration**: `src/features/assessment/assessment-result/hooks/useAssessmentResults.js`
- **AI analysis service** (OpenRouter via Cloudflare Worker): `src/services/geminiAssessmentService.js`

### 14.2 Primary data stores (current)

- **`personal_assessment_attempts`**: attempt state + `all_responses` JSONB + timers + `section_timings`
- **`personal_assessment_responses`**: per-question rows for UUID/AI-generated questions
- **`personal_assessment_results`**: final report payload (`gemini_results`) + extracted score columns
- **`adaptive_aptitude_sessions`**: adaptive session state in DB (linked by `adaptive_aptitude_session_id`)

### 14.3 Requirement-to-component mapping (current coverage and gaps)

| Requirement | Current implementation touchpoints | Key gaps to reach “industrial-grade” |
|---|---|---|
| **FR-001 Attempt lifecycle & eligibility** | `useAssessment` + `assessmentService.getInProgressAttempt/createAttempt/abandonAttempt/completeAttemptWithoutAI` | Enforce DB-level uniqueness for in-progress attempts; idempotent attempt creation; unify eligibility enforcement in the new flow (not only legacy pages). |
| **FR-002 Versioned assessment configuration** | Partial implicit versions only (e.g., `grade_level`, AI question persistence) | Add explicit `assessment_version/scoring_version/ai_prompt_version/ai_model` stamped on attempt/result; ensure reproducibility. |
| **FR-003 Question delivery guarantees** | `useAIQuestions` + `careerAssessmentAIService` caching; sections built in `AssessmentTestPage` | Persist a stable attempt-specific question set; prevent mid-attempt regeneration; enforce stable ordering and completeness. |
| **FR-004 Answer validation & canonicalization** | Frontend validation in `useAssessmentFlow` for completeness; direct writes via Supabase | Server-side schema validation, canonical storage format, and strict rejection of invalid payloads. |
| **FR-005 Autosave correctness and semantics** | `onAnswerChange` + `dbUpdateProgress`; save-first navigation in `handleNextQuestion/handleNextSection` | Add idempotency keys/sequence numbers; offline queue + retry with dedupe; conflict-safe updates (optimistic concurrency). |
| **FR-006 Timer semantics** | Client-side timers + periodic progress writes in `AssessmentTestPage` | Define authoritative timer policy; protect against clock manipulation; consider server timestamps or signed timer state. |
| **FR-008 Adaptive aptitude integration** | `adaptiveAptitudeService` + `useAdaptiveAptitude` + `updateAttemptAdaptiveSession` | Idempotent adaptive operations; clear degraded-mode behavior; unified persistence and audit trail for adaptive events. |
| **FR-009 Completion must be atomic** | `completeAttemptWithoutAI` updates attempt + upserts result | Make completion transactional/atomic (single server function); prevent double completion; add idempotent completion keys. |
| **FR-010 Deterministic scoring pipeline** | Score helpers in `assessmentService` + validation logs; AI service fallback scoring in `geminiAssessmentService` | Centralize deterministic scoring with strict tests; store scoring inputs + version; produce explainable scoring artifacts. |
| **FR-011 AI analysis pipeline (governed)** | AI analysis is currently triggered from results UI (`useAssessmentResults.handleRetry`) calling `analyzeAssessmentWithGemini` | Move to background job orchestration; bounded retries; schema validation; rate limiting; full audit trail; store model/prompt versions. |
| **FR-012 Results access & integrity** | `useAssessmentResults` loads by `attemptId` query param and queries Supabase | Enforce strict authorization via server API; ensure least privilege; avoid exposing sensitive result writes to client. |
| **FR-014 Audit & event trail** | Primarily console logs today | Add append-only audit/event table with correlation IDs; store AI job lifecycle and attempt lifecycle events. |

---

## 15. Open Questions

- Should timers be strictly server-authoritative (anti-cheat) or “best-effort resume” only?
- Is cross-device resume required for MVP?
- What is the required cooldown policy and how does it vary by grade/program?
- What is the formal schema of `gemini_results` that must be guaranteed long-term?
- What model(s) are approved for production, and what is the fallback strategy?
