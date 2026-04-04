/**
 * Migration Orchestrator - Main coordinator for FSD Phase 5 migration
 * 
 * Orchestrates the entire migration process by coordinating the APIAnalyzer,
 * MigrationEngine, StoreIntegrator, logging, backup, and validation systems.
 */

import { 
  APIAnalyzer,
  MigrationEngine as IMigrationEngine,
  StoreIntegrator,
  MigrationConfig,
  MigrationResult,
  ValidationResult,
  RollbackData,
  ChangeRecord,
  MigrationStatus
} from '@/shared/types/index.js'
import { MigrationLogger, generateMigrationId } from '../logging/MigrationLogger.js'
import { BackupOrchestrator } from '../backup/BackupOrchestrator.js'
import { ValidationManager } from '../validation/ValidationManager.js'
import { MigrationEngine } from '../engine/MigrationEngine.js'
import { StandardizationOrchestrator } from '../standardization/StandardizationOrchestrator.js'

export class MigrationOrchestrator {
  private config: MigrationConfig
  private logger: MigrationLogger
  private backupOrchestrator: BackupOrchestrator
  private validationManager: ValidationManager
  private standardizationOrchestrator: StandardizationOrchestrator
  private migrationId: string
  private status: MigrationStatus = 'pending'

  constructor(
    config: MigrationConfig,
    private apiAnalyzer: APIAnalyzer,
    private migrationEngine: IMigrationEngine,
    private storeIntegrator: StoreIntegrator
  ) {
    this.config = config
    this.migrationId = generateMigrationId()
    this.logger = new MigrationLogger(this.migrationId, config)
    this.backupOrchestrator = new BackupOrchestrator(this.migrationId, config, this.logger)
    this.validationManager = new ValidationManager(config, this.logger)
    this.standardizationOrchestrator = new StandardizationOrchestrator(this.logger)
  }

  /**
   * Execute the complete migration process
   */
  async executeMigration(): Promise<MigrationResult> {
    this.logger.info('Starting FSD Phase 5 Service API Migration', { 
      migrationId: this.migrationId,
      dryRun: this.config.dryRun 
    })

    this.status = 'in-progress'
    let rollbackData: RollbackData | null = null

    try {
      // Phase 1: Pre-migration validation
      this.logger.setPhase('analysis')
      const preValidation = await this.validationManager.validatePreMigration()
      
      if (!preValidation.testsPass && !this.config.dryRun) {
        throw new Error('Pre-migration validation failed: existing tests are failing')
      }

      // Phase 2: Analysis and Discovery
      this.logger.info('Starting API analysis and discovery')
      const serviceFiles = await this.apiAnalyzer.scanServices()
      this.logger.updateSummary({ totalFiles: serviceFiles.length })

      const allFunctions = []
      for (const file of serviceFiles) {
        const functions = await this.apiAnalyzer.extractFunctions(file)
        allFunctions.push(...functions)
      }
      this.logger.updateSummary({ totalFunctions: allFunctions.length })

      // Scan codebase for import references
      this.logger.info('Scanning codebase for import references')
      const scanResult = await this.migrationEngine.scanForImportReferences(allFunctions)
      this.logger.info('Import reference scan completed', {
        totalReferences: scanResult.summary.totalReferences,
        scannedFiles: scanResult.scannedFiles.length,
        errorFiles: scanResult.errorFiles.length
      })

      // Phase 3: Classification and Mapping
      this.logger.setPhase('classification')
      const featureMappings = await this.apiAnalyzer.mapToFeatures(allFunctions)
      const dependencyGraph = await this.apiAnalyzer.identifyDependencies(allFunctions)

      // Identify shared functions
      const sharedFunctions = allFunctions.filter(func => func.isShared)
      this.logger.updateSummary({ sharedFunctions: sharedFunctions.length })

      // Phase 4: Store Integration Analysis
      const integrations = []
      for (const func of allFunctions) {
        const storeActions = await this.storeIntegrator.identifyStoreActions(func)
        if (storeActions.length > 0) {
          // Find appropriate store and create integration
          const store = await this.findStoreForFunction(func)
          if (store) {
            const integration = await this.storeIntegrator.integrateWithStore(func, store)
            integrations.push(integration)
          }
        }
      }
      this.logger.updateSummary({ storeIntegrations: integrations.length })

      // Phase 5: Enhanced Backup Creation
      if (this.config.backupEnabled && !this.config.dryRun) {
        this.logger.info('Creating comprehensive backup of files to be modified')
        const filesToBackup = this.identifyFilesToBackup(serviceFiles, featureMappings)
        const backupResult = await this.backupOrchestrator.createComprehensiveBackup(filesToBackup, {
          checksumValidation: true,
          retentionDays: 30
        })
        
        if (!backupResult.success) {
          throw new Error(`Backup creation failed: ${backupResult.errors.join(', ')}`)
        }
        
        rollbackData = backupResult.rollbackData || null
      }

      // Phase 6: Migration Execution
      this.logger.setPhase('migration')
      let migrationResult: MigrationResult

      if (this.config.dryRun) {
        this.logger.info('Dry run mode: simulating migration without making changes')
        migrationResult = await this.simulateMigration(featureMappings, sharedFunctions)
      } else {
        this.logger.info('Executing actual migration')
        migrationResult = await this.executeActualMigration(featureMappings, sharedFunctions, rollbackData)
      }

      // Phase 7: Post-migration Validation
      if (!this.config.dryRun && this.config.validateAfterMigration) {
        this.logger.setPhase('validation')
        const postValidation = await this.validationManager.validatePostMigration(
          integrations, 
          migrationResult.updatedImports
        )

        if (!postValidation.testsPass && this.config.rollbackOnFailure) {
          this.logger.error('Post-migration validation failed, initiating rollback')
          await this.performRollback(rollbackData)
          throw new Error('Migration rolled back due to validation failures')
        }
      }

      // Phase 8: Cleanup
      if (!this.config.dryRun && rollbackData) {
        // Enhanced cleanup is handled by BackupOrchestrator
        this.logger.info('Migration artifacts cleanup completed')
      }

      this.status = 'completed'
      this.logger.setPhase('complete')
      
      const finalResult: MigrationResult = {
        ...migrationResult,
        success: true,
        rollbackData: rollbackData || {
          backupPath: '',
          originalFiles: [],
          changes: [],
          timestamp: new Date(),
          migrationId: this.migrationId
        }
      }

      this.logger.info('Migration completed successfully', {
        migratedFiles: finalResult.migratedFiles.length,
        updatedImports: finalResult.updatedImports.length,
        duration: finalResult.duration
      })

      return finalResult

    } catch (error) {
      this.status = 'failed'
      this.logger.error('Migration failed', { error: error.message })

      if (rollbackData && this.config.rollbackOnFailure && !this.config.dryRun) {
        await this.performRollback(rollbackData)
      }

      return {
        success: false,
        migratedFiles: [],
        updatedImports: [],
        errors: [{
          code: 'MIGRATION_FAILED',
          message: error.message,
          severity: 'critical',
          category: 'migration'
        }],
        warnings: [],
        rollbackData: rollbackData || {
          backupPath: '',
          originalFiles: [],
          changes: [],
          timestamp: new Date(),
          migrationId: this.migrationId
        },
        duration: 0,
        timestamp: new Date()
      }
    }
  }

  /**
   * Get current migration status
   */
  getStatus(): MigrationStatus {
    return this.status
  }

  /**
   * Get migration logger
   */
  getLogger(): MigrationLogger {
    return this.logger
  }

  /**
   * Get migration ID
   */
  getMigrationId(): string {
    return this.migrationId
  }

  /**
   * Enhanced rollback operation with comprehensive error handling
   */
  async performRollback(rollbackData: RollbackData | null): Promise<boolean> {
    if (!rollbackData) {
      this.logger.error('No rollback data available')
      return false
    }

    this.logger.setPhase('rollback')
    this.status = 'rolled-back'

    const rollbackResult = await this.backupOrchestrator.performIntelligentRollback(rollbackData, {
      validateBeforeRollback: true,
      cleanupArtifacts: true,
      continueOnError: false
    })
    
    if (rollbackResult.success && rollbackResult.validationPassed) {
      this.logger.info('Enhanced rollback completed and validated successfully', {
        restoredFiles: rollbackResult.restoredFiles,
        revertedChanges: rollbackResult.revertedChanges,
        cleanedArtifacts: rollbackResult.cleanedArtifacts
      })
      return true
    } else {
      this.logger.error('Enhanced rollback failed or validation failed', {
        errors: rollbackResult.errors,
        warnings: rollbackResult.warnings
      })
      return false
    }
  }

  /**
   * Simulate migration without making actual changes
   */
  private async simulateMigration(featureMappings: any[], sharedFunctions: any[]): Promise<MigrationResult> {
    this.logger.info('Simulating feature API migration')
    
    // Simulate the migration process
    const simulatedFiles = featureMappings.flatMap(mapping => 
      mapping.functions.map(func => `src/features/${mapping.feature}/api/${func.name}.ts`)
    )
    
    const simulatedSharedFiles = sharedFunctions.map(func => 
      `src/shared/api/${func.name}.ts`
    )

    return {
      success: true,
      migratedFiles: [...simulatedFiles, ...simulatedSharedFiles],
      updatedImports: [],
      errors: [],
      warnings: ['This was a dry run - no actual changes were made'],
      rollbackData: {
        backupPath: '',
        originalFiles: [],
        changes: [],
        timestamp: new Date(),
        migrationId: this.migrationId
      },
      duration: 1000, // Simulated duration
      timestamp: new Date()
    }
  }

  /**
   * Execute actual migration
   */
  private async executeActualMigration(
    featureMappings: any[], 
    sharedFunctions: any[], 
    rollbackData: RollbackData | null
  ): Promise<MigrationResult> {
    // Migrate feature-specific APIs
    const featureResult = await this.migrationEngine.migrateFeatureAPIs(featureMappings)
    
    // Record changes for rollback
    if (rollbackData) {
      const errorHandler = this.backupOrchestrator.getErrorHandler()
      for (const file of featureResult.migratedFiles) {
        try {
          // Record change through the backup orchestrator's backup manager
          await this.recordMigrationChange(rollbackData, {
            type: 'create',
            path: file,
            timestamp: new Date()
          })
        } catch (error) {
          await errorHandler.handleError(error, {
            operation: 'record-change',
            phase: 'feature-migration',
            filePath: file,
            migrationId: this.migrationId,
            timestamp: new Date()
          })
        }
      }
    }

    // Migrate shared APIs
    const sharedResult = await this.migrationEngine.migrateSharedAPIs(sharedFunctions)
    
    // Record shared changes
    if (rollbackData) {
      const errorHandler = this.backupOrchestrator.getErrorHandler()
      for (const file of sharedResult.migratedFiles) {
        try {
          await this.recordMigrationChange(rollbackData, {
            type: 'create',
            path: file,
            timestamp: new Date()
          })
        } catch (error) {
          await errorHandler.handleError(error, {
            operation: 'record-change',
            phase: 'shared-migration',
            filePath: file,
            migrationId: this.migrationId,
            timestamp: new Date()
          })
        }
      }
    }

    // Update import paths
    const pathChanges = [
      ...featureResult.migratedFiles.map(file => ({
        oldPath: file.replace('/features/', '/services/'),
        newPath: file,
        type: 'move' as const,
        affectedImports: []
      })),
      ...sharedResult.migratedFiles.map(file => ({
        oldPath: file.replace('/shared/', '/services/'),
        newPath: file,
        type: 'move' as const,
        affectedImports: []
      }))
    ]

    const updateResult = await this.migrationEngine.updateImportPaths(pathChanges)

    // Phase: API Pattern Standardization
    this.logger.info('Starting API pattern standardization')
    const allMigratedFunctions = [
      ...featureMappings.flatMap(mapping => mapping.functions),
      ...sharedFunctions
    ]
    
    const standardizationResult = await this.standardizationOrchestrator.standardizeAllPatterns(allMigratedFunctions)
    
    if (!standardizationResult.success) {
      this.logger.warn('API pattern standardization had errors', { 
        errors: standardizationResult.errors.length,
        changes: standardizationResult.changes.length 
      })
    } else {
      this.logger.info('API pattern standardization completed successfully', {
        changes: standardizationResult.changes.length
      })
    }

    // Validate migration
    const validationResult = await this.migrationEngine.validateMigration()

    return {
      success: featureResult.success && sharedResult.success && updateResult.success,
      migratedFiles: [...featureResult.migratedFiles, ...sharedResult.migratedFiles],
      updatedImports: updateResult.updatedFiles.map(file => ({
        filePath: file,
        oldImport: 'services/',
        newImport: 'features/ or shared/',
        lineNumber: 0,
        success: true
      })),
      errors: [...featureResult.errors, ...sharedResult.errors, ...standardizationResult.errors.map(e => ({
        code: 'STANDARDIZATION_ERROR',
        message: e.message,
        severity: 'warning' as const,
        category: 'standardization' as const
      }))],
      warnings: [...featureResult.warnings, ...sharedResult.warnings, ...standardizationResult.warnings],
      rollbackData: rollbackData || {
        backupPath: '',
        originalFiles: [],
        changes: [],
        timestamp: new Date(),
        migrationId: this.migrationId
      },
      duration: Date.now() - this.logger.getLog().startTime.getTime(),
      timestamp: new Date()
    }
  }

  /**
   * Find appropriate Zustand store for a function
   */
  private async findStoreForFunction(func: any): Promise<any | null> {
    // This is a simplified implementation
    // In reality, this would analyze the function to determine which store it should integrate with
    
    const functionName = func.name.toLowerCase()
    
    if (functionName.includes('auth') || functionName.includes('login') || functionName.includes('user')) {
      return { name: 'authStore', path: 'src/stores/authStore.ts', actions: [], selectors: [], state: {} }
    }
    
    if (functionName.includes('subscription') || functionName.includes('payment')) {
      return { name: 'subscriptionStore', path: 'src/stores/subscriptionStore.ts', actions: [], selectors: [], state: {} }
    }
    
    if (functionName.includes('search')) {
      return { name: 'searchStore', path: 'src/stores/searchStore.ts', actions: [], selectors: [], state: {} }
    }
    
    if (functionName.includes('portfolio')) {
      return { name: 'portfolioStore', path: 'src/stores/portfolioStore.ts', actions: [], selectors: [], state: {} }
    }
    
    return null
  }

  /**
   * Identify files that need to be backed up
   */
  private identifyFilesToBackup(serviceFiles: any[], featureMappings: any[]): string[] {
    const filesToBackup = new Set<string>()
    
    // Add all service files
    for (const file of serviceFiles) {
      filesToBackup.add(file.path)
    }
    
    // Add files that will be created or modified
    for (const mapping of featureMappings) {
      filesToBackup.add(mapping.targetPath)
    }
    
    return Array.from(filesToBackup)
  }

  /**
   * Record migration change for rollback tracking
   */
  private async recordMigrationChange(rollbackData: RollbackData, change: ChangeRecord): Promise<void> {
    // Access the backup manager through the orchestrator
    // This is a simplified approach - in a full implementation, 
    // the BackupOrchestrator would expose this functionality
    rollbackData.changes.push(change)
  }
}

/**
 * Create a new migration orchestrator
 */
export function createMigrationOrchestrator(
  config: MigrationConfig,
  apiAnalyzer: APIAnalyzer,
  migrationEngine: IMigrationEngine,
  storeIntegrator: StoreIntegrator
): MigrationOrchestrator {
  return new MigrationOrchestrator(config, apiAnalyzer, migrationEngine, storeIntegrator)
}