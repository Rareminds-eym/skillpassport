/**
 * Backup Orchestrator - Coordinates comprehensive backup and rollback operations
 * 
 * Integrates BackupManager, ErrorHandlingSystem, and RollbackSystem to provide
 * a unified interface for all backup and recovery operations during migration.
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { 
  RollbackData, 
  MigrationConfig,
  MigrationResult 
} from '../types/index.js'
import { MigrationLogger } from '../logging/MigrationLogger.js'
import { BackupManager } from './BackupManager.js'
import { ErrorHandlingSystem, ErrorContext } from './ErrorHandlingSystem.js'
import { RollbackSystem, RollbackOptions, RollbackResult } from './RollbackSystem.js'

export interface BackupStrategy {
  incremental: boolean
  compression: boolean
  encryption: boolean
  checksumValidation: boolean
  retentionDays: number
}

export interface BackupOrchestrationResult {
  success: boolean
  backupCreated: boolean
  rollbackData?: RollbackData
  errors: string[]
  warnings: string[]
  backupPath?: string
  backupSize?: number
}

export class BackupOrchestrator {
  private config: MigrationConfig
  private logger: MigrationLogger
  private backupManager: BackupManager
  private errorHandler: ErrorHandlingSystem
  private rollbackSystem: RollbackSystem
  private migrationId: string

  constructor(
    migrationId: string,
    config: MigrationConfig,
    logger: MigrationLogger
  ) {
    this.migrationId = migrationId
    this.config = config
    this.logger = logger
    
    // Initialize subsystems
    this.backupManager = new BackupManager(migrationId, config, logger)
    this.errorHandler = new ErrorHandlingSystem(config, logger)
    this.rollbackSystem = new RollbackSystem(config, logger, this.errorHandler)
  }

  /**
   * Create comprehensive backup before migration
   */
  async createComprehensiveBackup(
    filePaths: string[],
    strategy: Partial<BackupStrategy> = {}
  ): Promise<BackupOrchestrationResult> {
    const backupStrategy: BackupStrategy = {
      incremental: false,
      compression: false,
      encryption: false,
      checksumValidation: true,
      retentionDays: 30,
      ...strategy
    }

    this.logger.info('Starting comprehensive backup creation', {
      migrationId: this.migrationId,
      fileCount: filePaths.length,
      strategy: backupStrategy
    })

    const result: BackupOrchestrationResult = {
      success: false,
      backupCreated: false,
      errors: [],
      warnings: []
    }

    try {
      // Pre-backup validation
      const validationResult = await this.validateBackupPreconditions(filePaths)
      result.warnings.push(...validationResult.warnings)
      
      if (validationResult.errors.length > 0) {
        result.errors.push(...validationResult.errors)
        return result
      }

      // Create backup with enhanced error handling
      const rollbackData = await this.createBackupWithErrorHandling(filePaths, backupStrategy)
      
      if (rollbackData) {
        result.backupCreated = true
        result.rollbackData = rollbackData
        result.backupPath = rollbackData.backupPath
        result.backupSize = await this.calculateBackupSize(rollbackData.backupPath)
        
        // Save backup metadata
        await this.saveBackupMetadata(rollbackData, backupStrategy)
        
        result.success = true
        this.logger.info('Comprehensive backup completed successfully', {
          backupPath: result.backupPath,
          backupSize: result.backupSize,
          fileCount: rollbackData.originalFiles.length
        })
      }

      return result
    } catch (error) {
      const errorContext: ErrorContext = {
        operation: 'comprehensive-backup',
        phase: 'creation',
        migrationId: this.migrationId,
        timestamp: new Date()
      }

      const migrationError = await this.errorHandler.handleError(error, errorContext)
      result.errors.push(migrationError.message)
      
      this.logger.error('Comprehensive backup failed', { error: error.message })
      return result
    }
  }

  /**
   * Perform intelligent rollback with comprehensive validation
   */
  async performIntelligentRollback(
    rollbackData: RollbackData,
    options: Partial<RollbackOptions> = {}
  ): Promise<RollbackResult> {
    this.logger.info('Starting intelligent rollback operation', {
      migrationId: rollbackData.migrationId,
      options
    })

    try {
      // Enhanced rollback with error handling integration
      const rollbackResult = await this.rollbackSystem.performRollback(rollbackData, options)
      
      // Save rollback report
      await this.saveRollbackReport(rollbackData, rollbackResult)
      
      // Update backup retention if rollback was successful
      if (rollbackResult.success && !options.preserveBackup) {
        await this.updateBackupRetention(rollbackData)
      }

      return rollbackResult
    } catch (error) {
      const errorContext: ErrorContext = {
        operation: 'intelligent-rollback',
        phase: 'execution',
        migrationId: rollbackData.migrationId,
        timestamp: new Date()
      }

      await this.errorHandler.handleError(error, errorContext)
      
      return {
        success: false,
        restoredFiles: 0,
        revertedChanges: 0,
        cleanedArtifacts: 0,
        errors: [error.message],
        warnings: [],
        validationPassed: false
      }
    }
  }

  /**
   * Validate backup preconditions
   */
  private async validateBackupPreconditions(filePaths: string[]): Promise<{
    errors: string[]
    warnings: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    // Check disk space
    const requiredSpace = await this.estimateBackupSpace(filePaths)
    const availableSpace = await this.getAvailableDiskSpace()
    
    if (requiredSpace > availableSpace) {
      errors.push(`Insufficient disk space. Required: ${requiredSpace}MB, Available: ${availableSpace}MB`)
    } else if (requiredSpace > availableSpace * 0.8) {
      warnings.push(`Low disk space. Required: ${requiredSpace}MB, Available: ${availableSpace}MB`)
    }

    // Check file accessibility
    const inaccessibleFiles: string[] = []
    for (const filePath of filePaths) {
      try {
        await fs.access(filePath, fs.constants.R_OK)
      } catch (error) {
        inaccessibleFiles.push(filePath)
      }
    }

    if (inaccessibleFiles.length > 0) {
      warnings.push(`Some files are not accessible: ${inaccessibleFiles.join(', ')}`)
    }

    // Check backup directory permissions
    const backupDir = path.join(process.cwd(), '.migration-backups')
    try {
      await fs.mkdir(backupDir, { recursive: true })
      await fs.access(backupDir, fs.constants.W_OK)
    } catch (error) {
      errors.push(`Cannot create or write to backup directory: ${backupDir}`)
    }

    return { errors, warnings }
  }

  /**
   * Create backup with comprehensive error handling
   */
  private async createBackupWithErrorHandling(
    filePaths: string[],
    strategy: BackupStrategy
  ): Promise<RollbackData | null> {
    try {
      const rollbackData = await this.backupManager.createBackup(filePaths)
      
      // Apply backup strategy enhancements
      if (strategy.compression) {
        await this.compressBackup(rollbackData)
      }
      
      if (strategy.encryption) {
        await this.encryptBackup(rollbackData)
      }
      
      return rollbackData
    } catch (error) {
      const errorContext: ErrorContext = {
        operation: 'backup-creation',
        phase: 'file-backup',
        migrationId: this.migrationId,
        timestamp: new Date()
      }

      await this.errorHandler.handleError(error, errorContext)
      return null
    }
  }

  /**
   * Estimate required backup space
   */
  private async estimateBackupSpace(filePaths: string[]): Promise<number> {
    let totalSize = 0
    
    for (const filePath of filePaths) {
      try {
        const stats = await fs.stat(filePath)
        totalSize += stats.size
      } catch (error) {
        // Skip inaccessible files
      }
    }
    
    // Convert to MB and add 20% overhead
    return Math.ceil((totalSize / (1024 * 1024)) * 1.2)
  }

  /**
   * Get available disk space
   */
  private async getAvailableDiskSpace(): Promise<number> {
    try {
      const stats = await fs.statfs(process.cwd())
      return Math.floor((stats.bavail * stats.bsize) / (1024 * 1024))
    } catch (error) {
      // Return conservative estimate if unable to check
      return 1000 // 1GB
    }
  }

  /**
   * Calculate backup size
   */
  private async calculateBackupSize(backupPath: string): Promise<number> {
    try {
      const stats = await fs.stat(backupPath)
      return stats.size
    } catch (error) {
      return 0
    }
  }

  /**
   * Save backup metadata
   */
  private async saveBackupMetadata(
    rollbackData: RollbackData,
    strategy: BackupStrategy
  ): Promise<void> {
    const metadata = {
      migrationId: rollbackData.migrationId,
      timestamp: rollbackData.timestamp,
      strategy,
      fileCount: rollbackData.originalFiles.length,
      backupPath: rollbackData.backupPath,
      version: '1.0.0'
    }

    const metadataPath = path.join(rollbackData.backupPath, 'backup-metadata.json')
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8')
  }

  /**
   * Save rollback report
   */
  private async saveRollbackReport(
    rollbackData: RollbackData,
    rollbackResult: RollbackResult
  ): Promise<void> {
    const report = {
      migrationId: rollbackData.migrationId,
      rollbackTimestamp: new Date(),
      result: rollbackResult,
      backupPath: rollbackData.backupPath
    }

    const reportPath = path.join(rollbackData.backupPath, 'rollback-report.json')
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8')
  }

  /**
   * Update backup retention policy
   */
  private async updateBackupRetention(rollbackData: RollbackData): Promise<void> {
    // Mark backup for cleanup based on retention policy
    const retentionPath = path.join(rollbackData.backupPath, 'retention-info.json')
    const retentionInfo = {
      createdAt: rollbackData.timestamp,
      rollbackCompleted: new Date(),
      retentionDays: 7, // Keep for 7 days after successful rollback
      autoCleanup: true
    }

    await fs.writeFile(retentionPath, JSON.stringify(retentionInfo, null, 2), 'utf-8')
  }

  /**
   * Compress backup (placeholder for future implementation)
   */
  private async compressBackup(rollbackData: RollbackData): Promise<void> {
    this.logger.debug('Backup compression not yet implemented')
    // Future: Implement backup compression using tar/gzip
  }

  /**
   * Encrypt backup (placeholder for future implementation)
   */
  private async encryptBackup(rollbackData: RollbackData): Promise<void> {
    this.logger.debug('Backup encryption not yet implemented')
    // Future: Implement backup encryption
  }

  /**
   * List all available backups
   */
  async listAvailableBackups(): Promise<Array<{
    migrationId: string
    timestamp: Date
    fileCount: number
    backupPath: string
    size: number
  }>> {
    const backups = await this.backupManager.listBackups()
    const backupDetails = []

    for (const migrationId of backups) {
      try {
        const rollbackData = await this.backupManager.loadRollbackData(migrationId)
        if (rollbackData) {
          const size = await this.calculateBackupSize(rollbackData.backupPath)
          backupDetails.push({
            migrationId,
            timestamp: rollbackData.timestamp,
            fileCount: rollbackData.originalFiles.length,
            backupPath: rollbackData.backupPath,
            size
          })
        }
      } catch (error) {
        this.logger.warn(`Failed to load backup details for ${migrationId}`, { error: error.message })
      }
    }

    return backupDetails
  }

  /**
   * Get error handler for external access
   */
  getErrorHandler(): ErrorHandlingSystem {
    return this.errorHandler
  }

  /**
   * Get rollback system for external access
   */
  getRollbackSystem(): RollbackSystem {
    return this.rollbackSystem
  }
}

/**
 * Create backup orchestrator instance
 */
export function createBackupOrchestrator(
  migrationId: string,
  config: MigrationConfig,
  logger: MigrationLogger
): BackupOrchestrator {
  return new BackupOrchestrator(migrationId, config, logger)
}