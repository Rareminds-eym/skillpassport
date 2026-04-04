#!/usr/bin/env node

import { ServicesDirectoryCleanup } from '../cleanup/ServicesDirectoryCleanup';
import { MigrationLogger } from '../logging/MigrationLogger';
import { CleanupConfig } from '../types';
import * as path from 'path';

/**
 * Script to clean up the services directory after migration
 * Removes empty service files and creates deprecation notices
 */
async function main() {
  const projectRoot = process.cwd();
  
  const config: CleanupConfig = {
    projectRoot,
    dryRun: process.argv.includes('--dry-run'),
    createDeprecationNotices: !process.argv.includes('--no-deprecation'),
    preserveSharedUtilities: true,
    backupBeforeCleanup: !process.argv.includes('--no-backup')
  };

  const logger = new MigrationLogger({
    logLevel: process.argv.includes('--verbose') ? 'debug' : 'info',
    logToFile: true,
    logFilePath: path.join(projectRoot, 'migration-cleanup.log')
  });

  const cleanup = new ServicesDirectoryCleanup(config, logger);

  try {
    logger.info('Starting services directory cleanup...');
    
    if (config.dryRun) {
      logger.info('Running in DRY RUN mode - no files will be modified');
    }

    const result = await cleanup.cleanup();

    if (result.success) {
      logger.info('Services directory cleanup completed successfully');
      logger.info(`Files removed: ${result.removedFiles.length}`);
      logger.info(`Files preserved: ${result.preservedFiles.length}`);
      logger.info(`Deprecation notices created: ${result.deprecationNotices.length}`);
      
      if (result.removedFiles.length > 0) {
        logger.info('Removed files:');
        result.removedFiles.forEach(file => logger.info(`  - ${file}`));
      }
      
      if (result.preservedFiles.length > 0) {
        logger.info('Preserved files:');
        result.preservedFiles.forEach(file => logger.info(`  - ${file}`));
      }
      
      if (result.errors.length > 0) {
        logger.warn('Errors encountered:');
        result.errors.forEach(error => logger.warn(`  - ${error}`));
      }
    } else {
      logger.error('Services directory cleanup failed');
      result.errors.forEach(error => logger.error(error));
      process.exit(1);
    }

  } catch (error) {
    logger.error('Cleanup script failed:', error);
    process.exit(1);
  }
}

// Handle command line arguments
function printUsage() {
  console.log(`
Usage: npm run cleanup:services [options]

Options:
  --dry-run           Run without making any changes
  --no-deprecation    Skip creating deprecation notices
  --no-backup         Skip creating backups before cleanup
  --verbose           Enable verbose logging
  --help              Show this help message

Examples:
  npm run cleanup:services                    # Run cleanup with default settings
  npm run cleanup:services -- --dry-run      # Preview changes without applying them
  npm run cleanup:services -- --verbose      # Run with detailed logging
`);
}

if (process.argv.includes('--help')) {
  printUsage();
  process.exit(0);
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});