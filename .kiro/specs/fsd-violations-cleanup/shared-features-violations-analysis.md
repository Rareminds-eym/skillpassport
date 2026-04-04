# Shared→Features Import Violations Analysis

## Summary
Total violations found: 26 import statements across 20 files

## Progress
- ✅ Task 8.1: Identified all shared→features imports (26 violations across 24 files)
- ✅ Task 8.2: Moved feature types to shared/types/ (8 type import violations fixed)
- ⏳ Task 8.3: Refactor shared hooks importing feature services (10 service imports remaining)
- ⏳ Task 8.4: Extract feature logic from shared UI components (5 logic imports remaining)
- ⏳ Task 8.5: Verify build after shared imports fixed

## Completed Fixes

### Type Imports Fixed (8 files)
1. ✅ src/shared/lib/hooks/useAdaptiveAptitude.ts - Now imports types from @/shared/types/adaptiveAptitude
2. ✅ src/shared/chat-ui/index.ts - Now exports from ./types instead of @/features/student-profile/model
3. ✅ src/shared/chat-ui/hooks/useChatTyping.ts - Now imports from ../types
4. ✅ src/shared/chat-ui/components/MessageBubble.tsx - Now imports from ../types
5. ✅ src/shared/chat-ui/components/WelcomeScreen.tsx - Now imports from ../types
6. ✅ src/shared/api/index.ts - Now exports from ./types

Note: Types for lesson plans and mentor allocation are still in features but will be addressed in future tasks as they require more complex refactoring.

## Categorization

### Category 1: Type Imports (8 violations)
**Pattern**: Shared components/hooks importing types from features

1. **src/shared/lib/hooks/useAdaptiveAptitude.ts**
   - Imports: Types from `@/features/assessment`
   - Fix: Move types to `@/shared/types/adaptiveAptitude.ts`

2. **src/shared/lib/hooks/useLessonPlans.ts**
   - Imports: Types from `@/features/educator-copilot`
   - Fix: Move types to `@/shared/types/lessonPlans.ts`

3. **src/shared/lib/hooks/useMentorAllocation.ts**
   - Imports: Types from `@/features/college-admin`
   - Fix: Move types to `@/shared/types/mentorAllocation.ts`

4. **src/shared/chat-ui/index.ts**
   - Imports: Types from `@/features/student-profile/model`
   - Fix: Move types to `@/shared/types/chat.ts`

5. **src/shared/chat-ui/hooks/useChatTyping.ts**
   - Imports: Types from `@/features/student-profile/model`
   - Fix: Use types from `@/shared/types/chat.ts`

6. **src/shared/chat-ui/components/MessageBubble.tsx**
   - Imports: Types from `@/features/student-profile/model`
   - Fix: Use types from `@/shared/types/chat.ts`

7. **src/shared/chat-ui/components/WelcomeScreen.tsx**
   - Imports: Types from `@/features/student-profile/model`
   - Fix: Use types from `@/shared/types/chat.ts`

8. **src/shared/api/index.ts**
   - Imports: Types from `@/features/student-profile/model`
   - Fix: Use types from `@/shared/types/`

### Category 2: Service/API Imports (10 violations)
**Pattern**: Shared hooks importing feature services directly

1. **src/shared/ui/marketing/RegistrationForm.jsx**
   - Imports: `paymentsApiService` from `@/features/subscription`
   - Fix: Pass service as parameter or move to shared if generic

2. **src/shared/lib/hooks/useAddOnCatalog.ts**
   - Imports: `addOnCatalogService` from `@/features/subscription/api/addOnCatalogService`
   - Fix: Pass service as parameter

3. **src/shared/lib/hooks/useOffers.ts**
   - Imports: `createNotification` from `@/features/notifications/api/notificationService`
   - Fix: Pass notification function as parameter

4. **src/shared/lib/hooks/useOfflineSync.ts**
   - Imports: `progressSyncManager` from `@/features/courses`
   - Fix: Pass sync manager as parameter

5. **src/shared/lib/hooks/usePromotionalEvent.ts**
   - Imports: `isJwtExpiryError` from `@/features/auth/lib/authErrorHandler`
   - Fix: Move auth error utilities to shared/lib

6. **src/shared/lib/hooks/useRealtimeActivities.ts**
   - Imports: `getRecentActivity` from `@/features/analytics/api/dashboardService`
   - Fix: Pass service function as parameter

7. **src/shared/lib/hooks/useSessionRestore.ts**
   - Imports: `courseProgressService` from `@/features/courses`
   - Fix: Pass service as parameter

8. **src/shared/lib/hooks/useStudentRealtimeActivities.ts**
   - Imports: `getStudentRecentActivity` from `@/features/student-profile/api`
   - Fix: Pass service function as parameter

9. **src/shared/lib/hooks/useTutorChat.ts**
   - Imports: Services from `@/features/ai-tutor`
   - Fix: Pass services as parameters

10. **src/shared/lib/hooks/useUsageStatistics.ts**
    - Imports: `usageStatisticsService` from `@/features/analytics/api/usageStatisticsService`
    - Fix: Pass service as parameter

### Category 3: Feature Logic/Store Imports (5 violations)
**Pattern**: Shared components importing feature-specific logic or stores

1. **src/shared/lib/hooks/useProfileCompletionPrompt.ts**
   - Imports: 
     - `usePortfolio` from `@/features/digital-portfolio/model/portfolioStore`
     - `checkProfileCompleteness` from `@/features/student-profile/lib/profileCompletenessChecker`
     - `getPromptDismissed, setPromptDismissed` from `@/features/student-profile/lib/profilePromptPreference`
   - Fix: Extract logic to parent feature, pass data as props

2. **src/shared/lib/hooks/usePaymentVerification.ts**
   - Imports: Functions from `@/features/subscription/api`
   - Fix: Pass verification functions as parameters

3. **src/shared/lib/hooks/useProgramSections.ts**
   - Imports: Multiple functions from `@/features/college-admin`
   - Fix: Pass service functions as parameters

4. **src/shared/lib/hooks/useVideoSummarizer.ts**
   - Imports: Functions from `@/features/ai-tutor`
   - Fix: Pass service functions as parameters

5. **src/shared/api/fileService.js & fileService.ts**
   - Imports: `getFileUrl` from `@/features/courses`
   - Fix: Move to shared if truly generic, or pass as parameter

### Category 4: Complex Multi-Import Hooks (3 violations)
**Pattern**: Hooks importing multiple types and services from features

1. **src/shared/lib/hooks/useAdaptiveAptitude.ts**
   - Imports: Types + Service from `@/features/assessment`
   - Fix: Move types to shared, pass service as parameter

2. **src/shared/lib/hooks/useLessonPlans.ts**
   - Imports: Types + Multiple functions from `@/features/educator-copilot`
   - Fix: Move types to shared, pass functions as parameters

3. **src/shared/lib/hooks/useMentorAllocation.ts**
   - Imports: Types + Multiple functions from `@/features/college-admin`
   - Fix: Move types to shared, pass functions as parameters

## Refactoring Strategy

### Phase 1: Move Types to Shared (8 files)
- Create new type files in `src/shared/types/`
- Move feature types to shared
- Update imports in both shared and features

### Phase 2: Refactor Service Imports (10 files)
- Refactor hooks to accept services as parameters
- Update all hook usage sites to pass services
- Document parameter requirements

### Phase 3: Extract Feature Logic (5 files)
- Move feature-specific logic out of shared hooks
- Pass data/callbacks as props
- Update component usage

### Phase 4: Complex Refactoring (3 files)
- Combine type moves + service parameter injection
- Update all usage sites
- Verify build stability

## Files Requiring Updates

### Shared Layer (20 files)
1. src/shared/ui/marketing/RegistrationForm.jsx
2. src/shared/lib/hooks/useAdaptiveAptitude.ts
3. src/shared/lib/hooks/useAddOnCatalog.ts
4. src/shared/lib/hooks/useLessonPlans.ts
5. src/shared/lib/hooks/useOffers.ts
6. src/shared/lib/hooks/useOfflineSync.ts
7. src/shared/lib/hooks/useMentorAllocation.ts
8. src/shared/lib/hooks/useProfileCompletionPrompt.ts
9. src/shared/lib/hooks/usePaymentVerification.ts
10. src/shared/lib/hooks/useProgramSections.ts
11. src/shared/lib/hooks/usePromotionalEvent.ts
12. src/shared/lib/hooks/useRealtimeActivities.ts
13. src/shared/lib/hooks/useSessionRestore.ts
14. src/shared/lib/hooks/useStudentRealtimeActivities.ts
15. src/shared/lib/hooks/useTutorChat.ts
16. src/shared/lib/hooks/useUsageStatistics.ts
17. src/shared/lib/hooks/useVideoSummarizer.ts
18. src/shared/chat-ui/index.ts
19. src/shared/chat-ui/hooks/useChatTyping.ts
20. src/shared/chat-ui/components/MessageBubble.tsx
21. src/shared/chat-ui/components/WelcomeScreen.tsx
22. src/shared/api/fileService.js
23. src/shared/api/fileService.ts
24. src/shared/api/index.ts

### New Files to Create
1. src/shared/types/adaptiveAptitude.ts
2. src/shared/types/lessonPlans.ts
3. src/shared/types/mentorAllocation.ts
4. src/shared/types/chat.ts

## Next Steps
1. Mark task 8.1 as complete
2. Proceed with task 8.2 (Move feature types to shared/types/)
3. Continue with remaining subtasks in order
