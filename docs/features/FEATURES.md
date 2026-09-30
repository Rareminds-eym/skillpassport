# SkillPassport — Complete Feature List

> **Source:** Verified from `src/app/routes/*.jsx`, `src/pages/**`, `src/features/**/ui/*`, `src/widgets/**/ui/*`, `functions/api/**/handlers/*.ts` | **Branch:** `dev` @ 2026-09-04 | **Roles:** `learner, educator/school_educator/college_educator, recruiter/company_admin/owner, school_admin, college_admin, university_admin, public`

---

## 1. Learner (`learner`) — `/learner/*` — 68 Features

| # | Feature | Route |
|---|---|---|
| 1 | Dashboard Home (Hero, Skills, Training, Recent Updates, OpportunitiesCard AI, SuggestedNextSteps, AnalyticsView, AchievementsTimeline) | `/learner/dashboard` |
| 2 | Analytics Dashboard (ApexCharts: Status, Response Rate, Timeline, Radar, Top Skills) | `/learner/analytics` |
| 3 | Skills Analytics (TopSkillsInDemand) | `src/pages/learner/SkillsAnalytics.jsx` |
| 4 | Unified Dashboard (legacy) | `src/pages/learner/UnifiedDashboard.jsx` |
| 5 | Weekly Learning Tracker | tab in `/learner/courses` |
| 6 | Notification Panel + Realtime (bell, sound, unread badge, SSE) | layout bell |
| 7 | My Profile (own vs public QR viewer) | `/learner/profile`, `/profile/:email`, `/dashboard/:id` |
| 8 | Profile Tabs (11 editable: Academic, Assessments, Certificates, ClubsCompetitions, Courses, Curriculum, Documents, Events, ExamResults, Projects, Notes) | inside Profile |
| 9 | Profile Edit Modals (PersonalInfo, Technical/Soft Skills, Education, Experience, Projects, Certificates) | modals |
| 10 | Learner Profile Drawer (AdmissionNote, Promotion, Graduation, Documents, Approval modals) | drawer |
| 11 | Settings — 12 Sub-Tabs (Profile, PersonalInfo, TechnicalSkills, SoftSkills, Skills, InstitutionDetails, AcademicDetails, GuardianInfo, SocialLinks, Experience, Projects, Certificates + Security/Privacy/Notifications) | `/learner/settings` |
| 12 | Learner Type Selector (school/college branching) | modal |
| 13 | Timeline / Journey Map (framer-motion, filters) | `/learner/timeline` |
| 14 | Achievements + Skill Tracker (badges, DigitalBadges) | `/learner/achievements` |
| 15 | Profile Completion Gate (blocks job apply) | prompt modal |
| 16 | Resume Export / Privacy Filter (PDF) | export |
| 17 | Streak Tracking (markLessonCompleted → streak API) | via CoursePlayer |
| 18 | My Skills (Technical stars 1-5 + Soft) | `/learner/my-skills` |
| 19 | My Learning / My Training (Continue Learning hero, stats, Modern/LteLearningCard, search/sort/filters/pagination 9) | `/learner/my-learning` (=`/my-training`) |
| 20 | Courses Catalog / Resource Studio (SearchBar, AdvancedFilters, CourseDetailModal, recordCourseInterest, CertificateNameModal) | `/learner/courses` |
| 21 | Course Player (VideoLearningPanel + AITutorPanel, saveVideoPosition 5s, time_spent 30s, RestoreProgressModal, markLessonCompleted, R2 authenticated media, YouTube) | `/learner/courses/:courseId/learn` |
| 22 | AI Tutor — Chat + Suggestions (course-level) | `functions/api/ai-tutor/handlers/ai-tutor-chat.ts:82`, `ai-tutor-suggestions.ts:58` + `src/features/ai-tutor/*` |
| 23 | Industrial Visits Section (grade-split) | in Dashboard + Opportunities |
| 24 | Coming Soon (0 lessons) | `/learner/coming-soon` |
| 25 | Assignments Redirect | `/learner/assignments` → `/my-class` |
| 26 | Assignments — Generic Wrapper (vs CollegeAssignments) | `src/pages/learner/Assignments.jsx:32` |
| 27 | CollegeAssignments (skill tasks) | `src/pages/learner/CollegeAssignments.tsx` |
| 28 | Educator Messages Thread (learner-side, mis-placed file) | `src/pages/learner/EducatorMessages.jsx` |
| 29 | Assessment Platform (GradeSelection, CategorySelection, CoverPage) | `/learner/assessment/platform`, `/assessment/start` |
| 30 | Adaptive Aptitude Test (50Q, 3 phases, difficulty 1-5) | `/learner/adaptive-aptitude-test` |
| 31 | Dynamic Assessment (AI 15Q, 15min, auto-save 10s) | `/learner/assessment/dynamic` |
| 32 | General Assessment Test (MCQ, MultiSelect, Likert, SJT, Text, Adaptive + QuestionNavigation) | `/learner/assessment/test` etc |
| 33 | Assessment Submission & AI Analysis (scoring-service, report-generator, career-cluster, RAG fallback 5s) | submit — `functions/api/assessment/handlers/*`, `analyze.ts:916`, `questions.ts:20` |
| 34 | Assessment Results (single + history, CareerTrackModal, RecommendedCourses) | `/learner/assessment/result`, `/results` |
| 35 | Printable Reports & Growth Maps (PrintView*, MiddleSchoolGrowthMap: CapabilityWheel, ExplorerMap) | print |
| 36 | Assessment Screens (SectionIntro, SectionComplete, Loading, Error, Complete, ProgressRing) | screens |
| 37 | Assessment Store (zustand, useAssessmentFlow) | store |
| 38 | Opportunities Hub (AI matching, AdvancedFilters, grade-gated) | `/learner/opportunities` |
| 39 | Industrial Visits Tab (10/page, registerForVisit) | tab |
| 40 | Browse Jobs / My Jobs (server pagination 6) | `/learner/browse-jobs` |
| 41 | Saved Jobs (toggleSaveJob) | `/learner/saved-jobs` |
| 42 | Applications (pipeline + realtime stage_change) | `/learner/applications` |
| 43 | Applied Jobs (dedicated list) | `/learner/applied-jobs` |
| 44 | Job Actions (Save/Apply external link, factoryVisits register, Freemium gate) | actions — `AppliedJobsService.applyToJob`, `offerManagementService` |
| 45 | Opportunity History (middle-school) | tab |
| 46 | Digital Portfolio Home | `/learner/digital-portfolio` |
| 47 | Portfolio Layouts (7: Creative, Modern, SplitScreen, JourneyMap, InfographicDashboard, CompactResume, AIPersona) | `/digital-portfolio/portfolio` |
| 48 | Digital Passport (Flipbook: PersonalInfo, Education, Skills, Projects) | `/digital-portfolio/passport` |
| 49 | Video Portfolio (R2) | `/digital-portfolio/video` |
| 50 | Portfolio Settings — Theme | `/digital-portfolio/settings/theme` |
| 51 | Portfolio Settings — Layout | `/digital-portfolio/settings/layout` |
| 52 | Portfolio Settings — Export (PDF) | `/digital-portfolio/settings/export` |
| 53 | Portfolio Settings — Sharing | `/digital-portfolio/settings/sharing` |
| 54 | Portfolio Settings — Profile | `/digital-portfolio/settings/profile` |
| 55 | Messages (threaded, realtime WS, pipeline chat) | `/learner/messages` |
| 56 | Message Modal (learner drawer quick-message) | `src/features/messaging/ui/modals/MessageModal` + `src/widgets/message-modal` |
| 57 | Career AI Assistant (FeatureGate career_ai) | `/learner/career-ai` |
| 58 | My Class (smart router School vs College) | `/learner/my-class` |
| 59 | Clubs (myClubs attendance %, UpcomingActivities, Certificates, poll 30s) | `/learner/clubs` |
| 60 | Subscription Manage | `/learner/subscription/manage` |
| 61 | Subscription Add-Ons | `/learner/subscription/add-ons` |
| 62 | Course Certificate (download/view, race guard) | modal in Courses — `src/features/certificate-generation/*` |
| 63 | Resume Upload (resumeParserService, DocumentManager) | via settings — `functions/api/resume/*` |
| 64 | Recent Updates Sticky (IntersectionObserver) | dashboard |
| 65 | Navigation Shell (LearnerLayout: Header, Footer, NavButton, QR viewer) | layout |
| 66 | Course Analytics Tab (count-completed-lessons) | via learner-pages API |
| 67 | Backend — Assessment APIs (start/questions/save-response/submit/analyze/role-capabilities) | `functions/api/assessment/*`, `analyze-assessment/*`, `adaptive-session/*`, `question-generation/*` |
| 68 | Backend — Courses/Learner APIs (fetch-courses-query, fetch-course-full, mark-lesson-completed, clubs-data, streak) | `functions/api/learner-pages/*`, `learner-activity/*`, `learner-dashboard-widgets/*`, `course/*`, `courses/*`, `streak/*` |

---

## 2. Educator (`educator, school_educator, college_educator`) — `/educator/*` — 42 Features

| # | Feature | Route |
|---|---|---|
| 1 | Dashboard | `dashboard` |
| 2 | AI Copilot (EducatorAI page) | `ai-copilot` — `src/pages/educator/EducatorAI.tsx` |
| 3 | Educator Copilot Engine (chat + intelligence + teacher/lesson services) | `src/features/educator-copilot/ui/EducatorCopilot.tsx:5`, `api/educatorIntelligenceEngine.ts:54`, `api/teacherService.ts:52` + `functions/api/educator-copilot/*` |
| 4 | Floating Educator AI Button (in EducatorLayout) | `src/shared/ui/FloatingEducatorAIButton.tsx:5` mounted `EducatorLayout.tsx:105` |
| 5 | Learners (My Learners list, LearnerProfileDrawer) | `learners` — `functions/api/educator/handlers/learners.ts:8` |
| 6 | Classes | `classes` |
| 7 | Programs / Program Sections | `programs` |
| 8 | My Courses (CRUD: get-all-courses, create-course, update-course, add-module, add-lesson) | `courses` |
| 9 | Browse Courses (Marketplace) | `browse-courses` |
| 10 | Course Analytics (Per-Course) | `courses/:courseId/analytics` |
| 11 | Course Analytics Dashboard (Assigned → Section hierarchy + StatCard, EnrollmentChart, LearnerDirectoryTable, TrendBadge) | `course-analytics` — `src/widgets/course-analytics-dashboard/ui/*` |
| 12 | Assessment Results (assigned learners) | `assessment-results` |
| 13 | Assignments (School) | `assignments` |
| 14 | College Assignments / Skill Tasks | `college-assignments` |
| 15 | Mentor Notes | `mentor-notes` — `functions/api/educator/handlers/mentor.ts:8` |
| 16 | My Mentees | `mentees` |
| 17 | Digital Portfolio (view learner) | `digital-portfolio` |
| 18 | Settings | `settings` |
| 19 | Subscription Manage / Add-Ons | `subscription/*` |
| 20 | Profile (save-educator-profile, update-educator-media) | `profile` — `functions/api/educator/handlers/educatorInfo.ts:226` |
| 21 | Course Player (learn) | `courses/:courseId/learn` |
| 22 | Educator Management (peer management) | `management` |
| 23 | Communication Hub | `communication` |
| 24 | Messages (Direct) | `messages` — `useEducatorMessages`, `list-conversations` |
| 25 | Analytics (Teaching: useQualityMetrics, useGeographicDistribution) | `analytics` |
| 26 | Activities (Feed) | `activities` |
| 27 | Reports | `reports` |
| 28 | Media Manager (R2 Uploads: fileUploadService, ResourceUploadComponent) | `media-manager` — `functions/api/storage/*` |
| 29 | Lesson Plans List | `lesson-plans` |
| 30 | Lesson Plan Create | `lesson-plans/create` |
| 31 | My Timetable | `my-timetable` |
| 32 | MyTimetable Swap Tab (active requests badge + embedded dashboard) | `src/pages/teacher/MyTimetable.tsx:27,976` embeds `<SwapRequestsDashboard />` |
| 33 | Swap Requests Dashboard (list, filter by status) | `src/pages/teacher/SwapRequestsDashboard.tsx:9` → `useSwapRequests()` |
| 34 | Swap Request Card (approve/reject UI) | `src/features/college-admin/ui/SwapRequestCard.tsx:79` |
| 35 | Mark Attendance (School+College, 16 actions: start/submit) | `mark-attendance` — `functions/api/educator/handlers/attendance.ts` |
| 36 | Clubs / Skill Curricular | `clubs` — `check-club-membership`, `get-club-participation-report` |
| 37 | Notifications (Bell) | layout — `src/features/educator/ui/NotificationPanel.tsx` |
| 38 | Small: CSV Import Preview, Resource Upload, Grading Modal, Assignment File Upload, AssignTaskModal | modals — `functions/api/college-admin/csv-import.ts` |
| 39 | Backend — Educator Info APIs (getOrganizationById, fetchSchoolInfo, saveEducatorProfile, updateMedia) | `functions/api/educator/handlers/educatorInfo.ts:21` |
| 40 | Backend — Learners APIs (getUserById, getLearnersByEmails, fetchProjects/Certificates, getEducatorLearners) | `functions/api/educator/handlers/learners.ts:8` |
| 41 | Backend — Mentor APIs (saveNote, getLearners, getNotes, listNotes) | `functions/api/educator/handlers/mentor.ts:8` |
| 42 | Backend — Utilities (fetchEnrollments, listConversations, createNotification, dbSelect/dbUpdate) | `functions/api/educator/handlers/utilities.ts:15` |

---

## 3. Recruiter (`recruiter, company_admin, owner`) — `/recruitment/*` — 32 Features

| # | Feature | Route |
|---|---|---|
| 1 | Overview (Dashboard) | `overview` |
| 2 | Admin Dashboard (Org Admin only, AdminProtectedRoute) | `admin` |
| 3 | Projects / Project Hiring | `projects` — `src/pages/recruiter/ProjectHiringWithNav.tsx` (+ `ProjectHiring.tsx`) |
| 4 | Recruiter AI Page (standalone Copilot view, unrouted) | `src/pages/recruiter/RecruiterAI.tsx:18` → `<RecruiterCopilot />` |
| 5 | Recruiter Copilot (intent engine, cards, thinking indicators) | `src/features/recruiter-copilot/ui/RecruiterCopilot.tsx:18`, `api/recruiterIntelligenceEngine.ts:57`, `ui/RecruiterCards.tsx`, `ui/AIThinkingIndicators.tsx` + `functions/api/recruiter-copilot.ts` |
| 6 | Floating Recruiter AI Button (in RecruiterLayout) | `src/shared/ui/FloatingRecruiterAIButton.tsx:5` mounted `RecruiterLayout.tsx:107` |
| 7 | Talent Pool (Search Learners, AdvancedFilters) | `talent-pool` |
| 8 | Requisitions (Job CRUD + Import, org-scoped) | `requisition` — `functions/api/recruitment/requisitions (GET/POST/PUT/DELETE)` |
| 9 | Applicants List (per requisition + MessageModal) | `requisition/applicants` — `MessageModal` (`ApplicantsList.tsx:1299`) |
| 10 | Pipelines (Kanban, stage management + PipelineStats, SortMenu, AdvancedFilters) | `pipelines` — `src/features/recruiter-pipeline/ui/PipelineStats.tsx`, `PipelineAdvancedFilters.tsx` |
| 11 | Candidate Profile Drawer / QuickView (in-pipeline profile) | `src/features/recruiter-pipeline/ui/CandidateProfileDrawer.tsx`, `CandidateQuickView.tsx` |
| 12 | Shortlists (AdvancedShortlistFilters) | `shortlists` — `functions/api/recruiter/shortlists-actions.ts` |
| 13 | Interviews (Scheduling) | `interviews` |
| 14 | Offers & Decisions (OfferAdvancedFilters, useOffers) | `offers-decisions` — `functions/api/recruiter/offers.ts` |
| 15 | Verified Learner Work (Portfolio verification) | `verified-work` — `functions/api/college-admin/verifications.ts` |
| 16 | Analytics (Hiring Charts + download) | `analytics` — `ChartDownloadButton.tsx` |
| 17 | Activities (Feed + ActivityIndicators) | `activities` — `ActivityFeed.tsx` |
| 18 | Messages | `messages` |
| 19 | Profile (`organization/profile.ts`) | `profile` |
| 20 | Settings (`organization/config.ts`) | `settings` |
| 21 | Subscription Manage (Admin-only) | `subscription/manage` |
| 22 | Subscription Add-Ons | `subscription/add-ons` |
| 23 | Onboarding Step 1 (Company Info) | `/recruitment/onboarding/step-1` |
| 24 | Onboarding Step 2 (Docs/Verification, upload-logo) | `step-2` — `verification.ts`, `upload-document.ts` |
| 25 | Onboarding Step 3 (Billing/Contacts/Offer Templates) | `step-3` — `billing.ts`, `contacts.ts`, `offer-templates.ts` |
| 26 | Onboarding Step 4 redirect | `step-4` → `step-3` |
| 27 | Organization Management (Members, Invitations, Roles, org-context) | via AdminDashboard — `members/[userId].ts`, `invitations/[id]/resend/cancel` |
| 28 | Recruitment API Middleware + SECURITY_GUIDE | `functions/api/recruiter/_middleware.ts` |
| 29 | Backend — Requisitions APIs (org-scoped CRUD, verifyOrgAccess) | `functions/api/recruitment/requisitions/index.ts` |
| 30 | Backend — Pipeline APIs (stage move, pipeline index) | `functions/api/recruitment/pipeline/index.ts` |
| 31 | Backend — Members/Invites APIs (status, role, resend, cancel) | `functions/api/recruitment/members/*`, `invitations/*` |
| 32 | Backend — Organization APIs (profile, config, verification, billing, contacts, offer-templates) | `functions/api/recruitment/organization/*` |

---

## 4. School Admin (`school_admin`) — `/school-admin/*` — 40 Features

| # | Feature | Route |
|---|---|---|
| 1 | Dashboard | `dashboard` |
| 2 | Learner Admissions (AdmissionsWorkflow) | `learners/admissions` |
| 3 | Attendance Reports | `learners/attendance-reports` |
| 4 | Assessment Results | `learners/assessment-results` |
| 5 | Verifications | `learners/verifications` |
| 6 | Digital Portfolio (Manage learner portfolios) | `learners/digital-portfolio` |
| 7 | Class Management (Sections/Capacity) | `classes/management` |
| 8 | Courses (My Courses) | `courses` |
| 9 | Course Player | `courses/:courseId/learn` |
| 10 | Teacher List | `teachers/list` |
| 11 | Teacher Onboarding (Bulk Import) | `teachers/onboarding` |
| 12 | Teacher Timetable Builder (TimetableBuilderEnhanced) | `teachers/timetable` |
| 13 | Teacher Performance Analytics | `src/features/school-admin/ui/components/TeacherPerformanceAnalytics.tsx` |
| 14 | Document Verification Workflow | `src/features/school-admin/ui/components/DocumentVerificationWorkflow.tsx` |
| 15 | Lesson Plan Approvals | `lesson-plans/approvals` |
| 16 | Academics: Courses | `academics/courses` |
| 17 | Academics: Browse Courses | `academics/browse-courses` |
| 18 | Curriculum Builder (curriculumService) | `academics/curriculum` |
| 19 | Lesson Plans (Wrapper) | `academics/lesson-plans` |
| 20 | Exams & Assessments (ExamWorkflowManager: timetable, invigilation, statuses) | `academics/exams` — `src/features/exams/ui/ExamWorkflowManager.tsx:35` + `src/widgets/exam-workflow` + `functions/api/exams/*` |
| 21 | Parent Portal | `communication/parents` |
| 22 | Message Center | `communication/messages` |
| 23 | Circulars & Feedback (circulars.ts) | `communication/circulars` |
| 24 | Learner Communication | `communication/messages-learner` |
| 25 | Skill Clubs (clubs.ts) | `skills/clubs` |
| 26 | Skill Badges | `skills/badges` |
| 27 | Skill Reports | `skills/reports` |
| 28 | Course Analytics (Grade → Section + StatCard, EnrollmentChart, LearnerDirectoryTable, TrendBadge) | `course-analytics` — `src/widgets/course-analytics-dashboard/ui/*` + `functions/api/school-admin/course-analytics.ts` |
| 29 | Finance — Fees (FeeStructureTab, FeeTrackingTab, LearnerLedgerModal, exportFeeStructurePDF) | `finance/fees` — `functions/api/college-admin/school-finance.ts` |
| 30 | Library (schoolLibraryService) | `infrastructure/library` — `functions/api/college-admin/school-library.ts` |
| 31 | Settings | `settings` — `functions/api/school-admin/settings.ts` |
| 32 | AI Counselling FAB (in AdminLayout) | `src/features/admin/ui/AICounsellingFAB.tsx:6` mounted `AdminLayout.tsx:75` |
| 33 | KPIDashboard (widget) + Admin Sidebar/Pagination/Notification | `src/widgets/kpi-dashboard/ui/KPIDashboard.tsx:38`, `src/features/admin/ui/Sidebar.tsx`, `Pagination.tsx` |
| 34 | Subscription — Manage | `subscription/manage` |
| 35 | Subscription — Add-Ons | `subscription/add-ons` |
| 36 | Subscription — Organization | `subscription/organization` |
| 37 | Subscription — Bulk Purchase | `subscription/bulk-purchase` |
| 38 | Subscription — Organization Payment | `subscription/organization-payment` |
| 39 | Subscription — Member View | `subscription/member-view` |
| 40 | Backend — School Admin APIs (actions, course-analytics, curriculum, settings) | `functions/api/school-admin/actions.ts`, `course-analytics.ts`, `curriculum.ts`, `settings.ts` |

---

## 5. College Admin (`college_admin`) — `/college-admin/*` — 58 Features

| # | Feature | Route |
|---|---|---|
| 1 | Dashboard (learners/faculty/departments/placementRate) | `dashboard` — `functions/api/college-admin/actions.ts:111 get-dashboard-stats` |
| 2 | Department Management (+ HOD Assignment Modal) | `departments/management` — `HODAssignmentModal.tsx:31` |
| 3 | Course Mapping (Dept → Course) | `departments/mapping` |
| 4 | Faculty Management (+ FacultyManagementDashboard swaps tab) | `departments/educators` — `SwapRequestsManagement` (`FacultyManagementDashboard.tsx:169`) |
| 5 | Learner Data Admission (CSV Import) | `learners/data-management` — `functions/api/college-admin/csv-import.ts` |
| 6 | Enrolled Learners | `learners/enrolled` |
| 7 | Attendance Tracking | `learners/attendance` — `functions/api/college-admin/attendance.ts` |
| 8 | Attendance Policies (AttendancePolicyMaster) | `learners/attendance-policies` |
| 9 | Performance Monitoring (InterventionModal + FeedbackModal) | `learners/performance` |
| 10 | Assessment Results | `learners/assessment-results` |
| 11 | Graduation Eligibility (GraduationIntegration) | `learners/graduation` |
| 12 | Digital Portfolio | `learners/digital-portfolio` |
| 13 | Verifications (verifications.ts) | `learners/verifications` |
| 14 | Learner Communication (get-conversations + MessageModal) | `learners/communication` — `functions/api/college-admin/notifications.ts` |
| 15 | Courses (College Courses CRUD) | `academics/courses` |
| 16 | Subject Master | `academics/subject-courses` |
| 17 | Browse Courses | `academics/browse-courses` |
| 18 | Course Player | `courses/:courseId/learn` |
| 19 | Curriculum Builder (curriculumService + exportService) | `academics/curriculum` — `functions/api/college-admin/curriculum.ts` |
| 20 | Curriculum Change Requests/Approvals | `curriculumChangeRequestService.ts`, `curriculum-approvals.ts` |
| 21 | Lesson Plan Management | `academics/lesson-plans` — `functions/api/college-admin/lesson-plans.ts` |
| 22 | Academic Coverage Tracker | `academics/coverage-tracker` |
| 23 | Program Management (programService) | `academics/programs` |
| 24 | Program Section Management (Sem/Sec/Max learners/Faculty) | `academics/program-sections` |
| 25 | Academic Calendar | `academics/calendar` |
| 26 | Examination Management (exams.ts, marks.ts) | `examinations` |
| 27 | Transcript Generation (transcripts.ts) | `examinations/transcripts` |
| 28 | Assessment Grading Master | `examinations/assessment-grading` |
| 29 | Skill Development | `skill-development` |
| 30 | Placement Management | `placements` |
| 31 | Placement Analytics (standalone service + page) | `src/features/placement/ui/PlacementAnalytics.tsx:29`, `api/placementAnalyticsService.ts:41` |
| 32 | Mentor Allocation (+ Reassign Modal) | `mentors` — `ReassignModal.tsx:56` (`MentorAllocation.tsx:1857`) |
| 33 | Swap Requests Management (college-level + details) | `src/features/college-admin/ui/components/SwapRequestsManagement.tsx:25` → `getCollegeSwapRequestsWithDetails` |
| 34 | Swap API (getSwapRequests, getCollegeSwapRequests, transformations) | `api/classSwapService.ts:58`, `lib/swapRequestTransformations.ts:14` + `functions/api/college-admin/class-swaps.ts` |
| 35 | Swap Request Card (approve/reject UI) | `src/features/college-admin/ui/SwapRequestCard.tsx:79` |
| 36 | Circulars Management | `circulars` — `functions/api/college-admin/circulars.ts` |
| 37 | Event Management (events.ts) | `events` |
| 38 | Finance Management (financeService, feeManagementService, budgetManagementService) | `finance` — `functions/api/college-admin/finance.ts` |
| 39 | Library (libraryService) | `library` — `functions/api/college-admin/library.ts` |
| 40 | Reports & Analytics (reportsService) | `reports` — `functions/api/college-admin/reports.ts` |
| 41 | Course Analytics (Dept → Year → Section + StatCard, PerformanceTable, DirectoryTree) | `course-analytics` — `src/widgets/course-analytics-dashboard/ui/*` + `functions/api/college-admin/course-analytics.ts` |
| 42 | User Management (+ legacy ManageUsers) | `users` — `userManagementService.ts` (+ `src/pages/admin/ManageUsers.jsx:4` legacy) |
| 43 | Settings | `settings` |
| 44 | AI Counselling FAB (in AdminLayout) | `src/features/admin/ui/AICounsellingFAB.tsx:6` |
| 45 | KPIDashboard Advanced + Add-On Analytics | `src/features/admin/ui/KPIDashboardAdvanced.tsx:46`, `AddOnAnalyticsDashboard.jsx:231` |
| 46 | Timetable Slots | `collegeTimetableSlotsService.ts` + `functions/api/college-admin/classes.ts` |
| 47 | Breaks | `collegeBreaksService.ts` |
| 48 | Clubs | `clubs.ts` — `functions/api/college-admin/clubs.ts` |
| 49 | Competitions | `competitions.ts` |
| 50 | Class Swaps (backend) | `functions/api/college-admin/class-swaps.ts` |
| 51 | Backend — Academic APIs (academic, curriculum, lesson-plans, coverage, programs) | `functions/api/college-admin/academic.ts`, `curriculum*.ts`, `lesson-plans.ts` |
| 52 | Backend — Exams/Marks/Transcripts APIs | `functions/api/college-admin/exams.ts`, `marks.ts`, `transcripts.ts` |
| 53 | Backend — Operations APIs (admissions, attendance, mentors, circulars, events, finance, library, reports, verifications, storage) | `functions/api/college-admin/admissions.ts`, `attendance.ts`, `mentors.ts`, `circulars.ts`, `events.ts`, `finance.ts`, `library.ts`, `reports.ts`, `verifications.ts`, `storage.ts` |
| 54 | Subscription — Organization | `subscription/organization` |
| 55 | Subscription — Bulk Purchase | `subscription/bulk-purchase` |
| 56 | Subscription — Organization Payment | `subscription/organization-payment` |
| 57 | Subscription — Member View | `subscription/member-view` |
| 58 | Subscription — Manage / Add-Ons | `subscription/manage`, `subscription/add-ons` |

---

## 6. University Admin (`university_admin`) — `/university-admin/*` — 42 Features

| # | Feature | Route |
|---|---|---|
| 1 | Dashboard | `dashboard` |
| 2 | College Registration (+ MessageModal) | `colleges/registration` — `CollegeRegistration.tsx:339 MessageModal` |
| 3 | Program Allocation (to colleges) | `colleges/programs` |
| 4 | Courses (University Courses) | `courses` |
| 5 | Syllabus Approval | `courses/syllabus` — `functions/api/university-admin/actions.ts` |
| 6 | Browse Courses | `browse-courses` |
| 7 | Learner Enrollments (+ Career Path Drawer) | `learners/enrollments` — `CareerPathDrawer.tsx:58` (`LearnerEnrollments.tsx:846`) |
| 8 | Digital Portfolios (Cross-college) | `learners/digital-portfolios` |
| 9 | Assessment Results | `learners/assessment-results` |
| 10 | Continuous Assessment | `learners/continuous-assessment` |
| 11 | Placement Readiness | `placements/readiness` |
| 12 | Outcome-Based Education (OBE Tracking) | `analytics/obe-tracking` |
| 13 | District/College Reports | `analytics/reports` |
| 14 | Course Analytics (Faculty→Dept→Program→Year→Section + StatCard, DirectoryTree) | `analytics/course-analytics` — `src/widgets/course-analytics-dashboard/ui/*` |
| 15 | AI Counselling (university-ai page) | `ai-counselling` — `src/pages/admin/universityAdmin/AICounselling.tsx:9` → `<CounsellingChat />` |
| 16 | University Counselling Engine (service) | `src/features/university-ai/ui/UniversityCounselling.tsx:8` + `api/counsellingService.ts:13` + `functions/api/university-ai/actions.ts` |
| 17 | Counselling Chat + Chat Window | `src/features/counselling/ui/CounsellingChat.tsx`, `ChatWindow.tsx` |
| 18 | Counselling Session List + Topic Selector | `src/features/counselling/ui/SessionList.tsx`, `TopicSelector.tsx` |
| 19 | AI Counselling FAB (in AdminLayout) | `src/features/admin/ui/AICounsellingFAB.tsx:6` |
| 20 | Examination Management | `examinations` |
| 21 | Grade Calculation | `examinations/grades` — `ResultsAnalytics.tsx` |
| 22 | Results Publishing | `examinations/results` |
| 23 | Centralized Results (ResultsAnalytics, ResultsComponents) | `learners/results` — `src/features/university-admin/ui/ResultsAnalytics.tsx` |
| 24 | Learner Certificates | `learners/certificates` — `functions/api/fetch-certificate/*` |
| 25 | Finance | `finance` |
| 26 | Payment Tracking | `finance/payments` |
| 27 | Financial Reports (+ FeeStructureModal) | `finance/reports` — `src/features/university-admin/ui/FeeStructureModal.tsx` |
| 28 | Performance Monitoring (Colleges) | `colleges/performance` |
| 29 | Faculty Empanelment | `faculty/empanelment` |
| 30 | Faculty Feedback & Certification | `faculty/feedback` |
| 31 | Library Management | `library/management` |
| 32 | Library Clearance | `library/clearance` |
| 33 | Learner Service Requests | `library/service-requests` |
| 34 | Graduation Integration | `library/graduation-integration` |
| 35 | HR: Faculty Lifecycle | `hr/faculty-lifecycle` |
| 36 | HR: Staff Mgmt / Payroll / Statutory Deductions / Employee Records / Leave | `hr/staff-management`, `payroll`, `statutory-deductions`, `employee-records`, `leave-management` |
| 37 | Circulars Management | `communication/circulars` |
| 38 | Training Updates | `communication/training` |
| 39 | Settings | `settings` |
| 40 | Curriculum Change Requests | `CurriculumChangeRequests.tsx` — `functions/api/college-admin/curriculum-approvals.ts` |
| 41 | KPIDashboard + Admin Sidebar (shared admin UI) | `src/features/admin/ui/KPIDashboardAdvanced.tsx:46`, `Sidebar.tsx` |
| 42 | Subscription (6 variants: manage/add-ons/organization/bulk-purchase/organization-payment/member-view) | `subscription/*` |

---

## 7. Public / Anonymous — `/*` — 44 Features

| # | Feature | Route |
|---|---|---|
| 1 | Home (Marketing + promotional banners) | `/` — `src/pages/homepage/Home.jsx:16` + `useAssessmentPromotional` |
| 2 | About | `/about` |
| 3 | Contact | `/contact` |
| 4 | Puter Demo (AI Tool) | `/puter` — `src/pages/puter/PuterDemo.tsx` |
| 5 | Hero Dithering Demo (internal) | `src/pages/demo/HeroDitheringDemo.tsx:3` (no public route) |
| 6 | Terms & Conditions | `/terms` |
| 7 | Privacy Policy | `/privacy-policy` |
| 8 | Receipt (Order Success + ReceiptCard) | `/receipt/:orderId` — `src/pages/Receipt.jsx` |
| 9 | Event Sales / Signup Plans (Razorpay) | `/signup/plans`, `/register/plans` — `src/pages/event/EventSales.jsx` (`@deprecated`) |
| 10 | Simple Event Registration (replaces EventSales) | `src/pages/register/SimpleEventRegistration.jsx:276` |
| 11 | Event Success | `.../success` — `EventSalesSuccess.jsx` |
| 12 | Event Failure | `.../failure` — `EventSalesFailure.jsx` |
| 13 | Skill Passport Pre-Registration (Learner) | `/register/learner` |
| 14 | Skill Passport Pre-Registration (Corporate) | `/register/corporate` |
| 15 | Internal Testing Registration | `/internal-testing` |
| 16 | Unified Login | `/login` — `src/pages/auth/UnifiedLogin.tsx` |
| 17 | Role Login Forms (Learner/Educator/Admin/Recruiter + ssoLogin) | `src/features/auth/ui/LoginLearner.tsx:22`, `LoginEducator.tsx:20`, `LoginAdmin.tsx:16`, `LoginRecruiter.tsx:21` + `src/pages/auth/Login*.jsx` |
| 18 | Unified Signup | `/signup` |
| 19 | Company Signup (Recruiter Org) | `/signup/company` |
| 20 | Forgot Password | `/forgot-password` — `UnifiedForgotPassword.tsx` |
| 21 | Reset Password (Token) | `/reset-password` — `TokenPasswordReset.tsx` |
| 22 | Verify Email | `/verify-email` |
| 23 | Accept Invite (Auth) | `/invite/accept` |
| 24 | Invitation Error | `/invitation-error` |
| 25 | OAuth Callback (Google, renders for authed users too) | `/auth/callback` — `functions/api/oauth/*`, `functions/api/auth/*` |
| 26 | Recruitment Signup Variants | `/signup/recruitment`, `/signup/:type`, `/signup/recruitment-admin` |
| 27 | School Sign-In | `/signin/school` |
| 28 | University Sign-In (+ UniversityAdmin signup) | `/signin/university`, `/signup/university-admin` |
| 29 | Subscription Plans (Protected) | `/subscription/plans` (+ `/:type`, `/:type/:mode`) |
| 30 | Payment Completion | `/subscription/payment` — `PaymentCompletion.jsx` |
| 31 | Payment Success / Failure | `/subscription/payment/success`, `/failure` — `PaymentSuccess.jsx`, `PaymentFailure.jsx` |
| 32 | Accept Invitation (org invite) | `/accept-invitation`, `/invitation/accept` — `AcceptInvitationPage.tsx` |
| 33 | Invitation Signup | `/invitation/signup` — `InvitationSignup.tsx` |
| 34 | Complete Profile (Post-OAuth) | `/complete-profile` |
| 35 | Network Error | `/network-error` |
| 36 | Unauthorized | `/unauthorized` |
| 37 | Maintenance Page (via MaintenanceGuard for all) | `src/pages/MaintenancePage.tsx:5` — `src/app/providers/MaintenanceGuard.tsx:44` + `functions/api/maintenance/*` |
| 38 | Learner Public Viewer (Shareable) | `/learner/profile/:learnerId` |
| 39 | Organization Setup (Admin without org) | `/organization-setup` |
| 40 | Digital Portfolio — Portfolio (+ PromotionalModal, banners) | `/portfolio` — `useCurrentPromotional` (`PortfolioLayout.jsx:6`) |
| 41 | Digital PP — Homepage | `/digital-pp/homepage` |
| 42 | Digital Passport | `/passport` |
| 43 | Video Portfolio | `/video-portfolio` |
| 44 | Portfolio Theme/Layout/Export/Sharing Settings (+ ProfileSettings) | `/settings/theme`, `/layout`, `/export`, `/sharing` |

---

## 8. Cross-Role Shared (All Authenticated) — 26 Features

| # | Feature | Route / Evidence |
|---|---|---|
| 1 | Subscription Plans (browse) | `/subscription/plans`, `/plans/:type`, `/:type/:mode` — `src/pages/subscription/SubscriptionPlans.jsx` |
| 2 | Subscription Manage (MySubscription wrapper) | `SubscriptionManage.jsx` → `MySubscription.jsx:107` + `features/subscription/ui/individual/MySubscription.jsx:120` |
| 3 | Organization Subscription Dashboard | `OrganizationSubscriptionPage.tsx` + `useOrganizationSubscription` (`entities/organization/model/useOrganizationSubscription.ts:62`) |
| 4 | Bulk Purchase Wizard | `BulkPurchasePage.tsx` + `BulkPurchaseWizard` (`subscription/__tests__:213`) |
| 5 | Organization Payment | `OrganizationPaymentPage.tsx` |
| 6 | Member Subscription View | `MemberSubscriptionPage.tsx` |
| 7 | Add-On Marketplace (AddOnCard, AddOnCheckout, BundleCard) | `src/features/subscription/ui/AddOnMarketplace.jsx`, `AddOnCard.jsx`, `BundleCard.jsx` |
| 8 | Upgrade Prompt (Inline + Banner + useUpgradePrompt) | `src/features/subscription/ui/UpgradePrompt.jsx:48`, `shared/UpgradePrompt.tsx:16` |
| 9 | Subscription Banner / Status Widget | `SubscriptionBanner.jsx:78`, `SubscriptionStatusWidget.jsx`, `SubscriptionSettingsSection.jsx` |
| 10 | Transaction List / Grid + Receipt Card | `TransactionList.jsx:13`, `TransactionGrid.jsx`, `ReceiptCard.jsx`, `SuccessHeader.jsx` |
| 11 | Subscription Route Guard + Gate | `SubscriptionRouteGuard.jsx:79`, `SubscriptionGate.jsx:96` |
| 12 | Add-On Analytics Dashboard | `src/features/admin/ui/AddOnAnalyticsDashboard.jsx:231` + `addOnAnalyticsService.ts:9` (`functions/api/payments/handlers/addon-analytics.ts:7`) |
| 13 | Payments — Orders (individual, org, event, registration, bundle, addon) | `functions/api/payments/handlers/create-order.ts:107`, `create-org-order.ts:20`, `create-event-order.ts:19`, `create-registration-order.ts:24`, `create-bundle-order.ts:23`, `create-addon-order.ts:23` |
| 14 | Payments — Verify (payment, addon, bundle, org) | `verify-payment.ts:119`, `verify-addon-payment.ts:23`, `verify-bundle-payment.ts:23`, `verify-org-payment.ts:32` |
| 15 | Payments — Lifecycle (pause, resume, cancel, deactivate, auto-renew) | `pause-subscription.ts:20`, `resume-subscription.ts:20`, `cancel-subscription.ts:32`, `deactivate-subscription.ts:20`, `toggle-addon-autorenew.ts:13`, `cancel-addon.ts:19` |
| 16 | Payments — Catalog / Entitlements / Usage | `addon-catalog.ts:6`, `get-available-addons.ts:14`, `get-addon-by-feature-key.ts:14`, `get-user-entitlements.ts:12`, `has-feature-access.ts:16`, `usage-statistics.ts:6`, `license-pool-queries.ts:6`, `organization-queries.ts:6` |
| 17 | Payments — Plans / Features / Subscriptions | `subscription-plans.ts:174`, `subscription-plan.ts:15`, `subscription-features.ts:15`, `get-subscription.ts:16`, `get-user-subscriptions.ts:14`, `get-subscription-payments.ts:15`, `get-user-payments.ts:15`, `get-payment.ts:27` |
| 18 | Notifications (bell, recentUpdatesService, learnerNotificationService, adminNotificationService) | `src/features/notifications/**`, `src/widgets/learner-dashboard/ui/NotificationPanel.tsx` |
| 19 | Messages Realtime (getWSClient, realtime-stream, message-modal) | `src/features/messaging/ui/modals/MessageModal`, `src/widgets/message-modal`, `functions/api/messaging/*`, `functions/api/realtime-stream/*` |
| 20 | Search (Algolia via embedding-worker, generateEmbedding) | `functions/api/embedding/handlers/generateEmbedding.ts:354` |
| 21 | Analytics KPI (useSpeedAnalytics, useAnalyticsKPIs, KPIDashboard widget) | `src/features/analytics/model/*`, `src/widgets/kpi-dashboard/ui/KPIDashboard.tsx:38` |
| 22 | Streak Service + Streak Test Panel | `functions/api/streak/*`, `src/features/admin/ui/StreakTestPanel.jsx:4` |
| 23 | Maintenance Guard + Maintenance Page | `src/app/providers/MaintenanceGuard.tsx:44` → `src/pages/MaintenancePage.tsx:5` |
| 24 | Guards (OrganizationGuard, SubscriptionProtectedRoute, AdminProtectedRoute, ProtectedRoute, GuestOnlyRoute) | `src/app/guards/*`, `src/features/subscription/ui/shared/SubscriptionProtectedRoute.jsx:27`, `src/features/recruitment/ui/*ProtectedRoute.tsx` |
| 25 | Promotional Engine (banners, modal, LearnerPlanCard, store) | `src/features/promotional/model/promotionalStore.ts:224`, `ui/LearnerPlanCard.jsx:9`, `src/shared/ui/marketing/PromotionalModal.jsx:9`, `useAssessmentPromotional` (`PublicLayout.jsx:17`, `PortfolioLayout.jsx:6`, `Home.jsx:16`) + `functions/api/promotional/*` |
| 26 | Broadcast (announcements) | `src/features/broadcast/ui/index.ts` |

> **Total: 68 (Learner) + 42 (Educator) + 32 (Recruiter) + 40 (School Admin) + 58 (College Admin) + 42 (University Admin) + 44 (Public) + 26 (Shared) = 352 verified items.** All tables use `| # | Feature | Route |`. Sources: `src/app/routes/*.jsx`, `src/pages/**`, `src/features/**/ui/*`, `src/widgets/**/ui/*`, `functions/api/**/handlers/*.ts`.
