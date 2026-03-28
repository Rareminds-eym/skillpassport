#!/usr/bin/env node

/**
 * Test Phase 6 Rollback Script - Test rollback capabilities without making changes
 * 
 * Provides CLI tool for testing rollback operations in dry-run mode
 * to validate backup integrity and rollback procedures.
 */

import { program } from 'commander'
import { Phase6RollbackSystem } from '../rollback/Phase6RollbackSystem.js'
import { MigrationConfig } from '@/shared/types/index.js'
import { MigrationLogger } from '../logging/MigrationLogger.js'
import { defaultConfig } from "@/shared/config/defaultConfig.js"

interface TestRollbackOptions {
  migrationId: string
  verbose: boolean
}

async function testRollback(options: TestRollbackOptions): Promise<void> {
  const config: MigrationConfig = {
    ...defaultConfig,
    logLevel: options.verbose ? 'debug' : 'info'
  }

  const logger = new MigrationLogger('test-rollback', config)
  const rollbackSystem = new Phase6RollbackSystem(config, logger)

  try {
    logger.info('Loading rollback data', { migrationId: options.migrationId })

    // Load rollback data
    const rollbackData = await rollbackSystem.loadPhase6RollbackData(options.migrationId)
    
    if (!rollbackData) {
      logger.error(`No rollback data found for migration: ${options.migrationId}`)
      process.exit(1)
    }

    // Verify backup integrity
    logger.info('Verifying backup integrity...')
    const verification = await rollbackSystem.verifyBackupIntegrity(rollbackData)

    console.log('\n=== Backup Integrity Verification ===')
    console.log(`Verified: ${verification.verified ? '✓' : '✗'}`)
    console.log(`Files Intact: ${verification.filesIntact ? '✓' : '✗'}`)
    console.log(`Checksums Match: ${verification.checksumMatches ? '✓' : '✗'}`)
    console.log(`Metadata Valid: ${verification.metadataValid ? '✓' : '✗'}`)

    if (verification.errors.length > 0) {
      console.log('\nErrors:')
      verification.errors.forEach(error => console.log(`  - ${error}`))
    }

    if (verification.warnings.length > 0) {
      console.log('\nWarnings:')
      verification.warnings.forEach(warning => console.log(`  - ${warning}`))
    }

    // Test rollback operation
    logger.info('Testing rollback operation...')
    const testResult = await rollbackSystem.testRollback(rollbackData)

    console.log('\n=== Rollback Test Results ===')
    console.log(`Test Passed: ${testResult.testPassed ? '✓' : '✗'}`)
    console.log(`Files to Restore: ${testResult.filesRestored}`)
    console.log(`Imports to Revert: ${testResult.importsReverted}`)
    console.log(`Structure Validated: ${testResult.structureValidated ? '✓' : '✗'}`)

    if (testResult.errors.length > 0) {
      console.log('\nErrors:')
      testResult.errors.forEach(error => console.log(`  - ${error}`))
    }

    if (testResult.warnings.length > 0) {
      console.log('\nWarnings:')
      testResult.warnings.forEach(warning => console.log(`  - ${warning}`))
    }

    // Display migration details
    if (rollbackData.entityMigrations) {
      console.log('\n=== Entity Migrations ===')
      rollbackData.entityMigrations.forEach(entity => {
        console.log(`\nEntity: ${entity.entityName}`)
        console.log(`  Original Paths: ${entity.originalPaths.length}`)
        console.log(`  New Paths: ${entity.newPaths.length}`)
        console.log(`  Import Updates: ${entity.importUpdates.length}`)
        console.log(`  Timestamp: ${entity.timestamp.toISOString()}`)
      })
    }

    if (rollbackData.widgetMigrations) {
      console.log('\n=== Widget Migrations ===')
      rollbackData.widgetMigrations.forEach(widget => {
        console.log(`\nWidget: ${widget.widgetName}`)
        console.log(`  Original Paths: ${widget.originalPaths.length}`)
        console.log(`  New Paths: ${widget.newPaths.length}`)
        console.log(`  Timestamp: ${widget.timestamp.toISOString()}`)
      })
    }

    // Overall result
    console.log('\n=== Overall Result ===')
    if (verification.verified && testResult.testPassed) {
      console.log('✓ Rollback test PASSED - Safe to perform actual rollback')
      process.exit(0)
    } else {
      console.log('✗ Rollback test FAILED - Do not perform rollback')
      process.exit(1)
    }

  } catch (error) {
    logger.error('Rollback test failed', { error: error.message })
    console.error(`\nError: ${error.message}`)
    process.exit(1)
  }
}

// CLI Configuration
program
  .name('test-phase6-rollback')
  .description('Test Phase 6 rollback operation without making changes')
  .version('1.0.0')
  .requiredOption('-m, --migration-id <id>', 'Migration ID to test')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .action(async (options: TestRollbackOptions) => {
    await testRollback(options)
  })

program.parse()
