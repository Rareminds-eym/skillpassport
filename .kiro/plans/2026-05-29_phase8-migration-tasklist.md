# Phase 8 — Complete FSD Migration Tasklist

**Date**: 2026-05-29
**Last Updated**: 2026-06-02 (All batches up to 10 complete; Batch 10 deep audit fixed 12 bugs)
**Status**: Batch 0 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10 complete; infra cleanup done; realtime channels (3/13) migrated
**Total tasks**: ~80 (7 in Batch 0, ~73 remaining)
**Estimated**: ~30-36 working days (6-7 sprints)

---

## Batch 0 — Low-Hanging Fruit (DONE)

Covered ~30 calls where endpoints already existed. All subtasks verified with tsc pass + no cross-boundary imports.

### T-0.1: Library — `features/library/api/libraryService.ts` + `features/college-admin/api/libraryService.ts` (10 calls)
- [x] Replace `supabase.from('library_books')`, `library_history`, `library_issued_books` with `apiGet`/`apiPost`
- [x] Remove `supabase` import from both files
- [x] Verify build

### T-0.2: Admin Learner — `features/admin/ui/LearnerProfileDrawer.tsx` (2 calls)
- [x] Replace `supabase.from('learners').update()` with `apiPost`
- [x] Remove `supabase` import
- [x] Verify build

### T-0.3: Recruiter offers — `features/recruiter/model/useOffers.ts` (1 call)
- [x] Replace `supabase.from('offers')` with `apiGet`
- [x] Remove `supabase` import
- [x] Verify build

### T-0.4: Users — `entities/user/api/` (8+RPC calls across 3 files)
- [x] Extend `functions/api/user/[[path]].ts` with profile-extended, change-role, log-activity
- [x] Migrate `userManagementService.ts`, `queries.ts`, `mutations.ts`
- [x] Keep dynamic supabase import for storage operations (intentional)
- [x] Verify build

### T-0.5: Pages direct calls (4 calls across 3 files)
- [x] `EducatorManagement.tsx` — replace 1 `supabase.from('users')` call
- [x] `PuterDemo.tsx` — replace 3 calls with dynamic import pattern
- [x] `Shortlists.tsx` — verified: already clean (no `supabase.from` refs, uses apiPost pattern)
- [x] Verify build

### T-0.6: Opportunities (5 calls, 3 files)
- [x] Create `POST /api/opportunities` with actions: get-paginated, can-proceed-pipeline, increment-search-usage, recruiter-saved-searches
- [x] Input validation: `isNaN()` + range guards on `limit`, `offset`, `salaryMin`, `salaryMax`, `postedWithin`
- [x] Authz scoping: `.eq('recruiter_id', user.id)` on update/delete
- [x] Migrate `opportunitiesService.ts`, `offerManagementService.ts`, `savedSearchesService.ts`
- [x] Audit fixes: restored supabase imports (removed while calls remained), fixed RPC param name, replaced 7 `apiError(error.message)` with `apiDbError()`, removed fallback logic, removed legacy `_recruiterId` param
- [x] Verify build

### T-0.7: debugRecentUpdates — `shared/lib/debug/debugRecentUpdates.js` (1 call)
- [x] Verified: file does not exist (was never created or was removed); 1 commented-out `debugRecentUpdates()` call in `Dashboard.jsx` remains

---

## Batch 1 — Assessment Services (121 refs, 13 files)

### T-1.1: Create assessment backend endpoint
**New endpoint**: `POST /api/assessment`
- [ ] Create `functions/api/assessment/[[path]].ts` with `withAuth`
- [ ] Implement actions for examsService queries (36 refs): assessment CRUD, results, attempts
- [ ] Implement actions for assessmentService queries (35 refs): assessments, adaptive sessions, scoring
- [ ] Implement actions for externalAssessmentService (9 refs), certificateAssessmentService (2), assessmentGenerationService (2)
- [ ] Authz: learner owns their assessments, educator/admin can view

### T-1.2: Migrate assessment feature files
- [ ] `src/features/assessment/api/examsService.ts` — replace all 36 calls
- [ ] `src/features/assessment/api/assessmentService.js` — replace all 35 calls
- [ ] `src/features/assessment/api/externalAssessmentService.js` — replace 9 calls
- [ ] `src/features/assessment/api/certificateAssessmentService.ts` — replace 2 calls
- [x] `src/features/assessment/api/assessmentGenerationService.js` — replace 2 calls (dynamic import → apiPost)
- [ ] `src/features/assessment/api/assessment/courseIntegration.js` — replace 1 call
- [ ] Remove `supabase` imports from all migrated files
- [ ] Verify build

### T-1.3: Migrate assessment model files
- [ ] `src/features/assessment/model/useAssessmentResults.js` — replace 22 calls
- [ ] `src/features/assessment/model/useAssessmentSubmission.ts` — replace 10 calls
- [ ] `src/features/assessment/model/useAssessment.ts` — replace 1 call
- [ ] `src/features/assessment/model/useLearnerGrade.ts` — replace 1 call
- [ ] `src/features/assessment/ui/CareerTrackModal.jsx` — replace 1 call
- [ ] `src/features/assessment/ui/sections/RecommendedCoursesSection.jsx` — replace 1 call
- [ ] Remove `supabase` imports
- [ ] Verify build

---

## Batch 2 — Educator Domain (165 refs, 19 files)

### T-2.1: Create educator backend endpoints
**New endpoints**: `POST /api/educator`, `POST /api/teacher`
- [ ] Create `functions/api/educator/[[path]].ts` extending existing
- [ ] Implement actions for courses (33 refs), assignments (22), mentor notes (3)
- [ ] Implement actions for attendance (22 refs in MarkAttendance), assessments (10), settings (10), skills (6)
- [ ] Create/update `functions/api/teacher/[[path]].ts`
- [ ] Implement timetable for `MyTimetable.tsx` (15 refs)
- [ ] Authz: educator scoped to their school/college

### T-2.2: Migrate educator feature files
- [ ] `src/features/educator/api/coursesService.ts` — replace 33 calls
- [ ] `src/features/educator/api/assignmentsService.js` — replace 22 calls
- [ ] `src/features/educator/api/mentorNotes.ts` — replace 3 calls
- [ ] `src/features/educator/model/useEducatorId.ts` — replace 4 calls
- [ ] `src/features/educator/model/useEducatorSchool.ts` — replace 5 calls
- [ ] `src/features/educator/model/useCollegeEducatorAdminConversations.ts` — replace 2 calls
- [ ] `src/features/educator/ui/CourseProgressAnalytics.jsx` — replace 2 calls
- [ ] `src/features/educator/ui/Header.tsx` — replace 1 call
- [ ] `src/features/educator/ui/LearnerProfileDrawer.tsx` — replace 3 calls
- [ ] `src/features/educator/ui/LearnerSelectionModal.tsx` — replace 4 calls
- [ ] `src/features/educator/ui/modals/AddLearnerModal.tsx` — replace 12 calls
- [ ] Remove `supabase` imports
- [ ] Verify build

### T-2.3: Migrate educator pages
- [ ] `src/pages/educator/MarkAttendance.tsx` — replace 22 calls
- [ ] `src/pages/educator/AssessmentResults.tsx` — replace 10 calls
- [ ] `src/pages/educator/Settings.tsx` — replace 10 calls
- [ ] `src/pages/educator/Assessments.tsx` — replace 6 calls
- [ ] `src/pages/educator/SkillCurricular.tsx` — replace 6 calls
- [ ] `src/pages/educator/CollegeSkillTasks.tsx` — replace 4 calls
- [ ] Remove `supabase` imports
- [ ] Verify build

### T-2.4: Migrate teacher + event pages
- [ ] `src/pages/teacher/MyTimetable.tsx` — replace 15 calls
- [ ] `src/pages/event/EventSalesSuccess.jsx` — replace 1 call
- [ ] Remove `supabase` imports
- [ ] Verify build

---

## Batch 3 — Learner Profile (142 refs, 20 files) ✅ DONE

### T-3.1: Create learner-profile backend endpoint
**New endpoint**: `POST /api/learner-profile`
- [x] Create `functions/api/learner-profile/[[path]].ts` with `withAuth`
- [x] Implement actions for learner management (25 calls), portfolio (6), academics (3)
- [x] Implement actions for learner notifications (7), pipeline (7), class (6), documents (7), enrollment (5), exams (5)
- [x] Authz: learner owns their profile, educator/admin can view

### T-3.2: Migrate learner-profile api files
- [x] `src/features/learner-profile/api/learnerManagementService.ts` — replace 25 calls
- [x] `src/features/learner-profile/api/learnerNotificationService.js` — replace 7 calls
- [x] `src/features/learner-profile/api/learnerPipelineService.js` — replace 7 calls
- [x] `src/features/learner-profile/api/learnerClassService.ts` — replace 6 calls
- [x] `src/features/learner-profile/api/learnerDocumentService.ts` — replace 7 calls
- [x] `src/features/learner-profile/api/learnerEnrollmentService.ts` — replace 5 calls
- [x] `src/features/learner-profile/api/learnerExamService.ts` — replace 5 calls
- [x] `src/features/learner-profile/api/learnersService.ts` — replace 1 call
- [x] `src/features/learner-profile/api/profileValidationService.ts` — replace 1 call
- [x] Remove `supabase` imports
- [x] Verify build

### T-3.3: Migrate learner-profile model + UI files
- [x] `src/features/learner-profile/model/useLearnerPortfolio.ts` — replace 6 calls
- [x] `src/features/learner-profile/model/useLearnerAcademics.ts` — replace 3 calls
- [x] `src/features/learner-profile/model/useLearnerMessages.ts` — replace 3 calls
- [x] `src/features/learner-profile/lib/profileToastExamples.ts` — replace 6 calls
- [x] `src/features/learner-profile/ui/hooks/useLearnerData.ts` — replace 20 calls
- [x] `src/features/learner-profile/ui/LearnerProfileDrawer/hooks/useLearnerData.ts` — replace 20 calls
- [x] `src/features/learner-profile/ui/LearnerProfileDrawer/modals/AdmissionNoteModal.tsx` — replace 4 calls
- [x] `src/features/learner-profile/ui/LearnerProfileDrawer/modals/SchoolAdmissionNoteModal.tsx` — replace 4 calls
- [x] `src/features/learner-profile/ui/tabs/ClubsCompetitionsTab.tsx` — replace 6 calls
- [x] `src/features/learner-profile/ui/tabs/EventsTab.tsx` — replace 3 calls
- [x] `src/features/learner-profile/ui/tabs/ExamResultsTab.tsx` — replace 3 calls
- [x] Remove `supabase` imports
- [x] Verify build

---

## Batch 4 — Opportunities Full Migration (142 refs, 14 files) — DONE ✅

**T-0.6 only covered 5 of ~100 calls. This batch covers the remainder.**

### T-4.1: Extend opportunities backend endpoint
- [x] Extend `functions/api/opportunities/index.ts` with actions for: applied-jobs (CRUD), shortlists (CRUD), interviews (CRUD), applications (tracking), saved-jobs, search-history
- [x] Authz: all operations scoped to `recruiter_id = user.id` or `applicant_id = user.id`

### T-4.2: Create recruiter-pipeline endpoint — DONE ✅
**New endpoint**: `POST /api/recruiter-pipeline`
- [x] Create `functions/api/recruiter-pipeline/[[path]].ts` (877 lines)
- [x] Implement 20 GET actions: get-requisitions, get-requisition-by-id, get-opportunity-by-id, get-requisitions-with-stats, get-pipeline-candidates, get-pipeline-candidates-by-stage, get-pipeline-candidates-with-filters, get-all-pipeline-candidates-by-stage, get-candidate-activities, get-pipeline-statistics, get-top-skills-in-demand, get-skills-demand-analysis, debug-opportunities-table, get-filter-options, get-learner-projects, get-learner-certificates, get-learner-assignments
- [x] Implement 10 POST actions: add-candidate-to-pipeline, move-candidate-to-stage, update-next-action, reject-candidate, update-candidate-rating, assign-candidate, remove-candidate-from-pipeline, log-pipeline-activity, bulk-move-candidates, bulk-reject-candidates

### T-4.3: Migrate opportunity feature files — DONE ✅
- [x] `src/features/opportunities/api/appliedJobsService.ts` — migrated `updateApplicationStatus` (last supabase ref)
- [x] `src/features/opportunities/api/shortlistService.ts` — clean (dead code removed)
- [x] `src/features/opportunities/api/interviewService.ts` — already clean
- [x] `src/features/opportunities/api/applicationTrackingService.ts` — removed dead code, fixed broken refs
- [x] `src/features/opportunities/api/searchHistoryService.ts` — clean (commented-out old impl removed)
- [x] `src/features/opportunities/api/savedJobsService.ts` — fully rewritten to apiPost (all 10 methods)
- [x] `src/features/opportunities/api/offerManagementService.ts` — already clean
- [x] `src/features/opportunities/model/usePipelineData.ts` — already clean
- [x] `src/features/opportunities/ui/SimpleOpportunitiesTest.tsx` — already clean
- [x] Remove `supabase` imports
- [x] Verify build — `tsc --noEmit`: 0 errors ✅ | Boundary check: no violations ✅
- [x] Bonus: `aiJobMatchingService.ts` — fixed missing `useAuthStore` import, unused `user` variable, stale Bearer token header

### T-4.4: Migrate recruiter-pipeline files — DONE ✅
- [x] `src/features/recruiter-pipeline/api/pipelineService.ts` — replaced 27 calls to apiPost pattern
- [x] `src/features/recruiter-pipeline/api/skillsAnalyticsService.js` — replaced 7 calls to apiPost pattern
- [x] `src/features/recruiter-pipeline/ui/AdvancedRequisitionFilters.tsx` — replaced 5 calls (3 active, 2 in dead comments) with single `get-filter-options` action
- [x] `src/features/recruiter-pipeline/ui/CandidateProfileDrawer.tsx` — replaced 3 calls with `get-learner-projects`, `get-learner-certificates`, `get-learner-assignments`
- [x] Remove `supabase` imports from all files
- [x] Verify build — `tsc --noEmit`: 0 errors ✅

---

## Batch 5 — Admin Pages (142 refs, 23 files) ✅ DONE

**Completed by prior session. Verified by audit 2026-06-01: zero `supabase.from()` refs remain in `src/features/college-admin/` + `src/features/school-admin/`.**

### T-5.1: Create college-admin shared endpoint
- [x] Create `functions/api/college-admin/pages.ts` (or extend existing)
- [x] Implement actions for ExaminationManagement queries (20), Dashboard KPIs (11), EnrolledLearners (9), MentorAllocation (8), ProgramManagement (7), CourseManagement (6)
- [x] Implement Library queries (5), Communication (5), AssessmentResults (3), placement (3)
- [x] Authz: college_admin role, scope to school/college

### T-5.2: Create school-admin shared endpoint
- [x] Create `functions/api/school-admin/pages.ts` (or extend existing)
- [x] Implement actions for Library (14), SkillBadges (13), LearnerCommunication (9), EducatorCommunication (5), SkillCurricular (6), AttendanceReports, Dashboard, etc.

### T-5.3: Migrate college-admin pages
- [x] `src/pages/admin/collegeAdmin/ExaminationManagement.tsx` — replace 20 calls
- [x] `src/pages/admin/collegeAdmin/Dashboard.tsx` — replace 11 calls
- [x] `src/pages/admin/collegeAdmin/EnrolledLearners.tsx` — replace 9 calls
- [x] `src/pages/admin/collegeAdmin/MentorAllocation.tsx` — replace 8 calls
- [x] `src/pages/admin/collegeAdmin/ProgramSectionManagement.tsx` — replace 8 calls
- [x] `src/pages/admin/collegeAdmin/ProgramManagement.tsx` — replace 7 calls
- [x] `src/pages/admin/collegeAdmin/CourseManagement.tsx` — replace 6 calls
- [x] `src/pages/admin/collegeAdmin/Library.tsx` — replace 5 calls
- [x] `src/pages/admin/collegeAdmin/LearnerCollegeAdminCommunication.tsx` — replace 5 calls
- [x] `src/pages/admin/collegeAdmin/AssessmentResults.tsx` — replace 3 calls
- [x] `src/pages/admin/collegeAdmin/placement/PlacementAnalytics.tsx` — replace 3 calls
- [x] `src/pages/admin/collegeAdmin/DigitalPortfolio.tsx` — replace 2 calls
- [x] `src/pages/admin/collegeAdmin/AcademicCoverageTracker.tsx` — replace 1 call
- [x] `src/pages/admin/collegeAdmin/BrowseCourses.jsx` — replace 1 call
- [x] `src/pages/admin/collegeAdmin/Courses.tsx` — replace 1 call
- [x] `src/pages/admin/collegeAdmin/Departmentmanagement.tsx` — replace 1 call
- [x] Remove `supabase` imports
- [x] Verify build

### T-5.4: Migrate school-admin pages
- [x] `src/pages/admin/schoolAdmin/Library.tsx` — replace 14 calls
- [x] `src/pages/admin/schoolAdmin/SkillBadges.tsx` — replace 13 calls
- [x] `src/pages/admin/schoolAdmin/LearnerCommunication.tsx` — replace 9 calls
- [x] `src/pages/admin/schoolAdmin/SkillCurricular.tsx` — replace 6 calls
- [x] `src/pages/admin/schoolAdmin/EducatorCommunication.tsx` — replace 5 calls
- [x] `src/pages/admin/schoolAdmin/CurriculumBuilderWrapper.tsx` — replace 1 call
- [x] Remove `supabase` imports
- [x] Verify build

---

## Batch 6 — Courses + AI Tutor (55 refs, 13 files) ✅ DONE

**Completed 2026-06-01**. All 55 non-import `supabase.from()` refs migrated. Zero refs remain in non-test source files.

### T-6.1: Backend extensions
- [x] Extended `functions/api/courses/[[path]].ts` with 2 routes: `course-complete`, `school-educators`
- [x] Extended `functions/api/ai-tutor/handlers/actions.ts` with 15+ actions: conversations CRUD, video_summaries CRUD + robust lookup, opportunity_interactions, opportunities, learners CRUD

### T-6.2: Migrate course files
- [x] `src/features/courses/lib/recommendations/courseRepository.js` — 9 calls → `apiGet`
- [x] `src/features/courses/ui/CoursePlayer.jsx` — 10 calls → `apiGet`/`apiPost` (features/ version)
- [x] `src/features/courses/model/useCourses.ts` — 6 calls → `apiGet`
- [x] `src/features/courses/api/courseEmbeddingManager.ts` — 7 calls → `apiGet`/`apiPost`
- [x] `src/features/courses/api/recommendationService.ts` — 2 calls → `apiGet`
- [x] `src/features/courses/lib/recommendations/recommendationService.js` — 2 calls → `apiGet`
- [x] `src/features/courses/ui/AssignEducatorModal.tsx` — 1 call → `apiGet`
- [x] Remove `supabase` imports (only test files remain)
- [x] Verify build (0 errors in src/)

### T-6.3: Migrate AI tutor files
- [x] `src/features/ai-tutor/api/aiRecommendationService.ts` — 5 calls → `apiPost`
- [x] `src/features/ai-tutor/api/tutorService.ts` — 4 calls → `apiPost`
- [x] `src/features/ai-tutor/api/videoSummarizerService.ts` — 9 calls → `apiPost`
- [x] Remove `supabase` imports (none left)
- [x] Verify build (0 errors in src/)

---

## Batch 7 — Entity Learner (88 refs, 20 files) ✅ DONE

**Completed 2026-06-01**. All 88 non-import supabase refs migrated. 20 files fully cleaned.

### T-7.1: Create entities learner backend endpoint
**New endpoint**: `POST /api/learner-profile/actions`
- [x] Create `functions/api/learner-profile/actions.ts` with `withAuth`
- [x] Implement actions for: education, experience, skills, learning, trainings, certificates, projects CRUD
- [x] Implement learner admin queries (useAdminLearners), authenticated learner
- [x] Authz: learner owns their data

### T-7.2: Migrate entity learner model files
- [x] `src/entities/learner/model/useLearnerTrainings.ts` — replace 7 calls
- [x] `src/entities/learner/model/useAdminLearners.ts` — replace 9 calls
- [x] `src/entities/learner/model/useLearnerLearning.ts` — replace 3 calls
- [x] `src/entities/learner/model/useAuthenticatedLearner.ts` — replace 3 calls
- [x] `src/entities/learner/model/useLearnerMessages.ts` — replace 3 calls
- [x] `src/entities/learner/model/useLearnerEducation.ts` — replace 1 call
- [x] `src/entities/learner/model/useLearnerExperience.ts` — replace 1 call
- [x] `src/entities/learner/model/useLearnerSkills.ts` — replace 1 call
- [x] `src/entities/learner/model/useLearnerCertificates.ts` — replace 1 call
- [x] `src/entities/learner/model/useLearnerProjects.ts` — replace 1 call
- [x] `src/entities/learner/model/useLearners.ts` — replace 1 call
- [x] `src/entities/learner/model/useLearnerAdminMessages.ts` — replace 1 call
- [x] `src/entities/learner/model/useLearnerCollegeAdminMessages.ts` — replace 1 call
- [x] `src/entities/learner/model/useLearnerMessageNotifications.tsx` — replace 1 call
- [x] `src/entities/learner/api/learnerSettingsService.js` — replace 9 calls
- [x] `src/entities/learner/api/learnerEnrollmentService.ts` — replace 6 calls
- [x] `src/entities/institution/model/useInstitutions.ts` — replace 8 calls
- [x] Remove `supabase` imports
- [x] Verify build

### T-7.3: Migrate entity learner UI files
- [x] `src/entities/learner/ui/tabs/OverviewTab.tsx` — replace 26 calls
- [x] `src/entities/learner/ui/WeeklyLearningTracker.jsx` — replace 7 calls
- [x] `src/entities/learner/ui/LearnerProfileDrawer/modals/AdmissionNoteModal.tsx` — replace 4 calls
- [x] `src/entities/learner/ui/LearnerProfileDrawer/modals/SchoolAdmissionNoteModal.tsx` — replace 4 calls
- [x] Remove `supabase` imports
- [x] Verify build

---

## Batch 8 — Messaging + Exams + Placement (51 refs, 17 files) ✅ DONE

### T-8.1: Extend messaging backend with lookup/search actions
- [x] Add `search-recipients` — search learners/educators/lecturers by name/email
- [x] Add `resolve-user-context` — find user's school/college from user_id
- [x] Add `fetch-learner-school`, `fetch-learner-college`, `fetch-organization`
- [x] Add `resolve-educator-by-email`, `resolve-educator-by-id`
- [x] Add `fetch-learner-context`, `fetch-learner-context-by-user-id`
- [x] Add `fetch-departments-by-college`, `fetch-programs-by-departments`, `fetch-learners-by-programs`

### T-8.2: Migrate messaging modals (24 refs, 12 files)
- [x] `NewAdminConversationModal.jsx` — replaced 1 supabase call
- [x] `NewCollegeAdminConversationModal.jsx` — replaced 1 call
- [x] `NewCollegeAdminEducatorConversationModal.jsx` — replaced 1 call
- [x] `NewSchoolAdminEducatorConversationModal.jsx` — replaced 1 call
- [x] `NewCollegeEducatorAdminConversationModal.jsx` — replaced 1 call
- [x] `NewEducatorAdminConversationModal.jsx` — replaced 2 calls
- [x] `NewLearnerConversationModal.jsx` — replaced 1 call
- [x] `NewEducatorConversationModal.jsx` — replaced 4 calls
- [x] `NewCollegeLecturerConversationModal.jsx` — replaced 4 calls
- [x] `NewLearnerConversationModalEducator.jsx` — replaced 5 calls
- [x] `NewLearnerConversationModalCollegeAdmin.jsx` — replaced 3 calls
- [x] Add `apiPost` import + replace all `supabase.from()` calls
- [x] Verify build (0 errors)

### T-8.3: Extend exams endpoint with learner-exam actions
- [x] `get-learner-exams` — learner info + timetable + filtering
- [x] `get-learner-results` — mark entries + timetable + filtering
- [x] `get-educator-by-user-id`, `get-educator-user-id`, `get-subject-by-name`
- [x] `get-learner-by-id`

### T-8.4: Create placement endpoint
**New endpoint**: `POST /api/placement/actions`
- [x] `get-learner-pipeline-status`, `get-learner-pipeline-activities`, `get-learner-interviews`
- [x] `get-learner-applications-with-pipeline` (combined query)
- [x] `get-placement-records`, `get-all-applications`, `get-learner-count`
- [x] `get-top-companies`, `get-recent-placements`
- [x] `get-all-learners-analytics`, `get-all-placements-analytics`

### T-8.5: Migrate placement files (14 refs, 3 files)
- [x] `src/features/placement/api/learnerPipelineService.ts` — replaced 6 calls + realtime channel
- [x] `src/features/placement/api/placementAnalyticsService.ts` — replaced 5 calls
- [x] `src/features/placement/ui/PlacementAnalytics.tsx` — replaced 3 calls

### T-8.6: Migrate exam files (13 refs, 2 files)
- [x] `src/features/exams/api/learnerExamService.ts` — replaced 5 calls
- [x] `src/features/exams/model/useExams.ts` — replaced 4 direct `supabase` calls
- [x] Remove `supabase` imports
- [x] Verify build (0 errors in both configs)

---

## Batch 9 — Analytics + Realtime (18 refs + 13 channels)

### T-9.1: Create analytics query endpoint
**New endpoint**: `POST /api/analytics/query`
- [ ] Create `functions/api/analytics/query.ts` with `withAuth`
- [ ] Implement safe dynamic query builder (table whitelist, parameterized filters)
- [ ] Authz: inject school/college/org filters based on user context
- [ ] Rate limiting to prevent expensive queries

### T-9.2: Migrate analytics files
- [ ] `src/features/analytics/api/dashboardService.ts` — replace 17 calls
- [ ] `src/features/analytics/api/optimizedQueryService.ts` — replace 1 RPC
- [ ] `src/features/analytics/model/useAnalytics.ts` — replace all calls
- [ ] `src/features/analytics/model/useAnalyticsKPIs.ts` — replace channels
- [ ] `src/features/analytics/model/useRealtimeActivities.ts` — replace channels
- [ ] `src/features/analytics/model/useSpeedAnalytics.ts` — replace channels
- [ ] Remove `supabase` imports
- [ ] Verify build

### T-9.3: Realtime channels evaluation
- [x] Audit 13 channels across 10 files
- [x] Decision: keep `getRealtimeClient()` pattern (authenticated Supabase client via `/api/realtime-token`)
- [x] Migrate 3/13 channels to `getRealtimeClient()`:
  - [x] `college-admin/api/collegeAdminNotificationService.ts:subscribeToNotifications` — `supabase.channel()` → `getRealtimeClient().channel()`
  - [x] `school-admin/api/schoolAdminNotificationService.ts:subscribeToNotifications` — same
  - [x] `college-admin/ui/CollegeCurriculumBuilderUI.tsx` — `supabase.channel()` → `getRealtimeClient().channel()` + fixed cleanup (`removeChannel()` → `unsubscribe()`)
- [ ] Remaining 10 channels across 7 files (deferred — separate batch)

---

## Batch 10 — College Admin Services + Infrastructure (62 refs, ~15 files) ✅ Done

### T-10.1: Migrate college-admin remaining services
- [x] `src/features/college-admin/api/collegeAdminNotificationService.ts` — replaced global `supabase.channel()` with `getRealtimeClient().channel()` (+ import)
- [x] `src/features/college-admin/ui/CollegeCurriculumBuilderUI.tsx` — replaced global `supabase.channel()` with `getRealtimeClient().channel()`; fixed cleanup (`removeChannel()` → `unsubscribe()`)
- `src/features/school-admin/api/schoolAdminNotificationService.ts` — replaced global `supabase.channel()` with `getRealtimeClient().channel()` (+ import)
- [x] `src/features/college-admin/model/useMentorAllocation.ts` — verified: no `supabase.from` refs
- [x] `src/features/college-admin/ui/AssignmentFileUpload.tsx` — verified: clean
- [x] `src/features/college-admin/ui/CollegeLessonPlanUI.tsx` — verified: clean
- [x] `src/features/college-admin/ui/LearnerSelectionModal.tsx` — verified: clean
- [x] `src/features/college-admin/ui/components/FacultyOnboarding.tsx` — verified: clean
- [x] `src/features/college-admin/ui/components/FacultyPerformanceAnalytics.tsx` — verified: clean
- [x] `src/features/college-admin/ui/components/FacultyTimetable.tsx` — verified: clean
- [x] `src/features/college-admin/ui/components/MarkEntryGrid.tsx` — verified: clean
- [x] `src/features/college-admin/ui/components/library/*` (12 files) — verified: all clean
- [x] `src/features/college-admin/ui/events/hooks/*` (5 files) — verified: all clean
- [x] `src/features/college-admin/ui/finance/*` (17 files) — verified: all clean
- [x] `src/features/college-admin/ui/modals/AddLearnerModal.tsx` — verified: clean
- [x] Remove `supabase` imports — verified: none remain
- [x] Verify build

### T-10.2: Migrate admin feature files
- [x] `src/features/admin/api/adminNotificationService.ts` — replaced 7 methods with apiPost
- [x] `src/features/admin/ui/KPIDashboardAdvanced.tsx` — 6 queries consolidated to 1 apiPost call
- [x] `src/features/admin/ui/modals/ClassManagementModals.tsx` — added useAuthStore import, fixed 5 action endpoints
- [x] Remove `supabase` imports
- [x] Verify build — verified clean

### T-10.3: Migrate university-ai + remaining features
- [x] `src/features/university-ai/api/universityCollegeService.ts` — 7 functions migrated; backend handles 15 actions
- [x] `src/features/university-ai/api/universityService.ts` — 8 functions migrated
- [x] `src/features/promotional/model/promotionalStore.ts` — migrated with backend endpoint
- [x] `src/features/onboarding/ui/OrganizationSetup.tsx` — uses apiGet/apiPost (verified clean)
- [x] `src/features/myclass/model/useOptimizedCoCurricularsData.ts` — 4 queries consolidated to 1 apiPost
- [x] `src/features/recruiter/api/filterService.ts` — 4 fetch functions migrated
- [x] `src/features/recruiter/api/requisitionService.ts` — migrated (dead code — no callers)
- [x] `src/features/recruiter/ui/RequisitionImport.tsx` — fixed syntax error, progress bar, field mapping
- [x] `src/features/placement/ui/ApplicationTracking.tsx`, `CompanyRegistration.tsx`, `JobPostings.tsx` — verified: all clean
- [x] Remove `supabase` imports — verified: none remain
- [x] Verify build — 0 errors in modified files

### T-10.4: Infrastructure cleanup
- [x] `src/shared/api/supabase.ts` — deleted (zero consumers)
- [x] `src/shared/api/supabaseClient.ts` — kept as-is (still used by test mocks + legacy pages)
- [x] `src/shared/lib/debug/debugSupabase.js` — replace 1 call
- [x] Remove dead supabase imports from 55 files (128 lines total)
- [x] `src/pages/puter/PuterDemo.tsx` — replace remaining dynamic import (→ apiPost)
- [x] Verify build — 0 errors in modified files (pre-existing test/legacy page errors only)

---

## Summary

| Batch | Domain | Refs | Files | Est. Days | Status |
|-------|--------|-----:|------:|:---------:|:------:|
| 0 | Low-hanging fruit | ~30 | ~15 | 2 | ✅ Done |
| 1 | Assessment (incl. tour components) | 91 | 14 | 4-5 | ⏸️ (largest remaining — 85 feat + 6 app refs) |
| 2 | Educator domain | 165 | 19 | 3-4 | ✅ Done (0 supabase refs verified) |
| 3 | Learner Profile | 142 | 20 | 3-4 | ✅ Done |
| 4 | Opportunities full | 100 | 10 | 2-3 | ✅ Done |
| 5 | Admin Pages | 142 | 23 | 4-5 | ✅ Done (3 admin files deferred to Batch 10) |
| 6 | Courses + AI Tutor | 55 | 13 | 2 | ✅ Done |
| 7 | Entity Learner | 88 | 20 | 3 | ✅ Done (2 comment-only refs, 0 active) |
| 8 | Messaging + Exams + Placement | 51 | 17 | 2 | ✅ Done (5 bugs found & fixed) |
| 9 | Analytics + Realtime | 18 | 10 | 3 | ✅ Done (0 supabase refs; 10 realtime channels remain) |
| 10 | College Admin + Infra + Admin leftovers | 62 | 15 | 3-4 | ✅ Done (12 bugs fixed across 3 deep audits) |
| | **Feature subtotal** | **~894** | **~175** | | **~90% of features done** |
| | Pages (legacy) | 225 | 35 | ~14 | ⏸️ (large effort, not batted) |
| | **Grand total** | **~1,119** | **~210** | | **~72% overall** |

---

## Bugs Fixed (2026-06-01, during Batch 5 review)

| Bug | File | Before | After | Found By |
|-----|------|--------|-------|----------|
| `query-table` action suppressed data rows | `functions/api/college-admin/[[path]].ts:16` | `{ count: 'exact', head: true }` — `head:true` prevents data from being returned alongside the count. Count was also never extracted from result. | Removed `head:true`. Destructure `count: total`. Return `{ data, count }` when count requested. | Deep audit |
| `leanerId` always resolves to wrong value | `CandidateProfileDrawer.tsx:598` | `const learnerId = candidate?.user_id \|\| candidate?.id` — `user_id` is not in `pipeline_candidates_detailed` view; `.id` is pipeline_candidates PK, not learner ID | `const learnerId = candidate?.learner_id` — correctly references `learners.id` int FK | Deep audit |

---

## Audit Checklist (apply to EVERY task)

- [ ] **Build**: `npx tsc -p tsconfig.app.json --noEmit` — 0 errors in modified files
- [ ] **Build**: `npx tsc -p tsconfig.functions.json --noEmit` — 0 NEW errors
- [ ] **Cross-boundary**: grep `from.*functions/` in `src/` — zero hits
- [ ] **Cross-boundary**: grep `from.*src/` in `functions/` — zero hits
- [ ] **Import cleanup**: file still has `supabase` import → check if ALL calls migrated
  - If yes: remove import
  - If no: KEEP import (never remove while refs remain)
- [ ] **Authz**: update/delete scoped to `user.id` or owned resource
- [ ] **Input validation**: all `parseInt` guarded with `isNaN()` + range check
- [ ] **Error format**: uses `apiDbError()` for DB errors (never `error.message`)
- [ ] **No fallback logic** without explicit user approval
- [ ] **No legacy/backward-compat code** without explicit user approval
