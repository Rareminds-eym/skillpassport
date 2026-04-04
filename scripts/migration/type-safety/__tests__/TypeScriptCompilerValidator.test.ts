/**
 * Tests for TypeScriptCompilerValidator
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { TypeScriptCompilerValidator } from '../TypeScriptCompilerValidator'
import * as path from 'path'

describe('TypeScriptCompilerValidator', () => {
  let validator: TypeScriptCompilerValidator
  const projectRoot = process.cwd()

  beforeEach(() => {
    validator = new TypeScriptCompilerValidator(projectRoot)
  })

  describe('validateTypeScript', () => {
    it('should validate TypeScript compilation', async () => {
      const result = await validator.validateTypeScript()

      expect(result).toBeDefined()
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('errors')
      expect(result).toHaveProperty('warnings')
      expect(result).toHaveProperty('strictModeEnabled')
      expect(result).toHaveProperty('totalFiles')
      expect(result).toHaveProperty('filesWithErrors')
      expect(result).toHaveProperty('errorsByCategory')
      expect(result).toHaveProperty('duration')
    })

    it('should enable strict mode', async () => {
      const result = await validator.validateTypeScript()

      expect(result.strictModeEnabled).toBe(true)
    })

    it('should categorize errors correctly', async () => {
      const result = await validator.validateTypeScript()

      if (result.errors.length > 0) {
        result.errors.forEach(error => {
          expect(error).toHaveProperty('code')
          expect(error).toHaveProperty('message')
          expect(error).toHaveProperty('file')
          expect(error).toHaveProperty('line')
          expect(error).toHaveProperty('column')
          expect(error).toHaveProperty('category')
          expect(error).toHaveProperty('severity')
          expect(error.category).toMatch(/type-mismatch|missing-type|any-type|implicit-any|null-undefined|unused-variable|import-error|syntax-error|other/)
          expect(error.severity).toMatch(/low|medium|high|critical/)
        })
      }
    })

    it('should provide suggestions for errors', async () => {
      const result = await validator.validateTypeScript()

      if (result.errors.length > 0) {
        const errorsWithSuggestions = result.errors.filter(e => e.suggestion)
        expect(errorsWithSuggestions.length).toBeGreaterThan(0)
      }
    })

    it('should count files correctly', async () => {
      const result = await validator.validateTypeScript()

      expect(result.totalFiles).toBeGreaterThan(0)
      expect(result.filesWithErrors).toBeGreaterThanOrEqual(0)
      expect(result.filesWithErrors).toBeLessThanOrEqual(result.totalFiles)
    })

    it('should measure duration', async () => {
      const result = await validator.validateTypeScript()

      expect(result.duration).toBeGreaterThan(0)
    })
  })

  describe('isStrictModeEnabled', () => {
    it('should check if strict mode is enabled', async () => {
      const isStrict = await validator.isStrictModeEnabled()

      expect(typeof isStrict).toBe('boolean')
    })
  })

  describe('getTypeScriptVersion', () => {
    it('should return TypeScript version', () => {
      const version = validator.getTypeScriptVersion()

      expect(version).toBeDefined()
      expect(typeof version).toBe('string')
      expect(version).toMatch(/^\d+\.\d+\.\d+/)
    })
  })
})
