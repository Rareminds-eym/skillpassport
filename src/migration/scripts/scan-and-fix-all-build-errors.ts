import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { glob } from 'glob';

interface ErrorPattern {
  file: string;
  missingPath: string;
}

async function runBuildAndCaptureErrors(): Promise<ErrorPattern[]> {
  console.log('🔍 Running build to capture all errors...\n');
  
  try {
    execSync('npm run build', { stdio: 'pipe', encoding: 'utf-8' });
    return [];
  } catch (error: any) {
    const output = error.stdout + error.stderr;
    const errors: ErrorPattern[] = [];
    
    // Parse "Could not load X (imported by Y)" errors
    const regex = /Could not load [^\(]+\(imported by ([^\)]+)\)/g;
    const matches = output.matchAll(regex);
    
    for (const match of matches) {
      const file = match[1].replace(/\\/g, '/');
      errors.push({ file, missingPath: '' });
    }
    
    // Also parse the path that couldn't be loaded
    const pathRegex = /Could not load\s+([^\s]+)\s+\(imported/g;
    const pathMatches = output.matchAll(pathRegex);
    let i = 0;
    for (const match of pathMatches) {
      if (errors[i]) {
        errors[i].missingPath = match[1];
      }
      i++;
    }
    
    return errors;
  }
}

async function findCorrectPath(missingPath: string): Promise<string | null> {
  // Extract the module name from the path
  const parts = missingPath.split('/');
  const fileName = parts[parts.length - 1];
  
  // Search for the file in the codebase
  const patterns = [
    `src/**/${fileName}.ts`,
    `src/**/${fileName}.tsx`,
    `src/**/${fileName}.js`,
    `src/**/${fileName}.jsx`
  ];
  
  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      ignore: ['**/node_modules/**', '**/dist/**', '**/.migration-backups/**']
    });
    
    if (matches.length > 0) {
      // Convert to alias path
      const match = matches[0].replace(/\\/g, '/');
      return '@/' + match.replace('src/', '').replace(/\.(ts|tsx|js|jsx)$/, '');
    }
  }
  
  return null;
}

async function fixImportInFile(file: string, oldImport: string, newImport: string): Promise<boolean> {
  try {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Try to find and replace the import
    const patterns = [
      new RegExp(`from ['"]${oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g'),
      new RegExp(`from ['"]${oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.js['"]`, 'g'),
      new RegExp(`from ['"]${oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.ts['"]`, 'g')
    ];
    
    let updated = content;
    let changed = false;
    
    for (const pattern of patterns) {
      if (pattern.test(updated)) {
        updated = updated.replace(pattern, `from "${newImport}"`);
        changed = true;
        break;
      }
    }
    
    if (changed) {
      fs.writeFileSync(file, updated, 'utf-8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error fixing ${file}:`, error.message);
    return false;
  }
}

async function main(): Promise<void> {
  console.log('🔧 Comprehensive Build Error Scanner and Fixer\n');
  console.log('='.repeat(60));
  
  const errors = await runBuildAndCaptureErrors();
  
  if (errors.length === 0) {
    console.log('\n✅ No build errors found!');
    return;
  }
  
  console.log(`\n📋 Found ${errors.length} import errors\n`);
  
  let fixedCount = 0;
  
  for (const error of errors) {
    console.log(`\n🔍 Analyzing: ${error.file}`);
    console.log(`   Missing: ${error.missingPath}`);
    
    const correctPath = await findCorrectPath(error.missingPath);
    
    if (correctPath) {
      console.log(`   ✓ Found: ${correctPath}`);
      
      const fixed = await fixImportInFile(error.file, error.missingPath, correctPath);
      if (fixed) {
        console.log(`   ✓ Fixed import`);
        fixedCount++;
      } else {
        console.log(`   ✗ Could not fix import`);
      }
    } else {
      console.log(`   ✗ Could not find correct path`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`   Total errors: ${errors.length}`);
  console.log(`   Fixed: ${fixedCount}`);
  console.log(`   Remaining: ${errors.length - fixedCount}`);
  
  if (fixedCount > 0) {
    console.log('\n✅ Run build again to check for remaining errors');
  }
}

main().catch(console.error);
