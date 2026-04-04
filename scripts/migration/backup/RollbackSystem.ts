/**
 * Rollback System - Comprehensive rollback capabilities for migration operations
 * 
 * Provides enhanced rollback functionality with detailed validation,
 * error recovery, and comprehensive cleanup of migration artifacts.
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { glob } from 'glob'
import { 
  RollbackData, 
  BackupFile, 
  ChangeRecord, 
  MigrationConfig 
} from '@/shared/types/index.js'
import { MigrationLogger } from '../logging/MigrationLogger.js'
import { ErrorHandlingSystem, ErrorContext } from './ErrorHandlingSystem.js'

export interface RollbackResult {
  success: boolean
  restoredFiles: number
  revertedChanges: number
  cleanedArtifacts: number
  errors: string[]
  warnings: string[]
  validationPassed: boolean
}

export interface RollbackOptions {
  validateBeforeRollback: boolean
  cleanupArtifacts: boolean
  preserveBackup: boolean
  dryRun: boolean
  continueOnError: boolean
}

export class RollbackSystem {
  private config: MigrationConfig
  private logger: MigrationLogger
  private errorHandler: ErrorHandlingSystem

  constructor(
    config: MigrationConfig, 
    logger: MigrationLogger, 
    errorHandler: ErrorHandlingSystem
  ) {
    this.config = config
    this.logger = logger
    this.errorHandler = errorHandler
  }

  /**
   * Perform comprehensive rollback with enhanced error handling
   */
  async performRollback(
    rollbackData: RollbackData, 
    options: Partial<RollbackOptions> = {}
  ): Promise<RollbackResult> {
    const rollbackOptions: RollbackOptions = {
      validateBeforeRollback: true,
      cleanupArtifacts: true,
      preserveBackup: false,
      dryRun: false,
      continueOnError: true,
      ...options
    }

    this.logger.info('Starting comprehensive rollback operation', { 
      migrationId: rollbackData.migrationId,
      filesToRestore: rollbackData.originalFiles.length,
      changesToRevert: rollbackData.changes.length,
      options: rollbackOptions
    })

    const result: RollbackResult = {
      success: false,
      restoredFiles: 0,
      revertedChanges: 0,
      cleanedArtifacts: 0,
      errors: [],
      warnings: [],
      validationPassed: false
    }

    try {
      // Pre-rollback validation
      if (rollbackOptions.validateBeforeRollback) {
        const validationResult = await this.validateRollbackPreconditions(rollbackData)
        if (!validationResult.valid) {
          result.errors.push(...validationResult.errors)
          result.warnings.push(...validationResult.warnings)
          if (!rollbackOptions.continueOnError) {
            return result
          }
        }
      }

      // Phase 1: Restore original files
      const restoreResult = await this.restoreOriginalFiles(rollbackData, rollbackOptions)
      result.restoredFiles = restoreResult.successCount
      result.errors.push(...restoreResult.errors)
      result.warnings.push(...restoreResult.warnings)

      // Phase 2: Revert migration changes
      const revertResult = await this.revertMigrationChanges(rollbackData, rollbackOptions)
      result.revertedChanges = revertResult.successCount
      result.errors.push(...revertResult.errors)
      result.warnings.push(...revertResult.warnings)

      // Phase 3: Clean up migration artifacts
      if (rollbackOptions.cleanupArtifacts) {
        const cleanupResult = await this.cleanupMigrationArtifacts(rollbackData, rollbackOptions)
        result.cleanedArtifacts = cleanupResult.successCount
        result.errors.push(...cleanupResult.errors)
        result.warnings.push(...cleanupResult.warnings)
      }

      // Phase 4: Post-rollback validation
      const postValidation = await this.validateRollbackSuccess(rollbackData)
      result.validationPassed = postValidation.valid
      result.errors.push(...postValidation.errors)
      result.warnings.push(...postValidation.warnings)

      // Phase 5: Cleanup backup if requested
      if (!rollbackOptions.preserveBackup && result.validationPassed) {
        await this.cleanupBackupFiles(rollbackData)
      }

      result.success = result.errors.length === 0 && result.validationPassed

      this.logger.info(`Rollback operation completed`, {
        success: result.success,
        restoredFiles: result.restoredFiles,
        revertedChanges: result.revertedChanges,
        cleanedArtifacts: result.cleanedArtifacts,
        errorCount: result.errors.length,
        warningCount: result.warnings.length
      })

      return result
    } catch (error) {
      const criticalError = `Critical rollback failure: ${error.message}`
      result.errors.push(criticalError)
      this.logger.error(criticalError, { stack: error.stack })
      return result
    }
  }

  /**
   * Validate preconditions before starting rollback
   */
  private async validateRollbackPreconditions(rollbackData: RollbackData): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    // Check if backup directory exists
    try {
      await fs.access(rollbackData.backupPath)
    } catch (error) {
      errors.push(`Backup directory not found: ${rollbackData.backupPath}`)
    }

    // Validate backup file integrity
    for (const backupFile of rollbackData.originalFiles) {
      try {
        await fs.access(backupFile.backupPath)
        
        // Verify backup file checksum if possible
        const stats = await fs.stat(backupFile.backupPath)
        if (stats.size !== backupFile.size) {
          warnings.push(`Backup file size mismatch: ${backupFile.backupPath}`)
        }
      } catch (error) {
        errors.push(`Backup file not accessible: ${backupFile.backupPath}`)
      }
    }

    // Check for conflicting processes or locks
    const conflictCheck = await this.checkForConflicts(rollbackData)
    errors.push(...conflictCheck.errors)
    warnings.push(...conflictCheck.warnings)

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Restore original files from backup
   */
  private async restoreOriginalFiles(
    rollbackData: RollbackData, 
    options: RollbackOptions
  ): Promise<{ successCount: number; errors: string[]; warnings: string[] }> {
    const errors: string[] = []
    const warnings: string[] = []
    let successCount = 0

    this.logger.info('Restoring original files from backup')

    for (const backupFile of rollbackData.originalFiles) {
      try {
        if (options.dryRun) {
          this.logger.debug(`[DRY RUN] Would restore: ${backupFile.originalPath}`)
          successCount++
          continue
        }

        await this.restoreSingleFile(backupFile)
        successCount++
        this.logger.debug(`Restored file: ${backupFile.originalPath}`)
      } catch (error) {
        const errorMsg = `Failed to restore ${backupFile.originalPath}: ${error.message}`
        
        if (options.continueOnError) {
          errors.push(errorMsg)
          this.logger.error(errorMsg)
        } else {
          throw new Error(errorMsg)
        }
      }
    }

    return { successCount, errors, warnings }
  }

  /**
   * Revert migration changes in reverse order
   */
  private async revertMigrationChanges(
    rollbackData: RollbackData, 
    options: RollbackOptions
  ): Promise<{ successCount: number; errors: string[]; warnings: string[] }> {
    const errors: string[] = []
    const warnings: string[] = []
    let successCount = 0

    this.logger.info('Reverting migration changes')

    const reversedChanges = [...rollbackData.changes].reverse()
    
    for (const change of reversedChanges) {
      try {
        if (options.dryRun) {
          this.logger.debug(`[DRY RUN] Would revert: ${change.type} ${change.path}`)
          successCount++
          continue
        }

        await this.revertSingleChange(change)
        successCount++
        this.logger.debug(`Reverted change: ${change.type} ${change.path}`)
      } catch (error) {
        const errorMsg = `Failed to revert change ${change.type} for ${change.path}: ${error.message}`
        
        if (options.continueOnError) {
          errors.push(errorMsg)
          this.logger.error(errorMsg)
        } else {
          throw new Error(errorMsg)
        }
      }
    }

    return { successCount, errors, warnings }
  }

  /**
   * Clean up migration artifacts
   */
  private async cleanupMigrationArtifacts(
    rollbackData: RollbackData, 
    options: RollbackOptions
  ): Promise<{ successCount: number; errors: string[]; warnings: string[] }> {
    const errors: string[] = []
    const warnings: string[] = []
    let successCount = 0

    this.logger.info('Cleaning up migration artifacts')

    const artifactPatterns = [
      '**/*.migration-temp',
      '**/*.backup-*',
      '**/migration-*.log',
      '**/.migration-*',
      '**/temp-migration-*'
    ]

    for (const pattern of artifactPatterns) {
      try {
        const files = await glob(pattern, { 
          cwd: process.cwd(),
          ignore: ['node_modules/**', '.git/**']
        })

        for (const file of files) {
          try {
            if (options.dryRun) {
              this.logger.debug(`[DRY RUN] Would delete artifact: ${file}`)
              successCount++
              continue
            }

            await fs.unlink(file)
            successCount++
            this.logger.debug(`Cleaned up artifact: ${file}`)
          } catch (error) {
            warnings.push(`Failed to clean up artifact ${file}: ${error.message}`)
          }
        }
      } catch (error) {
        warnings.push(`Failed to find artifacts for pattern ${pattern}: ${error.message}`)
      }
    }

    return { successCount, errors, warnings }
  }

  /**
   * Validate rollback success
   */
  private async validateRollbackSuccess(rollbackData: RollbackData): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    this.logger.info('Validating rollback success')

    // Verify all original files are restored with correct checksums
    for (const backupFile of rollbackData.originalFiles) {
      try {
        const currentChecksum = await this.calculateChecksum(backupFile.originalPath)
        
        if (currentChecksum !== backupFile.checksum) {
          errors.push(`File checksum mismatch after rollback: ${backupFile.originalPath}`)
        }
      } catch (error) {
        errors.push(`Cannot validate restored file: ${backupFile.originalPath}`)
      }
    }

    // Check that migration changes were properly reverted
    for (const change of rollbackData.changes) {
      const validationResult = await this.validateChangeReversion(change)
      if (!validationResult.valid) {
        errors.push(`Change not properly reverted: ${change.type} ${change.path}`)
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Restore a single file from backup
   */
  private async restoreSingleFile(backupFile: BackupFile): Promise<void> {
    const originalPath = path.resolve(backupFile.originalPath)
    
    // Ensure target directory exists
    await fs.mkdir(path.dirname(originalPath), { recursive: true })
    
    // Copy file from backup to original location
    await fs.copyFile(backupFile.backupPath, originalPath)
  }

  /**
   * Revert a single change
   */
  private async revertSingleChange(change: ChangeRecord): Promise<void> {
    const filePath = path.resolve(change.path)
    
    switch (change.type) {
      case 'create':
        // Remove created file
        try {
          await fs.unlink(filePath)
        } catch (error) {
          if (error.code !== 'ENOENT') {
            throw error
          }
        }
        break
        
      case 'delete':
        // Restore deleted file content
        if (change.oldContent) {
          await fs.mkdir(path.dirname(filePath), { recursive: true })
          await fs.writeFile(filePath, change.oldContent, 'utf-8')
        }
        break
        
      case 'modify':
        // Restore original content
        if (change.oldContent) {
          await fs.writeFile(filePath, change.oldContent, 'utf-8')
        }
        break
        
      case 'move':
        // Handle move operations (would need source/target paths)
        this.logger.warn(`Move operation rollback requires additional implementation: ${filePath}`)
        break
    }
  }

  /**
   * Validate that a change was properly reverted
   */
  private async validateChangeReversion(change: ChangeRecord): Promise<{ valid: boolean }> {
    const filePath = path.resolve(change.path)
    
    try {
      switch (change.type) {
        case 'create':
          // File should not exist
          await fs.access(filePath)
          return { valid: false } // File still exists
          
        case 'delete':
          // File should exist with original content
          if (change.oldContent) {
            const currentContent = await fs.readFile(filePath, 'utf-8')
            return { valid: currentContent === change.oldContent }
          }
          return { valid: true }
          
        case 'modify':
          // File should have original content
          if (change.oldContent) {
            const currentContent = await fs.readFile(filePath, 'utf-8')
            return { valid: currentContent === change.oldContent }
          }
          return { valid: true }
          
        default:
          return { valid: true }
      }
    } catch (error) {
      if (change.type === 'create' && error.code === 'ENOENT') {
        return { valid: true } // File doesn't exist, which is correct for reverted create
      }
      return { valid: false }
    }
  }

  /**
   * Check for conflicts that might prevent rollback
   */
  private async checkForConflicts(rollbackData: RollbackData): Promise<{
    errors: string[]
    warnings: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    // Check for file locks or processes using files
    for (const backupFile of rollbackData.originalFiles) {
      try {
        // Try to open file for writing to check if it's locked
        const handle = await fs.open(backupFile.originalPath, 'r+')
        await handle.close()
      } catch (error) {
        if (error.code === 'EBUSY' || error.code === 'EACCES') {
          warnings.push(`File may be locked or in use: ${backupFile.originalPath}`)
        }
      }
    }

    return { errors, warnings }
  }

  /**
   * Calculate file checksum for validation
   */
  private async calculateChecksum(filePath: string): Promise<string> {
    const crypto = await import('crypto')
    const content = await fs.readFile(filePath)
    return crypto.createHash('md5').update(content).digest('hex')
  }

  /**
   * Clean up backup files after successful rollback
   */
  private async cleanupBackupFiles(rollbackData: RollbackData): Promise<void> {
    try {
      await fs.rm(rollbackData.backupPath, { recursive: true, force: true })
      this.logger.info(`Backup files cleaned up: ${rollbackData.backupPath}`)
    } catch (error) {
      this.logger.warn(`Failed to clean up backup files: ${error.message}`)
    }
  }
}

/**
 * Create rollback system instance
 */
export function createRollbackSystem(
  config: MigrationConfig, 
  logger: MigrationLogger, 
  errorHandler: ErrorHandlingSystem
): RollbackSystem {
  return new RollbackSystem(config, logger, errorHandler)
}