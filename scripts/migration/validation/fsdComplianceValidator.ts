/**
 * FSD Compliance Validator
 * 
 * Measures FSD compliance percentage and detects violations:
 * - Files in FSD structure vs legacy structure
 * - Layer hierarchy violations
 * - Public API usage violations
 * 
 * Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ComplianceReport {
  overallScore: number;  // 0-100%
  filesInFsdStructure: number;
  filesInLegacyStructure: number;
  layerViolations: LayerViolation[];
  publicApiViolations: PublicApiViolation[];
  breakdown: {
    app: number;
    pages: number;
    widgets: number;
    features: number;
    entities: number;
    shared: number;
    legacy: number;
  };
  timestamp: Date;
}

export interface LayerViolation {
  file: string;
  importPath: string;
  fromLayer: FSDLayer;
  toLayer: FSDLayer;
  reason: string;
}

export interface PublicApiViolation {
  file: string;
  importPath: string;
  reason: string;
  suggestedFix: string;
}

export type FSDLayer = 'app' | 'pages' | 'widgets' | 'features' | 'entities' | 'shared' | 'legacy';

const LEGACY_DIRECTORIES = [
  'components',
  'services',
  'hooks',
  'utils',
  'types',
  'config',
  'lib',
  'layouts',
  'routes',
  'providers'
];

const FSD_DIRECTORIES = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];

const LAYER_HIERARCHY: FSDLayer[] = ['shared', 'entities', 'features', 'widgets', 'pages', 'app'];

export class FSDComplianceValidator {
  private srcPath: string;

  constructor(srcPath: string = 'src') {
    this.srcPath = srcPath;
  }

  /**
   * Generate comprehensive FSD compliance report
   */
  async generateComplianceReport(): Promise<ComplianceReport> {
    const [
      fsdFiles,
      legacyFiles,
      layerViolations,
      publicApiViolations
    ] = await Promise.all([
      this.countFSDFiles(),
      this.countLegacyFiles(),
      this.detectLayerViolations(),
      this.detectPublicApiViolations()
    ]);

    const totalFiles = fsdFiles.total + legacyFiles.total;
    const overallScore = totalFiles > 0 
      ? Math.round((fsdFiles.total / totalFiles) * 100) 
      : 0;

    return {
      overallScore,
      filesInFsdStructure: fsdFiles.total,
      filesInLegacyStructure: legacyFiles.total,
      layerViolations,
      publicApiViolations,
      breakdown: {
        app: fsdFiles.app,
        pages: fsdFiles.pages,
        widgets: fsdFiles.widgets,
        features: fsdFiles.features,
        entities: fsdFiles.entities,
        shared: fsdFiles.shared,
        legacy: legacyFiles.total
      },
      timestamp: new Date()
    };
  }

  /**
   * Count files in FSD structure
   */
  private async countFSDFiles(): Promise<{
    total: number;
    app: number;
    pages: number;
    widgets: number;
    features: number;
    entities: number;
    shared: number;
  }> {
    const counts = {
      total: 0,
      app: 0,
      pages: 0,
      widgets: 0,
      features: 0,
      entities: 0,
      shared: 0
    };

    for (const layer of FSD_DIRECTORIES) {
      const layerPath = path.join(this.srcPath, layer);
      if (!fs.existsSync(layerPath)) continue;

      const files = this.getFilesRecursively(layerPath, ['.ts', '.tsx', '.js', '.jsx']);
      counts[layer as keyof typeof counts] = files.length;
      counts.total += files.length;
    }

    return counts;
  }

  /**
   * Count files in legacy structure
   */
  private async countLegacyFiles(): Promise<{ total: number }> {
    let total = 0;

    for (const dir of LEGACY_DIRECTORIES) {
      const dirPath = path.join(this.srcPath, dir);
      if (!fs.existsSync(dirPath)) continue;

      const files = this.getFilesRecursively(dirPath, ['.ts', '.tsx', '.js', '.jsx']);
      total += files.length;
    }

    return { total };
  }

  /**
   * Recursively get all files with specific extensions
   */
  private getFilesRecursively(dir: string, extensions: string[]): string[] {
    const files: string[] = [];
    
    const traverse = (currentPath: string) => {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          // Skip test directories and node_modules
          if (!entry.name.includes('test') && 
              !entry.name.includes('spec') && 
              entry.name !== 'node_modules' &&
              entry.name !== '__tests__') {
            traverse(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext) && 
              !entry.name.includes('.test.') && 
              !entry.name.includes('.spec.')) {
            files.push(fullPath);
          }
        }
      }
    };
    
    traverse(dir);
    return files;
  }

  /**
   * Detect layer hierarchy violations
   * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7
   */
  private async detectLayerViolations(): Promise<LayerViolation[]> {
    const violations: LayerViolation[] = [];
    const allFiles = this.getFilesRecursively(this.srcPath, ['.ts', '.tsx', '.js', '.jsx'])
      .filter(file => !file.includes('migration'));

    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const imports = this.extractImports(content);
      const fromLayer = this.determineLayer(file);

      for (const importPath of imports) {
        const toLayer = this.determineLayerFromImport(importPath);
        const violation = this.checkLayerViolation(file, importPath, fromLayer, toLayer);
        
        if (violation) {
          violations.push(violation);
        }
      }
    }

    return violations;
  }

  /**
   * Detect public API usage violations
   * Requirements: 14.8
   */
  private async detectPublicApiViolations(): Promise<PublicApiViolation[]> {
    const violations: PublicApiViolation[] = [];
    const allFiles = this.getFilesRecursively(this.srcPath, ['.ts', '.tsx', '.js', '.jsx'])
      .filter(file => !file.includes('migration'));

    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const imports = this.extractImports(content);

      for (const importPath of imports) {
        const violation = this.checkPublicApiViolation(file, importPath);
        
        if (violation) {
          violations.push(violation);
        }
      }
    }

    return violations;
  }

  /**
   * Extract import statements from file content
   */
  private extractImports(content: string): string[] {
    const imports: string[] = [];
    
    // Match ES6 imports: import ... from '...'
    const importRegex = /import\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    // Match dynamic imports: import('...')
    const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  /**
   * Determine FSD layer from file path
   */
  private determineLayer(filePath: string): FSDLayer {
    const relativePath = path.relative(this.srcPath, filePath);
    const parts = relativePath.split(path.sep);
    const topLevel = parts[0];

    if (FSD_DIRECTORIES.includes(topLevel)) {
      return topLevel as FSDLayer;
    }

    if (LEGACY_DIRECTORIES.includes(topLevel)) {
      return 'legacy';
    }

    return 'legacy';
  }

  /**
   * Determine FSD layer from import path
   */
  private determineLayerFromImport(importPath: string): FSDLayer | null {
    // Handle alias imports (@/...)
    if (importPath.startsWith('@/')) {
      const parts = importPath.substring(2).split('/');
      const topLevel = parts[0];

      if (FSD_DIRECTORIES.includes(topLevel)) {
        return topLevel as FSDLayer;
      }

      if (LEGACY_DIRECTORIES.includes(topLevel)) {
        return 'legacy';
      }
    }

    // Handle relative imports
    // We can't determine layer from relative imports without resolving the path
    return null;
  }

  /**
   * Check if import violates FSD layer hierarchy
   */
  private checkLayerViolation(
    file: string,
    importPath: string,
    fromLayer: FSDLayer,
    toLayer: FSDLayer | null
  ): LayerViolation | null {
    if (!toLayer || toLayer === 'legacy') return null;
    if (fromLayer === 'legacy') return null;

    const fromIndex = LAYER_HIERARCHY.indexOf(fromLayer);
    const toIndex = LAYER_HIERARCHY.indexOf(toLayer);

    // Features cannot import from other features (cross-feature imports)
    if (fromLayer === 'features' && toLayer === 'features') {
      const fromFeature = this.extractFeatureName(file);
      const toFeature = this.extractFeatureNameFromImport(importPath);
      
      if (fromFeature && toFeature && fromFeature !== toFeature) {
        return {
          file,
          importPath,
          fromLayer,
          toLayer,
          reason: `Feature "${fromFeature}" cannot import from feature "${toFeature}". Use shared/entities instead.`
        };
      }
    }

    // Lower layers cannot import from higher layers
    if (fromIndex < toIndex) {
      return {
        file,
        importPath,
        fromLayer,
        toLayer,
        reason: `Layer "${fromLayer}" cannot import from higher layer "${toLayer}". FSD hierarchy: ${LAYER_HIERARCHY.join(' → ')}`
      };
    }

    // Entities cannot import from features or widgets
    if (fromLayer === 'entities' && (toLayer === 'features' || toLayer === 'widgets')) {
      return {
        file,
        importPath,
        fromLayer,
        toLayer,
        reason: `Entities cannot import from ${toLayer}. Entities should only import from shared and other entities.`
      };
    }

    // Shared cannot import from any higher layer
    if (fromLayer === 'shared' && toLayer !== 'shared') {
      return {
        file,
        importPath,
        fromLayer,
        toLayer,
        reason: `Shared layer cannot import from any higher layer. It should be self-contained.`
      };
    }

    return null;
  }

  /**
   * Check if import violates public API usage
   */
  private checkPublicApiViolation(
    file: string,
    importPath: string
  ): PublicApiViolation | null {
    // Only check imports from features, entities, and widgets
    if (!importPath.startsWith('@/features/') && 
        !importPath.startsWith('@/entities/') && 
        !importPath.startsWith('@/widgets/')) {
      return null;
    }

    // Check if import goes directly to internal files (not index.ts)
    const parts = importPath.split('/');
    
    // Valid patterns:
    // @/features/auth
    // @/features/auth/index
    // @/entities/user
    // @/widgets/student-dashboard
    
    // Invalid patterns:
    // @/features/auth/ui/LoginForm
    // @/features/auth/api/authService
    // @/entities/user/model/types
    
    if (parts.length > 3) {
      // Has internal path like /ui/, /api/, /model/, /lib/
      const moduleName = parts[2];
      const suggestedFix = `@/${parts[1]}/${moduleName}`;
      
      return {
        file,
        importPath,
        reason: `Direct import from internal module structure. Use public API instead.`,
        suggestedFix
      };
    }

    return null;
  }

  /**
   * Extract feature name from file path
   */
  private extractFeatureName(filePath: string): string | null {
    const match = filePath.match(/features\/([^/]+)/);
    return match ? match[1] : null;
  }

  /**
   * Extract feature name from import path
   */
  private extractFeatureNameFromImport(importPath: string): string | null {
    const match = importPath.match(/@\/features\/([^/]+)/);
    return match ? match[1] : null;
  }

  /**
   * Print compliance report to console
   */
  printReport(report: ComplianceReport): void {
    console.log('\n' + '='.repeat(80));
    console.log('FSD COMPLIANCE REPORT');
    console.log('='.repeat(80));
    console.log(`\nOverall Compliance Score: ${report.overallScore}%`);
    console.log(`Timestamp: ${report.timestamp.toISOString()}\n`);

    console.log('File Distribution:');
    console.log(`  FSD Structure:    ${report.filesInFsdStructure} files`);
    console.log(`  Legacy Structure: ${report.filesInLegacyStructure} files`);
    console.log(`  Total:            ${report.filesInFsdStructure + report.filesInLegacyStructure} files\n`);

    console.log('FSD Layer Breakdown:');
    console.log(`  app:      ${report.breakdown.app} files`);
    console.log(`  pages:    ${report.breakdown.pages} files`);
    console.log(`  widgets:  ${report.breakdown.widgets} files`);
    console.log(`  features: ${report.breakdown.features} files`);
    console.log(`  entities: ${report.breakdown.entities} files`);
    console.log(`  shared:   ${report.breakdown.shared} files`);
    console.log(`  legacy:   ${report.breakdown.legacy} files\n`);

    console.log(`Layer Violations: ${report.layerViolations.length}`);
    if (report.layerViolations.length > 0) {
      console.log('\nTop 10 Layer Violations:');
      report.layerViolations.slice(0, 10).forEach((v, i) => {
        console.log(`  ${i + 1}. ${v.file}`);
        console.log(`     Import: ${v.importPath}`);
        console.log(`     ${v.reason}\n`);
      });
    }

    console.log(`\nPublic API Violations: ${report.publicApiViolations.length}`);
    if (report.publicApiViolations.length > 0) {
      console.log('\nTop 10 Public API Violations:');
      report.publicApiViolations.slice(0, 10).forEach((v, i) => {
        console.log(`  ${i + 1}. ${v.file}`);
        console.log(`     Import: ${v.importPath}`);
        console.log(`     ${v.reason}`);
        console.log(`     Suggested: ${v.suggestedFix}\n`);
      });
    }

    console.log('='.repeat(80) + '\n');
  }

  /**
   * Save compliance report to JSON file
   */
  async saveReport(report: ComplianceReport, outputPath: string): Promise<void> {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`Compliance report saved to: ${outputPath}`);
  }
}

// CLI execution - always run when executed directly
const validator = new FSDComplianceValidator();

validator.generateComplianceReport()
  .then(report => {
    validator.printReport(report);
    return validator.saveReport(report, 'src/migration/reports/fsd-compliance-report.json');
  })
  .catch(error => {
    console.error('Error generating compliance report:', error);
    process.exit(1);
  });
