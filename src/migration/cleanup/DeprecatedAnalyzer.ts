import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);

export interface DeprecatedFile {
  path: string;
  size: number;
  lastModified: Date;
  activeImports: string[];
  isOrphaned: boolean;
}

export interface DeprecatedDirectory {
  path: string;
  files: DeprecatedFile[];
  totalSize: number;
  orphanedCount: number;
  activeCount: number;
}

export interface CleanupAnalysis {
  deprecatedDirectories: DeprecatedDirectory[];
  orphanedFiles: string[];
  activeReferences: Map<string, string[]>;
  safeToDelete: string[];
  requiresManualReview: string[];
  totalFilesAnalyzed: number;
  totalSizeBytes: number;
}

export class DeprecatedAnalyzer {
  private readonly deprecatedPaths = [
    'src/components',
    'src/services',
    'src/hooks',
    'src/utils',
    'src/context'
  ];

  private readonly srcRoot: string;
  private importCache: Map<string, string[]> = new Map();

  constructor(srcRoot: string = 'src') {
    this.srcRoot = srcRoot;
  }

  async analyzeDeprecatedStructure(): Promise<CleanupAnalysis> {
    const analysis: CleanupAnalysis = {
      deprecatedDirectories: [],
      orphanedFiles: [],
      activeReferences: new Map(),
      safeToDelete: [],
      requiresManualReview: [],
      totalFilesAnalyzed: 0,
      totalSizeBytes: 0
    };

    // Build import cache for the entire codebase
    await this.buildImportCache();

    // Analyze each deprecated directory
    for (const deprecatedPath of this.deprecatedPaths) {
      const fullPath = path.join(process.cwd(), deprecatedPath);
      
      if (!fs.existsSync(fullPath)) {
        continue;
      }

      const dirAnalysis = await this.analyzeDirectory(deprecatedPath);
      analysis.deprecatedDirectories.push(dirAnalysis);
      analysis.totalFilesAnalyzed += dirAnalysis.files.length;
      analysis.totalSizeBytes += dirAnalysis.totalSize;

      // Categorize files
      for (const file of dirAnalysis.files) {
        if (file.isOrphaned) {
          analysis.orphanedFiles.push(file.path);
          analysis.safeToDelete.push(file.path);
        } else {
          analysis.activeReferences.set(file.path, file.activeImports);
          analysis.requiresManualReview.push(file.path);
        }
      }
    }

    return analysis;
  }

  private async analyzeDirectory(dirPath: string): Promise<DeprecatedDirectory> {
    const files = await this.scanDirectoryRecursive(dirPath);
    const analyzedFiles: DeprecatedFile[] = [];
    let totalSize = 0;
    let orphanedCount = 0;
    let activeCount = 0;

    for (const filePath of files) {
      const fileAnalysis = await this.analyzeFile(filePath);
      analyzedFiles.push(fileAnalysis);
      totalSize += fileAnalysis.size;

      if (fileAnalysis.isOrphaned) {
        orphanedCount++;
      } else {
        activeCount++;
      }
    }

    return {
      path: dirPath,
      files: analyzedFiles,
      totalSize,
      orphanedCount,
      activeCount
    };
  }

  private async analyzeFile(filePath: string): Promise<DeprecatedFile> {
    const fullPath = path.join(process.cwd(), filePath);
    const stats = await stat(fullPath);
    const activeImports = this.findActiveImports(filePath);

    return {
      path: filePath,
      size: stats.size,
      lastModified: stats.mtime,
      activeImports,
      isOrphaned: activeImports.length === 0
    };
  }

  private async scanDirectoryRecursive(dirPath: string): Promise<string[]> {
    const fullPath = path.join(process.cwd(), dirPath);
    const files: string[] = [];

    try {
      const entries = await readdir(fullPath, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          const subFiles = await this.scanDirectoryRecursive(entryPath);
          files.push(...subFiles);
        } else if (this.isSourceFile(entry.name)) {
          files.push(entryPath);
        }
      }
    } catch (error) {
      console.warn(`Failed to scan directory ${dirPath}:`, error);
    }

    return files;
  }

  private isSourceFile(filename: string): boolean {
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    return extensions.some(ext => filename.endsWith(ext));
  }

  private async buildImportCache(): Promise<void> {
    const allFiles = await this.getAllSourceFiles();

    for (const filePath of allFiles) {
      try {
        const fullPath = path.join(process.cwd(), filePath);
        const content = await readFile(fullPath, 'utf-8');
        const imports = this.extractImports(content, filePath);
        this.importCache.set(filePath, imports);
      } catch (error) {
        console.warn(`Failed to read file ${filePath}:`, error);
      }
    }
  }

  private async getAllSourceFiles(): Promise<string[]> {
    return this.scanDirectoryRecursive(this.srcRoot);
  }

  private extractImports(content: string, currentFile: string): string[] {
    const imports: string[] = [];
    
    // Match ES6 imports
    const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      const resolvedPath = this.resolveImportPath(importPath, currentFile);
      if (resolvedPath) {
        imports.push(resolvedPath);
      }
    }

    // Match require statements
    const requireRegex = /require\s*\(['"]([^'"]+)['"]\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      const importPath = match[1];
      const resolvedPath = this.resolveImportPath(importPath, currentFile);
      if (resolvedPath) {
        imports.push(resolvedPath);
      }
    }

    return imports;
  }

  private resolveImportPath(importPath: string, currentFile: string): string | null {
    // Skip external packages
    if (!importPath.startsWith('.') && !importPath.startsWith('@/')) {
      return null;
    }

    // Handle @ alias
    if (importPath.startsWith('@/')) {
      return importPath.replace('@/', 'src/');
    }

    // Handle relative imports
    const currentDir = path.dirname(currentFile);
    let resolved = path.normalize(path.join(currentDir, importPath));

    // Add extension if missing
    if (!path.extname(resolved)) {
      const extensions = ['.ts', '.tsx', '.js', '.jsx'];
      for (const ext of extensions) {
        const withExt = resolved + ext;
        if (fs.existsSync(path.join(process.cwd(), withExt))) {
          resolved = withExt;
          break;
        }
      }
      
      // Check for index file
      const indexPath = path.join(resolved, 'index');
      for (const ext of extensions) {
        const withExt = indexPath + ext;
        if (fs.existsSync(path.join(process.cwd(), withExt))) {
          resolved = withExt;
          break;
        }
      }
    }

    return resolved;
  }

  private findActiveImports(targetFile: string): string[] {
    const activeImports: string[] = [];

    for (const [sourceFile, imports] of this.importCache.entries()) {
      // Don't count imports from deprecated directories
      if (this.isDeprecatedPath(sourceFile)) {
        continue;
      }

      // Check if this file imports the target
      for (const importPath of imports) {
        if (this.pathsMatch(importPath, targetFile)) {
          activeImports.push(sourceFile);
          break;
        }
      }
    }

    return activeImports;
  }

  private isDeprecatedPath(filePath: string): boolean {
    return this.deprecatedPaths.some(deprecated => 
      filePath.startsWith(deprecated)
    );
  }

  private pathsMatch(path1: string, path2: string): boolean {
    const normalized1 = path.normalize(path1).replace(/\\/g, '/');
    const normalized2 = path.normalize(path2).replace(/\\/g, '/');
    
    // Remove extensions for comparison
    const withoutExt1 = normalized1.replace(/\.(ts|tsx|js|jsx)$/, '');
    const withoutExt2 = normalized2.replace(/\.(ts|tsx|js|jsx)$/, '');
    
    return withoutExt1 === withoutExt2;
  }

  async validateSafeToDelete(filePath: string): Promise<boolean> {
    const activeImports = this.findActiveImports(filePath);
    return activeImports.length === 0;
  }

  generateAnalysisReport(analysis: CleanupAnalysis): string {
    const lines: string[] = [];
    
    lines.push('=== Deprecated Structure Analysis Report ===\n');
    lines.push(`Total Files Analyzed: ${analysis.totalFilesAnalyzed}`);
    lines.push(`Total Size: ${(analysis.totalSizeBytes / 1024 / 1024).toFixed(2)} MB`);
    lines.push(`Orphaned Files: ${analysis.orphanedFiles.length}`);
    lines.push(`Files with Active References: ${analysis.requiresManualReview.length}\n`);

    for (const dir of analysis.deprecatedDirectories) {
      lines.push(`\n--- ${dir.path} ---`);
      lines.push(`  Total Files: ${dir.files.length}`);
      lines.push(`  Orphaned: ${dir.orphanedCount}`);
      lines.push(`  Active: ${dir.activeCount}`);
      lines.push(`  Size: ${(dir.totalSize / 1024).toFixed(2)} KB`);
    }

    if (analysis.requiresManualReview.length > 0) {
      lines.push('\n\n=== Files Requiring Manual Review ===');
      for (const filePath of analysis.requiresManualReview) {
        const refs = analysis.activeReferences.get(filePath) || [];
        lines.push(`\n${filePath}`);
        lines.push(`  Referenced by ${refs.length} file(s):`);
        refs.slice(0, 5).forEach(ref => lines.push(`    - ${ref}`));
        if (refs.length > 5) {
          lines.push(`    ... and ${refs.length - 5} more`);
        }
      }
    }

    if (analysis.safeToDelete.length > 0) {
      lines.push('\n\n=== Files Safe to Delete ===');
      analysis.safeToDelete.forEach(file => lines.push(`  - ${file}`));
    }

    return lines.join('\n');
  }
}
