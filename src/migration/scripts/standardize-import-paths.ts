import { MigrationLogger } from '../logging/MigrationLogger';
import { ImportPathStandardizer } from '../import-path/ImportPathStandardizer';

async function main() {
  const logger = new MigrationLogger();
  const standardizer = new ImportPathStandardizer(logger);

  try {
    logger.info('Starting import path standardization');

    // Standardize all imports in src directory
    const result = await standardizer.standardizeDirectory('src');

    // Display results
    console.log('\n=== Standardization Results ===');
    console.log(`Files Analyzed: ${result.summary.filesAnalyzed}`);
    console.log(`Files Modified: ${result.summary.filesModified}`);
    console.log(`Violations Found: ${result.summary.totalViolationsFound}`);
    console.log(`Violations Fixed: ${result.summary.totalViolationsFixed}`);
    console.log(`Config Updated: ${result.summary.configUpdated ? 'Yes' : 'No'}`);

    if (result.refactoring.changes.length > 0) {
      console.log('\nChanges by Type:');
      Object.entries(result.refactoring.statistics.changesByType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });

      console.log('\nModified Files:');
      result.refactoring.filesModified.slice(0, 20).forEach(file => {
        console.log(`  - ${file}`);
      });
      if (result.refactoring.filesModified.length > 20) {
        console.log(`  ... and ${result.refactoring.filesModified.length - 20} more`);
      }
    }

    if (result.refactoring.errors.length > 0) {
      console.log('\nErrors:');
      result.refactoring.errors.forEach(error => {
        console.log(`  - ${error}`);
      });
    }

    if (result.success) {
      console.log('\n✓ Import path standardization completed successfully!');
      process.exit(0);
    } else {
      console.log('\n✗ Import path standardization completed with errors');
      process.exit(1);
    }
  } catch (error) {
    logger.error('Import path standardization failed', { error });
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
