/**
 * Widget Migration System - Public API
 * 
 * Exports all widget migration components for FSD Phase 6
 */

export { WidgetMigrator } from './WidgetMigrator'
export { WidgetAnalyzer } from './WidgetAnalyzer'
export { CompositionAnalyzer } from './CompositionAnalyzer'
export { WidgetScanner } from './WidgetScanner'

export type {
  WidgetMigrator as IWidgetMigrator,
  WidgetCandidate,
  WidgetDefinition,
  CompositionAnalysis,
  MigrationResult,
  ValidationResult,
  WidgetStructure,
  WidgetComplexityAssessment,
  CompositionPattern,
  DataFlowPattern,
  PropDrillingAnalysis,
  ContextUsagePattern
} from '@/shared/types/widget-migration'
