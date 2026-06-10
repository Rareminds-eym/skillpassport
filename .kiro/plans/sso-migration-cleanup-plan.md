# SSO Migration Cleanup: `localStorage` Tech Debt

During the deep investigation of the "No learner data available" error on the Digital Portfolio page, a **major systemic issue** was uncovered left behind by the recent Single Sign-On (SSO) migration.

## The Problem
Before the SSO migration, the application relied heavily on storing user session data in the browser's `localStorage` (e.g., `localStorage.getItem('user')` and `localStorage.getItem('userEmail')`).

After the SSO migration, authentication state is now managed securely by `@rareminds-eym/auth-core` via a Zustand store (`src/shared/model/authStore.ts`). This new store persists data under a new key: `skillpassport-auth-v1`, and **it no longer saves `user` or `userEmail` directly to `localStorage`**.

As a result, **any frontend code still using `localStorage.getItem('user')` or `localStorage.getItem('userEmail')` is completely broken** because those keys return `null`.

## Impact Radius
A deep scan across the `src/` directory found the following:
- **~48 files** still rely on `localStorage.getItem('user')`.
- **~30 files** still rely on `localStorage.getItem('userEmail')`.

Some files use a fallback (e.g. `localStorage.getItem('userEmail') || user?.email`), which is safe, but **many files have no fallback at all**. 

The following critically broken pages have been proactively fixed:
- `src/pages/digital-pp/PortfolioPage.tsx`
- `src/pages/learner/Analytics.jsx`
- `src/pages/learner/AchievementsPage.jsx`

However, pages like `ProfileFixed.tsx`, `Pipelines.tsx`, `Interviews.tsx`, and dozens of modals/widgets will likely crash or fail to load data because they are trying to parse a `null` user.

## Proposed Changes

We need to systematically replace all legacy `localStorage.getItem('user')` and `localStorage.getItem('userEmail')` calls with the new `useUser()` hook from `@/shared/model/authStore`.

### Phase 1: Fix Core Pages
Update the most critical user-facing pages:
- `src/pages/educator/ProfileFixed.tsx`
- `src/pages/recruiter/Interviews.tsx`
- `src/pages/recruiter/Pipelines.tsx`

### Phase 2: Fix Admin & Dashboard
Update the admin panels and dashboard components:
- `src/pages/admin/schoolAdmin/AttendanceReports.tsx`
- `src/pages/admin/collegeAdmin/ReportsAnalytics.tsx`
- `src/pages/admin/universityAdmin/DigitalPortfolio.tsx`
- `src/features/school-admin/ui/components/TeacherOnboarding.tsx`

### Phase 3: Fix Modals and Widgets
Update the modal components used for adding learners and managing subscriptions:
- `src/features/educator/ui/modals/AddLearnerModal.tsx`
- `src/features/college-admin/ui/modals/AddLearnerModal.tsx`
- `src/pages/subscription/OrganizationSubscriptionPage.tsx`

## Verification Plan

### Automated Tests
Run `npm run build:dev` to ensure no syntax or React Hook rules are broken during the refactor.

### Manual Verification
Verify that `npm run pages:dev` continues to start successfully.
