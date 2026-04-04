/**
 * Semantic Equivalence Analyzer
 * Analyzes whether code blocks are functionally equivalent
 */

import * as ts from 'typescript';
import type { CodeBlock, SemanticAnalysis } from '@/features/student-profile/model';

export class SemanticAnalyzer {
  /**
   * Analyze semantic equivalence between code blocks
   */
  async analyzeSemantic(blocks: CodeBlock[]): Promise<SemanticAnalysis> {
    if (blocks.length < 2) {
      return {
        functionalEquivalence: true,
        typeCompatibility: true,
        sideEffects: [],
        dependencies: [],
        confidence: 1.0,
      };
    }

    const [first, ...rest] = blocks;
    const firstAST = this.parseToAST(first.code);
    
    let functionalEquivalence = true;
    let typeCompatibility = true;
    const allSideEffects = new Set<string>();
    const allDependencies = new Set<string>();

    for (const block of rest) {
      const blockAST = this.parseToAST(block.code);
      
      if (!this.compareAST(firstAST, blockAST)) {
        functionalEquivalence = false;
      }

      const sideEffects = this.detectSideEffects(blockAST);
      sideEffects.forEach(effect => allSideEffects.add(effect));

      const deps = this.extractDependencies(blockAST);
      deps.forEach(dep => allDependencies.add(dep));
    }

    // Check first block too
    const firstSideEffects = this.detectSideEffects(firstAST);
    firstSideEffects.forEach(effect => allSideEffects.add(effect));
    
    const firstDeps = this.extractDependencies(firstAST);
    firstDeps.forEach(dep => allDependencies.add(dep));

    const confidence = this.calculateConfidence(
      functionalEquivalence,
      typeCompatibility,
      allSideEffects.size
    );

    return {
      functionalEquivalence,
      typeCompatibility,
      sideEffects: Array.from(allSideEffects),
      dependencies: Array.from(allDependencies),
      confidence,
    };
  }

  /**
   * Parse code to AST
   */
  private parseToAST(code: string): ts.Node {
    const sourceFile = ts.createSourceFile(
      'temp.ts',
      code,
      ts.ScriptTarget.Latest,
      true
    );
    return sourceFile;
  }

  /**
   * Compare two ASTs for structural equivalence
   */
  private compareAST(node1: ts.Node, node2: ts.Node): boolean {
    // Same kind
    if (node1.kind !== node2.kind) return false;

    // Compare text for leaf nodes
    if (ts.isIdentifier(node1) && ts.isIdentifier(node2)) {
      return node1.text === node2.text;
    }

    if (ts.isStringLiteral(node1) && ts.isStringLiteral(node2)) {
      return node1.text === node2.text;
    }

    if (ts.isNumericLiteral(node1) && ts.isNumericLiteral(node2)) {
      return node1.text === node2.text;
    }

    // Compare children
    const children1 = node1.getChildren();
    const children2 = node2.getChildren();

    if (children1.length !== children2.length) return false;

    for (let i = 0; i < children1.length; i++) {
      if (!this.compareAST(children1[i], children2[i])) {
        return false;
      }
    }

    return true;
  }

  /**
   * Detect side effects in code
   */
  private detectSideEffects(node: ts.Node): string[] {
    const sideEffects: string[] = [];

    const visit = (n: ts.Node) => {
      // Console logs
      if (ts.isCallExpression(n)) {
        const expr = n.expression;
        if (ts.isPropertyAccessExpression(expr)) {
          if (expr.expression.getText() === 'console') {
            sideEffects.push('console');
          }
        }
      }

      // Assignments to external variables
      if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
        const left = n.left;
        if (ts.isPropertyAccessExpression(left) || ts.isElementAccessExpression(left)) {
          sideEffects.push('external-mutation');
        }
      }

      // localStorage, sessionStorage
      if (ts.isPropertyAccessExpression(n)) {
        const expr = n.expression.getText();
        if (expr === 'localStorage' || expr === 'sessionStorage') {
          sideEffects.push('storage');
        }
      }

      ts.forEachChild(n, visit);
    };

    visit(node);
    return sideEffects;
  }

  /**
   * Extract dependencies from code
   */
  private extractDependencies(node: ts.Node): string[] {
    const dependencies: string[] = [];

    const visit = (n: ts.Node) => {
      // Import statements
      if (ts.isImportDeclaration(n)) {
        const moduleSpecifier = n.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpecifier)) {
          dependencies.push(moduleSpecifier.text);
        }
      }

      // Function calls
      if (ts.isCallExpression(n)) {
        const expr = n.expression;
        if (ts.isIdentifier(expr)) {
          dependencies.push(expr.text);
        } else if (ts.isPropertyAccessExpression(expr)) {
          dependencies.push(expr.getText());
        }
      }

      ts.forEachChild(n, visit);
    };

    visit(node);
    return dependencies;
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    functionalEquivalence: boolean,
    typeCompatibility: boolean,
    sideEffectCount: number
  ): number {
    let confidence = 1.0;

    if (!functionalEquivalence) confidence -= 0.3;
    if (!typeCompatibility) confidence -= 0.2;
    if (sideEffectCount > 0) confidence -= Math.min(0.3, sideEffectCount * 0.1);

    return Math.max(0, confidence);
  }

  /**
   * Check if blocks are safe to consolidate
   */
  isSafeToConsolidate(analysis: SemanticAnalysis): boolean {
    // Allow consolidation with lower confidence for simple utility functions
    return (
      analysis.confidence >= 0.6 &&
      analysis.sideEffects.length === 0
    );
  }
}
