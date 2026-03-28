/**
 * Migration Planning System
 * 
 * Groups files into migration batches based on dependency order and
 * identifies files that can be migrated in parallel.
 */

import { FileClassification, DependencyGraph } from './Phase6Analyzer.js';

export interface MigrationBatch {
  id: number;
  files: string[];
  dependencies: string[];
  canRunInParallel: boolean;
  estimatedDuration: number;
  priority: 'high' | 'medium' | 'low';
}

export interface MigrationPlan {
  batches: MigrationBatch[];
  totalFiles: number;
  estimatedTotalDuration: number;
  parallelBatches: number;
  sequentialBatches: number;
}

export class MigrationPlanner {
  private classifications: FileClassification[];
  private dependencyGraph: DependencyGraph;

  constructor(classifications: FileClassification[], dependencyGraph: DependencyGraph) {
    this.classifications = classifications;
    this.dependencyGraph = dependencyGraph;
  }

  /**
   * Create migration execution plan
   */
  createPlan(): MigrationPlan {
    // Step 1: Topologically sort files by dependencies
    const sortedFiles = this.topologicalSort();

    // Step 2: Group into batches
    const batches = this.createBatches(sortedFiles);

    // Step 3: Identify parallel opportunities
    this.identifyParallelBatches(batches);

    // Step 4: Calculate estimates
    const totalFiles = this.classifications.length;
    const estimatedTotalDuration = batches.reduce((sum, b) => sum + b.estimatedDuration, 0);
    const parallelBatches = batches.filter(b => b.canRunInParallel).length;
    const sequentialBatches = batches.length - parallelBatches;

    return {
      batches,
      totalFiles,
      estimatedTotalDuration,
      parallelBatches,
      sequentialBatches
    };
  }

  /**
   * Topologically sort files by dependencies
   */
  private topologicalSort(): string[] {
    const sorted: string[] = [];
    const visited = new Set<string>();
    const temp = new Set<string>();

    const visit = (nodeId: string): void => {
      if (temp.has(nodeId)) {
        // Circular dependency - skip for now
        return;
      }
      if (visited.has(nodeId)) {
        return;
      }

      temp.add(nodeId);

      // Visit dependencies first
      const edges = this.dependencyGraph.edges.filter(e => e.from === nodeId);
      for (const edge of edges) {
        if (this.dependencyGraph.nodes.has(edge.to)) {
          visit(edge.to);
        }
      }

      temp.delete(nodeId);
      visited.add(nodeId);
      sorted.push(nodeId);
    };

    // Visit all nodes
    for (const nodeId of this.dependencyGraph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        visit(nodeId);
      }
    }

    return sorted;
  }

  /**
   * Create migration batches
   */
  private createBatches(sortedFiles: string[]): MigrationBatch[] {
    const batches: MigrationBatch[] = [];
    const batchSize = 50; // Files per batch

    for (let i = 0; i < sortedFiles.length; i += batchSize) {
      const batchFiles = sortedFiles.slice(i, i + batchSize);
      const dependencies = this.getBatchDependencies(batchFiles);

      batches.push({
        id: batches.length + 1,
        files: batchFiles,
        dependencies,
        canRunInParallel: false, // Will be determined later
        estimatedDuration: this.estimateBatchDuration(batchFiles),
        priority: this.determinePriority(batchFiles)
      });
    }

    return batches;
  }

  /**
   * Get all dependencies for a batch
   */
  private getBatchDependencies(files: string[]): string[] {
    const deps = new Set<string>();

    for (const file of files) {
      const edges = this.dependencyGraph.edges.filter(e => e.from === file);
      for (const edge of edges) {
        if (!files.includes(edge.to)) {
          deps.add(edge.to);
        }
      }
    }

    return Array.from(deps);
  }

  /**
   * Identify batches that can run in parallel
   */
  private identifyParallelBatches(batches: MigrationBatch[]): void {
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      
      // Check if this batch has dependencies on previous batches
      const hasDependencies = batch.dependencies.some(dep =>
        batches.slice(0, i).some(prevBatch => prevBatch.files.includes(dep))
      );

      // If no dependencies on previous batches, can run in parallel
      batch.canRunInParallel = !hasDependencies;
    }
  }

  /**
   * Estimate batch duration (in minutes)
   */
  private estimateBatchDuration(files: string[]): number {
    // Rough estimate: 30 seconds per file
    return Math.ceil(files.length * 0.5);
  }

  /**
   * Determine batch priority
   */
  private determinePriority(files: string[]): 'high' | 'medium' | 'low' {
    // High priority: infrastructure files (config, routes, layouts)
    const hasInfrastructure = files.some(f => 
      f.includes('/config/') || 
      f.includes('/routes/') || 
      f.includes('/layouts/')
    );
    if (hasInfrastructure) return 'high';

    // Medium priority: services and hooks
    const hasServices = files.some(f => 
      f.includes('/services/') || 
      f.includes('/hooks/')
    );
    if (hasServices) return 'medium';

    // Low priority: components and utilities
    return 'low';
  }

  /**
   * Get files that can be migrated in parallel
   */
  getParallelMigrationGroups(): string[][] {
    const groups: string[][] = [];
    const processed = new Set<string>();

    for (const classification of this.classifications) {
      if (processed.has(classification.sourceFile)) continue;

      // Find all files with no dependencies on unprocessed files
      const group: string[] = [];
      
      for (const c of this.classifications) {
        if (processed.has(c.sourceFile)) continue;

        const deps = this.dependencyGraph.edges
          .filter(e => e.from === c.sourceFile)
          .map(e => e.to);

        const hasUnprocessedDeps = deps.some(dep => !processed.has(dep));
        
        if (!hasUnprocessedDeps) {
          group.push(c.sourceFile);
          processed.add(c.sourceFile);
        }
      }

      if (group.length > 0) {
        groups.push(group);
      }
    }

    return groups;
  }
}
