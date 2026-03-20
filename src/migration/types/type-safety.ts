/**
 * Types and interfaces for Type Safety Validation System
 * 
 * This module defines TypeScript interfaces for comprehensive type safety
 * validation including strict mode compilation, entity interfaces, API types,
 * and Zustand store typing validation.
 */

// ============================================================================
// Core Type Safety Validation Interfaces
// ============================================================================

/**
 * TypeSafetyValidator - Main interface for type safety validation
 */
export interface TypeSafetyValidator {
  validateTypeScript(): Promise<TypeScriptValidationResult>
  validateEntityInterfaces(): Promise<EntityInterfaceValidation>
  validateAPITypes(): Promise<APITypeValidation>
  validateStoreTypes(): Promise<StoreTypeValidation>
  generateReport(): Promise<TypeSafetyReport>
}

/**
 * TypeScriptValidationResult - Result of TypeScript compilation validation
 */
export interface TypeScriptValidationResult {
  success: boolean
  errors: TypeScriptError[]
  warnings: TypeScriptWarning[]
  strictModeEnabled: boolean
  totalFiles: number
  filesWithErrors: number
  errorsByCategory: Map<ErrorCategory, number>
  duration: number
}

/**
 * TypeScriptError - TypeScript compilation error
 */
export interface TypeScriptError {
  code: number
  message: string
  file: string
  line: number
  column: number
  category: ErrorCategory
  severity: ErrorSeverity
  suggestion?: string
}

/**
 * TypeScriptWarning - TypeScript compilation warning
 */
export interface TypeScriptWarning {
  code: number
  message: string
  file: string
  line: number
  column: number
  suggestion?: string
}

/**
 * Error categories for TypeScript errors
 */
export type ErrorCategory = 
  | 'type-mismatch'
  | 'missing-type'
  | 'any-type'
  | 'implicit-any'
  | 'null-undefined'
  | 'unused-variable'
  | 'import-error'
  | 'syntax-error'
  | 'other'

/**
 * Error severity levels
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

// ============================================================================
// Entity Interface Validation
// ============================================================================

/**
 * EntityInterfaceValidation - Validation of entity interfaces
 */
export interface EntityInterfaceValidation {
  valid: boolean
  entities: EntityInterfaceCheck[]
  missingInterfaces: string[]
  incompleteInterfaces: IncompleteInterface[]
  totalEntities: number
  validEntities: number
  summary: EntityInterfaceSummary
}

/**
 * EntityInterfaceCheck - Check result for a single entity
 */
export interface EntityInterfaceCheck {
  entityName: string
  entityType: string
  hasInterface: boolean
  interfaceComplete: boolean
  interfacePath: string
  properties: PropertyCheck[]
  issues: InterfaceIssue[]
}

/**
 * PropertyCheck - Check for interface property
 */
export interface PropertyCheck {
  name: string
  hasType: boolean
  typeQuality: 'explicit' | 'inferred' | 'any' | 'unknown'
  isOptional: boolean
  isValid: boolean
}

/**
 * IncompleteInterface - Interface missing required properties
 */
export interface IncompleteInterface {
  entityName: string
  interfaceName: string
  missingProperties: string[]
  suggestion: string
}

/**
 * InterfaceIssue - Issue with entity interface
 */
export interface InterfaceIssue {
  type: 'missing-property' | 'any-type' | 'implicit-type' | 'inconsistent-naming'
  property?: string
  message: string
  severity: ErrorSeverity
  suggestion: string
}

/**
 * EntityInterfaceSummary - Summary of entity interface validation
 */
export interface EntityInterfaceSummary {
  totalEntities: number
  entitiesWithInterfaces: number
  completeInterfaces: number
  incompleteInterfaces: number
  totalIssues: number
  criticalIssues: number
}

// ============================================================================
// API Type Validation
// ============================================================================

/**
 * APITypeValidation - Validation of API function types
 */
export interface APITypeValidation {
  valid: boolean
  apiMethods: APIMethodCheck[]
  missingTypes: MissingAPIType[]
  totalMethods: number
  validMethods: number
  summary: APITypeSummary
}

/**
 * APIMethodCheck - Check result for API method
 */
export interface APIMethodCheck {
  methodName: string
  filePath: string
  hasRequestType: boolean
  hasResponseType: boolean
  requestTypeQuality: TypeQuality
  responseTypeQuality: TypeQuality
  isAsync: boolean
  issues: APITypeIssue[]
}

/**
 * MissingAPIType - API method missing type definitions
 */
export interface MissingAPIType {
  methodName: string
  filePath: string
  missingRequest: boolean
  missingResponse: boolean
  suggestion: string
}

/**
 * APITypeIssue - Issue with API type
 */
export interface APITypeIssue {
  type: 'missing-request-type' | 'missing-response-type' | 'any-type' | 'implicit-return'
  message: string
  severity: ErrorSeverity
  suggestion: string
}

/**
 * APITypeSummary - Summary of API type validation
 */
export interface APITypeSummary {
  totalMethods: number
  methodsWithTypes: number
  methodsWithRequestTypes: number
  methodsWithResponseTypes: number
  totalIssues: number
  criticalIssues: number
}

/**
 * Type quality assessment
 */
export type TypeQuality = 'explicit' | 'inferred' | 'any' | 'unknown' | 'missing'

// ============================================================================
// Zustand Store Type Validation
// ============================================================================

/**
 * StoreTypeValidation - Validation of Zustand store types
 */
export interface StoreTypeValidation {
  valid: boolean
  stores: StoreCheck[]
  missingTypes: MissingStoreType[]
  totalStores: number
  validStores: number
  summary: StoreTypeSummary
}

/**
 * StoreCheck - Check result for Zustand store
 */
export interface StoreCheck {
  storeName: string
  filePath: string
  hasStateInterface: boolean
  hasTypedSelectors: boolean
  hasTypedActions: boolean
  stateProperties: StatePropertyCheck[]
  selectors: SelectorCheck[]
  actions: ActionCheck[]
  issues: StoreTypeIssue[]
}

/**
 * StatePropertyCheck - Check for store state property
 */
export interface StatePropertyCheck {
  name: string
  hasType: boolean
  typeQuality: TypeQuality
  isValid: boolean
}

/**
 * SelectorCheck - Check for store selector
 */
export interface SelectorCheck {
  name: string
  hasReturnType: boolean
  returnTypeQuality: TypeQuality
  isValid: boolean
}

/**
 * ActionCheck - Check for store action
 */
export interface ActionCheck {
  name: string
  hasParameterTypes: boolean
  hasReturnType: boolean
  parameterTypeQuality: TypeQuality
  returnTypeQuality: TypeQuality
  isValid: boolean
}

/**
 * MissingStoreType - Store missing type definitions
 */
export interface MissingStoreType {
  storeName: string
  filePath: string
  missingStateInterface: boolean
  missingTypedSelectors: boolean
  missingTypedActions: boolean
  suggestion: string
}

/**
 * StoreTypeIssue - Issue with store type
 */
export interface StoreTypeIssue {
  type: 'missing-state-interface' | 'untyped-selector' | 'untyped-action' | 'any-type'
  element?: string
  message: string
  severity: ErrorSeverity
  suggestion: string
}

/**
 * StoreTypeSummary - Summary of store type validation
 */
export interface StoreTypeSummary {
  totalStores: number
  storesWithStateInterface: number
  storesWithTypedSelectors: number
  storesWithTypedActions: number
  totalIssues: number
  criticalIssues: number
}

// ============================================================================
// Type Safety Report
// ============================================================================

/**
 * TypeSafetyReport - Comprehensive type safety report
 */
export interface TypeSafetyReport {
  timestamp: Date
  overallValid: boolean
  typeScriptValidation: TypeScriptValidationResult
  entityInterfaceValidation: EntityInterfaceValidation
  apiTypeValidation: APITypeValidation
  storeTypeValidation: StoreTypeValidation
  summary: TypeSafetySummary
  recommendations: TypeSafetyRecommendation[]
}

/**
 * TypeSafetySummary - Overall type safety summary
 */
export interface TypeSafetySummary {
  totalErrors: number
  criticalErrors: number
  totalWarnings: number
  typeScriptErrors: number
  entityInterfaceIssues: number
  apiTypeIssues: number
  storeTypeIssues: number
  overallScore: number // 0-100
  passesQualityGate: boolean
}

/**
 * TypeSafetyRecommendation - Recommendation for improvement
 */
export interface TypeSafetyRecommendation {
  priority: 'high' | 'medium' | 'low'
  category: 'typescript' | 'entity' | 'api' | 'store'
  title: string
  description: string
  affectedFiles: string[]
  estimatedEffort: 'small' | 'medium' | 'large'
  impact: string
}

// ============================================================================
// Validation Configuration
// ============================================================================

/**
 * TypeSafetyConfig - Configuration for type safety validation
 */
export interface TypeSafetyConfig {
  strictMode: boolean
  allowAnyInTests: boolean
  allowAnyInMigrations: boolean
  entityInterfaceRequired: boolean
  apiTypesRequired: boolean
  storeTypesRequired: boolean
  qualityGateThreshold: number // 0-100
  excludePatterns: string[]
  includePatterns: string[]
}

/**
 * Default type safety configuration
 */
export const DEFAULT_TYPE_SAFETY_CONFIG: TypeSafetyConfig = {
  strictMode: true,
  allowAnyInTests: true,
  allowAnyInMigrations: true,
  entityInterfaceRequired: true,
  apiTypesRequired: true,
  storeTypesRequired: true,
  qualityGateThreshold: 80,
  excludePatterns: [
    'node_modules/**',
    'dist/**',
    'build/**',
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/__tests__/**'
  ],
  includePatterns: [
    'src/**/*.ts',
    'src/**/*.tsx'
  ]
}
