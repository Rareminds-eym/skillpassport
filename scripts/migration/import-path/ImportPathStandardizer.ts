import * as fs from 'fs';
import * as path from 'path';
import { MigrationLogger } from '../logging/MigrationLogger';
import { ImportPathAnalyzer } from './ImportPathAnalyzer';
import { ImportPathRefactorer } from './ImportPathRefactorer';
import { TypeScriptConfigUpdater } from './TypeScriptConfigUpdater';
import { ImportPathStandardizationResult } from '@/shared/types/import-path';

export class ImportPathStandardizer {
  private analyzer: ImportPathAnalyzer;
  private refactorer: ImportPathRefactorer;
  private configUpdater: TypeScriptConfigUpdater;
  private logger: MigrationLogger;

  constructor(logger: MigrationLogger, sourceRoot: string = 'src') {
    this.logger = logger;
    this.analyzer = new ImportPathAnalyzer(logger, sourceRoot);
    this.refactorer = new ImportPathRefactorer(logger, sourceRoot);
    this.configUpdater = new TypeScriptConfigUpdater(logger);
  }

  async standardizeAllImports(filePaths: string[]): Promise<ImportPathStandardizationResult> {
    this.logger.info('Starting comprehensive import path standardization', {
      fileCount: filePaths.length
    });

    try {
      // Step 1: Analyze current import paths
      const analysis = await this.analyzer.analyzeImportPaths(filePaths);
      this.logger.info('Analysis completed', {
        totalImports: analysis.totalImports,
        violations: analysis.violations.length
      });

      // Step 2: Ensure TypeScript config has proper path mappings
      const configUpdate = await this.configUpdater.ensureFSDPathMappings();
      this.logger.info('TypeScript config updated', {
        success: configUpdate.success,
        addedMappings: configUpdate.addedMappings.length
      });

      // Step 3: Refactor import paths to fix violations
      const refactoring = await this.refactorer.refactorImportPaths(analysis.violations);
      this.logger.info('Refactoring completed', {
        totalChanges: refactoring.changes.length,
        filesModified: refactoring.filesModified.length
      });

      const result: ImportPathStandardizationResult = {
        analysis,
        refactoring,
        configUpdate,
        success: refactoring.success && configUpdate.success,
        summary: {
          totalViolationsFound: analysis.violations.length,
          totalViolationsFixed: refactoring.changes.length,
          filesAnalyzed: filePaths.length,
          filesModified: refactoring.filesModified.length,
          configUpdated: configUpdate.success
        }
      };

      this.logger.info('Import path standardization completed', result.summary);
      return result;
    } catch (error) {
      this.logger.error('Import path standardization failed', { error });
      throw error;
    }
  }

  async standardizeDirectory(directoryPath: string): Promise<ImportPathStandardizationResult> {
    this.logger.info('Standardizing imports in directory', { directoryPath });

    const filePaths = this.getAllTypeScriptFiles(directoryPath);
    return this.standardizeAllImports(filePaths);
  }

  async fixSpecificViolationType(
    filePaths: string[],
    violationType: 'cross-layer-relative' | 'missing-alias' | 'deep-import' | 'upward-dependency'
  ): Promise<ImportPathStandardizationResult> {
    this.logger.info('Fixing specific violation type', { violationType, fileCount: filePaths.length });

    const analysis = await this.analyzer.analyzeImportPaths(filePaths);
    const filteredViolations = analysis.violations.filter(v => v.type === violationType);

    const refactoring = await this.refactorer.refactorImportPaths(filteredViolations);
    const configUpdate = await this.configUpdater.ensureFSDPathMappings();

    return {
      analysis,
      refactoring,
      configUpdate,
      success: refactoring.success && configUpdate.success,
      summary: {
        totalViolationsFound: filteredViolations.length,
        totalViolationsFixed: refactoring.changes.length,
        filesAnalyzed: filePaths.length,
        filesModified: refactoring.filesModified.length,
        configUpdated: configUpdate.success
      }
    };
  }

  async convertAllRelativeToAbsolute(filePaths: string[]): Promise<ImportPathStandardizationResult> {
    this.logger.info('Converting all relative imports to absolute', { fileCount: filePaths.length });

    const analysis = await this.analyzer.analyzeImportPaths(filePaths);
    const refactoring = await this.refactorer.convertRelativeToAbsolute(filePaths);
    const configUpdate = await this.configUpdater.ensureFSDPathMappings();

    return {
      analysis,
      refactoring,
      configUpdate,
      success: refactoring.success && configUpdate.success,
      summary: {
        totalViolationsFound: analysis.violations.length,
        totalViolationsFixed: refactoring.changes.length,
        filesAnalyzed: filePaths.length,
        filesModified: refactoring.filesModified.length,
        configUpdated: configUpdate.success
      }
    };
  }

  async validateImportPaths(filePaths: string[]): Promise<ImportPathStandardizationResult> {
    this.logger.info('Validating import paths (analysis only)', { fileCount: filePaths.length });

    const analysis = await this.analyzer.analyzeImportPaths(filePaths);
    const configValidation = await this.configUpdater.validatePathMappings();

    return {
      analysis,
      refactoring: {
        success: true,
        changes: [],
        filesModified: [],
        errors: [],
        statistics: {
          totalChanges: 0,
          filesModified: 0,
          changesByType: {}
        }
      },
      configUpdate: {
        success: configValidation.valid,
        configPath: 'tsconfig.app.json',
        originalPaths: {},
        updatedPaths: {},
        addedMappings: [],
        modifiedMappings: [],
        error: configValidation.issues.join('; ')
      },
      success: analysis.violations.length === 0 && configValidation.valid,
      summary: {
        totalViolationsFound: analysis.violations.length,
        totalViolationsFixed: 0,
        filesAnalyzed: filePaths.length,
        filesModified: 0,
        configUpdated: false
      }
    };
  }

  private getAllTypeScriptFiles(directoryPath: string): string[] {
    const files: string[] = [];

    const traverse = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip node_modules, dist, build, etc.
          if (!['node_modules', 'dist', 'build', '.git', 'coverage'].includes(entry.name)) {
            traverse(fullPath);
          }
        } else if (entry.isFile()) {
          // Include .ts and .tsx files, exclude .d.ts
          if ((entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) && !entry.name.endsWith('.d.ts')) {
            files.push(fullPath);
          }
        }
      }
    };

    traverse(directoryPath);
    return files;
  }

  async generateCorrectionReport(filePaths: string[]): Promise<string> {
    this.logger.info('Generating import path correction report');

    const analysis = await this.analyzer.analyzeImportPaths(filePaths);
    const configValidation = await this.configUpdater.validatePathMappings();

    let report = '# Import Path Correction Report\n\n';
    report += `**Files Analyzed:** ${filePaths.length}\n`;
    report += `**Total Imports:** ${analysis.totalImports}\n`;
    report += `**Violations Found:** ${analysis.violations.length}\n`;
    report += `**Compliance Rate:** ${analysis.statistics.complianceRate}\n\n`;

    report += '## Violations by Type\n\n';
    for (const [type, violations] of Object.entries(analysis.violationsByType)) {
      report += `### ${type} (${violations.length})\n\n`;
      violations.slice(0, 10).forEach(v => {
        report += `- **${v.filePath}:${v.line}**\n`;
        report += `  - Current: \`${v.importPath}\`\n`;
        if (v.suggestion) {
          report += `  - Suggested: \`${v.suggestion}\`\n`;
        }
        report += `  - ${v.message}\n\n`;
      });
      if (violations.length > 10) {
        report += `... and ${violations.length - 10} more\n\n`;
      }
    }

    report += '## TypeScript Configuration\n\n';
    if (configValidation.valid) {
      report += '✓ TypeScript path mappings are valid\n';
    } else {
      report += '✗ TypeScript path mapping issues:\n\n';
      configValidation.issues.forEach(issue => {
        report += `- ${issue}\n`;
      });
    }

    return report;
  }
}
