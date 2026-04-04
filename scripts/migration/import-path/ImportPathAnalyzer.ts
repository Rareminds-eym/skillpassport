import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import { MigrationLogger } from '../logging/MigrationLogger';
import {
  ImportPathAnalysis,
  ImportStatement,
  ImportViolation,
  PathPattern
} from '@/shared/types/import-path';

export class ImportPathAnalyzer {
  private logger: MigrationLogger;
  private sourceRoot: string;

  constructor(logger: MigrationLogger, sourceRoot: string = 'src') {
    this.logger = logger;
    this.sourceRoot = sourceRoot;
  }

  async analyzeImportPaths(filePaths: string[]): Promise<ImportPathAnalysis> {
    this.logger.info('Starting import path analysis', { fileCount: filePaths.length });

    const imports: ImportStatement[] = [];
    const violations: ImportViolation[] = [];

    for (const filePath of filePaths) {
      try {
        const fileImports = await this.extractImports(filePath);
        imports.push(...fileImports);

        const fileViolations = this.detectViolations(fileImports, filePath);
        violations.push(...fileViolations);
      } catch (error) {
        this.logger.warn(`Failed to analyze imports in ${filePath}`, { error });
      }
    }

    const analysis: ImportPathAnalysis = {
      totalImports: imports.length,
      imports,
      violations,
      violationsByType: this.groupViolationsByType(violations),
      statistics: this.calculateStatistics(imports, violations)
    };

    this.logger.info('Import path analysis completed', {
      totalImports: analysis.totalImports,
      totalViolations: violations.length
    });

    return analysis;
  }

  private async extractImports(filePath: string): Promise<ImportStatement[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    const imports: ImportStatement[] = [];

    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpecifier)) {
          const importPath = moduleSpecifier.text;
          const importType = this.classifyImportType(importPath);
          const isRelative = importPath.startsWith('.') || importPath.startsWith('..');
          const usesAlias = importPath.startsWith('@/');

          imports.push({
            filePath,
            importPath,
            importType,
            isRelative,
            usesAlias,
            line: sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1,
            namedImports: this.extractNamedImports(node),
            defaultImport: this.extractDefaultImport(node)
          });
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return imports;
  }

  private classifyImportType(importPath: string): 'internal' | 'external' | 'fsd-layer' {
    if (!importPath.startsWith('.') && !importPath.startsWith('@/')) {
      return 'external';
    }

    const fsdLayers = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];
    const pathParts = importPath.replace('@/', '').split('/');
    
    if (fsdLayers.includes(pathParts[0])) {
      return 'fsd-layer';
    }

    return 'internal';
  }

  private extractNamedImports(node: ts.ImportDeclaration): string[] {
    const namedImports: string[] = [];
    
    if (node.importClause?.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
      node.importClause.namedBindings.elements.forEach(element => {
        namedImports.push(element.name.text);
      });
    }

    return namedImports;
  }

  private extractDefaultImport(node: ts.ImportDeclaration): string | undefined {
    return node.importClause?.name?.text;
  }

  private detectViolations(imports: ImportStatement[], filePath: string): ImportViolation[] {
    const violations: ImportViolation[] = [];
    const fileLayer = this.detectFileLayer(filePath);

    for (const imp of imports) {
      // Violation 1: Relative imports crossing layer boundaries
      if (imp.isRelative && imp.importType === 'fsd-layer') {
        const targetLayer = this.detectImportTargetLayer(imp.importPath, filePath);
        if (targetLayer && targetLayer !== fileLayer) {
          violations.push({
            type: 'cross-layer-relative',
            severity: 'error',
            filePath,
            line: imp.line,
            importPath: imp.importPath,
            message: `Relative import crosses layer boundary from ${fileLayer} to ${targetLayer}`,
            suggestion: this.convertToAbsolutePath(imp.importPath, filePath)
          });
        }
      }

      // Violation 2: Not using @ alias for FSD layers
      if (!imp.usesAlias && imp.importType === 'fsd-layer') {
        violations.push({
          type: 'missing-alias',
          severity: 'warning',
          filePath,
          line: imp.line,
          importPath: imp.importPath,
          message: 'Import should use @ alias for FSD layers',
          suggestion: this.convertToAbsolutePath(imp.importPath, filePath)
        });
      }

      // Violation 3: Deep imports (not using public API)
      if (imp.usesAlias && this.isDeepImport(imp.importPath)) {
        violations.push({
          type: 'deep-import',
          severity: 'warning',
          filePath,
          line: imp.line,
          importPath: imp.importPath,
          message: 'Import should use public API (index.ts) instead of deep import',
          suggestion: this.convertToPublicAPI(imp.importPath)
        });
      }

      // Violation 4: Upward dependencies
      if (fileLayer && imp.importType === 'fsd-layer') {
        const targetLayer = this.detectImportTargetLayer(imp.importPath, filePath);
        if (targetLayer && this.isUpwardDependency(fileLayer, targetLayer)) {
          violations.push({
            type: 'upward-dependency',
            severity: 'error',
            filePath,
            line: imp.line,
            importPath: imp.importPath,
            message: `Upward dependency detected: ${fileLayer} cannot import from ${targetLayer}`,
            suggestion: 'Refactor to follow FSD layer hierarchy'
          });
        }
      }
    }

    return violations;
  }

  private detectFileLayer(filePath: string): string | null {
    const fsdLayers = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    for (const layer of fsdLayers) {
      if (normalizedPath.includes(`/src/${layer}/`)) {
        return layer;
      }
    }

    return null;
  }

  private detectImportTargetLayer(importPath: string, fromFile: string): string | null {
    const fsdLayers = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];
    
    // For absolute imports with @/
    if (importPath.startsWith('@/')) {
      const pathParts = importPath.replace('@/', '').split('/');
      if (fsdLayers.includes(pathParts[0])) {
        return pathParts[0];
      }
    }

    // For relative imports, resolve the path
    if (importPath.startsWith('.')) {
      const fromDir = path.dirname(fromFile);
      const resolvedPath = path.resolve(fromDir, importPath).replace(/\\/g, '/');
      
      for (const layer of fsdLayers) {
        if (resolvedPath.includes(`/src/${layer}/`)) {
          return layer;
        }
      }
    }

    return null;
  }

  private isDeepImport(importPath: string): boolean {
    // Check if import goes deeper than the public API
    // Pattern: @/layer/slice/segment/... (more than 3 segments after @/)
    const pathParts = importPath.replace('@/', '').split('/');
    
    // If it has more than 2 parts and doesn't end with index, it's likely a deep import
    if (pathParts.length > 2 && !importPath.endsWith('/index')) {
      // Check if it's importing from internal directories like /model/, /ui/, /api/
      const internalDirs = ['model', 'ui', 'api', 'lib', 'config'];
      return pathParts.some(part => internalDirs.includes(part));
    }

    return false;
  }

  private isUpwardDependency(fromLayer: string, toLayer: string): boolean {
    const layerHierarchy = ['shared', 'entities', 'features', 'widgets', 'pages', 'app'];
    const fromIndex = layerHierarchy.indexOf(fromLayer);
    const toIndex = layerHierarchy.indexOf(toLayer);

    return fromIndex !== -1 && toIndex !== -1 && fromIndex < toIndex;
  }

  private convertToAbsolutePath(relativePath: string, fromFile: string): string {
    const fromDir = path.dirname(fromFile);
    const resolvedPath = path.resolve(fromDir, relativePath);
    const relativeToCwd = path.relative(process.cwd(), resolvedPath);
    
    // Convert to @ alias format
    if (relativeToCwd.startsWith('src/')) {
      return '@/' + relativeToCwd.substring(4).replace(/\\/g, '/');
    }

    return relativePath;
  }

  private convertToPublicAPI(importPath: string): string {
    const pathParts = importPath.split('/');
    
    // For FSD layers, public API is typically at layer/slice level
    if (pathParts.length > 3 && pathParts[0] === '@') {
      // @/layer/slice/internal/file -> @/layer/slice
      return pathParts.slice(0, 3).join('/');
    }

    return importPath;
  }

  private groupViolationsByType(violations: ImportViolation[]): Record<string, ImportViolation[]> {
    const grouped: Record<string, ImportViolation[]> = {};

    for (const violation of violations) {
      if (!grouped[violation.type]) {
        grouped[violation.type] = [];
      }
      grouped[violation.type].push(violation);
    }

    return grouped;
  }

  private calculateStatistics(imports: ImportStatement[], violations: ImportViolation[]) {
    const relativeImports = imports.filter(i => i.isRelative).length;
    const aliasImports = imports.filter(i => i.usesAlias).length;
    const externalImports = imports.filter(i => i.importType === 'external').length;
    const fsdLayerImports = imports.filter(i => i.importType === 'fsd-layer').length;

    return {
      totalImports: imports.length,
      relativeImports,
      aliasImports,
      externalImports,
      fsdLayerImports,
      violationCount: violations.length,
      errorCount: violations.filter(v => v.severity === 'error').length,
      warningCount: violations.filter(v => v.severity === 'warning').length,
      complianceRate: imports.length > 0 
        ? ((imports.length - violations.length) / imports.length * 100).toFixed(2) + '%'
        : '100%'
    };
  }
}
