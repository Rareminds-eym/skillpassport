import { describe, it, expect, beforeEach } from 'vitest'
import { HealthMonitor } from '../HealthMonitor'

describe('HealthMonitor', () => {
  let monitor: HealthMonitor

  beforeEach(() => {
    monitor = new HealthMonitor()
  })

  describe('registerMetric', () => {
    it('should register a health metric', () => {
      monitor.registerMetric('test-metric', 100)
      const health = monitor.getHealth()
      
      const metric = health.metrics.find(m => m.name === 'test-metric')
      expect(metric).toBeDefined()
      expect(metric?.threshold).toBe(100)
    })
  })

  describe('updateMetric', () => {
    it('should update metric value and status', () => {
      monitor.registerMetric('error-rate', 5)
      monitor.updateMetric('error-rate', 3)

      const health = monitor.getHealth()
      const metric = health.metrics.find(m => m.name === 'error-rate')
      
      expect(metric?.value).toBe(3)
      expect(metric?.status).toBe('healthy')
    })

    it('should set warning status when threshold exceeded', () => {
      monitor.registerMetric('error-rate', 5)
      monitor.updateMetric('error-rate', 6)

      const health = monitor.getHealth()
      const metric = health.metrics.find(m => m.name === 'error-rate')
      
      expect(metric?.status).toBe('warning')
    })

    it('should set critical status when threshold greatly exceeded', () => {
      monitor.registerMetric('error-rate', 5)
      monitor.updateMetric('error-rate', 12)

      const health = monitor.getHealth()
      const metric = health.metrics.find(m => m.name === 'error-rate')
      
      expect(metric?.status).toBe('critical')
    })
  })

  describe('recordError', () => {
    it('should record error occurrences', () => {
      monitor.recordError('import-error')
      monitor.recordError('import-error')
      monitor.recordError('type-error')

      const health = monitor.getHealth()
      
      const importError = health.errors.find(e => e.type === 'import-error')
      expect(importError?.count).toBe(2)
      
      const typeError = health.errors.find(e => e.type === 'type-error')
      expect(typeError?.count).toBe(1)
    })
  })

  describe('getHealth', () => {
    it('should return healthy status with no issues', () => {
      monitor.registerMetric('error-rate', 5)
      monitor.updateMetric('error-rate', 2)

      const health = monitor.getHealth()
      expect(health.overall).toBe('healthy')
    })

    it('should return degraded status with warnings', () => {
      monitor.registerMetric('error-rate', 5)
      monitor.updateMetric('error-rate', 6)

      const health = monitor.getHealth()
      expect(health.overall).toBe('degraded')
    })

    it('should return critical status with critical metrics', () => {
      monitor.registerMetric('error-rate', 5)
      monitor.updateMetric('error-rate', 15)

      const health = monitor.getHealth()
      expect(health.overall).toBe('critical')
    })

    it('should include warnings for degraded metrics', () => {
      monitor.registerMetric('error-rate', 5)
      monitor.updateMetric('error-rate', 6)

      const health = monitor.getHealth()
      expect(health.warnings.length).toBeGreaterThan(0)
    })
  })

  describe('initializeDefaultMetrics', () => {
    it('should initialize default health metrics', () => {
      monitor.initializeDefaultMetrics()

      const health = monitor.getHealth()
      expect(health.metrics.length).toBeGreaterThan(0)
      expect(health.metrics.some(m => m.name === 'error-rate')).toBe(true)
      expect(health.metrics.some(m => m.name === 'response-time')).toBe(true)
    })
  })

  describe('isHealthy', () => {
    it('should return true when health is not critical', () => {
      monitor.registerMetric('error-rate', 5)
      monitor.updateMetric('error-rate', 3)

      expect(monitor.isHealthy()).toBe(true)
    })

    it('should return false when health is critical', () => {
      monitor.registerMetric('error-rate', 5)
      monitor.updateMetric('error-rate', 15)

      expect(monitor.isHealthy()).toBe(false)
    })
  })

  describe('shouldPauseMigration', () => {
    it('should return true when health is critical', () => {
      monitor.registerMetric('error-rate', 5)
      monitor.updateMetric('error-rate', 15)

      expect(monitor.shouldPauseMigration()).toBe(true)
    })

    it('should return false when health is acceptable', () => {
      monitor.registerMetric('error-rate', 5)
      monitor.updateMetric('error-rate', 6)

      expect(monitor.shouldPauseMigration()).toBe(false)
    })
  })

  describe('reset', () => {
    it('should reset all monitoring data', () => {
      monitor.registerMetric('error-rate', 5)
      monitor.updateMetric('error-rate', 10)
      monitor.recordError('test-error')

      monitor.reset()

      const health = monitor.getHealth()
      expect(health.metrics.length).toBe(0)
      expect(health.errors.length).toBe(0)
    })
  })
})
