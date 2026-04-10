#!/usr/bin/env tsx
/**
 * FSD Violation Detection Script
 * Detects import-level and structural violations in Feature-Sliced Design architecture
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types and Interfaces
// ============================================================================

enum FSDLayer {
  App = 'app',
  Pages = 'pages',
  Widgets = 'widgets',
  Features = 'features',
  Entities = 'entities',
  Shared = 'shared'
}

const LAYER_HIERARCHY: Record<FSDLayer, number> = {
  [FSDLayer.Shared]: 0,
  [FSDLayer.Entities]: 1,
  [FSDLayer.Features]: 2,
  [FSDLayer.Widgets]: 3,
  [FSDLayer.Pages]: 4,
  [FSDLayer.App]: 5
};

interface ImportViolation {
  file: string;
  line: number;
  importStatement: string;
  violationType: string;
  suggestedFix: string;
}

interface StructuralViolation {
  path: string;
  violationType: string;
  description: string;
  suggestedFix: string;
}

interface ViolationReport {
  importViolations: {
    entitiesToFeatures: ImportViolation[];
    sharedToFeatures: ImportViolation[];
    lowerToPages: ImportViolation[];
    relativeImports: ImportViolation[];
    internalAPIBypass: ImportViolation[];
    entitiesToStores: ImportViolation[];
  };
  structuralViolations: {
    nonFSDDirectories: StructuralViolation[];
    duplicateFeatures: StructuralViolation[];
    incompleteFeatures: StructuralViolation[];
    nonStandardSegments: StructuralViolation[];
    domainSpecificInShared: StructuralViolation[];
    heavyComponentsInPages: StructuralViolation[];
    buildArtifacts: StructuralViolation[];
  };
  summary: {
    totalViolations: number;
    violationsByCategory: Record<string, number>;
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

function getLayerFromPath(filePath: string): FSDLayer | null {
  const normalized = filePath.replace(/\\/g, '/');
  if (normalized.includes('/app/')) return FSDLayer.App;
  if (normalized.includes('/pages/')) return FSDLayer.Pages;
  if (normalized.includes('/widgets/')) return FSDLayer.Widgets;
  if (normalized.includes('/features/')) return FSDLayer.Features;
  if (normalized.includes('/entities/')) return FSDLayer.Entities;
  if (normalized.includes('/shared/')) return FSDLayer.Shared;
  return null;
}

function canImport(fromLayer: FSDLayer, toLayer: FSDLayer): boolean {
  return LAYER_HIERARCHY[fromLayer] >= LAYER_HIERARCHY[toLayer];
}

function resolveImportPath(importPath: string): { layer: FSDLayer | null; isRelative: boolean; isInternal: boolean } {
  const isRelative = importPath.startsWith('../') || importPath.startsWith('./');
  
  // Check for internal API bypass (importing from /ui/, /api/, /model/, /lib/)
  const isInternal = /\/(ui|api|model|lib)\//.test(importPath);
  
  let layer: FSDLayer | null = null;
  if (importPath.startsWith('@/app/')) layer = FSDLayer.App;
  else if (importPath.startsWith('@/pages/')) layer = FSDLayer.Pages;
  else if (importPath.startsWith('@/widgets/')) layer = FSDLayer.Widgets;
  else if (importPath.startsWith('@/features/')) layer = FSDLayer.Features;
  else if (importPath.startsWith('@/entities/')) layer = FSDLayer.Entities;
  else if (importPath.startsWith('@/shared/')) layer = FSDLayer.Shared;
  else if (importPath.startsWith('@/stores')) layer = null; // Special case for stores
  
  return { layer, isRelative, isInternal };
}

function getAllFiles(dir: string, extensions: string[] = ['.ts', '.tsx', '.js', '.jsx']): string[] {
  const files: string[] = [];
  
  function traverse(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules, .git, etc.
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          traverse(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  traverse(dir);
  return files;
}

// ============================================================================
// Import Violation Detection
// ============================================================================

function detectImportViolations(filePath: string): ImportViolation[] {
  const violations: ImportViolation[] = [];
  const sourceCode = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceCode,
    ts.ScriptTarget.Latest,
    true
  );
  
  const fileLayer = getLayerFromPath(filePath);
  if (!fileLayer) return violations;
  
  function visit(node: ts.Node) {
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier;
      if (ts.isStringLiteral(moduleSpecifier)) {
        const importPath = moduleSpecifier.text;
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const importStatement = sourceCode.substring(node.getStart(), node.getEnd());
        
        // Check for relative imports
        if (importPath.startsWith('../')) {
          const depth = (importPath.match(/\.\.\//g) || []).length;
          if (depth >= 2) {
            violations.push({
              file: filePath,
              line: line + 1,
              importStatement,
              violationType: 'relative-import',
              suggestedFix: `Convert to absolute import using @/ alias`
            });
          }
        }
        
        const { layer: importLayer, isInternal } = resolveImportPath(importPath);
        
        // Check for entities→features
        if (fileLayer === FSDLayer.Entities && importLayer === FSDLayer.Features) {
          violations.push({
            file: filePath,
            line: line + 1,
            importStatement,
            violationType: 'entities-to-features',
            suggestedFix: `Extract functionality to entities/shared or use dependency injection`
          });
        }
        
        // Check for shared→features
        if (fileLayer === FSDLayer.Shared && importLayer === FSDLayer.Features) {
          violations.push({
            file: filePath,
            line: line + 1,
            importStatement,
            violationType: 'shared-to-features',
            suggestedFix: `Move types to @/shared/types/ or refactor to accept as parameters`
          });
        }
        
        // Check for lower→pages
        if (importLayer === FSDLayer.Pages && fileLayer !== FSDLayer.App && fileLayer !== FSDLayer.Pages) {
          violations.push({
            file: filePath,
            line: line + 1,
            importStatement,
            violationType: 'lower-to-pages',
            suggestedFix: `Extract component from pages to features/widgets`
          });
        }
        
        // Check for internal API bypass
        if (importLayer === FSDLayer.Features && isInternal) {
          violations.push({
            file: filePath,
            line: line + 1,
            importStatement,
            violationType: 'internal-api-bypass',
            suggestedFix: `Import from feature index: ${importPath.replace(/\/(ui|api|model|lib)\/.*/, '')}`
          });
        }
        
        // Check for entities→stores
        if (fileLayer === FSDLayer.Entities && importPath.startsWith('@/stores')) {
          violations.push({
            file: filePath,
            line: line + 1,
            importStatement,
            violationType: 'entities-to-stores',
            suggestedFix: `Refactor to accept data as parameters instead of accessing stores directly`
          });
        }
      }
    }
    
    ts.forEachChild(node, visit);
  }
  
  visit(sourceFile);
  return violations;
}

// ============================================================================
// Structural Violation Detection
// ============================================================================

function detectStructuralViolations(srcDir: string): {
  nonFSDDirectories: StructuralViolation[];
  duplicateFeatures: StructuralViolation[];
  incompleteFeatures: StructuralViolation[];
  nonStandardSegments: StructuralViolation[];
  domainSpecificInShared: StructuralViolation[];
  heavyComponentsInPages: StructuralViolation[];
  buildArtifacts: StructuralViolation[];
} {
  const violations = {
    nonFSDDirectories: [] as StructuralViolation[],
    duplicateFeatures: [] as StructuralViolation[],
    incompleteFeatures: [] as StructuralViolation[],
    nonStandardSegments: [] as StructuralViolation[],
    domainSpecificInShared: [] as StructuralViolation[],
    heavyComponentsInPages: [] as StructuralViolation[],
    buildArtifacts: [] as StructuralViolation[]
  };
  
  const validLayers = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];
  const standardSegments = ['ui', 'api', 'model', 'lib'];
  
  // Check for non-FSD directories in src/
  const srcEntries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of srcEntries) {
    if (entry.isDirectory() && !validLayers.includes(entry.name)) {
      violations.nonFSDDirectories.push({
        path: path.join(srcDir, entry.name),
        violationType: 'non-fsd-directory',
        description: `Directory '${entry.name}' is not a valid FSD layer`,
        suggestedFix: `Move to appropriate FSD layer or relocate outside src/`
      });
    }
  }
  
  // Check features for structural issues
  const featuresDir = path.join(srcDir, 'features');
  if (fs.existsSync(featuresDir)) {
    const features = fs.readdirSync(featuresDir, { withFileTypes: true })
      .filter(e => e.isDirectory());
    
    const featureNames = new Map<string, string[]>();
    
    for (const feature of features) {
      const featurePath = path.join(featuresDir, feature.name);
      const segments = fs.readdirSync(featurePath, { withFileTypes: true })
        .filter(e => e.isDirectory())
        .map(e => e.name);
      
      // Check for duplicate features
      const normalizedName = feature.name.toLowerCase().replace(/[-_]/g, '');
      if (!featureNames.has(normalizedName)) {
        featureNames.set(normalizedName, []);
      }
      featureNames.get(normalizedName)!.push(feature.name);
      
      // Check for incomplete features
      const hasUI = segments.includes('ui') || segments.includes('components');
      const hasModel = segments.includes('model') || segments.includes('types') || segments.includes('data');
      
      if (segments.length === 1 || (!hasUI && !hasModel)) {
        violations.incompleteFeatures.push({
          path: featurePath,
          violationType: 'incomplete-feature',
          description: `Feature '${feature.name}' has only ${segments.join(', ')} segment(s)`,
          suggestedFix: `Add missing segments or merge with complete implementation`
        });
      }
      
      // Check for non-standard segments
      for (const segment of segments) {
        if (segment === 'components') {
          violations.nonStandardSegments.push({
            path: path.join(featurePath, segment),
            violationType: 'non-standard-segment',
            description: `Feature '${feature.name}' uses 'components/' instead of 'ui/'`,
            suggestedFix: `Rename to 'ui/'`
          });
        } else if (segment === 'services') {
          violations.nonStandardSegments.push({
            path: path.join(featurePath, segment),
            violationType: 'non-standard-segment',
            description: `Feature '${feature.name}' uses 'services/' instead of 'api/'`,
            suggestedFix: `Rename to 'api/'`
          });
        } else if (segment === 'utils') {
          violations.nonStandardSegments.push({
            path: path.join(featurePath, segment),
            violationType: 'non-standard-segment',
            description: `Feature '${feature.name}' uses 'utils/' instead of 'lib/'`,
            suggestedFix: `Rename to 'lib/'`
          });
        } else if (!standardSegments.includes(segment) && !['types', 'data', 'config', 'prompts', 'handlers'].includes(segment)) {
          // Allow some transitional segments but flag them
        }
      }
    }
    
    // Report duplicate features
    for (const [normalizedName, names] of featureNames.entries()) {
      if (names.length > 1) {
        violations.duplicateFeatures.push({
          path: featuresDir,
          violationType: 'duplicate-feature',
          description: `Duplicate feature implementations: ${names.join(', ')}`,
          suggestedFix: `Consolidate into single canonical feature`
        });
      }
    }
  }
  
  // Check for domain-specific code in shared
  const sharedDir = path.join(srcDir, 'shared');
  if (fs.existsSync(sharedDir)) {
    const domainKeywords = ['student', 'teacher', 'recruiter', 'admin', 'college', 'school', 'university', 'educator'];
    
    function checkSharedDirectory(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const lowerName = entry.name.toLowerCase();
        
        if (domainKeywords.some(keyword => lowerName.includes(keyword))) {
          violations.domainSpecificInShared.push({
            path: fullPath,
            violationType: 'domain-specific-in-shared',
            description: `'${entry.name}' appears to be domain-specific`,
            suggestedFix: `Move to appropriate feature or entity`
          });
        }
        
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          checkSharedDirectory(fullPath);
        }
      }
    }
    
    checkSharedDirectory(sharedDir);
  }
  
  // Check for heavy components in pages
  const pagesDir = path.join(srcDir, 'pages');
  if (fs.existsSync(pagesDir)) {
    function checkPagesDirectory(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          if (entry.name === 'components' || entry.name === 'finance') {
            violations.heavyComponentsInPages.push({
              path: fullPath,
              violationType: 'heavy-components-in-pages',
              description: `Pages contain '${entry.name}/' directory with business logic`,
              suggestedFix: `Extract to features or widgets`
            });
          }
          if (!entry.name.startsWith('.')) {
            checkPagesDirectory(fullPath);
          }
        }
      }
    }
    
    checkPagesDirectory(pagesDir);
  }
  
  // Check for build artifacts
  const allFiles = getAllFiles(srcDir, ['.js', '.ts', '.tsx', '.jsx', '.md']);
  for (const file of allFiles) {
    const basename = path.basename(file);
    
    if (basename.includes('.PATCH.')) {
      violations.buildArtifacts.push({
        path: file,
        violationType: 'build-artifact',
        description: `File contains .PATCH. in name`,
        suggestedFix: `Remove or rename to standard extension`
      });
    }
    
    // Check for duplicate .js/.ts pairs
    if (file.endsWith('.js')) {
      const tsVersion = file.replace(/\.js$/, '.ts');
      const tsxVersion = file.replace(/\.js$/, '.tsx');
      if (fs.existsSync(tsVersion) || fs.existsSync(tsxVersion)) {
        violations.buildArtifacts.push({
          path: file,
          violationType: 'build-artifact',
          description: `Duplicate .js file exists alongside TypeScript version`,
          suggestedFix: `Remove .js file, keep TypeScript version`
        });
      }
    }
    
    // Check for markdown files in features
    if (file.endsWith('.md') && file.includes('/features/')) {
      violations.buildArtifacts.push({
        path: file,
        violationType: 'build-artifact',
        description: `Markdown file in feature directory`,
        suggestedFix: `Move to docs/ or delete if obsolete`
      });
    }
  }
  
  return violations;
}

// ============================================================================
// Report Generation
// ============================================================================

function generateReport(report: ViolationReport, format: 'human' | 'json' = 'human'): string {
  if (format === 'json') {
    return JSON.stringify(report, null, 2);
  }
  
  const lines: string[] = [];
  lines.push('='.repeat(80));
  lines.push('FSD VIOLATION DETECTION REPORT');
  lines.push('='.repeat(80));
  lines.push('');
  
  // Summary
  lines.push('SUMMARY');
  lines.push('-'.repeat(80));
  lines.push(`Total Violations: ${report.summary.totalViolations}`);
  lines.push('');
  lines.push('Violations by Category:');
  for (const [category, count] of Object.entries(report.summary.violationsByCategory)) {
    lines.push(`  ${category}: ${count}`);
  }
  lines.push('');
  
  // Import Violations
  lines.push('IMPORT VIOLATIONS');
  lines.push('-'.repeat(80));
  
  const importCategories = [
    { key: 'entitiesToFeatures', label: 'Entities → Features' },
    { key: 'sharedToFeatures', label: 'Shared → Features' },
    { key: 'lowerToPages', label: 'Lower Layers → Pages' },
    { key: 'relativeImports', label: 'Relative Imports' },
    { key: 'internalAPIBypass', label: 'Internal API Bypass' },
    { key: 'entitiesToStores', label: 'Entities → Stores' }
  ];
  
  for (const { key, label } of importCategories) {
    const violations = report.importViolations[key as keyof typeof report.importViolations];
    lines.push('');
    lines.push(`${label} (${violations.length} violations)`);
    if (violations.length > 0) {
      for (const v of violations.slice(0, 10)) {
        lines.push(`  ${v.file}:${v.line}`);
        lines.push(`    ${v.importStatement.trim()}`);
        lines.push(`    Fix: ${v.suggestedFix}`);
      }
      if (violations.length > 10) {
        lines.push(`  ... and ${violations.length - 10} more`);
      }
    }
  }
  
  // Structural Violations
  lines.push('');
  lines.push('');
  lines.push('STRUCTURAL VIOLATIONS');
  lines.push('-'.repeat(80));
  
  const structuralCategories = [
    { key: 'nonFSDDirectories', label: 'Non-FSD Directories' },
    { key: 'duplicateFeatures', label: 'Duplicate Features' },
    { key: 'incompleteFeatures', label: 'Incomplete Features' },
    { key: 'nonStandardSegments', label: 'Non-Standard Segments' },
    { key: 'domainSpecificInShared', label: 'Domain-Specific in Shared' },
    { key: 'heavyComponentsInPages', label: 'Heavy Components in Pages' },
    { key: 'buildArtifacts', label: 'Build Artifacts' }
  ];
  
  for (const { key, label } of structuralCategories) {
    const violations = report.structuralViolations[key as keyof typeof report.structuralViolations];
    lines.push('');
    lines.push(`${label} (${violations.length} violations)`);
    if (violations.length > 0) {
      for (const v of violations.slice(0, 10)) {
        lines.push(`  ${v.path}`);
        lines.push(`    ${v.description}`);
        lines.push(`    Fix: ${v.suggestedFix}`);
      }
      if (violations.length > 10) {
        lines.push(`  ... and ${violations.length - 10} more`);
      }
    }
  }
  
  lines.push('');
  lines.push('='.repeat(80));
  
  return lines.join('\n');
}

// ============================================================================
// Main Execution
// ============================================================================

function main() {
  const srcDir = path.join(process.cwd(), 'src');
  
  console.log('Scanning codebase for FSD violations...');
  console.log(`Source directory: ${srcDir}`);
  console.log('');
  
  // Detect import violations
  const files = getAllFiles(srcDir);
  console.log(`Analyzing ${files.length} files...`);
  
  const importViolations = {
    entitiesToFeatures: [] as ImportViolation[],
    sharedToFeatures: [] as ImportViolation[],
    lowerToPages: [] as ImportViolation[],
    relativeImports: [] as ImportViolation[],
    internalAPIBypass: [] as ImportViolation[],
    entitiesToStores: [] as ImportViolation[]
  };
  
  for (const file of files) {
    const violations = detectImportViolations(file);
    for (const v of violations) {
      switch (v.violationType) {
        case 'entities-to-features':
          importViolations.entitiesToFeatures.push(v);
          break;
        case 'shared-to-features':
          importViolations.sharedToFeatures.push(v);
          break;
        case 'lower-to-pages':
          importViolations.lowerToPages.push(v);
          break;
        case 'relative-import':
          importViolations.relativeImports.push(v);
          break;
        case 'internal-api-bypass':
          importViolations.internalAPIBypass.push(v);
          break;
        case 'entities-to-stores':
          importViolations.entitiesToStores.push(v);
          break;
      }
    }
  }
  
  // Detect structural violations
  console.log('Analyzing structural violations...');
  const structuralViolations = detectStructuralViolations(srcDir);
  
  // Build report
  const report: ViolationReport = {
    importViolations,
    structuralViolations,
    summary: {
      totalViolations: 0,
      violationsByCategory: {}
    }
  };
  
  // Calculate summary
  let total = 0;
  for (const [key, violations] of Object.entries(importViolations)) {
    report.summary.violationsByCategory[key] = violations.length;
    total += violations.length;
  }
  for (const [key, violations] of Object.entries(structuralViolations)) {
    report.summary.violationsByCategory[key] = violations.length;
    total += violations.length;
  }
  report.summary.totalViolations = total;
  
  // Output report
  const format = process.argv.includes('--json') ? 'json' : 'human';
  const output = generateReport(report, format);
  console.log(output);
  
  // Save to file
  const outputDir = path.join(process.cwd(), '.kiro', 'specs', 'fsd-violations-cleanup');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(outputDir, `violation-report-${timestamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log('');
  console.log(`Report saved to: ${reportPath}`);
  
  // Exit with non-zero code if violations found (for CI/CD)
  if (total > 0 && process.argv.includes('--ci')) {
    process.exit(1);
  }
}

// Run main if this is the entry point
main();
