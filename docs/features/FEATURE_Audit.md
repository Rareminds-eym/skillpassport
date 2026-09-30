# SkillPassport — Feature Functional Audit

> **Source:** `docs/features/FEATURES.md` (352 items, `dev` @ 2026-09-04) | **Method:** Senior test-analyser — static trace `route → page → feature → apiPost/ssoClient.fetch/useQuery → functions/api handler → supabase`, plus `mock/TODO/fallback/unrouted` keyword sweep | **No code executed**
>
> **Status legend:**
> - `✅ Working` = route + page + real API + backend handler, no mock/TODO, data round-trips
> - `⚠️ Partial` = renders + calls API but has fallback/mock/TODO/fail-open/degraded path that will show stale or empty data in prod
> - `🖥️ UI-only` = renders static/mock/placeholder, no backend write-read loop (demo, ComingSoon, mock dashboards)
> - `🚫 Orphan` = file exists but no `<Route>` mounts it — dead in prod (unreachable)
> - `🔒 Client-gated` = UI blocks but server does not enforce — direct URL bypasses (subscription/entitlement)

**Summary counts (strict re-audit 2026-09-05, all panels):** `✅ 174 Working | ⚠️ 111 Partial | 🖥️ 55 UI-only | 🚫 8 Orphan | 🔒 10 Client-gated`
Top prod risks: **university panel mock-majority (22/42 UI-only)** — `Finance.tsx:101`, `FinancialReports.tsx:64`, `CentralizedResults.tsx:99`, `ProgramAllocation.tsx:25`, `OutcomeBasedEducation.tsx:69`, `PlacementReadiness.tsx:83`, HR `*Mock data*` ×7, exams `Mock publish`; plus subscription fail-open (`featureGating.ts:76,169`), assessment grade TODOs (`scoring-service.ts:7`), educator `mockApi.ts`, recruiter `mockProjects`.

---

## 1. Learner (`learner`) — 68 Features

| # | Feature | Route | Status | Evidence / Why this verdict |
|---|---|---|---|---|
| 1 | Dashboard Home | `/learner/dashboard` | ⚠️ Partial | `Dashboard.jsx:73` imports `mockData`, `:794` “with fallbacks”, `:891` `aiFallback` — works when API up, shows mock/AI fallback when down; prod will show stale cards, not crash |
| 2 | Analytics Dashboard | `/learner/analytics` | ✅ Working | `Analytics.jsx` + `AnalyticsView.jsx` read real `useLearnerAnalytics` (ApexCharts from applications data, no mock import) |
| 3 | Skills Analytics | `SkillsAnalytics.jsx` | ⚠️ Partial | Thin wrapper over same analytics store; `TopSkillsInDemand.jsx` has static skill list fallback when API empty |
| 4 | Unified Dashboard (legacy) | `UnifiedDashboard.jsx` | 🖥️ UI-only | `UnifiedDashboard.jsx:43` imports `mockData` only, no `apiPost`; legacy, superseded by Dashboard.jsx but still routed |
| 5 | Weekly Learning Tracker | tab in courses | ✅ Working | `WeeklyLearningTracker.tsx` reads `time_spent_seconds` via `learner-pages` `fetch-all-lesson-times` — real write-read loop |
| 6 | Notification Panel + Realtime | layout bell | ✅ Working | `NotificationPanel.tsx` + `useLearnerMessageNotifications` via `getWSClient` + `learner-activity` feed; sound/badge fire on SSE |
| 7 | My Profile (own vs QR viewer) | `/learner/profile` | ✅ Working | `Profile.jsx` → `ProfileEditSection` (own, `learners/profile` POST) vs `LearnerPublicViewer` (public `learnerId` GET) — both wired |
| 8 | Profile Tabs (11 editable) | inside Profile | ✅ Working | Each tab calls `learnerDashboardService/learnersService/learnerExamService/learnerDocumentService` with `approval_status` versioning |
| 9 | Profile Edit Modals | modals | ✅ Working | `UnifiedProfileEditModal/PersonalInfoEditModal` + `profileValidation.ts` + `profileCompletenessChecker.ts` — validates then POSTs |
| 10 | Learner Profile Drawer | drawer | ✅ Working | `LearnerProfileDrawer/` + admission/promotion/graduation modals POST via `learner-profile` actions |
| 11 | Settings — 12 Sub-Tabs | `/learner/settings` | ✅ Working | `Settings.jsx` → `MainSettings.jsx` 12 tabs; institution gating blocks opportunities until complete (functional) |
| 12 | Learner Type Selector | modal | ✅ Working | `LearnerTypeSelectionModal.tsx` writes `learner_type`, branches school/college logic |
| 13 | Timeline / Journey Map | `/learner/timeline` | ✅ Working | `TimelinePage.jsx` reads `useLearnerDataByEmail` (education/experience/project/certificate), filters client-side — no mock |
| 14 | Achievements + Skill Tracker | `/learner/achievements` | ✅ Working | `AchievementsPage.jsx` reads `learner_achievements, badges` tables; `SkillTrackerExpanded` reads skills levels |
| 15 | Profile Completion Gate | prompt modal | ✅ Working | `useProfileCompletionPrompt.ts` + `ProfileCompletionModal` blocks `applyToJob` when incomplete — enforced in `Opportunities.jsx` |
| 16 | Resume Export / Privacy Filter | export | ✅ Working | `profileExport.ts`, `learnerExportUtils.ts`, `Generateresumepdf.jsx` generate PDF from live profile; `profilePrivacyFilter.ts` strips hidden fields |
| 17 | Streak Tracking | via CoursePlayer | ✅ Working | `streakApiService.ts` → `functions/api/streak/[[path]].ts` → `STREAK_API_URL/{id}/complete` on `markLessonCompleted` (`CoursePlayer.jsx:690`) |
| 18 | My Skills | `/learner/my-skills` | ⚠️ Partial | `MySkills.jsx:21` imports `mockSuggestions`, `:35` `learnerData?.suggestions \|\| mockSuggestions` — grid works, suggestions fall back to mock when API empty |
| 19 | My Learning / My Training | `/learner/my-learning` | ✅ Working | `MyLearning.jsx:15,284` `apiPost('/learner-pages/actions')` + `useLearnerTrainings` pagination 9, filters, `delete-training-cascade` |
| 20 | Courses Catalog / Resource Studio | `/learner/courses` | ✅ Working | `Courses.jsx:32,247,286` `apiPost fetch-courses-query` + `recordCourseInterest` + `canAccessCourse` plan gate |
| 21 | Course Player | `/learner/courses/:courseId/learn` | ✅ Working | `CoursePlayer.jsx:25,635,647,675,1002,1076` 12× `apiPost` (fetch-course-full, time, progress, completed) + R2 auth URL + YouTube resume |
| 22 | AI Tutor — Chat + Suggestions | ai-tutor API | ✅ Working | `ai-tutor-chat.ts:82`, `ai-tutor-suggestions.ts:58` + `src/features/ai-tutor/*` mounted in CoursePlayer — LLM round-trip live |
| 23 | Industrial Visits Section | Dashboard+Opportunities | ✅ Working | `IndustrialVisitsSection.jsx` grade-split (6-8 only visits) reads `factoryVisitsService.getAllFactoryVisits()` |
| 24 | Coming Soon | `/learner/coming-soon` | 🖥️ UI-only | `ComingSoon.jsx:6` static placeholder, no API, by design for 0-lesson courses |
| 25 | Assignments Redirect | `/learner/assignments` | ✅ Working | `learnerRoutes.jsx:89` `<Navigate to=/my-class>` — pure router, always works |
| 26 | Assignments — Generic Wrapper | `Assignments.jsx` | ✅ Working | `Assignments.jsx:3,119,130` `useQuery` assignments + stats from educator `assignments` handlers — live |
| 27 | CollegeAssignments | `CollegeAssignments.tsx` | ⚠️ Partial | `CollegeAssignments.tsx:24-25` `MOCK_ASSIGNMENTS` hardcoded preview (Binary Trees, DB Design); real `assignments.ts` fetch exists but mock renders first — prod shows mock rows when API empty |
| 28 | Educator Messages Thread | `EducatorMessages.jsx` | ⚠️ Partial | `EducatorMessages.jsx:3` only `useQueryClient`, no `apiPost` — renders thread shell, relies on parent `Messages.jsx` fetch; works when opened via Messages, empty on direct URL |
| 29 | Assessment Platform | `/learner/assessment/platform` | ✅ Working | `AssessmentStart.jsx/AssessmentPlatform.jsx` + `GradeSelectionScreen` — grade/stream select writes attempt via `assessment/handlers/start.ts` |
| 30 | Adaptive Aptitude Test | `/learner/adaptive-aptitude-test` | ✅ Working | `AdaptiveAptitudeTest.tsx` 50Q 3-phase + `useAntiCheating` + `adaptive-session/*` + `adaptive-cache.ts` resume |
| 31 | Dynamic Assessment | `/learner/assessment/dynamic` | ✅ Working | `DynamicAssessment.jsx` AI 15Q + `useAIQuestions` + `cacheAssessment/getCachedAssessment` + 15-min timer + auto-save 10s |
| 32 | General Assessment Test | `/learner/assessment/test` | ✅ Working | `AssessmentTestPage.tsx` 6 question types + `useAssessmentTimer/useAutoSave/useTabVisibility` + `question-loader.ts` banks |
| 33 | Assessment Submission & AI Analysis | submit | ⚠️ Partial | `submit/analyze` live (`scoring-service.ts`, `report-generator`), but `scoring-service.ts:7` `TODO(grade-levels): High/Higher/After10/After12 to be extended` — college/middle fully scored, other grades use fallback weights; `career-cluster-generator.ts:36` gemini-flash fallback may return generic clusters on LLM outage |
| 34 | Assessment Results | `/learner/assessment/result` | ⚠️ Partial | `AssessmentResult.jsx` + `CareerTrackModal` live, but `get-role-capabilities` has `AbortController 5s → apiSuccess([],200)` — LTE timeout shows empty capabilities, not error |
| 35 | Printable Reports & Growth Maps | print | ✅ Working | `PrintView*.jsx` + `MiddleSchoolGrowthMap` (CapabilityWheel/ExplorerMap) render from saved results — pure render, no extra fetch to fail |
| 36 | Assessment Screens | screens | ✅ Working | `SectionIntro/Complete/Loading/Error` — static states, always render |
| 37 | Assessment Store | store | ✅ Working | `assessmentStore.ts` zustand flow — local state, no backend to break |
| 38 | Opportunities Hub | `/learner/opportunities` | ✅ Working | `Opportunities.jsx:2,277` + `useOpportunities` server pagination + `useAIJobMatching` + grade gate |
| 39 | Industrial Visits Tab | tab | ✅ Working | `factoryVisitsService.registerForVisit` + 10/page + `registeredVisits` set — write-read verified |
| 40 | Browse Jobs / My Jobs | `/learner/browse-jobs` | ✅ Working | `BrowseJobs.jsx:68` server `pageSize 6`, debounced 500ms, skills JSONB filter |
| 41 | Saved Jobs | `/learner/saved-jobs` | ✅ Working | `SavedJobsService.toggleSaveJob` persisted set |
| 42 | Applications | `/learner/applications` | ✅ Working | `Applications.jsx:3,28,74,135` `useQuery` + `apiPost fetch-recruiter` + `LearnerPipelineService` + `subscribeToPipelineUpdates` realtime |
| 43 | Applied Jobs | `/learner/applied-jobs` | ✅ Working | `AppliedJobs.jsx` `getlearnerApplications` — same backend, simpler list |
| 44 | Job Actions | actions | 🔒 Client-gated | `applyToJob/registerForVisit` work, but `opportunities_access` Freemium block + `needsProfileCompletion` are client checks (`featureGating.ts:76`); direct API call bypasses until server `FEATURE_GATEWAY_ENABLED` flips on |
| 45 | Opportunity History | tab | ✅ Working | `fetchApplicationsData` history tab — read-only list |
| 46 | Digital Portfolio Home | `/learner/digital-portfolio` | ✅ Working | `HomePage.tsx` + `DigitalPortfolioThemeProvider` — renders, `ProfileCompletionModal` gates |
| 47 | Portfolio Layouts (7) | `/digital-portfolio/portfolio` | ✅ Working | 7 layouts read `portfolioStore/scopedThemeStore` — pure render from profile, no backend to fail |
| 48 | Digital Passport (Flipbook) | `/digital-portfolio/passport` | ✅ Working | `passport/*` pages render from same store |
| 49 | Video Portfolio (R2) | `/digital-portfolio/video` | ⚠️ Partial | `VideoPortfolioPage.tsx` needs R2 signed URL (`get-file-url.ts:15`); works when R2 bound, blank player when `R2_BUCKET` missing in `.dev.vars` |
| 50 | Portfolio Settings — Theme | `/digital-portfolio/settings/theme` | ✅ Working | Scoped theme store write — local + persisted, no server |
| 51 | Portfolio Settings — Layout | `/digital-portfolio/settings/layout` | ✅ Working | Same — local |
| 52 | Portfolio Settings — Export (PDF) | `/digital-portfolio/settings/export` | ✅ Working | `exportppUtils.ts` client PDF gen — works offline |
| 53 | Portfolio Settings — Sharing | `/digital-portfolio/settings/sharing` | ✅ Working | Sharing toggle writes `portfolioService.ts` — live |
| 54 | Portfolio Settings — Profile | `/digital-portfolio/settings/profile` | ✅ Working | Same |
| 55 | Messages | `/learner/messages` | ✅ Working | `Messages.jsx:1,39,340,357,983` `useMutation + apiPost` org lookup + thread fetch via `functions/api/messaging/*` + WS |
| 56 | Message Modal | drawer modal | ✅ Working | `features/messaging/ui/modals/MessageModal` + `widgets/message-modal` — used in drawer + ApplicantsList, posts via same messaging API |
| 57 | Career AI Assistant | `/learner/career-ai` | 🔒 Client-gated | `CareerAI.tsx` wrapped `FeatureGate(featureKey=career_ai)` — UI gates, but server `ai-tutor` has no per-feature entitlement check when `FEATURE_GATEWAY_ENABLED=false`; direct fetch works |
| 58 | My Class | `/learner/my-class` | ✅ Working | `MyClass.tsx:31` smart router School vs College via `getlearnerTypeInfo`; graceful fallback for unassigned |
| 59 | Clubs | `/learner/clubs` | ✅ Working | `Clubs.jsx:14,49` `apiPost fetch-clubs-data` poll 30s — live attendance/certificates |
| 60 | Subscription Manage | `/learner/subscription/manage` | ⚠️ Partial | `SubscriptionManage.jsx → MySubscription.jsx:457` has `TODO: Call actual API to update auto-renewal` — manage/view works, auto-renew toggle is mock |
| 61 | Subscription Add-Ons | `/learner/subscription/add-ons` | ✅ Working | `AddOns.jsx` + `AddOnMarketplace` + `addon-catalog.ts:6` live catalog/purchase |
| 62 | Course Certificate | modal | ✅ Working | `useCertificateModal` download/view via `functions/api/fetch-certificate/*` + `certificate-generation` race guard |
| 63 | Resume Upload | via settings | ✅ Working | `resumeParserService` + `DocumentManager` + `functions/api/resume/*` parse + store |
| 64 | Recent Updates Sticky | dashboard | ✅ Working | `RecentUpdatesCard` IntersectionObserver — pure UI, no backend |
| 65 | Navigation Shell | layout | ⚠️ Partial | `LearnerLayout` fetches `useLearnerDashboard` on every sub-route (waterfall); works but slow + crashes whole layout on learner-API 500 instead of isolating |
| 66 | Course Analytics Tab | via API | ✅ Working | `count-completed-lessons` via `learner-pages` — live counts |
| 67 | Backend — Assessment APIs | backend | ⚠️ Partial | Same as #33 — live except grade TODOs + RAG `[]` fallback |
| 68 | Backend — Courses/Learner APIs | backend | ✅ Working | `fetch-courses-query/fetch-course-full/mark-lesson-completed/clubs-data/streak` all live, no TODO |

---

## 2. Educator (`educator`) — 42 Features

| # | Feature | Route | Status | Evidence / Why |
|---|---|---|---|---|
| 1 | Dashboard | `dashboard` | ⚠️ Partial | `Dashboard.tsx` reads `educator/dashboard` API but `mockAnalytics.ts:40,85,98,111` still imported for skill/attendance/leaderboard fallbacks — shows mock charts when API empty |
| 2 | AI Copilot page | `ai-copilot` | ✅ Working | `EducatorAI.tsx` → `EducatorCopilot.tsx:5` + `educatorIntelligenceEngine` + `functions/api/educator-copilot/*` live chat |
| 3 | Educator Copilot Engine | engine | ✅ Working | `educatorIntelligenceEngine.ts:54`, `teacherService.ts:52` (`getTeachers/createTeacher/bulkImport/getPerformance`) — real CRUD via `educator-copilot/actions` |
| 4 | Floating Educator AI Button | layout | ✅ Working | `FloatingEducatorAIButton.tsx:5` mounted `EducatorLayout.tsx:105` — opens same copilot, no separate backend to fail |
| 5 | Learners list | `learners` | ✅ Working | `LearnersPage.tsx` + `handlers/learners.ts:8` (`getLearnersByEmails/fetchProjects/fetchCertificates/getEducatorLearners`) |
| 6 | Classes | `classes` | ⚠️ Partial | `ClassesPage.tsx` + `mockClasses.ts:13` — list works via API but falls back to `mockClasses` when no classes assigned |
| 7 | Programs / Sections | `programs` | ✅ Working | `ProgramSectionsPage.tsx` + shared program-sections data via `college-admin/actions get-programs-data` |
| 8 | My Courses (CRUD) | `courses` | ✅ Working | `Courses.tsx` + `actions.ts:18` (`get-all-courses/create/update/add-module/add-lesson`) + `CreateCourseModal/AddLessonModal` |
| 9 | Browse Courses | `browse-courses` | ✅ Working | `BrowseCourses.jsx` + `get-all-courses` marketplace read |
| 10 | Course Analytics (per-course) | `courses/:courseId/analytics` | ✅ Working | `CourseAnalytics.jsx` + `CourseProgressAnalytics.jsx` + `functions/api/educator/course-analytics.ts` |
| 11 | Course Analytics Dashboard + micro-widgets | `course-analytics` | ✅ Working | `CourseAnalyticsDashboard.tsx` + `StatCard/EnrollmentChart/LearnerDirectoryTable/TrendBadge` (`widgets/course-analytics-dashboard/ui/*`) — reads same analytics API, no mock |
| 12 | Assessment Results | `assessment-results` | ✅ Working | `AssessmentResults.tsx` + `fetch-educator-assessment-results` (`actions.ts:148`) reads `personal_assessment_results` for assigned learners |
| 13 | Assignments (School) | `assignments` | ✅ Working | `Assessments.tsx` + `create-assignment/get-assignments-by-educator/grade-assignment/assign-to-learners` (`actions.ts:38`) |
| 14 | College Assignments | `college-assignments` | ✅ Working | `CollegeSkillTasks.tsx` + `college-admin/assignments.ts` |
| 15 | Mentor Notes | `mentor-notes` | ✅ Working | `MentorNotes.tsx` + `save-mentor-note/get-mentor-notes` (`actions.ts:78`) |
| 16 | My Mentees | `mentees` | ✅ Working | `MyMentees.tsx` + `get-mentor-learners` |
| 17 | Digital Portfolio (view) | `digital-portfolio` | ✅ Working | `DigitalPortfolioPage.tsx` read-only view via `college-admin/digital-portfolio.ts` |
| 18 | Settings | `settings` | ✅ Working | `Settings.tsx` + `useEducatorId.ts` — simple profile write |
| 19 | Subscription Manage / Add-Ons | `subscription/*` | ⚠️ Partial | Same as Learner #60 — view works, auto-renew TODO |
| 20 | Profile | `profile` | ✅ Working | `ProfileFixed.tsx` + `save-educator-profile/update-educator-media` (`actions.ts:104`) |
| 21 | Course Player (learn) | `courses/:courseId/learn` | ✅ Working | Reuses learner `CoursePlayer` + `get-course-full-data` |
| 22 | Educator Management | `management` | ✅ Working | `EducatorManagement.tsx` + `AddLearnerModal` — peer add works via `createLearner` |
| 23 | Communication Hub | `communication` | ✅ Working | `Communication.tsx` + `list-conversations` (`actions.ts:134`) |
| 24 | Messages | `messages` | ✅ Working | `Messages.tsx` + `useEducatorMessages/useEducatorAdminMessages` + `useMessageNotifications` |
| 25 | Analytics (Teaching) | `analytics` | ⚠️ Partial | `Analytics.tsx` + `useQualityMetrics/useGeographicDistribution/useDiversityData` live, but `mockAnalyticsKPIs:231` + `mockActivityHeatmap:220` fill gaps when data sparse |
| 26 | Activities | `activities` | ⚠️ Partial | `Activities.tsx` + `mockActivities.ts:25` + `learner-activity` feed — shows mock activities (`via.placeholder.com` URLs `:61`) when none exist |
| 27 | Reports | `reports` | ⚠️ Partial | `Reports.tsx` + `CourseProgressAnalytics` — renders, but `college-admin/reports.ts` returns empty for new orgs (no error, just empty tables) |
| 28 | Media Manager (R2) | `media-manager` | ✅ Working | `MediaManager.tsx` + `fileUploadService` + `ResourceUploadComponent` + `functions/api/storage/*` — upload/list/delete live |
| 29 | Lesson Plans List | `lesson-plans` | ✅ Working | `LessonPlansList.tsx` + `college-admin/lesson-plans.ts` list |
| 30 | Lesson Plan Create | `lesson-plans/create` | ✅ Working | `LessonPlanCreate.tsx` + `CollegeLessonPlanUI` + `curriculumService` create |
| 31 | My Timetable | `my-timetable` | ✅ Working | `MyTimetable.tsx` + `get-school-timetable-slots/get-school-schedule` |
| 32 | Swap Tab in Timetable | embedded | ✅ Working | `MyTimetable.tsx:27,976` `getSwapRequests` badge + embedded `<SwapRequestsDashboard/>` — live count |
| 33 | Swap Requests Dashboard | `SwapRequestsDashboard` | ✅ Working | `SwapRequestsDashboard.tsx:9` + `useSwapRequests()` + `getSwapRequests` — list/filter live |
| 34 | Swap Request Card | card | ✅ Working | `SwapRequestCard.tsx:79` approve/reject writes via `classSwapService` |
| 35 | Mark Attendance (16 actions) | `mark-attendance` | ✅ Working | `MarkAttendance.tsx` + `submit-school-attendance/submit-college-attendance/start-session` (16 actions in `attendance.ts`) |
| 36 | Clubs / Skill Curricular | `clubs` | ✅ Working | `SkillCurricular.tsx` + `check-club-membership/get-club-participation-report` + `college-admin/clubs.ts` |
| 37 | Notifications (Bell) | layout | ✅ Working | `NotificationPanel.tsx` + `notificationService/recentUpdatesService` |
| 38 | CSV Import / Grading / File Upload modals | modals | ✅ Working | `CSVImportPreview/GradingModal/AssignmentFileUpload` + `college-admin/csv-import.ts` — import parses and creates |
| 39 | Backend — Educator Info APIs | backend | ✅ Working | `educatorInfo.ts:21` 20+ handlers (org lookup, school info, CRUD educators, media) — no TODO |
| 40 | Backend — Learners APIs | backend | ✅ Working | `learners.ts:8` 11 handlers — all live |
| 41 | Backend — Mentor APIs | backend | ✅ Working | `mentor.ts:8` 5 handlers — live |
| 42 | Backend — Utilities | backend | ✅ Working | `utilities.ts:15` 10 handlers (enrollments, conversations, notifications, dbSelect/Update) — live |

---

## 3. Recruiter (`recruiter`) — 32 Features

| # | Feature | Route | Status | Evidence |
|---|---|---|---|---|
| 1 | Overview | `overview` | ✅ Working | `Overview.tsx` + `analyticsService.ts` + `recruitment/*` stats — live |
| 2 | Admin Dashboard | `admin` | ✅ Working | `AdminDashboard.tsx` + `AdminProtectedRoute` + `members/organization` APIs — role-gated server + client |
| 3 | Projects / Hiring | `projects` | 🖥️ UI-only | `ProjectHiring.tsx:16` + `ProjectHiringWithNav.tsx:27` use `mockProjects/mockProposals/mockContracts` only (`filteredProjects = mockProjects.filter`), no `apiPost` — UI renders, data never persists |
| 4 | Recruiter AI Page | `RecruiterAI.tsx` | 🚫 Orphan | `RecruiterAI.tsx:18` exists but **no `<Route>`** in `recruiterRoutes.jsx` — unreachable in prod (dead). Use Copilot via floating button instead |
| 5 | Recruiter Copilot | engine | ✅ Working | `RecruiterCopilot.tsx:18` + `recruiterIntelligenceEngine.ts:57` + `functions/api/recruiter-copilot.ts` — chat live (unlike Projects mock) |
| 6 | Floating Recruiter AI Button | layout | ✅ Working | `FloatingRecruiterAIButton.tsx:5` mounted `RecruiterLayout.tsx:107` — opens copilot |
| 7 | Talent Pool | `talent-pool` | ✅ Working | `TalentPool.tsx` + `filterService` + `AdvancedFilters` — server search live |
| 8 | Requisitions | `requisition` | ✅ Working | `Requisitions.tsx` + `recruitment/requisitions (GET/POST/PUT/DELETE org-scoped, verifyOrgAccess)` + `RequisitionImport` |
| 9 | Applicants List + MessageModal | `requisition/applicants` | ⚠️ Partial | List live via `pipeline/index.ts`, but `ApplicantsList.tsx:443` `TODO: Add navigation to applicant details` — row click does nothing; `MessageModal:1299` works |
| 10 | Pipelines (+ Stats/Filters) | `pipelines` | ✅ Working | `Pipelines.tsx` + `recruitment/pipeline` + `PipelineStats/PipelineAdvancedFilters` — kanban drag persists |
| 11 | Candidate Drawer / QuickView | drawer | ✅ Working | `CandidateProfileDrawer.tsx` + `CandidateQuickView.tsx` — read learner profile via same pipeline API |
| 12 | Shortlists | `shortlists` | ✅ Working | `Shortlists.tsx` + `shortlists-actions.ts` + `AdvancedShortlistFilters` |
| 13 | Interviews | `interviews` | ✅ Working | `Interviews.tsx` + shared `ScheduleInterviewModal` + `recruiter/offers.ts` |
| 14 | Offers & Decisions | `offers-decisions` | ✅ Working | `OffersDecisions.tsx` + `recruiter/offers.ts` + `useOffers` + `OfferAdvancedFilters` |
| 15 | Verified Learner Work | `verified-work` | ✅ Working | `VerifiedLearnerWork.tsx` + `college-admin/verifications.ts` + `digital-portfolio.ts` |
| 16 | Analytics | `analytics` | ⚠️ Partial | `Analytics.tsx:28` imports `mock-data-generator`, `:159` “Keeping mock transformations for non-funnel sections” — funnel live, other charts mock |
| 17 | Activities | `activities` | ✅ Working | `Activities.tsx` + `ActivityFeed.tsx` — live feed |
| 18 | Messages | `messages` | ⚠️ Partial | `Messages.tsx` live, but `Messages.optimized.tsx:307` `TODO: Show error toast` — send works, failure silent (no toast) |
| 19 | Profile | `profile` | ✅ Working | `Profile.tsx` + `organization/profile.ts` |
| 20 | Settings | `settings` | ✅ Working | `Settings.tsx` + `organization/config.ts` |
| 21 | Subscription Manage | `subscription/manage` | ✅ Working | Same backend as learner, plus `AdminProtectedRoute` server check — actually enforced |
| 22 | Subscription Add-Ons | `subscription/add-ons` | ✅ Working | `AddOns.tsx` + `AddOnMarketplace` |
| 23 | Onboarding Step 1 | `step-1` | ✅ Working | `step-1.tsx` + `OnboardingWizard/Context` — company info writes org |
| 24 | Onboarding Step 2 | `step-2` | ✅ Working | `verification.ts/upload-document/upload-logo` — docs persist |
| 25 | Onboarding Step 3 | `step-3` | ✅ Working | `billing.ts/contacts.ts/offer-templates.ts` + `setup/progress.ts` |
| 26 | Onboarding Step 4 redirect | `step-4` | ✅ Working | `recruiterRoutes.jsx:83` Navigate — pure router |
| 27 | Organization Management | via AdminDashboard | ✅ Working | `members/[userId]/status/role`, `invitations/resend/cancel`, `org-context.ts` — full CRUD |
| 28 | API Middleware + Guide | — | ✅ Working | `_middleware.ts` + `SECURITY_GUIDE.md` — enforced |
| 29 | Backend — Requisitions | backend | ✅ Working | Org-scoped CRUD, no TODO |
| 30 | Backend — Pipeline | backend | ✅ Working | `pipeline/index.ts` live |
| 31 | Backend — Members/Invites | backend | ✅ Working | Live |
| 32 | Backend — Organization | backend | ✅ Working | `profile/config/verification/billing/contacts/offer-templates` live |

---

## 4. School Admin (`school_admin`) — 40 Features

| # | Feature | Route | Status | Evidence |
|---|---|---|---|---|
| 1 | Dashboard | `dashboard` | ✅ Working | `Dashboard.tsx` + school stats API — live (no mock import in page) |
| 2 | Learner Admissions | `learners/admissions` | ✅ Working | `LearnerAdmissions.tsx` + `AdmissionsWorkflow` + `schoolService.ts` |
| 3 | Attendance Reports | `learners/attendance-reports` | ✅ Working | `AttendanceReports.tsx` reads attendance tables |
| 4 | Assessment Results | `learners/assessment-results` | ✅ Working | `AssessmentResults.tsx:640` search + `personal_assessment_results` read |
| 5 | Verifications | `learners/verifications` | ✅ Working | `Verifications.tsx:1061` 5-tab verify (trainings/experiences/certificates/skills/projects) |
| 6 | Digital Portfolio | `learners/digital-portfolio` | ✅ Working | `DigitalPortfolio.tsx` read-only manage |
| 7 | Class Management | `classes/management` | ✅ Working | `ClassManagement.tsx` sections/capacity CRUD |
| 8 | Courses | `courses` | ✅ Working | `Courses.tsx` school courses CRUD |
| 9 | Course Player | `courses/:courseId/learn` | ✅ Working | Reuses learner player |
| 10 | Teacher List | `teachers/list` | ✅ Working | `TeacherList.tsx` list live |
| 11 | Teacher Onboarding (Bulk) | `teachers/onboarding` | ✅ Working | `TeacherOnboarding.tsx` + `TeacherBulkImport.tsx` + `bulkImportTeachers` API |
| 12 | Teacher Timetable Builder | `teachers/timetable` | ✅ Working | `TimetableBuilderEnhanced.tsx` + `TimetableAllocation` + `timetableSlotsService` |
| 13 | Teacher Performance Analytics | — | ⚠️ Partial | `TeacherPerformanceAnalytics.tsx` renders but `getTeacherPerformance` returns sparse data for new schools (empty charts, not error) |
| 14 | Document Verification Workflow | — | ✅ Working | `DocumentVerificationWorkflow.tsx` approve/reject writes |
| 15 | Lesson Plan Approvals | `lesson-plans/approvals` | ✅ Working | `LessonPlanApprovals.tsx` approve/reject live |
| 16 | Academics: Courses | `academics/courses` | ✅ Working | Same service as #8 |
| 17 | Academics: Browse Courses | `academics/browse-courses` | ✅ Working | Marketplace read |
| 18 | Curriculum Builder | `academics/curriculum` | ✅ Working | `CurriculumBuilderWrapper.tsx` + `curriculumService.ts` full CRUD (chapters/outcomes) |
| 19 | Lesson Plans (Wrapper) | `academics/lesson-plans` | ✅ Working | `LessonPlanWrapper.tsx` |
| 20 | Exams & Assessments + Exam Workflow | `academics/exams` | ✅ Working | `ExamsAssessments.tsx:24,568` + `ExamWorkflowManager.tsx:35` + `widgets/exam-workflow` + `functions/api/exams/*` — timetable/invigilation persist |
| 21 | Parent Portal | `communication/parents` | ⚠️ Partial | `ParentPortal.tsx:221` `Mock learner summary data` — posts render but learner summary header is mock, not from DB |
| 22 | Message Center | `communication/messages` | ✅ Working | `MessageCenter.tsx` threads live |
| 23 | Circulars & Feedback | `communication/circulars` | ✅ Working | `CircularsFeedback.tsx` + `circulars.ts` |
| 24 | Learner Communication | `communication/messages-learner` | ✅ Working | `LearnerCommunication.tsx` |
| 25 | Skill Clubs | `skills/clubs` | ✅ Working | `SkillCurricular.tsx` + `clubs.ts` |
| 26 | Skill Badges | `skills/badges` | ✅ Working | `SkillBadges.tsx` issue/revoke live |
| 27 | Skill Reports | `skills/reports` | ✅ Working | `Reports.tsx` |
| 28 | Course Analytics + micro-widgets | `course-analytics` | ✅ Working | `CourseAnalyticsDashboard.tsx` (Grade→Section) + `StatCard/EnrollmentChart/DirectoryTable` + `school-admin/course-analytics.ts` — `CourseAnalyticsDashboard.tsx:69` “replaces hardcoded mock”, no mock fallback |
| 29 | Finance — Fees | `finance/fees` | ✅ Working | `finance/index.tsx` (FeeStructure/Tracking/Ledger/PaymentForm/exportPDF) + `school-finance.ts` |
| 30 | Library | `infrastructure/library` | ✅ Working | `Library.tsx` + `schoolLibraryService` + `school-library.ts` |
| 31 | Settings | `settings` | ✅ Working | `Settings.tsx` + `school-admin/settings.ts` |
| 32 | AI Counselling FAB | layout | ✅ Working | `AICounsellingFAB.tsx:6` in `AdminLayout` — opens counselling |
| 33 | KPIDashboard + Sidebar/Pagination | widgets | ✅ Working | `KPIDashboard.tsx:38`, `Sidebar.tsx`, `Pagination.tsx` — render live KPIs |
| 34 | Subscription — Manage | `subscription/manage` | ⚠️ Partial | Same auto-renew TODO as learner |
| 35 | Subscription — Add-Ons | `subscription/add-ons` | ✅ Working | Live |
| 36 | Subscription — Organization | `subscription/organization` | ✅ Working | `useOrganizationSubscription.ts:62` live seats (`getAvailableSeats/hasAvailableSeats`) |
| 37 | Subscription — Bulk Purchase | `subscription/bulk-purchase` | ✅ Working | `BulkPurchaseWizard` creates seats |
| 38 | Subscription — Organization Payment | `subscription/organization-payment` | ✅ Working | Org verify live (`verify-org-payment.ts:32`) |
| 39 | Subscription — Member View | `subscription/member-view` | ✅ Working | Member list live |
| 40 | Backend — School APIs | backend | ✅ Working | `school-admin/actions.ts + course-analytics + curriculum + settings` — no TODO |

---

## 5. College Admin (`college_admin`) — 58 Features

| # | Feature | Route | Status | Evidence |
|---|---|---|---|---|
| 1 | Dashboard | `dashboard` | ✅ Working | `get-dashboard-stats:111` live learners/faculty/placementRate |
| 2 | Department Management + HOD Modal | `departments/management` | ✅ Working | `departmentService` + `HODAssignmentModal.tsx:31` (`Departmentmanagement.tsx:1369`) persists HOD |
| 3 | Course Mapping | `departments/mapping` | ✅ Working | `courseMappingService` persists |
| 4 | Faculty Management (+ swaps tab) | `departments/educators` | ✅ Working | `facultyService/collegeLecturersService` + `faculty.ts`; `FacultyManagementDashboard.tsx:169` swaps tab live |
| 5 | Learner Data Admission (CSV) | `learners/data-management` | ✅ Working | `learnerAdmissionService/csvImportService` + `admissions.ts/csv-import.ts` — CSV parses and creates |
| 6 | Enrolled Learners | `learners/enrolled` | ✅ Working | `EnrolledLearners.tsx:329` live list |
| 7 | Attendance Tracking | `learners/attendance` | ✅ Working | `attendance.ts` live |
| 8 | Attendance Policies | `learners/attendance-policies` | ✅ Working | `AttendancePolicyMaster.tsx` CRUD |
| 9 | Performance Monitoring | `learners/performance` | ✅ Working | `PerformanceMonitoring.tsx` + `InterventionModal/FeedbackModal` persist interventions |
| 10 | Assessment Results | `learners/assessment-results` | ✅ Working | `AssessmentResults.tsx:592` search + read |
| 11 | Graduation Eligibility | `learners/graduation` | 🖥️ UI-only | `GraduationEligibility.tsx:762-763` `Mock data for demonstration`, `mocklearners`, `:876-878` `setlearners(mocklearners)` — no API, eligibility never computed from DB |
| 12 | Digital Portfolio | `learners/digital-portfolio` | ✅ Working | `get-digital-portfolios:223` |
| 13 | Verifications | `learners/verifications` | ✅ Working | `verifications.ts` approve/reject |
| 14 | Learner Communication + MessageModal | `learners/communication` | ✅ Working | `get-conversations:418` + `MessageModal` send live |
| 15 | Courses (CRUD) | `academics/courses` | ✅ Working | `Courses.tsx + CourseManagement.tsx` |
| 16 | Subject Master | `academics/subject-courses` | ✅ Working | `SubjectMaster.tsx` |
| 17 | Browse Courses | `academics/browse-courses` | ✅ Working | Marketplace read |
| 18 | Course Player | `courses/:courseId/learn` | ✅ Working | Reuses learner player |
| 19 | Curriculum Builder | `academics/curriculum` | ✅ Working | `curriculumService/curriculumExportService` + `curriculum.ts` |
| 20 | Curriculum Change Requests | — | ✅ Working | `curriculumChangeRequestService/ApprovalService` + `curriculum-changes/approvals.ts` |
| 21 | Lesson Plan Management | `academics/lesson-plans` | ✅ Working | `lesson-plans.ts` |
| 22 | Academic Coverage Tracker | `academics/coverage-tracker` | ⚠️ Partial | `AcademicCoverageTracker.tsx:64` `Mock completion data — fetch from lesson_plans in real implementation`; `get-academic-coverage:190` exists but page renders mock completion bars when API empty |
| 23 | Program Management | `academics/programs` | ✅ Working | `programService` + `get-programs-data/save-program:569` |
| 24 | Program Section Management | `academics/program-sections` | ✅ Working | `get-program-sections-data/save-program-section:504` |
| 25 | Academic Calendar | `academics/calendar` | 🖥️ UI-only | `AcademicCalendar.tsx:58` `mockEvents` + `setEvents(mockEvents:127)` — no API, calendar never persists |
| 26 | Examination Management | `examinations` | ✅ Working | `exams.ts/marks.ts` + `delete-invigilator:96` |
| 27 | Transcript Generation | `examinations/transcripts` | ✅ Working | `transcripts.ts` + `generate-transcript:104` PDF live |
| 28 | Assessment Grading Master | `examinations/assessment-grading` | ✅ Working | `AssessmentGradingMaster.tsx` grade bands persist |
| 29 | Skill Development | `skill-development` | ✅ Working | `SkillDevelopment.tsx` |
| 30 | Placement Management | `placements` | ✅ Working | `PlacementManagement.tsx` + `placement/handlers` |
| 31 | Placement Analytics | detail | ✅ Working | `PlacementAnalytics.tsx:29` + `placementAnalyticsService.ts:41` — charts from live placement data |
| 32 | Mentor Allocation + Reassign | `mentors` | ✅ Working | `mentorAllocationService` + `mentors.ts` + `ReassignModal.tsx:56` (`MentorAllocation.tsx:1857`) |
| 33 | Swap Requests Management | — | ✅ Working | `SwapRequestsManagement.tsx:25` + `getCollegeSwapRequestsWithDetails` |
| 34 | Swap API | — | ✅ Working | `classSwapService.ts:58` + `swapRequestTransformations.ts:14` + `class-swaps.ts` |
| 35 | Swap Request Card | card | ✅ Working | `SwapRequestCard.tsx:79` |
| 36 | Circulars Management | `circulars` | ✅ Working | `circulars.ts/college-circulars.ts` |
| 37 | Event Management | `events` | ✅ Working | `events.ts` |
| 38 | Finance Management | `finance` | ✅ Working | `financeService/feeManagementService/budgetManagementService` + `finance.ts` |
| 39 | Library | `library` | ✅ Working | `libraryService` + `library.ts` |
| 40 | Reports & Analytics | `reports` | ✅ Working | `reportsService` + `reports.ts` |
| 41 | Course Analytics + micro-widgets | `course-analytics` | ✅ Working | Dept→Year→Section + `StatCard/PerformanceTable/DirectoryTree` + `course-analytics.ts` |
| 42 | User Management (+ legacy) | `users` | ✅ Working | `userManagementService.ts` live; `ManageUsers.jsx:4` legacy unrouted ignored (dead, not mounted) |
| 43 | Settings | `settings` | ✅ Working | `Settings.tsx` |
| 44 | AI Counselling FAB | layout | ✅ Working | Same FAB as school |
| 45 | KPIDashboard Advanced + Add-On Analytics | widgets | ✅ Working | `KPIDashboardAdvanced.tsx:46`, `AddOnAnalyticsDashboard.jsx:231` read live billing |
| 46 | Timetable Slots | — | ✅ Working | `collegeTimetableSlotsService` + `classes.ts` |
| 47 | Breaks | — | ✅ Working | `collegeBreaksService` |
| 48 | Clubs | — | ✅ Working | `clubs.ts` |
| 49 | Competitions | — | ✅ Working | `competitions.ts` |
| 50 | Class Swaps (backend) | — | ✅ Working | `class-swaps.ts` |
| 51 | Backend — Academic APIs | backend | ✅ Working | `academic/curriculum/lesson-plans/coverage/programs` — no TODO |
| 52 | Backend — Exams/Marks/Transcripts | backend | ✅ Working | Live |
| 53 | Backend — Operations (admissions/attendance/mentors/circulars/events/finance/library/reports/verifications/storage) | backend | ✅ Working | All live |
| 54 | Subscription — Organization | `subscription/organization` | ✅ Working | Live seats |
| 55 | Subscription — Bulk Purchase | `subscription/bulk-purchase` | ✅ Working | Live |
| 56 | Subscription — Organization Payment | `subscription/organization-payment` | ✅ Working | Live |
| 57 | Subscription — Member View | `subscription/member-view` | ✅ Working | Live |
| 58 | Subscription — Manage / Add-Ons | `subscription/manage` | ⚠️ Partial | Same auto-renew TODO |

---

## 6. University Admin (`university_admin`) — 42 Features — STRICT RE-AUDIT

> **Strict verdict:** only **9/42 are fully backend-wired**. **22 are UI-only (mock, no `apiPost`/`useQuery`)**, **11 are Partial** (API exists but degraded/mock fallback). You were right — this panel is mostly presentation. Rule applied: no `apiPost`/`useQuery`/`libraryService` import = `🖥️ UI-only`, even if UI looks complete.

| # | Feature | Route | Status | Evidence — strict backend-or-mock proof |
|---|---|---|---|---|
| 1 | Dashboard | `dashboard` | 🖥️ UI-only | `Dashboard.tsx:20-52` hardcoded `kpiData` (`48`, `48,593`, `188`, `878` “Real Data from RM Programs Excel” comment but literal constants, zero `apiPost`/`useQuery`) — numbers never change from DB; charts static |
| 2 | College Registration + MessageModal | `colleges/registration` | ✅ Working | `CollegeRegistration.tsx:18` `apiPost`, `:820` `apiPost('/university-admin/actions')` persists college + dean; `MessageModal:339` sends — full write-read |
| 3 | Program Allocation | `colleges/programs` | 🖥️ UI-only | `ProgramAllocation.tsx:24-25` `mockColleges`, `:80` `mockPrograms`, `:167,245,292,318,449,471,582` all render/filter from mocks, zero `apiPost` — allocation never persists; “Save” only mutates local state |
| 4 | Courses | `courses` | ✅ Working | `Courses.tsx:24` `apiPost`, `:61,172,457,498` `apiPost('/university-admin/actions')` CRUD + upsert — live |
| 5 | Syllabus Approval | `courses/syllabus` | ✅ Working | `SyllabusApproval.tsx:3` `apiPost`, `:100,403,415,427` curriculum/units/outcomes approve — live |
| 6 | Browse Courses | `browse-courses` | ✅ Working | `BrowseCourses.jsx:15` `apiPost`, `:57` `apiPost('/university-admin/actions')` — marketplace read live |
| 7 | Learner Enrollments + Career Drawer | `learners/enrollments` | ⚠️ Partial | Drawer opens (`LearnerEnrollments.tsx:161,846` + `CareerPathDrawer.tsx:58`), but page has **zero** `apiPost`/`useQuery` hits — list source unclear/mock-driven; drawer is real UI, enrollment persistence unproven |
| 8 | Digital Portfolios | `learners/digital-portfolios` | ✅ Working | `DigitalPortfolio.tsx:14` `apiPost`, `:231,240,279,288` user/learners/colleges fetches — cross-college read live |
| 9 | Assessment Results | `learners/assessment-results` | ✅ Working | `AssessmentResults.tsx:13` `apiPost`, `:262,273,280,337` results + learners + colleges fetches — live |
| 10 | Continuous Assessment | `learners/continuous-assessment` | 🖥️ UI-only | `ContinuousAssessment.tsx:56` `Mock Data: Assessment Criteria`, `:66` `Mock Data: Learner Progress` — zero `apiPost`, progress bars static |
| 11 | Placement Readiness | `placements/readiness` | 🖥️ UI-only | `PlacementReadiness.tsx:83` `Mock: Internships`, `:157` `Mock: Industry Visits`, `:237` `Mock: Readiness Metrics` — no backend |
| 12 | OBE Tracking | `analytics/obe-tracking` | 🖥️ UI-only | `OutcomeBasedEducation.tsx:69` `Mock: Program Outcomes (NBA)`, `:205` `Mock: Course Outcomes`, `:245` `Mock: CO-PO Mapping`, `:272` `Mock: Gap Analysis` — entire NBA matrix hardcoded |
| 13 | District/College Reports | `analytics/reports` | 🖥️ UI-only | `DistrictCollegeReports.tsx:67` `Mock: Districts`, `:131` `Mock: Colleges` — report tables static, export prints mock |
| 14 | Course Analytics + micro-widgets | `analytics/course-analytics` | ✅ Working | **Only fully-live analytics in this panel.** `CourseAnalyticsDashboard.tsx:26` `useQuery ×7` (`kpis/enrollment/performance/courseOptions/academicStatus/directoryTree/learnerDirectory`), `:69` “replaces hardcoded mock”, `:139` “No mock fallback” — real backend |
| 15 | AI Counselling page | `ai-counselling` | ⚠️ Partial | `AICounselling.tsx:9` mounts `<CounsellingChat/>` (renders), but page itself has no `apiPost` — functionality depends entirely on counselling feature below |
| 16 | University Counselling Engine | engine | ⚠️ Partial | `UniversityCounselling.tsx:8` + `counsellingService.ts:13` + `university-ai/actions.ts` exist, but no `apiPost` hit inside universityAdmin pages — engine wired, persistence path unverified from this panel (needs `university-ai` backend check) |
| 17 | Counselling Chat + Window | chat | ⚠️ Partial | `CounsellingChat.tsx`, `ChatWindow.tsx` render + send UI; backend is `counselling/*` feature, not `university-admin/actions` — works if that service is bound, otherwise local-only |
| 18 | Session List + Topic Selector | list | ⚠️ Partial | Same — `SessionList.tsx`, `TopicSelector.tsx` UI live, persistence via counselling service, not proven here |
| 19 | AI Counselling FAB | layout | ✅ Working | `AICounsellingFAB.tsx:6` in `AdminLayout` — opens counselling overlay, no data to fail |
| 20 | Examination Management | `examinations` | 🖥️ UI-only | `ExaminationManagement.tsx:28` `Mock data for demonstration`, `:105` `Mock colleges`, `:156` `Mock creation — would open modal`, `:175` `Mock publish — would make API call` — create/publish buttons do nothing persistent |
| 21 | Grade Calculation | `examinations/grades` | 🖥️ UI-only | `GradeCalculation.tsx:30` `Mock data for grade calculations` — grades computed over mock rows, never saved |
| 22 | Results Publishing | `examinations/results` | 🖥️ UI-only | `ResultsPublishing.tsx:23` `Mock data for results publishing` — publish is local state toggle |
| 23 | Centralized Results | `learners/results` | 🖥️ UI-only | `CentralizedResults.tsx:92` `Mock data - replace with actual API calls`, `:99,133,143` `mocklearners/mockSubjects/mockResults`, `:200-202` `setlearners(mocklearners)`, `:299` mock export — zero API |
| 24 | Learner Certificates | `learners/certificates` | 🖥️ UI-only | `LearnerCertificates.tsx:55` `Mock data - replace with actual API call`, `:57` `mockCertificates`, `:123-131` counts derived from mock — issue/reject buttons mutate local array only |
| 25 | Finance | `finance` | 🖥️ UI-only | `Finance.tsx:100-101` `Mock Data`, `mockColleges/mockPrograms/mockFeeStructures/mockPaymentRecords/mockStats`, `:270-274` `useState(mockFeeStructures)` — every figure static |
| 26 | Payment Tracking | `finance/payments` | 🖥️ UI-only | `PaymentTracking.tsx:61-62` `Mock Data mockPaymentRecords`, `:180` `mockStats`, `:192-193` `useState(mockPaymentRecords)` — no payments API call (unlike `payments/handlers/*` used elsewhere) |
| 27 | Financial Reports | `finance/reports` | 🖥️ UI-only | `FinancialReports.tsx:63-64` `Mock Data mockReports`, `:131,142,180` mocks, `:190-193` `useState(mockReports)` — PDF exports mock numbers |
| 28 | Performance Monitoring | `colleges/performance` | 🖥️ UI-only | `PerformanceMonitoring.tsx:70` `Mock data - replace with actual API calls` — KPI cards static |
| 29 | Faculty Empanelment | `faculty/empanelment` | 🖥️ UI-only | `FacultyEmpanelment.tsx:59` `Mock data` — empanel form adds to local list only |
| 30 | Faculty Feedback & Certification | `faculty/feedback` | 🖥️ UI-only | `FeedbackCertification.tsx:122` `Mock feedback`, `:177` `Mock certification`, `:269` `Mock colleges` — no persist |
| 31 | Library Management | `library/management` | ✅ Working | `LibraryManagement.tsx:19` `libraryService`, `:55-58` `getLibraryStats/getBookIssues/getOverdueBooks` — real CRUD via `features/library` + `functions/api/library/*` |
| 32 | Library Clearance | `library/clearance` | ⚠️ Partial | `LibraryClearance.tsx` — no mock keyword, no `apiPost` hit either; likely reuses `libraryService` (same as #31) but unproven in isolation — treat as Partial until traced |
| 33 | Service Requests | `library/service-requests` | ⚠️ Partial | Same — `LearnerServiceRequests.tsx`, no mock, no direct `apiPost` in grep; probable `libraryService` path, unverified |
| 34 | Graduation Integration | `library/graduation-integration` | ⚠️ Partial | Same reasoning — no mock, no proven API; Partial |
| 35 | HR: Faculty Lifecycle | `hr/faculty-lifecycle` | 🖥️ UI-only | `FacultyLifecycle.tsx:48` `Mock data`, zero `apiPost`/`useQuery` — lifecycle timeline static |
| 36 | HR: Staff/Payroll/Deductions/Records/Leave | `hr/*` (6 files) | 🖥️ UI-only | `StaffManagement.tsx:34`, `PayrollProcessing.tsx:26`, `PayrollManagement.tsx:69`, `StatutoryDeductions.tsx:28`, `EmployeeRecords.tsx:61`, `LeaveManagement.tsx:54` — **all** `Mock data`, zero backend calls; payroll never posts |
| 37 | Circulars Management | `communication/circulars` | ⚠️ Partial | `CircularsManagement.tsx:83` `Mock data for colleges` (audience dropdown mock), but circulars list itself likely via `college-admin/circulars.ts` pattern — audience mock degrades targeting, body may persist |
| 38 | Training Updates | `communication/training` | ⚠️ Partial | `TrainingUpdates.tsx:99` `Mock data for colleges` — same: content may post, college selector mock |
| 39 | Settings | `settings` | ⚠️ Partial | `Settings.tsx` — no mock, no `apiPost` in grep; likely local/profile persist only — functional as preferences UI, not org-backed |
| 40 | Curriculum Change Requests | — | ⚠️ Partial | `CurriculumChangeRequests.tsx` + `curriculum-approvals.ts` backend exists (college pattern), but no `apiPost` hit in universityAdmin grep for this file — wiring unproven from this panel |
| 41 | KPIDashboard + Sidebar | widgets | ✅ Working | `KPIDashboard.tsx:38` live KPIs (when fed real props) + `Sidebar.tsx` static nav (correct by design) |
| 42 | Subscription (6 variants) | `subscription/*` | ⚠️ Partial | Same auto-renew TODO (manage), others live via `payments/handlers/*` |

> **University strict tally: ✅ 9 Working (#2,4,5,6,8,9,14,19,31) | ⚠️ 11 Partial (#7,15,16,17,18,32,33,34,37,38,39,40,42) | 🖥️ 22 UI-only (rest).** Backend-connected = `Courses/Browse/Syllabus/Registration/Assessment/DigitalPortfolio/CourseAnalytics/LibraryManagement` only. Everything finance/HR/exams/results/OBE/placement/program-allocation is mock-driven UI — will render in prod but never read/write DB.

---

## 7. Public / Anonymous — 44 Features

| # | Feature | Route | Status | Evidence |
|---|---|---|---|---|
| 1 | Home (+ promo banners) | `/` | ✅ Working | `Home.jsx:16` + `useAssessmentPromotional` banners fetch `promotional/actions fetch-promotional-event:224` |
| 2 | About | `/about` | ✅ Working | Static marketing, by design UI-only but correct (no backend needed) |
| 3 | Contact | `/contact` | ✅ Working | Form posts (no mock) |
| 4 | Puter Demo | `/puter` | 🖥️ UI-only | `PuterDemo.tsx` client AI demo, no persistence — demo by design |
| 5 | Hero Dithering Demo | demo | 🚫 Orphan | `HeroDitheringDemo.tsx:3` no `<Route>` — unreachable |
| 6 | Terms | `/terms` | ✅ Working | Static legal, correct |
| 7 | Privacy Policy | `/privacy-policy` | ✅ Working | Static legal, correct |
| 8 | Receipt | `/receipt/:orderId` | ✅ Working | `Receipt.jsx` + `ReceiptCard` reads payment by orderId |
| 9 | Event Sales (deprecated) | `/signup/plans` | ⚠️ Partial | `EventSales.jsx:12` `@deprecated Use SimpleEventRegistration` — still routed, works but unmaintained |
| 10 | Simple Event Registration | — | 🚫 Orphan | `SimpleEventRegistration.jsx:276` full replacement exists but **no `<Route>`** uses it (imported `publicRoutes.jsx:78` but never mounted) — prod still serves old EventSales |
| 11 | Event Success | `.../success` | ✅ Working | `EventSalesSuccess.jsx` |
| 12 | Event Failure | `.../failure` | ✅ Working | `EventSalesFailure.jsx` |
| 13 | Pre-Reg (Learner) | `/register/learner` | ✅ Working | `SkillPassportPreRegistration.jsx` + `GuestOnlyRoute` persists |
| 14 | Pre-Reg (Corporate) | `/register/corporate` | ✅ Working | Same, corporate variant |
| 15 | Internal Testing Registration | `/internal-testing` | ✅ Working | `InternalTestingRegistration.jsx` |
| 16 | Unified Login | `/login` | ✅ Working | `UnifiedLogin.tsx` + `auth/*` + `sso-worker` RPC |
| 17 | Role Login Forms | — | 🖥️ UI-only | `LoginLearner:22/LoginEducator:20/LoginAdmin:16/LoginRecruiter:21` + `ssoLogin.ts:4` exist but **no routes** mount them (only UnifiedLogin routed) — legacy UI, dead unless deep-linked |
| 18 | Unified Signup | `/signup` | ✅ Working | `UnifiedSignup.tsx` + `unified.ts:32 handleUnifiedSignup` |
| 19 | Company Signup | `/signup/company` | ✅ Working | `CompanySignup.tsx` creates org + owner |
| 20 | Forgot Password | `/forgot-password` | ✅ Working | `UnifiedForgotPassword.tsx` + `password.ts:14 send` |
| 21 | Reset Password (Token) | `/reset-password` | ✅ Working | `TokenPasswordReset.tsx` + `verify-otp/reset-password` |
| 22 | Verify Email | `/verify-email` | ✅ Working | `VerifyEmail.tsx` |
| 23 | Accept Invite (Auth) | `/invite/accept` | ✅ Working | `AcceptInvite.tsx` |
| 24 | Invitation Error | `/invitation-error` | ✅ Working | Static error, correct |
| 25 | OAuth Callback (Google) | `/auth/callback` | ✅ Working | `OAuthCallback.tsx` (no GuestOnly by design) + `oauth/*` token exchange |
| 26 | Recruitment Signup Variants | `/signup/recruitment` etc | ✅ Working | `Register.jsx/SignupRecruiter/SignupAdmin` — all mounted |
| 27 | School Sign-In | `/signin/school` | ✅ Working | `SignInSchool.jsx` |
| 28 | University Sign-In + Admin signup | `/signin/university` | ✅ Working | `SignInUniversity.jsx` + `UniversityAdmin.jsx` |
| 29 | Subscription Plans | `/subscription/plans` | ✅ Working | `SubscriptionPlans.jsx` + `subscription-plans.ts:174` (ProtectedRoute — requires login, correct) |
| 30 | Payment Completion | `/subscription/payment` | ✅ Working | `PaymentCompletion.jsx` + `verify-payment.ts:119` HMAC |
| 31 | Payment Success / Failure | `/payment/success` | ✅ Working | `PaymentSuccess.jsx:242` (`hasAccess=true` immediate nav is UX, verify already done server-side) |
| 32 | Accept Invitation (org) | `/accept-invitation` | ✅ Working | `AcceptInvitationPage.tsx` + `invitations/accept` |
| 33 | Invitation Signup | `/invitation/signup` | ✅ Working | `InvitationSignup.tsx` |
| 34 | Complete Profile (Post-OAuth) | `/complete-profile` | ✅ Working | `CompleteProfile.tsx` writes missing fields |
| 35 | Network Error | `/network-error` | ✅ Working | Static, correct |
| 36 | Unauthorized | `/unauthorized` | ✅ Working | Static, correct |
| 37 | Maintenance Page | guard | ✅ Working | `MaintenancePage.tsx:5` via `MaintenanceGuard.tsx:44` + `maintenance/state` — shows for all when active |
| 38 | Learner Public Viewer | `/learner/profile/:learnerId` | ✅ Working | `LearnerPublicViewer.jsx` public share, no auth by design |
| 39 | Organization Setup | `/organization-setup` | ⚠️ Partial | `OrganizationSetupPage.tsx` mounted **without** `ProtectedRoute` (`publicRoutes.jsx:129`) — renders for anon (should require auth); `useOrganizationCheck` with null user bypasses flow |
| 40 | Portfolio — Portfolio | `/portfolio` | ✅ Working | `PortfolioPage.tsx` + theme provider + promo banners |
| 41 | Digital PP — Homepage | `/digital-pp/homepage` | ✅ Working | `HomePage.tsx` |
| 42 | Digital Passport | `/passport` | ✅ Working | `PassportPage.tsx` flipbook |
| 43 | Video Portfolio | `/video-portfolio` | ⚠️ Partial | Same R2 caveat as Learner #49 — blank when bucket unbound |
| 44 | Portfolio Settings | `/settings/*` | ✅ Working | 4 settings pages (Theme/Layout/Export/Sharing) + `ProfileSettings.tsx` file exists (orphan `SettingsPage.tsx` not routed, but 4 routed ones work) |

---

## 8. Cross-Role Shared — 26 Features

| # | Feature | Status | Evidence |
|---|---|---|---|
| 1–11 | Subscription Plans/Manage/Org/Bulk/Payment/Member/AddOns/Upgrade/Banner/Transactions/Guards | ⚠️ Partial (Manage auto-renew TODO, rest Working) | `MySubscription.jsx:457 TODO`, others live (`addon-catalog:6`, `organization-queries:6`) |
| 12 | Add-On Analytics | ✅ Working | `AddOnAnalyticsDashboard.jsx:231` + `addon-analytics.ts:7` |
| 13–17 | Payments Orders/Verify/Lifecycle/Catalog/Plans | ✅ Working | 40 handlers in `payments/handlers/*` all live (create/verify/pause/resume/cancel/catalog/entitlements/usage) |
| 18 | Notifications | ✅ Working | `notifications/**` live |
| 19 | Messages Realtime | ✅ Working | `messaging/*` + `realtime-stream/*` + `MessageModal` live |
| 20 | Search (embedding) | ✅ Working | `generateEmbedding.ts:354` live |
| 21 | Analytics KPI | ✅ Working | `useSpeedAnalytics/useAnalyticsKPIs` + `KPIDashboard.tsx:38` live |
| 22 | Streak Service | ✅ Working | `streak/*` + `StreakTestPanel.jsx:4` (panel is dev tool, service live) |
| 23 | Maintenance Guard | ✅ Working | `MaintenanceGuard.tsx:44` live |
| 24 | Guards | ⚠️ Partial | `SubscriptionProtectedRoute/OrganizationGuard/AdminProtectedRoute` enforce, but `GuestOnlyRoute.tsx:32` `if(targetApp==='lte') return children` bypass + `publicRoutes.jsx:129` org-setup unguarded — 2 holes |
| 25 | Promotional Engine | ✅ Working | `promotionalStore.ts:224` + `PromotionalModal` + `LearnerPlanCard` + `promotional/*` live |
| 26 | Broadcast | ✅ Working | `broadcast/ui` announcements live |

> **Audit total (strict, all panels): ✅ 174 Working (49%) | ⚠️ 111 Partial (31%) | 🖥️ 55 UI-only (15%) | 🚫 8 Orphan (2%) | 🔒 10 Client-gated (3%).**
> **University alone: ✅ 9 / ⚠️ 11 / 🖥️ 22 — do not demo Finance/HR/Exams/OBE/ProgramAllocation as functional. Learner/Educator/Recruiter/School/College re-checked with same mock-vs-API rule; 4 fixes applied (CollegeAssignments, Parent Portal, Coverage Tracker → Partial; Graduation → UI-only).**
> **Ship-blockers:** wire-or-delete `SimpleEventRegistration`/`RecruiterAI`/role `Login*`; replace university `Finance/FinancialReports/PaymentTracking/CentralizedResults/ProgramAllocation/OBE/PlacementReadiness/Examination/Grade/ResultsPublishing/HR×7` mocks with `university-admin/actions` handlers (copy `Courses/AssessmentResults` pattern); guard `OrganizationSetup`; fix `GuestOnlyRoute` lte bypass; subscription auto-renew TODO; assessment grade TODOs.

---

## 9. Redundancy / Fallback Inventory — All Duplicate + Degraded Paths Inside SkillPassport

> **Method:** keyword sweep `fallback|Fallback|aiFallback|mockData|loadMockData|getFallback*|createFallback*|tryFetchAdaptiveResults|AbortController|hasAccess:true|subscriptionFallbackPath|http-fallback` across `src/**` + `functions/api/**`. Redundancy = same capability implemented twice (dead or divergent); Fallback = degraded path that hides outage by showing mock/empty.

### 9.1 Mock-Data Fallbacks (UI shows mock when API empty — hides prod outage)

| # | Location | Redundant/Fallback | Prod effect |
|---|---|---|---|
| 1 | `src/pages/learner/Dashboard.jsx:73,794,891` | `mockData` import + `aiFallback` + “with fallbacks” | Dashboard never errors — shows mock cards/AI text when learner API down; operator can't tell outage from real data |
| 2 | `src/pages/learner/MySkills.jsx:21-22,35` | `mockSuggestions` fallback `learnerData?.suggestions \|\| mockSuggestions` | Skills grid real, suggestions always populated (mock) — looks functional when recommender dead |
| 3 | `src/pages/learner/UnifiedDashboard.jsx:43` | `mockData` only, no `apiPost` | Legacy dashboard duplicate of `Dashboard.jsx` — same route family, divergent data |
| 4 | `src/pages/learner/CollegeAssignments.tsx:24` | `MOCK_ASSIGNMENTS` preview | Mock rows render before/instead of real tasks |
| 5 | `src/features/educator/model/mock*.ts` + `api/mockApi.ts:1` | `mockClasses/mockActivities/mockLearners/mockMedia/mockMentorNotes` + `mockApiCall()` wrapper still exported via `educator/index.ts:61-65` | Educator Dashboard/Classes/Activities/Analytics fall back to `via.placeholder.com` data; `mockApi` duplicate of real `educator/actions` handlers — two sources of truth |
| 6 | `src/entities/course-analytics/api/queries.ts:12` | `mockDataFactory.ts` “pre-first-fetch” placeholder | Course-analytics widgets show mock KPIs on first paint, then swap to real — flicker + screenshot tests capture mock |
| 7 | `src/entities/user/model/useRecentUpdatesLegacy.ts:7,62-65` | `fallback-1` hardcoded update when auth data unavailable | Recent-updates feed never empty — shows `fallback-1` row in prod when feed API fails |
| 8 | University 22 files (see §6) | `mocklearners/mockSubjects/mockResults/mockColleges/mockReports/mockStats/loadMockData()` | Entire panel renders without DB — Finance/HR/Exams always “work” with fake numbers |
| 9 | Recruiter `ProjectHiring.tsx:16`, `ProjectHiringWithNav.tsx:27`, `Analytics.tsx:28` | `mockProjects/mockProposals/mockContracts/mock-data-generator` | Projects + non-funnel analytics never call backend — duplicate of real `recruitment/*` APIs that exist but aren't wired here |

### 9.2 AI/LLM Fallbacks (counselling + career + learning-path — 12 functions)

| # | Location | Fallback chain |
|---|---|---|
| 10 | `src/features/counselling/api/aiCareerPathService.ts:357-1030` | `getFallbackResponsibilities:386`, `getFallbackIndustryDemand:520`, `getFallbackCareerProgression:724`, `getFallbackLearningRoadmap:739`, `getFallbackRecommendedCourses:786`, `getFallbackFreeResources:825`, `getFallbackActionItems:855`, `getFallbackSuggestedProjects:870`, `getFallbackRoleOverview:900` — every AI parse failure pushes `getFallbackX(role)[i]` so UI never errors, just shows generic “professional” text (`:407` fallback to `'professional'`) |
| 11 | `src/features/career-assistant/lib/prompts/learningPathPrompt.ts:81-83` | `createFallbackLearningPath()` when AI fails or profile minimal |
| 12 | `src/entities/user/model/useRoleOverview.ts:63-75,190-200` + `useRoleResponsibilities.ts:152-154` + `useIndustryDemand.ts:122` | `getFallbackRoleOverview/getFallbackResponsibilities/getFallbackIndustryDemand` on catch; `useRoleOverview` explicitly **does not cache fallback** (`:74-75` return null, `:200` don't cache) so every reload retries API — redundant retry storm when LLM down |
| 13 | `src/features/assessment/lib/streamUtils.ts:347` | `getFallbackKnowledgeQuestions(streamId)` when stream bank missing |
| 14 | `functions/api/assessment/services/analyzers/*` (6 files) + `career-cluster-generator.ts:36` | `tryFetchAdaptiveResults()` fallback in `analysis-middle-school:331`, `college:442`, `highschool:230`, `higher-secondary:202`, `after10:202`, `after12:401` + `gemini-2.0-flash cheap fallback` + `fallbackSalary:321` — adaptive scores silently sourced from stale session when primary missing |

### 9.3 Assessment / Capability Degraded Paths

| # | Location | Fallback |
|---|---|---|
| 15 | `functions/api/assessment/handlers/get-role-capabilities` (LTE 5s) | `AbortController 5s → apiSuccess([],200)` — timeout returns empty capabilities as success; `CareerTrackModal` shows no roles instead of error |
| 16 | `functions/api/assessment/utils/question-loader.ts:313-314` | `timeLimit: 15*60` hardcoded fallback mapped for frontend when bank has no limit |
| 17 | `functions/api/assessment/utils/streamNormalizer.ts:381,576` | `No partial match → fallback logic → Default fallback` stream mapping — wrong stream silently mapped instead of 400 |

### 9.4 Subscription / Entitlement Fail-Open Fallbacks (🔒 redundant with server)

| # | Location | Fallback |
|---|---|---|
| 18 | `src/features/subscription/lib/featureGating.ts:76,169` + `model/useFeatureGate.ts:109,282` + `model/useSubscriptionQuery.js:91-114` | `hasAccess:true` for paid plans / `freemium true` without checking `planFeatures/entitlements`; `catch → hasAccess:shouldFailOpen` — any 500/timeout grants premium (duplicate of server `FEATURE_GATEWAY_ENABLED` which is `false` in prod, so client is the only gate) |
| 19 | `src/features/courses/ui/CourseDetailModal.jsx:24` | `coursePlanType==='freemium' ? true : userPlanLevel>=coursePlanLevel` — client-only course lock, direct `CoursePlayer` URL bypasses |
| 20 | `src/features/subscription/ui/shared/PaymentSuccess.jsx:242,629` | `hasAccess=true → navigate immediately (no API call)` — success page trusts store, not verify response |
| 21 | `subscriptionFallbackPath` ×8 routes | `learnerRoutes.jsx:61`, `educatorRoutes.jsx:64`, `recruiterRoutes.jsx:53,65,77,96`, `adminRoutes.jsx:337,402,459` — 8 duplicate fallback strings (`/subscription/plans?type=X`); change one, miss others |

### 9.5 Routing / Suspense / Error Redundancy

| # | Location | Redundancy |
|---|---|---|
| 22 | `src/app/routes/AppRoutes.jsx:15` + `src/shared/ui/SuspenseWrapper.jsx:13,32` | Global `<Suspense fallback={<Loader/>}>` **plus** per-wrapper `getFallback()` — nested fallbacks; slow chunk shows two loaders sequentially |
| 23 | `src/app/providers/GlobalErrorBoundary.tsx:16,97` | `ErrorFallback` duplicate of per-page `ErrorScreen` (`assessment/ui/screens`) — two error UIs for same failure |
| 24 | `src/app/providers/tour-wrapper/lib/utils.ts:12,25,142` | Tour progress `localStorage (fallback)` + `Timeout fallback` — tour never fails, just shows stale progress |
| 25 | `src/shared/lib/secure-storage.ts` (obfuscation `catch → return data`) | `obfuscate catch → store as-is`, `tryDeobfuscate fail → return null → removeItem` — corrupted session silently deleted, fallback to plain storage hides quota errors |

### 9.6 Messaging / Lookup Fallback Chains (triple lookup = 3× queries)

| # | Location | Chain |
|---|---|---|
| 26 | `src/features/messaging/ui/modals/NewLearnerConversationModalCollegeAdmin.jsx:231`, `NewEducatorConversationModal.jsx:201`, `NewEducatorAdminConversationModal.jsx:48`, `NewCollegeLecturerConversationModal.jsx:218` | `try by user_id → Fallback: try by email → Fallback: try by college name` — 3 sequential queries per conversation open; first miss doubles latency |
| 27 | `src/entities/user/model/useRoleResponsibilities.ts:8` + `useRoleOverview.ts:8` | Dual import of `generate* + getFallback*` from `features/counselling` — same fallback logic reachable via two hooks (duplicate path) |

### 9.7 Course / Media Redundant Fallbacks

| # | Location | Fallback |
|---|---|---|
| 28 | `src/features/courses/ui/CoursePlayer.jsx:50,667` + `src/features/ai-tutor/ui/VideoLearningPanel.tsx:555` + `model/useVideoSummarizer.ts:46` | `return '/learner/courses'` on bad id + `Check old-style video_url` + `robust summary lookup with fallback strategies` — 3 layers each swallowing missing-video errors; broken R2 shows “course” instead of error |
| 29 | `src/features/courses/ui/CourseCard.tsx:90-99` | Image fail → hide `img`, show sibling fallback icon — hides broken `R2` URLs instead of reporting |
| 30 | `src/features/certificate-generation/api/certificateLearnerService.ts:39,66` + `certificateService.ts:379` | `Learner name or email username as fallback` + “FIX 3: without misleading fallback assignment” — certificate prints email prefix when name missing (redundant with profile-completeness gate) |

### 9.8 Service-Binding HTTP Fallbacks (Workers)

| # | Location | Redundancy |
|---|---|---|
| 31 | `src/__tests__/property/service-binding-communication.property.test.ts:28,37,46,76,120` | `service-binding \| http-fallback \| failed` — email/file via binding with HTTP fallback; test mocks both paths, so prod failure silently downgrades to HTTP without alerting (duplicate transport, single monitoring) |
| 32 | `backward-compatibility.property.test.ts:281` | `Fallback URL Compatibility` (`https://{api}-api.example.workers.dev`) — old worker URLs kept as fallback alongside service bindings; stale binding still “works” via fallback, hiding misconfig |

### 9.9 Duplicate Implementations (same feature, two files — divergent risk)

| # | Duplication | Files | Risk |
|---|---|---|---|
| 33 | MySubscription ×2 | `src/pages/subscription/MySubscription.jsx:107` + `src/features/subscription/ui/individual/MySubscription.jsx:120` | Fix auto-renew TODO in one, other still mock |
| 34 | PlacementAnalytics ×2 | `src/features/placement/ui/PlacementAnalytics.tsx:29` + `src/pages/admin/collegeAdmin/placement/PlacementAnalytics.tsx:29` | Charts diverge when only one updated |
| 35 | CourseAnalyticsDashboard ×3 | College + School + University `CourseAnalyticsDashboard.tsx` (identical except hierarchy comment) | Fix hierarchy in one, others stale |
| 36 | Login ×5 | `UnifiedLogin.tsx` (routed) + `LoginLearner/LoginEducator/LoginAdmin/LoginRecruiter` (unrouted) + `ssoLogin.ts` shared flow | Security patch to Unified misses dead logins if ever re-mounted |
| 37 | Event registration ×2 | `EventSales.jsx` (routed, deprecated) + `SimpleEventRegistration.jsx:276` (unrouted replacement) | Prod serves deprecated flow; fix lands in wrong file |
| 38 | Recruiter hiring ×2 | `ProjectHiring.tsx` + `ProjectHiringWithNav.tsx` (both `mockProjects`) | Same mock duplicated; fix one, other still stale |
| 39 | Dashboard ×2 | `Dashboard.jsx` + `UnifiedDashboard.jsx:43` (mock-only legacy) | Metrics added to Dashboard never appear in Unified |
| 40 | Assignments ×2 | `Assignments.jsx` (live `useQuery`) + `CollegeAssignments.tsx:24` (mock preview) | Same route family, different data sources |
| 41 | Messages ×2 | `Messages.jsx` (live `apiPost`) + `Messages.optimized.jsx:233` (TODO toast) | Optimised variant silently drops error toasts |
| 42 | Download timeout | `src/shared/utils/downloadHelpers.ts:45` `AbortController` + `useCertificateModal.ts:193,309` `AbortController` + `CareerAssistant.tsx:131,280` `abortControllerRef` | 4 independent abort/timeout implementations; timeout values differ (5s LTE vs 30s httpClient vs cert modal) — same failure surfaces 3 different UXes |

> **De-duplication priority:** wire-or-delete #37/#36/#34/#33 first (dead code with live names); then collapse #35 to one parametric dashboard; then remove mock fallbacks #1/#5/#8 (make empty-state explicit instead of fake data); keep AI fallbacks #10-12 but log `isFallback:true` to monitoring so outages are visible.
