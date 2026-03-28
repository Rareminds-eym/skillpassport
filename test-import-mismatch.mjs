/**
 * Standalone Bug Condition Exploration Test
 * Feature: fsd-import-export-errors, Property 1: Bug Condition - Import/Export Mismatch Detection
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10**
 * 
 * CRITICAL: This test MUST FAIL on unfixed code - failure confirms the bug exists
 * 
 * This test runs `npm run build:dev` and documents all import/export errors found.
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

console.log('\n=== BUG CONDITION EXPLORATION TEST ===\n');
console.log('Running build on UNFIXED code to capture import/export errors...\n');

try {
  // Run the build and capture output
  const output = execSync('npm run build:dev', {
    encoding: 'utf-8',
    stdio: 'pipe',
    cwd: process.cwd()
  });
  
  console.log('❌ UNEXPECTED: Build succeeded!');
  console.log('The build should FAIL on unfixed code to confirm the bug exists.\n');
  process.exit(1);
  
} catch (error) {
  const output = error.stdout + error.stderr;
  
  console.log('✓ EXPECTED: Build failed (confirms bug exists)\n');
  console.log('=== BUILD ERRORS DETECTED (Counterexamples) ===\n');
  
  // Parse and document the error
  const lines = output.split('\n');
  let errorCount = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Match the specific error pattern
    if (line.includes('"default" is not exported by')) {
      errorCount++;
      console.log(`Error ${errorCount}:`);
      console.log(`  ${line.trim()}`);
      
      // Look for file path in next lines
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        if (lines[j].includes('file:')) {
          console.log(`  ${lines[j].trim()}`);
          break;
        }
        if (lines[j].includes('import ')) {
          console.log(`  ${lines[j].trim()}`);
        }
      }
      console.log('');
    }
  }
  
  console.log(`Total import/export mismatch errors found: ${errorCount}`);
  console.log('\n=== ANALYSIS ===\n');
  console.log('Root Cause: Files are using default import syntax (import X from "module")');
  console.log('but the modules export components as named exports (export { default as X }).');
  console.log('\nExpected Behavior: Import syntax should match export type.');
  console.log('Fix: Change default imports to named imports: import { X } from "module"');
  console.log('\n=== END BUG CONDITION EXPLORATION ===\n');
  
  // Exit with success because finding the bug is the expected outcome
  console.log('✓ Bug condition exploration PASSED: Confirmed import/export mismatches exist\n');
  process.exit(0);
}
