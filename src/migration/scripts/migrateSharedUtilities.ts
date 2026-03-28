/**
 * Script to migrate shared utilities from services to shared/api
 * 
 * This script identifies and migrates shared utilities following FSD architecture.
 */

import { ServiceDirectoryScanner } from '../analysis/ServiceDirectoryScanner';
import { SharedUtilityMigrator } from '../engine/SharedUtilityMigrator';
import { MigrationLogger } from '../logging/MigrationLogger';
import { createMigrationConfig } from "@/shared/config/defaultConfig";

async function migrateSharedUtilities() {
  const config = createMigrationConfig({
    sourceDirectory: 'src/services',
    targetDirectory: 'src',
    dryRun: false,
    backupEnabled: true
  });

  const logger = new MigrationLogger('shared-utils-migration', config);
  const scanner = new ServiceDirectoryScanner();
  const migrator = new SharedUtilityMigrator(config, logger);

  try {
    logger.info('Starting shared utility migration');

    // Scan services directory
    const serviceFiles = await scanner.scanServices();
    logger.info(`Found ${serviceFiles.length} service files`);

    // Identify shared utilities
    const sharedUtilities = await migrator.identifySharedUtilities(serviceFiles);
    logger.info(`Identified ${sharedUtilities.length} shared utilities`);

    if (sharedUtilities.length === 0) {
      logger.info('No shared utilities found to migrate');
      return;
    }

    // Migrate utilities
    const result = await migrator.migrateSharedUtilities(sharedUtilities);

    if (result.success) {
      logger.info('Shared utility migration completed successfully', {
        migratedFiles: result.migratedFiles.length,
        errors: result.errors.length,
        warnings: result.warnings.length
      });
    } else {
      logger.error('Shared utility migration failed', {
        errors: result.errors
      });
    }

  } catch (error) {
    logger.error('Migration script failed', { error: error.message });
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateSharedUtilities().catch(console.error);
}

export { migrateSharedUtilities };