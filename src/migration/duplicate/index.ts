/**
 * Duplicate Code Consolidation System
 * Public API exports
 */

export { DuplicateScanner } from './DuplicateScanner';
export { SemanticAnalyzer } from './SemanticAnalyzer';
export { ConsolidationStrategy } from './ConsolidationStrategy';
export { DuplicateConsolidator } from './DuplicateConsolidator';

export type {
  DuplicateGroup,
  CodeBlock,
  SemanticAnalysis,
  ConsolidationResult,
  ImportPathUpdate,
  DuplicateScanResult,
  ConsolidationReport,
  FSDLayerRules,
} from '@/features/student-profile/model';
