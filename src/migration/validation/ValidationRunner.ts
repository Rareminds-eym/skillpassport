import { ValidationManager } from './ValidationManager'
import { MigrationConfig, MigrationLogger, ValidationResult, Integration, ImportUpdate } from '@/features/student-profile/model'

/**
 * High-level validation runner that orchestrates validation workflows
 */
export class ValidationRunner {
  private validationManager: ValidationManager

  constructor(config: MigrationConfig, logger: MigrationLogger) {
    this.validationManager = new ValidationManager(config, logger)
  }

  /**
   * Run complete pre-migration validation suite
   * Requirements: 7.1, 7.3
   */
  async runPreMigrationValidation(): Promise<ValidationResult> {
    return this.validationManager.validatePreMigration()
  }

  /**
   * Run complete post-migration validation suite
   * Requirements: 7.1, 7.3, 7.4, 11.5
   */
  async runPostMigrationValidation(
    integrations: Integration[],
    importUpdates: ImportUpdate[]
  ): Promise<ValidationResult> {
    return this.validationManager.validatePostMigration(integrations, importUpdates)
  }

  /**
   * Run validation with detailed reporting
   */
  async runValidationWithReport(
    phase: 'pre' | 'post',
    integrations?: Integration[],
    importUpdates?: ImportUpdate[]
  ): Promise<{
    result: ValidationResult
    report: ValidationReport
  }> {
    let result: ValidationResult

    if (phase === 'pre') {
      result = await this.runPreMigrationValidation()
    } else {
      if (!integrations || !importUpdates) {
        throw new Error('Post-migration validation requires integrations and import updates')
      }
      result = await this.runPostMigrationValidation(integrations, importUpdates)
    }

    const report = this.generateValidationReport(result, phase)

    return { result, report }
  }

  /**
   * Generate detailed validation report
   */
  private generateValidationReport(result: ValidationResult, phase: 'pre' | 'post'): ValidationReport {
    const criticalErrors = result.errors.filter(e => 
      e.type === 'test' || e.type === 'endpoint'
    )
    
    const warningErrors = result.errors.filter(e => 
      e.type === 'import' || e.type === 'integration'
    )

    return {
      phase,
      timestamp: new Date().toISOString(),
      overall: {
        passed: result.testsPass && result.endpointsAccessible && result.importPathsResolved,
        criticalIssues: criticalErrors.length,
        warnings: warningErrors.length + result.warnings.length
      },
      details: {
        tests: {
          status: result.testsPass ? 'PASS' : 'FAIL',
          total: result.summary.totalTests,
          passed: result.summary.passedTests,
          failed: result.summary.failedTests
        },
        endpoints: {
          status: result.endpointsAccessible ? 'PASS' : 'FAIL',
          total: result.summary.totalEndpoints,
          accessible: result.summary.accessibleEndpoints
        },
        imports: {
          status: result.importPathsResolved ? 'PASS' : 'FAIL',
          issues: result.errors.filter(e => e.type === 'import').length
        },
        integrations: phase === 'post' ? {
          status: result.storeIntegrationsValid ? 'PASS' : 'FAIL',
          total: result.summary.totalIntegrations,
          valid: result.summary.validIntegrations
        } : undefined
      },
      errors: result.errors,
      warnings: result.warnings,
      recommendations: this.generateRecommendations(result, phase)
    }
  }

  /**
   * Generate actionable recommendations based on validation results
   */
  private generateRecommendations(result: ValidationResult, phase: 'pre' | 'post'): string[] {
    const recommendations: string[] = []

    if (!result.testsPass) {
      recommendations.push('Fix failing tests before proceeding with migration')
      if (result.summary.failedTests > 5) {
        recommendations.push('Consider running tests in smaller batches to identify patterns')
      }
    }

    if (!result.endpointsAccessible) {
      recommendations.push('Verify API endpoints are running and accessible')
      recommendations.push('Check network connectivity and authentication')
    }

    if (!result.importPathsResolved) {
      const importErrors = result.errors.filter(e => e.type === 'import')
      if (importErrors.length > 0) {
        recommendations.push('Resolve import path issues before migration')
        if (importErrors.length > 10) {
          recommendations.push('Consider batch fixing import issues by pattern')
        }
      }
    }

    if (phase === 'post' && !result.storeIntegrationsValid) {
      recommendations.push('Review store integration patterns and fix integration issues')
      recommendations.push('Verify Zustand store actions and selectors are properly connected')
    }

    if (result.warnings.length > 0) {
      recommendations.push('Review warnings and consider addressing them for optimal migration')
    }

    if (recommendations.length === 0) {
      recommendations.push(`${phase === 'pre' ? 'Pre' : 'Post'}-migration validation passed - system is ready`)
    }

    return recommendations
  }
}

/**
 * Validation report structure
 */
export interface ValidationReport {
  phase: 'pre' | 'post'
  timestamp: string
  overall: {
    passed: boolean
    criticalIssues: number
    warnings: number
  }
  details: {
    tests: {
      status: 'PASS' | 'FAIL'
      total: number
      passed: number
      failed: number
    }
    endpoints: {
      status: 'PASS' | 'FAIL'
      total: number
      accessible: number
    }
    imports: {
      status: 'PASS' | 'FAIL'
      issues: number
    }
    integrations?: {
      status: 'PASS' | 'FAIL'
      total: number
      valid: number
    }
  }
  errors: Array<{
    type: string
    message: string
    details: string
    file?: string
    suggestion?: string
  }>
  warnings: string[]
  recommendations: string[]
}

/**
 * Create a new validation runner instance
 */
export function createValidationRunner(config: MigrationConfig, logger: MigrationLogger): ValidationRunner {
  return new ValidationRunner(config, logger)
}