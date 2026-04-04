/**
 * Circular Dependency Detector
 * 
 * Detects circular dependencies in the codebase and provides visualization
 * and resolution suggestions.
 */

import * as fs from 'fs/promises';
import { DependencyGraph, CircularDependency } from './Phase6Analyzer.js';

export interface CircularDependencyReport {
  cycles: CircularDependency[];
  totalCycles: number;
  highSeverity: number;
  mediumSeverity: number;
  lowSeverity: number;
  affectedFiles: Set<string>;
  suggestions: ResolutionSuggestion[];
}

export interface ResolutionSuggestion {
  cycle: string[];
  suggestion: string;
  strategy: 'extract-interface' | 'move-to-shared' | 'invert-dependency' | 'merge-modules';
}

export class CircularDependencyDetector {
  private graph: DependencyGraph;

  constructor(graph: DependencyGraph) {
    this.graph = graph;
  }

  /**
   * Detect all circular dependencies using Tarjan's algorithm
   */
  detectCycles(): CircularDependency[] {
    const cycles: CircularDependency[] = [];
    const visited = new Set<string>();
    const recursionStack: string[] = [];
    const stackSet = new Set<string>();

    const dfs = (nodeId: string): void => {
      visited.add(nodeId);
      recursionStack.push(nodeId);
      stackSet.add(nodeId);

      // Get all outgoing edges
      const edges = this.graph.edges.filter(e => e.from === nodeId);
      
      for (const edge of edges) {
        const targetNode = this.graph.nodes.get(edge.to);
        if (!targetNode) continue;

        if (!visited.has(edge.to)) {
          dfs(edge.to);
        } else if (stackSet.has(edge.to)) {
          // Found a cycle
          const cycleStartIndex = recursionStack.indexOf(edge.to);
          const cycle = recursionStack.slice(cycleStartIndex);
          
          // Determine severity based on cycle length
          let severity: 'low' | 'medium' | 'high';
          if (cycle.length <= 2) {
            severity = 'high'; // Direct circular dependency
          } else if (cycle.length <= 4) {
            severity = 'medium';
          } else {
            severity = 'low';
          }

          cycles.push({ cycle, severity });
        }
      }

      recursionStack.pop();
      stackSet.delete(nodeId);
    };

    // Run DFS from each unvisited node
    for (const nodeId of this.graph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        dfs(nodeId);
      }
    }

    return this.deduplicateCycles(cycles);
  }

  /**
   * Remove duplicate cycles (same cycle in different order)
   */
  private deduplicateCycles(cycles: CircularDependency[]): CircularDependency[] {
    const seen = new Set<string>();
    const unique: CircularDependency[] = [];

    for (const cycle of cycles) {
      // Normalize cycle by sorting and creating a signature
      const sorted = [...cycle.cycle].sort();
      const signature = sorted.join('->');

      if (!seen.has(signature)) {
        seen.add(signature);
        unique.push(cycle);
      }
    }

    return unique;
  }

  /**
   * Generate comprehensive circular dependency report
   */
  generateReport(): CircularDependencyReport {
    const cycles = this.detectCycles();
    const affectedFiles = new Set<string>();
    
    let highSeverity = 0;
    let mediumSeverity = 0;
    let lowSeverity = 0;

    for (const cycle of cycles) {
      cycle.cycle.forEach(file => affectedFiles.add(file));
      
      if (cycle.severity === 'high') highSeverity++;
      else if (cycle.severity === 'medium') mediumSeverity++;
      else lowSeverity++;
    }

    const suggestions = this.generateSuggestions(cycles);

    return {
      cycles,
      totalCycles: cycles.length,
      highSeverity,
      mediumSeverity,
      lowSeverity,
      affectedFiles,
      suggestions
    };
  }

  /**
   * Generate resolution suggestions for circular dependencies
   */
  private generateSuggestions(cycles: CircularDependency[]): ResolutionSuggestion[] {
    const suggestions: ResolutionSuggestion[] = [];

    for (const cycle of cycles) {
      if (cycle.cycle.length === 2) {
        // Direct circular dependency - suggest extracting interface
        suggestions.push({
          cycle: cycle.cycle,
          suggestion: 'Extract shared interface or type to break the cycle',
          strategy: 'extract-interface'
        });
      } else if (cycle.cycle.length === 3) {
        // Three-way cycle - suggest moving common code to shared
        suggestions.push({
          cycle: cycle.cycle,
          suggestion: 'Move shared functionality to shared/ layer',
          strategy: 'move-to-shared'
        });
      } else if (cycle.cycle.length <= 5) {
        // Medium cycle - suggest inverting dependency
        suggestions.push({
          cycle: cycle.cycle,
          suggestion: 'Invert dependency direction using dependency injection',
          strategy: 'invert-dependency'
        });
      } else {
        // Large cycle - suggest merging modules
        suggestions.push({
          cycle: cycle.cycle,
          suggestion: 'Consider merging these modules into a single feature',
          strategy: 'merge-modules'
        });
      }
    }

    return suggestions;
  }

  /**
   * Generate Mermaid diagram for visualization
   */
  generateMermaidDiagram(cycles: CircularDependency[]): string {
    let diagram = 'graph TD\n';

    for (let i = 0; i < cycles.length; i++) {
      const cycle = cycles[i];
      const color = cycle.severity === 'high' ? 'red' : 
                    cycle.severity === 'medium' ? 'orange' : 'yellow';

      for (let j = 0; j < cycle.cycle.length; j++) {
        const from = cycle.cycle[j];
        const to = cycle.cycle[(j + 1) % cycle.cycle.length];
        
        const fromId = this.sanitizeId(from);
        const toId = this.sanitizeId(to);
        
        diagram += `  ${fromId}["${this.shortenPath(from)}"] -->|cycle ${i + 1}| ${toId}["${this.shortenPath(to)}"]\n`;
      }
      
      diagram += `  style ${this.sanitizeId(cycle.cycle[0])} fill:${color}\n`;
    }

    return diagram;
  }

  /**
   * Sanitize file path for Mermaid ID
   */
  private sanitizeId(filePath: string): string {
    return filePath.replace(/[^a-zA-Z0-9]/g, '_');
  }

  /**
   * Shorten file path for display
   */
  private shortenPath(filePath: string): string {
    const parts = filePath.split('/');
    if (parts.length > 3) {
      return '...' + parts.slice(-2).join('/');
    }
    return filePath;
  }

  /**
   * Save report to file
   */
  async saveReport(outputPath: string): Promise<void> {
    const report = this.generateReport();
    
    const output = {
      summary: {
        totalCycles: report.totalCycles,
        highSeverity: report.highSeverity,
        mediumSeverity: report.mediumSeverity,
        lowSeverity: report.lowSeverity,
        affectedFiles: Array.from(report.affectedFiles)
      },
      cycles: report.cycles.map((cycle, i) => ({
        id: i + 1,
        severity: cycle.severity,
        files: cycle.cycle,
        suggestion: report.suggestions[i]
      })),
      visualization: this.generateMermaidDiagram(report.cycles)
    };

    await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
    console.log(`🔄 Circular dependency report saved: ${outputPath}`);
  }
}
