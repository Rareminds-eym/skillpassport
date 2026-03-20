/**
 * Entity Migration System - Public API
 * 
 * Exports all entity migration components for FSD Phase 6
 */

export { EntityMigrator } from './EntityMigrator'
export { EntityScanner } from './EntityScanner'
export { EntityAnalyzer } from './EntityAnalyzer'
export { EntityValidator } from './EntityValidator'
export { RelationshipAnalyzer } from './RelationshipAnalyzer'

// Export relationship analysis functions (Requirements 16.2, 16.6, 16.7, 16.8)
export {
  analyzeEntityRelationships,
  validateEntityRelationships,
  getSharedEntityTypes
} from './analyzeRelationships'

// Re-export types
export type {
  EntityMigrator as IEntityMigrator,
  EntityScanner as IEntityScanner,
  RelationshipAnalyzer as IRelationshipAnalyzer,
  EntityDefinition,
  EntityAnalysis,
  EntityCandidate,
  MigrationResult,
  ValidationResult,
  UsageAnalysis,
  EntityType,
  EntityStructure,
  SourceLocation,
  EntityRelationship,
  RelationshipGraph,
  RelationshipValidation
} from '../types/entity-migration'
