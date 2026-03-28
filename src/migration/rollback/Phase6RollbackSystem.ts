/**
 * Phase 6 Rollback System - Enhanced rollback capabilities for entity/widget migrations
 * 
 * Extends the existing rollback system with specialized support for:
 * - Entity migration rollback
 * - Widget migration rollback
 * - Backup verification and integrity checking
 * - Rollback testing and validation
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import * as crypto from 'crypto'
import { 
  RollbackData, 
  MigrationConfig 
} from '@/shared/types/index.js'
import { MigrationLogger } from '../logging/MigrationLogger.js'
import { BackupOrchestrator } from '../backup/BackupOrchestrator.js'
import { RollbackSystem, RollbackOptions, RollbackResult } from '../backup/RollbackSystem.js'

export interface Phase6RollbackData extends RollbackData {
  entityMigrations?: EntityMigrationBackup[]
  widgetMigrations?: WidgetMigrationBackup[]
  checksums?: Record<string, string>
  integrityVerified?: boolean
}

export interface EntityMigrationBackup {
  entityName: string
  originalPaths: string[]
  newPaths: string[]
  importUpdates: ImportUpdate[]
  timestamp: Date
}

export interface WidgetMigrationBackup {
  widgetName: string
  originalPaths: string[]
  newPaths: string[]
  compositionData: Record<string, any>
  timestamp: Date
}

export interface ImportUpdate {
  filePath: string
  oldImport: string
  newImport: string
  lineNumber: number
}

export interface BackupVerificationResult {
  verified: boolean
  checksumMatches: boolean
  filesIntact: boolean
  metadataValid: boolean
  errors: string[]
  warnings: string[]
}

export interface RollbackTestResult {
  testPassed: boolean
  filesRestored: number
  importsReverted: number
  structureValidated: boolean
  errors: string[]
  warnings: string[]
}

export class Phase6RollbackSystem {
  private config: MigrationConfig
  private logger: MigrationLogger
  private backupOrchestrator: BackupOrchestrator
  private rollbackSystem: RollbackSystem

  constructor(
    config: MigrationConfig,
    logger: MigrationLogger
  ) {
    this.config = config
    this.logger = logger
    this.backupOrchestrator = new BackupOrchestrator('phase6-rollback', config, logger)
    this.rollbackSystem = this.backupOrchestrator.getRollbackSystem()
  }

  /**
   * Create enhanced backup for entity migration
   */
  async createEntityMigrationBackup(
    entityName: string,
    originalPaths: string[],
    newPaths: string[],
    importUpdates: ImportUpdate[]
  ): Promise<Phase6RollbackData> {
    this.logger.info('Creating entity migration backup', { entityName })

    const migrationId = `entity-${entityName}-${Date.now()}`
    
    // Create base backup
    const backupResult = await this.backupOrchestrator.createComprehensiveBackup(
      originalPaths,
      { checksumValidation: true }
    )

    if (!backupResult.success || !backupResult.rollbackData) {
      throw new Error(`Failed to create backup for entity ${entityName}`)
    }

    // Calculate checksums for all files
    const checksums = await this.calculateFileChecksums([...originalPaths, ...newPaths])

    // Enhance rollback data with entity-specific information
    const phase6RollbackData: Phase6RollbackData = {
      ...backupResult.rollbackData,
      entityMigrations: [{
        entityName,
        originalPaths,
        newPaths,
        importUpdates,
        timestamp: new Date()
      }],
      checksums,
      integrityVerified: true
    }

    // Save enhanced rollback data
    await this.savePhase6RollbackData(migrationId, phase6RollbackData)

    this.logger.info('Entity migration backup created successfully', {
      entityName,
      fileCount: originalPaths.length,
      importUpdates: importUpdates.length
    })

    return phase6RollbackData
  }

  /**
   * Create enhanced backup for widget migration
   */
  async createWidgetMigrationBackup(
    widgetName: string,
    originalPaths: string[],
    newPaths: string[],
    compositionData: Record<string, any>
  ): Promise<Phase6RollbackData> {
    this.logger.info('Creating widget migration backup', { widgetName })

    const migrationId = `widget-${widgetName}-${Date.now()}`
    
    // Create base backup
    const backupResult = await this.backupOrchestrator.createComprehensiveBackup(
      originalPaths,
      { checksumValidation: true }
    )

    if (!backupResult.success || !backupResult.rollbackData) {
      throw new Error(`Failed to create backup for widget ${widgetName}`)
    }

    // Calculate checksums
    const checksums = await this.calculateFileChecksums([...originalPaths, ...newPaths])

    // Enhance rollback data with widget-specific information
    const phase6RollbackData: Phase6RollbackData = {
      ...backupResult.rollbackData,
      widgetMigrations: [{
        widgetName,
        originalPaths,
        newPaths,
        compositionData,
        timestamp: new Date()
      }],
      checksums,
      integrityVerified: true
    }

    // Save enhanced rollback data
    await this.savePhase6RollbackData(migrationId, phase6RollbackData)

    this.logger.info('Widget migration backup created successfully', {
      widgetName,
      fileCount: originalPaths.length
    })

    return phase6RollbackData
  }

  /**
   * Verify backup integrity before rollback
   */
  async verifyBackupIntegrity(
    rollbackData: Phase6RollbackData
  ): Promise<BackupVerificationResult> {
    this.logger.info('Verifying backup integrity', {
      migrationId: rollbackData.migrationId
    })

    const result: BackupVerificationResult = {
      verified: false,
      checksumMatches: false,
      filesIntact: false,
      metadataValid: false,
      errors: [],
      warnings: []
    }

    try {
      // Verify backup directory exists
      try {
        await fs.access(rollbackData.backupPath)
        result.filesIntact = true
      } catch (error) {
        result.errors.push(`Backup directory not found: ${rollbackData.backupPath}`)
        return result
      }

      // Verify all backed up files exist
      for (const fileInfo of rollbackData.originalFiles) {
        const backupFilePath = path.join(rollbackData.backupPath, fileInfo.relativePath)
        try {
          await fs.access(backupFilePath)
        } catch (error) {
          result.errors.push(`Backup file missing: ${fileInfo.relativePath}`)
          result.filesIntact = false
        }
      }

      // Verify checksums if available
      if (rollbackData.checksums) {
        const checksumVerification = await this.verifyChecksums(
          rollbackData.backupPath,
          rollbackData.checksums
        )
        result.checksumMatches = checksumVerification.allMatch
        result.warnings.push(...checksumVerification.warnings)
        result.errors.push(...checksumVerification.errors)
      } else {
        result.warnings.push('No checksums available for verification')
        result.checksumMatches = true // Assume valid if no checksums
      }

      // Verify metadata
      const metadataPath = path.join(rollbackData.backupPath, 'rollback-metadata.json')
      try {
        await fs.access(metadataPath)
        const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'))
        result.metadataValid = metadata.migrationId === rollbackData.migrationId
      } catch (error) {
        result.warnings.push('Metadata file not found or invalid')
        result.metadataValid = false
      }

      // Overall verification status
      result.verified = result.filesIntact && result.checksumMatches && result.errors.length === 0

      this.logger.info('Backup integrity verification completed', {
        verified: result.verified,
        errors: result.errors.length,
        warnings: result.warnings.length
      })

      return result
    } catch (error) {
      result.errors.push(`Verification failed: ${error.message}`)
      this.logger.error('Backup integrity verification failed', { error: error.message })
      return result
    }
  }

  /**
   * Perform rollback with entity/widget-specific handling
   */
  async performPhase6Rollback(
    rollbackData: Phase6RollbackData,
    options: Partial<RollbackOptions> = {}
  ): Promise<RollbackResult> {
    this.logger.info('Starting Phase 6 rollback operation', {
      migrationId: rollbackData.migrationId,
      hasEntityMigrations: !!rollbackData.entityMigrations,
      hasWidgetMigrations: !!rollbackData.widgetMigrations
    })

    // Verify backup integrity before rollback
    if (options.validateBeforeRollback !== false) {
      const verification = await this.verifyBackupIntegrity(rollbackData)
      if (!verification.verified) {
        this.logger.error('Backup integrity verification failed', {
          errors: verification.errors
        })
        return {
          success: false,
          restoredFiles: 0,
          revertedChanges: 0,
          cleanedArtifacts: 0,
          errors: ['Backup integrity verification failed', ...verification.errors],
          warnings: verification.warnings,
          validationPassed: false
        }
      }
    }

    // Perform base rollback
    const rollbackResult = await this.backupOrchestrator.performIntelligentRollback(
      rollbackData,
      options
    )

    if (!rollbackResult.success) {
      return rollbackResult
    }

    // Rollback entity-specific changes
    if (rollbackData.entityMigrations) {
      for (const entityMigration of rollbackData.entityMigrations) {
        await this.rollbackEntityMigration(entityMigration, rollbackResult)
      }
    }

    // Rollback widget-specific changes
    if (rollbackData.widgetMigrations) {
      for (const widgetMigration of rollbackData.widgetMigrations) {
        await this.rollbackWidgetMigration(widgetMigration, rollbackResult)
      }
    }

    this.logger.info('Phase 6 rollback completed', {
      success: rollbackResult.success,
      restoredFiles: rollbackResult.restoredFiles
    })

    return rollbackResult
  }

  /**
   * Test rollback operation without making changes
   */
  async testRollback(
    rollbackData: Phase6RollbackData
  ): Promise<RollbackTestResult> {
    this.logger.info('Testing rollback operation', {
      migrationId: rollbackData.migrationId
    })

    const result: RollbackTestResult = {
      testPassed: false,
      filesRestored: 0,
      importsReverted: 0,
      structureValidated: false,
      errors: [],
      warnings: []
    }

    try {
      // Verify backup integrity
      const verification = await this.verifyBackupIntegrity(rollbackData)
      if (!verification.verified) {
        result.errors.push(...verification.errors)
        result.warnings.push(...verification.warnings)
        return result
      }

      // Test file restoration (dry run)
      const dryRunResult = await this.backupOrchestrator.performIntelligentRollback(
        rollbackData,
        { dryRun: true, validateBeforeRollback: true }
      )

      result.filesRestored = dryRunResult.restoredFiles
      result.errors.push(...dryRunResult.errors)
      result.warnings.push(...dryRunResult.warnings)

      // Test import reversion
      if (rollbackData.entityMigrations) {
        for (const entityMigration of rollbackData.entityMigrations) {
          result.importsReverted += entityMigration.importUpdates.length
        }
      }

      // Validate directory structure
      result.structureValidated = await this.validateDirectoryStructure(rollbackData)

      // Overall test result
      result.testPassed = dryRunResult.success && 
                         result.errors.length === 0 && 
                         result.structureValidated

      this.logger.info('Rollback test completed', {
        testPassed: result.testPassed,
        filesRestored: result.filesRestored,
        importsReverted: result.importsReverted
      })

      return result
    } catch (error) {
      result.errors.push(`Rollback test failed: ${error.message}`)
      this.logger.error('Rollback test failed', { error: error.message })
      return result
    }
  }

  /**
   * Calculate checksums for files
   */
  private async calculateFileChecksums(filePaths: string[]): Promise<Record<string, string>> {
    const checksums: Record<string, string> = {}

    for (const filePath of filePaths) {
      try {
        const content = await fs.readFile(filePath)
        const hash = crypto.createHash('sha256')
        hash.update(content)
        checksums[filePath] = hash.digest('hex')
      } catch (error) {
        this.logger.warn(`Failed to calculate checksum for ${filePath}`, {
          error: error.message
        })
      }
    }

    return checksums
  }

  /**
   * Verify checksums match
   */
  private async verifyChecksums(
    backupPath: string,
    expectedChecksums: Record<string, string>
  ): Promise<{ allMatch: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = []
    const warnings: string[] = []
    let allMatch = true

    for (const [filePath, expectedChecksum] of Object.entries(expectedChecksums)) {
      const relativePath = path.relative(process.cwd(), filePath)
      const backupFilePath = path.join(backupPath, relativePath)

      try {
        const content = await fs.readFile(backupFilePath)
        const hash = crypto.createHash('sha256')
        hash.update(content)
        const actualChecksum = hash.digest('hex')

        if (actualChecksum !== expectedChecksum) {
          errors.push(`Checksum mismatch for ${relativePath}`)
          allMatch = false
        }
      } catch (error) {
        warnings.push(`Could not verify checksum for ${relativePath}`)
      }
    }

    return { allMatch, errors, warnings }
  }

  /**
   * Rollback entity migration
   */
  private async rollbackEntityMigration(
    entityMigration: EntityMigrationBackup,
    rollbackResult: RollbackResult
  ): Promise<void> {
    this.logger.info('Rolling back entity migration', {
      entityName: entityMigration.entityName
    })

    try {
      // Remove new entity directories
      for (const newPath of entityMigration.newPaths) {
        try {
          await fs.rm(newPath, { recursive: true, force: true })
        } catch (error) {
          rollbackResult.warnings.push(`Failed to remove ${newPath}: ${error.message}`)
        }
      }

      // Revert import updates
      for (const importUpdate of entityMigration.importUpdates) {
        try {
          await this.revertImportUpdate(importUpdate)
          rollbackResult.revertedChanges++
        } catch (error) {
          rollbackResult.warnings.push(
            `Failed to revert import in ${importUpdate.filePath}: ${error.message}`
          )
        }
      }
    } catch (error) {
      rollbackResult.errors.push(`Entity rollback failed: ${error.message}`)
    }
  }

  /**
   * Rollback widget migration
   */
  private async rollbackWidgetMigration(
    widgetMigration: WidgetMigrationBackup,
    rollbackResult: RollbackResult
  ): Promise<void> {
    this.logger.info('Rolling back widget migration', {
      widgetName: widgetMigration.widgetName
    })

    try {
      // Remove new widget directories
      for (const newPath of widgetMigration.newPaths) {
        try {
          await fs.rm(newPath, { recursive: true, force: true })
        } catch (error) {
          rollbackResult.warnings.push(`Failed to remove ${newPath}: ${error.message}`)
        }
      }
    } catch (error) {
      rollbackResult.errors.push(`Widget rollback failed: ${error.message}`)
    }
  }

  /**
   * Revert import update
   */
  private async revertImportUpdate(importUpdate: ImportUpdate): Promise<void> {
    const content = await fs.readFile(importUpdate.filePath, 'utf-8')
    const updatedContent = content.replace(importUpdate.newImport, importUpdate.oldImport)
    await fs.writeFile(importUpdate.filePath, updatedContent, 'utf-8')
  }

  /**
   * Validate directory structure
   */
  private async validateDirectoryStructure(rollbackData: Phase6RollbackData): Promise<boolean> {
    try {
      // Verify backup directory structure is intact
      const backupPath = rollbackData.backupPath
      await fs.access(backupPath)

      // Verify all original files are backed up
      for (const fileInfo of rollbackData.originalFiles) {
        const backupFilePath = path.join(backupPath, fileInfo.relativePath)
        await fs.access(backupFilePath)
      }

      return true
    } catch (error) {
      this.logger.warn('Directory structure validation failed', { error: error.message })
      return false
    }
  }

  /**
   * Save Phase 6 rollback data
   */
  private async savePhase6RollbackData(
    migrationId: string,
    rollbackData: Phase6RollbackData
  ): Promise<void> {
    const backupPath = path.join(process.cwd(), '.migration-backups', migrationId)
    await fs.mkdir(backupPath, { recursive: true })

    const metadataPath = path.join(backupPath, 'rollback-metadata.json')
    await fs.writeFile(metadataPath, JSON.stringify(rollbackData, null, 2), 'utf-8')
  }

  /**
   * Load Phase 6 rollback data
   */
  async loadPhase6RollbackData(migrationId: string): Promise<Phase6RollbackData | null> {
    const backupPath = path.join(process.cwd(), '.migration-backups', migrationId)
    const metadataPath = path.join(backupPath, 'rollback-metadata.json')

    try {
      const content = await fs.readFile(metadataPath, 'utf-8')
      return JSON.parse(content) as Phase6RollbackData
    } catch (error) {
      this.logger.error(`Failed to load Phase 6 rollback data for ${migrationId}`, {
        error: error.message
      })
      return null
    }
  }
}
