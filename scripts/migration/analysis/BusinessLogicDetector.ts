import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

export interface BusinessLogicViolation {
  file: string;
  line: number;
  column: number;
  type: 'supabase_from' | 'supabase_rpc' | 'supabase_auth' | 'state_management' | 'data_transformation';
  code: string;
  severity: 'error' | 'warning';
  message: string;
  suggestion: string;
}

export interface DetectionResult {
  file: string;
  violations: BusinessLogicViolation[];
  hasBusinessLogic: boolean;
  violationCount: number;
}

export class BusinessLogicDetector {
  private sourceFile: ts.SourceFile | null = null;
  private filePath: string = '';
  private fileContent: string = '';

  /**
   * Detect business logic violations in a page file
   */
  detectInFile(filePath: string): DetectionResult {
    this.filePath = filePath;
    this.fileContent = fs.readFileSync(filePath, 'utf-8');
    
    this.sourceFile = ts.createSourceFile(
      filePath,
      this.fileContent,
      ts.ScriptTarget.Latest,
      true
    );

    const violations: BusinessLogicViolation[] = [];

    // Detect Supabase calls
    violations.push(...this.detectSupabaseCalls());
    
    // Detect state management logic
    violations.push(...this.detectStateManagement());
    
    // Detect data transformation
    violations.push(...this.detectDataTransformation());

    return {
      file: filePath,
      violations,
      hasBusinessLogic: violations.length > 0,
      violationCount: violations.length
    };
  }

  /**
   * Detect all pages with business logic violations
   */
  detectInDirectory(dirPath: string): DetectionResult[] {
    const results: DetectionResult[] = [];
    
    const scanDirectory = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          scanDirectory(fullPath);
        } else if (this.isPageFile(entry.name)) {
          const result = this.detectInFile(fullPath);
          if (result.hasBusinessLogic) {
            results.push(result);
          }
        }
      }
    };

    scanDirectory(dirPath);
    return results;
  }

  /**
   * Detect supabase.from(), supabase.rpc(), supabase.auth() calls
   */
  private detectSupabaseCalls(): BusinessLogicViolation[] {
    const violations: BusinessLogicViolation[] = [];
    
    if (!this.sourceFile) return violations;

    const visit = (node: ts.Node) => {
      // Check for supabase.from() calls
      if (ts.isCallExpression(node)) {
        const expression = node.expression;
        
        if (ts.isPropertyAccessExpression(expression)) {
          const object = expression.expression;
          const property = expression.name.text;
          
          // Check if it's supabase.from()
          if (this.isSupabaseIdentifier(object) && property === 'from') {
            const { line, character } = this.sourceFile!.getLineAndCharacterOfPosition(node.getStart());
            violations.push({
              file: this.filePath,
              line: line + 1,
              column: character + 1,
              type: 'supabase_from',
              code: this.getNodeText(node),
              severity: 'error',
              message: 'Direct Supabase.from() call in page component',
              suggestion: 'Move this data fetching logic to a feature api/ service'
            });
          }
          
          // Check if it's supabase.rpc()
          if (this.isSupabaseIdentifier(object) && property === 'rpc') {
            const { line, character } = this.sourceFile!.getLineAndCharacterOfPosition(node.getStart());
            violations.push({
              file: this.filePath,
              line: line + 1,
              column: character + 1,
              type: 'supabase_rpc',
              code: this.getNodeText(node),
              severity: 'error',
              message: 'Direct Supabase.rpc() call in page component',
              suggestion: 'Move this RPC call to a feature api/ service'
            });
          }
          
          // Check if it's supabase.auth
          if (this.isSupabaseIdentifier(object) && property === 'auth') {
            const { line, character } = this.sourceFile!.getLineAndCharacterOfPosition(node.getStart());
            violations.push({
              file: this.filePath,
              line: line + 1,
              column: character + 1,
              type: 'supabase_auth',
              code: this.getNodeText(node),
              severity: 'error',
              message: 'Direct Supabase.auth() call in page component',
              suggestion: 'Move this auth logic to features/auth/api/'
            });
          }
        }
      }
      
      ts.forEachChild(node, visit);
    };

    visit(this.sourceFile);
    return violations;
  }

  /**
   * Detect state management logic (useState with data fetching in useEffect)
   */
  private detectStateManagement(): BusinessLogicViolation[] {
    const violations: BusinessLogicViolation[] = [];
    
    if (!this.sourceFile) return violations;

    const visit = (node: ts.Node) => {
      // Look for useEffect with async data fetching
      if (ts.isCallExpression(node)) {
        const expression = node.expression;
        
        if (ts.isIdentifier(expression) && expression.text === 'useEffect') {
          // Check if the effect contains async operations or fetch calls
          const effectCallback = node.arguments[0];
          if (effectCallback && this.containsAsyncLogic(effectCallback)) {
            const { line, character } = this.sourceFile!.getLineAndCharacterOfPosition(node.getStart());
            violations.push({
              file: this.filePath,
              line: line + 1,
              column: character + 1,
              type: 'state_management',
              code: this.getNodeText(node).substring(0, 100) + '...',
              severity: 'warning',
              message: 'State management with data fetching in page component',
              suggestion: 'Extract this logic to a custom hook in feature model/'
            });
          }
        }
      }
      
      ts.forEachChild(node, visit);
    };

    visit(this.sourceFile);
    return violations;
  }

  /**
   * Detect data transformation logic
   */
  private detectDataTransformation(): BusinessLogicViolation[] {
    const violations: BusinessLogicViolation[] = [];
    
    if (!this.sourceFile) return violations;

    // Look for .map(), .filter(), .reduce() with complex transformations
    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node)) {
        const expression = node.expression;
        
        if (ts.isPropertyAccessExpression(expression)) {
          const property = expression.name.text;
          
          // Check for array methods with complex logic
          if (['map', 'filter', 'reduce'].includes(property)) {
            const callback = node.arguments[0];
            if (callback && this.isComplexTransformation(callback)) {
              const { line, character } = this.sourceFile!.getLineAndCharacterOfPosition(node.getStart());
              violations.push({
                file: this.filePath,
                line: line + 1,
                column: character + 1,
                type: 'data_transformation',
                code: this.getNodeText(node).substring(0, 100) + '...',
                severity: 'warning',
                message: 'Complex data transformation in page component',
                suggestion: 'Move this transformation logic to a utility function in feature lib/'
              });
            }
          }
        }
      }
      
      ts.forEachChild(node, visit);
    };

    visit(this.sourceFile);
    return violations;
  }

  /**
   * Check if a node is a supabase identifier
   */
  private isSupabaseIdentifier(node: ts.Node): boolean {
    if (ts.isIdentifier(node)) {
      return node.text === 'supabase';
    }
    return false;
  }

  /**
   * Check if a node contains async logic
   */
  private containsAsyncLogic(node: ts.Node): boolean {
    let hasAsync = false;
    
    const visit = (n: ts.Node) => {
      if (ts.isAwaitExpression(n) || 
          (ts.isFunctionLike(n) && n.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword))) {
        hasAsync = true;
      }
      if (!hasAsync) {
        ts.forEachChild(n, visit);
      }
    };
    
    visit(node);
    return hasAsync;
  }

  /**
   * Check if a transformation is complex (more than 3 lines or nested operations)
   */
  private isComplexTransformation(node: ts.Node): boolean {
    const text = this.getNodeText(node);
    const lines = text.split('\n').length;
    
    // Consider it complex if more than 3 lines or contains nested operations
    return lines > 3 || text.includes('.map(') || text.includes('.filter(') || text.includes('.reduce(');
  }

  /**
   * Get the text of a node
   */
  private getNodeText(node: ts.Node): string {
    return node.getText(this.sourceFile!);
  }

  /**
   * Check if a file is a page file
   */
  private isPageFile(filename: string): boolean {
    return /\.(tsx|jsx)$/.test(filename) && !filename.includes('.test.') && !filename.includes('.spec.');
  }

  /**
   * Generate a report of all violations
   */
  generateReport(results: DetectionResult[]): string {
    let report = '=== Business Logic Detection Report ===\n\n';
    
    const totalFiles = results.length;
    const totalViolations = results.reduce((sum, r) => sum + r.violationCount, 0);
    
    report += `Total files with violations: ${totalFiles}\n`;
    report += `Total violations: ${totalViolations}\n\n`;
    
    // Group by violation type
    const byType: Record<string, number> = {};
    results.forEach(r => {
      r.violations.forEach(v => {
        byType[v.type] = (byType[v.type] || 0) + 1;
      });
    });
    
    report += 'Violations by type:\n';
    Object.entries(byType).forEach(([type, count]) => {
      report += `  ${type}: ${count}\n`;
    });
    
    report += '\n';
    
    // List files with violations
    results.forEach(result => {
      report += `\nFile: ${result.file}\n`;
      report += `Violations: ${result.violationCount}\n`;
      
      result.violations.forEach(v => {
        report += `  [${v.severity.toUpperCase()}] Line ${v.line}: ${v.message}\n`;
        report += `    ${v.suggestion}\n`;
      });
    });
    
    return report;
  }
}
