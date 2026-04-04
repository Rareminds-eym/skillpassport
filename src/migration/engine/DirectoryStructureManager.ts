import { promises as fs } from 'fs';
import path from 'path';
import { FeatureMapping, MigrationConfig, MigrationLogger } from '@/features/student-profile/model';

/**
 * Manages the creation and organization of feature API directory structures
 * following FSD (Feature-Sliced Design) conventions.
 */
export class DirectoryStructureManager {
  constructor(
    private config: MigrationConfig,
    private logger: MigrationLogger
  ) {}

  /**
   * Creates the complete directory structure for all features
   * @param mappings - Feature mappings containing target directories
   * @returns Promise resolving to created directory paths
   */
  async createFeatureDirectories(mappings: FeatureMapping[]): Promise<string[]> {
    const createdDirs: string[] = [];
    
    try {
      // Create base features directory if it doesn't exist
      const featuresDir = path.join(this.config.targetDirectory, 'features');
      await this.ensureDirectoryExists(featuresDir);
      createdDirs.push(featuresDir);

      // Create feature-specific API directories
      for (const mapping of mappings) {
        const featureApiDir = path.join(featuresDir, mapping.feature, 'api');
        await this.ensureDirectoryExists(featureApiDir);
        createdDirs.push(featureApiDir);

        // Create barrel export file
        const indexPath = path.join(featureApiDir, 'index.ts');
        await this.createBarrelExport(indexPath, mapping);
        
        this.logger.info(`Created feature API directory: ${featureApiDir}`);
      }

      // Create shared API directory
      const sharedApiDir = path.join(this.config.targetDirectory, 'shared', 'api');
      await this.ensureDirectoryExists(sharedApiDir);
      createdDirs.push(sharedApiDir);

      // Create shared barrel export
      const sharedIndexPath = path.join(sharedApiDir, 'index.ts');
      await this.createSharedBarrelExport(sharedIndexPath);

      this.logger.info(`Created ${createdDirs.length} directories for FSD structure`);
      return createdDirs;

    } catch (error) {
      this.logger.error('Failed to create directory structure', { error });
      throw new Error(`Directory creation failed: ${error.message}`);
    }
  }

  /**
   * Creates a barrel export file for a feature API directory
   */
  private async createBarrelExport(indexPath: string, mapping: FeatureMapping): Promise<void> {
    const exports = mapping.functions.map(func => 
      `export { ${func.name} } from './${this.getApiFileName(mapping.feature)}';`
    ).join('\n');

    const content = `// Auto-generated barrel export for ${mapping.feature} API
// This file exports all API functions for the ${mapping.feature} feature

${exports}

// Re-export types if needed
export type * from './${this.getApiFileName(mapping.feature)}';
`;

    await fs.writeFile(indexPath, content, 'utf8');
    this.logger.debug(`Created barrel export: ${indexPath}`);
  }

  /**
   * Creates a barrel export file for shared API utilities
   */
  private async createSharedBarrelExport(indexPath: string): Promise<void> {
    const content = `// Auto-generated barrel export for shared API utilities
// This file exports common API utilities used across features

// HTTP client and utilities
export * from './httpClient';
export * from './apiUtils';
export * from './constants';

// Common types
export type * from '@/features/student-profile/model';
`;

    await fs.writeFile(indexPath, content, 'utf8');
    this.logger.debug(`Created shared barrel export: ${indexPath}`);
  }

  /**
   * Ensures a directory exists, creating it if necessary
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
      this.logger.debug(`Created directory: ${dirPath}`);
    }
  }

  /**
   * Generates the API file name for a feature
   */
  private getApiFileName(feature: string): string {
    return `${feature}Api`;
  }

  /**
   * Validates that all required directories exist
   */
  async validateDirectoryStructure(mappings: FeatureMapping[]): Promise<boolean> {
    try {
      const featuresDir = path.join(this.config.targetDirectory, 'features');
      await fs.access(featuresDir);

      for (const mapping of mappings) {
        const featureApiDir = path.join(featuresDir, mapping.feature, 'api');
        await fs.access(featureApiDir);
        
        const indexPath = path.join(featureApiDir, 'index.ts');
        await fs.access(indexPath);
      }

      const sharedApiDir = path.join(this.config.targetDirectory, 'shared', 'api');
      await fs.access(sharedApiDir);

      return true;
    } catch (error) {
      this.logger.error('Directory structure validation failed', { error });
      return false;
    }
  }
}