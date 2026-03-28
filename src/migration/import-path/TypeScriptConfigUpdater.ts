import * as fs from 'fs';
import * as path from 'path';
import { MigrationLogger } from '../logging/MigrationLogger';
import { TypeScriptConfigUpdate, PathMapping } from '@/shared/types/import-path';

export class TypeScriptConfigUpdater {
  private logger: MigrationLogger;
  private configPath: string;

  constructor(logger: MigrationLogger, configPath: string = 'tsconfig.app.json') {
    this.logger = logger;
    this.configPath = configPath;
  }

  async updatePathMappings(newMappings: PathMapping[]): Promise<TypeScriptConfigUpdate> {
    this.logger.info('Updating TypeScript path mappings', { mappingCount: newMappings.length });

    try {
      const config = this.readConfig();
      const originalPaths = { ...config.compilerOptions?.paths };
      
      // Ensure compilerOptions and paths exist
      if (!config.compilerOptions) {
        config.compilerOptions = {};
      }
      if (!config.compilerOptions.paths) {
        config.compilerOptions.paths = {};
      }

      // Add or update path mappings
      for (const mapping of newMappings) {
        config.compilerOptions.paths[mapping.alias] = mapping.paths;
      }

      // Write updated config
      this.writeConfig(config);

      const update: TypeScriptConfigUpdate = {
        success: true,
        configPath: this.configPath,
        originalPaths,
        updatedPaths: config.compilerOptions.paths,
        addedMappings: newMappings.filter(m => !originalPaths[m.alias]),
        modifiedMappings: newMappings.filter(m => originalPaths[m.alias])
      };

      this.logger.info('TypeScript config updated successfully', {
        addedMappings: update.addedMappings.length,
        modifiedMappings: update.modifiedMappings.length
      });

      return update;
    } catch (error) {
      this.logger.error('Failed to update TypeScript config', { error });
      return {
        success: false,
        configPath: this.configPath,
        originalPaths: {},
        updatedPaths: {},
        addedMappings: [],
        modifiedMappings: [],
        error: error.message
      };
    }
  }

  async ensureFSDPathMappings(): Promise<TypeScriptConfigUpdate> {
    this.logger.info('Ensuring FSD layer path mappings exist');

    const fsdMappings: PathMapping[] = [
      { alias: '@/*', paths: ['./src/*'] },
      { alias: '@/app/*', paths: ['./src/app/*'] },
      { alias: '@/pages/*', paths: ['./src/pages/*'] },
      { alias: '@/widgets/*', paths: ['./src/widgets/*'] },
      { alias: '@/features/*', paths: ['./src/features/*'] },
      { alias: '@/entities/*', paths: ['./src/entities/*'] },
      { alias: '@/shared/*', paths: ['./src/shared/*'] }
    ];

    return this.updatePathMappings(fsdMappings);
  }

  async validatePathMappings(): Promise<{ valid: boolean; issues: string[] }> {
    this.logger.info('Validating TypeScript path mappings');

    const issues: string[] = [];

    try {
      const config = this.readConfig();
      const paths = config.compilerOptions?.paths;

      if (!paths) {
        issues.push('No path mappings found in tsconfig');
        return { valid: false, issues };
      }

      // Check for required FSD mappings
      const requiredMappings = ['@/*', '@/shared/*', '@/entities/*', '@/features/*'];
      for (const required of requiredMappings) {
        if (!paths[required]) {
          issues.push(`Missing required path mapping: ${required}`);
        }
      }

      // Validate that mapped paths exist
      for (const [alias, pathList] of Object.entries(paths)) {
        for (const mappedPath of pathList) {
          const resolvedPath = mappedPath.replace('./', '').replace('/*', '');
          if (!fs.existsSync(resolvedPath)) {
            issues.push(`Path mapping ${alias} points to non-existent directory: ${resolvedPath}`);
          }
        }
      }

      // Check baseUrl is set
      if (!config.compilerOptions?.baseUrl) {
        issues.push('baseUrl is not set in compilerOptions');
      }

      const valid = issues.length === 0;
      this.logger.info('Path mapping validation completed', { valid, issueCount: issues.length });

      return { valid, issues };
    } catch (error) {
      this.logger.error('Failed to validate path mappings', { error });
      issues.push(`Validation error: ${error.message}`);
      return { valid: false, issues };
    }
  }

  async generatePathMappingReport(): Promise<string> {
    this.logger.info('Generating path mapping report');

    try {
      const config = this.readConfig();
      const paths = config.compilerOptions?.paths || {};
      const baseUrl = config.compilerOptions?.baseUrl || '.';

      let report = '# TypeScript Path Mapping Report\n\n';
      report += `**Config File:** ${this.configPath}\n`;
      report += `**Base URL:** ${baseUrl}\n\n`;
      report += '## Current Path Mappings\n\n';

      if (Object.keys(paths).length === 0) {
        report += 'No path mappings configured.\n';
      } else {
        report += '| Alias | Mapped Paths | Status |\n';
        report += '|-------|--------------|--------|\n';

        for (const [alias, pathList] of Object.entries(paths)) {
          const pathsStr = pathList.join(', ');
          const exists = pathList.every(p => {
            const resolvedPath = p.replace('./', '').replace('/*', '');
            return fs.existsSync(resolvedPath);
          });
          const status = exists ? '✓ Valid' : '✗ Invalid';
          report += `| ${alias} | ${pathsStr} | ${status} |\n`;
        }
      }

      report += '\n## Recommendations\n\n';

      const validation = await this.validatePathMappings();
      if (validation.valid) {
        report += '✓ All path mappings are valid and follow FSD conventions.\n';
      } else {
        report += 'Issues found:\n\n';
        validation.issues.forEach(issue => {
          report += `- ${issue}\n`;
        });
      }

      return report;
    } catch (error) {
      this.logger.error('Failed to generate path mapping report', { error });
      return `# Error\n\nFailed to generate report: ${error.message}`;
    }
  }

  private readConfig(): any {
    const configContent = fs.readFileSync(this.configPath, 'utf-8');
    
    // Remove comments from JSON (TypeScript config allows comments)
    const cleanedContent = configContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
    
    return JSON.parse(cleanedContent);
  }

  private writeConfig(config: any): void {
    const configContent = JSON.stringify(config, null, 2);
    fs.writeFileSync(this.configPath, configContent, 'utf-8');
  }

  async addPathMapping(alias: string, paths: string[]): Promise<boolean> {
    try {
      await this.updatePathMappings([{ alias, paths }]);
      return true;
    } catch (error) {
      this.logger.error(`Failed to add path mapping ${alias}`, { error });
      return false;
    }
  }

  async removePathMapping(alias: string): Promise<boolean> {
    try {
      const config = this.readConfig();
      
      if (config.compilerOptions?.paths?.[alias]) {
        delete config.compilerOptions.paths[alias];
        this.writeConfig(config);
        this.logger.info(`Removed path mapping: ${alias}`);
        return true;
      }

      this.logger.warn(`Path mapping not found: ${alias}`);
      return false;
    } catch (error) {
      this.logger.error(`Failed to remove path mapping ${alias}`, { error });
      return false;
    }
  }
}
