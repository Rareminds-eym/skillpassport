import { promises as fs } from 'fs';
import * as path from 'path';
import { MigrationLogger } from '../logging/MigrationLogger';
import { ServiceFile, CleanupResult, CleanupConfig } from '../types';
import { DeprecationNoticeGenerator } from './DeprecationNoticeGenerator';

/**
 * Handles cleanup of the services directory after migration
 * Removes empty service files and creates deprecation notices
 */
export class ServicesDirectoryCleanup {
  private logger: MigrationLogger;
  private config: CleanupConfig;

  constructor(config: CleanupConfig, logger: MigrationLogger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Performs complete services directory cleanup
   */
  async cleanup(): Promise<CleanupResult> {
    this.logger.info('Starting services directory cleanup');
    
    const result: CleanupResult = {
      success: true,
      removedFiles: [],
      preservedFiles: [],
      deprecationNotices: [],
      errors: []
    };

    try {
      // Analyze current services directory
      const serviceFiles = await this.analyzeServicesDirectory();
      
      // Remove empty service files
      const removalResult = await this.removeEmptyServiceFiles(serviceFiles);
      result.removedFiles = removalResult.removedFiles;
      result.errors.push(...removalResult.errors);

      // Identify preserved files
      result.preservedFiles = await this.identifyPreservedFiles();

      // Create deprecation notices
      if (this.config.createDeprecationNotices) {
        result.deprecationNotices = await this.createDeprecationNotices(result.preservedFiles);
      }

      this.logger.info(`Cleanup completed: ${result.removedFiles.length} files removed, ${result.preservedFiles.length} files preserved`);
      
    } catch (error) {
      result.success = false;
      result.errors.push(`Cleanup failed: ${error.message}`);
      this.logger.error('Services directory cleanup failed', error);
    }

    return result;
  }

  /**
   * Analyzes the services directory to identify all service files
   */
  private async analyzeServicesDirectory(): Promise<ServiceFile[]> {
    const servicesPath = path.join(this.config.projectRoot, 'src', 'services');
    const serviceFiles: ServiceFile[] = [];

    try {
      const entries = await fs.readdir(servicesPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile() && this.isServiceFile(entry.name)) {
          const filePath = path.join(servicesPath, entry.name);
          const content = await fs.readFile(filePath, 'utf-8');
          
          serviceFiles.push({
            path: filePath,
            name: entry.name,
            content,
            isEmpty: this.isFileEmpty(content),
            isSharedUtility: this.isSharedUtility(entry.name, content),
            functions: this.extractFunctionNames(content),
            dependencies: this.extractDependencies(content),
            exports: this.extractExports(content)
          });
        }
      }
    } catch (error) {
      this.logger.warn(`Could not analyze services directory: ${error.message}`);
    }

    return serviceFiles;
  }

  /**
   * Removes service files that have been fully migrated (empty or feature-specific)
   */
  private async removeEmptyServiceFiles(serviceFiles: ServiceFile[]): Promise<{ removedFiles: string[], errors: string[] }> {
    const removedFiles: string[] = [];
    const errors: string[] = [];

    for (const file of serviceFiles) {
      try {
        if (this.shouldRemoveFile(file)) {
          await this.removeFile(file.path);
          removedFiles.push(file.name);
          this.logger.info(`Removed empty service file: ${file.name}`);
        }
      } catch (error) {
        const errorMsg = `Failed to remove ${file.name}: ${error.message}`;
        errors.push(errorMsg);
        this.logger.error(errorMsg);
      }
    }

    return { removedFiles, errors };
  }

  /**
   * Identifies files that should be preserved in the services directory
   */
  private async identifyPreservedFiles(): Promise<string[]> {
    const servicesPath = path.join(this.config.projectRoot, 'src', 'services');
    const preservedFiles: string[] = [];

    try {
      const entries = await fs.readdir(servicesPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile() && this.isServiceFile(entry.name)) {
          preservedFiles.push(entry.name);
        }
      }
    } catch (error) {
      this.logger.warn(`Could not identify preserved files: ${error.message}`);
    }

    return preservedFiles;
  }

  /**
   * Creates deprecation notices for remaining legacy files
   */
  private async createDeprecationNotices(preservedFiles: string[]): Promise<string[]> {
    const generator = new DeprecationNoticeGenerator(this.config.projectRoot, this.logger);
    return await generator.createDeprecationNotices(preservedFiles);
  }

  /**
   * Determines if a file should be removed
   */
  private shouldRemoveFile(file: ServiceFile): boolean {
    // Remove if file is empty after migration
    if (file.isEmpty) {
      return true;
    }

    // Remove if file contains only feature-specific functions that have been migrated
    if (this.isFeatureSpecificFile(file) && this.hasBeenMigrated(file)) {
      return true;
    }

    // Don't remove shared utilities
    if (file.isSharedUtility) {
      return false;
    }

    return false;
  }

  /**
   * Checks if a file is empty or contains only comments/imports
   */
  private isFileEmpty(content: string): boolean {
    // Remove comments, imports, and whitespace
    const cleanContent = content
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .replace(/\/\/.*$/gm, '') // Remove line comments
      .replace(/^\s*import\s+.*$/gm, '') // Remove import statements
      .replace(/^\s*export\s*{\s*}\s*;?\s*$/gm, '') // Remove empty exports
      .replace(/\s+/g, '') // Remove all whitespace
      .trim();

    return cleanContent.length === 0;
  }

  /**
   * Determines if a file contains shared utilities
   */
  private isSharedUtility(fileName: string, content: string): boolean {
    // Check for known shared utility patterns
    const sharedUtilityPatterns = [
      /httpClient/i,
      /apiUtils/i,
      /authUtils/i,
      /constants/i,
      /config/i,
      /interceptor/i,
      /middleware/i
    ];

    const nameMatches = sharedUtilityPatterns.some(pattern => pattern.test(fileName));
    const contentMatches = sharedUtilityPatterns.some(pattern => pattern.test(content));

    return nameMatches || contentMatches;
  }

  /**
   * Checks if a file is feature-specific
   */
  private isFeatureSpecificFile(file: ServiceFile): boolean {
    const featurePatterns = [
      /auth/i,
      /subscription/i,
      /search/i,
      /portfolio/i,
      /assessment/i,
      /student/i,
      /educator/i,
      /recruiter/i
    ];

    return featurePatterns.some(pattern => pattern.test(file.name));
  }

  /**
   * Checks if a file has been migrated (placeholder - would integrate with migration tracking)
   */
  private hasBeenMigrated(file: ServiceFile): boolean {
    // This would integrate with the migration tracking system
    // For now, assume files are migrated if they're empty or contain only legacy patterns
    return file.isEmpty || this.containsOnlyLegacyPatterns(file.content);
  }

  /**
   * Checks if content contains only legacy patterns that have been replaced
   */
  private containsOnlyLegacyPatterns(content: string): boolean {
    // Look for patterns that indicate the file has been migrated
    const legacyPatterns = [
      /\/\/ DEPRECATED:/,
      /\/\* MIGRATED TO:/,
      /console\.warn.*deprecated/i
    ];

    return legacyPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Removes a file from the filesystem
   */
  private async removeFile(filePath: string): Promise<void> {
    if (this.config.dryRun) {
      this.logger.info(`[DRY RUN] Would remove file: ${filePath}`);
      return;
    }

    await fs.unlink(filePath);
  }

  /**
   * Checks if a file is a service file based on extension
   */
  private isServiceFile(fileName: string): boolean {
    const serviceExtensions = ['.js', '.ts', '.jsx', '.tsx'];
    const ext = path.extname(fileName);
    return serviceExtensions.includes(ext) && !fileName.includes('.test.') && !fileName.includes('.spec.');
  }

  /**
   * Extracts function names from file content
   */
  private extractFunctionNames(content: string): string[] {
    const functionPatterns = [
      /export\s+(?:async\s+)?function\s+(\w+)/g,
      /export\s+const\s+(\w+)\s*=\s*(?:async\s+)?\(/g,
      /(\w+)\s*:\s*(?:async\s+)?function/g
    ];

    const functions: string[] = [];
    
    for (const pattern of functionPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        functions.push(match[1]);
      }
    }

    return [...new Set(functions)]; // Remove duplicates
  }

  /**
   * Extracts dependencies from file content
   */
  private extractDependencies(content: string): string[] {
    const importPattern = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    const dependencies: string[] = [];
    
    let match;
    while ((match = importPattern.exec(content)) !== null) {
      dependencies.push(match[1]);
    }

    return dependencies;
  }

  /**
   * Extracts exports from file content
   */
  private extractExports(content: string): string[] {
    const exportPatterns = [
      /export\s+\{\s*([^}]+)\s*\}/g,
      /export\s+(?:default\s+)?(?:function|const|class)\s+(\w+)/g
    ];

    const exports: string[] = [];
    
    for (const pattern of exportPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1].includes(',')) {
          // Handle multiple exports in braces
          const multipleExports = match[1].split(',').map(e => e.trim());
          exports.push(...multipleExports);
        } else {
          exports.push(match[1]);
        }
      }
    }

    return [...new Set(exports)]; // Remove duplicates
  }
}