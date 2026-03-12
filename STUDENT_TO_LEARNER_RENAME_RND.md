# Research & Development: Student to Learner Rename Analysis

## Executive Summary

This document analyzes the feasibility and impact of renaming the "student" role to "learners" throughout the SkillPassport application. The analysis covers frontend, backend, database, and infrastructure changes required.

**Recommendation**: Implement UI-only changes. Full system rename is high-risk and requires extensive migration.

---

## 1. Database Layer Impact

### 1.1 Core Tables Affected

**Primary Table**: `students`
- Would need to be renamed to `learners`
- Contains ~50+ columns including profile data
- Referenced by 30+ other tables via foreign keys

**Foreign Key References Found**:
- `projects.student_id` → `students.id`
- `trainings.student_id` → `students.id`
- `certificates.student_id` → `students.id`
- `education.student_id` → `students.id`
- `experience.student_id` → `students.id`
- `skills.student_id` → `students.id`
- `applied_jobs.student_id` → `students.id`
- `pipeline_candidates.student_id` → `students.id`
- `achievements.student_id` → `students.id`
- `attendance_records.student_id` → `students.id`
- `skill_assessments.student_id` → `students.id`
- `saved_jobs.student_id` → `students.id`
- `messages.sender_id` (when sender_type='student')
- `messages.receiver_id` (when receiver_type='student')
- `conversations` table references
- `notifications` table references
- And 15+ more tables

### 1.2 Database Constraints

**CHECK Constraints to Update**:
```sql
-- messages table
ALTER TABLE messages ADD CONSTRAINT messages_sender_type_check CHECK (
  sender_type = ANY (ARRAY['student'::text, ...])
);

ALTER TABLE messages ADD CONSTRAINT messages_receiver_type_check CHECK (
  receiver_type = ANY (ARRAY['student'::text, ...])
);
```

These would need to be dropped and recreated with 'learner' instead of 'student'.

### 1.3 Database Migration Steps Required

1. Create new `learners` table with identical structure
2. Copy all data from `students` to `learners`
3. Update all foreign key constraints (30+ tables)
4. Update all CHECK constraints
5. Update database triggers and functions
6. Drop old `students` table
7. Update all indexes and sequences

**Estimated Downtime**: 2-4 hours for production database
**Risk Level**: CRITICAL - Data loss risk if migration fails

---

## 2. Authentication & Authorization Layer

### 2.1 Supabase Auth Metadata

**Current Role Values in auth.users**:
- `'student'`
- `'school_student'`
- `'college_student'`
- `'university_student'`

**Stored in**:
- `auth.users.user_metadata.role`
- `auth.users.raw_user_meta_data`
- JWT tokens (issued tokens remain valid until expiry)

### 2.2 Public Users Table

**Table**: `public.users`
**Column**: `role` VARCHAR

Current values:
```typescript
role: 'student' | 'school_student' | 'college_student' | 'university_student'
```

**Migration Required**:
```sql
UPDATE users 
SET role = 'learner' 
WHERE role = 'student';

UPDATE users 
SET role = 'school_learner' 
WHERE role = 'school_student';

UPDATE users 
SET role = 'college_learner' 
WHERE role = 'college_student';

UPDATE users 
SET role = 'university_learner' 
WHERE role = 'university_student';
```

### 2.3 Existing User Accounts

**Impact**: ALL existing student accounts would need:
1. Auth metadata update
2. Public users table update
3. JWT token refresh (force re-login)
4. Session invalidation

**Affected Users**: Potentially thousands of active accounts

---

## 3. Backend API Layer

### 3.1 Cloudflare Workers Functions

**Files Affected** (in `/functions/api/`):
- `user/types.ts` - Role type definitions
- `user/handlers/unified.ts` - Role mapping
- `user/handlers/school.ts` - School student creation
- `user/handlers/college.ts` - College student creation
- `user/handlers/university.ts` - University student creation
- `user/handlers/authenticated.ts` - Student creation logic
- `user/handlers/events.ts` - Role mapping

**Example Change Required**:
```typescript
// Before
type UserRole = 'student' | 'school_student' | 'college_student';

// After
type UserRole = 'learner' | 'school_learner' | 'college_learner';
```

### 3.2 API Endpoints

**Endpoints Affected**:
- `/api/user/signup/student` → `/api/user/signup/learner`
- `/api/user/create-student` → `/api/user/create-learner`
- `/results/student/{id}` → `/results/learner/{id}`

**Breaking Change**: All API consumers would need updates

### 3.3 Service Layer

**Files Requiring Updates** (in `/src/services/`):
- `studentService.js` → `learnerService.js`
- `studentAuthService.js` → `learnerAuthService.js`
- `studentServiceProfile.js` → `learnerServiceProfile.js`
- `studentServiceAdapted.js` → `learnerServiceAdapted.js`
- `studentSettingsService.js` → `learnerSettingsService.js`
- `studentActivityService.js` → `learnerActivityService.js`
- `studentManagementService.ts` → `learnerManagementService.ts`
- `portfolioService.js` - References to students table
- `resumeDataService.js` - Student ID references
- `aiRecommendationService.js` - Student profile updates

**Functions to Rename**:
- `updateStudentProfile()` → `updateLearnerProfile()`
- `getStudentByEmail()` → `getLearnerByEmail()`
- `createStudent()` → `createLearner()`
- And 50+ more functions

---

## 4. Frontend Layer

### 4.1 Routes & Navigation

**Route Paths to Update**:
```typescript
// Current
'/student/dashboard'
'/student/profile'
'/student/applied-jobs'
'/student/browse-jobs'
'/student/assessment/test'
'/student/opportunities'
'/student/courses'
'/student/analytics'
'/student/achievements'
'/student/settings'
'/student/messages'
'/student/subscription/manage'

// New
'/learner/dashboard'
'/learner/profile'
'/learner/applied-jobs'
'/learner/browse-jobs'
'/learner/assessment/test'
'/learner/opportunities'
'/learner/courses'
'/learner/analytics'
'/learner/achievements'
'/learner/settings'
'/learner/messages'
'/learner/subscription/manage'
```

**Impact**: All bookmarks, saved links, and external references break

### 4.2 Component Files

**Files to Rename** (in `/src/components/`):
- `Students/` → `Learners/`
- All child components and utilities

**Files Affected**: 100+ component files

### 4.3 Layout Components

**Files to Update**:
- `StudentLayout.jsx` → `LearnerLayout.jsx`
- `StudentHeader.jsx` → `LearnerHeader.jsx`

### 4.4 Page Components

**Directory to Rename**:
- `/src/pages/student/` → `/src/pages/learner/`

**Files Affected**: 30+ page components

### 4.5 Type Definitions

**Files to Update** (in `/src/types/`):
- `student.ts` → `learner.ts`
- All interfaces and types

**Example**:
```typescript
// Before
export interface Student {
  id: string;
  user_id: string;
  name: string;
  // ... 50+ properties
}

// After
export interface Learner {
  id: string;
  user_id: string;
  name: string;
  // ... 50+ properties
}
```

### 4.6 Hooks

**Files to Rename/Update**:
- `useStudentData.js` → `useLearnerData.js`
- `useStudentDataAdapted.js` → `useLearnerDataAdapted.js`
- `useStudentDataByEmail.js` → `useLearnerDataByEmail.js`
- `useStudentSettings.js` → `useLearnerSettings.js`
- `useStudentProjects.js` → `useLearnerProjects.js`
- `useStudentAchievements.js` → `useLearnerAchievements.js`
- `useStudentMessages.js` → `useLearnerMessages.js`

### 4.7 Context Providers

**Files to Update**:
- References to student role in `AuthContext`
- Role checks in `PortfolioContext`
- Permission checks throughout the app

### 4.8 Utility Functions

**Files to Update** (in `/src/utils/`):
- `studentType.ts` → `learnerType.ts`
- `roleBasedRouter.ts` - Route mappings
- `constants.js` - Route constants
- `subscriptionRoutes.js` - Subscription paths

---

## 5. Infrastructure & Configuration

### 5.1 Environment Variables

No changes required - environment variables don't reference "student"

### 5.2 Build Configuration

**Files to Check**:
- `vite.config.ts` - No changes needed
- `tsconfig.json` - Path aliases may need updates
- `package.json` - Scripts may reference student paths

### 5.3 Deployment Scripts

**Files to Review**:
- Any deployment scripts that reference student routes
- Health check endpoints
- Monitoring configurations

---

## 6. Testing Impact

### 6.1 Test Files to Update

**Unit Tests**:
- `studentType.test.ts` → `learnerType.test.ts`
- `roleBasedRouter.test.ts` - Update test cases
- All component tests referencing student

**Integration Tests**:
- `assessment-test.spec.ts` - Update routes
- API endpoint tests
- Database query tests

**E2E Tests**:
- All user flows involving student role
- Navigation tests
- Authentication tests

### 6.2 Test Data

**Files to Update**:
- `test-data-ai-recommendations.sql`
- `insert-complete-student-data.sql`
- Mock data files
- Seed data scripts

---

## 7. External Dependencies & Integrations

### 7.1 Third-Party Services

**Potential Impact**:
- Analytics tracking (if role is tracked)
- Error monitoring (Sentry, etc.)
- Email templates referencing "student"
- SMS notifications
- Webhook payloads

### 7.2 Documentation

**Files to Update**:
- API documentation
- User guides
- Developer documentation
- README files
- Schema documentation

---

## 8. Risk Assessment

### 8.1 Critical Risks

1. **Data Loss**: Database migration failure could corrupt student data
2. **Authentication Failure**: Role mismatch could lock out all students
3. **API Breaking Changes**: External integrations would break
4. **Downtime**: 2-4 hours minimum for production migration
5. **Rollback Complexity**: Extremely difficult to rollback once deployed

### 8.2 Medium Risks

1. **Broken Bookmarks**: User-saved links would break
2. **SEO Impact**: URL changes affect search rankings
3. **Cache Issues**: Cached role values in browsers/CDN
4. **Session Invalidation**: All students forced to re-login
5. **Third-party Integration Breaks**: Webhooks, APIs fail

### 8.3 Low Risks

1. **UI Text Changes**: Minimal risk if only display text changes
2. **Documentation Updates**: Can be done incrementally
3. **Test Updates**: Can be updated post-deployment

---

## 9. Recommended Approach

### Option A: UI-Only Changes (RECOMMENDED)

**Scope**: Change only user-facing text, keep all internal references as "student"

**Implementation**:
1. Create display name mapping:
```typescript
const ROLE_DISPLAY_NAMES = {
  student: 'Learner',
  school_student: 'School Learner',
  college_student: 'College Learner',
  university_student: 'University Learner'
};

function getRoleDisplayName(role: string): string {
  return ROLE_DISPLAY_NAMES[role] || role;
}
```

2. Update UI components to use display names
3. Update navigation labels
4. Update page titles and headings
5. Update form labels and placeholders

**Effort**: 2-3 days
**Risk**: LOW
**Downtime**: None
**Rollback**: Easy

### Option B: Full System Rename (NOT RECOMMENDED)

**Scope**: Rename everything from database to frontend

**Implementation Phases**:

**Phase 1: Database Migration** (Week 1-2)
- Create migration scripts
- Test on staging
- Backup production
- Execute migration
- Verify data integrity

**Phase 2: Backend Updates** (Week 2-3)
- Update API endpoints
- Update service layer
- Update type definitions
- Deploy with backward compatibility

**Phase 3: Frontend Updates** (Week 3-4)
- Update routes
- Update components
- Update hooks and contexts
- Deploy with route redirects

**Phase 4: Cleanup** (Week 4-5)
- Remove backward compatibility
- Update documentation
- Update tests
- Monitor for issues

**Effort**: 4-5 weeks
**Risk**: CRITICAL
**Downtime**: 2-4 hours minimum
**Rollback**: Extremely difficult

---

## 10. Implementation Plan (Option A - Recommended)

### Step 1: Create Display Name Utility
**File**: `src/utils/roleDisplayNames.ts`
```typescript
export const ROLE_DISPLAY_NAMES: Record<string, string> = {
  student: 'Learner',
  school_student: 'School Learner',
  college_student: 'College Learner',
  university_student: 'University Learner',
  educator: 'Educator',
  school_educator: 'School Educator',
  college_educator: 'College Educator',
  recruiter: 'Recruiter',
  school_admin: 'School Admin',
  college_admin: 'College Admin',
  university_admin: 'University Admin',
  rareminds_admin: 'Admin'
};

export function getRoleDisplayName(role: string): string {
  return ROLE_DISPLAY_NAMES[role] || role;
}

export function getRolePluralDisplayName(role: string): string {
  const singular = getRoleDisplayName(role);
  if (singular.endsWith('Learner')) {
    return singular + 's';
  }
  return singular + 's';
}
```

### Step 2: Update Navigation Components
- Update `StudentLayout.jsx` - Change "Student Dashboard" to "Learner Dashboard"
- Update `StudentHeader.jsx` - Change menu labels
- Update sidebar navigation items

### Step 3: Update Page Titles
- Update all page components in `/src/pages/student/`
- Change document titles
- Update breadcrumbs

### Step 4: Update Form Labels
- Update login page
- Update signup forms
- Update profile forms
- Update settings pages

### Step 5: Update UI Text
- Search for hardcoded "Student" text
- Replace with dynamic display names
- Update tooltips and help text

### Step 6: Testing
- Test all student flows
- Verify no broken functionality
- Check accessibility
- Test on mobile

**Total Effort**: 2-3 days
**Files Changed**: ~50 files
**Risk**: Minimal

---

## 11. Conclusion

**Recommendation**: Implement Option A (UI-Only Changes)

**Rationale**:
1. Achieves the desired user-facing change
2. Minimal risk to system stability
3. No database migration required
4. No API breaking changes
5. Easy to rollback if needed
6. Can be completed in days vs weeks
7. No downtime required

**Full system rename (Option B) should only be considered if**:
- There's a strong business requirement
- Adequate testing resources available
- Acceptable downtime window exists
- Rollback plan is thoroughly tested
- All stakeholders understand the risks

---

## 12. Files Summary

### Database Files to Update (Option B Only)
- 30+ migration scripts
- All foreign key constraints
- All CHECK constraints
- Triggers and functions

### Backend Files to Update (Option B Only)
- 15+ API handler files
- 10+ service files
- 5+ type definition files
- 20+ utility files

### Frontend Files to Update
**Option A**: ~50 files (UI text only)
**Option B**: ~200+ files (complete rename)

### Test Files to Update
**Option A**: ~10 files (display name tests)
**Option B**: ~100+ files (all tests)

---

## Appendix A: Search Patterns Used

```bash
# Role references
role.*student|'student'|"student"|student.*role

# Database table references
from\('students'\)|from\("students"\)|table.*students

# Route references
path.*student|route.*student|/student

# Type references
Student|StudentProfile|StudentData

# Function references
updateStudentProfile|getStudentByEmail|createStudent
```

## Appendix B: Estimated Effort

| Task | Option A | Option B |
|------|----------|----------|
| Planning | 1 day | 1 week |
| Database Migration | 0 | 2 weeks |
| Backend Updates | 0 | 2 weeks |
| Frontend Updates | 2 days | 2 weeks |
| Testing | 1 day | 1 week |
| Documentation | 1 day | 1 week |
| Deployment | 1 hour | 4 hours |
| **Total** | **3 days** | **8 weeks** |

---

**Document Version**: 1.0
**Date**: 2026-03-05
**Author**: Kiro AI Assistant
**Status**: Final Recommendation
