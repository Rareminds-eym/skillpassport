# Codebase Cleanup Report - Old Worker URLs

**Date**: January 28, 2026  
**Issue**: Old `.js` files and hardcoded worker URLs causing build issues

---

## ✅ Issues Fixed

### 1. Removed Old Compiled `.js` Files
These files were shadowing the updated `.ts` files:

- ❌ `src/services/careerApiService.js` (DELETED)
- ❌ `src/services/careerApiService.d.ts` (DELETED)
- ❌ `src/services/assessmentApiService.js` (DELETED)
- ❌ `src/services/assessmentApiService.d.ts` (DELETED)
- ❌ `src/services/courseApiService.js` (DELETED)
- ❌ `src/services/courseApiService.d.ts` (DELETED)
- ❌ `src/services/otpService.js` (DELETED)
- ❌ `src/services/otpService.d.ts` (DELETED)
- ❌ `src/services/streakApiService.js` (DELETED)
- ❌ `src/services/streakApiService.d.ts` (DELETED)
- ❌ `src/services/storageApiService.js` (DELETED)
- ❌ `src/services/storageApiService.d.ts` (DELETED)
- ❌ `src/services/userApiService.js` (DELETED)
- ❌ `src/services/userApiService.d.ts` (DELETED)
- ❌ `src/services/tutorService.js` (DELETED)
- ❌ `src/services/tutorService.d.ts` (DELETED)
- ❌ `src/services/videoSummarizerService.js` (DELETED)
- ❌ `src/services/videoSummarizerService.d.ts` (DELETED)
- ❌ `src/services/questionGeneratorService.js` (DELETED)
- ❌ `src/services/questionGeneratorService.d.ts` (DELETED)
- ❌ `src/services/programCareerPathsService.js` (DELETED)
- ❌ `src/services/programCareerPathsService.d.ts` (DELETED)
- ❌ `src/services/storageService.js` (DELETED)
- ❌ `src/services/storageService.d.ts` (DELETED)

---

## ⚠️ Remaining Issues Found

### Files with Hardcoded Worker URLs

These files still contain hardcoded worker URLs that should be updated:

#### 1. **DocumentViewerModal.tsx**
- **File**: `src/components/admin/modals/DocumentViewerModal.tsx`
- **Issue**: Hardcoded `https://storage-api.dark-mode-d021.workers.dev`
- **Fix**: Use `getPagesApiUrl('storage')` instead

#### 2. **RegistrationForm.jsx**
- **File**: `src/components/skillpassport/RegistrationForm.jsx`
- **Issue**: Hardcoded `https://email-api.dark-mode-d021.workers.dev`
- **Note**: email-api is a standalone worker, this is OK

#### 3. **AddLearningCourseModal.jsx**
- **File**: `src/components/Students/components/AddLearningCourseModal.jsx`
- **Issue**: Hardcoded `https://fetch-certificate.rareminds.workers.dev`
- **Fix**: Use `getPagesApiUrl('fetch-certificate')` instead

#### 4. **SupabaseAuthContext.jsx**
- **File**: `src/context/SupabaseAuthContext.jsx`
- **Issue**: Hardcoded `https://user-api.dark-mode-d021.workers.dev`
- **Fix**: Use `getPagesApiUrl('user')` instead

#### 5. **useSubscriptionPlansData.js**
- **File**: `src/hooks/Subscription/useSubscriptionPlansData.js`
- **Issue**: Hardcoded `https://payments-api.dark-mode-d021.workers.dev`
- **Note**: payments-api is a standalone worker, this is OK

#### 6. **LessonPlan.tsx**
- **File**: `src/pages/admin/schoolAdmin/LessonPlan.tsx`
- **Issue**: Multiple hardcoded `https://storage-api.dark-mode-d021.workers.dev`
- **Fix**: Use `getPagesApiUrl('storage')` instead

#### 7. **SignupAdmin.jsx**
- **File**: `src/pages/auth/components/SignIn/recruitment/SignupAdmin.jsx`
- **Issue**: Hardcoded `https://user-api.dark-mode-d021.workers.dev`
- **Fix**: Use `getPagesApiUrl('user')` instead

#### 8. **SignupRecruiter.jsx**
- **File**: `src/pages/auth/components/SignIn/recruitment/SignupRecruiter.jsx`
- **Issue**: Hardcoded `https://user-api.dark-mode-d021.workers.dev`
- **Fix**: Use `getPagesApiUrl('user')` instead

#### 9. **UnifiedSignup.tsx**
- **File**: `src/pages/auth/UnifiedSignup.tsx`
- **Issue**: Hardcoded `https://user-api.dark-mode-d021.workers.dev`
- **Fix**: Use `getPagesApiUrl('user')` instead

#### 10. **SimpleEventRegistration.jsx**
- **File**: `src/pages/register/SimpleEventRegistration.jsx`
- **Issue**: Hardcoded `https://email-api.dark-mode-d021.workers.dev`
- **Note**: email-api is a standalone worker, this is OK

#### 11. **CoursePlayer.jsx**
- **File**: `src/pages/student/CoursePlayer.jsx`
- **Issue**: Hardcoded `https://streak-api.dark-mode-d021.workers.dev`
- **Fix**: Use `getPagesApiUrl('streak')` instead

---

## 📋 Summary

### Fixed
- ✅ Deleted 22 old `.js` and `.d.ts` files that were shadowing updated `.ts` files
- ✅ Cleared Vite cache
- ✅ Rebuilt application with correct code

### Needs Fixing
- ⚠️ 11 files with hardcoded worker URLs
- ⚠️ 8 files need to be updated to use `getPagesApiUrl()`
- ⚠️ 3 files reference standalone workers (OK to keep)

### Files That Are OK
These reference standalone workers that are NOT migrated to Pages Functions:
- `email-api` (standalone worker with cron)
- `payments-api` (standalone worker with webhook + cron)

---

## 🔧 Recommended Actions

### Priority 1: Update Pages Function References
Update these files to use `getPagesApiUrl()`:

1. `src/components/admin/modals/DocumentViewerModal.tsx`
2. `src/components/Students/components/AddLearningCourseModal.jsx`
3. `src/context/SupabaseAuthContext.jsx`
4. `src/pages/admin/schoolAdmin/LessonPlan.tsx`
5. `src/pages/auth/components/SignIn/recruitment/SignupAdmin.jsx`
6. `src/pages/auth/components/SignIn/recruitment/SignupRecruiter.jsx`
7. `src/pages/auth/UnifiedSignup.tsx`
8. `src/pages/student/CoursePlayer.jsx`

### Priority 2: Verify Standalone Worker References
These are OK but verify they're intentional:
- `email-api` references (2 files)
- `payments-api` references (1 file)

### Priority 3: Prevent Future Issues
Add to `.gitignore`:
```
# Compiled TypeScript files in src
src/**/*.js
src/**/*.d.ts
!src/**/*.test.js
!src/**/*.spec.js
```

---

## 🎯 Next Steps

1. **Immediate**: Restart Pages dev server with clean build
2. **Short-term**: Update the 8 files with hardcoded Pages Function URLs
3. **Long-term**: Add `.gitignore` rules to prevent compiled files in src

---

## ✅ Verification

After cleanup, verify:
```bash
# Check for old worker URLs in dist
grep -r "career-api-dev.dark-mode-d021.workers.dev" dist/assets/

# Should return 0 results for careerApiService
```

**Result**: ✅ Clean - No old URLs in careerApiService build output

---

**Report Generated**: January 28, 2026  
**Status**: Partial cleanup complete, 8 files need updates
