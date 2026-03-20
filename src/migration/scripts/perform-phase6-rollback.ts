#!/usr/bin/env node

/**
 * Perform Phase 6 Rollback Script - Execute rollback for entity/widget migrations
 * 
 * Provides CLI tool for performing actual rollback operations with
 * comprehensive validation and error handling.
 */

import { program } from 'commander'
import { Phase6RollbackSystem } from '../rollback/Phase6RollbackSystem.js'
import { MigrationConfig } from '../types/index.js'
import { MigrationLogger } from '../logging/MigrationLogger.js'
import { defaultConfig } from '../config/defaultConfig.js'

interface RollbackOptions {
  migrationId: string
  skipVerification: boolean
  preserveBackup: boolean
  continueOnError: boolean
  dryRun: boolean
  verbose: boolean
}

async function performRollback(options: RollbackOptions): Promise<void> {
  const config: MigrationConfig = {
    ...defaultConfig,
    dryRun: options.dryRun,
    logLevel: options.verbose ? 'debug' : 'info'
  }

  const logger = new MigrationLogger('phase6-rollback', config)
  const rollbackSystem = new Phase6RollbackSystem(config, logger)

  try {
    logger.info('Starting Phase 6 rollback operation', {
      migrationId: options.migrationId,
      dryRun: options.dryRun
    })

    // Load rollback data
    const rollbackData = await rollbackSystem.loadPhase6RollbackData(options.migrationId)
    
    if (!rollbackData) {
      logger.error(`No rollback data found for migration: ${options.migrationId}`)
      console.error(`\nError: No rollback data found for migration: ${options.migrationId}`)
      process.exit(1)
    }

    // Verify backup integrity unless skipped
    if (!options.skipVerification) {
      console.log('Verifying backup integrity...')
      const verification = await rollbackSystem.verifyBackupIntegrity(rollbackData)

      if (!verification.verified) {
        console.error('\n✗ Backup integrity verification failed')
        console.error('\nErrors:')
        verification.errors.forEach(error => console.error(`  - ${error}`))
        
        if (verification.warnings.length > 0) {
          console.warn('\nWarnings:')
          verification.warnings.forEach(warning => console.warn(`  - ${warning}`))
        }

        logger.error('Backup integrity verification failed', {
          errors: verification.errors
        })
        process.exit(1)
      }

      console.log('✓ Backup integrity verified')
    }

    // Perform rollback
    console.log(`\n${options.dryRun ? 'Testing' : 'Performing'} rollback operation...`)
    
    const result = await rollbackSystem.performPhase6Rollback(rollbackData, {
      validateBeforeRollback: !options.skipVerification,
      preserveBackup: options.preserveBackup,
      continueOnError: options.continueOnError,
      dryRun: options.dryRun
    })

    // Display results
    console.log('\n=== Rollback Results ===')
    console.log(`Success: ${result.success ? '✓' : '✗'}`)
    console.log(`Files Restored: ${result.restoredFiles}`)
    console.log(`Changes Reverted: ${result.revertedChanges}`)
    console.log(`Artifacts Cleaned: ${result.cleanedArtifacts}`)
    console.log(`Validation Passed: ${result.validationPassed ? '✓' : '✗'}`)

    if (result.errors.length > 0) {
      console.error('\nErrors:')
      result.errors.forEach(error => console.error(`  - ${error}`))
    }

    if (result.warnings.length > 0) {
      console.warn('\nWarnings:')
      result.warnings.forEach(warning => console.warn(`  - ${warning}`))
    }

    // Display migration details
    if (rollbackData.entityMigrations && rollbackData.entityMigrations.length > 0) {
      console.log('\n=== Entity Migrations Rolled Back ===')
      rollbackData.entityMigrations.forEach(entity => {
        console.log(`  - ${entity.entityName}`)
      })
    }

    if (rollbackData.widgetMigrations && rollbackData.widgetMigrations.length > 0) {
      console.log('\n=== Widget Migrations Rolled Back ===')
      rollbackData.widgetMigrations.forEach(widget => {
        console.log(`  - ${widget.widgetName}`)
      })
    }

    // Final status
    if (result.success) {
      if (options.dryRun) {
        console.log('\n✓ Rollback test completed successfully')
        console.log('Run without --dry-run to perform actual rollback')
      } else {
        console.log('\n✓ Rollback completed successfully')
        
        if (!options.preserveBackup) {
          console.log('Backup will be retained according to retention policy')
        } else {
          console.log('Backup preserved as requested')
        }
      }
      
      logger.info('Rollback operation completed successfully', {
        restoredFiles: result.restoredFiles,
        revertedChanges: result.revertedChanges
      })
      
      process.exit(0)
    } else {
      console.error('\n✗ Rollback failed')
      logger.error('Rollback operation failed', {
        errors: result.errors
      })
      process.exit(1)
    }

  } catch (error) {
    logger.error('Rollback operation failed', { error: error.message })
    console.error(`\nFatal Error: ${error.message}`)
    process.exit(1)
  }
}

// CLI Configuration
program
  .name('perform-phase6-rollback')
  .description('Perform Phase 6 rollback operation for entity/widget migrations')
  .version('1.0.0')
  .requiredOption('-m, --migration-id <id>', 'Migration ID to rollback')
  .option('--skip-verification', 'Skip backup integrity verification', false)
  .option('--preserve-backup', 'Preserve backup after rollback', false)
  .option('--continue-on-error', 'Continue rollback even if some operations fail', false)
  .option('--dry-run', 'Test rollback without making changes', false)
  .option('-v, --verbose', 'Enable verbose logging', false)
  .action(async (options: RollbackOptions) => {
    await performRollback(options)
  })

program.parse()
