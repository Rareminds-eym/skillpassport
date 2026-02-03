# Frontend Complete Wiring to Pages Functions

## Current State Analysis

### Services Already Migrated (Using apiFallback - Need to Remove Fallback)
1. ✅ `assessmentApiService.ts` - Uses old apiFallback function
2. ✅ `careerApiService.ts` - Uses createAndRegisterApi
3. ✅ `courseApiService.ts` - Uses createAndRegisterApi
4. ✅ `otpService.ts` - Uses createAndRegisterApi
5. ✅ `streakApiService.ts` - Uses createAndRegisterApi
6. ✅ `storageApiService.ts` - Uses createAndRegisterApi
7. ✅ `userApiService.ts` - Uses createAndRegisterApi

### Services Using Old Worker URLs Directly (Need Migration)
1. ❌ `tutorService.ts` - Uses VITE_COURSE_API_URL directly
2. ❌ `storageService.ts` - Uses VITE_STORAGE_API_URL directly
3. ❌ `videoSummarizerService.ts` - Uses VITE_COURSE_API_URL directly
4. ❌ `questionGeneratorService.ts` - Uses VITE_QUESTION_GENERATION_API_URL directly
5. ❌ `programCareerPathsService.ts` - Uses VITE_ANALYZE_ASSESSMENT_API_URL directly
6. ❌ `paymentsApiService.js` - Uses VITE_PAYMENTS_API_URL directly (standalone worker - OK)

### Standalone Workers (Should Keep Direct URLs)
- `paymentsApiService.js` - ✅ Keep as-is (standalone worker with webhook)
- `email-api` - No frontend service
- `embedding-api` - No frontend service

## Changes Required

### Phase 1: Update Migrated Services (Remove Fallback)
- Remove `apiFallback` utility usage
- Use direct Pages Function URLs only
- Remove fallback URL environment variables
- Simplify error handling

### Phase 2: Migrate Remaining Services
- `tutorService.ts` → Use `/api/course` Pages Function
- `storageService.ts` → Use `/api/storage` Pages Function
- `videoSummarizerService.ts` → Use `/api/course` Pages Function
- `questionGeneratorService.ts` → Use `/api/question-generation` Pages Function
- `programCareerPathsService.ts` → Use `/api/analyze-assessment` Pages Function

### Phase 3: Clean Up
- Remove `apiFallback.ts` utility (no longer needed)
- Update environment variable documentation
- Remove fallback-related tests

## New URL Structure

All services will use:
```
${window.location.origin}/api/{service-name}
```

Examples:
- Assessment: `${window.location.origin}/api/assessment`
- Career: `${window.location.origin}/api/career`
- Course: `${window.location.origin}/api/course`
- OTP: `${window.location.origin}/api/otp`
- Storage: `${window.location.origin}/api/storage`
- Streak: `${window.location.origin}/api/streak`
- User: `${window.location.origin}/api/user`
- Question Generation: `${window.location.origin}/api/question-generation`
- Analyze Assessment: `${window.location.origin}/api/analyze-assessment`

## Environment Variables

### Remove (No Longer Needed)
- `VITE_ASSESSMENT_API_URL`
- `VITE_CAREER_API_URL`
- `VITE_COURSE_API_URL`
- `VITE_OTP_API_URL`
- `VITE_STORAGE_API_URL`
- `VITE_STREAK_API_URL`
- `VITE_USER_API_URL`
- `VITE_QUESTION_GENERATION_API_URL`
- `VITE_ANALYZE_ASSESSMENT_API_URL`
- `VITE_PAGES_URL` (use window.location.origin instead)

### Keep (Standalone Workers)
- `VITE_PAYMENTS_API_URL` - Standalone worker with webhook

## Implementation Order

1. Create helper function for Pages Function URLs
2. Update all 7 migrated services to remove fallback
3. Migrate 5 remaining services to Pages Functions
4. Remove apiFallback utility
5. Update tests
6. Verify all functionality
