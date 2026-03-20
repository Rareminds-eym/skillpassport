#!/usr/bin/env ts-node

/**
 * FSD Compliance Validation Script
 * 
 * Validates Feature-Sliced Design architectural compliance and generates
 * comprehensive compliance reports with remediation recommendations.
 * 
 * Usage:
 *   npm run validate:fsd
 *   npm run validate:fsd -- --json
 *   npm run validate:fsd -- --verbose
 */

import { FSDComplianceValidatorImpl } from '../compliance/FSDComplianceValidator';
import { MigrationLogger } from '../logging/MigrationLogger';
import * as path from 'path';

interface CLIOptions {
  json: boolean;
  verbose: boolean;
  outputFile?: string;
}

async function main() {
  const args = process.argv.slice(2);
  const options: CLIOptions = {
    json: args.includes('--json'),
    verbose: args.includes('--verbose'),
    outputFile: args.find(arg => arg.startsWith('--output='))?.split('=')[1]
  };

  const migrationConfig = {
    dryRun: false,
    backupEnabled: true,
    validateAfterMigration: true,
    rollbackOnFailure: false,
    logLevel: 'info' as const,
    excludePatterns: [],
    includePatterns: [],
    featureMappings: {},
    storeIntegrationRules: []
  };

  const logger = new MigrationLogger('fsd-compliance-validation', migrationConfig);
  const projectRoot = process.cwd();

  logger.info('Starting FSD Compliance Validation...');
  logger.info(`Project root: ${projectRoot}`);

  const validator = new FSDComplianceValidatorImpl(projectRoot);

  try {
    // Generate comprehensive compliance report
    const report = await validator.generateComplianceReport();

    if (options.json) {
      // Output JSON format
      console.log(JSON.stringify(report, null, 2));
    } else {
      // Output human-readable format
      printComplianceReport(report, options.verbose);
    }

    // Write to file if specified
    if (options.outputFile) {
      const fsModule = await import('fs/promises');
      await fsModule.writeFile(
        options.outputFile,
        JSON.stringify(report, null, 2),
        'utf-8'
      );
      logger.info(`Report written to: ${options.outputFile}`);
    }

    // Exit with appropriate code
    if (!report.overallCompliance) {
      logger.error('FSD Compliance validation failed');
      process.exit(1);
    } else {
      logger.info('✅ FSD Compliance validation passed');
      process.exit(0);
    }
  } catch (error) {
    logger.error('FSD Compliance validation error', error as Record<string, any>);
    process.exit(1);
  }
}

function printComplianceReport(report: any, verbose: boolean) {
  console.log('\n' + '='.repeat(80));
  console.log('FSD COMPLIANCE VALIDATION REPORT');
  console.log('='.repeat(80));
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Overall Compliance: ${report.overallCompliance ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`Compliance Score: ${report.complianceScore}/100`);
  console.log('='.repeat(80));

  // Summary
  console.log('\n📊 SUMMARY');
  console.log('-'.repeat(80));
  console.log(`Total Violations: ${report.summary.totalViolations}`);
  console.log(`  - Errors: ${report.summary.errorCount}`);
  console.log(`  - Warnings: ${report.summary.warningCount}`);
  console.log(`Layers Validated: ${report.summary.layersValidated}`);
  console.log(`Slices Validated: ${report.summary.slicesValidated}`);
  console.log(`Files Scanned: ${report.summary.filesScanned}`);

  // Layer Hierarchy
  console.log('\n🏗️  LAYER HIERARCHY');
  console.log('-'.repeat(80));
  for (const layer of report.hierarchyValidation.layerStructure) {
    const status = layer.exists ? '✓' : '✗';
    console.log(`${status} ${layer.layer.padEnd(10)} - ${layer.slices.length} slices`);
    if (layer.violations.length > 0 && verbose) {
      layer.violations.forEach((v: any) => {
        console.log(`    ⚠️  ${v.message}`);
      });
    }
  }

  // Dependencies
  console.log('\n🔗 DEPENDENCIES');
  console.log('-'.repeat(80));
  console.log(`Total Dependencies: ${report.dependencyValidation.totalDependencies}`);
  console.log(`Valid Dependencies: ${report.dependencyValidation.validDependencies}`);
  console.log(`Invalid Dependencies: ${report.dependencyValidation.invalidDependencies}`);
  
  if (report.dependencyValidation.upwardDependencies.length > 0) {
    console.log(`\n⚠️  Upward Dependencies Found: ${report.dependencyValidation.upwardDependencies.length}`);
    if (verbose) {
      report.dependencyValidation.upwardDependencies.slice(0, 10).forEach((dep: any) => {
        console.log(`    ${dep.fromLayer} → ${dep.toLayer}: ${path.basename(dep.fromFile)}`);
      });
      if (report.dependencyValidation.upwardDependencies.length > 10) {
        console.log(`    ... and ${report.dependencyValidation.upwardDependencies.length - 10} more`);
      }
    }
  }

  // Public APIs
  console.log('\n📦 PUBLIC APIs');
  console.log('-'.repeat(80));
  console.log(`Total Slices: ${report.apiValidation.totalSlices}`);
  console.log(`Slices with Public API: ${report.apiValidation.slicesWithPublicAPI}`);
  console.log(`Slices without Public API: ${report.apiValidation.slicesWithoutPublicAPI.length}`);
  
  if (report.apiValidation.slicesWithoutPublicAPI.length > 0 && verbose) {
    console.log('\nMissing Public APIs:');
    report.apiValidation.slicesWithoutPublicAPI.slice(0, 10).forEach((slice: string) => {
      console.log(`    - ${slice}`);
    });
    if (report.apiValidation.slicesWithoutPublicAPI.length > 10) {
      console.log(`    ... and ${report.apiValidation.slicesWithoutPublicAPI.length - 10} more`);
    }
  }

  // Remediation Recommendations
  if (report.remediationRecommendations.length > 0) {
    console.log('\n💡 REMEDIATION RECOMMENDATIONS');
    console.log('-'.repeat(80));
    
    report.remediationRecommendations.forEach((rec: any, index: number) => {
      const priorityIcon = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
      console.log(`\n${index + 1}. ${priorityIcon} ${rec.title} [${rec.priority.toUpperCase()}]`);
      console.log(`   Category: ${rec.category}`);
      console.log(`   ${rec.description}`);
      console.log(`   Estimated Effort: ${rec.estimatedEffort}`);
      
      if (verbose) {
        console.log(`   Steps:`);
        rec.steps.forEach((step: string, i: number) => {
          console.log(`     ${i + 1}. ${step}`);
        });
        console.log(`   Affected Files: ${rec.affectedFiles.length}`);
      }
    });
  }

  console.log('\n' + '='.repeat(80));
  
  if (report.overallCompliance) {
    console.log('✅ FSD Compliance validation PASSED');
  } else {
    console.log('❌ FSD Compliance validation FAILED');
    console.log('\nPlease address the violations above to achieve FSD compliance.');
  }
  
  console.log('='.repeat(80) + '\n');
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
