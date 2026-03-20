/**
 * Types and interfaces for FSD Phase 6 Widget Migration System
 */

// ============================================================================
// Core Widget Migration Interfaces
// ============================================================================

export interface WidgetMigrator {
  identifyWidgets(): Promise<WidgetCandidate[]>
  analyzeComposition(component: string): Promise<CompositionAnalysis>
  migrateWidget(widget: WidgetDefinition): Promise<MigrationResult>
  validateWidgetDependencies(widgetPath: string): Promise<ValidationResult>
}

export interface WidgetDefinition {
  name: string
  type: WidgetType
  sourceFile: string
  featureDependencies: string[]
  entityDependencies: string[]
  sharedDependencies: string[]
  stateManagement: StateManagementType
  internalComponents: string[]
}

export interface WidgetCandidate {
  name: string
  sourceFile: string
  featureDependencies: string[]
  entityDependencies: string[]
  complexity: number
  isComposite: boolean
  migrationPriority: 'high' | 'medium' | 'low'
}

export type WidgetType = 'Dashboard' | 'Navigation' | 'Form' | 'DataTable' | 'Layout' | 'Modal'

export type StateManagementType = 'local' | 'context' | 'zustand' | 'none'

// ============================================================================
// Composition Analysis
// ============================================================================

export interface CompositionAnalysis {
  features: string[]
  entities: string[]
  sharedComponents: string[]
  stateManagement: StateManagementType
  migrationStrategy: 'direct' | 'refactor' | 'split'
  complexity: number
}

// ============================================================================
// Widget Structure
// ============================================================================

export interface WidgetStructure {
  widgetName: string
  basePath: string
  directories: WidgetDirectory[]
  files: WidgetFile[]
}

export interface WidgetDirectory {
  name: 'ui' | 'model'
  path: string
  files: string[]
}

export interface WidgetFile {
  name: string
  path: string
  type: 'index' | 'types' | 'store' | 'component'
  content?: string
}

// ============================================================================
// Migration Results
// ============================================================================

export interface MigrationResult {
  success: boolean
  widget: string
  filesCreated: string[]
  filesModified: string[]
  filesDeleted: string[]
  importPathsUpdated: ImportPathUpdate[]
  errors: MigrationError[]
  warnings: string[]
  duration: number
  timestamp: Date
}

export interface ImportPathUpdate {
  filePath: string
  oldImport: string
  newImport: string
  lineNumber: number
  success: boolean
  error?: string
}

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

export interface ValidationResult {
  valid: boolean
  widgetPath: string
  checks: ValidationCheck[]
  errors: ValidationError[]
  warnings: string[]
  summary: ValidationSummary
}

export interface ValidationCheck {
  name: string
  passed: boolean
  message: string
  severity: 'error' | 'warning' | 'info'
}

export interface ValidationError {
  type: 'structure' | 'imports' | 'dependencies' | 'exports'
  message: string
  file?: string
  suggestion?: string
}

export interface ValidationSummary {
  totalChecks: number
  passedChecks: number
  failedChecks: number
  warningCount: number
  errorCount: number
}
