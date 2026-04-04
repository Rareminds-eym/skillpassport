#!/usr/bin/env node

/**
 * Rollback Migration Script - CLI tool for rolling back failed migrations
 * 
 * Provides command-line interface for performing rollback operations
 * with comprehensive error handling and validation.
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { program } from 'commander'
import { MigrationConfig, RollbackData } from '@/shared/types/index.js'
import { MigrationLogger } from '../logging/MigrationLogger.js'
import { BackupOrchestrator } from '../backup/BackupOrchestrator.js'
import { defaultConfig } from "@/shared/config/defaultConfig.js"

interface RollbackOptions {
  migrationId?: string
  dryRun: boolean
  validateBefore: boolean
  cleanupArtifacts: boolean
  preserveBackup: boolean
  continueOnError: boolean
  listBackups: boolean
}

async function rollbackMigration(options: RollbackOptions): Promise<void> {
  const config: MigrationConfig = {
    ...defaultConfig,
    dryRun: options.dryRun
  }

  const logger = new MigrationLogger('rollback-operation', config)
  
  try {
    // List available backups if requested
    if (options.listBackups) {
      await listAvailableBackups(config, logger)
      return
    }

    // Validate migration ID
    if (!options.migrationId) {
      logger.error('Migration ID is required for rollback operation')
      process.exit(1)
    }

    logger.info('Starting rollback operation', {
      migrationId: options.migrationId,
      dryRun: options.dryRun
    })

    // Initialize backup orchestrator
    const backupOrchestrator = new BackupOrchestrator(options.migrationId, config, logger)

    // Load rollback data
    const rollbackData = await loadRollbackData(options.migrationId, logger)
    if (!rollbackData) {
      logger.error(`No rollback data found for migration: ${options.migrationId}`)
      process.exit(1)
    }

    // Perform rollback
    const rollbackResult = await backupOrchestrator.performIntelligentRollback(rollbackData, {
      validateBeforeRollback: options.validateBefore,
      cleanupArtifacts: options.cleanupArtifacts,
      preserveBackup: options.preserveBackup,
      dryRun: options.dryRun,
      continueOnError: options.continueOnError
    })

    // Report results
    if (rollbackResult.success) {
      logger.info('Rollback completed successfully', {
        restoredFiles: rollbackResult.restoredFiles,
        revertedChanges: rollbackResult.revertedChanges,
        cleanedArtifacts: rollbackResult.cleanedArtifacts,
        validationPassed: rollbackResult.validationPassed
      })

      if (rollbackResult.warnings.length > 0) {
        logger.warn('Rollback completed with warnings', {
          warnings: rollbackResult.warnings
        })
      }
    } else {
      logger.error('Rollback failed', {
        errors: rollbackResult.errors,
        warnings: rollbackResult.warnings
      })
      process.exit(1)
    }

  } catch (error) {
    logger.error('Rollback operation failed', { error: error.message })
    process.exit(1)
  }
}

async function listAvailableBackups(config: MigrationConfig, logger: MigrationLogger): Promise<void> {
  const backupOrchestrator = new BackupOrchestrator('list-operation', config, logger)
  
  try {
    const backups = await backupOrchestrator.listAvailableBackups()
    
    if (backups.length === 0) {
      console.log('No backups found.')
      return
    }

    console.log('\nAvailable Migration Backups:')
    console.log('============================')
    
    for (const backup of backups) {
      console.log(`Migration ID: ${backup.migrationId}`)
      console.log(`Timestamp: ${backup.timestamp.toISOString()}`)
      console.log(`Files: ${backup.fileCount}`)
      console.log(`Size: ${Math.round(backup.size / 1024)}KB`)
      console.log(`Path: ${backup.backupPath}`)
      console.log('---')
    }
  } catch (error) {
    logger.error('Failed to list backups', { error: error.message })
    process.exit(1)
  }
}

async function loadRollbackData(migrationId: string, logger: MigrationLogger): Promise<RollbackData | null> {
  const backupPath = path.join(process.cwd(), '.migration-backups', migrationId)
  const metadataPath = path.join(backupPath, 'rollback-metadata.json')

  try {
    const metadataContent = await fs.readFile(metadataPath, 'utf-8')
    return JSON.parse(metadataContent) as RollbackData
  } catch (error) {
    logger.error(`Failed to load rollback data for migration: ${migrationId}`, { error: error.message })
    return null
  }
}

// CLI Configuration
program
  .name('rollback-migration')
  .description('Rollback a failed FSD Phase 5 migration')
  .version('1.0.0')

program
  .option('-m, --migration-id <id>', 'Migration ID to rollback')
  .option('--dry-run', 'Simulate rollback without making changes', false)
  .option('--no-validate-before', 'Skip pre-rollback validation')
  .option('--no-cleanup-artifacts', 'Skip cleanup of migration artifacts')
  .option('--preserve-backup', 'Preserve backup files after rollback', false)
  .option('--continue-on-error', 'Continue rollback even if some operations fail', false)
  .option('--list-backups', 'List all available backups', false)
  .action(async (options: RollbackOptions) => {
    await rollbackMigration(options)
  })

// Parse command line arguments
program.parse()