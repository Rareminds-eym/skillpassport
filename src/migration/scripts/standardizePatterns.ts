#!/usr/bin/env node

/**
 * Standalone API Pattern Standardization Script
 * 
 * This script can be run independently to standardize API patterns
 * without running the full migration process.
 */

import { StandardizationOrchestrator } from '../standardization/StandardizationOrchestrator';
import { APIAnalyzer } from '../analysis/APIAnalyzer';
import { MigrationLogger } from '../logging/MigrationLogger';
import { MigrationConfig } from '@/features/student-profile/model';
import * as path from 'path';

interface StandardizationOptions {
  dryRun?: boolean;
  verbose?: boolean;
  patterns?: ('naming' | 'signatures' | 'error-handling' | 'response-types' | 'request-patterns')[];
  reportOnly?: boolean;
}

async function standardizeAPIPatterns(options: StandardizationOptions = {}) {
  const config: MigrationConfig = {
    sourceDirectory: 'src',
    targetDirectory: 'src',
    dryRun: options.dryRun || false,
    backupEnabled: !options.dryRun,
    validateAfterMigration: true,
    rollbackOnFailure: true,
    logLevel: options.verbose ? 'debug' : 'info',
    features: ['authentication', 'subscription', 'search', 'portfolio'],
    storeIntegrationRules: []
  };

  const logger = new MigrationLogger('standardization', config);
  const standardizationOrchestrator = new StandardizationOrchestrator(logger);
  const apiAnalyzer = new APIAnalyzer(logger);

  try {
    logger.info('Starting API pattern standardization', { options });

    // Step 1: Discover all API functions
    logger.info('Discovering API functions...');
    const serviceFiles = await apiAnalyzer.scanServices();
    
    const allFunctions = [];
    for (const file of serviceFiles) {
      const functions = await apiAnalyzer.extractFunctions(file);
      allFunctions.push(...functions);
    }

    logger.info(`Found ${allFunctions.length} API functions in ${serviceFiles.length} files`);

    // Step 2: Generate standardization report
    if (options.reportOnly) {
      logger.info('Generating standardization report...');
      const report = await standardizationOrchestrator.generateStandardizationReport(allFunctions);
      
      console.log('\n=== API Pattern Standardization Report ===');
      console.log(`Total Functions: ${report.totalFunctions}`);
      console.log(`Functions Needing Standardization: ${report.standardizedFunctions}`);
      console.log(`Total Violations: ${report.patterns.reduce((sum, p) => sum + p.violations.length, 0)}`);
      
      for (const pattern of report.patterns) {
        if (pattern.violations.length > 0) {
          console.log(`\n${pattern.patternType.toUpperCase()} Violations (${pattern.violations.length}):`);
          for (const violation of pattern.violations.slice(0, 5)) { // Show first 5
            console.log(`  - ${violation.functionName} in ${path.basename(violation.filePath)}`);
            console.log(`    Current: ${violation.currentPattern}`);
            console.log(`    Expected: ${violation.expectedPattern}`);
          }
          if (pattern.violations.length > 5) {
            console.log(`    ... and ${pattern.violations.length - 5} more`);
          }
        }
      }

      if (report.recommendations.length > 0) {
        console.log('\nRecommendations:');
        for (const recommendation of report.recommendations) {
          console.log(`  - ${recommendation}`);
        }
      }

      return;
    }

    // Step 3: Apply standardization patterns
    let result;
    
    if (options.patterns && options.patterns.length > 0) {
      // Apply specific patterns only
      logger.info(`Applying specific patterns: ${options.patterns.join(', ')}`);
      
      if (options.patterns.includes('naming')) {
        result = await standardizationOrchestrator.standardizeNamingOnly(allFunctions);
      } else if (options.patterns.includes('signatures')) {
        result = await standardizationOrchestrator.standardizeSignaturesOnly(allFunctions);
      } else {
        // For other patterns, use the full standardization
        result = await standardizationOrchestrator.standardizeAllPatterns(allFunctions);
      }
    } else {
      // Apply all standardization patterns
      logger.info('Applying all standardization patterns...');
      result = await standardizationOrchestrator.standardizeAllPatterns(allFunctions);
    }

    // Step 4: Report results
    if (result.success) {
      logger.info('Standardization completed successfully', {
        changes: result.changes.length,
        errors: result.errors.length,
        warnings: result.warnings.length
      });

      if (result.changes.length > 0) {
        console.log('\n=== Standardization Changes ===');
        const changesByType = result.changes.reduce((acc, change) => {
          acc[change.changeType] = (acc[change.changeType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        for (const [type, count] of Object.entries(changesByType)) {
          console.log(`${type}: ${count} changes`);
        }

        if (options.verbose) {
          console.log('\nDetailed Changes:');
          for (const change of result.changes.slice(0, 10)) { // Show first 10
            console.log(`  - ${change.functionName} (${change.changeType})`);
            console.log(`    ${change.oldValue} → ${change.newValue}`);
            console.log(`    Reason: ${change.reason}`);
          }
          if (result.changes.length > 10) {
            console.log(`    ... and ${result.changes.length - 10} more changes`);
          }
        }
      }

      if (result.warnings.length > 0) {
        console.log('\nWarnings:');
        for (const warning of result.warnings) {
          console.log(`  - ${warning}`);
        }
      }
    } else {
      logger.error('Standardization failed', { errors: result.errors });
      
      console.log('\n=== Standardization Errors ===');
      for (const error of result.errors) {
        console.log(`  - ${error.functionName}: ${error.message}`);
        if (error.suggestion) {
          console.log(`    Suggestion: ${error.suggestion}`);
        }
      }
    }

  } catch (error) {
    logger.error('Standardization script failed', { error });
    console.error('Standardization failed:', error.message);
    process.exit(1);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: StandardizationOptions = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--verbose':
        options.verbose = true;
        break;
      case '--report-only':
        options.reportOnly = true;
        break;
      case '--patterns':
        const patterns = args[i + 1]?.split(',') as StandardizationOptions['patterns'];
        if (patterns) {
          options.patterns = patterns;
          i++; // Skip next argument
        }
        break;
      case '--help':
        console.log(`
API Pattern Standardization Script

Usage: node standardizePatterns.js [options]

Options:
  --dry-run         Run without making changes
  --verbose         Show detailed output
  --report-only     Generate report without applying changes
  --patterns LIST   Apply specific patterns (comma-separated)
                    Options: naming,signatures,error-handling,response-types,request-patterns
  --help           Show this help message

Examples:
  node standardizePatterns.js --report-only
  node standardizePatterns.js --dry-run --verbose
  node standardizePatterns.js --patterns naming,signatures
        `);
        process.exit(0);
        break;
    }
  }

  standardizeAPIPatterns(options);
}

export { standardizeAPIPatterns };