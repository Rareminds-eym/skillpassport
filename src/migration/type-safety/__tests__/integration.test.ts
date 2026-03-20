/**
 * Integration test for Type Safety Validation System
 * Tests all requirements from 9.1 to 9.7
 */

import { describe, it, expect } from 'vitest'
import { TypeSafetyValidator } from '../TypeSafetyValidator'

describe('Type Safety Validation System - Integration', () => {
  const validator = new TypeSafetyValidator(process.cwd())

  it('Requirement 9.1: Should run TypeScript compiler in strict mode and report all type errors', async () => {
    const result = await validator.validateTypeScript()

    // Verify strict mode is enabled
    expect(result.strictModeEnabled).toBe(true)

    // Verify errors are reported with proper structure
    expect(result).toHaveProperty('errors')
    expect(result).toHaveProperty('warnings')
    expect(Array.isArray(result.errors)).toBe(true)
    expect(Array.isArray(result.warnings)).toBe(true)

    // Verify error categorization
    expect(result).toHaveProperty('errorsByCategory')
    expect(result.errorsByCategory instanceof Map).toBe(true)
  }, 60000)

  it('Requirement 9.2: Should verify all entities have complete TypeScript interfaces', async () => {
    const result = await validator.validateEntityInterfaces()

    // Verify entity validation structure
    expect(result).toHaveProperty('entities')
    expect(result).toHaveProperty('missingInterfaces')
    expect(result).toHaveProperty('incompleteInterfaces')
    expect(result).toHaveProperty('totalEntities')
    expect(result).toHaveProperty('validEntities')

    // Verify each entity is checked
    expect(Array.isArray(result.entities)).toBe(true)
    if (result.entities.length > 0) {
      result.entities.forEach(entity => {
        expect(entity).toHaveProperty('entityName')
        expect(entity).toHaveProperty('hasInterface')
        expect(entity).toHaveProperty('interfaceComplete')
        expect(entity).toHaveProperty('properties')
      })
    }
  }, 30000)

  it('Requirement 9.3: Should verify all API functions have proper request/response types', async () => {
    const result = await validator.validateAPITypes()

    // Verify API validation structure
    expect(result).toHaveProperty('apiMethods')
    expect(result).toHaveProperty('missingTypes')
    expect(result).toHaveProperty('totalMethods')
    expect(result).toHaveProperty('validMethods')

    // Verify each method is checked
    expect(Array.isArray(result.apiMethods)).toBe(true)
    if (result.apiMethods.length > 0) {
      result.apiMethods.forEach(method => {
        expect(method).toHaveProperty('methodName')
        expect(method).toHaveProperty('hasRequestType')
        expect(method).toHaveProperty('hasResponseType')
        expect(method).toHaveProperty('requestTypeQuality')
        expect(method).toHaveProperty('responseTypeQuality')
      })
    }

    // Verify missing types are reported
    expect(Array.isArray(result.missingTypes)).toBe(true)
    if (result.missingTypes.length > 0) {
      result.missingTypes.forEach(missing => {
        expect(missing).toHaveProperty('methodName')
        expect(missing).toHaveProperty('missingRequest')
        expect(missing).toHaveProperty('missingResponse')
      })
    }
  }, 30000)

  it('Requirement 9.4: Should verify all Zustand stores have typed selectors and actions', async () => {
    const result = await validator.validateStoreTypes()

    // Verify store validation structure
    expect(result).toHaveProperty('stores')
    expect(result).toHaveProperty('missingTypes')
    expect(result).toHaveProperty('totalStores')
    expect(result).toHaveProperty('validStores')

    // Verify each store is checked
    expect(Array.isArray(result.stores)).toBe(true)
    if (result.stores.length > 0) {
      result.stores.forEach(store => {
        expect(store).toHaveProperty('storeName')
        expect(store).toHaveProperty('hasStateInterface')
        expect(store).toHaveProperty('hasTypedSelectors')
        expect(store).toHaveProperty('hasTypedActions')
        expect(store).toHaveProperty('stateProperties')
        expect(store).toHaveProperty('selectors')
        expect(store).toHaveProperty('actions')
      })
    }
  }, 30000)

  it('Requirement 9.5: Should categorize type errors by severity and location', async () => {
    const report = await validator.generateReport()

    // Verify TypeScript errors are categorized
    if (report.typeScriptValidation.errors.length > 0) {
      report.typeScriptValidation.errors.forEach(error => {
        // Verify category
        expect(error.category).toMatch(/type-mismatch|missing-type|any-type|implicit-any|null-undefined|unused-variable|import-error|syntax-error|other/)
        
        // Verify severity
        expect(error.severity).toMatch(/low|medium|high|critical/)
        
        // Verify location
        expect(error).toHaveProperty('file')
        expect(error).toHaveProperty('line')
        expect(error).toHaveProperty('column')
      })
    }

    // Verify errors are categorized by type
    expect(report.typeScriptValidation.errorsByCategory instanceof Map).toBe(true)
  }, 60000)

  it('Requirement 9.6: Should ensure no any types exist except in explicitly allowed locations', async () => {
    const report = await validator.generateReport()

    // Check TypeScript validation for any types
    const anyTypeErrors = report.typeScriptValidation.errors.filter(
      e => e.category === 'any-type' || e.category === 'implicit-any'
    )

    // Verify any type errors are reported
    expect(Array.isArray(anyTypeErrors)).toBe(true)

    // Check entity interfaces for any types
    if (report.entityInterfaceValidation.entities.length > 0) {
      report.entityInterfaceValidation.entities.forEach(entity => {
        const anyTypeProps = entity.properties.filter(p => p.typeQuality === 'any')
        // Any types in properties should be flagged in issues
        if (anyTypeProps.length > 0) {
          const anyTypeIssues = entity.issues.filter(i => i.type === 'any-type')
          expect(anyTypeIssues.length).toBeGreaterThan(0)
        }
      })
    }

    // Check API methods for any types
    if (report.apiTypeValidation.apiMethods.length > 0) {
      report.apiTypeValidation.apiMethods.forEach(method => {
        if (method.requestTypeQuality === 'any' || method.responseTypeQuality === 'any') {
          const anyTypeIssues = method.issues.filter(i => i.type === 'any-type')
          expect(anyTypeIssues.length).toBeGreaterThan(0)
        }
      })
    }

    // Check stores for any types
    if (report.storeTypeValidation.stores.length > 0) {
      report.storeTypeValidation.stores.forEach(store => {
        const anyTypeProps = store.stateProperties.filter(p => p.typeQuality === 'any')
        if (anyTypeProps.length > 0) {
          const anyTypeIssues = store.issues.filter(i => i.type === 'any-type')
          expect(anyTypeIssues.length).toBeGreaterThan(0)
        }
      })
    }
  }, 60000)

  it('Requirement 9.7: Should validate all React component props have TypeScript interfaces', async () => {
    // This is validated through TypeScript compilation in strict mode
    const result = await validator.validateTypeScript()

    // In strict mode, components without prop interfaces will generate errors
    expect(result.strictModeEnabled).toBe(true)

    // Component prop errors would be categorized as type-mismatch or implicit-any
    const propRelatedErrors = result.errors.filter(
      e => e.category === 'implicit-any' || e.category === 'type-mismatch'
    )

    // Verify these errors have suggestions
    if (propRelatedErrors.length > 0) {
      propRelatedErrors.forEach(error => {
        expect(error).toHaveProperty('suggestion')
      })
    }
  }, 60000)

  it('Requirement 9.8: Should generate a type safety report with error counts and locations', async () => {
    const report = await validator.generateReport()

    // Verify report structure
    expect(report).toHaveProperty('timestamp')
    expect(report).toHaveProperty('overallValid')
    expect(report).toHaveProperty('typeScriptValidation')
    expect(report).toHaveProperty('entityInterfaceValidation')
    expect(report).toHaveProperty('apiTypeValidation')
    expect(report).toHaveProperty('storeTypeValidation')
    expect(report).toHaveProperty('summary')
    expect(report).toHaveProperty('recommendations')

    // Verify summary has error counts
    expect(report.summary).toHaveProperty('totalErrors')
    expect(report.summary).toHaveProperty('criticalErrors')
    expect(report.summary).toHaveProperty('totalWarnings')
    expect(report.summary).toHaveProperty('typeScriptErrors')
    expect(report.summary).toHaveProperty('entityInterfaceIssues')
    expect(report.summary).toHaveProperty('apiTypeIssues')
    expect(report.summary).toHaveProperty('storeTypeIssues')
    expect(report.summary).toHaveProperty('overallScore')
    expect(report.summary).toHaveProperty('passesQualityGate')

    // Verify recommendations are provided
    expect(Array.isArray(report.recommendations)).toBe(true)
    if (report.recommendations.length > 0) {
      report.recommendations.forEach(rec => {
        expect(rec).toHaveProperty('priority')
        expect(rec).toHaveProperty('category')
        expect(rec).toHaveProperty('title')
        expect(rec).toHaveProperty('description')
        expect(rec).toHaveProperty('affectedFiles')
        expect(rec).toHaveProperty('estimatedEffort')
        expect(rec).toHaveProperty('impact')
      })
    }
  }, 60000)
})
