/**
 * Phase 6 Analysis Tools
 * 
 * Export all Phase 6 analysis components
 */

export { 
  Phase6Analyzer,
  type FileClassification,
  type DependencyGraph,
  type DependencyNode,
  type DependencyEdge,
  type CircularDependency,
  type AnalysisReport,
  type FileType,
  type FSDLayer
} from './Phase6Analyzer.js';

export {
  CircularDependencyDetector,
  type CircularDependencyReport,
  type ResolutionSuggestion
} from './CircularDependencyDetector.js';

export {
  MigrationPlanner,
  type MigrationBatch,
  type MigrationPlan
} from './MigrationPlanner.js';
