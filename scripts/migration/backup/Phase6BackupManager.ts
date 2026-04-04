/**
 * Phase 6 Backup Manager
 * 
 * Implements backup system for legacy directories with rollback functionality
 * and integrity verification.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

export interface BackupMetadata {
  id: string;
  timestamp: Date;
  directories: string[];
  fileCount: number;
  totalSize: number;
  checksums: Map<string, string>;
}

export interface BackupResult {
  success: boolean;
  backupId: string;
  filesBackedUp: number;
  errors: string[];
}

export interface RollbackResult {
  success: boolean;
  filesRestored: number;
  errors: string[];
}

export class Phase6BackupManager {
  private backupDir: string;
  private srcDir: string;

  constructor(srcDir: string = 'src', backupDir: string = '.migration-backups') {
    this.srcDir = srcDir;
    this.backupDir = backupDir;
  }

  /**
   * Create backup of legacy directories
   */
  async createBackup(directories: string[]): Promise<BackupResult> {
    const backupId = this.generateBackupId();
    const backupPath = path.join(this.backupDir, backupId);
    const errors: string[] = [];
    let filesBackedUp = 0;

    try {
      // Create backup directory
      await fs.mkdir(backupPath, { recursive: true });

      // Backup each directory
      for (const dir of directories) {
        const sourcePath = path.join(this.srcDir, dir);
        const targetPath = path.join(backupPath, dir);

        try {
          const count = await this.copyDirectory(sourcePath, targetPath);
          filesBackedUp += count;
        } catch (error) {
          errors.push(`Failed to backup ${dir}: ${error}`);
        }
      }

      // Generate checksums
      const checksums = await this.generateChecksums(backupPath);

      // Save metadata
      const metadata: BackupMetadata = {
        id: backupId,
        timestamp: new Date(),
        directories,
        fileCount: filesBackedUp,
        totalSize: await this.calculateDirectorySize(backupPath),
        checksums
      };

      await this.saveMetadata(backupPath, metadata);

      console.log(`✅ Backup created: ${backupId} (${filesBackedUp} files)`);

      return {
        success: errors.length === 0,
        backupId,
        filesBackedUp,
        errors
      };
    } catch (error) {
      errors.push(`Backup failed: ${error}`);
      return {
        success: false,
        backupId,
        filesBackedUp,
        errors
      };
    }
  }

  /**
   * Rollback from backup
   */
  async rollback(backupId: string): Promise<RollbackResult> {
    const backupPath = path.join(this.backupDir, backupId);
    const errors: string[] = [];
    let filesRestored = 0;

    try {
      // Load metadata
      const metadata = await this.loadMetadata(backupPath);

      // Verify backup integrity
      const isValid = await this.verifyBackupIntegrity(backupPath, metadata);
      if (!isValid) {
        throw new Error('Backup integrity check failed');
      }

      // Restore each directory
      for (const dir of metadata.directories) {
        const sourcePath = path.join(backupPath, dir);
        const targetPath = path.join(this.srcDir, dir);

        try {
          // Remove current directory
          await fs.rm(targetPath, { recursive: true, force: true });

          // Restore from backup
          const count = await this.copyDirectory(sourcePath, targetPath);
          filesRestored += count;
        } catch (error) {
          errors.push(`Failed to restore ${dir}: ${error}`);
        }
      }

      console.log(`✅ Rollback completed: ${filesRestored} files restored`);

      return {
        success: errors.length === 0,
        filesRestored,
        errors
      };
    } catch (error) {
      errors.push(`Rollback failed: ${error}`);
      return {
        success: false,
        filesRestored,
        errors
      };
    }
  }

  /**
   * Verify backup integrity
   */
  async verifyBackupIntegrity(backupPath: string, metadata: BackupMetadata): Promise<boolean> {
    try {
      // Recalculate checksums
      const currentChecksums = await this.generateChecksums(backupPath);

      // Compare with stored checksums
      for (const [file, checksum] of metadata.checksums) {
        const currentChecksum = currentChecksums.get(file);
        if (currentChecksum !== checksum) {
          console.error(`Checksum mismatch for ${file}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Integrity verification failed:', error);
      return false;
    }
  }

  /**
   * List all backups
   */
  async listBackups(): Promise<BackupMetadata[]> {
    try {
      const entries = await fs.readdir(this.backupDir, { withFileTypes: true });
      const backups: BackupMetadata[] = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const backupPath = path.join(this.backupDir, entry.name);
          try {
            const metadata = await this.loadMetadata(backupPath);
            backups.push(metadata);
          } catch (error) {
            console.warn(`Could not load metadata for ${entry.name}`);
          }
        }
      }

      return backups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      return [];
    }
  }

  /**
   * Delete old backups (keep last N)
   */
  async cleanupOldBackups(keepCount: number = 5): Promise<void> {
    const backups = await this.listBackups();
    
    if (backups.length <= keepCount) {
      return;
    }

    const toDelete = backups.slice(keepCount);
    
    for (const backup of toDelete) {
      const backupPath = path.join(this.backupDir, backup.id);
      await fs.rm(backupPath, { recursive: true, force: true });
      console.log(`🗑️  Deleted old backup: ${backup.id}`);
    }
  }

  /**
   * Copy directory recursively
   */
  private async copyDirectory(source: string, target: string): Promise<number> {
    let fileCount = 0;

    try {
      await fs.mkdir(target, { recursive: true });
      const entries = await fs.readdir(source, { withFileTypes: true });

      for (const entry of entries) {
        const sourcePath = path.join(source, entry.name);
        const targetPath = path.join(target, entry.name);

        if (entry.isDirectory()) {
          fileCount += await this.copyDirectory(sourcePath, targetPath);
        } else {
          await fs.copyFile(sourcePath, targetPath);
          fileCount++;
        }
      }
    } catch (error) {
      // Directory might not exist, which is okay
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
    }

    return fileCount;
  }

  /**
   * Generate checksums for all files in directory
   */
  private async generateChecksums(dir: string): Promise<Map<string, string>> {
    const checksums = new Map<string, string>();
    await this.generateChecksumsRecursive(dir, dir, checksums);
    return checksums;
  }

  /**
   * Generate checksums recursively
   */
  private async generateChecksumsRecursive(
    baseDir: string,
    currentDir: string,
    checksums: Map<string, string>
  ): Promise<void> {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          await this.generateChecksumsRecursive(baseDir, fullPath, checksums);
        } else if (entry.name !== 'metadata.json') {
          const content = await fs.readFile(fullPath);
          const hash = crypto.createHash('sha256').update(content).digest('hex');
          const relativePath = path.relative(baseDir, fullPath);
          checksums.set(relativePath, hash);
        }
      }
    } catch (error) {
      console.warn(`Could not generate checksums for ${currentDir}:`, error);
    }
  }

  /**
   * Calculate total size of directory
   */
  private async calculateDirectorySize(dir: string): Promise<number> {
    let totalSize = 0;

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          totalSize += await this.calculateDirectorySize(fullPath);
        } else {
          const stats = await fs.stat(fullPath);
          totalSize += stats.size;
        }
      }
    } catch (error) {
      console.warn(`Could not calculate size for ${dir}:`, error);
    }

    return totalSize;
  }

  /**
   * Generate unique backup ID
   */
  private generateBackupId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `backup-${timestamp}`;
  }

  /**
   * Save backup metadata
   */
  private async saveMetadata(backupPath: string, metadata: BackupMetadata): Promise<void> {
    const metadataPath = path.join(backupPath, 'metadata.json');
    const data = {
      ...metadata,
      checksums: Array.from(metadata.checksums.entries())
    };
    await fs.writeFile(metadataPath, JSON.stringify(data, null, 2));
  }

  /**
   * Load backup metadata
   */
  private async loadMetadata(backupPath: string): Promise<BackupMetadata> {
    const metadataPath = path.join(backupPath, 'metadata.json');
    const content = await fs.readFile(metadataPath, 'utf-8');
    const data = JSON.parse(content);
    
    return {
      ...data,
      timestamp: new Date(data.timestamp),
      checksums: new Map(data.checksums)
    };
  }
}
