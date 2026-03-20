/**
 * Tests for EntityInterfaceValidator
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { EntityInterfaceValidator } from '../EntityInterfaceValidator'

describe('EntityInterfaceValidator', () => {
  let validator: EntityInterfaceValidator
  const projectRoot = process.cwd()

  beforeEach(() => {
    validator = new EntityInterfaceValidator(projectRoot)
  })

  describe('validateEntityInterfaces', () => {
    it('should validate all entity interfaces', async () => {
      const result = await validator.validateEntityInterfaces()

      expect(result).toBeDefined()
      expect(result).toHaveProperty('valid')
      expect(result).toHaveProperty('entities')
      expect(result).toHaveProperty('missingInterfaces')
      expect(result).toHaveProperty('incompleteInterfaces')
      expect(result).toHaveProperty('totalEntities')
      expect(result).toHaveProperty('validEntities')
      expect(result).toHaveProperty('summary')
    })

    it('should check each entity', async () => {
      const result = await validator.validateEntityInterfaces()

      if (result.entities.length > 0) {
        result.entities.forEach(entity => {
          expect(entity).toHaveProperty('entityName')
          expect(entity).toHaveProperty('entityType')
          expect(entity).toHaveProperty('hasInterface')
          expect(entity).toHaveProperty('interfaceComplete')
          expect(entity).toHaveProperty('interfacePath')
          expect(entity).toHaveProperty('properties')
          expect(entity).toHaveProperty('issues')
        })
      }
    })

    it('should validate property types', async () => {
      const result = await validator.validateEntityInterfaces()

      const entitiesWithProperties = result.entities.filter(e => e.properties.length > 0)
      
      if (entitiesWithProperties.length > 0) {
        entitiesWithProperties.forEach(entity => {
          entity.properties.forEach(prop => {
            expect(prop).toHaveProperty('name')
            expect(prop).toHaveProperty('hasType')
            expect(prop).toHaveProperty('typeQuality')
            expect(prop).toHaveProperty('isOptional')
            expect(prop).toHaveProperty('isValid')
            expect(prop.typeQuality).toMatch(/explicit|inferred|any|unknown/)
          })
        })
      }
    })

    it('should identify missing interfaces', async () => {
      const result = await validator.validateEntityInterfaces()

      expect(Array.isArray(result.missingInterfaces)).toBe(true)
      expect(result.missingInterfaces.length).toBeLessThanOrEqual(result.totalEntities)
    })

    it('should identify incomplete interfaces', async () => {
      const result = await validator.validateEntityInterfaces()

      expect(Array.isArray(result.incompleteInterfaces)).toBe(true)
      
      if (result.incompleteInterfaces.length > 0) {
        result.incompleteInterfaces.forEach(incomplete => {
          expect(incomplete).toHaveProperty('entityName')
          expect(incomplete).toHaveProperty('interfaceName')
          expect(incomplete).toHaveProperty('missingProperties')
          expect(incomplete).toHaveProperty('suggestion')
        })
      }
    })

    it('should provide summary', async () => {
      const result = await validator.validateEntityInterfaces()

      expect(result.summary).toBeDefined()
      expect(result.summary.totalEntities).toBe(result.totalEntities)
      expect(result.summary.entitiesWithInterfaces).toBeLessThanOrEqual(result.totalEntities)
      expect(result.summary.completeInterfaces).toBeLessThanOrEqual(result.summary.entitiesWithInterfaces)
    })

    it('should report issues with severity', async () => {
      const result = await validator.validateEntityInterfaces()

      const entitiesWithIssues = result.entities.filter(e => e.issues.length > 0)
      
      if (entitiesWithIssues.length > 0) {
        entitiesWithIssues.forEach(entity => {
          entity.issues.forEach(issue => {
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
