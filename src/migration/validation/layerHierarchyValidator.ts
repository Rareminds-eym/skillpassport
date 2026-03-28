/**
 * Layer Hierarchy Validator
 * 
 * Validates FSD layer hierarchy rules:
 * - app → pages → widgets → features → entities → shared
 * - Features cannot import from other features
 * - Entities cannot import from features/widgets
 * - Shared cannot import from higher layers
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7
 */

import * as fs from 'fs';
import * as path from 'path';

export interface LayerHierarchyReport {
  totalViolations: number;
  violationsByType: {
    upwardDependency: number;
    crossFeature: number;
    entityToFeature: number;
    sharedToHigher: number;
  };
  violations: LayerViolation[];
  timestamp: Date;
}

export interface LayerViolation {
  file: string;
  line: number;
  importPath: string;
  fromLayer: FSDLayer;
  toLayer: FSDLayer;
  violationType: ViolationType;
  reason: string;
  suggestion: string;
}

export type FSDLayer = 'app' | 'pages' | 'widgets' | 'features' | 'entities' | 'shared' | 'legacy';
export type ViolationType = 'upward_dependency' | 'cross_feature' | 'entity_to_feature' | 'shared_to_higher';

const LAYER_HIERARCHY: FSDLayer[] = ['shared', 'entities', 'features', 'widgets', 'pages', 'app'];

export class LayerHierarchyValidator {
  private srcPath: string;

  constructor(srcPath: string = 'src') {
    this.srcPath = srcPath;
  }

  /**
   * Generate comprehensive layer hierarchy report
   */
  async generateReport(): Promise<LayerHierarchyReport> {
    const violations = await this.detectAllViolations();
    
    const violationsByType = {
      upwardDependency: violations.filter(v => v.violationType === 'upward_dependency').length,
      crossFeature: violations.filter(v => v.violationType === 'cross_feature').length,
      entityToFeature: violations.filter(v => v.violationType === 'entity_to_feature').length,
      sharedToHigher: violations.filter(v => v.violationType === 'shared_to_higher').length
    };

    return {
      totalViolations: violations.length,
      violationsByType,
      violations,
      timestamp: new Date()
    };
  }

  /**
   * Detect all layer hierarchy violations
   */
  private async detectAllViolations(): Promise<LayerViolation[]> {
    const violations: LayerViolation[] = [];
    const allFiles = this.getFilesRecursively(this.srcPath, ['.ts', '.tsx', '.js', '.jsx'])
      .filter(file => !file.includes('migration') && !file.includes('__tests__'));

    for (const file of allFiles) {
      const fileViolations = this.checkFileViolations(file);
      violations.push(...fileViolations);
    }

    return violations;
  }

  /**
   * Check violations in a single file
   */
  private checkFileViolations(filePath: string): LayerViolation[] {
    const violations: LayerViolation[] = [];
    const content = fs.readFileSync(filePath, 'utf-8');
    const imports = this.extractImportsWithLines(content);
    const fromLayer = this.determineLayer(filePath);

    for (const { importPath, line } of imports) {
      const toLayer = this.determineLayerFromImport(importPath);
      
      if (!toLayer || toLayer === 'legacy') continue;
      if (fromLayer === 'legacy') continue;

      const violation = this.checkViolation(filePath, line, importPath, fromLayer, toLayer);
      if (violation) {
        violations.push(violation);
      }
    }

    return violations;
  }

  /**
   * Check if import violates layer hierarchy
   */
  private checkViolation(
    file: string,
    line: number,
    importPath: string,
    fromLayer: FSDLayer,
    toLayer: FSDLayer
  ): LayerViolation | null {
    const fromIndex = LAYER_HIERARCHY.indexOf(fromLayer);
    const toIndex = LAYER_HIERARCHY.indexOf(toLayer);

    // Rule 1: Features cannot import from other features (cross-feature imports)
    if (fromLayer === 'features' && toLayer === 'features') {
      const fromFeature = this.extractFeatureName(file);
      const toFeature = this.extractFeatureNameFromImport(importPath);
      
      if (fromFeature && toFeature && fromFeature !== toFeature) {
        return {
          file,
          line,
          importPath,
          fromLayer,
          toLayer,
          violationType: 'cross_feature',
          reason: `Feature "${fromFeature}" imports from feature "${toFeature}"`,
          suggestion: `Move shared logic to entities/ or shared/ layer`
        };
      }
    }

    // Rule 2: Entities cannot import from features or widgets
    if (fromLayer === 'entities' && (toLayer === 'features' || toLayer === 'widgets')) {
      return {
        file,
        line,
        importPath,
        fromLayer,
        toLayer,
        violationType: 'entity_to_feature',
        reason: `Entity imports from ${toLayer} layer`,
        suggestion: `Entities should only import from shared/ and other entities/`
      };
    }

    // Rule 3: Shared cannot import from any higher layer
    if (fromLayer === 'shared' && toLayer !== 'shared') {
      return {
        file,
        line,
        importPath,
        fromLayer,
        toLayer,
        violationType: 'shared_to_higher',
        reason: `Shared layer imports from ${toLayer} layer`,
        suggestion: `Shared layer must be self-contained. Move logic to ${toLayer} or refactor.`
      };
    }

    // Rule 4: Lower layers cannot import from higher layers (upward dependency)
    if (fromIndex < toIndex) {
      return {
        file,
        line,
        importPath,
        fromLayer,
        toLayer,
        violationType: 'upward_dependency',
        reason: `Layer "${fromLayer}" imports from higher layer "${toLayer}"`,
        suggestion: `Follow FSD hierarchy: ${LAYER_HIERARCHY.join(' → ')}`
      };
    }

    return null;
  }

  /**
   * Extract imports with line numbers
   */
  private extractImportsWithLines(content: string): Array<{ importPath: string; line: number }> {
    const imports: Array<{ importPath: string; line: number }> = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Match ES6 imports: import ... from '...'
      const importMatch = line.match(/import\s+(?:[\w\s{},*]+\s+from\s+)?['"]([^'"]+)['"]/);
      if (importMatch) {
        imports.push({ importPath: importMatch[1], line: i + 1 });
      }

      // Match dynamic imports: import('...')
      const dynamicMatch = line.match(/import\s*\(\s*['"]([^'"]+)['"]\s*\)/);
      if (dynamicMatch) {
        imports.push({ importPath: dynamicMatch[1], line: i + 1 });
      }
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

    const fsdLayers: FSDLayer[] = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];
    if (fsdLayers.includes(topLevel as FSDLayer)) {
      return topLevel as FSDLayer;
    }

    return 'legacy';
  }

  /**
   * Determine FSD layer from import path
   */
  private determineLayerFromImport(importPath: string): FSDLayer | null {
    if (importPath.startsWith('@/')) {
      const parts = importPath.substring(2).split('/');
      const topLevel = parts[0];

      const fsdLayers: FSDLayer[] = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];
      if (fsdLayers.includes(topLevel as FSDLayer)) {
        return topLevel as FSDLayer;
      }

      return 'legacy';
    }

    return null;
  }

  /**
   * Extract feature name from file path
   */
  private extractFeatureName(filePath: string): string | null {
    const match = filePath.match(/features[/\\]([^/\\]+)/);
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
   * Recursively get all files with specific extensions
   */
  private getFilesRecursively(dir: string, extensions: string[]): string[] {
    const files: string[] = [];
    
    if (!fs.existsSync(dir)) return files;
    
    const traverse = (currentPath: string) => {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
            traverse(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };
    
    traverse(dir);
    return files;
  }

  /**
   * Print layer hierarchy report
   */
  printReport(report: LayerHierarchyReport): void {
    console.log('\n' + '='.repeat(80));
    console.log('LAYER HIERARCHY VALIDATION REPORT');
    console.log('='.repeat(80));
    console.log(`\nTotal Violations: ${report.totalViolations}`);
    console.log(`Timestamp: ${report.timestamp.toISOString()}\n`);

    console.log('Violations by Type:');
    console.log(`  Upward Dependencies:     ${report.violationsByType.upwardDependency}`);
    console.log(`  Cross-Feature Imports:   ${report.violationsByType.crossFeature}`);
    console.log(`  Entity → Feature:        ${report.violationsByType.entityToFeature}`);
    console.log(`  Shared → Higher Layer:   ${report.violationsByType.sharedToHigher}\n`);

    if (report.violations.length > 0) {
      console.log('Violations by Type:\n');

      // Group by violation type
      const grouped = {
        upward_dependency: report.violations.filter(v => v.violationType === 'upward_dependency'),
        cross_feature: report.violations.filter(v => v.violationType === 'cross_feature'),
        entity_to_feature: report.violations.filter(v => v.violationType === 'entity_to_feature'),
        shared_to_higher: report.violations.filter(v => v.violationType === 'shared_to_higher')
      };

      for (const [type, violations] of Object.entries(grouped)) {
        if (violations.length === 0) continue;

        console.log(`${type.toUpperCase().replace(/_/g, ' ')} (${violations.length}):`);
        violations.slice(0, 5).forEach((v, i) => {
          console.log(`  ${i + 1}. ${path.relative(this.srcPath, v.file)}:${v.line}`);
          console.log(`     Import: ${v.importPath}`);
          console.log(`     ${v.reason}`);
          console.log(`     Fix: ${v.suggestion}\n`);
        });
        if (violations.length > 5) {
          console.log(`     ... and ${violations.length - 5} more\n`);
        }
      }
    }

    console.log('='.repeat(80) + '\n');
  }

  /**
   * Save report to JSON file
   */
  async saveReport(report: LayerHierarchyReport, outputPath: string): Promise<void> {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`Layer hierarchy report saved to: ${outputPath}`);
  }
}

// CLI execution
const validator = new LayerHierarchyValidator();

validator.generateReport()
  .then(report => {
    validator.printReport(report);
    return validator.saveReport(report, 'src/migration/reports/layer-hierarchy-report.json');
  })
  .catch(error => {
    console.error('Error generating layer hierarchy report:', error);
    process.exit(1);
  });
