/**
 * Core types and interfaces for the FSD Phase 5 Service API Migration system
 * 
 * This module defines the TypeScript interfaces for all migration system components
 * including APIAnalyzer, MigrationEngine, StoreIntegrator, and related data models.
 */

// ============================================================================
// Core Migration System Interfaces
// ============================================================================

/**
 * APIAnalyzer - Scans /services/ directory, extracts API functions, maps to features
 */
export interface APIAnalyzer {
  scanServices(): Promise<ServiceFile[]>
  extractFunctions(file: ServiceFile): Promise<APIFunction[]>
  mapToFeatures(functions: APIFunction[]): Promise<FeatureMapping[]>
  identifyDependencies(functions: APIFunction[]): Promise<DependencyGraph>
}

/**
 * MigrationEngine - Handles file movement, import path updates, validation
 */
export interface MigrationEngine {
  migrateFeatureAPIs(mapping: FeatureMapping[]): Promise<MigrationResult>
  migrateSharedAPIs(sharedFunctions: APIFunction[]): Promise<MigrationResult>
  updateImportPaths(changes: PathChange[]): Promise<UpdateResult>
  validateMigration(): Promise<ValidationResult>
}

/**
 * StoreIntegrator - Connects APIs with Zustand stores from Phase 4
 */
export interface StoreIntegrator {
  identifyStoreActions(apiFunction: APIFunction): Promise<StoreAction[]>
  integrateWithStore(apiFunction: APIFunction, store: ZustandStore): Promise<Integration>
  validateStoreIntegration(integration: Integration): Promise<boolean>
}

// ============================================================================
// Data Models - Service Files and API Functions
// ============================================================================

/**
 * ServiceFile - Represents a file in the /services/ directory
 */
export interface ServiceFile {
  path: string
  name: string
  functions: APIFunction[]
  dependencies: string[]
  exports: ExportDeclaration[]
  size?: number
  lastModified?: Date
  content?: string
  isEmpty?: boolean
  isSharedUtility?: boolean
}

/**
 * APIFunction - Represents an API function within a service file
 */
export interface APIFunction {
  name: string
  signature: string
  feature: string | null
  isShared: boolean
  dependencies: string[]
  usageCount: number
  storeIntegrations: StoreIntegration[]
  sourceFile: string
  lineNumber: number
  isAsync: boolean
  returnType: string
  parameters: FunctionParameter[]
}

/**
 * Function parameter information
 */
export interface FunctionParameter {
  name: string
  type: string
  optional: boolean
  defaultValue?: string
}

/**
 * Export declaration information
 */
export interface ExportDeclaration {
  name: string
  type: 'function' | 'class' | 'interface' | 'type' | 'const' | 'default'
  isDefault: boolean
}

// ============================================================================
// Feature Mapping and Dependencies
// ============================================================================

/**
 * FeatureMapping - Maps API functions to FSD features
 */
export interface FeatureMapping {
  feature: string
  functions: APIFunction[]
  targetPath: string
  storeIntegrations: StoreIntegration[]
  confidence: number
}

/**
 * DependencyGraph - Represents dependencies between API functions
 */
export interface DependencyGraph {
  nodes: DependencyNode[]
  edges: DependencyEdge[]
  circularDependencies: CircularDependency[]
}

/**
 * Individual dependency node
 */
export interface DependencyNode {
  id: string
  functionName: string
  filePath: string
  type: 'api' | 'utility' | 'shared'
}

/**
 * Dependency relationship between nodes
 */
export interface DependencyEdge {
  from: string
  to: string
  type: 'import' | 'call' | 'reference'
  strength: number
}

/**
 * Circular dependency information
 */
export interface CircularDependency {
  cycle: string[]
  severity: 'low' | 'medium' | 'high'
  suggestion: string
}

// ============================================================================
// Store Integration Models
// ============================================================================

/**
 * StoreIntegration - Defines how an API function integrates with Zustand stores
 */
export interface StoreIntegration {
  storeName: string
  actions: string[]
  selectors: string[]
  integrationPattern: 'direct' | 'event-driven' | 'callback'
}

/**
 * ZustandStore - Represents a Zustand store from Phase 4
 */
export interface ZustandStore {
  name: string
  path: string
  actions: StoreAction[]
  selectors: StoreSelector[]
  state: StateDefinition
}

/**
 * Store action definition
 */
export interface StoreAction {
  name: string
  parameters: FunctionParameter[]
  returnType: string
  mutatesState: boolean
}

/**
 * Store selector definition
 */
export interface StoreSelector {
  name: string
  returnType: string
  dependencies: string[]
}

/**
 * State definition for a store
 */
export interface StateDefinition {
  [key: string]: {
    type: string
    optional: boolean
    defaultValue?: any
  }
}

/**
 * Integration between API function and store
 */
export interface Integration {
  apiFunction: APIFunction
  store: ZustandStore
  actions: StoreAction[]
  selectors: StoreSelector[]
  pattern: IntegrationPattern
}

/**
 * Integration pattern details
 */
export interface IntegrationPattern {
  type: 'direct' | 'event-driven' | 'callback'
  description: string
  implementation: string
}

// ============================================================================
// Migration Results and Validation
// ============================================================================

/**
 * MigrationResult - Result of a migration operation
 */
export interface MigrationResult {
  success: boolean
  migratedFiles: string[]
  updatedImports: ImportUpdate[]
  errors: MigrationError[]
  warnings: string[]
  rollbackData: RollbackData
  duration: number
  timestamp: Date
}

/**
 * ValidationResult - Result of migration validation
 */
export interface ValidationResult {
  testsPass: boolean
  endpointsAccessible: boolean
  storeIntegrationsValid: boolean
  importPathsResolved: boolean
  errors: ValidationError[]
  warnings: string[]
  summary: ValidationSummary
}

/**
 * Validation summary statistics
 */
export interface ValidationSummary {
  totalTests: number
  passedTests: number
  failedTests: number
  totalEndpoints: number
  accessibleEndpoints: number
  totalIntegrations: number
  validIntegrations: number
}

/**
 * UpdateResult - Result of import path updates
 */
export interface UpdateResult {
  success: boolean
  updatedFiles: string[]
  failedUpdates: FailedUpdate[]
  totalUpdates: number
  duration: number
}

// ============================================================================
// Path Changes and Import Updates
// ============================================================================

/**
 * PathChange - Represents a change in file path
 */
export interface PathChange {
  oldPath: string
  newPath: string
  functionName: string
  type: 'move' | 'rename' | 'create'
  affectedImports: string[]
}


/**
 * ImportUpdate - Details of an import statement update
 */
export interface ImportUpdate {
  filePath: string
  oldImport: string
  newImport: string
  lineNumber: number
  success: boolean
}

/**
 * FailedUpdate - Information about failed import updates
 */
export interface FailedUpdate {
  filePath: string
  import: string
  reason: string
  suggestion: string
}

// ============================================================================
// Error Handling and Rollback
// ============================================================================

/**
 * MigrationError - Represents an error during migration
 */
export interface MigrationError {
  code: string
  message: string
  file?: string
  line?: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'discovery' | 'classification' | 'migration' | 'validation'
  suggestion?: string
}

/**
 * ValidationError - Represents a validation error
 */
export interface ValidationError {
  type: 'test' | 'endpoint' | 'integration' | 'import'
  message: string
  details: string
  file?: string
  suggestion?: string
}

/**
 * RollbackData - Data needed for rollback operations
 */
export interface RollbackData {
  backupPath: string
  originalFiles: BackupFile[]
  changes: ChangeRecord[]
  timestamp: Date
  migrationId: string
}

/**
 * BackupFile - Information about a backed up file
 */
export interface BackupFile {
  originalPath: string
  backupPath: string
  checksum: string
  size: number
}

/**
 * ChangeRecord - Record of a change made during migration
 */
export interface ChangeRecord {
  type: 'create' | 'modify' | 'delete' | 'move'
  path: string
  oldContent?: string
  newContent?: string
  timestamp: Date
}

// ============================================================================
// Logging and Reporting
// ============================================================================

/**
 * MigrationLog - Comprehensive log of migration operations
 */
export interface MigrationLog {
  migrationId: string
  startTime: Date
  endTime?: Date
  phase: MigrationPhase
  entries: LogEntry[]
  summary: MigrationSummary
}

/**
 * Migration phases
 */
export type MigrationPhase = 
  | 'analysis' 
  | 'classification' 
  | 'migration' 
  | 'validation' 
  | 'rollback' 
  | 'complete'

/**
 * Individual log entry
 */
export interface LogEntry {
  timestamp: Date
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  context?: Record<string, any>
  file?: string
  function?: string
}

/**
 * Migration summary for reporting
 */
export interface MigrationSummary {
  totalFiles: number
  migratedFiles: number
  totalFunctions: number
  migratedFunctions: number
  sharedFunctions: number
  storeIntegrations: number
  errors: number
  warnings: number
  duration: number
}

// ============================================================================
// Configuration and Options
// ============================================================================

/**
 * MigrationConfig - Configuration options for migration
 */
export interface MigrationConfig {
  dryRun: boolean
  backupEnabled: boolean
  validateAfterMigration: boolean
  rollbackOnFailure: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  excludePatterns: string[]
  includePatterns: string[]
  featureMappings: Record<string, string>
  storeIntegrationRules: StoreIntegrationRule[]
}

/**
 * Store integration rule
 */
export interface StoreIntegrationRule {
  pattern: string
  storeName: string
  actions: string[]
  condition?: string
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Migration status
 */
export type MigrationStatus = 
  | 'pending' 
  | 'in-progress' 
  | 'completed' 
  | 'failed' 
  | 'rolled-back'

/**
 * Feature types based on FSD structure
 */
export type FeatureType = 
  | 'authentication' 
  | 'subscription' 
  | 'search' 
  | 'portfolio' 
  | 'assessment' 
  | 'courses' 
  | 'messaging' 
  | 'career-assistant' 
  | 'shared'

/**
 * API function classification
 */
export type FunctionClassification = 
  | 'feature-specific' 
  | 'shared-utility' 
  | 'cross-feature' 
  | 'legacy'
// ============================================================================
// Codebase Scanner Types
// ============================================================================

/**
 * Represents an import reference found in the codebase
 */
export interface ImportReference {
  filePath: string
  lineNumber: number
  columnNumber: number
  importStatement: string
  importPath: string
  importType: 'named' | 'default' | 'namespace' | 'side-effect'
  importedIdentifiers: string[]
  pathType: 'relative' | 'absolute'
  referencedFunction?: APIFunction
}

/**
 * Results from scanning the codebase for import references
 */
export interface ScanResult {
  references: ImportReference[]
  scannedFiles: string[]
  errorFiles: Array<{ filePath: string; error: string }>
  summary: {
    totalFiles: number
    totalReferences: number
    relativeImports: number
    absoluteImports: number
    namedImports: number
    defaultImports: number
    namespaceImports: number
  }
}

/**
 * Interface for codebase scanning functionality
 */
export interface CodebaseScanner {
  scanForImportReferences(migratedFunctions?: APIFunction[]): Promise<ScanResult>
  findServiceFileReferences(serviceFilePaths: string[]): Promise<ImportReference[]>
  filterReferencesByFunctions(references: ImportReference[], functionNames: string[]): ImportReference[]
  groupReferencesByFile(references: ImportReference[]): Map<string, ImportReference[]>
}

// API Pattern Standardization Types
export interface APIPatternStandardizer {
  standardizeNaming(functions: APIFunction[]): Promise<StandardizationResult>;
  standardizeSignatures(functions: APIFunction[]): Promise<StandardizationResult>;
  standardizeErrorHandling(functions: APIFunction[]): Promise<StandardizationResult>;
  standardizeResponseTypes(functions: APIFunction[]): Promise<StandardizationResult>;
  standardizeRequestPatterns(functions: APIFunction[]): Promise<StandardizationResult>;
  generateStandardizationReport(): StandardizationReport;
}

export interface StandardizationResult {
  success: boolean;
  standardizedFunctions: APIFunction[];
  changes: StandardizationChange[];
  errors: StandardizationError[];
  warnings: string[];
}

export interface StandardizationChange {
  functionName: string;
  changeType: 'naming' | 'signature' | 'error-handling' | 'response-type' | 'request-pattern';
  oldValue: string;
  newValue: string;
  reason: string;
  filePath: string;
}

export interface StandardizationError {
  functionName: string;
  errorType: string;
  message: string;
  filePath: string;
  suggestion?: string;
}

export interface StandardizationReport {
  totalFunctions: number;
  standardizedFunctions: number;
  changes: StandardizationChange[];
  errors: StandardizationError[];
  patterns: StandardizationPattern[];
  recommendations: string[];
}

export interface StandardizationPattern {
  patternType: 'naming' | 'signature' | 'error-handling' | 'response-type' | 'request-pattern';
  pattern: string;
  description: string;
  examples: string[];
  violations: PatternViolation[];
}

export interface PatternViolation {
  functionName: string;
  filePath: string;
  currentPattern: string;
  expectedPattern: string;
  severity: 'error' | 'warning' | 'info';
}

export interface NamingConvention {
  pattern: RegExp;
  description: string;
  examples: string[];
  replacement?: (name: string) => string;
}

export interface SignatureStandard {
  parameterOrder: string[];
  requiredParameters: string[];
  optionalParameters: string[];
  returnType: string;
  asyncPattern: boolean;
}

export interface ErrorHandlingPattern {
  pattern: 'try-catch' | 'promise-catch' | 'result-type' | 'custom';
  implementation: string;
  errorTypes: string[];
  standardResponse: string;
}

export interface ResponseTypeStandard {
  successType: string;
  errorType: string;
  dataWrapper: string;
  statusField: string;
  messageField: string;
}

export interface RequestPatternStandard {
  parameterValidation: string;
  headerStandards: Record<string, string>;
  bodyFormat: 'json' | 'form-data' | 'url-encoded';
  authenticationPattern: string;
}
// API Pattern Standardization Types
export interface APIPatternStandardizer {
  standardizeNaming(functions: APIFunction[]): Promise<StandardizationResult>;
  standardizeSignatures(functions: APIFunction[]): Promise<StandardizationResult>;
  standardizeErrorHandling(functions: APIFunction[]): Promise<StandardizationResult>;
  standardizeResponseTypes(functions: APIFunction[]): Promise<StandardizationResult>;
  standardizeRequestPatterns(functions: APIFunction[]): Promise<StandardizationResult>;
  generateStandardizationReport(): StandardizationReport;
}

export interface StandardizationResult {
  success: boolean;
  standardizedFunctions: APIFunction[];
  changes: StandardizationChange[];
  errors: StandardizationError[];
  warnings: string[];
}

export interface StandardizationChange {
  functionName: string;
  changeType: 'naming' | 'signature' | 'error-handling' | 'response-type' | 'request-pattern';
  oldValue: string;
  newValue: string;
  reason: string;
  filePath: string;
}

export interface StandardizationError {
  functionName: string;
  errorType: string;
  message: string;
  filePath: string;
  suggestion?: string;
}

export interface StandardizationReport {
  totalFunctions: number;
  standardizedFunctions: number;
  changes: StandardizationChange[];
  errors: StandardizationError[];
  patterns: StandardizationPattern[];
  recommendations: string[];
}

export interface StandardizationPattern {
  patternType: 'naming' | 'signature' | 'error-handling' | 'response-type' | 'request-pattern';
  pattern: string;
  description: string;
  examples: string[];
  violations: PatternViolation[];
}

export interface PatternViolation {
  functionName: string;
  filePath: string;
  currentPattern: string;
  expectedPattern: string;
  severity: 'error' | 'warning' | 'info';
}

export interface NamingConvention {
  pattern: RegExp;
  description: string;
  examples: string[];
  replacement?: (name: string) => string;
}

export interface SignatureStandard {
  parameterOrder: string[];
  requiredParameters: string[];
  optionalParameters: string[];
  returnType: string;
  asyncPattern: boolean;
}

export interface ErrorHandlingPattern {
  pattern: 'try-catch' | 'promise-catch' | 'result-type' | 'custom';
  implementation: string;
  errorTypes: string[];
  standardResponse: string;
}

export interface ResponseTypeStandard {
  successType: string;
  errorType: string;
  dataWrapper: string;
  statusField: string;
  messageField: string;
}

export interface RequestPatternStandard {
  parameterValidation: string;
  headerStandards: Record<string, string>;
  bodyFormat: 'json' | 'form-data' | 'url-encoded';
  authenticationPattern: string;
}
// ============================================================================
// Services Directory Cleanup Types
// ============================================================================

export interface CleanupConfig {
  projectRoot: string;
  dryRun: boolean;
  createDeprecationNotices: boolean;
  preserveSharedUtilities: boolean;
  backupBeforeCleanup: boolean;
}

export interface CleanupResult {
  success: boolean;
  removedFiles: string[];
  preservedFiles: string[];
  deprecationNotices: string[];
  errors: string[];
}

// Architectural Compliance Types
export interface ArchitecturalComplianceValidator {
  validateFSDCompliance(dependencyGraph: DependencyGraph): Promise<ComplianceResult>;
  checkCircularDependencies(dependencyGraph: DependencyGraph): CircularDependencyResult;
  validateCrossFeatureDependencies(dependencies: DependencyEdge[]): CrossFeatureDependencyResult;
  generateRefactoringRecommendations(violations: ComplianceViolation[]): RefactoringRecommendation[];
}

export interface ComplianceResult {
  isCompliant: boolean;
  violations: ComplianceViolation[];
  circularDependencies: CircularDependency[];
  crossFeatureDependencies: CrossFeatureDependencyViolation[];
  recommendations: RefactoringRecommendation[];
  summary: ComplianceSummary;
}

export interface ComplianceViolation {
  type: 'circular_dependency' | 'cross_feature_violation' | 'tight_coupling' | 'architectural_violation';
  severity: 'error' | 'warning' | 'info';
  description: string;
  affectedFiles: string[];
  affectedFunctions: string[];
  recommendation: string;
}

export interface CircularDependencyResult {
  hasCircularDependencies: boolean;
  cycles: CircularDependency[];
  affectedFeatures: string[];
}

export interface CrossFeatureDependencyViolation {
  fromFeature: string;
  toFeature: string;
  violationType: 'direct_import' | 'tight_coupling' | 'bidirectional';
  affectedFunctions: string[];
  severity: 'error' | 'warning';
  recommendation: string;
}

export interface CrossFeatureDependencyResult {
  hasViolations: boolean;
  violations: CrossFeatureDependencyViolation[];
  legitimateDependencies: LegitimateFeatureDependency[];
}

export interface LegitimateFeatureDependency {
  fromFeature: string;
  toFeature: string;
  dependencyType: 'shared_utility' | 'event_driven' | 'documented_coupling';
  justification: string;
  functions: string[];
}

export interface RefactoringRecommendation {
  type: 'extract_shared' | 'decouple_features' | 'introduce_events' | 'create_facade';
  priority: 'high' | 'medium' | 'low';
  description: string;
  affectedFiles: string[];
  affectedFunctions: string[];
  estimatedEffort: 'small' | 'medium' | 'large';
  benefits: string[];
  implementation: RefactoringImplementation;
}

export interface RefactoringImplementation {
  steps: RefactoringStep[];
  newFiles: string[];
  modifiedFiles: string[];
  deletedFiles: string[];
}

export interface RefactoringStep {
  order: number;
  description: string;
  action: 'create_file' | 'modify_file' | 'move_function' | 'update_imports';
  details: Record<string, any>;
}

export interface ComplianceSummary {
  totalViolations: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  featuresAffected: string[];
  complianceScore: number; // 0-100
  improvementAreas: string[];
}

export interface TightCouplingAnalysis {
  coupledFunctions: CoupledFunctionPair[];
  couplingScore: number;
  recommendations: RefactoringRecommendation[];
}

export interface CoupledFunctionPair {
  function1: string;
  function2: string;
  feature1: string;
  feature2: string;
  couplingType: 'data_coupling' | 'control_coupling' | 'common_coupling' | 'content_coupling';
  couplingStrength: number; // 0-1
  sharedDependencies: string[];
}

export interface FSDComplianceRules {
  allowedCrossFeatureDependencies: string[];
  sharedUtilityPatterns: string[];
  architecturalDecisions: ArchitecturalDecision[];
}

export interface ArchitecturalDecision {
  id: string;
  title: string;
  description: string;
  fromFeature: string;
  toFeature: string;
  justification: string;
  dateDecided: string;
  reviewer: string;
}
// Architectural Compliance Types
export interface ArchitecturalComplianceValidator {
  validateFSDCompliance(dependencyGraph: DependencyGraph): Promise<ComplianceResult>;
  checkCircularDependencies(dependencyGraph: DependencyGraph): CircularDependencyResult;
  validateCrossFeatureDependencies(dependencies: DependencyEdge[]): CrossFeatureDependencyResult;
  generateRefactoringRecommendations(violations: ComplianceViolation[]): RefactoringRecommendation[];
}

export interface ComplianceResult {
  isCompliant: boolean;
  violations: ComplianceViolation[];
  circularDependencies: CircularDependency[];
  crossFeatureDependencies: CrossFeatureDependencyViolation[];
  recommendations: RefactoringRecommendation[];
  summary: ComplianceSummary;
}

export interface ComplianceViolation {
  type: 'circular_dependency' | 'cross_feature_violation' | 'tight_coupling' | 'architectural_violation';
  severity: 'error' | 'warning' | 'info';
  description: string;
  affectedFiles: string[];
  affectedFunctions: string[];
  recommendation: string;
}

export interface CircularDependencyResult {
  hasCircularDependencies: boolean;
  cycles: CircularDependency[];
  affectedFeatures: string[];
}

export interface CrossFeatureDependencyViolation {
  fromFeature: string;
  toFeature: string;
  violationType: 'direct_import' | 'tight_coupling' | 'bidirectional';
  affectedFunctions: string[];
  severity: 'error' | 'warning';
  recommendation: string;
}

export interface CrossFeatureDependencyResult {
  hasViolations: boolean;
  violations: CrossFeatureDependencyViolation[];
  legitimateDependencies: LegitimateFeatureDependency[];
}

export interface LegitimateFeatureDependency {
  fromFeature: string;
  toFeature: string;
  dependencyType: 'shared_utility' | 'event_driven' | 'documented_coupling';
  justification: string;
  functions: string[];
}

export interface RefactoringRecommendation {
  type: 'extract_shared' | 'decouple_features' | 'introduce_events' | 'create_facade';
  priority: 'high' | 'medium' | 'low';
  description: string;
  affectedFiles: string[];
  affectedFunctions: string[];
  estimatedEffort: 'small' | 'medium' | 'large';
  benefits: string[];
  implementation: RefactoringImplementation;
}

export interface RefactoringImplementation {
  steps: RefactoringStep[];
  newFiles: string[];
  modifiedFiles: string[];
  deletedFiles: string[];
}

export interface RefactoringStep {
  order: number;
  description: string;
  action: 'create_file' | 'modify_file' | 'move_function' | 'update_imports';
  details: Record<string, any>;
}

export interface ComplianceSummary {
  totalViolations: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  featuresAffected: string[];
  complianceScore: number; // 0-100
  improvementAreas: string[];
}

export interface TightCouplingAnalysis {
  coupledFunctions: CoupledFunctionPair[];
  couplingScore: number;
  recommendations: RefactoringRecommendation[];
}

export interface CoupledFunctionPair {
  function1: string;
  function2: string;
  feature1: string;
  feature2: string;
  couplingType: 'data_coupling' | 'control_coupling' | 'common_coupling' | 'content_coupling';
  couplingStrength: number; // 0-1
  sharedDependencies: string[];
}

export interface FSDComplianceRules {
  allowedCrossFeatureDependencies: string[];
  sharedUtilityPatterns: string[];
  architecturalDecisions: ArchitecturalDecision[];
}

export interface ArchitecturalDecision {
  id: string;
  title: string;
  description: string;
  fromFeature: string;
  toFeature: string;
  justification: string;
  dateDecided: string;
  reviewer: string;
}

// ============================================================================
// Entity Migration Types (Phase 6)
// ============================================================================

export * from './entity-migration'

// ============================================================================
// Widget Migration Types (Phase 6)
// ============================================================================

export * from './widget-migration'
