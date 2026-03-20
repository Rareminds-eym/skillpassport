import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { DeprecatedAnalyzer, CleanupAnalysis } from './DeprecatedAnalyzer';
// import { BackupManager } from '../backup/BackupManager';

const unlink = promisify(fs.unlink);
const rmdir = promisify(fs.rmdir);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

export interface CleanupPlan {
  filesToDelete: string[];
  directoriesToRemove: string[];
  backupRequired: boolean;
  estimatedSpaceSaved: number;
}

export interface CleanupResult {
  success: boolean;
  filesDeleted: string[];
  directoriesRemoved: string[];
  spaceSaved: number;
  errors: CleanupError[];
  backupId?: string;
}

export interface CleanupError {
  path: string;
  error: string;
  severity: 'warning' | 'error';
}

export interface CleanupReport {
  timestamp: Date;
  analysis: CleanupAnalysis;
  result: CleanupResult;
  summary: string;
}

export class CleanupSystem {
  private analyzer: DeprecatedAnalyzer;
  // private backupManager: BackupManager;

  constructor(srcRoot: string = 'src') {
    this.analyzer = new DeprecatedAnalyzer(srcRoot);
    // this.backupManager = new BackupManager();
  }

  async analyzeDeprecatedStructure(): Promise<CleanupAnalysis> {
    return this.analyzer.analyzeDeprecatedStructure();
  }

  async validateSafeToDelete(filePath: string): Promise<boolean> {
    return this.analyzer.validateSafeToDelete(filePath);
  }

  async createCleanupPlan(analysis: CleanupAnalysis): Promise<CleanupPlan> {
    const filesToDelete = [...analysis.safeToDelete];
    const directoriesToRemove: string[] = [];
    let estimatedSpaceSaved = 0;

    // Calculate space to be saved
    for (const dir of analysis.deprecatedDirectories) {
      for (const file of dir.files) {
        if (analysis.safeToDelete.includes(file.path)) {
          estimatedSpaceSaved += file.size;
        }
      }
    }

    // Identify empty directories after file deletion
    const deprecatedDirs = [
      'src/components',
      'src/services',
      'src/hooks',
      'src/utils',
      'src/context'
    ];

    for (const dir of deprecatedDirs) {
      const isEmpty = await this.willBeEmptyAfterCleanup(dir, filesToDelete);
      if (isEmpty) {
        directoriesToRemove.push(dir);
      }
    }

    return {
      filesToDelete,
      directoriesToRemove,
      backupRequired: filesToDelete.length > 0,
      estimatedSpaceSaved
    };
  }

  async performCleanup(plan: CleanupPlan): Promise<CleanupResult> {
    const result: CleanupResult = {
      success: true,
      filesDeleted: [],
      directoriesRemoved: [],
      spaceSaved: 0,
      errors: []
    };

    // Create backup if required
    if (plan.backupRequired) {
      try {
        // TODO: Integrate with BackupManager when available
        const backupId = `backup-${Date.now()}`;
        result.backupId = backupId;
        console.log(`Backup would be created: ${backupId}`);
      } catch (error) {
        result.errors.push({
          path: 'backup',
          error: `Failed to create backup: ${error}`,
          severity: 'error'
        });
        result.success = false;
        return result;
      }
    }

    // Delete files
    for (const filePath of plan.filesToDelete) {
      try {
        const fullPath = path.join(process.cwd(), filePath);
        const stats = await stat(fullPath);
        await unlink(fullPath);
        result.filesDeleted.push(filePath);
        result.spaceSaved += stats.size;
      } catch (error) {
        result.errors.push({
          path: filePath,
          error: `Failed to delete file: ${error}`,
          severity: 'warning'
        });
      }
    }

    // Remove empty directories (bottom-up)
    for (const dirPath of plan.directoriesToRemove) {
      try {
        await this.removeEmptyDirectories(dirPath);
        result.directoriesRemoved.push(dirPath);
      } catch (error) {
        result.errors.push({
          path: dirPath,
          error: `Failed to remove directory: ${error}`,
          severity: 'warning'
        });
      }
    }

    result.success = result.errors.filter(e => e.severity === 'error').length === 0;
    return result;
  }

  async generateCleanupReport(
    analysis: CleanupAnalysis,
    result: CleanupResult
  ): Promise<CleanupReport> {
    const summary = this.generateSummary(analysis, result);

    return {
      timestamp: new Date(),
      analysis,
      result,
      summary
    };
  }

  private async willBeEmptyAfterCleanup(
    dirPath: string,
    filesToDelete: string[]
  ): Promise<boolean> {
    const fullPath = path.join(process.cwd(), dirPath);

    if (!fs.existsSync(fullPath)) {
      return true;
    }

    try {
      const allFiles = await this.getAllFilesInDirectory(dirPath);
      const remainingFiles = allFiles.filter(file => !filesToDelete.includes(file));
      return remainingFiles.length === 0;
    } catch (error) {
      console.warn(`Failed to check directory ${dirPath}:`, error);
      return false;
    }
  }

  private async getAllFilesInDirectory(dirPath: string): Promise<string[]> {
    const fullPath = path.join(process.cwd(), dirPath);
    const files: string[] = [];

    try {
      const entries = await readdir(fullPath, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          const subFiles = await this.getAllFilesInDirectory(entryPath);
          files.push(...subFiles);
        } else {
          files.push(entryPath);
        }
      }
    } catch (error) {
      console.warn(`Failed to read directory ${dirPath}:`, error);
    }

    return files;
  }

  private async removeEmptyDirectories(dirPath: string): Promise<void> {
    const fullPath = path.join(process.cwd(), dirPath);

    if (!fs.existsSync(fullPath)) {
      return;
    }

    const entries = await readdir(fullPath, { withFileTypes: true });

    // Recursively remove subdirectories first
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subPath = path.join(dirPath, entry.name);
        await this.removeEmptyDirectories(subPath);
      }
    }

    // Check if directory is now empty
    const remainingEntries = await readdir(fullPath);
    if (remainingEntries.length === 0) {
      await rmdir(fullPath);
    }
  }

  private generateSummary(analysis: CleanupAnalysis, result: CleanupResult): string {
    const lines: string[] = [];

    lines.push('=== Cleanup Summary ===\n');
    lines.push(`Status: ${result.success ? 'SUCCESS' : 'FAILED'}`);
    lines.push(`Files Deleted: ${result.filesDeleted.length} / ${analysis.safeToDelete.length}`);
    lines.push(`Directories Removed: ${result.directoriesRemoved.length}`);
    lines.push(`Space Saved: ${(result.spaceSaved / 1024 / 1024).toFixed(2)} MB`);
    
    if (result.backupId) {
      lines.push(`Backup ID: ${result.backupId}`);
    }

    if (result.errors.length > 0) {
      lines.push(`\nErrors: ${result.errors.length}`);
      result.errors.forEach(error => {
        lines.push(`  [${error.severity.toUpperCase()}] ${error.path}: ${error.error}`);
      });
    }

    if (analysis.requiresManualReview.length > 0) {
      lines.push(`\nFiles Requiring Manual Review: ${analysis.requiresManualReview.length}`);
      lines.push('These files have active references and were not deleted.');
    }

    return lines.join('\n');
  }

  async cleanupSpecificDirectory(dirPath: string): Promise<CleanupResult> {
    const result: CleanupResult = {
      success: true,
      filesDeleted: [],
      directoriesRemoved: [],
      spaceSaved: 0,
      errors: []
    };

    try {
      // Analyze just this directory
      const files = await this.getAllFilesInDirectory(dirPath);
      const filesToDelete: string[] = [];

      for (const file of files) {
        const isSafe = await this.validateSafeToDelete(file);
        if (isSafe) {
          filesToDelete.push(file);
        }
      }

      // Create cleanup plan
      const plan: CleanupPlan = {
        filesToDelete,
        directoriesToRemove: [dirPath],
        backupRequired: true,
        estimatedSpaceSaved: 0
      };

      // Perform cleanup
      return this.performCleanup(plan);
    } catch (error) {
      result.success = false;
      result.errors.push({
        path: dirPath,
        error: `Failed to cleanup directory: ${error}`,
        severity: 'error'
      });
      return result;
    }
  }
}
