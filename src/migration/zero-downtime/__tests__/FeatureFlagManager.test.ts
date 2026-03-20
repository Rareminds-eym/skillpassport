import { describe, it, expect, beforeEach } from 'vitest'
import { FeatureFlagManager } from '../FeatureFlagManager'

describe('FeatureFlagManager', () => {
  let manager: FeatureFlagManager

  beforeEach(() => {
    manager = new FeatureFlagManager()
  })

  describe('registerFlag', () => {
    it('should register a feature flag', () => {
      manager.registerFlag({
        name: 'test-flag',
        enabled: true,
        rolloutPercentage: 50,
        description: 'Test flag'
      })

      const flag = manager.getFlag('test-flag')
      expect(flag).toBeDefined()
      expect(flag?.name).toBe('test-flag')
    })
  })

  describe('isEnabled', () => {
    it('should return false for non-existent flag', () => {
      expect(manager.isEnabled('non-existent')).toBe(false)
    })

    it('should return false for disabled flag', () => {
      manager.registerFlag({
        name: 'disabled-flag',
        enabled: false,
        rolloutPercentage: 100,
        description: 'Disabled flag'
      })

      expect(manager.isEnabled('disabled-flag')).toBe(false)
    })

    it('should respect rollout percentage', () => {
      manager.registerFlag({
        name: 'partial-flag',
        enabled: true,
        rolloutPercentage: 0,
        description: 'Partial rollout'
      })

      // With 0% rollout, should always be false
      expect(manager.isEnabled('partial-flag')).toBe(false)
    })

    it('should enable flag with 100% rollout', () => {
      manager.registerFlag({
        name: 'full-flag',
        enabled: true,
        rolloutPercentage: 100,
        description: 'Full rollout'
      })

      expect(manager.isEnabled('full-flag')).toBe(true)
    })
  })

  describe('updateRollout', () => {
    it('should update rollout percentage', () => {
      manager.registerFlag({
        name: 'test-flag',
        enabled: true,
        rolloutPercentage: 50,
        description: 'Test'
      })

      manager.updateRollout('test-flag', 75)
      const flag = manager.getFlag('test-flag')
      expect(flag?.rolloutPercentage).toBe(75)
    })

    it('should clamp percentage to 0-100 range', () => {
      manager.registerFlag({
        name: 'test-flag',
        enabled: true,
        rolloutPercentage: 50,
        description: 'Test'
      })

      manager.updateRollout('test-flag', 150)
      expect(manager.getFlag('test-flag')?.rolloutPercentage).toBe(100)

      manager.updateRollout('test-flag', -10)
      expect(manager.getFlag('test-flag')?.rolloutPercentage).toBe(0)
    })
  })

  describe('enable/disable', () => {
    it('should enable a flag', () => {
      manager.registerFlag({
        name: 'test-flag',
        enabled: false,
        rolloutPercentage: 100,
        description: 'Test'
      })

      manager.enable('test-flag')
      expect(manager.getFlag('test-flag')?.enabled).toBe(true)
    })

    it('should disable a flag', () => {
      manager.registerFlag({
        name: 'test-flag',
        enabled: true,
        rolloutPercentage: 100,
        description: 'Test'
      })

      manager.disable('test-flag')
      expect(manager.getFlag('test-flag')?.enabled).toBe(false)
    })
  })

  describe('initializeDefaultFlags', () => {
    it('should initialize default migration flags', () => {
      manager.initializeDefaultFlags()

      const flags = manager.getAllFlags()
      expect(flags.length).toBeGreaterThan(0)
      expect(flags.some(f => f.name === 'use-entities-layer')).toBe(true)
      expect(flags.some(f => f.name === 'use-widgets-layer')).toBe(true)
    })
  })
})
