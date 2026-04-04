import * as fs from 'fs';
import * as path from 'path';

export interface BundleAnalysis {
  totalSize: number;
  chunkSizes: Record<string, number>;
  largeDependencies: Dependency[];
  unusedExports: string[];
  duplicatedModules: string[];
  baseline: BundleMetrics;
}

export interface Dependency {
  name: string;
  size: number;
  path: string;
  importedBy: string[];
}

export interface BundleMetrics {
  timestamp: Date;
  totalSize: number;
  chunkCount: number;
  largestChunk: { name: string; size: number };
}

export class BundleAnalyzer {
  private distPath: string;
  private nodeModulesPath: string;

  constructor(projectRoot: string = process.cwd()) {
    this.distPath = path.join(projectRoot, 'dist');
    this.nodeModulesPath = path.join(projectRoot, 'node_modules');
  }

  /**
   * Analyzes current bundle sizes and generates baseline report
   * Requirement 5.1: Bundle_Optimizer SHALL analyze current bundle sizes and generate baseline report
   */
  async analyzeCurrentBundles(): Promise<BundleAnalysis> {
    const chunkSizes = await this.getChunkSizes();
    const totalSize = Object.values(chunkSizes).reduce((sum, size) => sum + size, 0);
    const largeDependencies = await this.identifyLargeDependencies();
    const unusedExports = await this.detectUnusedExports();
    const duplicatedModules = await this.findDuplicatedModules();

    const baseline: BundleMetrics = {
      timestamp: new Date(),
      totalSize,
      chunkCount: Object.keys(chunkSizes).length,
      largestChunk: this.getLargestChunk(chunkSizes),
    };

    return {
      totalSize,
      chunkSizes,
      largeDependencies,
      unusedExports,
      duplicatedModules,
      baseline,
    };
  }

  /**
   * Gets sizes of all chunks in the dist directory
   */
  private async getChunkSizes(): Promise<Record<string, number>> {
    const chunkSizes: Record<string, number> = {};

    if (!fs.existsSync(this.distPath)) {
      return chunkSizes;
    }

    const assetsPath = path.join(this.distPath, 'assets');
    if (!fs.existsSync(assetsPath)) {
      return chunkSizes;
    }

    const files = fs.readdirSync(assetsPath);
    
    for (const file of files) {
      if (file.endsWith('.js')) {
        const filePath = path.join(assetsPath, file);
        const stats = fs.statSync(filePath);
        chunkSizes[file] = stats.size;
      }
    }

    return chunkSizes;
  }

  /**
   * Identifies large dependencies from package.json
   * Requirement 5.2: Bundle_Optimizer SHALL identify large dependencies and suggest alternatives
   */
  async identifyLargeDependencies(): Promise<Dependency[]> {
    const largeDependencies: Dependency[] = [];
    const threshold = 100 * 1024; // 100KB

    if (!fs.existsSync(this.nodeModulesPath)) {
      return largeDependencies;
    }

    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return largeDependencies;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    for (const [name, version] of Object.entries(dependencies)) {
      const depPath = path.join(this.nodeModulesPath, name);
      if (fs.existsSync(depPath)) {
        const size = await this.getDirectorySize(depPath);
        if (size > threshold) {
          largeDependencies.push({
            name,
            size,
            path: depPath,
            importedBy: [], // Would need AST analysis to populate
          });
        }
      }
    }

    return largeDependencies.sort((a, b) => b.size - a.size);
  }

  /**
   * Calculates total size of a directory recursively
   */
  private async getDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;

    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        totalSize += await this.getDirectorySize(itemPath);
      } else {
        totalSize += stats.size;
      }
    }

    return totalSize;
  }

  /**
   * Detects unused exports that could be tree-shaken
   * Requirement 5.3: Bundle_Optimizer SHALL detect opportunities for tree shaking
   */
  private async detectUnusedExports(): Promise<string[]> {
    // This would require AST analysis of the codebase
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Finds duplicated modules across chunks
   */
  private async findDuplicatedModules(): Promise<string[]> {
    // This would require analyzing the bundle output
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Gets the largest chunk from the chunk sizes map
   */
  private getLargestChunk(chunkSizes: Record<string, number>): { name: string; size: number } {
    let largestChunk = { name: '', size: 0 };

    for (const [name, size] of Object.entries(chunkSizes)) {
      if (size > largestChunk.size) {
        largestChunk = { name, size };
      }
    }

    return largestChunk;
  }

  /**
   * Formats bytes to human-readable format
   */
  formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Generates a baseline report
   */
  generateBaselineReport(analysis: BundleAnalysis): string {
    const lines: string[] = [
      '# Bundle Analysis Baseline Report',
      '',
      `Generated: ${analysis.baseline.timestamp.toISOString()}`,
      '',
      '## Summary',
      `- Total Bundle Size: ${this.formatSize(analysis.totalSize)}`,
      `- Number of Chunks: ${analysis.baseline.chunkCount}`,
      `- Largest Chunk: ${analysis.baseline.largestChunk.name} (${this.formatSize(analysis.baseline.largestChunk.size)})`,
      '',
      '## Chunk Sizes',
    ];

    for (const [name, size] of Object.entries(analysis.chunkSizes)) {
      lines.push(`- ${name}: ${this.formatSize(size)}`);
    }

    if (analysis.largeDependencies.length > 0) {
      lines.push('', '## Large Dependencies (>100KB)');
      for (const dep of analysis.largeDependencies) {
        lines.push(`- ${dep.name}: ${this.formatSize(dep.size)}`);
      }
    }

    return lines.join('\n');
  }
}
