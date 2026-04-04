/**
 * Tests for StoreTypeValidator
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { StoreTypeValidator } from '../StoreTypeValidator'

describe('StoreTypeValidator', () => {
  let validator: StoreTypeValidator
  const projectRoot = process.cwd()

  beforeEach(() => {
    validator = new StoreTypeValidator(projectRoot)
  })

  describe('validateStoreTypes', () => {
    it('should validate all Zustand store types', async () => {
      const result = await validator.validateStoreTypes()

      expect(result).toBeDefined()
      expect(result).toHaveProperty('valid')
      expect(result).toHaveProperty('stores')
      expect(result).toHaveProperty('missingTypes')
      expect(result).toHaveProperty('totalStores')
      expect(result).toHaveProperty('validStores')
      expect(result).toHaveProperty('summary')
    })

    it('should check each store', async () => {
      const result = await validator.validateStoreTypes()

      if (result.stores.length > 0) {
        result.stores.forEach(store => {
          expect(store).toHaveProperty('storeName')
          expect(store).toHaveProperty('filePath')
          expect(store).toHaveProperty('hasStateInterface')
          expect(store).toHaveProperty('hasTypedSelectors')
          expect(store).toHaveProperty('hasTypedActions')
          expect(store).toHaveProperty('stateProperties')
          expect(store).toHaveProperty('selectors')
          expect(store).toHaveProperty('actions')
          expect(store).toHaveProperty('issues')
        })
      }
    })

    it('should validate state properties', async () => {
      const result = await validator.validateStoreTypes()

      const storesWithProperties = result.stores.filter(s => s.stateProperties.length > 0)
      
      if (storesWithProperties.length > 0) {
        storesWithProperties.forEach(store => {
          store.stateProperties.forEach(prop => {
            expect(prop).toHaveProperty('name')
            expect(prop).toHaveProperty('hasType')
            expect(prop).toHaveProperty('typeQuality')
            expect(prop).toHaveProperty('isValid')
            expect(prop.typeQuality).toMatch(/explicit|inferred|any|unknown|missing/)
          })
        })
      }
    })

    it('should validate selectors', async () => {
      const result = await validator.validateStoreTypes()

      const storesWithSelectors = result.stores.filter(s => s.selectors.length > 0)
      
      if (storesWithSelectors.length > 0) {
        storesWithSelectors.forEach(store => {
          store.selectors.forEach(selector => {
            expect(selector).toHaveProperty('name')
            expect(selector).toHaveProperty('hasReturnType')
            expect(selector).toHaveProperty('returnTypeQuality')
            expect(selector).toHaveProperty('isValid')
            expect(selector.returnTypeQuality).toMatch(/explicit|inferred|any|unknown|missing/)
          })
        })
      }
    })

    it('should validate actions', async () => {
      const result = await validator.validateStoreTypes()

      const storesWithActions = result.stores.filter(s => s.actions.length > 0)
      
      if (storesWithActions.length > 0) {
        storesWithActions.forEach(store => {
          store.actions.forEach(action => {
            expect(action).toHaveProperty('name')
            expect(action).toHaveProperty('hasParameterTypes')
            expect(action).toHaveProperty('hasReturnType')
            expect(action).toHaveProperty('parameterTypeQuality')
            expect(action).toHaveProperty('returnTypeQuality')
            expect(action).toHaveProperty('isValid')
            expect(action.parameterTypeQuality).toMatch(/explicit|inferred|any|unknown|missing/)
            expect(action.returnTypeQuality).toMatch(/explicit|inferred|any|unknown|missing/)
          })
        })
      }
    })

    it('should identify stores with missing types', async () => {
      const result = await validator.validateStoreTypes()

      expect(Array.isArray(result.missingTypes)).toBe(true)
      
      if (result.missingTypes.length > 0) {
        result.missingTypes.forEach(missing => {
          expect(missing).toHaveProperty('storeName')
          expect(missing).toHaveProperty('filePath')
          expect(missing).toHaveProperty('missingStateInterface')
          expect(missing).toHaveProperty('missingTypedSelectors')
          expect(missing).toHaveProperty('missingTypedActions')
          expect(missing).toHaveProperty('suggestion')
        })
      }
    })

    it('should provide summary', async () => {
      const result = await validator.validateStoreTypes()

      expect(result.summary).toBeDefined()
      expect(result.summary.totalStores).toBe(result.totalStores)
      expect(result.summary.storesWithStateInterface).toBeLessThanOrEqual(result.totalStores)
      expect(result.summary.storesWithTypedSelectors).toBeLessThanOrEqual(result.totalStores)
      expect(result.summary.storesWithTypedActions).toBeLessThanOrEqual(result.totalStores)
    })

    it('should report issues with severity', async () => {
      const result = await validator.validateStoreTypes()

      const storesWithIssues = result.stores.filter(s => s.issues.length > 0)
      
      if (storesWithIssues.length > 0) {
        storesWithIssues.forEach(store => {
          store.issues.forEach(issue => {
            expect(issue).toHaveProperty('type')
            expect(issue).toHaveProperty('message')
            expect(issue).toHaveProperty('severity')
            expect(issue).toHaveProperty('suggestion')
            expect(issue.severity).toMatch(/low|medium|high|critical/)
          })
        })
      }
    })
  })
})
