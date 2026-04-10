/**
 * Bug Verification Script
 * 
 * This script analyzes the source files to confirm the missing import bugs exist.
 * It reads the files and checks for usage of variables without proper imports.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n=== Bug Condition Exploration ===\n');

// Test Case 1: BrowseCourses.jsx - Missing logger import
console.log('Test Case 1: BrowseCourses.jsx');
console.log('─'.repeat(50));

const browseCoursesPath = path.join(process.cwd(), 'src/pages/admin/schoolAdmin/BrowseCourses.jsx');
const browseCoursesContent = fs.readFileSync(browseCoursesPath, 'utf-8');

const usesLogger = browseCoursesContent.includes('logger.info') || browseCoursesContent.includes('logger.error');
const hasLoggerImport = browseCoursesContent.includes('import { getLogger }') || 
                       browseCoursesContent.includes('from \'@/shared/config/logging\'');
const hasLoggerInit = browseCoursesContent.includes('const logger = getLogger(');

console.log(`Uses logger: ${usesLogger}`);
console.log(`Has logger import: ${hasLoggerImport}`);
console.log(`Has logger initialization: ${hasLoggerInit}`);

if (usesLogger && !hasLoggerImport) {
  console.log('\n🔴 COUNTEREXAMPLE FOUND!');
  console.log('Bug: logger is used but not imported');
  console.log('Lines: 70 (logger.info), 81 (logger.error)');
  console.log('Expected runtime error: ReferenceError: logger is not defined');
} else if (usesLogger && hasLoggerImport && hasLoggerInit) {
  console.log('\n✅ Bug is FIXED - logger is properly imported and initialized');
} else {
  console.log('\n⚠️  Unexpected state');
}

// Test Case 2: Assessments.tsx - Missing useIsAuthenticated import
console.log('\n\nTest Case 2: Assessments.tsx');
console.log('─'.repeat(50));

const assessmentsPath = path.join(process.cwd(), 'src/pages/educator/Assessments.tsx');
const assessmentsContent = fs.readFileSync(assessmentsPath, 'utf-8');

const usesUseIsAuthenticated = assessmentsContent.includes('useIsAuthenticated()') || 
                               assessmentsContent.includes('const isAuthenticated = useIsAuthenticated');

// Check if useIsAuthenticated is in the import statement from @/stores
const importMatch = assessmentsContent.match(/import\s+{[^}]*}\s+from\s+['"]@\/stores['"]/g);
let hasCorrectImport = false;

if (importMatch) {
  hasCorrectImport = importMatch.some(imp => imp.includes('useIsAuthenticated'));
  console.log(`Import statement(s) from @/stores:`);
  importMatch.forEach(imp => console.log(`  ${imp}`));
}

console.log(`\nUses useIsAuthenticated: ${usesUseIsAuthenticated}`);
console.log(`Has useIsAuthenticated import: ${hasCorrectImport}`);

if (usesUseIsAuthenticated && !hasCorrectImport) {
  console.log('\n🔴 COUNTEREXAMPLE FOUND!');
  console.log('Bug: useIsAuthenticated is used but not imported');
  console.log('Line: 208 (const isAuthenticated = useIsAuthenticated())');
  console.log('Expected runtime error: ReferenceError: useIsAuthenticated is not defined');
} else if (usesUseIsAuthenticated && hasCorrectImport) {
  console.log('\n✅ Bug is FIXED - useIsAuthenticated is properly imported');
} else {
  console.log('\n⚠️  Unexpected state');
}

console.log('\n' + '='.repeat(50));
console.log('Bug Exploration Complete');
console.log('='.repeat(50) + '\n');

// Exit with error code if bugs are found (test should fail on unfixed code)
const bugsFound = (usesLogger && !hasLoggerImport) || (usesUseIsAuthenticated && !hasCorrectImport);
process.exit(bugsFound ? 1 : 0);
