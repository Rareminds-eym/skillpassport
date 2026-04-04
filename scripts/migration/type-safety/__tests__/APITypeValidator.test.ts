/**
 * Tests for APITypeValidator
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { APITypeValidator } from '../APITypeValidator'

describe('APITypeValidator', () => {
  let validator: APITypeValidator
  const projectRoot = process.cwd()

  beforeEach(() => {
    validator = new APITypeValidator(projectRoot)
  })

  describe('validateAPITypes', () => {
    it('should validate all API function types', async () => {
      const result = await validator.validateAPITypes()

      expect(result).toBeDefined()
      expect(result).toHaveProperty('valid')
      expect(result).toHaveProperty('apiMethods')
      expect(result).toHaveProperty('missingTypes')
      expect(result).toHaveProperty('totalMethods')
      expect(result).toHaveProperty('validMethods')
      expect(result).toHaveProperty('summary')
    })

    it('should check each API method', async () => {
      const result = await validator.validateAPITypes()

      if (result.apiMethods.length > 0) {
        result.apiMethods.forEach(method => {
          expect(method).toHaveProperty('methodName')
          expect(method).toHaveProperty('filePath')
          expect(method).toHaveProperty('hasRequestType')
          expect(method).toHaveProperty('hasResponseType')
          expect(method).toHaveProperty('requestTypeQuality')
          expect(method).toHaveProperty('responseTypeQuality')
          expect(method).toHaveProperty('isAsync')
          expect(method).toHaveProperty('issues')
        })
      }
    })

    it('should assess type quality', async () => {
      const result = await validator.validateAPITypes()

      if (result.apiMethods.length > 0) {
        result.apiMethods.forEach(method => {
          expect(method.requestTypeQuality).toMatch(/explicit|inferred|any|unknown|missing/)
          expect(method.responseTypeQuality).toMatch(/explicit|inferred|any|unknown|missing/)
        })
      }
    })

    it('should identify methods with missing types', async () => {
      const result = await validator.validateAPITypes()

      expect(Array.isArray(result.missingTypes)).toBe(true)
      
      if (result.missingTypes.length > 0) {
        result.missingTypes.forEach(missing => {
          expect(missing).toHaveProperty('methodName')
          expect(missing).toHaveProperty('filePath')
          expect(missing).toHaveProperty('missingRequest')
          expect(missing).toHaveProperty('missingResponse')
          expect(missing).toHaveProperty('suggestion')
          expect(missing.missingRequest || missing.missingResponse).toBe(true)
        })
      }
    })

    it('should provide summary', async () => {
      const result = await validator.validateAPITypes()

      expect(result.summary).toBeDefined()
      expect(result.summary.totalMethods).toBe(result.totalMethods)
      expect(result.summary.methodsWithTypes).toBeLessThanOrEqual(result.totalMethods)
      expect(result.summary.methodsWithRequestTypes).toBeLessThanOrEqual(result.totalMethods)
      expect(result.summary.methodsWithResponseTypes).toBeLessThanOrEqual(result.totalMethods)
    })

    it('should report issues with severity', async () => {
      const result = await validator.validateAPITypes()

      const methodsWithIssues = result.apiMethods.filter(m => m.issues.length > 0)
      
      if (methodsWithIssues.length > 0) {
        methodsWithIssues.forEach(method => {
          method.issues.forEach(issue => {
            expect(issue).toHaveProperty('type')
            expect(issue).toHaveProperty('message')
            expect(issue).toHaveProperty('severity')
            expect(issue).toHaveProperty('suggestion')
            expect(issue.severity).toMatch(/low|medium|high|critical/)
          })
        })
      }
    })

    it('should detect async functions', async () => {
      const result = await validator.validateAPITypes()

      if (result.apiMethods.length > 0) {
        result.apiMethods.forEach(method => {
          expect(typeof method.isAsync).toBe('boolean')
        })
      }
    })
  })
})
