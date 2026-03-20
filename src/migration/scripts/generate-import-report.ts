import * as fs from 'fs';
import * as path from 'path';
import { MigrationLogger } from '../logging/MigrationLogger';
import { ImportPathStandardizer } from '../import-path/ImportPathStandardizer';

async function main() {
  const logger = new MigrationLogger();
  const standardizer = new ImportPathStandardizer(logger);

  try {
    logger.info('Generating comprehensive import path correction report');

    // Get all TypeScript files in src directory
    const srcFiles = getAllTypeScriptFiles('src');
    
    console.log(`\nAnalyzing ${srcFiles.length} TypeScript files...`);

    // Generate the report
    const report = await standardizer.generateCorrectionReport(srcFiles);

    // Write report to file
    const reportPath = path.join(process.cwd(), 'import-path-report.md');
    fs.writeFileSync(reportPath, report, 'utf-8');

    console.log(`\n✓ Report generated: ${reportPath}`);
    console.log('\nReport preview:');
    console.log('─'.repeat(80));
    console.log(report.split('\n').slice(0, 50).join('\n'));
    
    if (report.split('\n').length > 50) {
      console.log('\n... (see full report in file)');
    }
    
    console.log('─'.repeat(80));

    // Also perform validation
    const result = await standardizer.validateImportPaths(srcFiles);
    
    console.log('\n=== Quick Summary ===');
    console.log(`Files Analyzed: ${result.summary.filesAnalyzed}`);
    console.log(`Total Violations: ${result.summary.totalViolationsFound}`);
    console.log(`Compliance Rate: ${result.analysis.statistics.complianceRate}`);
    
    if (result.summary.totalViolationsFound > 0) {
      console.log('\nViolations by Type:');
      Object.entries(result.analysis.violationsByType).forEach(([type, violations]) => {
        console.log(`  ${type}: ${violations.length}`);
      });
      console.log('\nRun "npm run standardize-imports" to fix violations automatically');
    }

    process.exit(0);
  } catch (error) {
    logger.error('Report generation failed', { error });
    console.error('Error:', error.message);
    process.exit(1);
  }
}

function getAllTypeScriptFiles(directoryPath: string): string[] {
  const files: string[] = [];

  const traverse = (dir: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules, dist, build, etc.
        if (!['node_modules', 'dist', 'build', '.git', 'coverage'].includes(entry.name)) {
          traverse(fullPath);
        }
      } else if (entry.isFile()) {
        // Include .ts and .tsx files, exclude .d.ts
        if ((entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) && !entry.name.endsWith('.d.ts')) {
          files.push(fullPath);
        }
      }
    }
  };

  traverse(directoryPath);
  return files;
}

main();
