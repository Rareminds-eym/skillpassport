import * as fs from 'fs';
import * as path from 'path';

interface UtilClassification {
  file: string;
  category: 'feature' | 'entity' | 'shared';
  targetPath: string;
  reason: string;
  feature?: string;
  entity?: string;
}

const utilsDir = path.join(process.cwd(), 'src/utils');

// Analyze utility files and classify them
const classifications: UtilClassification[] = [
  // Assessment-related utilities
  {
    file: 'assessmentDataNormalizer.js',
    category: 'feature',
    feature: 'assessment',
    targetPath: 'src/features/assessment/lib/assessmentDataNormalizer.js',
    reason: 'Assessment-specific data normalization logic'
  },
  
  // Auth-related utilities
  {
    file: 'authCleanup.js',
    category: 'feature',
    feature: 'auth',
    targetPath: 'src/features/auth/lib/authCleanup.js',
    reason: 'Auth cleanup logic'
  },
  {
    file: 'authErrorHandler.js',
    category: 'feature',
    feature: 'auth',
    targetPath: 'src/features/auth/lib/authErrorHandler.js',
    reason: 'Auth error handling'
  },
  {
    file: 'authErrorHandler.d.ts',
    category: 'feature',
    feature: 'auth',
    targetPath: 'src/features/auth/lib/authErrorHandler.d.ts',
    reason: 'Auth error handler types'
  },
  {
    file: 'tokenMonitor.ts',
    category: 'feature',
    feature: 'auth',
    targetPath: 'src/features/auth/lib/tokenMonitor.ts',
    reason: 'Auth token monitoring'
  },
  {
    file: 'tokenRefreshErrorHandler.ts',
    category: 'feature',
    feature: 'auth',
    targetPath: 'src/features/auth/lib/tokenRefreshErrorHandler.ts',
    reason: 'Auth token refresh error handling'
  },
  {
    file: 'refreshCoordinator.ts',
    category: 'feature',
    feature: 'auth',
    targetPath: 'src/features/auth/lib/refreshCoordinator.ts',
    reason: 'Auth refresh coordination'
  },
  
  // Student-related utilities
  {
    file: 'studentExportUtils.ts',
    category: 'feature',
    feature: 'student-profile',
    targetPath: 'src/features/student-profile/lib/studentExportUtils.ts',
    reason: 'Student profile export utilities'
  },
  {
    file: 'studentType.ts',
    category: 'entity',
    entity: 'student',
    targetPath: 'src/entities/student/lib/studentType.ts',
    reason: 'Student type classification logic'
  },
  {
    file: '__tests__/studentType.test.ts',
    category: 'entity',
    entity: 'student',
    targetPath: 'src/entities/student/lib/__tests__/studentType.test.ts',
    reason: 'Student type tests'
  },
  {
    file: 'realStudentDataService.js',
    category: 'entity',
    entity: 'student',
    targetPath: 'src/entities/student/api/realStudentDataService.js',
    reason: 'Student data service'
  },
  
  // Profile-related utilities
  {
    file: 'profileCompletenessChecker.ts',
    category: 'feature',
    feature: 'student-profile',
    targetPath: 'src/features/student-profile/lib/profileCompletenessChecker.ts',
    reason: 'Profile completeness checking'
  },
  {
    file: 'profilePromptPreference.ts',
    category: 'feature',
    feature: 'student-profile',
    targetPath: 'src/features/student-profile/lib/profilePromptPreference.ts',
    reason: 'Profile prompt preferences'
  },
  {
    file: 'profileToast.ts',
    category: 'feature',
    feature: 'student-profile',
    targetPath: 'src/features/student-profile/lib/profileToast.ts',
    reason: 'Profile toast notifications'
  },
  {
    file: 'profileToastExamples.ts',
    category: 'feature',
    feature: 'student-profile',
    targetPath: 'src/features/student-profile/lib/profileToastExamples.ts',
    reason: 'Profile toast examples'
  },
  {
    file: 'PROFILE_TOAST_README.md',
    category: 'feature',
    feature: 'student-profile',
    targetPath: 'src/features/student-profile/lib/PROFILE_TOAST_README.md',
    reason: 'Profile toast documentation'
  },
  
  // Export utilities
  {
    file: 'exportppUtils.ts',
    category: 'feature',
    feature: 'digital-portfolio',
    targetPath: 'src/features/digital-portfolio/lib/exportppUtils.ts',
    reason: 'Digital portfolio export utilities'
  },
  {
    file: 'exportUtils.ts',
    category: 'shared',
    targetPath: 'src/shared/lib/exportUtils.ts',
    reason: 'Generic export utilities used across features'
  },
  
  // Subscription-related utilities
  {
    file: 'subscriptionHelpers.js',
    category: 'feature',
    feature: 'subscription',
    targetPath: 'src/features/subscription/lib/subscriptionHelpers.js',
    reason: 'Subscription helper functions'
  },
  {
    file: 'subscriptionRoutes.js',
    category: 'feature',
    feature: 'subscription',
    targetPath: 'src/features/subscription/lib/subscriptionRoutes.js',
    reason: 'Subscription routing logic'
  },
  
  // Organization-related utilities
  {
    file: 'organizationHelper.ts',
    category: 'entity',
    entity: 'organization',
    targetPath: 'src/entities/organization/lib/organizationHelper.ts',
    reason: 'Organization helper functions'
  },
  
  // Salary/employability utilities
  {
    file: 'salaryFormatter.js',
    category: 'shared',
    targetPath: 'src/shared/lib/salaryFormatter.js',
    reason: 'Generic salary formatting utility'
  },
  {
    file: '__tests__/salaryFormatter.test.js',
    category: 'shared',
    targetPath: 'src/shared/lib/__tests__/salaryFormatter.test.js',
    reason: 'Salary formatter tests'
  },
  {
    file: 'employabilityCalculator.js',
    category: 'feature',
    feature: 'assessment',
    targetPath: 'src/features/assessment/lib/employabilityCalculator.js',
    reason: 'Employability calculation for assessments'
  },
  {
    file: 'employabilityCalculator.test.js',
    category: 'feature',
    feature: 'assessment',
    targetPath: 'src/features/assessment/lib/__tests__/employabilityCalculator.test.js',
    reason: 'Employability calculator tests'
  },
  
  // Routing utilities
  {
    file: 'roleBasedRouter.ts',
    category: 'shared',
    targetPath: 'src/shared/lib/roleBasedRouter.ts',
    reason: 'Generic role-based routing used across app'
  },
  {
    file: '__tests__/roleBasedRouter.test.ts',
    category: 'shared',
    targetPath: 'src/shared/lib/__tests__/roleBasedRouter.test.ts',
    reason: 'Role-based router tests'
  },
  {
    file: 'pagesUrl.ts',
    category: 'shared',
    targetPath: 'src/shared/lib/pagesUrl.ts',
    reason: 'Generic page URL utilities'
  },
  
  // Validation utilities
  {
    file: 'fileValidation.ts',
    category: 'shared',
    targetPath: 'src/shared/lib/fileValidation.ts',
    reason: 'Generic file validation'
  },
  {
    file: 'isbnValidator.ts',
    category: 'shared',
    targetPath: 'src/shared/lib/isbnValidator.ts',
    reason: 'Generic ISBN validation'
  },
  {
    file: 'teacherValidation.ts',
    category: 'entity',
    entity: 'user',
    targetPath: 'src/entities/user/lib/teacherValidation.ts',
    reason: 'Teacher user validation'
  },
  {
    file: 'timetableValidation.ts',
    category: 'feature',
    feature: 'courses',
    targetPath: 'src/features/courses/lib/timetableValidation.ts',
    reason: 'Course timetable validation'
  },
  
  // Generic shared utilities
  {
    file: 'helpers.js',
    category: 'shared',
    targetPath: 'src/shared/lib/helpers.js',
    reason: 'Generic helper functions'
  },
  {
    file: 'cn.ts',
    category: 'shared',
    targetPath: 'src/shared/lib/cn.ts',
    reason: 'Generic className utility (already exists in shared/lib)'
  },
  {
    file: 'timeFormat.js',
    category: 'shared',
    targetPath: 'src/shared/lib/timeFormat.js',
    reason: 'Generic time formatting'
  },
  {
    file: 'constants.js',
    category: 'shared',
    targetPath: 'src/shared/config/constants.js',
    reason: 'Application constants'
  },
  
  // Upload utilities
  {
    file: 'cloudflareR2Upload.ts',
    category: 'shared',
    targetPath: 'src/shared/lib/cloudflareR2Upload.ts',
    reason: 'Generic file upload to Cloudflare R2'
  },
  
  // Chart utilities
  {
    file: 'chartDownload.ts',
    category: 'shared',
    targetPath: 'src/shared/lib/chartDownload.ts',
    reason: 'Generic chart download utility'
  },
  
  // Activity tracking
  {
    file: 'activityTracker.ts',
    category: 'shared',
    targetPath: 'src/shared/lib/activityTracker.ts',
    reason: 'Generic activity tracking'
  },
  
  // Education search
  {
    file: 'educationSearch.js',
    category: 'shared',
    targetPath: 'src/shared/lib/educationSearch.js',
    reason: 'Generic education search utility'
  },
  
  // Entity content
  {
    file: 'getEntityContent.js',
    category: 'shared',
    targetPath: 'src/shared/lib/getEntityContent.js',
    reason: 'Generic entity content retrieval'
  },
  
  // Fingerprinting
  {
    file: 'fingerprint.ts',
    category: 'shared',
    targetPath: 'src/shared/lib/fingerprint.ts',
    reason: 'Generic browser fingerprinting'
  },
  
  // Vector utilities
  {
    file: 'vectorUtils.js',
    category: 'shared',
    targetPath: 'src/shared/lib/vectorUtils.js',
    reason: 'Generic vector math utilities'
  },
  
  // Versioning
  {
    file: 'versioningHelper.js',
    category: 'shared',
    targetPath: 'src/shared/lib/versioningHelper.js',
    reason: 'Generic versioning helper'
  },
  
  // Settings error handler
  {
    file: 'settingsErrorHandler.js',
    category: 'shared',
    targetPath: 'src/shared/lib/settingsErrorHandler.js',
    reason: 'Generic settings error handling'
  },
  
  // Mock data generator
  {
    file: 'mockDataGenerator.ts',
    category: 'shared',
    targetPath: 'src/shared/lib/mockDataGenerator.ts',
    reason: 'Generic mock data generation for testing'
  },
  
  // Recharts warnings suppression
  {
    file: 'suppressRechartsWarnings.js',
    category: 'shared',
    targetPath: 'src/shared/lib/suppressRechartsWarnings.js',
    reason: 'Generic Recharts warning suppression'
  },
  
  // Debug utilities
  {
    file: 'debugRecentUpdates.js',
    category: 'shared',
    targetPath: 'src/shared/lib/debug/debugRecentUpdates.js',
    reason: 'Debug utility'
  },
  {
    file: 'debugSupabase.js',
    category: 'shared',
    targetPath: 'src/shared/lib/debug/debugSupabase.js',
    reason: 'Debug utility for Supabase'
  },
  {
    file: 'simpleDebug.js',
    category: 'shared',
    targetPath: 'src/shared/lib/debug/simpleDebug.js',
    reason: 'Simple debug utility'
  },
  {
    file: 'queryLogger.js',
    category: 'shared',
    targetPath: 'src/shared/lib/debug/queryLogger.js',
    reason: 'Query logging debug utility'
  },
  
  // Test utilities
  {
    file: 'setupTestData.js',
    category: 'shared',
    targetPath: 'src/shared/lib/test/setupTestData.js',
    reason: 'Test data setup utility'
  },
  {
    file: 'testRecentUpdates.js',
    category: 'shared',
    targetPath: 'src/shared/lib/test/testRecentUpdates.js',
    reason: 'Test utility'
  },
  
  // Data migration utilities (should stay in utils or move to migration)
  {
    file: 'dataMigration.js',
    category: 'shared',
    targetPath: 'src/migration/utils/dataMigration.js',
    reason: 'Data migration utility - keep in migration folder'
  },
  {
    file: 'dataMigrationAdapted.js',
    category: 'shared',
    targetPath: 'src/migration/utils/dataMigrationAdapted.js',
    reason: 'Data migration utility - keep in migration folder'
  },
  
  // API utility (needs inspection)
  {
    file: 'api.js',
    category: 'shared',
    targetPath: 'src/shared/api/api.js',
    reason: 'Generic API utility'
  },
  
  // Supabase client (should already be in shared/api)
  {
    file: 'supabase.ts',
    category: 'shared',
    targetPath: 'src/shared/api/supabase.ts',
    reason: 'Supabase client - already exists in shared/api'
  }
];

// Generate report
console.log('=== Utility Files Classification Report ===\n');

const byCategory = {
  feature: classifications.filter(c => c.category === 'feature'),
  entity: classifications.filter(c => c.category === 'entity'),
  shared: classifications.filter(c => c.category === 'shared')
};

console.log(`Total files to migrate: ${classifications.length}\n`);

console.log(`Feature-specific utilities: ${byCategory.feature.length}`);
byCategory.feature.forEach(c => {
  console.log(`  - ${c.file} → ${c.targetPath}`);
  console.log(`    Reason: ${c.reason}`);
});

console.log(`\nEntity-specific utilities: ${byCategory.entity.length}`);
byCategory.entity.forEach(c => {
  console.log(`  - ${c.file} → ${c.targetPath}`);
  console.log(`    Reason: ${c.reason}`);
});

console.log(`\nShared utilities: ${byCategory.shared.length}`);
byCategory.shared.forEach(c => {
  console.log(`  - ${c.file} → ${c.targetPath}`);
  console.log(`    Reason: ${c.reason}`);
});

// Export for use by migration script
export { classifications, type UtilClassification };
