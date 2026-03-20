/**
 * FSD Compliance Validation System
 * 
 * Validates Feature-Sliced Design architectural compliance including:
 * - Layer hierarchy (app → pages → widgets → features → entities → shared)
 * - No upward dependencies
 * - Public API usage patterns
 * - Layer composition rules
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

// ============================================================================
// Types
// ============================================================================

export interface FSDComplianceValidator {
  validateLayerHierarchy(): Promise<HierarchyValidation>;
  validateDependencies(): Promise<DependencyValidation>;
  validatePublicAPIs(): Promise<APIValidation>;
  generateComplianceReport(): Promise<ComplianceReport>;
}

export interface HierarchyValidation {
  layerStructure: LayerValidation[];
  upwardDependencies: Violation[];
  crossLayerImports: ImportValidation[];
  publicAPIUsage: APIUsageValidation[];
}

export interface LayerValidation {
  layer: FSDLayer;
  path: string;
  exists: boolean;
  slices: string[];
  violations: Violation[];
}

export interface Violation {
  type: 'upward-dependency' | 'missing-public-api' | 'invalid-import' | 'layer-violation';
  severity: 'error' | 'warning';
  file: string;
  line?: number;
  message: string;
  suggestion: string;
  fromLayer: FSDLayer;
  toLayer: FSDLayer;
  importPath: string;
}

export interface ImportValidation {
  file: string;
  imports: ImportInfo[];
  violations: Violation[];
  validImports: number;
  invalidImports: number;
}

export interface ImportInfo {
  importPath: string;
  line: number;
  fromLayer: FSDLayer;
  toLayer: FSDLayer;
  isValid: boolean;
  isPublicAPI: boolean;
  reason?: string;
}

export interface APIUsageValidation {
  slice: string;
  layer: FSDLayer;
  hasPublicAPI: boolean;
  publicAPIPath: string;
  exports: string[];
  deepImports: DeepImport[];
  violations: Violation[];
}

export interface DeepImport {
  file: string;
  importPath: string;
  line: number;
  shouldUsePublicAPI: boolean;
}

export interface DependencyValidation {
  totalDependencies: number;
  validDependencies: number;
  invalidDependencies: number;
  upwardDependencies: UpwardDependency[];
  violations: Violation[];
}

export interface UpwardDependency {
  fromFile: string;
  toFile: string;
  fromLayer: FSDLayer;
  toLayer: FSDLayer;
  importPath: string;
  line: number;
}

export interface APIValidation {
  totalSlices: number;
  slicesWithPublicAPI: number;
  slicesWithoutPublicAPI: string[];
  publicAPIViolations: Violation[];
  recommendations: string[];
}

export interface ComplianceReport {
  timestamp: Date;
  overallCompliance: boolean;
  complianceScore: number;
  hierarchyValidation: HierarchyValidation;
  dependencyValidation: DependencyValidation;
  apiValidation: APIValidation;
  summary: ComplianceSummary;
  remediationRecommendations: RemediationRecommendation[];
}

export interface ComplianceSummary {
  totalViolations: number;
  errorCount: number;
  warningCount: number;
  layersValidated: number;
  slicesValidated: number;
  filesScanned: number;
}

export interface RemediationRecommendation {
  priority: 'high' | 'medium' | 'low';
  category: 'layer-hierarchy' | 'dependencies' | 'public-api' | 'imports';
  title: string;
  description: string;
  affectedFiles: string[];
  steps: string[];
  estimatedEffort: 'small' | 'medium' | 'large';
}

export type FSDLayer = 'app' | 'pages' | 'widgets' | 'features' | 'entities' | 'shared';

// ============================================================================
// Implementation
// ============================================================================

export class FSDComplianceValidatorImpl implements FSDComplianceValidator {
  private projectRoot: string;
  private layerHierarchy: FSDLayer[] = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];
  private scannedFiles: Set<string> = new Set();

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  async validateLayerHierarchy(): Promise<HierarchyValidation> {
    const layerStructure: LayerValidation[] = [];
    const upwardDependencies: Violation[] = [];
    const crossLayerImports: ImportValidation[] = [];
    const publicAPIUsage: APIUsageValidation[] = [];

    // Validate each layer
    for (const layer of this.layerHierarchy) {
      const layerPath = path.join(this.projectRoot, 'src', layer);
      const exists = await this.directoryExists(layerPath);

      if (!exists && layer !== 'app' && layer !== 'pages') {
        // app and pages might not exist yet, others should
        layerStructure.push({
          layer,
          path: layerPath,
          exists: false,
          slices: [],
          violations: [{
            type: 'layer-violation',
            severity: 'warning',
            file: layerPath,
            message: `Layer directory does not exist: ${layer}`,
            suggestion: `Create the ${layer} layer directory at ${layerPath}`,
            fromLayer: layer,
            toLayer: layer,
            importPath: ''
          }]
        });
        continue;
      }

      const slices = exists ? await this.getSlices(layerPath) : [];
      const violations: Violation[] = [];

      // Validate each slice in the layer
      for (const slice of slices) {
        const slicePath = path.join(layerPath, slice);
        const sliceViolations = await this.validateSliceStructure(slicePath, layer, slice);
        violations.push(...sliceViolations);

        // Check public API
        const apiValidation = await this.validateSlicePublicAPI(slicePath, layer, slice);
        publicAPIUsage.push(apiValidation);

        // Check imports
        const importValidation = await this.validateSliceImports(slicePath, layer);
        crossLayerImports.push(importValidation);

        // Collect upward dependencies
        const upwardDeps = importValidation.violations.filter(v => v.type === 'upward-dependency');
        upwardDependencies.push(...upwardDeps);
      }

      layerStructure.push({
        layer,
        path: layerPath,
        exists,
        slices,
        violations
      });
    }

    return {
      layerStructure,
      upwardDependencies,
      crossLayerImports,
      publicAPIUsage
    };
  }

  async validateDependencies(): Promise<DependencyValidation> {
    const violations: Violation[] = [];
    const upwardDependencies: UpwardDependency[] = [];
    let totalDependencies = 0;

    // Scan all TypeScript files
    const files = await this.getAllTypeScriptFiles();

    for (const file of files) {
      const fromLayer = this.extractLayer(file);
      if (!fromLayer) continue;

      const imports = await this.extractImports(file);
      totalDependencies += imports.length;

      for (const imp of imports) {
        const toLayer = this.extractLayer(imp.importPath);
        if (!toLayer) continue;

        // Check for upward dependencies
        if (this.isUpwardDependency(fromLayer, toLayer)) {
          const violation: Violation = {
            type: 'upward-dependency',
            severity: 'error',
            file,
            line: imp.line,
            message: `Upward dependency detected: ${fromLayer} → ${toLayer}`,
            suggestion: `Move shared functionality to a lower layer or refactor to use events/callbacks`,
            fromLayer,
            toLayer,
            importPath: imp.importPath
          };
          violations.push(violation);

          upwardDependencies.push({
            fromFile: file,
            toFile: imp.importPath,
            fromLayer,
            toLayer,
            importPath: imp.importPath,
            line: imp.line
          });
        }
      }
    }

    return {
      totalDependencies,
      validDependencies: totalDependencies - upwardDependencies.length,
      invalidDependencies: upwardDependencies.length,
      upwardDependencies,
      violations
    };
  }

  async validatePublicAPIs(): Promise<APIValidation> {
    const violations: Violation[] = [];
    const slicesWithoutPublicAPI: string[] = [];
    let totalSlices = 0;
    let slicesWithPublicAPI = 0;

    // Check features, entities, and widgets layers
    const layersToCheck: FSDLayer[] = ['features', 'entities', 'widgets'];

    for (const layer of layersToCheck) {
      const layerPath = path.join(this.projectRoot, 'src', layer);
      const exists = await this.directoryExists(layerPath);
      if (!exists) continue;

      const slices = await this.getSlices(layerPath);
      totalSlices += slices.length;

      for (const slice of slices) {
        const slicePath = path.join(layerPath, slice);
        const indexPath = path.join(slicePath, 'index.ts');
        const hasPublicAPI = await this.fileExists(indexPath);

        if (hasPublicAPI) {
          slicesWithPublicAPI++;

          // Validate that the public API exports are used
          const deepImports = await this.findDeepImports(slicePath, layer, slice);
          if (deepImports.length > 0) {
            violations.push({
              type: 'missing-public-api',
              severity: 'warning',
              file: slicePath,
              message: `Slice ${layer}/${slice} has deep imports bypassing public API`,
              suggestion: `Update imports to use public API: import { ... } from '@/${layer}/${slice}'`,
              fromLayer: layer,
              toLayer: layer,
              importPath: `@/${layer}/${slice}`
            });
          }
        } else {
          slicesWithoutPublicAPI.push(`${layer}/${slice}`);
          violations.push({
            type: 'missing-public-api',
            severity: 'error',
            file: slicePath,
            message: `Slice ${layer}/${slice} missing public API (index.ts)`,
            suggestion: `Create ${indexPath} to expose public API`,
            fromLayer: layer,
            toLayer: layer,
            importPath: ''
          });
        }
      }
    }

    const recommendations = this.generatePublicAPIRecommendations(slicesWithoutPublicAPI);

    return {
      totalSlices,
      slicesWithPublicAPI,
      slicesWithoutPublicAPI,
      publicAPIViolations: violations,
      recommendations
    };
  }

  async generateComplianceReport(): Promise<ComplianceReport> {
    const hierarchyValidation = await this.validateLayerHierarchy();
    const dependencyValidation = await this.validateDependencies();
    const apiValidation = await this.validatePublicAPIs();

    const allViolations = [
      ...hierarchyValidation.upwardDependencies,
      ...hierarchyValidation.crossLayerImports.flatMap(i => i.violations),
      ...hierarchyValidation.publicAPIUsage.flatMap(a => a.violations),
      ...dependencyValidation.violations,
      ...apiValidation.publicAPIViolations
    ];

    const errorCount = allViolations.filter(v => v.severity === 'error').length;
    const warningCount = allViolations.filter(v => v.severity === 'warning').length;

    const complianceScore = this.calculateComplianceScore(
      allViolations.length,
      errorCount,
      warningCount,
      this.scannedFiles.size
    );

    const summary: ComplianceSummary = {
      totalViolations: allViolations.length,
      errorCount,
      warningCount,
      layersValidated: hierarchyValidation.layerStructure.length,
      slicesValidated: apiValidation.totalSlices,
      filesScanned: this.scannedFiles.size
    };

    const remediationRecommendations = this.generateRemediationRecommendations(
      hierarchyValidation,
      dependencyValidation,
      apiValidation
    );

    return {
      timestamp: new Date(),
      overallCompliance: errorCount === 0,
      complianceScore,
      hierarchyValidation,
      dependencyValidation,
      apiValidation,
      summary,
      remediationRecommendations
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath);
      return stats.isFile();
    } catch {
      return false;
    }
  }

  private async getSlices(layerPath: string): Promise<string[]> {
    try {
      const entries = await fs.readdir(layerPath, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
    } catch {
      return [];
    }
  }

  private async getAllTypeScriptFiles(): Promise<string[]> {
    const pattern = path.join(this.projectRoot, 'src', '**', '*.{ts,tsx}');
    const files = await glob(pattern, {
      ignore: ['**/node_modules/**', '**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts']
    });
    files.forEach(f => this.scannedFiles.add(f));
    return files;
  }

  private extractLayer(filePath: string): FSDLayer | null {
    const normalized = filePath.replace(/\\/g, '/');
    
    for (const layer of this.layerHierarchy) {
      if (normalized.includes(`/src/${layer}/`) || normalized.includes(`@/${layer}/`)) {
        return layer;
      }
    }
    
    return null;
  }

  private async extractImports(filePath: string): Promise<Array<{ importPath: string; line: number }>> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const imports: Array<{ importPath: string; line: number }> = [];
      const lines = content.split('\n');

      const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;

      lines.forEach((line, index) => {
        let match;
        while ((match = importRegex.exec(line)) !== null) {
          imports.push({
            importPath: match[1],
            line: index + 1
          });
        }
      });

      return imports;
    } catch {
      return [];
    }
  }

  private isUpwardDependency(fromLayer: FSDLayer, toLayer: FSDLayer): boolean {
    const fromIndex = this.layerHierarchy.indexOf(fromLayer);
    const toIndex = this.layerHierarchy.indexOf(toLayer);
    
    // Lower layers cannot import from higher layers
    return fromIndex > toIndex;
  }

  private async validateSliceStructure(
    slicePath: string,
    layer: FSDLayer,
    slice: string
  ): Promise<Violation[]> {
    const violations: Violation[] = [];

    // For entities and features, check for model, ui, api structure
    if (layer === 'entities' || layer === 'features') {
      const expectedDirs = layer === 'entities' ? ['model', 'ui', 'api'] : ['model', 'ui', 'api'];
      
      for (const dir of expectedDirs) {
        const dirPath = path.join(slicePath, dir);
        const exists = await this.directoryExists(dirPath);
        
        if (!exists && dir === 'model') {
          // model is required
          violations.push({
            type: 'layer-violation',
            severity: 'error',
            file: slicePath,
            message: `Missing required ${dir} directory in ${layer}/${slice}`,
            suggestion: `Create ${dirPath} directory`,
            fromLayer: layer,
            toLayer: layer,
            importPath: ''
          });
        }
      }
    }

    return violations;
  }

  private async validateSlicePublicAPI(
    slicePath: string,
    layer: FSDLayer,
    slice: string
  ): Promise<APIUsageValidation> {
    const indexPath = path.join(slicePath, 'index.ts');
    const hasPublicAPI = await this.fileExists(indexPath);
    
    const exports: string[] = [];
    if (hasPublicAPI) {
      const content = await fs.readFile(indexPath, 'utf-8');
      const exportRegex = /export\s+(?:\{([^}]+)\}|(?:\*\s+from)|(?:default)|(?:const|let|var|function|class|interface|type)\s+(\w+))/g;
      let match;
      while ((match = exportRegex.exec(content)) !== null) {
        if (match[1]) {
          exports.push(...match[1].split(',').map(e => e.trim()));
        } else if (match[2]) {
          exports.push(match[2]);
        }
      }
    }

    const deepImports = await this.findDeepImports(slicePath, layer, slice);
    const violations: Violation[] = [];

    if (!hasPublicAPI && (layer === 'features' || layer === 'entities' || layer === 'widgets')) {
      violations.push({
        type: 'missing-public-api',
        severity: 'error',
        file: slicePath,
        message: `Missing public API (index.ts) for ${layer}/${slice}`,
        suggestion: `Create ${indexPath} to expose public API`,
        fromLayer: layer,
        toLayer: layer,
        importPath: ''
      });
    }

    return {
      slice: `${layer}/${slice}`,
      layer,
      hasPublicAPI,
      publicAPIPath: indexPath,
      exports,
      deepImports,
      violations
    };
  }

  private async validateSliceImports(
    slicePath: string,
    layer: FSDLayer
  ): Promise<ImportValidation> {
    const files = await glob(path.join(slicePath, '**', '*.{ts,tsx}'), {
      ignore: ['**/node_modules/**', '**/*.test.ts', '**/*.test.tsx']
    });

    const imports: ImportInfo[] = [];
    const violations: Violation[] = [];
    let validImports = 0;
    let invalidImports = 0;

    for (const file of files) {
      const fileImports = await this.extractImports(file);
      
      for (const imp of fileImports) {
        const toLayer = this.extractLayer(imp.importPath);
        if (!toLayer) continue;

        const isValid = !this.isUpwardDependency(layer, toLayer);
        const isPublicAPI = this.isPublicAPIImport(imp.importPath);

        if (isValid) {
          validImports++;
        } else {
          invalidImports++;
          violations.push({
            type: 'upward-dependency',
            severity: 'error',
            file,
            line: imp.line,
            message: `Upward dependency: ${layer} → ${toLayer}`,
            suggestion: `Refactor to remove upward dependency`,
            fromLayer: layer,
            toLayer,
            importPath: imp.importPath
          });
        }

        imports.push({
          importPath: imp.importPath,
          line: imp.line,
          fromLayer: layer,
          toLayer,
          isValid,
          isPublicAPI,
          reason: isValid ? undefined : 'Upward dependency'
        });
      }
    }

    return {
      file: slicePath,
      imports,
      violations,
      validImports,
      invalidImports
    };
  }

  private isPublicAPIImport(importPath: string): boolean {
    // Check if import uses public API pattern (ends with layer/slice, not layer/slice/internal/path)
    const match = importPath.match(/@\/(features|entities|widgets)\/([^/]+)$/);
    return match !== null;
  }

  private async findDeepImports(
    slicePath: string,
    layer: FSDLayer,
    slice: string
  ): Promise<DeepImport[]> {
    const deepImports: DeepImport[] = [];
    const allFiles = await this.getAllTypeScriptFiles();

    const slicePattern = `@/${layer}/${slice}/`;

    for (const file of allFiles) {
      // Skip files within the same slice
      if (file.includes(slicePath)) continue;

      const imports = await this.extractImports(file);
      
      for (const imp of imports) {
        if (imp.importPath.includes(slicePattern) && !this.isPublicAPIImport(imp.importPath)) {
          deepImports.push({
            file,
            importPath: imp.importPath,
            line: imp.line,
            shouldUsePublicAPI: true
          });
        }
      }
    }

    return deepImports;
  }

  private calculateComplianceScore(
    totalViolations: number,
    errorCount: number,
    warningCount: number,
    filesScanned: number
  ): number {
    if (filesScanned === 0) return 100;

    // Base score starts at 100
    let score = 100;

    // Deduct points for violations
    score -= errorCount * 5;  // 5 points per error
    score -= warningCount * 2; // 2 points per warning

    // Ensure score doesn't go below 0
    return Math.max(0, Math.min(100, score));
  }

  private generatePublicAPIRecommendations(slicesWithoutPublicAPI: string[]): string[] {
    const recommendations: string[] = [];

    if (slicesWithoutPublicAPI.length > 0) {
      recommendations.push(
        `Create public API (index.ts) for ${slicesWithoutPublicAPI.length} slices: ${slicesWithoutPublicAPI.slice(0, 3).join(', ')}${slicesWithoutPublicAPI.length > 3 ? '...' : ''}`
      );
      recommendations.push(
        'Public APIs should export only the necessary interfaces, types, and functions that other layers need to consume'
      );
      recommendations.push(
        'Use barrel exports (index.ts) to control what is exposed from each slice'
      );
    }

    return recommendations;
  }

  private generateRemediationRecommendations(
    hierarchyValidation: HierarchyValidation,
    dependencyValidation: DependencyValidation,
    apiValidation: APIValidation
  ): RemediationRecommendation[] {
    const recommendations: RemediationRecommendation[] = [];

    // Upward dependencies
    if (dependencyValidation.upwardDependencies.length > 0) {
      const affectedFiles = [...new Set(dependencyValidation.upwardDependencies.map(d => d.fromFile))];
      recommendations.push({
        priority: 'high',
        category: 'dependencies',
        title: 'Fix Upward Dependencies',
        description: `Found ${dependencyValidation.upwardDependencies.length} upward dependencies violating FSD layer hierarchy`,
        affectedFiles,
        steps: [
          'Identify shared functionality causing upward dependencies',
          'Move shared code to lower layers (shared or entities)',
          'Use dependency inversion or event-driven patterns where needed',
          'Update imports to use proper layer hierarchy'
        ],
        estimatedEffort: 'large'
      });
    }

    // Missing public APIs
    if (apiValidation.slicesWithoutPublicAPI.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'public-api',
        title: 'Create Public APIs',
        description: `${apiValidation.slicesWithoutPublicAPI.length} slices missing public API (index.ts)`,
        affectedFiles: apiValidation.slicesWithoutPublicAPI.map(s => `src/${s}/index.ts`),
        steps: [
          'Create index.ts file in each slice directory',
          'Export public interfaces, types, and functions',
          'Keep internal implementation details private',
          'Update imports across codebase to use public APIs'
        ],
        estimatedEffort: 'medium'
      });
    }

    // Deep imports
    const deepImportCount = hierarchyValidation.publicAPIUsage
      .reduce((sum, usage) => sum + usage.deepImports.length, 0);
    
    if (deepImportCount > 0) {
      const affectedFiles = hierarchyValidation.publicAPIUsage
        .flatMap(usage => usage.deepImports.map(d => d.file));
      
      recommendations.push({
        priority: 'medium',
        category: 'imports',
        title: 'Replace Deep Imports with Public API',
        description: `Found ${deepImportCount} deep imports bypassing public APIs`,
        affectedFiles: [...new Set(affectedFiles)],
        steps: [
          'Identify all deep imports in the codebase',
          'Update imports to use public API pattern: @/layer/slice',
          'Ensure public APIs export all necessary items',
          'Run tests to verify functionality is preserved'
        ],
        estimatedEffort: 'medium'
      });
    }

    // Layer structure violations
    const structureViolations = hierarchyValidation.layerStructure
      .flatMap(l => l.violations)
      .filter(v => v.type === 'layer-violation');
    
    if (structureViolations.length > 0) {
      recommendations.push({
        priority: 'low',
        category: 'layer-hierarchy',
        title: 'Fix Layer Structure',
        description: `Found ${structureViolations.length} layer structure violations`,
        affectedFiles: structureViolations.map(v => v.file),
        steps: [
          'Create missing layer directories',
          'Organize slices according to FSD structure',
          'Ensure proper model/ui/api subdirectories where required'
        ],
        estimatedEffort: 'small'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }
}
