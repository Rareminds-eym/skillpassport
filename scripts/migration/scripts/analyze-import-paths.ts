import { MigrationLogger } from '../logging/MigrationLogger';
import { ImportPathStandardizer } from '../import-path/ImportPathStandardizer';

async function main() {
  const logger = new MigrationLogger();
  const standardizer = new ImportPathStandardizer(logger);

  try {
    logger.info('Starting import path analysis');

    // Analyze all TypeScript files in src directory
    const result = await standardizer.validateImportPaths(['src']);

    // Generate and display report
    const report = await standardizer.generateCorrectionReport(['src']);
    console.log(report);

    // Display summary
    console.log('\n=== Analysis Summary ===');
    console.log(`Files Analyzed: ${result.summary.filesAnalyzed}`);
    console.log(`Total Violations: ${result.summary.totalViolationsFound}`);
    console.log(`Compliance Rate: ${result.analysis.statistics.complianceRate}`);
    console.log('\nViolations by Type:');
    Object.entries(result.analysis.violationsByType).forEach(([type, violations]) => {
      console.log(`  ${type}: ${violations.length}`);
    });

    if (result.summary.totalViolationsFound > 0) {
      console.log('\nRun "npm run standardize-imports" to fix violations automatically');
      process.exit(1);
    } else {
      console.log('\n✓ All import paths are compliant!');
      process.exit(0);
    }
  } catch (error) {
    logger.error('Import path analysis failed', { error });
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
