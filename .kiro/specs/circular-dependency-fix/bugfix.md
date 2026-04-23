# Bugfix Requirements Document

## Introduction

The build process (`npm run build:dev`) produces multiple circular dependency warnings from Rollup/Vite. These warnings occur when modules import from their parent index file (barrel export) while the parent index re-exports those same modules, creating circular reference chains. This affects code splitting, chunk generation, and potentially module initialization order in production builds.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN `useStudentMessageNotifications`, `useStudentUnreadCount`, or `useStudentConversations` hooks import from `src/entities/student/index.ts` AND that index file re-exports those same hooks THEN the system produces circular dependency warnings during build

1.2 WHEN `analyzeAssessmentWithGemini` from `geminiAssessmentService.js` imports from `src/features/assessment/api/index.ts` AND that index file re-exports the function THEN the system produces circular dependency warnings during build

1.3 WHEN modules in `src/shared/api/supabaseClient.ts`, `src/stores/authStore.ts`, `src/shared/model/searchStore.ts`, `src/stores/portfolioStore.ts`, `src/stores/assessmentStore.ts`, `src/shared/model/tourStore.ts`, `src/shared/lib/pagesUrl.ts`, and `src/stores/subscriptionStore.ts` mix dynamic and static imports THEN the system produces circular dependency warnings about modules ending up in different chunks

1.4 WHEN the build process encounters these circular dependencies THEN Rollup warns that modules "will end up in different chunks by current Rollup settings"

1.5 WHEN circular dependencies exist THEN the build output is cluttered with warnings that obscure legitimate issues

### Expected Behavior (Correct)

2.1 WHEN `useStudentMessageNotifications`, `useStudentUnreadCount`, or `useStudentConversations` hooks need to reference each other THEN the system SHALL import directly from the specific module files rather than through the barrel export

2.2 WHEN `analyzeAssessmentWithGemini` needs to import other assessment API functions THEN the system SHALL import directly from specific module files rather than through the barrel export

2.3 WHEN modules need to import from stores or shared utilities THEN the system SHALL use consistent import patterns (either all static or all dynamic) to avoid chunk splitting conflicts

2.4 WHEN the build process runs THEN the system SHALL complete without circular dependency warnings

2.5 WHEN barrel exports (index.ts files) re-export modules THEN the system SHALL ensure those modules do not import back from the barrel export

### Unchanged Behavior (Regression Prevention)

3.1 WHEN external consumers import from `@/entities/student` THEN the system SHALL CONTINUE TO provide all public API exports through the barrel export

3.2 WHEN external consumers import from `@/features/assessment/api` THEN the system SHALL CONTINUE TO provide all assessment services through the barrel export

3.3 WHEN the application runs in development or production THEN the system SHALL CONTINUE TO function with the same runtime behavior

3.4 WHEN modules are code-split by Rollup/Vite THEN the system SHALL CONTINUE TO produce optimized chunks for lazy loading

3.5 WHEN TypeScript type checking runs THEN the system SHALL CONTINUE TO pass without type errors

3.6 WHEN existing import paths in consumer code use barrel exports THEN the system SHALL CONTINUE TO resolve correctly without requiring changes to consumer code
