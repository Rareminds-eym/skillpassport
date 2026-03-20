import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ZeroDowntimeMigration } from '../ZeroDowntimeMigration'
import * as fs from 'fs'
import * as path from 'path'

vi.mock('fs')

describe('ZeroDowntimeMigration', () => {
  let migration: ZeroDowntimeMigration
  const testDir = '/test/dir'

  beforeEach(() => {
    vi.clearAllMocks()
    
    const config = {
      maintainReExports: true,
      deprecationWarnings: true,
      fallbackToOldPaths: true
    }
    
    migration = new ZeroDowntimeMigration(testDir, config)
  })

  describe('initialize', () => {
    it('should initialize all subsystems', async () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false)
      vi.spyOn(fs, 'mkdirSync').mockImplementation(() => '')
      vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {})

      await migration.initialize()

      const flagManager = migration.getFeatureFlagManager()
      const flags = flagManager.getAllFlags()
      
      expect(flags.length).toBeGreaterThan(0)
    })
  })

  describe('getMonitoringStatus', () => {
    it('should return current monitoring status', async () => {
      await migration.initialize()
      
      const status = migration.getMonitoringStatus()
      
      expect(status).toHaveProperty('startTime')
      expect(status).toHaveProperty('currentPhase')
      expect(status).toHaveProperty('health')
      expect(status).toHaveProperty('rolloutPercentage')
      expect(status).toHaveProperty('errorRate')
    })
  })

  describe('pauseMigration', () => {
    it('should disable all feature flags', async () => {
      await migration.initialize()
      
      const flagManager = migration.getFeatureFlagManager()
      flagManager.getAllFlags().forEach(flag => {
        flagManager.enable(flag.name)
      })

      await migration.pauseMigration()

      const flags = flagManager.getAllFlags()
      flags.forEach(flag => {
        expect(flag.enabled).toBe(false)
      })
    })
  })

  describe('resumeMigration', () => {
    it('should re-enable feature flags', async () => {
      await migration.initialize()
      await migration.pauseMigration()
      await migration.resumeMigration()

      const flagManager = migration.getFeatureFlagManager()
      const flags = flagManager.getAllFlags()
      
      flags.forEach(flag => {
        expect(flag.enabled).toBe(true)
      })
    })
  })

  describe('getFeatureFlagManager', () => {
    it('should return feature flag manager instance', () => {
      const manager = migration.getFeatureFlagManager()
      expect(manager).toBeDefined()
    })
  })

  describe('getHealthMonitor', () => {
    it('should return health monitor instance', () => {
      const monitor = migration.getHealthMonitor()
      expect(monitor).toBeDefined()
    })
  })

  describe('getBackwardCompatibilityManager', () => {
    it('should return backward compatibility manager instance', () => {
      const manager = migration.getBackwardCompatibilityManager()
      expect(manager).toBeDefined()
    })
  })
})
