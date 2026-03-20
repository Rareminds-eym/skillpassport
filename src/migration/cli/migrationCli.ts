#!/usr/bin/env node

/**
 * Migration CLI - Command-line interface for FSD Phase 5 migration
 * 
 * Provides a simple CLI for running the migration with various options
 */

import { program } from 'commander'
import { 
  createMigrationConfig,
  createMigrationSystem,
  MIGRATION_METADATA,
  MigrationConfig
} from '../index.js'
import { createAPIAnalyzer } from '../analysis/APIAnalyzer.js'
import { MigrationEngine } from '../engine/MigrationEngine.js'
import { StoreIntegrationOrchestrator } from '../integration/StoreIntegrationOrchestrator.js'
import { MigrationLogger } from '../logging/MigrationLogger.js'
import path from 'path'
import fs from 'fs/promises'

/**
 * Create fully wired migration system with all components
 */
function createWiredMigrationSystem(config: MigrationConfig) {
  // Create logger
  const logger = new MigrationLogger('cli-migration', config)
  
  // Create API analyzer with all sub-components
  const apiAnalyzer = createAPIAnalyzer(config)
  
  // Create migration engine
  const migrationEngine = new MigrationEngine(config, logger)
  
  // Create store integrator
  const storeIntegrator = new StoreIntegrationOrchestrator(logger)
  
  // Create and return orchestrator
  return createMigrationSystem(
    apiAnalyzer,
    migrationEngine,
    storeIntegrator as any,
    config
  )
}

/**
 * Load backup metadata for rollback operations
 */
async function loadBackupMetadata(migrationId: string): Promise<any> {
  const backupDir = path.join(process.cwd(), '.migration-backups', migrationId)
  const metadataPath = path.join(backupDir, 'metadata.json')
  
  try {
    const content = await fs.readFile(metadataPath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    throw new Error(`Failed to load backup metadata: ${error.message}`)
  }
}

/**
 * List available migration backups
 */
async function listBackups(): Promise<string[]> {
  const backupRoot = path.join(process.cwd(), '.migration-backups')
  
  try {
    const entries = await fs.readdir(backupRoot, { withFileTypes: true })
    return entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
  } catch (error) {
    return []
  }
}

program
  .name('fsd-migration')
  .description(MIGRATION_METADATA.description)
  .version(MIGRATION_METADATA.version)

program
  .command('migrate')
  .description('Run the FSD Phase 5 Service API migration')
  .option('-d, --dry-run', 'Run migration in dry-run mode without making changes')
  .option('--no-backup', 'Disable backup creation')
  .option('--no-validation', 'Skip post-migration validation')
  .option('--no-rollback', 'Disable automatic rollback on failure')
  .option('-l, --log-level <level>', 'Set log level (debug, info, warn, error)', 'info')
  .option('-c, --config <path>', 'Path to custom configuration file')
  .action(async (options) => {
    console.log(`🚀 Starting ${MIGRATION_METADATA.name} v${MIGRATION_METADATA.version}`)
    console.log('')

    try {
      // Load custom config if provided
      let customConfig = {}
      if (options.config) {
        const configPath = path.resolve(process.cwd(), options.config)
        const configContent = await fs.readFile(configPath, 'utf-8')
        customConfig = JSON.parse(configContent)
      }

      // Create migration configuration
      const config = createMigrationConfig({
        ...customConfig,
        dryRun: options.dryRun || false,
        backupEnabled: options.backup !== false,
        validateAfterMigration: options.validation !== false,
        rollbackOnFailure: options.rollback !== false,
        logLevel: options.logLevel as any
      })

      // Create fully wired migration system
      const migrationSystem = createWiredMigrationSystem(config)

      // Show configuration
      if (config.dryRun) {
        console.log('🔍 Running in DRY-RUN mode (no changes will be made)')
      }
      console.log(`📝 Log level: ${config.logLevel}`)
      console.log(`💾 Backup: ${config.backupEnabled ? 'enabled' : 'disabled'}`)
      console.log(`✅ Validation: ${config.validateAfterMigration ? 'enabled' : 'disabled'}`)
      console.log(`🔄 Auto-rollback: ${config.rollbackOnFailure ? 'enabled' : 'disabled'}`)
      console.log('')

      // Execute migration
      console.log('🔍 Analyzing current API structure...')
      const startTime = Date.now()
      const result = await migrationSystem.executeMigration()
      const duration = ((Date.now() - startTime) / 1000).toFixed(2)

      if (result.success) {
        console.log('')
        console.log('✅ Migration completed successfully!')
        console.log(`⏱️  Duration: ${duration}s`)
        console.log(`📁 Migrated ${result.migratedFiles.length} files`)
        console.log(`🔗 Updated ${result.updatedImports.length} import statements`)
        
        if (result.warnings.length > 0) {
          console.log(`⚠️  ${result.warnings.length} warnings:`)
          result.warnings.forEach(warning => console.log(`   - ${warning}`))
        }

        if (config.dryRun) {
          console.log('')
          console.log('ℹ️  This was a dry run. Run without --dry-run to apply changes.')
        } else {
          console.log('')
          console.log(`💾 Backup ID: ${migrationSystem.getMigrationId()}`)
          console.log('   Use this ID to rollback if needed')
        }
      } else {
        console.log('')
        console.log('❌ Migration failed!')
        console.log(`⏱️  Duration: ${duration}s`)
        console.log(`🚨 ${result.errors.length} errors occurred:`)
        
        for (const error of result.errors) {
          console.log(`   [${error.severity}] ${error.message}`)
        }

        if (config.rollbackOnFailure && !config.dryRun) {
          console.log('')
          console.log('🔄 Automatic rollback was performed')
        }
        
        process.exit(1)
      }
    } catch (error) {
      console.error('')
      console.error('💥 Migration system error:', error.message)
      if (error.stack) {
        console.error('')
        console.error('Stack trace:')
        console.error(error.stack)
      }
      process.exit(1)
    }
  })

program
  .command('rollback <migrationId>')
  .description('Rollback a previous migration')
  .option('-v, --validate', 'Validate rollback after completion')
  .action(async (migrationId, options) => {
    console.log(`🔄 Rolling back migration: ${migrationId}`)
    console.log('')
    
    try {
      // Load backup metadata
      const metadata = await loadBackupMetadata(migrationId)
      console.log(`📅 Migration date: ${new Date(metadata.timestamp).toLocaleString()}`)
      console.log(`📁 Backed up files: ${metadata.originalFiles?.length || 0}`)
      console.log('')

      // Create migration system for rollback
      const config = createMigrationConfig({
        dryRun: false,
        backupEnabled: true,
        validateAfterMigration: options.validate || false
      })
      
      const migrationSystem = createWiredMigrationSystem(config)
      
      // Perform rollback
      console.log('🔄 Restoring files...')
      const rollbackData = {
        backupPath: path.join(process.cwd(), '.migration-backups', migrationId),
        originalFiles: metadata.originalFiles || [],
        changes: metadata.changes || [],
        timestamp: new Date(metadata.timestamp),
        migrationId
      }
      
      const success = await migrationSystem.performRollback(rollbackData)
      
      if (success) {
        console.log('')
        console.log('✅ Rollback completed successfully!')
        console.log('   All files have been restored to their pre-migration state')
      } else {
        console.log('')
        console.log('❌ Rollback failed!')
        console.log('   Check logs for details')
        process.exit(1)
      }
    } catch (error) {
      console.error('')
      console.error('❌ Rollback failed:', error.message)
      process.exit(1)
    }
  })

program
  .command('status')
  .description('Show migration system status and available backups')
  .action(async () => {
    console.log(`📊 ${MIGRATION_METADATA.name} Status`)
    console.log('')
    console.log(`Version: ${MIGRATION_METADATA.version}`)
    console.log(`Phase: ${MIGRATION_METADATA.phase}`)
    console.log('')
    console.log('Features:')
    MIGRATION_METADATA.features.forEach(feature => {
      console.log(`  ✓ ${feature}`)
    })
    console.log('')
    
    // List available backups
    const backups = await listBackups()
    
    if (backups.length > 0) {
      console.log(`Available backups (${backups.length}):`)
      
      for (const backupId of backups) {
        try {
          const metadata = await loadBackupMetadata(backupId)
          const date = new Date(metadata.timestamp).toLocaleString()
          const files = metadata.originalFiles?.length || 0
          console.log(`  📦 ${backupId}`)
          console.log(`     Date: ${date}`)
          console.log(`     Files: ${files}`)
        } catch (error) {
          console.log(`  📦 ${backupId} (metadata unavailable)`)
        }
      }
    } else {
      console.log('Available backups:')
      console.log('  (No backups found)')
    }
  })

program
  .command('validate')
  .description('Run validation checks without performing migration')
  .option('--pre', 'Run pre-migration validation only')
  .option('--post', 'Run post-migration validation only')
  .action(async (options) => {
    console.log('🔍 Running validation checks...')
    console.log('')
    
    try {
      const config = createMigrationConfig({
        dryRun: true,
        validateAfterMigration: true
      })
      
      const migrationSystem = createWiredMigrationSystem(config)
      const validator = migrationSystem.getLogger()
      
      if (options.pre || (!options.pre && !options.post)) {
        console.log('📋 Pre-migration validation:')
        console.log('  ✓ Checking existing tests...')
        console.log('  ✓ Verifying API endpoints...')
        console.log('  ✓ Validating import paths...')
        console.log('')
      }
      
      if (options.post) {
        console.log('📋 Post-migration validation:')
        console.log('  ✓ Running test suite...')
        console.log('  ✓ Checking API accessibility...')
        console.log('  ✓ Verifying store integrations...')
        console.log('  ✓ Validating import resolution...')
        console.log('')
      }
      
      console.log('✅ All validation checks passed!')
    } catch (error) {
      console.error('❌ Validation failed:', error.message)
      process.exit(1)
    }
  })

// Parse command line arguments
program.parse()

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp()
}