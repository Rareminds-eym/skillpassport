#!/usr/bin/env tsx
/**
 * Phase 6 Analysis CLI
 * 
 * Command-line tool to run Phase 6 codebase analysis
 */

import { Phase6Analyzer } from '../analysis/Phase6Analyzer.js';
import { CircularDependencyDetector } from '../analysis/CircularDependencyDetector.js';
import { MigrationPlanner } from '../analysis/MigrationPlanner.js';
import { Phase6BackupManager } from '../backup/Phase6BackupManager.js';

async function main() {
  console.log('🚀 FSD Phase 6 Analysis Tool\n');

  try {
    // Step 1: Run analysis
    console.log('Step 1: Analyzing codebase...');
    const analyzer = new Phase6Analyzer('src');
    const report = await analyzer.analyze();

    console.log('\n📊 Analysis Results:');
    console.log(`  Total files: ${report.totalFiles}`);
    console.log(`  FSD compliance: ${report.fsdCompliance.toFixed(1)}%`);
    console.log('\n  Legacy directories:');
    console.log(`    components: ${report.legacyDirectories.components}`);
    console.log(`    services: ${report.legacyDirectories.services}`);
    console.log(`    hooks: ${report.legacyDirectories.hooks}`);
    console.log(`    utils: ${report.legacyDirectories.utils}`);
    console.log(`    types: ${report.legacyDirectories.types}`);
    console.log(`    config: ${report.legacyDirectories.config}`);
    console.log(`    lib: ${report.legacyDirectories.lib}`);
    console.log(`    layouts: ${report.legacyDirectories.layouts}`);
    console.log(`    routes: ${report.legacyDirectories.routes}`);
    console.log(`    providers: ${report.legacyDirectories.providers}`);

    // Step 2: Detect circular dependencies
    console.log('\nStep 2: Detecting circular dependencies...');
    const circularDetector = new CircularDependencyDetector(report.dependencyGraph);
    const circularReport = circularDetector.generateReport();

    console.log(`\n🔄 Circular Dependencies:`);
    console.log(`  Total cycles: ${circularReport.totalCycles}`);
    console.log(`  High severity: ${circularReport.highSeverity}`);
    console.log(`  Medium severity: ${circularReport.mediumSeverity}`);
    console.log(`  Low severity: ${circularReport.lowSeverity}`);
    console.log(`  Affected files: ${circularReport.affectedFiles.size}`);

    // Step 3: Create migration plan
    console.log('\nStep 3: Creating migration plan...');
    const planner = new MigrationPlanner(report.classifications, report.dependencyGraph);
    const plan = planner.createPlan();

    console.log(`\n📋 Migration Plan:`);
    console.log(`  Total batches: ${plan.batches.length}`);
    console.log(`  Parallel batches: ${plan.parallelBatches}`);
    console.log(`  Sequential batches: ${plan.sequentialBatches}`);
    console.log(`  Estimated duration: ${plan.estimatedTotalDuration} minutes`);

    // Step 4: Create backup
    console.log('\nStep 4: Creating backup...');
    const backupManager = new Phase6BackupManager();
    const legacyDirs = [
      'components',
      'services',
      'hooks',
      'utils',
      'types',
      'config',
      'lib',
      'layouts',
      'routes',
      'providers'
    ];
    
    const backupResult = await backupManager.createBackup(legacyDirs);
    
    if (backupResult.success) {
      console.log(`\n✅ Backup created successfully`);
      console.log(`  Backup ID: ${backupResult.backupId}`);
      console.log(`  Files backed up: ${backupResult.filesBackedUp}`);
    } else {
      console.log(`\n❌ Backup failed with ${backupResult.errors.length} errors`);
      backupResult.errors.forEach(err => console.log(`  - ${err}`));
    }

    // Save reports
    console.log('\nStep 5: Saving reports...');
    await analyzer.generateReport('.migration-reports/analysis-report.json');
    await circularDetector.saveReport('.migration-reports/circular-dependencies.json');
    
    console.log('\n✅ Analysis complete!');
    console.log('\nReports saved to:');
    console.log('  - .migration-reports/analysis-report.json');
    console.log('  - .migration-reports/circular-dependencies.json');

  } catch (error) {
    console.error('\n❌ Analysis failed:', error);
    process.exit(1);
  }
}

main();
