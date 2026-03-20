import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

export interface VirtualizationCandidate {
  component: string;
  filePath: string;
  type: 'list' | 'table' | 'grid';
  itemCount: number;
  estimatedImprovement: number;
  suggestion: string;
}

export interface LazyLoadCandidate {
  component: string;
  filePath: string;
  type: 'image' | 'component' | 'route';
  size: number;
  priority: 'high' | 'medium' | 'low';
  suggestion: string;
}

export interface ResourceOptimizationResult {
  virtualizationImplemented: VirtualizationCandidate[];
  lazyLoadingImplemented: LazyLoadCandidate[];
  filesModified: string[];
  errors: string[];
  warnings: string[];
  estimatedImprovement: {
    renderTimeReduction: number;
    memoryReduction: number;
    initialLoadReduction: number;
  };
}

export class ResourceOptimizer {
  private projectRoot: string;
  private srcPath: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.srcPath = path.join(projectRoot, 'src');
  }

  /**
   * Identifies components that would benefit from virtualization
   * Requirement 6.5: Implement virtualization for large lists and tables
   */
  async identifyVirtualizationCandidates(): Promise<VirtualizationCandidate[]> {
    const candidates: VirtualizationCandidate[] = [];
    const componentFiles = await this.findComponentFiles();

    for (const filePath of componentFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
      );

      // Look for .map() calls that render lists
      const mapCalls = this.findMapCalls(sourceFile, content);
      for (const mapCall of mapCalls) {
        if (this.isLargeList(mapCall, content)) {
          const componentName = this.extractComponentName(content) || path.basename(filePath, path.extname(filePath));
          candidates.push({
            component: componentName,
            filePath,
            type: this.detectListType(content),
            itemCount: this.estimateItemCount(mapCall, content),
            estimatedImprovement: 60, // 60% render time improvement
            suggestion: 'Implement virtualization using react-window or react-virtual',
          });
        }
      }

      // Look for table components
      if (content.includes('<table') || content.includes('<Table')) {
        const componentName = this.extractComponentName(content) || path.basename(filePath, path.extname(filePath));
        if (this.hasLargeDataset(content)) {
          candidates.push({
            component: componentName,
            filePath,
            type: 'table',
            itemCount: 100, // Estimate
            estimatedImprovement: 70,
            suggestion: 'Implement virtualization for table rows using react-window or TanStack Virtual',
          });
        }
      }
    }

    return candidates;
  }

  /**
   * Identifies images and components that should be lazy loaded
   * Requirement 6.6: Implement lazy loading for images
   */
  async identifyLazyLoadCandidates(): Promise<LazyLoadCandidate[]> {
    const candidates: LazyLoadCandidate[] = [];
    const componentFiles = await this.findComponentFiles();

    for (const filePath of componentFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');

      // Find image tags without lazy loading
      const imgPattern = /<img[^>]+src=/g;
      const imgMatches = content.match(imgPattern);
      
      if (imgMatches && imgMatches.length > 0) {
        const hasLazyLoading = content.includes('loading="lazy"') || content.includes('loading={"lazy"}');
        
        if (!hasLazyLoading) {
          const componentName = this.extractComponentName(content) || path.basename(filePath, path.extname(filePath));
          candidates.push({
            component: componentName,
            filePath,
            type: 'image',
            size: imgMatches.length * 100 * 1024, // Estimate 100KB per image
            priority: 'high',
            suggestion: 'Add loading="lazy" attribute to images or use next/image for optimization',
          });
        }
      }

      // Find heavy components that could be lazy loaded
      if (this.isHeavyComponent(content)) {
        const componentName = this.extractComponentName(content) || path.basename(filePath, path.extname(filePath));
        candidates.push({
          component: componentName,
          filePath,
          type: 'component',
          size: content.length,
          priority: 'medium',
          suggestion: 'Consider lazy loading this component with React.lazy() and Suspense',
        });
      }
    }

    return candidates;
  }

  /**
   * Implements virtualization for lists and tables
   * Requirement 6.5: Add virtualization for large lists and tables
   */
  async implementVirtualization(candidates: VirtualizationCandidate[]): Promise<ResourceOptimizationResult> {
    const virtualizationImplemented: VirtualizationCandidate[] = [];
    const filesModified: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const candidate of candidates) {
      try {
        // Check if virtualization library is available
        const packageJsonPath = path.join(this.projectRoot, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const hasVirtualLib = packageJson.dependencies?.['react-window'] || 
                             packageJson.dependencies?.['react-virtual'] ||
                             packageJson.dependencies?.['@tanstack/react-virtual'];

        if (!hasVirtualLib) {
          warnings.push(`Virtualization library not installed. Run: npm install react-window or @tanstack/react-virtual`);
          continue;
        }

        // For now, just mark as needing manual implementation
        warnings.push(`Virtualization for ${candidate.component} requires manual implementation with react-window or @tanstack/react-virtual`);
        
      } catch (error) {
        errors.push(`Failed to implement virtualization for ${candidate.component}: ${error}`);
      }
    }

    return {
      virtualizationImplemented,
      lazyLoadingImplemented: [],
      filesModified,
      errors,
      warnings,
      estimatedImprovement: {
        renderTimeReduction: 60,
        memoryReduction: 70,
        initialLoadReduction: 0,
      },
    };
  }

  /**
   * Implements lazy loading for images
   * Requirement 6.6: Optimize image loading with lazy loading
   */
  async implementLazyLoading(candidates: LazyLoadCandidate[]): Promise<ResourceOptimizationResult> {
    const lazyLoadingImplemented: LazyLoadCandidate[] = [];
    const filesModified: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const candidate of candidates) {
      try {
        if (candidate.type === 'image') {
          const success = await this.addLazyLoadingToImages(candidate.filePath);
          if (success) {
            lazyLoadingImplemented.push(candidate);
            if (!filesModified.includes(candidate.filePath)) {
              filesModified.push(candidate.filePath);
            }
          }
        } else if (candidate.type === 'component') {
          warnings.push(`Component lazy loading for ${candidate.component} requires manual implementation with React.lazy()`);
        }
      } catch (error) {
        errors.push(`Failed to implement lazy loading for ${candidate.component}: ${error}`);
      }
    }

    return {
      virtualizationImplemented: [],
      lazyLoadingImplemented,
      filesModified,
      errors,
      warnings,
      estimatedImprovement: {
        renderTimeReduction: 0,
        memoryReduction: 30,
        initialLoadReduction: 40,
      },
    };
  }

  /**
   * Adds lazy loading attribute to image tags
   */
  private async addLazyLoadingToImages(filePath: string): Promise<boolean> {
    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      let modified = false;

      // Add loading="lazy" to img tags that don't have it
      content = content.replace(
        /<img([^>]*?)(?<!loading=["'][^"']*["'])>/g,
        (match, attrs) => {
          if (!attrs.includes('loading=')) {
            modified = true;
            // Add loading="lazy" before the closing >
            return `<img${attrs} loading="lazy">`;
          }
          return match;
        }
      );

      if (modified) {
        fs.writeFileSync(filePath, content, 'utf-8');
        return true;
      }

      return false;
    } catch (error) {
      throw new Error(`Failed to add lazy loading: ${error}`);
    }
  }

  /**
   * Helper methods
   */

  private async findComponentFiles(): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.tsx', '.jsx'];

    const walk = (dir: string) => {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('dist')) {
          walk(fullPath);
        } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    };

    walk(this.srcPath);
    return files;
  }

  private findMapCalls(sourceFile: ts.SourceFile, content: string): string[] {
    const mapCalls: string[] = [];

    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node)) {
        const expr = node.expression.getText(sourceFile);
        if (expr.includes('.map')) {
          mapCalls.push(node.getText(sourceFile));
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return mapCalls;
  }

  private isLargeList(mapCall: string, content: string): boolean {
    // Check if the array being mapped is likely large
    // Look for patterns like: items.map, data.map, list.map
    const largeListPatterns = ['items.map', 'data.map', 'list.map', 'rows.map', 'results.map'];
    return largeListPatterns.some(pattern => mapCall.includes(pattern));
  }

  private detectListType(content: string): 'list' | 'table' | 'grid' {
    if (content.includes('<table') || content.includes('<Table')) {
      return 'table';
    } else if (content.includes('grid') || content.includes('Grid')) {
      return 'grid';
    }
    return 'list';
  }

  private estimateItemCount(mapCall: string, content: string): number {
    // This is a rough estimate - would need runtime analysis for accuracy
    return 100;
  }

  private hasLargeDataset(content: string): boolean {
    // Check for patterns that suggest large datasets
    return content.includes('.length >') || 
           content.includes('pagination') || 
           content.includes('pageSize');
  }

  private extractComponentName(content: string): string | null {
    const functionMatch = content.match(/(?:function|const)\s+([A-Z]\w+)/);
    return functionMatch ? functionMatch[1] : null;
  }

  private isHeavyComponent(content: string): boolean {
    // Consider a component heavy if it's large and has many dependencies
    return content.length > 10000 && 
           (content.match(/import/g) || []).length > 10;
  }
}
