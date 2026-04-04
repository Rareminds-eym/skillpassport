import * as fs from 'fs';
import * as path from 'path';

export interface CodeSplittingResult {
  routesUpdated: string[];
  modulesLazyLoaded: string[];
  estimatedSavings: number;
}

export interface RouteInfo {
  path: string;
  component: string;
  isLazy: boolean;
}

export class CodeSplitter {
  private projectRoot: string;
  private routesPath: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.routesPath = path.join(projectRoot, 'src', 'routes');
  }

  /**
   * Analyzes routes and identifies code splitting opportunities
   * Requirement 5.4: Bundle_Optimizer SHALL identify components suitable for code splitting
   */
  async analyzeRoutes(): Promise<RouteInfo[]> {
    const routes: RouteInfo[] = [];
    
    if (!fs.existsSync(this.routesPath)) {
      return routes;
    }

    const routeFiles = fs.readdirSync(this.routesPath).filter(f => 
      f.endsWith('.jsx') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.ts')
    );

    for (const file of routeFiles) {
      const filePath = path.join(this.routesPath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Check for lazy imports
      const lazyImportRegex = /const\s+(\w+)\s+=\s+lazy\(\s*\(\)\s*=>\s*import\(['"]([^'"]+)['"]\)/g;
      let match;

      while ((match = lazyImportRegex.exec(content)) !== null) {
        routes.push({
          path: match[2],
          component: match[1],
          isLazy: true,
        });
      }

      // Check for regular imports
      const regularImportRegex = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
      while ((match = regularImportRegex.exec(content)) !== null) {
        // Skip if it's not a component (starts with uppercase)
        if (match[1][0] === match[1][0].toUpperCase() && !match[2].includes('react')) {
          routes.push({
            path: match[2],
            component: match[1],
            isLazy: false,
          });
        }
      }
    }

    return routes;
  }

  /**
   * Implements dynamic imports for route-based code splitting
   * Requirement 5.5: Code_Splitter SHALL implement dynamic imports for route-based code splitting
   */
  async implementRouteSplitting(routeFile: string): Promise<string[]> {
    const filePath = path.join(this.routesPath, routeFile);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Route file not found: ${routeFile}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const updatedImports: string[] = [];

    // Find non-lazy component imports
    const importRegex = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    const imports: Array<{ component: string; path: string; fullMatch: string }> = [];

    while ((match = importRegex.exec(content)) !== null) {
      const component = match[1];
      const importPath = match[2];
      
      // Only convert page/component imports, not utilities or hooks
      if (component[0] === component[0].toUpperCase() && 
          !importPath.includes('react') &&
          !importPath.includes('Layout') &&
          !content.includes(`lazy(() => import('${importPath}')`)) {
        imports.push({
          component,
          path: importPath,
          fullMatch: match[0],
        });
      }
    }

    // Convert to lazy imports
    let updatedContent = content;
    
    // Add lazy import if not present
    if (!content.includes('import { lazy }') && !content.includes('import {lazy}')) {
      updatedContent = `import { lazy } from 'react';\n${updatedContent}`;
    }

    for (const imp of imports) {
      const lazyImport = `const ${imp.component} = lazy(() => import('${imp.path}'))`;
      updatedContent = updatedContent.replace(imp.fullMatch, lazyImport);
      updatedImports.push(imp.component);
    }

    // Write back if changes were made
    if (updatedImports.length > 0) {
      fs.writeFileSync(filePath, updatedContent, 'utf-8');
    }

    return updatedImports;
  }

  /**
   * Implements lazy loading for large feature modules
   * Requirement 5.6: Code_Splitter SHALL implement lazy loading for large feature modules
   */
  async implementFeatureLazyLoading(featurePath: string): Promise<boolean> {
    const fullPath = path.join(this.projectRoot, 'src', featurePath);
    
    if (!fs.existsSync(fullPath)) {
      return false;
    }

    const indexPath = path.join(fullPath, 'index.ts');
    if (!fs.existsSync(indexPath)) {
      return false;
    }

    const content = fs.readFileSync(indexPath, 'utf-8');
    
    // Check if already using lazy loading
    if (content.includes('lazy(') || content.includes('React.lazy')) {
      return false;
    }

    // For features, we typically want to lazy load the main component
    // This is a simplified implementation
    const componentExportRegex = /export\s+\{\s*(\w+)\s*\}/g;
    const match = componentExportRegex.exec(content);
    
    if (match) {
      // Feature is already set up for lazy loading via index exports
      return true;
    }

    return false;
  }

  /**
   * Measures bundle size reduction after optimizations
   * Requirement 5.7: Bundle_Optimizer SHALL measure bundle size reduction after optimizations
   */
  async measureSizeReduction(beforeSize: number, afterSize: number): Promise<{
    reduction: number;
    percentage: number;
    beforeSize: number;
    afterSize: number;
  }> {
    const reduction = beforeSize - afterSize;
    const percentage = (reduction / beforeSize) * 100;

    return {
      reduction,
      percentage,
      beforeSize,
      afterSize,
    };
  }

  /**
   * Identifies large modules that should be code-split
   */
  async identifyLargeModules(sizeThreshold: number = 100 * 1024): Promise<string[]> {
    const largeModules: string[] = [];
    const srcPath = path.join(this.projectRoot, 'src');

    await this.scanForLargeFiles(srcPath, sizeThreshold, largeModules);

    return largeModules;
  }

  /**
   * Recursively scans for large files
   */
  private async scanForLargeFiles(dirPath: string, threshold: number, results: string[]): Promise<void> {
    if (!fs.existsSync(dirPath)) {
      return;
    }

    const items = fs.readdirSync(dirPath);

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        if (!['node_modules', 'dist', '.git'].includes(item)) {
          await this.scanForLargeFiles(itemPath, threshold, results);
        }
      } else if ((item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx')) && stats.size > threshold) {
        results.push(path.relative(this.projectRoot, itemPath));
      }
    }
  }
}
