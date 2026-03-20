# Implementation Plan: FSD Phase 4.1 - Complete Context API Migration

## Overview

This phase completes the Context API → Zustand migration by eliminating the last 2 files importing from @/context/. The migration follows the established pattern of replacing the monolithic `useAuth()` hook with granular Zustand hooks for better performance and consistency.

## Tasks

### Sub-phase 4.1: Complete Context API Migration ✅ COMPLETED

- [x] 1. Migrate CoursePlayer.jsx Context API usage
  - [x] 1.1 Replace useAuth import with Zustand hooks
  - [x] 1.2 Replace useAuth destructuring with granular hooks

- [x] 2. Migrate Dashboard.jsx Context API usage
  - [x] 2.1 Replace useAuth import with Zustand hooks
  - [x] 2.2 Update useAuth usage pattern

- [x] 3. Validate complete Context API elimination
  - [x] 3.1 Verify zero Context API imports

- [x] 4. Final checkpoint - Ensure migration success

### Sub-phase 4.2: Replace Old useAuth() Pattern (25+ files)

- [x] 5. Migrate educator pages useAuth() pattern
  - [x] 5.1 Update src/pages/educator/MentorNotes.tsx
    - Replace `const { user, role } = useAuth();` with `const user = useUser(); const { role } = useUserRole();`
    - _Requirements: 2.1, 2.2_
  
  - [x] 5.2 Update src/pages/educator/StudentsPage.tsx
    - Replace useAuth() with granular hooks based on usage
    - _Requirements: 2.1, 2.3_
  
  - [x] 5.3 Update src/pages/educator/Settings.tsx
    - Replace useAuth() with granular hooks based on usage
    - _Requirements: 2.1, 2.4_
  
  - [x] 5.4 Update src/pages/educator/Profile.tsx
    - Replace useAuth() with granular hooks based on usage
    - _Requirements: 2.1, 2.5_
  
  - [x] 5.5 Update src/pages/educator/MyMentees.tsx
    - Replace useAuth() with granular hooks based on usage
    - _Requirements: 2.1, 2.6_
  
  - [x] 5.6 Update src/pages/educator/DigitalPortfolioPage.tsx
    - Replace useAuth() with granular hooks based on usage
    - _Requirements: 2.1, 2.7_
  
  - [x] 5.7 Update src/pages/educator/Messages.tsx
    - Replace useAuth() with granular hooks based on usage
    - _Requirements: 2.1, 2.8_
  
  - [x] 5.8 Update src/pages/educator/Courses.tsx
    - Replace useAuth() with granular hooks based on usage
    - _Requirements: 2.1, 2.9_

- [x] 6. Migrate other role pages useAuth() pattern
  - [x] 6.1 Update src/pages/teacher/MyTimetable.tsx
  - [x] 6.2 Update src/pages/student/AdaptiveAptitudeTest.tsx
  - [x] 6.3 Update src/pages/student/Applications.jsx
  - [x] 6.4 Update src/pages/student/AssessmentStart.jsx
  - [x] 6.5 Update src/pages/recruiter/ApplicantsList.tsx
  - [x] 6.6 Update src/pages/recruiter/Requisitions.tsx
  - [x] 6.7 Update src/pages/recruiter/Profile.tsx
  - [x] 6.8 Update src/pages/recruiter/Messages.tsx
  - [x] 6.9 Update src/pages/recruiter/Messages.optimized.tsx
  - [x] 6.10 Update src/pages/recruiter/Interviews.tsx
  - [x] 6.11 Update src/pages/organization/OrganizationSetup.tsx
  - [x] 6.12 Update src/pages/admin/collegeAdmin/Verifications.jsx
  - [x] 6.13 Update src/pages/admin/collegeAdmin/ReportsAnalytics.tsx
  - [x] 6.14 Update src/pages/admin/collegeAdmin/Departmentmanagement.tsx

- [x] 7. Migrate hooks useAuth() pattern
  - [x] 7.1 Update src/hooks/useAnalytics.ts
  - [x] 7.2 Update src/hooks/useConversationStudents.ts
  - [x] 7.3 Update src/hooks/useAssessment.js

- [x] 8. Validate useAuth() pattern elimination
  - [x] 8.1 Search for remaining useAuth() calls
  - [x] 8.2 Verify all files use granular hooks

## Migration Pattern Reference

```javascript
// Before (Context API)
import { useAuth } from '@/context/AuthContext';
const { user, role, isAuthenticated, loading, logout } = useAuth();

// After (Zustand)
import { useUser, useUserRole, useIsAuthenticated, useAuthLoading, useAuthActions } from '@/stores';
const user = useUser();
const { role } = useUserRole();
const isAuthenticated = useIsAuthenticated();
const loading = useAuthLoading();
const { logout } = useAuthActions();
```

## Notes

- Tasks marked with `*` are optional and can be skipped for faster completion
- Each task references specific requirements for traceability
- Focus on maintaining identical functionality during migration
- This completes the Context API migration, enabling Phase 5 to proceed
- Estimated effort: 1-2 hours with low risk (proven migration pattern)