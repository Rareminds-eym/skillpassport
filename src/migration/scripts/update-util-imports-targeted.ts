import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const dryRun = process.argv.includes('--dry-run');

// Specific import mappings based on grep results
const importMappings = [
  { old: '@/utils/queryLogger', new: '@/shared/lib/debug/queryLogger' },
  { old: '@/utils/getEntityContent', new: '@/shared/lib/getEntityContent' },
  { old: '@/utils/studentType', new: '@/entities/student/lib/studentType' },
  { old: '@/utils/pagesUrl', new: '@/shared/lib/pagesUrl' },
  { old: '@/utils/vectorUtils', new: '@/shared/lib/vectorUtils' },
  { old: '@/utils/supabase', new: '@/shared/api/supabase' },
  { old: '@/utils/salaryFormatter', new: '@/shared/lib/salaryFormatter' },
  { old: '@/utils/assessmentDataNormalizer', new: '@/features/assessment/lib/assessmentDataNormalizer' },
  { old: '@/utils/educationSearch', new: '@/shared/lib/educationSearch' },
  { old: '@/utils/subscriptionHelpers', new: '@/features/subscription/lib/subscriptionHelpers' },
  { old: '@/utils/subscriptionRoutes', new: '@/features/subscription/lib/subscriptionRoutes' },
  { old: '@/utils/tokenMonitor', new: '@/features/auth/lib/tokenMonitor' },
  { old: '@/utils/authCleanup', new: '@/features/auth/lib/authCleanup' },
  { old: '@/utils/authErrorHandler', new: '@/features/auth/lib/authErrorHandler' },
  { old: '@/utils/tokenRefreshErrorHandler', new: '@/features/auth/lib/tokenRefreshErrorHandler' },
  { old: '@/utils/refreshCoordinator', new: '@/features/auth/lib/refreshCoordinator' },
  { old: '@/utils/studentExportUtils', new: '@/features/student-profile/lib/studentExportUtils' },
  { old: '@/utils/profileCompletenessChecker', new: '@/features/student-profile/lib/profileCompletenessChecker' },
  { old: '@/utils/profilePromptPreference', new: '@/features/student-profile/lib/profilePromptPreference' },
  { old: '@/utils/profileToast', new: '@/features/student-profile/lib/profileToast' },
  { old: '@/utils/profileToastExamples', new: '@/features/student-profile/lib/profileToastExamples' },
  { old: '@/utils/exportppUtils', new: '@/features/digital-portfolio/lib/exportppUtils' },
  { old: '@/utils/employabilityCalculator', new: '@/features/assessment/lib/employabilityCalculator' },
  { old: '@/utils/timetableValidation', new: '@/features/courses/lib/timetableValidation' },
  { old: '@/utils/realStudentDataService', new: '@/entities/student/api/realStudentDataService' },
  { old: '@/utils/organizationHelper', new: '@/entities/organization/lib/organizationHelper' },
  { old: '@/utils/teacherValidation', new: '@/entities/user/lib/teacherValidation' },
  { old: '@/utils/exportUtils', new: '@/shared/lib/exportUtils' },
  { old: '@/utils/roleBasedRouter', new: '@/shared/lib/roleBasedRouter' },
  { old: '@/utils/fileValidation', new: '@/shared/lib/fileValidation' },
  { old: '@/utils/isbnValidator', new: '@/shared/lib/isbnValidator' },
  { old: '@/utils/helpers', new: '@/shared/lib/helpers' },
  { old: '@/utils/cn', new: '@/shared/lib/cn' },
  { old: '@/utils/timeFormat', new: '@/shared/lib/timeFormat' },
  { old: '@/utils/constants', new: '@/shared/config/constants' },
  { old: '@/utils/cloudflareR2Upload', new: '@/shared/lib/cloudflareR2Upload' },
  { old: '@/utils/chartDownload', new: '@/shared/lib/chartDownload' },
  { old: '@/utils/activityTracker', new: '@/shared/lib/activityTracker' },
  { old: '@/utils/fingerprint', new: '@/shared/lib/fingerprint' },
  { old: '@/utils/versioningHelper', new: '@/shared/lib/versioningHelper' },
  { old: '@/utils/settingsErrorHandler', new: '@/shared/lib/settingsErrorHandler' },
  { old: '@/utils/mockDataGenerator', new: '@/shared/lib/mockDataGenerator' },
  { old: '@/utils/suppressRechartsWarnings', new: '@/shared/lib/suppressRechartsWarnings' },
  { old: '@/utils/debugRecentUpdates', new: '@/shared/lib/debug/debugRecentUpdates' },
  { old: '@/utils/debugSupabase', new: '@/shared/lib/debug/debugSupabase' },
  { old: '@/utils/simpleDebug', new: '@/shared/lib/debug/simpleDebug' },
  { old: '@/utils/setupTestData', new: '@/shared/lib/test/setupTestData' },
  { old: '@/utils/testRecentUpdates', new: '@/shared/lib/test/testRecentUpdates' },
  { old: '@/utils/dataMigration', new: '@/migration/utils/dataMigration' },
  { old: '@/utils/dataMigrationAdapted', new: '@/migration/utils/dataMigrationAdapted' },
  { old: '@/utils/api', new: '@/shared/api/api' },
];

function updateImportsInFile(filePath: string): { updated: boolean; changes: number } {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    return { updated: false, changes: 0 };
  }
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  const originalContent = content;
  let changes = 0;
  
  for (const mapping of importMappings) {
    // Escape special regex characters
    const escapedOld = mapping.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Match various import patterns
    const patterns = [
      new RegExp(`from ['"]${escapedOld}['"]`, 'g'),
      new RegExp(`import\\(['"]${escapedOld}['"]\\)`, 'g'),
      new RegExp(`require\\(['"]${escapedOld}['"]\\)`, 'g'),
    ];
    
    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        changes += matches.length;
        content = content.replace(pattern, (match) => {
          return match.replace(mapping.old, mapping.new);
        });
      }
    });
  }
  
  if (content !== originalContent) {
    if (!dryRun) {
      fs.writeFileSync(fullPath, content, 'utf-8');
    }
    return { updated: true, changes };
  }
  
  return { updated: false, changes: 0 };
}

console.log('=== Updating Utility Import Paths ===\n');
console.log(dryRun ? '[DRY RUN MODE]\n' : '');

// Find all source files
console.log('Finding source files...');
const output = execSync(
  'git ls-files "src/**/*.{ts,tsx,js,jsx}"',
  { encoding: 'utf-8', cwd: process.cwd() }
);
const sourceFiles = output.trim().split('\n').filter(Boolean);
console.log(`Found ${sourceFiles.length} source files\n`);

console.log('Updating imports...');
let filesUpdated = 0;
let totalChanges = 0;
const updatedFiles: string[] = [];

sourceFiles.forEach((file) => {
  const result = updateImportsInFile(file);
  if (result.updated) {
    filesUpdated++;
    totalChanges += result.changes;
    updatedFiles.push(file);
    console.log(`  ✓ Updated ${file} (${result.changes} imports)`);
  }
});

console.log('\n=== Import Update Summary ===');
console.log(`Files scanned: ${sourceFiles.length}`);
console.log(`Files updated: ${filesUpdated}`);
console.log(`Total import changes: ${totalChanges}`);

if (updatedFiles.length > 0) {
  console.log('\nUpdated files:');
  updatedFiles.forEach(f => console.log(`  - ${f}`));
}

if (dryRun) {
  console.log('\n[DRY RUN] No files were actually modified');
} else {
  console.log('\n✓ Import paths updated!');
}

console.log('\nNext steps:');
console.log('1. Verify no @/utils/ imports remain: git grep "@/utils/"');
console.log('2. Check TypeScript compilation: npm run build');
console.log('3. Run tests: npm test');
