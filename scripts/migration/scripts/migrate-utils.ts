import * as fs from 'fs';
import * as path from 'path';
import { classifications } from './classify-utils';

const dryRun = process.argv.includes('--dry-run');

interface MigrationResult {
  success: boolean;
  file: string;
  from: string;
  to: string;
  error?: string;
}

const results: MigrationResult[] = [];

// Ensure directory exists
function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`  Created directory: ${dirPath}`);
  }
}

// Move file from source to target
function migrateFile(sourceFile: string, targetPath: string): MigrationResult {
  const sourcePath = path.join(process.cwd(), 'src/utils', sourceFile);
  const targetFullPath = path.join(process.cwd(), targetPath);
  
  try {
    // Check if source exists
    if (!fs.existsSync(sourcePath)) {
      return {
        success: false,
        file: sourceFile,
        from: sourcePath,
        to: targetFullPath,
        error: 'Source file does not exist'
      };
    }
    
    // Check if target already exists
    if (fs.existsSync(targetFullPath)) {
      console.log(`  ⚠️  Target already exists: ${targetFullPath}`);
      return {
        success: true,
        file: sourceFile,
        from: sourcePath,
        to: targetFullPath,
        error: 'Target already exists - skipping'
      };
    }
    
    if (dryRun) {
      console.log(`  [DRY RUN] Would move: ${sourcePath} → ${targetFullPath}`);
      return {
        success: true,
        file: sourceFile,
        from: sourcePath,
        to: targetFullPath
      };
    }
    
    // Ensure target directory exists
    const targetDir = path.dirname(targetFullPath);
    ensureDir(targetDir);
    
    // Copy file
    fs.copyFileSync(sourcePath, targetFullPath);
    
    // Delete source
    fs.unlinkSync(sourcePath);
    
    console.log(`  ✓ Migrated: ${sourceFile} → ${targetPath}`);
    
    return {
      success: true,
      file: sourceFile,
      from: sourcePath,
      to: targetFullPath
    };
  } catch (error) {
    return {
      success: false,
      file: sourceFile,
      from: sourcePath,
      to: targetFullPath,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Main migration
console.log('=== Utility Files Migration ===\n');
console.log(dryRun ? '[DRY RUN MODE - No files will be moved]\n' : '');

console.log('Migrating feature-specific utilities...');
const featureUtils = classifications.filter(c => c.category === 'feature');
featureUtils.forEach(util => {
  const result = migrateFile(util.file, util.targetPath);
  results.push(result);
});

console.log('\nMigrating entity-specific utilities...');
const entityUtils = classifications.filter(c => c.category === 'entity');
entityUtils.forEach(util => {
  const result = migrateFile(util.file, util.targetPath);
  results.push(result);
});

console.log('\nMigrating shared utilities...');
const sharedUtils = classifications.filter(c => c.category === 'shared');
sharedUtils.forEach(util => {
  const result = migrateFile(util.file, util.targetPath);
  results.push(result);
});

// Summary
console.log('\n=== Migration Summary ===');
const successful = results.filter(r => r.success && !r.error);
const skipped = results.filter(r => r.success && r.error);
const failed = results.filter(r => !r.success);

console.log(`Total files: ${results.length}`);
console.log(`Successful: ${successful.length}`);
console.log(`Skipped (already exist): ${skipped.length}`);
console.log(`Failed: ${failed.length}`);

if (failed.length > 0) {
  console.log('\nFailed migrations:');
  failed.forEach(f => {
    console.log(`  - ${f.file}: ${f.error}`);
  });
}

if (skipped.length > 0) {
  console.log('\nSkipped files (already exist):');
  skipped.forEach(s => {
    console.log(`  - ${s.file}`);
  });
}

console.log('\n✓ File migration complete!');
console.log('\nNext steps:');
console.log('1. Run: npx tsx src/migration/scripts/update-util-imports.ts');
console.log('2. Verify TypeScript compilation: npm run build');
console.log('3. Run tests: npm test');
