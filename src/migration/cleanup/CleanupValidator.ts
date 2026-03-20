import { promises as fs } from 'fs';
import * as path from 'path';
import { MigrationLogger } from '../logging/MigrationLogger';
import { CleanupResult, ValidationResult } from '../types';

/**
 * Validates that services directory cleanup was performed correctly
 */
export class CleanupValidator {
  private logger: MigrationLogger;
  private projectRoot: string;

  constructor(projectRoot: string, logger: MigrationLogger) {
    this.projectRoot = projectRoot;
    this.logger = logger;
  }

  /**
   * Validates the cleanup results
   */
  async validateCleanup(cleanupResult: CleanupResult): Promise<ValidationResult> {
    this.logger.info('Validating services directory cleanup');

    const result: ValidationResult = {
      testsPass: true,
      endpointsAccessible: true,
      storeIntegrationsValid: true,
      importPathsResolved: true,
      errors: [],
      warnings: [],
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        totalEndpoints: 0,
        accessibleEndpoints: 0,
        totalIntegrations: 0,
        validIntegrations: 0
      }
    };

    try {
      // Validate that removed files are actually gone
      await this.validateRemovedFiles(cleanupResult.removedFiles, result);

      // Validate that preserved files still exist and are valid
      await this.validatePreservedFiles(cleanupResult.preservedFiles, result);

      // Validate that no feature-specific code remains in services
      await this.validateNoFeatureSpecificCode(result);

      // Validate that shared utilities are properly organized
      await this.validateSharedUtilities(result);

      // Validate deprecation notices
      await this.validateDeprecationNotices(cleanupResult.deprecationNotices, result);

      this.logger.info('Cleanup validation completed');

    } catch (error) {
      result.errors.push({
        type: 'validation',
        message: `Cleanup validation failed: ${error.message}`,
        details: error.stack || '',
        suggestion: 'Review cleanup process and retry'
      });
      result.testsPass = false;
    }

    return result;
  }

  /**
   * Validates that removed files are actually gone
   */
  private async validateRemovedFiles(removedFiles: string[], result: ValidationResult): Promise<void> {
    const servicesPath = path.join(this.projectRoot, 'src', 'services');

    for (const fileName of removedFiles) {
      const filePath = path.join(servicesPath, fileName);
      
      try {
        await fs.access(filePath);
        // If we reach here, the file still exists
        result.errors.push({
          type: 'validation',
          message: `File ${fileName} was marked as removed but still exists`,
          details: `File path: ${filePath}`,
          file: filePath,
          suggestion: 'Manually remove the file or check cleanup logic'
        });
        result.testsPass = false;
      } catch (error) {
        // File doesn't exist, which is expected
        this.logger.debug(`Confirmed removal of ${fileName}`);
      }
    }
  }

  /**
   * Validates that preserved files still exist and are valid
   */
  private async validatePreservedFiles(preservedFiles: string[], result: ValidationResult): Promise<void> {
    const servicesPath = path.join(this.projectRoot, 'src', 'services');

    for (const fileName of preservedFiles) {
      const filePath = path.join(servicesPath, fileName);
      
      try {
        const stats = await fs.stat(filePath);
        if (!stats.isFile()) {
          result.errors.push({
            type: 'validation',
            message: `Preserved item ${fileName} is not a file`,
            details: `Path: ${filePath}`,
            file: filePath,
            suggestion: 'Check file system state'
          });
          result.testsPass = false;
        }

        // Validate file content is not empty
        const content = await fs.readFile(filePath, 'utf-8');
        if (this.isFileEmpty(content)) {
          result.warnings.push(`Preserved file ${fileName} appears to be empty`);
        }

      } catch (error) {
        result.errors.push({
          type: 'validation',
          message: `Preserved file ${fileName} does not exist`,
          details: `File path: ${filePath}, Error: ${error.message}`,
          file: filePath,
          suggestion: 'Check if file was accidentally removed'
        });
        result.testsPass = false;
      }
    }
  }

  /**
   * Validates that no feature-specific code remains in services directory
   */
  private async validateNoFeatureSpecificCode(result: ValidationResult): Promise<void> {
    const servicesPath = path.join(this.projectRoot, 'src', 'services');
    
    try {
      const entries = await fs.readdir(servicesPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile() && this.isServiceFile(entry.name)) {
          const filePath = path.join(servicesPath, entry.name);
          const content = await fs.readFile(filePath, 'utf-8');
          
          if (this.containsFeatureSpecificCode(entry.name, content)) {
            result.warnings.push(
              `File ${entry.name} may contain feature-specific code that should be migrated`
            );
          }
        }
      }
    } catch (error) {
      this.logger.warn(`Could not validate feature-specific code: ${error.message}`);
    }
  }

  /**
   * Validates that shared utilities are properly organized
   */
  private async validateSharedUtilities(result: ValidationResult): Promise<void> {
    const sharedApiPath = path.join(this.projectRoot, 'src', 'shared', 'api');
    
    try {
      await fs.access(sharedApiPath);
      
      const entries = await fs.readdir(sharedApiPath, { withFileTypes: true });
      const sharedFiles = entries.filter(entry => entry.isFile()).map(entry => entry.name);
      
      if (sharedFiles.length === 0) {
        result.warnings.push('No shared API utilities found in /src/shared/api/');
      } else {
        this.logger.info(`Found ${sharedFiles.length} shared API utilities`);
      }
      
    } catch (error) {
      result.warnings.push('Shared API directory does not exist or is not accessible');
    }
  }

  /**
   * Validates deprecation notices
   */
  private async validateDeprecationNotices(deprecationNotices: string[], result: ValidationResult): Promise<void> {
    for (const noticePath of deprecationNotices) {
      try {
        // Check if the original file has deprecation comments
        const originalPath = noticePath.replace('.deprecated', '');
        const content = await fs.readFile(originalPath, 'utf-8');
        
        if (!this.hasDeprecationNotice(content)) {
          result.warnings.push(`File ${path.basename(originalPath)} may be missing deprecation notice`);
        }
        
      } catch (error) {
        result.warnings.push(`Could not validate deprecation notice: ${error.message}`);
      }
    }
  }

  /**
   * Checks if a file is empty or contains only comments/imports
   */
  private isFileEmpty(content: string): boolean {
    const cleanContent = content
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      .replace(/^\s*import\s+.*$/gm, '')
      .replace(/^\s*export\s*{\s*}\s*;?\s*$/gm, '')
      .replace(/\s+/g, '')
      .trim();

    return cleanContent.length === 0;
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
   * Checks if content contains feature-specific code patterns
   */
  private containsFeatureSpecificCode(fileName: string, content: string): boolean {
    const featurePatterns = [
      /auth(?!Utils|Client)/i,
      /subscription(?!Utils)/i,
      /search(?!Utils)/i,
      /portfolio(?!Utils)/i,
      /assessment(?!Utils)/i,
      /student(?!Utils)/i,
      /educator(?!Utils)/i,
      /recruiter(?!Utils)/i
    ];

    // Check filename
    const nameHasFeaturePattern = featurePatterns.some(pattern => pattern.test(fileName));
    
    // Check content for feature-specific patterns
    const contentHasFeaturePattern = featurePatterns.some(pattern => pattern.test(content));
    
    return nameHasFeaturePattern || contentHasFeaturePattern;
  }

  /**
   * Checks if content has deprecation notice
   */
  private hasDeprecationNotice(content: string): boolean {
    const deprecationPatterns = [
      /\/\*\*[\s\S]*?DEPRECATED[\s\S]*?\*\//,
      /\/\/ DEPRECATED:/,
      /console\.warn.*deprecated/i
    ];

    return deprecationPatterns.some(pattern => pattern.test(content));
  }
}