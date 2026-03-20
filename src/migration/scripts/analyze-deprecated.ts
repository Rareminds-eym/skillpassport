import { DeprecatedAnalyzer } from '../cleanup/DeprecatedAnalyzer';
import * as fs from 'fs';
import * as path from 'path';

async function analyzeDeprecatedStructure() {
  console.log('=== Analyzing Deprecated Directory Structure ===\n');

  const analyzer = new DeprecatedAnalyzer();

  try {
    const analysis = await analyzer.analyzeDeprecatedStructure();

    console.log('Analysis Results:\n');
    console.log(`Total files analyzed: ${analysis.totalFilesAnalyzed}`);
    console.log(`Total size: ${(analysis.totalSizeBytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Orphaned files (safe to delete): ${analysis.orphanedFiles.length}`);
    console.log(`Files with active references: ${analysis.requiresManualReview.length}\n`);

    // Display per-directory breakdown
    console.log('Per-Directory Breakdown:\n');
    for (const dir of analysis.deprecatedDirectories) {
      console.log(`${dir.path}:`);
      console.log(`  Total files: ${dir.files.length}`);
      console.log(`  Orphaned: ${dir.orphanedCount}`);
      console.log(`  Active: ${dir.activeCount}`);
      console.log(`  Size: ${(dir.totalSize / 1024 / 1024).toFixed(2)} MB`);
      
      // Show sample of active files
      const activeFiles = dir.files.filter(f => !f.isOrphaned);
      if (activeFiles.length > 0) {
        console.log(`  Top referenced files:`);
        activeFiles
          .sort((a, b) => b.activeImports.length - a.activeImports.length)
          .slice(0, 3)
          .forEach(file => {
            console.log(`    - ${path.basename(file.path)} (${file.activeImports.length} refs)`);
          });
      }
      console.log();
    }

    // Generate detailed report
    const report = analyzer.generateAnalysisReport(analysis);
    const reportPath = path.join(process.cwd(), 'migration-reports', 'deprecated-analysis.txt');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, report);

    console.log(`\nDetailed report saved to: ${reportPath}`);

    // Save JSON for programmatic access
    const jsonPath = path.join(process.cwd(), 'migration-reports', 'deprecated-analysis.json');
    fs.writeFileSync(jsonPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: analysis.totalFilesAnalyzed,
        totalSizeBytes: analysis.totalSizeBytes,
        orphanedCount: analysis.orphanedFiles.length,
        activeCount: analysis.requiresManualReview.length
      },
      directories: analysis.deprecatedDirectories.map(dir => ({
        path: dir.path,
        totalFiles: dir.files.length,
        orphanedCount: dir.orphanedCount,
        activeCount: dir.activeCount,
        totalSize: dir.totalSize
      })),
      orphanedFiles: analysis.orphanedFiles,
      filesRequiringReview: analysis.requiresManualReview.map(file => ({
        path: file,
        references: analysis.activeReferences.get(file) || []
      }))
    }, null, 2));

    console.log(`JSON data saved to: ${jsonPath}`);

    // Recommendations
    console.log('\n=== Recommendations ===\n');
    if (analysis.orphanedFiles.length > 0) {
      console.log(`✓ ${analysis.orphanedFiles.length} files can be safely deleted`);
      console.log('  Run cleanup script to remove these files');
    }
    
    if (analysis.requiresManualReview.length > 0) {
      console.log(`⚠️  ${analysis.requiresManualReview.length} files have active references`);
      console.log('  These must be migrated to FSD structure before deletion');
    }

  } catch (error) {
    console.error('Error during analysis:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  analyzeDeprecatedStructure()
    .then(() => {
      console.log('\n✓ Analysis completed successfully.');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Analysis failed:', error);
      process.exit(1);
    });
}

export { analyzeDeprecatedStructure };
