import { CleanupSystem } from '../cleanup/CleanupSystem';
import { DeprecatedAnalyzer } from '../cleanup/DeprecatedAnalyzer';
import * as fs from 'fs';
import * as path from 'path';

async function cleanupComponentsDirectory() {
  console.log('=== Starting /components/ Directory Cleanup ===\n');

  const analyzer = new DeprecatedAnalyzer();
  const cleanupSystem = new CleanupSystem();

  try {
    // Step 1: Analyze the deprecated structure
    console.log('Step 1: Analyzing deprecated /components/ directory...');
    const analysis = await analyzer.analyzeDeprecatedStructure();
    
    // Filter for components directory only
    const componentsAnalysis = analysis.deprecatedDirectories.find(
      dir => dir.path === 'src/components'
    );

    if (!componentsAnalysis) {
      console.log('No /components/ directory found or already cleaned up.');
      return;
    }

    console.log(`\nFound ${componentsAnalysis.files.length} files in /components/`);
    console.log(`  - Orphaned (safe to delete): ${componentsAnalysis.orphanedCount}`);
    console.log(`  - Active (requires review): ${componentsAnalysis.activeCount}`);
    console.log(`  - Total size: ${(componentsAnalysis.totalSize / 1024 / 1024).toFixed(2)} MB\n`);

    // Step 2: Generate detailed report
    console.log('Step 2: Generating analysis report...');
    const report = analyzer.generateAnalysisReport(analysis);
    
    // Save report to file
    const reportPath = path.join(process.cwd(), 'migration-reports', 'components-cleanup-analysis.txt');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, report);
    console.log(`Analysis report saved to: ${reportPath}\n`);

    // Step 3: Identify blockers
    const blockers = componentsAnalysis.files.filter(f => !f.isOrphaned);
    if (blockers.length > 0) {
      console.log('Step 3: Migration Blockers Found');
      console.log(`\n${blockers.length} files have active references and cannot be deleted:\n`);
      
      blockers.slice(0, 10).forEach(file => {
        console.log(`  ${file.path}`);
        console.log(`    Referenced by: ${file.activeImports.slice(0, 3).join(', ')}`);
        if (file.activeImports.length > 3) {
          console.log(`    ... and ${file.activeImports.length - 3} more`);
        }
      });

      if (blockers.length > 10) {
        console.log(`  ... and ${blockers.length - 10} more files`);
      }

      console.log('\nThese files must be migrated to FSD structure before cleanup can proceed.');
    }

    // Step 4: Create cleanup plan
    console.log('\nStep 4: Creating cleanup plan...');
    const cleanupPlan = await cleanupSystem.createCleanupPlan(analysis);
    
    // Filter plan for components directory only
    const componentsFilesToDelete = cleanupPlan.filesToDelete.filter(
      file => file.startsWith('src/components/')
    );

    console.log(`Files to delete: ${componentsFilesToDelete.length}`);
    console.log(`Estimated space to save: ${(cleanupPlan.estimatedSpaceSaved / 1024 / 1024).toFixed(2)} MB`);

    if (componentsFilesToDelete.length === 0) {
      console.log('\nNo files are safe to delete at this time.');
      console.log('All files in /components/ have active references.');
      return;
    }

    // Step 5: Perform cleanup (with backup)
    console.log('\nStep 5: Performing cleanup with backup...');
    const componentsCleanupPlan = {
      ...cleanupPlan,
      filesToDelete: componentsFilesToDelete
    };

    const result = await cleanupSystem.performCleanup(componentsCleanupPlan);

    // Step 6: Generate cleanup report
    console.log('\nStep 6: Generating cleanup report...');
    const cleanupReport = await cleanupSystem.generateCleanupReport(analysis, result);
    
    const cleanupReportPath = path.join(
      process.cwd(),
      'migration-reports',
      'components-cleanup-result.txt'
    );
    fs.writeFileSync(cleanupReportPath, cleanupReport.summary);
    console.log(`Cleanup report saved to: ${cleanupReportPath}\n`);

    // Display summary
    console.log('=== Cleanup Complete ===\n');
    console.log(cleanupReport.summary);

    if (result.backupId) {
      console.log(`\nBackup created: ${result.backupId}`);
      console.log('You can rollback this cleanup if needed.');
    }

  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  cleanupComponentsDirectory()
    .then(() => {
      console.log('\nCleanup script completed successfully.');
      process.exit(0);
    })
    .catch(error => {
      console.error('\nCleanup script failed:', error);
      process.exit(1);
    });
}

export { cleanupComponentsDirectory };
