/**
 * Analyze Duplicate Code Script
 * Scans for duplicate code and provides analysis without consolidation
 */

import { DuplicateConsolidator } from '../duplicate';

async function main() {
  console.log('🔍 Analyzing duplicate code...\n');

  const consolidator = new DuplicateConsolidator();

  const directories = ['src/entities', 'src/widgets'];

  try {
    const scanResult = await consolidator.scanForDuplicates(directories);

    console.log('📊 Analysis Results:');
    console.log(`   Files scanned: ${scanResult.scanMetadata.filesScanned}`);
    console.log(`   Duplicate groups found: ${scanResult.totalDuplicates}`);
    console.log(`   Potential lines to remove: ${scanResult.potentialSavings.totalLines}`);
    console.log(`   Estimated reduction: ${scanResult.potentialSavings.estimatedPercentage.toFixed(2)}%`);
    console.log(`   Scan time: ${scanResult.scanMetadata.timeElapsed}ms\n`);

    if (scanResult.totalDuplicates > 0) {
      console.log('📋 Duplicate Groups:\n');
      scanResult.duplicateGroups.forEach((group, index) => {
        console.log(`   ${index + 1}. ${group.id}`);
        console.log(`      Similarity: ${(group.similarity * 100).toFixed(1)}%`);
        console.log(`      Files: ${group.files.length}`);
        console.log(`      Code blocks: ${group.codeBlocks.length}`);
        group.files.forEach(file => console.log(`        - ${file}`));
        console.log();
      });
    }

    console.log('✅ Analysis complete!');
  } catch (error) {
    console.error('❌ Error during analysis:', error);
    process.exit(1);
  }
}

main();
