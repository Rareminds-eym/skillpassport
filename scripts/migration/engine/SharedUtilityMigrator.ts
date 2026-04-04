/**
 * Shared Utility Migrator
 * 
 * Handles the identification and migration of shared utilities from services
 * to the shared API directory following FSD architecture.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { 
  APIFunction, 
  MigrationConfig, 
  MigrationResult,
  ServiceFile
} from '../types';
import { MigrationLogger } from '../logging/MigrationLogger';

export class SharedUtilityMigrator {
  constructor(
    private config: MigrationConfig,
    private logger: MigrationLogger
  ) {}

  /**
   * Identify shared utilities from service files
   */
  async identifySharedUtilities(serviceFiles: ServiceFile[]): Promise<APIFunction[]> {
    const sharedUtilities: APIFunction[] = [];
    
    for (const file of serviceFiles) {
      const content = await fs.readFile(file.path, 'utf8');
      const utilities = this.extractSharedUtilities(content, file.path);
      sharedUtilities.push(...utilities);
    }

    this.logger.info(`Identified ${sharedUtilities.length} shared utilities`);
    return sharedUtilities;
  }

  /**
   * Extract shared utilities from file content
   */
  private extractSharedUtilities(content: string, filePath: string): APIFunction[] {
    const utilities: APIFunction[] = [];
    
    // Patterns for shared utility functions
    const utilityPatterns = [
      /export\s+(?:async\s+)?function\s+(\w+)/g,
      /export\s+const\s+(\w+)\s*=\s*(?:async\s*)?\(/g,
    ];

    for (const pattern of utilityPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const functionName = match[1];
        
        if (this.isSharedUtility(functionName, content)) {
          utilities.push({
            name: functionName,
            signature: this.extractFunctionSignature(content, functionName),
            sourceFile: filePath,
            isShared: true,
            feature: null,
            dependencies: this.extractDependencies(content, functionName),
            usageCount: 0,
            parameters: [],
            returnType: 'any',
            isAsync: content.includes(`async function ${functionName}`) || 
                     content.includes(`async (`) || 
                     content.includes(`async ${functionName}`),
            storeIntegrations: [],
            lineNumber: 0
          });
        }
      }
    }

    return utilities;
  }
  /**
   * Check if function is a shared utility
   */
  private isSharedUtility(functionName: string, content: string): boolean {
    const sharedPatterns = [
      'validate', 'format', 'parse', 'transform', 'convert',
      'http', 'request', 'client', 'api', 'auth', 'token',
      'util', 'helper', 'common', 'shared', 'constant'
    ];

    const lowerName = functionName.toLowerCase();
    return sharedPatterns.some(pattern => lowerName.includes(pattern));
  }

  /**
   * Extract function signature
   */
  private extractFunctionSignature(content: string, functionName: string): string {
    const patterns = [
      new RegExp(`export\\s+(?:async\\s+)?function\\s+${functionName}\\s*\\([^)]*\\)[^{]*`, 'g'),
      new RegExp(`export\\s+const\\s+${functionName}\\s*=\\s*(?:async\\s*)?\\([^)]*\\)\\s*=>`, 'g')
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return `export function ${functionName}()`;
  }

  /**
   * Extract function dependencies
   */
  private extractDependencies(content: string, functionName: string): string[] {
    const dependencies: string[] = [];
    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      dependencies.push(match[1]);
    }

    return dependencies;
  }

  /**
   * Migrate shared utilities to shared/api directory
   */
  async migrateSharedUtilities(utilities: APIFunction[]): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: true,
      migratedFiles: [],
      updatedImports: [],
      errors: [],
      warnings: [],
      rollbackData: { 
        backupPath: '', 
        originalFiles: [], 
        changes: [], 
        timestamp: new Date(),
        migrationId: ''
      },
      duration: 0,
      timestamp: new Date()
    };

    if (utilities.length === 0) {
      return result;
    }

    try {
      const sharedDir = path.join('src', 'shared', 'api');
      
      // Group utilities by category
      const categories = this.categorizeUtilities(utilities);
      
      for (const [category, funcs] of categories) {
        const targetFile = path.join(sharedDir, `${category}.ts`);
        const content = await this.generateUtilityFileContent(category, funcs);
        
        await fs.writeFile(targetFile, content, 'utf8');
        result.migratedFiles.push(targetFile);
      }

      this.logger.info(`Migrated ${utilities.length} shared utilities`);
      return result;

    } catch (error) {
      result.success = false;
      result.errors.push({
        code: 'MIGRATION_FAILED',
        message: `Shared utility migration failed: ${(error as Error).message}`,
        severity: 'critical',
        category: 'migration'
      });
      
      return result;
    }
  }

  /**
   * Categorize utilities into logical groups
   */
  private categorizeUtilities(utilities: APIFunction[]): Map<string, APIFunction[]> {
    const categories = new Map<string, APIFunction[]>();
    
    for (const util of utilities) {
      let category = 'utils';
      
      const name = util.name.toLowerCase();
      if (name.includes('http') || name.includes('request') || name.includes('client')) {
        category = 'httpClient';
      } else if (name.includes('auth') || name.includes('token')) {
        category = 'authUtils';
      } else if (name.includes('validate') || name.includes('format')) {
        category = 'validators';
      } else if (name.includes('constant') || name.includes('config')) {
        category = 'constants';
      }
      
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(util);
    }
    
    return categories;
  }

  /**
   * Generate content for utility files
   */
  private async generateUtilityFileContent(category: string, utilities: APIFunction[]): Promise<string> {
    const header = `/**
 * Shared ${category} utilities
 * 
 * Common ${category} functionality used across multiple features.
 * Migrated from /services/ directory following FSD architecture.
 * 
 * @generated by FSD Phase 5 Migration
 */`;

    const imports = new Set<string>();
    const functions: string[] = [];

    for (const util of utilities) {
      // Extract original function content
      if (util.sourceFile) {
        try {
          const sourceContent = await fs.readFile(util.sourceFile, 'utf8');
          const functionContent = this.extractFunctionContent(sourceContent, util.name);
          if (functionContent) {
            functions.push(functionContent);
          }
        } catch (error) {
          this.logger.warn(`Could not extract function ${util.name}`, { error });
        }
      }
    }

    return `${header}\n\n${functions.join('\n\n')}\n`;
  }

  /**
   * Extract complete function content from source
   */
  private extractFunctionContent(content: string, functionName: string): string | null {
    const patterns = [
      new RegExp(`export\\s+(?:async\\s+)?function\\s+${functionName}\\s*\\([^)]*\\)[^{]*{[\\s\\S]*?^}`, 'm'),
      new RegExp(`export\\s+const\\s+${functionName}\\s*=\\s*(?:async\\s*)?\\([^)]*\\)\\s*=>\\s*{[\\s\\S]*?^};?`, 'm')
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        return match[0].trim();
      }
    }

    return null;
  }
}