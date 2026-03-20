/**
 * Consolidate Duplicate Code Script
 * Scans for and consolidates duplicate code across entities and widgets
 */

import { DuplicateConsolidator } from '../duplicate';

async function main() {
  console.log('🔍 Starting duplicate code detection and consolidation...\n');

  const consolidator = new DuplicateConsolidator();

  // Scan for duplicates in entities and widgets
  const directories = [
    'src/entities',
    'src/widgets',
  ];

  console.log('📂 Scanning directories:');
  directories.forEach(dir => console.log(`   - ${dir}`));
  console.log();

  try {
    // Step 1: Scan for duplicates
    console.log('🔎 Scanning for duplicate code...');
    const scanResult = await consolidator.scanForDuplicates(directories);

    console.log(`\n📊 Scan Results:`);
    console.log(`   Files scanned: ${scanResult.scanMetadata.filesScanned}`);
    console.log(`   Duplicate groups found: ${scanResult.totalDuplicates}`);
    console.log(`   Potential lines to remove: ${scanResult.potentialSavings.totalLines}`);
    console.log(`   Estimated reduction: ${scanResult.potentialSavings.estimatedPercentage.toFixed(2)}%`);
    console.log(`   Time elapsed: ${scanResult.scanMetadata.timeElapsed}ms\n`);

    if (scanResult.totalDuplicates === 0) {
      console.log('✅ No duplicates found!');
      return;
    }

    // Step 2: Consolidate duplicates
    console.log('🔧 Consolidating duplicate code...\n');
    const report = await consolidator.consolidateAll(scanResult.duplicateGroups);

    // Step 3: Display results
    console.log('📈 Consolidation Results:');
    console.log(`   Total consolidations: ${report.totalConsolidations}`);
    console.log(`   Successful: ${report.successfulConsolidations}`);
    console.log(`   Failed: ${report.failedConsolidations}`);
    console.log(`   Lines removed: ${report.codeReduction.totalLinesRemoved}`);
    console.log(`   Files affected: ${report.codeReduction.totalFilesAffected}`);
    console.log(`   Code reduction: ${report.codeReduction.percentageReduction.toFixed(2)}%\n`);

    // Display successful consolidations
    if (report.successfulConsolidations > 0) {
      console.log('✅ Successful Consolidations:');
      report.consolidations
        .filter(c => c.success)
        .forEach(c => {
          console.log(`\n   ${c.duplicateGroup.id}:`);
          console.log(`   → Canonical: ${c.canonicalFile}`);
          console.log(`   → Files updated: ${c.updatedFiles.length}`);
          console.log(`   → Lines removed: ${c.codeReduction.linesRemoved}`);
        });
      console.log();
    }

    // Display errors
    if (report.errors.length > 0) {
      console.log('❌ Errors:');
      report.errors.forEach(err => {
        console.log(`   ${err.duplicateGroupId}: ${err.error}`);
      });
      console.log();
    }

    console.log('✨ Duplicate consolidation complete!');
  } catch (error) {
    console.error('❌ Error during consolidation:', error);
    process.exit(1);
  }
}

main();
