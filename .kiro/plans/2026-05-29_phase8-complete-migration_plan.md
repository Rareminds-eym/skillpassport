# Phase 8 — Complete FSD Migration Plan

**Date**: 2026-05-29
**Last Updated**: 2026-06-01 (Batch 4 complete — all 142 refs migrated including recruiter-pipeline)
**Based on**: Deep audit of all supabase usage in `src/` + steering file compliance check
**Status**: Batch 0 + 3 + 4 + 7 complete; infra cleanup done; ~60% total migration done

---

## Batch 7 — Entity Learner (88 refs, 20 files) ✅ DONE

Completed 2026-06-01. All 88 non-import supabase refs migrated to `apiPost`/`apiGet` via `POST /api/learner-profile/actions`. 20 files fully cleaned.

**New endpoint**: `functions/api/learner-profile/actions.ts` with actions:
- `get-learner-profile`, `upsert-education`, `upsert-experience`, `upsert-skill`, `upsert-certificate`, `upsert-project`, `upsert-training`, `upsert-learning`, `upsert-language`
- `get-admin-learners`, `get-authenticated-learner`
- `get-learner-connections`, `get-learner-conversations`
- `save-learner-settings`, `enroll-course`, `get-learner-enrollments`
- `get-institutions`

**Migrated files**:
- Model files: `useLearnerTrainings.ts`, `useAdminLearners.ts`, `useLearnerLearning.ts`, `useAuthenticatedLearner.ts`, `useLearnerMessages.ts`, `useLearnerEducation.ts`, `useLearnerExperience.ts`, `useLearnerSkills.ts`, `useLearnerCertificates.ts`, `useLearnerProjects.ts`, `useLearners.ts`, `useLearnerAdminMessages.ts`, `useLearnerCollegeAdminMessages.ts`, `useLearnerMessageNotifications.tsx`
- Service files: `learnerSettingsService.js`, `learnerEnrollmentService.ts`, `useInstitutions.ts`
- UI files: `OverviewTab.tsx`, `WeeklyLearningTracker.jsx`, `AdmissionNoteModal.tsx`, `SchoolAdmissionNoteModal.tsx`

---

## Infrastructure Cleanup (done alongside Batch 7)

- Removed 128 dead `import { supabase } from '@/shared/api/supabaseClient'` lines across `src/`
- Deleted `src/shared/api/supabase.ts` (zero consumers) — T-10.4
- Created `functions/api/exams/actions.ts` — for ResultsStep classwise-stats migration
- Created `functions/api/explorer/actions.ts` — for PuterDemo table-samples + RoleDebugger
- Added `save-generated-assessment` + `load-generated-assessment` to assessment actions
- Migrated `assessmentGenerationService.js` dynamic imports (T-1.2)
- Migrated `ResultsStep.tsx` dynamic import (T-8.4)
- Migrated `RoleDebugger.tsx` direct supabase import
- Migrated `PuterDemo.tsx` dynamic import (T-10.4)
- Migrated `resumeParserService.ts` (removed unused dynamic import)
- Restored `supabaseClient.ts` with full implementation
- Updated `.kiro/specs/missing-imports-fix/preservation.property.test.js`

---
**Principle**: Batch by feature/domain, not by file. Each batch:
1. Creates/updates backend Pages Function endpoints in `functions/api/`
2. Replaces `supabase.from()` calls with `apiGet`/`apiPost` in the frontend
3. Removes `supabase` imports from migrated files (only when ALL calls in file are migrated)

**Order**: Most-impacted features first, simplest features last.

---

## Steering File Compliance

All new/modified backend endpoints MUST:
- Use `withAuth` from `@rareminds-eym/auth-core` (01-security-compliance §0.1)
- Authorize EVERY operation via `user.roles[]` array, scope writes to `user.id`
- Validate parsed integers with `isNaN()` + range guards (01-security-compliance §2.1)
- Return consistent error format via `apiDbError()` for DB errors (never `error.message`)
- Use `service_role` client (`getServiceClient`) for backend queries
- Never remove `supabase` import while remaining `supabase` calls still exist in the file

---

## Current Scope (as of 2026-06-01)

**Total remaining**: **~680 non-import supabase refs across ~140 files**
**Completed so far**: Batch 0 (30 refs) + Batch 3 (142 refs) + Batch 4 opps (100 refs) + Batch 7 (88 refs) + infra cleanup (128 dead imports) = ~360 refs + 128 import cleanups

| Domain | Refs | Files | Status |
|--------|------|-------|:------|
| `pages/admin/` | 142 | 23 | ⏸️ |
| `features/assessment/` | 121 | 13 | ⏸️ |
| `features/educator/` | 91 | 11 | ⏸️ |
| `pages/educator/` + `teacher/` + `event/` | 74 | 8 | ⏸️ |
| `features/courses/` | 65 | 10 | ⏸️ |
| `features/recruiter-pipeline/` | 42 | 4 | ⏸️ Batch 4 remainder |
| `features/messaging/` | 24 | 11 | ⏸️ |
| `features/admin/` | 23 | 3 | ⏸️ |
| `features/ai-tutor/` | 18 | 3 | ⏸️ |
| `features/university-ai/` | 17 | 2 | ⏸️ |
| `features/placement/` | 14 | 3 | ⏸️ |
| `features/exams/` | 13 | 3 | ⏸️ |
| `features/myclass/` | 8 | 2 | ⏸️ |
| `features/onboarding/` | 2 | 1 | ⏸️ |
| `features/college-admin/` | 3 | 2 | ⏸️ |
| Misc pages & dead imports | 25 | 20 | ⏸️ |
| **Total remaining** | **~724** | **~140** | |

---

## Batch 0 — Low-Hanging Fruit (DONE)

Batch 0 covered ~30 calls across files where endpoints already existed.

| Task | Calls | Status |
|------|------:|:------:|
| T-0.1 Library | 10 | ✅ |
| T-0.2 Admin Learner | 2 | ✅ |
| T-0.3 Recruiter offers | 1 | ✅ |
| T-0.4 User entities | 8+RPC | ✅ |
| T-0.5 Pages | 4 | ✅ Partial |
| T-0.6 Opportunities (5 calls) | 5 | ✅ |
| T-0.7 debugRecentUpdates | 1 | ⏸️ Deferred |

**Remaining after Batch 0**: ~982 refs across ~165 files

---

## Batch 1 — Assessment Services (121 refs, 13 files)

Heaviest files: `examsService.ts` (36), `assessmentService.js` (35), `useAssessmentResults.js` (22), `useAssessmentSubmission.ts` (10), `externalAssessmentService.js` (9)

**Tables**: `assessments`, `assessment_attempts`, `assessment_results`, `assessment_questions`, `adaptive_assessment_sessions`, `exams`, `exam_results`, `exam_attempts`, `certificate_assessments`, `learner_grades`, `career_tracks`, `recommended_courses`

**Strategy**: Create `POST /api/assessment` with actions per query type. Heavy files (examsService, assessmentService) each need 1-2 days.

**Endpoints needed**: 1-2 consolidated
**Risk**: Medium (complex assessment logic, multiple table joins)
**Est. effort**: 3-4 days

---

## Batch 2 — Educator Domain (165 refs, 19 files)

**features/educator/** (91 refs, 11 files): `coursesService.ts` (33), `assignmentsService.js` (22), `AddLearnerModal.tsx` (12), `useEducatorSchool.ts` (5), `useEducatorId.ts` (4), `LearnerProfileDrawer.tsx` (3), `mentorNotes.ts` (3), `CourseProgressAnalytics.jsx` (2), `useCollegeEducatorAdminConversations.ts` (2), `LearnerSelectionModal.tsx` (4)

**pages/educator/** (58 refs, 6 files): `MarkAttendance.tsx` (22), `AssessmentResults.tsx` (10), `Settings.tsx` (10), `Assessments.tsx` (6), `SkillCurricular.tsx` (6), `CollegeSkillTasks.tsx` (4)

**pages/teacher/ + pages/event/** (16 refs): `MyTimetable.tsx` (15), `EventSalesSuccess.jsx` (1)

**Tables**: `courses`, `course_materials`, `assignments`, `assignment_submissions`, `learners`, `class_assignments`, `attendance_records`, `timetable_slots`, `skill_curricular`, `mentor_notes`, `assessment_results`

**Strategy**: Create `POST /api/educator`, extend `POST /api/teacher`. Heavy files like `coursesService.ts` (33) and `assignmentsService.js` (22) need dedicated endpoints.

**Endpoints needed**: 2-3
**Risk**: Medium-low
**Est. effort**: 3-4 days

---

## Batch 3 — Learner Profile (142 refs, 20 files) ✅ DONE

Completed 2026-06-01. All 103 supabase calls migrated across 20 files. Zero `supabase.` references remain in `src/features/learner-profile/`.

**Key migrations**:
- `useLearnerData.ts` (×2) — 40 calls to 15 different `apiPost` actions
- `EventsTab.tsx`, `ExamResultsTab.tsx` — tab data via existing club-event and result data actions
- `AdmissionNoteModal.tsx`, `SchoolAdmissionNoteModal.tsx` — modal message sending
- `useLearnerPortfolio.ts` — 6 calls via helper `fetchData` wrapper

**Deep audit fixes applied**:
- Fixed 47 `apiPost('action-name', {...})` calls → correct `apiPost('/learner-profile/actions', { action: 'action-name', ... })` pattern
- Fixed `trainingId` → `trainingIds: [train.id]` in `useLearnerPortfolio.ts` (plural array, back-end contract)
- Verified zero cross-boundary imports, zero `supabaseClient` refs in `src/`, TypeScript compiles clean

---

## Batch 4 — Opportunities Full Migration (142 refs, 14 files) — DONE ✅ (2026-06-01)

### Recap

**All 9 files in `src/features/opportunities/` + all 4 files in `src/features/recruiter-pipeline/` migrated to `apiPost`/`apiGet`**. Zero supabase refs remain in the feature.

### Backend endpoint: `POST /api/recruiter-pipeline`

New endpoint `functions/api/recruiter-pipeline/[[path]].ts` (877 lines) with 30 actions covering:
- **Pipeline candidates**: get-requisitions, get-requisition-by-id, get-opportunity-by-id, get-requisitions-with-stats, get-pipeline-candidates, get-pipeline-candidates-by-stage, get-pipeline-candidates-with-filters, get-all-pipeline-candidates-by-stage, get-candidate-activities, get-pipeline-statistics
- **Skills analytics**: get-top-skills-in-demand, get-skills-demand-analysis, debug-opportunities-table
- **Filter options**: get-filter-options (departments, locations, titles)
- **Learner profile**: get-learner-projects, get-learner-certificates, get-learner-assignments
- **Pipeline mutations**: add-candidate-to-pipeline, move-candidate-to-stage, update-next-action, reject-candidate, update-candidate-rating, assign-candidate, remove-candidate-from-pipeline, log-pipeline-activity, bulk-move-candidates, bulk-reject-candidates

### Files migrated

| File | Refs | Notes |
|------|-----:|:------|
| `pipelineService.ts` | 27 | All 19 functions → apiPost pattern |
| `skillsAnalyticsService.js` | 7 | 3 methods → apiPost with backend processing |
| `AdvancedRequisitionFilters.tsx` | 5 | 3 active + 2 in dead comments → single `get-filter-options` call |
| `CandidateProfileDrawer.tsx` | 3 | Projects, certificates, assignments → 3 apiPost calls |

### Verification
- `src/` tsc: 0 errors ✅
- No cross-boundary imports ✅
- Backend endpoint created with `withAuth` middleware ✅

---

## Batch 5 — Admin Pages (142 refs, 23 files)

**pages/admin/collegeAdmin/** (most): `ExaminationManagement.tsx` (20), `Dashboard.tsx` (11), `EnrolledLearners.tsx` (9), `MentorAllocation.tsx` (8), `ProgramManagement.tsx` (7), `CourseManagement.tsx` (6), `Library.tsx` (5), `LearnerCollegeAdminCommunication.tsx` (5), `AcademicCoverageTracker.tsx` (1), `AssessmentResults.tsx` (3), `BrowseCourses.jsx` (1), `Courses.tsx` (1), `Departmentmanagement.tsx` (1), `DigitalPortfolio.tsx` (2), `GraduationEligibility.tsx`, `ProgramSectionManagement.tsx` (8), `placement/*` (3)

**pages/admin/schoolAdmin/** (many): `Library.tsx` (14), `SkillBadges.tsx` (13), `LearnerCommunication.tsx` (9), `EducatorCommunication.tsx` (5), `SkillCurricular.tsx` (6), `AttendanceReports.tsx`, `CurriculumBuilderWrapper.tsx` (1), `Courses.tsx` (3), `Dashboard.tsx`, `MessageCenter.tsx`, `Verifications.tsx`

**pages/admin/universityAdmin/**: `SyllabusApproval.tsx`, `CentralizedResults.tsx`, `CircularsManagement.tsx`, etc.

**Strategy**: Pages should use existing feature service endpoints. Create missing college-admin endpoints in batches with shared `POST /api/college-admin/[[path]]`.

**Endpoints needed**: 3-5 (college-admin shared, school-admin shared)
**Risk**: Medium-low
**Est. effort**: 4-5 days

---

## Batch 6 — Courses + AI Tutor (55 refs, 13 files)

**features/courses/** (37 refs, 10 files): `courseRepository.js` (9), `CoursePlayer.jsx` (10), `useCourses.ts` (6), `courseEmbeddingManager.ts` (7), `recommendationService.ts` (2), `AssignEducatorModal.tsx` (1), `recommendationService.js` (2)

**features/ai-tutor/** (18 refs, 3 files): `aiRecommendationService.ts` (5), `tutorService.ts` (4), `videoSummarizerService.ts` (9)

**Tables**: `courses`, `course_enrollments`, `course_content`, `course_embeddings`, `recommendations`, `ai_recommendations`, `tutor_sessions`, `video_summaries`

**Strategy**: Create `POST /api/courses` and extend for ai-tutor.

**Endpoints needed**: 2
**Risk**: Low-Medium
**Est. effort**: 2 days

---

## Batch 7 — Entity Learner (88 refs, 20 files)

**entities/learner/model/**: `useLearnerEducation.ts` (1), `useLearnerExperience.ts` (1), `useLearnerSkills.ts` (1), `useLearnerLearning.ts` (3), `useLearnerTrainings.ts` (7), `useLearnerCertificates.ts` (1), `useLearnerProjects.ts` (1), `useAdminLearners.ts` (9), `useAuthenticatedLearner.ts` (3), `useLearnerMessages.ts` (3), `useLearnerMessageNotifications.tsx` (1), `useLearners.ts` (1), `useLearnerAdminMessages.ts` (1), `useLearnerCollegeAdminMessages.ts` (1), `learnerSettingsService.js` (8)

**entities/learner/ui/**: `OverviewTab.tsx` (26), `WeeklyLearningTracker.jsx` (7), `AdmissionNoteModal.tsx` (4), `SchoolAdmissionNoteModal.tsx` (4)

**entities/institution/** (8 refs): `useInstitutions.ts` (8)

**Tables**: `learners`, `learner_education`, `learner_experience`, `learner_skills`, `learner_learning`, `learner_trainings`, `learner_certificates`, `learner_projects`, `institutions`, `messages`, `admission_notes`, `weekly_learning_tracker`

**Strategy**: Create `POST /api/entities/learners` for entity-layer operations. Entity model files are simpler (1-3 calls each) but numerous.

**Endpoints needed**: 1-2
**Risk**: Low
**Est. effort**: 3 days

---

## Batch 8 — Messaging + Exams + Placement (51 refs, 17 files)

**features/messaging/** (24 refs, 11 files): 11 conversation modals (1-5 refs each) for creating new conversations via `supabase.from('conversations')`

**features/exams/** (13 refs, 3 files): `learnerExamService.ts` (5), `useExams.ts` (4), `ResultsStep.tsx` (4)

**features/placement/** (14 refs, 3 files): `learnerPipelineService.ts` (6), `placementAnalyticsService.ts` (5), `PlacementAnalytics.tsx` (3)

**Tables**: `conversations`, `conversation_participants`, `exams`, `exam_results`, `placements`, `pipeline_tracking`

**Strategy**: Simple endpoints — `POST /api/messaging/conversations`, `POST /api/exams`, `POST /api/placement`.

**Endpoints needed**: 3
**Risk**: Low
**Est. effort**: 2 days

---

## Batch 9 — Analytics + Realtime (18 refs + 13 channels)

**features/analytics/** (17 from + 1 RPC): `dashboardService.ts` (largest), `optimizedQueryService.ts`, `useAnalytics.ts`

**Tables**: `learners`, `projects`, `certificates`, `trainings`, `skills`, `attendance_records`, `shortlist_candidates`, `pipeline_*`, `offers`, `placements`, `shortlists`, `interviews`, `recruiter_activities`

**Strategy**: `POST /api/analytics/query` with safe dynamic query builder. Realtime channels (13 across 10 files) evaluated separately.

**Endpoints needed**: 1
**Risk**: High (dynamic query construction, SQL injection prevention)
**Est. effort**: 2 days + 1 day for channel evaluation

---

## Batch 10 — College Admin Services + Infrastructure (62 refs, ~15 files) ✅ Done

**features/college-admin/** (remaining, not batches 1-3): services for competitions, circulars, exams, finance, assessments, assignments, transcripts, mark entries, learner admissions. Plus notification/wiring RPCs.

**features/admin/** (23 refs, 3 files): `adminNotificationService.ts` (10), `KPIDashboardAdvanced.tsx` (6), `ClassManagementModals.tsx` (7)

**features/university-ai/** (17 refs, 2 files): `universityCollegeService.ts` (9), `universityService.ts` (8)

**features/myclass/** (8 refs, 2 files): `useOptimizedCoCurricularsData.ts` (4), `index.ts` (4)

**Infrastructure cleanup**: `shared/api/supabase.ts` orphaned (5 refs), 20 dead import files, httpClient.ts env exports

**Endpoints needed**: 5-8
**Risk**: Medium-low
**Est. effort**: 3-4 days

---

## Summary

| Batch | Domain | Refs | Files | Risk | Est. Days | Status |
|-------|--------|-----:|------:|:----:|:---------:|:------:|
| **0** | Low-hanging fruit | ~30 | ~15 | Very low | 2 | ✅ Done |
| **1** | Assessment | 121 | 13 | Medium | 3-4 | ⏸️ Hold |
| **2** | Educator domain | 165 | 19 | Med-low | 3-4 | ⏸️ |
| **3** | Learner Profile | 142 | 20 | Medium | 3-4 | ✅ Done |
| **4** | Opportunities full | 100 | 10 | Medium | 2-3 | ⏸️ |
| **5** | Admin Pages | 142 | 23 | Med-low | 4-5 | ⏸️ |
| **6** | Courses + AI Tutor | 55 | 13 | Low-Med | 2 | ⏸️ |
| **7** | Entity Learner | 88 | 20 | Low | 3 | ✅ Done |
| **8** | Messaging + Exams + Placement | 51 | 17 | Low | 2 | ⏸️ |
| **9** | Analytics + Realtime | 18 | 10 | High | 3 | ⏸️ |
| **10** | College Admin svcs + Infra | 72 | 15 | Med-low | 3-4 | ⏸️ |
| | **Total** | **1,012** | **~170** | | **~30-36 days** | **~37%** |

**Total new endpoints needed**: ~25-35
**Files requiring endpoints first**: ~50 (service files; the rest are page UIs that call existing services)

---

## Deployment Order

1. **Batch 0** (done) — Quick wins
2. **Batches 1+4** (next) — Assessment + Opportunities (services that need endpoints)
3. **Batches 2+3** — Educator + Learner Profile
4. **Batches 5+7** — Admin pages + Entity learner
5. **Batches 6+8** — Courses + AI Tutor, Messaging + Exams + Placement
6. **Batch 9** — Analytics (needs careful review)
7. **Batch 10** — College Admin remaining + Infrastructure cleanup

---

## Guidelines

1. Always use `withAuth` — never expose unauthenticated endpoints
2. Authz: scope update/delete to `user.id` or owned resource
3. Never remove `supabase` import while other calls remain in the file
4. Validate all `parseInt` with `isNaN()` + range guards
5. Use `apiDbError()` for DB errors — never pass `error.message` to clients
6. Ask approval for fallback logic, legacy code, backward compat
7. No shared utilities across `functions/` ↔ `src/` boundary
8. Every task: verify Vite build + backend tsc + no cross-boundary imports
