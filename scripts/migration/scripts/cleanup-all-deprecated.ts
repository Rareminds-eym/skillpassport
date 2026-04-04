import { CleanupSystem } from '../cleanup/CleanupSystem';
import { DeprecatedAnalyzer } from '../cleanup/DeprecatedAnalyzer';
import * as fs from 'fs';
import * as path from 'path';

interface DirectoryCleanupResult {
  directory: string;
  filesDeleted: number;
  spaceSaved: number;
  errors: number;
  backupId?: string;
}

async function cleanupAllDeprecatedDirectories() {
  console.log('=== Starting Cleanup of All Deprecated Directories ===\n');

  const directories = [
    'src/services',
    'src/hooks',
    'src/utils',
    'src/context'
  ];

  const analyzer = new DeprecatedAnalyzer();
  const cleanupSystem = new CleanupSystem();
  const results: DirectoryCleanupResult[] = [];

  try {
    // Step 1: Analyze all deprecated directories
    console.log('Step 1: Analyzing all deprecated directories...\n');
    const analysis = await analyzer.analyzeDeprecatedStructure();

    for (const dir of directories) {
      console.log(`\n--- Analyzing ${dir} ---`);
      
      const dirAnalysis = analysis.deprecatedDirectories.find(d => d.path === dir);
      
      if (!dirAnalysis) {
        console.log(`  Directory not found or already cleaned up.`);
        continue;
      }

      console.log(`  Total files: ${dirAnalysis.files.length}`);
      console.log(`  Orphaned: ${dirAnalysis.orphanedCount}`);
      console.log(`  Active: ${dirAnalysis.activeCount}`);
      console.log(`  Size: ${(dirAnalysis.totalSize / 1024 / 1024).toFixed(2)} MB`);

      // Report blockers
      const blockers = dirAnalysis.files.filter(f => !f.isOrphaned);
      if (blockers.length > 0) {
        console.log(`\n  ⚠️  ${blockers.length} files have active references:`);
        blockers.slice(0, 5).forEach(file => {
          console.log(`    - ${path.basename(file.path)} (${file.activeImports.length} refs)`);
        });
        if (blockers.length > 5) {
          console.log(`    ... and ${blockers.length - 5} more`);
        }
      }
    }

    // Step 2: Create cleanup plan
    console.log('\n\nStep 2: Creating cleanup plan...');
    const cleanupPlan = await cleanupSystem.createCleanupPlan(analysis);
    
    console.log(`\nTotal files to delete: ${cleanupPlan.filesToDelete.length}`);
    console.log(`Directories to remove: ${cleanupPlan.directoriesToRemove.length}`);
    console.log(`Estimated space to save: ${(cleanupPlan.estimatedSpaceSaved / 1024 / 1024).toFixed(2)} MB`);

    if (cleanupPlan.filesToDelete.length === 0) {
      console.log('\n⚠️  No files are safe to delete at this time.');
      console.log('All files have active references and must be migrated first.');
      return;
    }

    // Step 3: Perform cleanup for each directory
    console.log('\n\nStep 3: Performing cleanup with backups...\n');

    for (const dir of directories) {
      const dirFiles = cleanupPlan.filesToDelete.filter(f => f.startsWith(dir + '/'));
      
      if (dirFiles.length === 0) {
        console.log(`${dir}: No files to delete`);
        continue;
      }

      console.log(`\nCleaning ${dir}...`);
      
      const dirPlan = {
        filesToDelete: dirFiles,
        directoriesToRemove: cleanupPlan.directoriesToRemove.filter(d => d === dir),
        backupRequired: true,
        estimatedSpaceSaved: 0
      };

      const result = await cleanupSystem.performCleanup(dirPlan);
      
      results.push({
        directory: dir,
        filesDeleted: result.filesDeleted.length,
        spaceSaved: result.spaceSaved,
        errors: result.errors.length,
        backupId: result.backupId
      });

      console.log(`  ✓ Deleted ${result.filesDeleted.length} files`);
      console.log(`  ✓ Saved ${(result.spaceSaved / 1024 / 1024).toFixed(2)} MB`);
      if (result.backupId) {
        console.log(`  ✓ Backup: ${result.backupId}`);
      }
      if (result.errors.length > 0) {
        console.log(`  ⚠️  ${result.errors.length} errors occurred`);
      }
    }

    // Step 4: Remove empty directories
    console.log('\n\nStep 4: Removing empty directories...');
    for (const dir of cleanupPlan.directoriesToRemove) {
      const fullPath = path.join(process.cwd(), dir);
      if (fs.existsSync(fullPath)) {
        try {
          await removeEmptyDirectoriesRecursive(fullPath);
          console.log(`  ✓ Removed ${dir}`);
        } catch (error) {
          console.log(`  ⚠️  Failed to remove ${dir}: ${error}`);
        }
      }
    }

    // Step 5: Display summary
    console.log('\n\n=== Cleanup Summary ===\n');
    
    let totalDeleted = 0;
    let totalSaved = 0;
    let totalErrors = 0;

    results.forEach(result => {
      totalDeleted += result.filesDeleted;
      totalSaved += result.spaceSaved;
      totalErrors += result.errors;
      
      console.log(`${result.directory}:`);
      console.log(`  Files deleted: ${result.filesDeleted}`);
      console.log(`  Space saved: ${(result.spaceSaved / 1024 / 1024).toFixed(2)} MB`);
      if (result.backupId) {
        console.log(`  Backup ID: ${result.backupId}`);
      }
    });

    console.log(`\nTotal:`);
    console.log(`  Files deleted: ${totalDeleted}`);
    console.log(`  Space saved: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Errors: ${totalErrors}`);

    // Save summary
    const summaryPath = path.join(process.cwd(), 'migration-reports', 'cleanup-summary.json');
    fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
    fs.writeFileSync(summaryPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      results,
      totals: {
        filesDeleted: totalDeleted,
        spaceSaved: totalSaved,
        errors: totalErrors
      }
    }, null, 2));

    console.log(`\nSummary saved to: ${summaryPath}`);

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    throw error;
  }
}

async function removeEmptyDirectoriesRecursive(dirPath: string): Promise<void> {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  // Recursively remove subdirectories first
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subPath = path.join(dirPath, entry.name);
      await removeEmptyDirectoriesRecursive(subPath);
    }
  }

  // Check if directory is now empty
  const remainingEntries = fs.readdirSync(dirPath);
  if (remainingEntries.length === 0) {
    fs.rmdirSync(dirPath);
  }
}

// Run if executed directly
if (require.main === module) {
  cleanupAllDeprecatedDirectories()
    .then(() => {
      console.log('\n✓ Cleanup completed successfully.');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Cleanup failed:', error);
      process.exit(1);
    });
}

export { cleanupAllDeprecatedDirectories };
