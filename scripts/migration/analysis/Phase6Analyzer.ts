/**
 * Phase 6 Codebase Analyzer
 * 
 * Comprehensive analysis tool for FSD Phase 6 Final Cleanup.
 * Scans all source files and classifies them for migration to proper FSD layers.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

// ============================================================================
// Types and Interfaces
// ============================================================================

export type FileType = 
  | 'component' 
  | 'service' 
  | 'hook' 
  | 'util' 
  | 'type' 
  | 'config'
  | 'layout'
  | 'route'
  | 'provider'
  | 'page'
  | 'widget'
  | 'unknown';

export type FSDLayer = 
  | 'app' 
  | 'pages' 
  | 'widgets' 
  | 'features' 
  | 'entities' 
  | 'shared';

export interface FileClassification {
  sourceFile: string;
  fileType: FileType;
  domain: string;
  layer: FSDLayer;
  targetPath: string;
  confidence: number;
  reasons: string[];
  imports: string[];
  exports: string[];
  usageCount: number;
  hasBusinessLogic: boolean;
  composesMultipleFeatures: boolean;
}

export interface DependencyNode {
  id: string;
  filePath: string;
  layer: FSDLayer;
  domain: string;
  imports: string[];
  exports: string[];
}

export interface DependencyEdge {
  from: string;
  to: string;
  importType: 'default' | 'named' | 'namespace';
}

export interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  edges: DependencyEdge[];
}

export interface CircularDependency {
  cycle: string[];
  severity: 'low' | 'medium' | 'high';
}

export interface AnalysisReport {
  totalFiles: number;
  classifications: FileClassification[];
  dependencyGraph: DependencyGraph;
  circularDependencies: CircularDependency[];
  legacyDirectories: {
    components: number;
    services: number;
    hooks: number;
    utils: number;
    types: number;
    config: number;
    lib: number;
    layouts: number;
    routes: number;
    providers: number;
  };
  fsdCompliance: number;
  timestamp: Date;
}

// ============================================================================
// Phase 6 Analyzer
// ============================================================================

export class Phase6Analyzer {
  private srcDir: string;
  private classifications: Map<string, FileClassification> = new Map();
  private dependencyGraph: DependencyGraph = {
    nodes: new Map(),
    edges: []
  };

  constructor(srcDir: string = 'src') {
    this.srcDir = srcDir;
  }

  /**
   * Run complete analysis of the codebase
   */
  async analyze(): Promise<AnalysisReport> {
    console.log('🔍 Starting Phase 6 codebase analysis...');

    // Step 1: Scan all source files
    const files = await this.scanSourceFiles();
    console.log(`📁 Found ${files.length} source files`);

    // Step 2: Classify each file
    for (const file of files) {
      const classification = await this.classifyFile(file);
      this.classifications.set(file, classification);
    }
    console.log(`✅ Classified ${this.classifications.size} files`);

    // Step 3: Build dependency graph
    await this.buildDependencyGraph();
    console.log(`🔗 Built dependency graph with ${this.dependencyGraph.nodes.size} nodes`);

    // Step 4: Detect circular dependencies
    const circularDeps = this.detectCircularDependencies();
    console.log(`🔄 Found ${circularDeps.length} circular dependencies`);

    // Step 5: Calculate metrics
    const legacyDirs = this.countLegacyFiles();
    const fsdCompliance = this.calculateFSDCompliance();

    return {
      totalFiles: files.length,
      classifications: Array.from(this.classifications.values()),
      dependencyGraph: this.dependencyGraph,
      circularDependencies: circularDeps,
      legacyDirectories: legacyDirs,
      fsdCompliance,
      timestamp: new Date()
    };
  }

  /**
   * Scan all source files in the src directory
   */
  private async scanSourceFiles(): Promise<string[]> {
    const files: string[] = [];
    await this.scanDirectory(this.srcDir, files);
    return files.filter(f => 
      f.endsWith('.ts') || 
      f.endsWith('.tsx') || 
      f.endsWith('.js') || 
      f.endsWith('.jsx')
    );
  }

  /**
   * Recursively scan directory for source files
   */
  private async scanDirectory(dir: string, files: string[]): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Skip node_modules, .git, dist, build, etc.
        if (entry.name === 'node_modules' || 
            entry.name === '.git' || 
            entry.name === 'dist' ||
            entry.name === 'build' ||
            entry.name === '__tests__' ||
            entry.name.startsWith('.')) {
          continue;
        }

        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath, files);
        } else {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not scan directory ${dir}:`, error);
    }
  }

  /**
   * Classify a single file
   */
  async classifyFile(filePath: string): Promise<FileClassification> {
    const content = await fs.readFile(filePath, 'utf-8');
    const relativePath = path.relative(this.srcDir, filePath);

    // Determine file type
    const fileType = this.determineFileType(filePath, content);
    
    // Determine domain
    const domain = this.determineDomain(filePath, content);
    
    // Determine target layer
    const layer = this.determineLayer(fileType, domain, filePath, content);
    
    // Calculate target path
    const targetPath = this.calculateTargetPath(fileType, domain, layer, filePath);
    
    // Extract imports and exports
    const { imports, exports } = this.extractImportsExports(content, filePath);
    
    // Analyze content
    const hasBusinessLogic = this.hasBusinessLogic(content);
    const composesMultipleFeatures = this.composesMultipleFeatures(imports);
    
    // Calculate confidence and reasons
    const { confidence, reasons } = this.calculateConfidence(
      fileType, domain, layer, filePath, content
    );

    return {
      sourceFile: relativePath,
      fileType,
      domain,
      layer,
      targetPath,
      confidence,
      reasons,
      imports,
      exports,
      usageCount: 0, // Will be calculated later
      hasBusinessLogic,
      composesMultipleFeatures
    };
  }

  /**
   * Determine file type based on path and content
   */
  private determineFileType(filePath: string, content: string): FileType {
    const fileName = path.basename(filePath);
    const dirName = path.dirname(filePath);

    // Check by directory
    if (dirName.includes('/hooks/')) return 'hook';
    if (dirName.includes('/services/')) return 'service';
    if (dirName.includes('/utils/')) return 'util';
    if (dirName.includes('/types/')) return 'type';
    if (dirName.includes('/config/')) return 'config';
    if (dirName.includes('/layouts/')) return 'layout';
    if (dirName.includes('/routes/')) return 'route';
    if (dirName.includes('/providers/')) return 'provider';
    if (dirName.includes('/pages/')) return 'page';
    if (dirName.includes('/widgets/')) return 'widget';

    // Check by filename pattern
    if (fileName.startsWith('use') && fileName.match(/^use[A-Z]/)) return 'hook';
    if (fileName.includes('Service')) return 'service';
    if (fileName.includes('Layout')) return 'layout';
    if (fileName.includes('Route')) return 'route';
    if (fileName.includes('Provider')) return 'provider';
    if (fileName.includes('Page')) return 'page';
    if (fileName.includes('Widget')) return 'widget';

    // Check by content
    if (content.includes('export type') || content.includes('export interface')) {
      return 'type';
    }
    if (content.includes('supabase.from') || content.includes('supabase.rpc')) {
      return 'service';
    }
    if (content.includes('useState') || content.includes('useEffect')) {
      return 'hook';
    }

    // Default to component if it's a React file
    if (fileName.endsWith('.tsx') || fileName.endsWith('.jsx')) {
      return 'component';
    }

    return 'unknown';
  }

  /**
   * Determine domain/feature ownership
   */
  private determineDomain(filePath: string, content: string): string {
    const pathLower = filePath.toLowerCase();

    // Check path segments for domain hints
    const domains = [
      'auth', 'authentication',
      'courses', 'course',
      'messaging', 'message',
      'student-profile', 'profile', 'portfolio',
      'subscription', 'payment',
      'opportunities', 'job',
      'college-admin', 'college',
      'school-admin', 'school',
      'digital-portfolio', 'digital-pp',
      'ai-tutor', 'tutor',
      'counselling', 'counseling',
      'placement',
      'assessment', 'exam',
      'educator',
      'recruiter',
      'admin',
      'organization'
    ];

    for (const domain of domains) {
      if (pathLower.includes(domain)) {
        // Normalize domain name
        if (domain === 'authentication') return 'auth';
        if (domain === 'course') return 'courses';
        if (domain === 'message') return 'messaging';
        if (domain === 'profile' || domain === 'portfolio') return 'student-profile';
        if (domain === 'payment') return 'subscription';
        if (domain === 'job') return 'opportunities';
        if (domain === 'college') return 'college-admin';
        if (domain === 'school') return 'school-admin';
        if (domain === 'digital-pp') return 'digital-portfolio';
        if (domain === 'tutor') return 'ai-tutor';
        if (domain === 'counseling') return 'counselling';
        if (domain === 'exam') return 'assessment';
        return domain;
      }
    }

    // Check content for domain hints
    if (content.includes('supabase.auth')) return 'auth';
    if (content.includes('subscription') || content.includes('payment')) return 'subscription';
    if (content.includes('course')) return 'courses';
    if (content.includes('message') || content.includes('notification')) return 'messaging';

    return 'shared';
  }

  /**
   * Determine target FSD layer
   */
  private determineLayer(
    fileType: FileType,
    domain: string,
    filePath: string,
    content: string
  ): FSDLayer {
    // App layer
    if (fileType === 'route' || fileType === 'layout' || fileType === 'provider') {
      return 'app';
    }

    // Pages layer
    if (fileType === 'page' || filePath.includes('/pages/')) {
      return 'pages';
    }

    // Widgets layer (composite UI)
    if (fileType === 'widget' || this.composesMultipleFeatures([])) {
      return 'widgets';
    }

    // Shared layer (generic utilities, config, types)
    if (domain === 'shared' || fileType === 'config') {
      return 'shared';
    }

    // Entity layer (domain objects)
    const entityDomains = ['user', 'student', 'course', 'organization', 'opportunity'];
    if (entityDomains.includes(domain)) {
      return 'entities';
    }

    // Features layer (business capabilities)
    return 'features';
  }

  /**
   * Calculate target path in FSD structure
   */
  private calculateTargetPath(
    fileType: FileType,
    domain: string,
    layer: FSDLayer,
    sourcePath: string
  ): string {
    const fileName = path.basename(sourcePath);
    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);

    switch (layer) {
      case 'app':
        if (fileType === 'route') return `src/app/routes/${fileName}`;
        if (fileType === 'layout') return `src/app/layouts/${fileName}`;
        if (fileType === 'provider') return `src/app/providers/${fileName}`;
        if (fileType === 'config') return `src/app/config/${fileName}`;
        return `src/app/${fileName}`;

      case 'pages':
        return sourcePath.replace('/components/', '/pages/');

      case 'widgets':
        return `src/widgets/${domain}/ui/${fileName}`;

      case 'features':
        if (fileType === 'component') return `src/features/${domain}/ui/${fileName}`;
        if (fileType === 'service') return `src/features/${domain}/api/${fileName}`;
        if (fileType === 'hook') return `src/features/${domain}/model/${fileName}`;
        if (fileType === 'util') return `src/features/${domain}/lib/${fileName}`;
        if (fileType === 'type') return `src/features/${domain}/model/types.ts`;
        return `src/features/${domain}/${fileName}`;

      case 'entities':
        if (fileType === 'component') return `src/entities/${domain}/ui/${fileName}`;
        if (fileType === 'service') return `src/entities/${domain}/api/${fileName}`;
        if (fileType === 'hook') return `src/entities/${domain}/model/${fileName}`;
        if (fileType === 'type') return `src/entities/${domain}/model/types.ts`;
        return `src/entities/${domain}/${fileName}`;

      case 'shared':
        if (fileType === 'component') return `src/shared/ui/${fileName}`;
        if (fileType === 'service') return `src/shared/api/${fileName}`;
        if (fileType === 'hook') return `src/shared/lib/hooks/${fileName}`;
        if (fileType === 'util') return `src/shared/lib/${fileName}`;
        if (fileType === 'type') return `src/shared/types/${fileName}`;
        if (fileType === 'config') return `src/shared/config/${fileName}`;
        return `src/shared/lib/${fileName}`;

      default:
        return sourcePath;
    }
  }

  /**
   * Extract imports and exports from file
   */
  private extractImportsExports(content: string, filePath: string): {
    imports: string[];
    exports: string[];
  } {
    const imports: string[] = [];
    const exports: string[] = [];

    try {
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx']
      });

      traverse(ast, {
        ImportDeclaration(path) {
          if (path.node.source.value) {
            imports.push(path.node.source.value);
          }
        },
        ExportNamedDeclaration(path) {
          if (path.node.declaration) {
            if (t.isFunctionDeclaration(path.node.declaration)) {
              exports.push(path.node.declaration.id?.name || 'anonymous');
            } else if (t.isVariableDeclaration(path.node.declaration)) {
              path.node.declaration.declarations.forEach(decl => {
                if (t.isIdentifier(decl.id)) {
                  exports.push(decl.id.name);
                }
              });
            }
          }
        },
        ExportDefaultDeclaration(path) {
          exports.push('default');
        }
      });
    } catch (error) {
      console.warn(`Warning: Could not parse ${filePath}:`, error);
    }

    return { imports, exports };
  }

  /**
   * Check if file contains business logic
   */
  private hasBusinessLogic(content: string): boolean {
    return (
      content.includes('supabase.from') ||
      content.includes('supabase.rpc') ||
      content.includes('supabase.auth') ||
      content.includes('useState') ||
      content.includes('useEffect')
    );
  }

  /**
   * Check if component composes multiple features
   */
  private composesMultipleFeatures(imports: string[]): boolean {
    const featureImports = imports.filter(imp => 
      imp.includes('/features/') || imp.includes('@/features/')
    );
    const uniqueFeatures = new Set(
      featureImports.map(imp => imp.split('/features/')[1]?.split('/')[0])
    );
    return uniqueFeatures.size >= 2;
  }

  /**
   * Calculate confidence score and reasons
   */
  private calculateConfidence(
    fileType: FileType,
    domain: string,
    layer: FSDLayer,
    filePath: string,
    content: string
  ): { confidence: number; reasons: string[] } {
    const reasons: string[] = [];
    let confidence = 0.5;

    // File type confidence
    if (fileType !== 'unknown') {
      confidence += 0.2;
      reasons.push(`File type identified as ${fileType}`);
    }

    // Domain confidence
    if (domain !== 'shared') {
      confidence += 0.15;
      reasons.push(`Domain identified as ${domain}`);
    }

    // Path-based confidence
    if (filePath.includes(`/${domain}/`)) {
      confidence += 0.15;
      reasons.push(`Path contains domain ${domain}`);
    }

    return { confidence: Math.min(confidence, 1.0), reasons };
  }

  /**
   * Build dependency graph
   */
  private async buildDependencyGraph(): Promise<void> {
    for (const [filePath, classification] of this.classifications) {
      const node: DependencyNode = {
        id: filePath,
        filePath,
        layer: classification.layer,
        domain: classification.domain,
        imports: classification.imports,
        exports: classification.exports
      };

      this.dependencyGraph.nodes.set(filePath, node);

      // Create edges for imports
      for (const importPath of classification.imports) {
        this.dependencyGraph.edges.push({
          from: filePath,
          to: importPath,
          importType: 'named' // Simplified for now
        });
      }
    }
  }

  /**
   * Detect circular dependencies using DFS
   */
  private detectCircularDependencies(): CircularDependency[] {
    const cycles: CircularDependency[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string, path: string[]): void => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const edges = this.dependencyGraph.edges.filter(e => e.from === nodeId);
      for (const edge of edges) {
        if (!visited.has(edge.to)) {
          dfs(edge.to, [...path]);
        } else if (recursionStack.has(edge.to)) {
          // Found a cycle
          const cycleStart = path.indexOf(edge.to);
          const cycle = path.slice(cycleStart);
          cycles.push({
            cycle,
            severity: cycle.length <= 3 ? 'high' : cycle.length <= 5 ? 'medium' : 'low'
          });
        }
      }

      recursionStack.delete(nodeId);
    };

    for (const nodeId of this.dependencyGraph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId, []);
      }
    }

    return cycles;
  }

  /**
   * Count files in legacy directories
   */
  private countLegacyFiles() {
    const counts = {
      components: 0,
      services: 0,
      hooks: 0,
      utils: 0,
      types: 0,
      config: 0,
      lib: 0,
      layouts: 0,
      routes: 0,
      providers: 0
    };

    for (const [filePath] of this.classifications) {
      if (filePath.includes('/components/')) counts.components++;
      if (filePath.includes('/services/')) counts.services++;
      if (filePath.includes('/hooks/')) counts.hooks++;
      if (filePath.includes('/utils/')) counts.utils++;
      if (filePath.includes('/types/')) counts.types++;
      if (filePath.includes('/config/')) counts.config++;
      if (filePath.includes('/lib/')) counts.lib++;
      if (filePath.includes('/layouts/')) counts.layouts++;
      if (filePath.includes('/routes/')) counts.routes++;
      if (filePath.includes('/providers/')) counts.providers++;
    }

    return counts;
  }

  /**
   * Calculate FSD compliance percentage
   */
  private calculateFSDCompliance(): number {
    let fsdFiles = 0;
    let totalFiles = 0;

    for (const [filePath] of this.classifications) {
      totalFiles++;
      if (
        filePath.includes('/app/') ||
        filePath.includes('/pages/') ||
        filePath.includes('/widgets/') ||
        filePath.includes('/features/') ||
        filePath.includes('/entities/') ||
        filePath.includes('/shared/')
      ) {
        fsdFiles++;
      }
    }

    return totalFiles > 0 ? (fsdFiles / totalFiles) * 100 : 0;
  }

  /**
   * Generate analysis report as JSON
   */
  async generateReport(outputPath: string): Promise<void> {
    const report = await this.analyze();
    await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
    console.log(`📄 Report generated: ${outputPath}`);
  }
}
