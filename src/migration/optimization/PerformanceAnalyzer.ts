import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

export interface ComponentMetrics {
  name: string;
  filePath: string;
  renderCount: number;
  averageRenderTime: number;
  complexity: number;
  propsCount: number;
  stateCount: number;
  effectsCount: number;
  memoized: boolean;
}

export interface RerenderAnalysis {
  component: string;
  filePath: string;
  reason: 'props-change' | 'parent-rerender' | 'context-change' | 'state-change';
  unnecessary: boolean;
  suggestion: string;
  estimatedImpact: 'high' | 'medium' | 'low';
}

export interface ComputationAnalysis {
  location: string;
  filePath: string;
  lineNumber: number;
  complexity: number;
  canMemoize: boolean;
  suggestion: string;
  estimatedSavings: number;
}

export interface StoreOptimization {
  storeName: string;
  filePath: string;
  issue: 'no-selector' | 'full-state-access' | 'unnecessary-subscription';
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
}

export interface PerformanceAnalysis {
  expensiveComponents: ComponentMetrics[];
  unnecessaryRerenders: RerenderAnalysis[];
  heavyComputations: ComputationAnalysis[];
  storeOptimizations: StoreOptimization[];
  timestamp: Date;
}

export class PerformanceAnalyzer {
  private projectRoot: string;
  private srcPath: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.srcPath = path.join(projectRoot, 'src');
  }

  /**
   * Analyzes component render performance
   * Requirement 6.1: Analyze component render performance and identify optimization opportunities
   */
  async analyzeRenderPerformance(): Promise<PerformanceAnalysis> {
    const expensiveComponents = await this.identifyExpensiveComponents();
    const unnecessaryRerenders = await this.detectUnnecessaryRerenders();
    const heavyComputations = await this.identifyHeavyComputations();
    const storeOptimizations = await this.analyzeStoreUsage();

    return {
      expensiveComponents,
      unnecessaryRerenders,
      heavyComputations,
      storeOptimizations,
      timestamp: new Date(),
    };
  }

  /**
   * Identifies expensive components based on complexity metrics
   */
  private async identifyExpensiveComponents(): Promise<ComponentMetrics[]> {
    const components: ComponentMetrics[] = [];
    const componentFiles = await this.findComponentFiles();

    for (const filePath of componentFiles) {
      const metrics = await this.analyzeComponent(filePath);
      if (metrics && this.isExpensive(metrics)) {
        components.push(metrics);
      }
    }

    return components.sort((a, b) => b.complexity - a.complexity);
  }

  /**
   * Analyzes a single component file for performance metrics
   */
  private async analyzeComponent(filePath: string): Promise<ComponentMetrics | null> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
      );

      let componentName = '';
      let propsCount = 0;
      let stateCount = 0;
      let effectsCount = 0;
      let memoized = false;
      let complexity = 0;

      const visit = (node: ts.Node) => {
        // Detect component declaration
        if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
          const parent = node.parent;
          if (ts.isVariableDeclaration(parent) && parent.name && ts.isIdentifier(parent.name)) {
            const name = parent.name.text;
            if (this.isReactComponent(name, content)) {
              componentName = name;
            }
          } else if (ts.isFunctionDeclaration(node) && node.name) {
            const name = node.name.text;
            if (this.isReactComponent(name, content)) {
              componentName = name;
            }
          }
        }

        // Count useState calls
        if (ts.isCallExpression(node) && node.expression.getText(sourceFile) === 'useState') {
          stateCount++;
        }

        // Count useEffect calls
        if (ts.isCallExpression(node) && node.expression.getText(sourceFile) === 'useEffect') {
          effectsCount++;
        }

        // Check for React.memo
        if (ts.isCallExpression(node) && node.expression.getText(sourceFile).includes('memo')) {
          memoized = true;
        }

        // Calculate complexity (simplified)
        if (ts.isIfStatement(node) || ts.isConditionalExpression(node)) {
          complexity++;
        }
        if (ts.isForStatement(node) || ts.isWhileStatement(node) || ts.isForOfStatement(node)) {
          complexity += 2;
        }

        ts.forEachChild(node, visit);
      };

      visit(sourceFile);

      if (!componentName) {
        return null;
      }

      // Count props (simplified - count parameters)
      const componentNode = this.findComponentNode(sourceFile, componentName);
      if (componentNode && ts.isFunctionLike(componentNode)) {
        propsCount = componentNode.parameters.length;
      }

      return {
        name: componentName,
        filePath,
        renderCount: 0, // Would need runtime profiling
        averageRenderTime: 0, // Would need runtime profiling
        complexity,
        propsCount,
        stateCount,
        effectsCount,
        memoized,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Checks if a component is expensive based on metrics
   */
  private isExpensive(metrics: ComponentMetrics): boolean {
    return (
      metrics.complexity > 10 ||
      metrics.stateCount > 5 ||
      metrics.effectsCount > 3 ||
      (metrics.complexity > 5 && !metrics.memoized)
    );
  }

  /**
   * Detects unnecessary re-renders
   * Requirement 6.2: Detect unnecessary re-renders and suggest optimizations
   */
  private async detectUnnecessaryRerenders(): Promise<RerenderAnalysis[]> {
    const rerenders: RerenderAnalysis[] = [];
    const componentFiles = await this.findComponentFiles();

    for (const filePath of componentFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
      );

      const componentName = this.extractComponentName(content);
      if (!componentName) continue;

      // Check if component is not memoized but should be
      if (!content.includes('React.memo') && !content.includes('memo(')) {
        const metrics = await this.analyzeComponent(filePath);
        if (metrics && (metrics.propsCount > 0 || metrics.complexity > 5)) {
          rerenders.push({
            component: componentName,
            filePath,
            reason: 'parent-rerender',
            unnecessary: true,
            suggestion: `Wrap ${componentName} with React.memo to prevent unnecessary re-renders`,
            estimatedImpact: metrics.complexity > 10 ? 'high' : 'medium',
          });
        }
      }

      // Check for inline object/array creation in props
      if (content.includes('={{') || content.includes('={[')) {
        rerenders.push({
          component: componentName,
          filePath,
          reason: 'props-change',
          unnecessary: true,
          suggestion: `Move inline object/array creation outside render or use useMemo`,
          estimatedImpact: 'medium',
        });
      }
    }

    return rerenders;
  }

  /**
   * Identifies heavy computations that can be memoized
   * Requirement 6.3: Identify and optimize expensive computations
   */
  private async identifyHeavyComputations(): Promise<ComputationAnalysis[]> {
    const computations: ComputationAnalysis[] = [];
    const files = await this.findAllSourceFiles();

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
      );

      let lineNumber = 0;

      const visit = (node: ts.Node) => {
        // Detect loops that could be expensive
        if (ts.isForStatement(node) || ts.isForOfStatement(node) || ts.isWhileStatement(node)) {
          const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
          
          // Check if inside a component and not memoized
          const isInComponent = this.isNodeInComponent(node, sourceFile);
          const hasMemo = this.hasUseMemo(node, sourceFile);

          if (isInComponent && !hasMemo) {
            computations.push({
              location: node.getText(sourceFile).substring(0, 50) + '...',
              filePath,
              lineNumber: line,
              complexity: 2,
              canMemoize: true,
              suggestion: 'Wrap this computation in useMemo to avoid recalculation on every render',
              estimatedSavings: 50, // ms
            });
          }
        }

        // Detect array operations that could be expensive
        if (ts.isCallExpression(node)) {
          const expr = node.expression.getText(sourceFile);
          if (expr.includes('.map') || expr.includes('.filter') || expr.includes('.reduce')) {
            const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
            const isInComponent = this.isNodeInComponent(node, sourceFile);
            const hasMemo = this.hasUseMemo(node, sourceFile);

            if (isInComponent && !hasMemo) {
              computations.push({
                location: node.getText(sourceFile).substring(0, 50) + '...',
                filePath,
                lineNumber: line,
                complexity: 1,
                canMemoize: true,
                suggestion: 'Consider wrapping this array operation in useMemo',
                estimatedSavings: 20, // ms
              });
            }
          }
        }

        ts.forEachChild(node, visit);
      };

      visit(sourceFile);
    }

    return computations;
  }

  /**
   * Analyzes Zustand store usage for optimization opportunities
   * Requirement 6.4: Analyze and optimize Zustand store selectors
   */
  private async analyzeStoreUsage(): Promise<StoreOptimization[]> {
    const optimizations: StoreOptimization[] = [];
    const files = await this.findAllSourceFiles();

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');

      // Check for full state access without selectors
      const fullStatePattern = /use\w+Store\(\s*\)/g;
      const matches = content.match(fullStatePattern);

      if (matches && matches.length > 0) {
        optimizations.push({
          storeName: matches[0].replace('()', ''),
          filePath,
          issue: 'full-state-access',
          suggestion: 'Use selective state access with a selector function to minimize re-renders',
          impact: 'high',
        });
      }

      // Check for store usage without shallow equality
      if (content.includes('useStore(') && !content.includes('shallow')) {
        optimizations.push({
          storeName: 'store',
          filePath,
          issue: 'no-selector',
          suggestion: 'Use shallow equality comparison for object selectors',
          impact: 'medium',
        });
      }
    }

    return optimizations;
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

  private async findAllSourceFiles(): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];

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

  private isReactComponent(name: string, content: string): boolean {
    // Component names should start with uppercase
    if (!/^[A-Z]/.test(name)) return false;
    
    // Should return JSX
    return content.includes('return') && (content.includes('<') || content.includes('jsx'));
  }

  private extractComponentName(content: string): string | null {
    const functionMatch = content.match(/(?:function|const)\s+([A-Z]\w+)/);
    return functionMatch ? functionMatch[1] : null;
  }

  private findComponentNode(sourceFile: ts.SourceFile, componentName: string): ts.Node | null {
    let result: ts.Node | null = null;

    const visit = (node: ts.Node) => {
      if (ts.isFunctionDeclaration(node) && node.name?.text === componentName) {
        result = node;
      } else if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === componentName) {
        result = node;
      }
      if (!result) {
        ts.forEachChild(node, visit);
      }
    };

    visit(sourceFile);
    return result;
  }

  private isNodeInComponent(node: ts.Node, sourceFile: ts.SourceFile): boolean {
    let current: ts.Node | undefined = node;
    while (current) {
      if (ts.isFunctionDeclaration(current) || ts.isArrowFunction(current) || ts.isFunctionExpression(current)) {
        const text = current.getText(sourceFile);
        if (text.includes('return') && (text.includes('<') || text.includes('jsx'))) {
          return true;
        }
      }
      current = current.parent;
    }
    return false;
  }

  private hasUseMemo(node: ts.Node, sourceFile: ts.SourceFile): boolean {
    let current: ts.Node | undefined = node.parent;
    while (current) {
      if (ts.isCallExpression(current) && current.expression.getText(sourceFile) === 'useMemo') {
        return true;
      }
      current = current.parent;
    }
    return false;
  }
}
