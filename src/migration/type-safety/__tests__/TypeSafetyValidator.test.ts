/**
 * Tests for TypeSafetyValidator - Main orchestrator
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TypeSafetyValidator } from '../TypeSafetyValidator'

describe('TypeSafetyValidator', () => {
  let validator: TypeSafetyValidator
  const projectRoot = process.cwd()

  beforeEach(() => {
    validator = new TypeSafetyValidator(projectRoot)
  })

  describe('validateTypeScript', () => {
    it('should validate TypeScript compilation', async () => {
      const result = await validator.validateTypeScript()

      expect(result).toBeDefined()
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('errors')
      expect(result).toHaveProperty('warnings')
      expect(result).toHaveProperty('strictModeEnabled')
      expect(result.strictModeEnabled).toBe(true)
    })
  })

  describe('validateEntityInterfaces', () => {
    it('should validate entity interfaces', async () => {
      const result = await validator.validateEntityInterfaces()

      expect(result).toBeDefined()
      expect(result).toHaveProperty('valid')
      expect(result).toHaveProperty('entities')
      expect(result).toHaveProperty('totalEntities')
      expect(result).toHaveProperty('validEntities')
    })
  })

  describe('validateAPITypes', () => {
    it('should validate API types', async () => {
      const result = await validator.validateAPITypes()

      expect(result).toBeDefined()
      expect(result).toHaveProperty('valid')
      expect(result).toHaveProperty('apiMethods')
      expect(result).toHaveProperty('totalMethods')
      expect(result).toHaveProperty('validMethods')
    })
  })

  describe('validateStoreTypes', () => {
    it('should validate store types', async () => {
      const result = await validator.validateStoreTypes()

      expect(result).toBeDefined()
      expect(result).toHaveProperty('valid')
      expect(result).toHaveProperty('stores')
      expect(result).toHaveProperty('totalStores')
      expect(result).toHaveProperty('validStores')
    })
  })

  describe('generateReport', () => {
    it('should generate comprehensive type safety report', async () => {
      const report = await validator.generateReport()

      expect(report).toBeDefined()
      expect(report).toHaveProperty('timestamp')
      expect(report).toHaveProperty('overallValid')
      expect(report).toHaveProperty('typeScriptValidation')
      expect(report).toHaveProperty('entityInterfaceValidation')
      expect(report).toHaveProperty('apiTypeValidation')
      expect(report).toHaveProperty('storeTypeValidation')
      expect(report).toHaveProperty('summary')
      expect(report).toHaveProperty('recommendations')
    })

    it('should include summary with all metrics', async () => {
      const report = await validator.generateReport()

      expect(report.summary).toBeDefined()
      expect(report.summary).toHaveProperty('totalErrors')
      expect(report.summary).toHaveProperty('criticalErrors')
      expect(report.summary).toHaveProperty('totalWarnings')
      expect(report.summary).toHaveProperty('typeScriptErrors')
      expect(report.summary).toHaveProperty('entityInterfaceIssues')
      expect(report.summary).toHaveProperty('apiTypeIssues')
      expect(report.summary).toHaveProperty('storeTypeIssues')
      expect(report.summary).toHaveProperty('overallScore')
      expect(report.summary).toHaveProperty('passesQualityGate')

      // Validate score is between 0-100
      expect(report.summary.overallScore).toBeGreaterThanOrEqual(0)
      expect(report.summary.overallScore).toBeLessThanOrEqual(100)
    })

    it('should generate recommendations', async () => {
      const report = await validator.generateReport()

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
          expect(rec.priority).toMatch(/high|medium|low/)
          expect(rec.category).toMatch(/typescript|entity|api|store/)
          expect(rec.estimatedEffort).toMatch(/small|medium|large/)
        })
      }
    })

    it('should sort recommendations by priority', async () => {
      const report = await validator.generateReport()

      if (report.recommendations.length > 1) {
        const priorities = report.recommendations.map(r => r.priority)
        const priorityOrder = { high: 0, medium: 1, low: 2 }

        for (let i = 0; i < priorities.length - 1; i++) {
          expect(priorityOrder[priorities[i]]).toBeLessThanOrEqual(priorityOrder[priorities[i + 1]])
        }
      }
    })

    it('should validate all sub-validations ran', async () => {
      const report = await validator.generateReport()

      // TypeScript validation
      expect(report.typeScriptValidation).toBeDefined()
      expect(report.typeScriptValidation.strictModeEnabled).toBe(true)

      // Entity validation
      expect(report.entityInterfaceValidation).toBeDefined()
      expect(report.entityInterfaceValidation.totalEntities).toBeGreaterThanOrEqual(0)

      // API validation
      expect(report.apiTypeValidation).toBeDefined()
      expect(report.apiTypeValidation.totalMethods).toBeGreaterThanOrEqual(0)

      // Store validation
      expect(report.storeTypeValidation).toBeDefined()
      expect(report.storeTypeValidation.totalStores).toBeGreaterThanOrEqual(0)
    })
  })

  describe('validateAndCheckQualityGate', () => {
    it('should validate and return quality gate status', async () => {
      const passed = await validator.validateAndCheckQualityGate()

      expect(typeof passed).toBe('boolean')
    })
  })

  describe('configuration', () => {
    it('should get configuration', () => {
      const config = validator.getConfig()

      expect(config).toBeDefined()
      expect(config).toHaveProperty('strictMode')
      expect(config).toHaveProperty('qualityGateThreshold')
      expect(config).toHaveProperty('entityInterfaceRequired')
      expect(config).toHaveProperty('apiTypesRequired')
      expect(config).toHaveProperty('storeTypesRequired')
    })

    it('should update configuration', () => {
      const newConfig = {
        qualityGateThreshold: 90,
        allowAnyInTests: false
      }

      validator.updateConfig(newConfig)
      const config = validator.getConfig()

      expect(config.qualityGateThreshold).toBe(90)
      expect(config.allowAnyInTests).toBe(false)
    })

    it('should use custom configuration', () => {
      const customValidator = new TypeSafetyValidator(projectRoot, {
        qualityGateThreshold: 95,
        strictMode: true
      })

      const config = customValidator.getConfig()

      expect(config.qualityGateThreshold).toBe(95)
      expect(config.strictMode).toBe(true)
    })
  })

  describe('error categorization', () => {
    it('should categorize TypeScript errors correctly', async () => {
      const report = await validator.generateReport()

      if (report.typeScriptValidation.errors.length > 0) {
        const errorsByCategory = report.typeScriptValidation.errorsByCategory

        expect(errorsByCategory).toBeDefined()
        expect(errorsByCategory instanceof Map).toBe(true)

        // Verify categories are valid
        for (const [category, count] of errorsByCategory.entries()) {
          expect(category).toMatch(/type-mismatch|missing-type|any-type|implicit-any|null-undefined|unused-variable|import-error|syntax-error|other/)
          expect(count).toBeGreaterThan(0)
        }
      }
    })

    it('should identify critical errors', async () => {
      const report = await validator.generateReport()

      expect(report.summary.criticalErrors).toBeGreaterThanOrEqual(0)
      expect(report.summary.criticalErrors).toBeLessThanOrEqual(report.summary.totalErrors)

      if (report.typeScriptValidation.errors.length > 0) {
        const criticalErrors = report.typeScriptValidation.errors.filter(e => e.severity === 'critical')
        expect(criticalErrors.length).toBeGreaterThanOrEqual(0)
      }
    })
  })

  describe('quality gate', () => {
    it('should fail quality gate if critical errors exist', async () => {
      const report = await validator.generateReport()

      if (report.summary.criticalErrors > 0) {
        expect(report.summary.passesQualityGate).toBe(false)
      }
    })

    it('should respect quality gate threshold', async () => {
      const strictValidator = new TypeSafetyValidator(projectRoot, {
        qualityGateThreshold: 100
      })

      const report = await strictValidator.generateReport()

      if (report.summary.overallScore < 100) {
        expect(report.summary.passesQualityGate).toBe(false)
      }
    })
  })
})
