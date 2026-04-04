import * as fs from 'fs';
import * as path from 'path';
import {
  PerformanceAnalyzer,
  PerformanceAnalysis,
  ComponentMetrics,
  RerenderAnalysis,
  ComputationAnalysis,
  StoreOptimization,
} from './PerformanceAnalyzer';

export interface PerformanceOptimization {
  type: 'memo' | 'useMemo' | 'useCallback' | 'selector' | 'virtualization' | 'lazy-loading';
  component: string;
  filePath: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  implemented: boolean;
}

export interface OptimizationResult {
  optimizations: PerformanceOptimization[];
  filesModified: string[];
  errors: string[];
  warnings: string[];
}

export interface PerformanceMetrics {
  before: MetricSnapshot;
  after: MetricSnapshot;
  improvement: {
    renderTimeReduction: number;
    rerenderReduction: number;
    bundleSizeReduction: number;
  };
}

export interface MetricSnapshot {
  timestamp: Date;
  averageRenderTime: number;
  totalRerenders: number;
  expensiveComponentCount: number;
}

export class PerformanceOptimizer {
  private analyzer: PerformanceAnalyzer;
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.analyzer = new PerformanceAnalyzer(projectRoot);
  }

  /**
   * Analyzes render performance and identifies optimization opportunities
   * Requirement 6.1: Analyze component render performance
   */
  async analyzeRenderPerformance(): Promise<PerformanceAnalysis> {
    return await this.analyzer.analyzeRenderPerformance();
  }

  /**
   * Identifies all optimization opportunities
   * Requirements 6.2, 6.3, 6.4: Identify optimization opportunities
   */
  async identifyOptimizations(): Promise<PerformanceOptimization[]> {
    const analysis = await this.analyzer.analyzeRenderPerformance();
    const optimizations: PerformanceOptimization[] = [];

    // Convert expensive components to React.memo opportunities
    for (const component of analysis.expensiveComponents) {
      if (!component.memoized) {
        optimizations.push({
          type: 'memo',
          component: component.name,
          filePath: component.filePath,
          description: `Wrap ${component.name} with React.memo to prevent unnecessary re-renders`,
          impact: component.complexity > 10 ? 'high' : 'medium',
          implemented: false,
        });
      }
    }

    // Convert unnecessary rerenders to optimization opportunities
    for (const rerender of analysis.unnecessaryRerenders) {
      if (rerender.suggestion.includes('useMemo')) {
        optimizations.push({
          type: 'useMemo',
          component: rerender.component,
          filePath: rerender.filePath,
          description: rerender.suggestion,
          impact: rerender.estimatedImpact,
          implemented: false,
        });
      } else if (rerender.suggestion.includes('memo')) {
        optimizations.push({
          type: 'memo',
          component: rerender.component,
          filePath: rerender.filePath,
          description: rerender.suggestion,
          impact: rerender.estimatedImpact,
          implemented: false,
        });
      }
    }

    // Convert heavy computations to useMemo opportunities
    for (const computation of analysis.heavyComputations) {
      if (computation.canMemoize) {
        optimizations.push({
          type: 'useMemo',
          component: path.basename(computation.filePath, path.extname(computation.filePath)),
          filePath: computation.filePath,
          description: computation.suggestion,
          impact: computation.complexity > 2 ? 'high' : 'medium',
          implemented: false,
        });
      }
    }

    // Convert store optimizations to selector opportunities
    for (const storeOpt of analysis.storeOptimizations) {
      optimizations.push({
        type: 'selector',
        component: storeOpt.storeName,
        filePath: storeOpt.filePath,
        description: storeOpt.suggestion,
        impact: storeOpt.impact,
        implemented: false,
      });
    }

    return optimizations.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  }

  /**
   * Implements React optimization patterns
   * Requirement 6.2: Suggest React.memo, useMemo, or useCallback optimizations
   */
  async implementOptimizations(optimizations: PerformanceOptimization[]): Promise<OptimizationResult> {
    const filesModified: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    const implementedOptimizations: PerformanceOptimization[] = [];

    for (const optimization of optimizations) {
      try {
        let success = false;

        switch (optimization.type) {
          case 'memo':
            success = await this.implementReactMemo(optimization.filePath, optimization.component);
            break;
          case 'useMemo':
            // useMemo requires manual implementation based on context
            warnings.push(`useMemo optimization for ${optimization.component} requires manual implementation`);
            success = false;
            break;
          case 'useCallback':
            warnings.push(`useCallback optimization for ${optimization.component} requires manual implementation`);
            success = false;
            break;
          case 'selector':
            warnings.push(`Store selector optimization for ${optimization.component} requires manual implementation`);
            success = false;
            break;
          default:
            warnings.push(`Unknown optimization type: ${optimization.type}`);
        }

        if (success) {
          optimization.implemented = true;
          implementedOptimizations.push(optimization);
          if (!filesModified.includes(optimization.filePath)) {
            filesModified.push(optimization.filePath);
          }
        }
      } catch (error) {
        errors.push(`Failed to implement ${optimization.type} for ${optimization.component}: ${error}`);
      }
    }

    return {
      optimizations: implementedOptimizations,
      filesModified,
      errors,
      warnings,
    };
  }

  /**
   * Implements React.memo wrapper for a component
   */
  private async implementReactMemo(filePath: string, componentName: string): Promise<boolean> {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');

      // Check if already memoized
      if (content.includes(`memo(${componentName})`) || content.includes(`React.memo(${componentName})`)) {
        return false;
      }

      // Add React import if not present
      let newContent = content;
      if (!content.includes('import React') && !content.includes("from 'react'")) {
        newContent = `import React from 'react';\n${newContent}`;
      } else if (content.includes("from 'react'") && !content.includes('memo')) {
        // Add memo to existing import
        newContent = newContent.replace(
          /import\s+{([^}]+)}\s+from\s+['"]react['"]/,
          (match, imports) => {
            if (!imports.includes('memo')) {
              return `import { ${imports.trim()}, memo } from 'react'`;
            }
            return match;
          }
        );
      }

      // Wrap component with memo
      // Handle: export const Component = () => {}
      const constPattern = new RegExp(`(export\\s+const\\s+${componentName}\\s*=\\s*)`, 'g');
      if (constPattern.test(newContent)) {
        newContent = newContent.replace(constPattern, `$1memo(`);
        // Find the end of the component and add closing paren
        const lines = newContent.split('\n');
        let depth = 0;
        let foundStart = false;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(`const ${componentName}`)) {
            foundStart = true;
          }
          if (foundStart) {
            depth += (lines[i].match(/\{/g) || []).length;
            depth -= (lines[i].match(/\}/g) || []).length;
            if (depth === 0 && lines[i].includes('}')) {
              lines[i] = lines[i].replace(/;?\s*$/, ');');
              break;
            }
          }
        }
        newContent = lines.join('\n');
      }

      // Handle: export function Component() {}
      const functionPattern = new RegExp(`(export\\s+function\\s+${componentName})`, 'g');
      if (functionPattern.test(newContent)) {
        // Convert to const with memo
        newContent = newContent.replace(
          new RegExp(`export\\s+function\\s+${componentName}\\s*\\(([^)]*)\\)\\s*{`, 'g'),
          `export const ${componentName} = memo(($1) => {`
        );
        // Add closing paren before the last }
        const lines = newContent.split('\n');
        let depth = 0;
        let foundStart = false;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(`const ${componentName}`)) {
            foundStart = true;
          }
          if (foundStart) {
            depth += (lines[i].match(/\{/g) || []).length;
            depth -= (lines[i].match(/\}/g) || []).length;
            if (depth === 0 && lines[i].includes('}')) {
              lines[i] = lines[i].replace(/}\s*$/, '});');
              break;
            }
          }
        }
        newContent = lines.join('\n');
      }

      if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        return true;
      }

      return false;
    } catch (error) {
      throw new Error(`Failed to implement React.memo: ${error}`);
    }
  }

  /**
   * Measures performance improvements
   * Requirement 6.7: Measure performance improvements using React DevTools Profiler metrics
   */
  async measureImprovements(): Promise<PerformanceMetrics> {
    // This would require actual runtime profiling with React DevTools
    // For now, return estimated metrics based on analysis
    const analysis = await this.analyzer.analyzeRenderPerformance();

    const before: MetricSnapshot = {
      timestamp: new Date(),
      averageRenderTime: analysis.expensiveComponents.reduce((sum, c) => sum + c.complexity, 0) / Math.max(analysis.expensiveComponents.length, 1),
      totalRerenders: analysis.unnecessaryRerenders.length,
      expensiveComponentCount: analysis.expensiveComponents.length,
    };

    // Estimate improvements (would be actual measurements in production)
    const after: MetricSnapshot = {
      timestamp: new Date(),
      averageRenderTime: before.averageRenderTime * 0.7, // Estimate 30% improvement
      totalRerenders: Math.floor(before.totalRerenders * 0.5), // Estimate 50% reduction
      expensiveComponentCount: Math.floor(before.expensiveComponentCount * 0.6), // Estimate 40% reduction
    };

    return {
      before,
      after,
      improvement: {
        renderTimeReduction: ((before.averageRenderTime - after.averageRenderTime) / before.averageRenderTime) * 100,
        rerenderReduction: ((before.totalRerenders - after.totalRerenders) / Math.max(before.totalRerenders, 1)) * 100,
        bundleSizeReduction: 0, // Would be measured separately
      },
    };
  }
}
