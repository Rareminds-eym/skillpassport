/**
 * Types and interfaces for FSD Phase 6 Entity Migration System
 * 
 * This module defines TypeScript interfaces for entity migration components
 * including EntityMigrator, entity analysis, and validation systems.
 */

// ============================================================================
// Core Entity Migration Interfaces
// ============================================================================

/**
 * EntityMigrator - Handles extraction and organization of business entities
 */
export interface EntityMigrator {
  analyzeEntities(): Promise<EntityAnalysis[]>
  migrateEntity(entity: EntityDefinition): Promise<MigrationResult>
  validateEntityStructure(entityPath: string): Promise<ValidationResult>
  updateImportPaths(entity: string, oldPaths: string[], newPaths: string[]): Promise<void>
}

/**
 * EntityDefinition - Complete definition of a business entity
 */
export interface EntityDefinition {
  name: string
  type: EntityType
  sourceFiles: string[]
  models: ModelFile[]
  uiComponents: ComponentFile[]
  apiMethods: ApiFile[]
  relationships: EntityRelationship[]
}

/**
 * EntityAnalysis - Analysis result for an entity
 */
export interface EntityAnalysis {
  entity: string
  type: EntityType
  complexity: 'simple' | 'moderate' | 'complex'
  dependencies: string[]
  usageCount: number
  migrationRisk: 'low' | 'medium' | 'high'
  sourceLocations: SourceLocation[]
  estimatedEffort: 'small' | 'medium' | 'large'
}

/**
 * Business entity types in the system
 */
export type EntityType = 
  | 'User' 
  | 'Student' 
  | 'Educator' 
  | 'Recruiter' 
  | 'Admin' 
  | 'Course' 
  | 'Organization' 
  | 'Subscription' 
  | 'Message' 
  | 'Assessment' 
  | 'Project' 
  | 'Certificate'

// ============================================================================
// Entity Structure Models
// ============================================================================

/**
 * ModelFile - Entity model/types file information
 */
export interface ModelFile {
  path: string
  interfaces: TypeInterface[]
  validationRules: ValidationRule[]
  businessLogic: BusinessLogicMethod[]
  utilities: UtilityFunction[]
}

/**
 * ComponentFile - Entity UI component information
 */
export interface ComponentFile {
  path: string
  componentName: string
  componentType: 'Card' | 'Form' | 'List' | 'Detail' | 'Other'
  props: ComponentProp[]
  dependencies: string[]
  usesEntity: boolean
}

/**
 * ApiFile - Entity API methods information
 */
export interface ApiFile {
  path: string
  queries: ApiMethod[]
  mutations: ApiMethod[]
  dependencies: string[]
}

/**
 * TypeInterface - TypeScript interface definition
 */
export interface TypeInterface {
  name: string
  properties: InterfaceProperty[]
  extends: string[]
  exported: boolean
  lineNumber: number
}

/**
 * InterfaceProperty - Property within an interface
 */
export interface InterfaceProperty {
  name: string
  type: string
  optional: boolean
  description?: string
}

/**
 * ValidationRule - Entity validation rule
 */
export interface ValidationRule {
  field: string
  rule: string
  message: string
  validator: string
}

/**
 * BusinessLogicMethod - Entity business logic method
 */
export interface BusinessLogicMethod {
  name: string
  signature: string
  purpose: string
  dependencies: string[]
}

/**
 * UtilityFunction - Entity utility function
 */
export interface UtilityFunction {
  name: string
  signature: string
  purpose: string
  isExported: boolean
}

/**
 * ComponentProp - React component prop definition
 */
export interface ComponentProp {
  name: string
  type: string
  required: boolean
  defaultValue?: string
}

/**
 * ApiMethod - API query or mutation method
 */
export interface ApiMethod {
  name: string
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  endpoint: string
  requestType?: string
  responseType: string
  isAsync: boolean
}

// ============================================================================
// Entity Relationships
// ============================================================================

/**
 * EntityRelationship - Relationship between entities
 */
export interface EntityRelationship {
  type: RelationshipType
  target: string
  foreignKey?: string
  description: string
  cardinality: Cardinality
  bidirectional: boolean
}

/**
 * Relationship types between entities
 */
export type RelationshipType = 
  | 'one-to-one' 
  | 'one-to-many'
  | 'many-to-one'
  | 'many-to-many' 
  | 'composition' 
  | 'aggregation'

/**
 * Cardinality notation
 */
export type Cardinality = '1:1' | '1:N' | 'N:1' | 'N:M'

// ============================================================================
// Migration Results
// ============================================================================

/**
 * MigrationResult - Result of entity migration
 */
export interface MigrationResult {
  success: boolean
  entity: string
  filesCreated: string[]
  filesModified: string[]
  filesDeleted: string[]
  importPathsUpdated: ImportPathUpdate[]
  backwardCompatibility: BackwardCompatibilityInfo
  errors: MigrationError[]
  warnings: string[]
  duration: number
  timestamp: Date
}

/**
 * ImportPathUpdate - Details of import path update
 */
export interface ImportPathUpdate {
  filePath: string
  oldImport: string
  newImport: string
  lineNumber: number
  success: boolean
  error?: string
}

/**
 * BackwardCompatibilityInfo - Backward compatibility information
 */
export interface BackwardCompatibilityInfo {
  reExportsCreated: string[]
  deprecationNotices: string[]
  breakingChanges: string[]
  migrationGuide: string
}

/**
 * MigrationError - Error during entity migration
 */
export interface MigrationError {
  code: string
  message: string
  file?: string
  line?: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'analysis' | 'structure' | 'migration' | 'validation'
  suggestion?: string
}

// ============================================================================
// Validation
// ============================================================================

/**
 * ValidationResult - Entity structure validation result
 */
export interface ValidationResult {
  valid: boolean
  entityPath: string
  checks: ValidationCheck[]
  errors: ValidationError[]
  warnings: string[]
  summary: ValidationSummary
}

/**
 * ValidationCheck - Individual validation check
 */
export interface ValidationCheck {
  name: string
  passed: boolean
  message: string
  severity: 'error' | 'warning' | 'info'
}

/**
 * ValidationError - Validation error details
 */
export interface ValidationError {
  type: 'structure' | 'imports' | 'types' | 'exports'
  message: string
  file?: string
  suggestion?: string
}

/**
 * ValidationSummary - Summary of validation results
 */
export interface ValidationSummary {
  totalChecks: number
  passedChecks: number
  failedChecks: number
  warningCount: number
  errorCount: number
}

// ============================================================================
// Entity Analysis
// ============================================================================

/**
 * SourceLocation - Location of entity-related code
 */
export interface SourceLocation {
  filePath: string
  category: 'model' | 'ui' | 'api' | 'utility'
  lineCount: number
  complexity: number
}

/**
 * EntityScanner - Scans codebase for entity-related code
 */
export interface EntityScanner {
  scanForEntities(): Promise<EntityCandidate[]>
  analyzeEntityUsage(entity: string): Promise<UsageAnalysis>
  identifyEntityFiles(entity: string): Promise<SourceLocation[]>
  extractEntityInterfaces(files: string[]): Promise<TypeInterface[]>
}

/**
 * EntityCandidate - Potential entity identified in codebase
 */
export interface EntityCandidate {
  name: string
  confidence: number
  sourceFiles: string[]
  indicators: EntityIndicator[]
  suggestedType: EntityType | null
}

/**
 * EntityIndicator - Indicator that suggests entity presence
 */
export interface EntityIndicator {
  type: 'interface' | 'type' | 'component' | 'api' | 'store'
  name: string
  filePath: string
  confidence: number
}

/**
 * UsageAnalysis - Analysis of entity usage across codebase
 */
export interface UsageAnalysis {
  entity: string
  totalReferences: number
  referencesByFile: Map<string, number>
  referencesByFeature: Map<string, number>
  criticalPaths: string[]
  migrationImpact: 'low' | 'medium' | 'high'
}

// ============================================================================
// Entity Directory Structure
// ============================================================================

/**
 * EntityStructure - Standard entity directory structure
 */
export interface EntityStructure {
  entityName: string
  basePath: string
  directories: EntityDirectory[]
  files: EntityFile[]
}

/**
 * EntityDirectory - Directory within entity structure
 */
export interface EntityDirectory {
  name: 'model' | 'ui' | 'api'
  path: string
  files: string[]
}

/**
 * EntityFile - File within entity structure
 */
export interface EntityFile {
  name: string
  path: string
  type: 'index' | 'types' | 'validation' | 'utils' | 'component' | 'queries' | 'mutations'
  content?: string
}

// ============================================================================
// Relationship Analysis
// ============================================================================

/**
 * RelationshipAnalyzer - Analyzes relationships between entities
 */
export interface RelationshipAnalyzer {
  analyzeRelationships(entities: EntityDefinition[]): Promise<RelationshipGraph>
  identifyRelationship(entity1: string, entity2: string): Promise<EntityRelationship | null>
  validateRelationships(relationships: EntityRelationship[]): Promise<RelationshipValidation>
  generateRelationshipDiagram(graph: RelationshipGraph): Promise<string>
}

/**
 * RelationshipGraph - Graph of entity relationships
 */
export interface RelationshipGraph {
  entities: string[]
  relationships: EntityRelationship[]
  clusters: EntityCluster[]
  orphans: string[]
}

/**
 * EntityCluster - Group of related entities
 */
export interface EntityCluster {
  name: string
  entities: string[]
  relationships: EntityRelationship[]
  cohesion: number
}

/**
 * RelationshipValidation - Validation of entity relationships
 */
export interface RelationshipValidation {
  valid: boolean
  circularReferences: CircularReference[]
  missingEntities: string[]
  invalidRelationships: InvalidRelationship[]
  warnings: string[]
}

/**
 * CircularReference - Circular reference between entities
 */
export interface CircularReference {
  cycle: string[]
  severity: 'low' | 'medium' | 'high'
  suggestion: string
}

/**
 * InvalidRelationship - Invalid relationship definition
 */
export interface InvalidRelationship {
  from: string
  to: string
  reason: string
  suggestion: string
}
