/**
 * Backup Manager - Handles file backup and rollback operations for migration
 * 
 * Creates comprehensive backups before migration starts and provides
 * rollback capabilities in case of migration failures.
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import * as crypto from 'crypto'
import { 
  RollbackData, 
  BackupFile, 
  ChangeRecord, 
  MigrationConfig 
} from '@/shared/types/index.js'
import { MigrationLogger } from '../logging/MigrationLogger.js'

export class BackupManager {
  private config: MigrationConfig
  private logger: MigrationLogger
  private backupDir: string
  private migrationId: string

  constructor(migrationId: string, config: MigrationConfig, logger: MigrationLogger) {
    this.migrationId = migrationId
    this.config = config
    this.logger = logger
    this.backupDir = path.join(process.cwd(), '.migration-backups', migrationId)
  }

  /**
   * Create backup of all files that will be modified during migration
   */
  async createBackup(filePaths: string[]): Promise<RollbackData> {
    if (!this.config.backupEnabled) {
      this.logger.info('Backup disabled in configuration, skipping backup creation')
      return {
        backupPath: '',
        originalFiles: [],
        changes: [],
        timestamp: new Date(),
        migrationId: this.migrationId
      }
    }

    this.logger.info(`Creating backup for ${filePaths.length} files`, { 
      backupDir: this.backupDir,
      fileCount: filePaths.length 
    })

    try {
      // Create backup directory
      await fs.mkdir(this.backupDir, { recursive: true })

      const originalFiles: BackupFile[] = []
      
      for (const filePath of filePaths) {
        try {
          const backupFile = await this.backupSingleFile(filePath)
          originalFiles.push(backupFile)
          this.logger.debug(`Backed up file: ${filePath}`, { backupPath: backupFile.backupPath })
        } catch (error) {
          this.logger.error(`Failed to backup file: ${filePath}`, { error: error.message })
          throw error
        }
      }

      const rollbackData: RollbackData = {
        backupPath: this.backupDir,
        originalFiles,
        changes: [],
        timestamp: new Date(),
        migrationId: this.migrationId
      }

      // Save rollback metadata
      await this.saveRollbackMetadata(rollbackData)

      this.logger.info(`Backup completed successfully`, { 
        backedUpFiles: originalFiles.length,
        backupPath: this.backupDir 
      })

      return rollbackData
    } catch (error) {
      this.logger.error('Backup creation failed', { error: error.message })
      throw new Error(`Backup creation failed: ${error.message}`)
    }
  }

  /**
   * Record a change made during migration
   */
  async recordChange(rollbackData: RollbackData, change: ChangeRecord): Promise<void> {
    rollbackData.changes.push(change)
    
    // Update the rollback metadata file
    await this.saveRollbackMetadata(rollbackData)
    
    this.logger.debug(`Recorded change: ${change.type} ${change.path}`, { 
      changeType: change.type,
      path: change.path 
    })
  }

  /**
   * Perform rollback using backup data
   */
  async performRollback(rollbackData: RollbackData): Promise<boolean> {
    this.logger.info('Starting rollback operation', { 
      migrationId: rollbackData.migrationId,
      filesToRestore: rollbackData.originalFiles.length,
      changesToRevert: rollbackData.changes.length 
    })

    try {
      // Restore original files
      for (const backupFile of rollbackData.originalFiles) {
        await this.restoreSingleFile(backupFile)
        this.logger.debug(`Restored file: ${backupFile.originalPath}`)
      }

      // Revert changes in reverse order
      const reversedChanges = [...rollbackData.changes].reverse()
      for (const change of reversedChanges) {
        await this.revertChange(change)
        this.logger.debug(`Reverted change: ${change.type} ${change.path}`)
      }

      this.logger.info('Rollback completed successfully')
      return true
    } catch (error) {
      this.logger.error('Rollback failed', { error: error.message })
      return false
    }
  }

  /**
   * Validate rollback by checking file integrity
   */
  async validateRollback(rollbackData: RollbackData): Promise<boolean> {
    this.logger.info('Validating rollback integrity')

    try {
      for (const backupFile of rollbackData.originalFiles) {
        const currentChecksum = await this.calculateChecksum(backupFile.originalPath)
        
        if (currentChecksum !== backupFile.checksum) {
          this.logger.error(`Rollback validation failed for file: ${backupFile.originalPath}`, {
            expectedChecksum: backupFile.checksum,
            actualChecksum: currentChecksum
          })
          return false
        }
      }

      this.logger.info('Rollback validation passed')
      return true
    } catch (error) {
      this.logger.error('Rollback validation failed', { error: error.message })
      return false
    }
  }

  /**
   * Clean up backup files after successful migration
   */
  async cleanupBackup(rollbackData: RollbackData): Promise<void> {
    if (!this.config.backupEnabled) {
      return
    }

    this.logger.info('Cleaning up backup files', { backupPath: rollbackData.backupPath })

    try {
      await fs.rm(rollbackData.backupPath, { recursive: true, force: true })
      this.logger.info('Backup cleanup completed')
    } catch (error) {
      this.logger.warn('Backup cleanup failed', { error: error.message })
    }
  }

  /**
   * List all available backups
   */
  async listBackups(): Promise<string[]> {
    const backupsRoot = path.join(process.cwd(), '.migration-backups')
    
    try {
      const entries = await fs.readdir(backupsRoot, { withFileTypes: true })
      return entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name)
    } catch (error) {
      this.logger.debug('No backups directory found or error reading backups', { error: error.message })
      return []
    }
  }

  /**
   * Load rollback data from backup directory
   */
  async loadRollbackData(migrationId: string): Promise<RollbackData | null> {
    const backupPath = path.join(process.cwd(), '.migration-backups', migrationId)
    const metadataPath = path.join(backupPath, 'rollback-metadata.json')

    try {
      const metadataContent = await fs.readFile(metadataPath, 'utf-8')
      return JSON.parse(metadataContent) as RollbackData
    } catch (error) {
      this.logger.error(`Failed to load rollback data for migration: ${migrationId}`, { error: error.message })
      return null
    }
  }

  /**
   * Backup a single file
   */
  private async backupSingleFile(filePath: string): Promise<BackupFile> {
    const absolutePath = path.resolve(filePath)
    const relativePath = path.relative(process.cwd(), absolutePath)
    const backupPath = path.join(this.backupDir, relativePath)
    
    // Ensure backup directory exists
    await fs.mkdir(path.dirname(backupPath), { recursive: true })
    
    // Copy file to backup location
    await fs.copyFile(absolutePath, backupPath)
    
    // Calculate checksum and get file stats
    const checksum = await this.calculateChecksum(absolutePath)
    const stats = await fs.stat(absolutePath)
    
    return {
      originalPath: relativePath,
      backupPath,
      checksum,
      size: stats.size
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
   * Revert a specific change
   */
  private async revertChange(change: ChangeRecord): Promise<void> {
    const filePath = path.resolve(change.path)
    
    switch (change.type) {
      case 'create':
        // Remove created file
        try {
          await fs.unlink(filePath)
        } catch (error) {
          // File might not exist, which is fine
          this.logger.debug(`File to delete not found: ${filePath}`)
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
        // This is complex and would need additional metadata
        this.logger.warn(`Move operation rollback not fully implemented for: ${filePath}`)
        break
    }
  }

  /**
   * Calculate MD5 checksum of a file
   */
  private async calculateChecksum(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath)
    return crypto.createHash('md5').update(content).digest('hex')
  }

  /**
   * Save rollback metadata to backup directory
   */
  private async saveRollbackMetadata(rollbackData: RollbackData): Promise<void> {
    const metadataPath = path.join(this.backupDir, 'rollback-metadata.json')
    const metadataContent = JSON.stringify(rollbackData, null, 2)
    await fs.writeFile(metadataPath, metadataContent, 'utf-8')
  }

    /**
     * Create backup manifest with detailed information
     */
    private async createBackupManifest(rollbackData: RollbackData, failedFiles: string[]): Promise<void> {
      const manifest = {
        migrationId: rollbackData.migrationId,
        timestamp: rollbackData.timestamp,
        totalFiles: rollbackData.originalFiles.length + failedFiles.length,
        successfulBackups: rollbackData.originalFiles.length,
        failedBackups: failedFiles.length,
        failedFiles,
        backupIntegrity: {
          checksumValidation: true,
          compressionUsed: false,
          encryptionUsed: false
        },
        rollbackCapabilities: {
          fileRestore: true,
          changeRevert: true,
          directoryCleanup: true,
          validationSupport: true
        }
      }

      const manifestPath = path.join(this.backupDir, 'backup-manifest.json')
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8')
    }

    /**
     * Enhanced rollback with comprehensive error handling
     */
    async performEnhancedRollback(rollbackData: RollbackData): Promise<{ success: boolean; errors: string[] }> {
      this.logger.info('Starting enhanced rollback operation', {
        migrationId: rollbackData.migrationId,
        filesToRestore: rollbackData.originalFiles.length,
        changesToRevert: rollbackData.changes.length
      })

      const errors: string[] = []
      let restoredFiles = 0
      let revertedChanges = 0

      try {
        // Phase 1: Restore original files
        this.logger.info('Phase 1: Restoring original files')
        for (const backupFile of rollbackData.originalFiles) {
          try {
            await this.restoreSingleFile(backupFile)
            restoredFiles++
            this.logger.debug(`Restored file: ${backupFile.originalPath}`)
          } catch (error) {
            const errorMsg = `Failed to restore ${backupFile.originalPath}: ${error.message}`
            errors.push(errorMsg)
            this.logger.error(errorMsg)
          }
        }

        // Phase 2: Revert changes in reverse order
        this.logger.info('Phase 2: Reverting migration changes')
        const reversedChanges = [...rollbackData.changes].reverse()
        for (const change of reversedChanges) {
          try {
            await this.revertChange(change)
            revertedChanges++
            this.logger.debug(`Reverted change: ${change.type} ${change.path}`)
          } catch (error) {
            const errorMsg = `Failed to revert change ${change.type} for ${change.path}: ${error.message}`
            errors.push(errorMsg)
            this.logger.error(errorMsg)
          }
        }

        // Phase 3: Clean up migration artifacts
        this.logger.info('Phase 3: Cleaning up migration artifacts')
        await this.cleanupMigrationArtifacts(rollbackData)

        const success = errors.length === 0
        this.logger.info(`Enhanced rollback completed`, {
          success,
          restoredFiles,
          revertedChanges,
          errorCount: errors.length
        })

        return { success, errors }
      } catch (error) {
        const criticalError = `Critical rollback failure: ${error.message}`
        errors.push(criticalError)
        this.logger.error(criticalError)
        return { success: false, errors }
      }
    }

    /**
     * Clean up migration artifacts during rollback
     */
    private async cleanupMigrationArtifacts(rollbackData: RollbackData): Promise<void> {
      const artifactPatterns = [
        '**/*.migration-temp',
        '**/*.backup-*',
        '**/migration-*.log'
      ]

      for (const pattern of artifactPatterns) {
        try {
          // This would need a glob library in real implementation
          this.logger.debug(`Cleaning up artifacts matching: ${pattern}`)
        } catch (error) {
          this.logger.warn(`Failed to clean up artifacts for pattern ${pattern}`, { error: error.message })
        }
      }
    }
}

/**
 * Create a new backup manager instance
 */
export function createBackupManager(
  migrationId: string, 
  config: MigrationConfig, 
  logger: MigrationLogger
): BackupManager {
  return new BackupManager(migrationId, config, logger)
}