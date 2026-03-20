/**
 * TypeSafetyValidator - Main validator orchestrating all type safety checks
 * 
 * Coordinates TypeScript compilation, entity interface, API type, and
 * Zustand store type validation to provide comprehensive type safety analysis.
 */

import { TypeScriptCompilerValidator } from './TypeScriptCompilerValidator'
import { EntityInterfaceValidator } from './EntityInterfaceValidator'
import { APITypeValidator } from './APITypeValidator'
import { StoreTypeValidator } from './StoreTypeValidator'
import {
  TypeSafetyValidator as ITypeSafetyValidator,
  TypeScriptValidationResult,
  EntityInterfaceValidation,
  APITypeValidation,
  StoreTypeValidation,
  TypeSafetyReport,
  TypeSafetySummary,
  TypeSafetyRecommendation,
  TypeSafetyConfig,
  DEFAULT_TYPE_SAFETY_CONFIG
} from '../types/type-safety'

export class TypeSafetyValidator implements ITypeSafetyValidator {
  private projectRoot: string
  private config: TypeSafetyConfig
  private tsValidator: TypeScriptCompilerValidator
  private entityValidator: EntityInterfaceValidator
  private apiValidator: APITypeValidator
  private storeValidator: StoreTypeValidator

  constructor(projectRoot: string = process.cwd(), config: Partial<TypeSafetyConfig> = {}) {
    this.projectRoot = projectRoot
    this.config = { ...DEFAULT_TYPE_SAFETY_CONFIG, ...config }
    
    this.tsValidator = new TypeScriptCompilerValidator(projectRoot)
    this.entityValidator = new EntityInterfaceValidator(projectRoot)
    this.apiValidator = new APITypeValidator(projectRoot)
    this.storeValidator = new StoreTypeValidator(projectRoot)
  }

  /**
   * Validate TypeScript compilation
   */
  async validateTypeScript(): Promise<TypeScriptValidationResult> {
    return await this.tsValidator.validateTypeScript()
  }

  /**
   * Validate entity interfaces
   */
  async validateEntityInterfaces(): Promise<EntityInterfaceValidation> {
    return await this.entityValidator.validateEntityInterfaces()
  }

  /**
   * Validate API types
   */
  async validateAPITypes(): Promise<APITypeValidation> {
    return await this.apiValidator.validateAPITypes()
  }

  /**
   * Validate store types
   */
  async validateStoreTypes(): Promise<StoreTypeValidation> {
    return await this.storeValidator.validateStoreTypes()
  }

  /**
   * Generate comprehensive type safety report
   */
  async generateReport(): Promise<TypeSafetyReport> {
    console.log('Running comprehensive type safety validation...')

    // Run all validations in parallel
    const [
      typeScriptValidation,
      entityInterfaceValidation,
      apiTypeValidation,
      storeTypeValidation
    ] = await Promise.all([
      this.validateTypeScript(),
      this.validateEntityInterfaces(),
      this.validateAPITypes(),
      this.validateStoreTypes()
    ])

    // Create summary
    const summary = this.createSummary(
      typeScriptValidation,
      entityInterfaceValidation,
      apiTypeValidation,
      storeTypeValidation
    )

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      typeScriptValidation,
      entityInterfaceValidation,
      apiTypeValidation,
      storeTypeValidation
    )

    return {
      timestamp: new Date(),
      overallValid: summary.passesQualityGate,
      typeScriptValidation,
      entityInterfaceValidation,
      apiTypeValidation,
      storeTypeValidation,
      summary,
      recommendations
    }
  }

  /**
   * Create overall summary
   */
  private createSummary(
    tsValidation: TypeScriptValidationResult,
    entityValidation: EntityInterfaceValidation,
    apiValidation: APITypeValidation,
    storeValidation: StoreTypeValidation
  ): TypeSafetySummary {
    const totalErrors = 
      tsValidation.errors.length +
      entityValidation.summary.errorCount +
      apiValidation.summary.totalIssues +
      storeValidation.summary.totalIssues

    const criticalErrors = 
      tsValidation.errors.filter(e => e.severity === 'critical').length +
      entityValidation.summary.criticalIssues +
      apiValidation.summary.criticalIssues +
      storeValidation.summary.criticalIssues

    const totalWarnings = tsValidation.warnings.length

    // Calculate overall score (0-100)
    const tsScore = tsValidation.success ? 100 : Math.max(0, 100 - (tsValidation.errors.length * 2))
    const entityScore = entityValidation.totalEntities > 0
      ? (entityValidation.validEntities / entityValidation.totalEntities) * 100
      : 100
    const apiScore = apiValidation.totalMethods > 0
      ? (apiValidation.validMethods / apiValidation.totalMethods) * 100
      : 100
    const storeScore = storeValidation.totalStores > 0
      ? (storeValidation.validStores / storeValidation.totalStores) * 100
      : 100

    const overallScore = Math.round((tsScore + entityScore + apiScore + storeScore) / 4)

    return {
      totalErrors,
      criticalErrors,
      totalWarnings,
      typeScriptErrors: tsValidation.errors.length,
      entityInterfaceIssues: entityValidation.summary.totalIssues,
      apiTypeIssues: apiValidation.summary.totalIssues,
      storeTypeIssues: storeValidation.summary.totalIssues,
      overallScore,
      passesQualityGate: overallScore >= this.config.qualityGateThreshold && criticalErrors === 0
    }
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    tsValidation: TypeScriptValidationResult,
    entityValidation: EntityInterfaceValidation,
    apiValidation: APITypeValidation,
    storeValidation: StoreTypeValidation
  ): TypeSafetyRecommendation[] {
    const recommendations: TypeSafetyRecommendation[] = []

    // TypeScript errors
    if (tsValidation.errors.length > 0) {
      const criticalErrors = tsValidation.errors.filter(e => e.severity === 'critical')
      if (criticalErrors.length > 0) {
        recommendations.push({
          priority: 'high',
          category: 'typescript',
          title: 'Fix critical TypeScript compilation errors',
          description: `${criticalErrors.length} critical TypeScript errors are blocking compilation`,
          affectedFiles: [...new Set(criticalErrors.map(e => e.file))],
          estimatedEffort: criticalErrors.length > 10 ? 'large' : criticalErrors.length > 5 ? 'medium' : 'small',
          impact: 'Code cannot compile until these errors are fixed'
        })
      }

      const anyTypeErrors = tsValidation.errors.filter(e => e.category === 'any-type' || e.category === 'implicit-any')
      if (anyTypeErrors.length > 0) {
        recommendations.push({
          priority: 'medium',
          category: 'typescript',
          title: 'Replace any types with explicit types',
          description: `${anyTypeErrors.length} instances of 'any' type found`,
          affectedFiles: [...new Set(anyTypeErrors.map(e => e.file))],
          estimatedEffort: anyTypeErrors.length > 20 ? 'large' : anyTypeErrors.length > 10 ? 'medium' : 'small',
          impact: 'Improves type safety and catches potential runtime errors'
        })
      }
    }

    // Entity interface issues
    if (entityValidation.missingInterfaces.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'entity',
        title: 'Add missing entity interfaces',
        description: `${entityValidation.missingInterfaces.length} entities are missing TypeScript interfaces`,
        affectedFiles: entityValidation.missingInterfaces.map(e => `src/entities/${e}/model/types.ts`),
        estimatedEffort: entityValidation.missingInterfaces.length > 5 ? 'large' : 'medium',
        impact: 'Ensures all entities have proper type definitions'
      })
    }

    if (entityValidation.incompleteInterfaces.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'entity',
        title: 'Complete entity interfaces',
        description: `${entityValidation.incompleteInterfaces.length} entity interfaces are incomplete`,
        affectedFiles: entityValidation.incompleteInterfaces.map(i => `src/entities/${i.entityName}/model/types.ts`),
        estimatedEffort: 'medium',
        impact: 'Improves entity type completeness and safety'
      })
    }

    // API type issues
    if (apiValidation.missingTypes.length > 0) {
      const missingRequest = apiValidation.missingTypes.filter(m => m.missingRequest).length
      const missingResponse = apiValidation.missingTypes.filter(m => m.missingResponse).length

      if (missingRequest > 0 || missingResponse > 0) {
        recommendations.push({
          priority: 'high',
          category: 'api',
          title: 'Add API function type annotations',
          description: `${missingRequest} methods missing request types, ${missingResponse} missing response types`,
          affectedFiles: [...new Set(apiValidation.missingTypes.map(m => m.filePath))],
          estimatedEffort: apiValidation.missingTypes.length > 20 ? 'large' : 'medium',
          impact: 'Ensures API functions have proper type safety'
        })
      }
    }

    // Store type issues
    if (storeValidation.missingTypes.length > 0) {
      const missingStateInterface = storeValidation.missingTypes.filter(m => m.missingStateInterface).length
      const missingTypedSelectors = storeValidation.missingTypes.filter(m => m.missingTypedSelectors).length
      const missingTypedActions = storeValidation.missingTypes.filter(m => m.missingTypedActions).length

      if (missingStateInterface > 0) {
        recommendations.push({
          priority: 'high',
          category: 'store',
          title: 'Add state interfaces to Zustand stores',
          description: `${missingStateInterface} stores are missing state interfaces`,
          affectedFiles: storeValidation.missingTypes
            .filter(m => m.missingStateInterface)
            .map(m => m.filePath),
          estimatedEffort: missingStateInterface > 5 ? 'large' : 'medium',
          impact: 'Ensures store state is properly typed'
        })
      }

      if (missingTypedSelectors > 0 || missingTypedActions > 0) {
        recommendations.push({
          priority: 'medium',
          category: 'store',
          title: 'Add types to store selectors and actions',
          description: `${missingTypedSelectors} stores with untyped selectors, ${missingTypedActions} with untyped actions`,
          affectedFiles: [...new Set(storeValidation.missingTypes.map(m => m.filePath))],
          estimatedEffort: 'medium',
          impact: 'Improves store type safety and developer experience'
        })
      }
    }

    // Sort by priority
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }

  /**
   * Run validation and check quality gate
   */
  async validateAndCheckQualityGate(): Promise<boolean> {
    const report = await this.generateReport()
    return report.summary.passesQualityGate
  }

  /**
   * Get configuration
   */
  getConfig(): TypeSafetyConfig {
    return { ...this.config }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<TypeSafetyConfig>): void {
    this.config = { ...this.config, ...config }
  }
}
