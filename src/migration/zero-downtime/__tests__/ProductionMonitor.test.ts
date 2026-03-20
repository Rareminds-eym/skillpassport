import { describe, it, expect, beforeEach } from 'vitest'
import { ProductionMonitor } from '../ProductionMonitor'

describe('ProductionMonitor', () => {
  let monitor: ProductionMonitor

  beforeEach(() => {
    monitor = new ProductionMonitor()
  })

  describe('setBaseline', () => {
    it('should set baseline metrics', () => {
      monitor.setBaseline('response-time', 500, 20)

      const checks = monitor.checkStability()
      expect(checks).toHaveLength(0) // No current metrics yet
    })

    it('should allow multiple baselines', () => {
      monitor.setBaseline('response-time', 500, 20)
      monitor.setBaseline('error-rate', 1, 50)

      monitor.updateMetrics({
        responseTime: 500,
        errorRate: 1,
        throughput: 1000,
        cpuUsage: 50,
        memoryUsage: 60,
        activeUsers: 100
      })

      const checks = monitor.checkStability()
      expect(checks).toHaveLength(2)
    })
  })

  describe('updateMetrics', () => {
    it('should update current metrics', () => {
      const metrics = {
        responseTime: 450,
        errorRate: 0.8,
        throughput: 1050,
        cpuUsage: 45,
        memoryUsage: 55,
        activeUsers: 120
      }

      monitor.updateMetrics(metrics)
      monitor.setBaseline('response-time', 500, 20)

      const checks = monitor.checkStability()
      expect(checks.length).toBeGreaterThan(0)
    })

    it('should maintain metrics history', () => {
      for (let i = 0; i < 10; i++) {
        monitor.updateMetrics({
          responseTime: 500 + i,
          errorRate: 1,
          throughput: 1000,
          cpuUsage: 50,
          memoryUsage: 60,
          activeUsers: 100
        })
      }

      const trends = monitor.calculateTrends()
      expect(Object.keys(trends).length).toBeGreaterThan(0)
    })
  })

  describe('checkStability', () => {
    beforeEach(() => {
      monitor.setBaseline('response-time', 500, 20)
      monitor.setBaseline('error-rate', 1, 50)
    })

    it('should report stable when within tolerance', () => {
      monitor.updateMetrics({
        responseTime: 520, // 4% deviation, within 20% tolerance
        errorRate: 1.2, // 20% deviation, within 50% tolerance
        throughput: 1000,
        cpuUsage: 50,
        memoryUsage: 60,
        activeUsers: 100
      })

      const checks = monitor.checkStability()
      expect(checks.every(check => check.stable)).toBe(true)
    })

    it('should report unstable when exceeding tolerance', () => {
      monitor.updateMetrics({
        responseTime: 700, // 40% deviation, exceeds 20% tolerance
        errorRate: 1,
        throughput: 1000,
        cpuUsage: 50,
        memoryUsage: 60,
        activeUsers: 100
      })

      const checks = monitor.checkStability()
      const responseTimeCheck = checks.find(c => c.metric === 'response-time')
      expect(responseTimeCheck?.stable).toBe(false)
    })

    it('should calculate correct deviation percentage', () => {
      monitor.updateMetrics({
        responseTime: 600, // 20% deviation
        errorRate: 1,
        throughput: 1000,
        cpuUsage: 50,
        memoryUsage: 60,
        activeUsers: 100
      })

      const checks = monitor.checkStability()
      const responseTimeCheck = checks.find(c => c.metric === 'response-time')
      expect(responseTimeCheck?.deviation).toBe(20)
    })
  })

  describe('areMetricsStable', () => {
    beforeEach(() => {
      monitor.setBaseline('response-time', 500, 20)
      monitor.setBaseline('error-rate', 1, 50)
    })

    it('should return true when all metrics are stable', () => {
      monitor.updateMetrics({
        responseTime: 510,
        errorRate: 1.1,
        throughput: 1000,
        cpuUsage: 50,
        memoryUsage: 60,
        activeUsers: 100
      })

      expect(monitor.areMetricsStable()).toBe(true)
    })

    it('should return false when any metric is unstable', () => {
      monitor.updateMetrics({
        responseTime: 800, // Exceeds tolerance
        errorRate: 1,
        throughput: 1000,
        cpuUsage: 50,
        memoryUsage: 60,
        activeUsers: 100
      })

      expect(monitor.areMetricsStable()).toBe(false)
    })
  })

  describe('getUnstableMetrics', () => {
    beforeEach(() => {
      monitor.setBaseline('response-time', 500, 20)
      monitor.setBaseline('error-rate', 1, 50)
      monitor.setBaseline('throughput', 1000, 15)
    })

    it('should return only unstable metrics', () => {
      monitor.updateMetrics({
        responseTime: 800, // Unstable
        errorRate: 1.1, // Stable
        throughput: 1200, // Stable
        cpuUsage: 50,
        memoryUsage: 60,
        activeUsers: 100
      })

      const unstable = monitor.getUnstableMetrics()
      expect(unstable).toHaveLength(1)
      expect(unstable[0].metric).toBe('response-time')
    })

    it('should return empty array when all stable', () => {
      monitor.updateMetrics({
        responseTime: 510,
        errorRate: 1.1,
        throughput: 1050,
        cpuUsage: 50,
        memoryUsage: 60,
        activeUsers: 100
      })

      const unstable = monitor.getUnstableMetrics()
      expect(unstable).toHaveLength(0)
    })
  })

  describe('calculateTrends', () => {
    it('should identify improving trends', () => {
      // Simulate decreasing error rate (improving)
      for (let i = 10; i > 0; i--) {
        monitor.updateMetrics({
          responseTime: 500,
          errorRate: i,
          throughput: 1000,
          cpuUsage: 50,
          memoryUsage: 60,
          activeUsers: 100
        })
      }

      const trends = monitor.calculateTrends()
      expect(trends.errorRate).toBe('improving')
    })

    it('should identify degrading trends', () => {
      // Simulate increasing error rate (degrading)
      for (let i = 0; i < 10; i++) {
        monitor.updateMetrics({
          responseTime: 500,
          errorRate: i,
          throughput: 1000,
          cpuUsage: 50,
          memoryUsage: 60,
          activeUsers: 100
        })
      }

      const trends = monitor.calculateTrends()
      expect(trends.errorRate).toBe('degrading')
    })

    it('should identify stable trends', () => {
      // Simulate stable metrics
      for (let i = 0; i < 10; i++) {
        monitor.updateMetrics({
          responseTime: 500,
          errorRate: 1,
          throughput: 1000,
          cpuUsage: 50,
          memoryUsage: 60,
          activeUsers: 100
        })
      }

      const trends = monitor.calculateTrends()
      expect(trends.errorRate).toBe('stable')
    })
  })

  describe('getPerformanceComparison', () => {
    beforeEach(() => {
      monitor.setBaseline('response-time', 500, 20)
      monitor.setBaseline('error-rate', 1, 50)
    })

    it('should return performance comparison for all baselines', () => {
      monitor.updateMetrics({
        responseTime: 550,
        errorRate: 1.2,
        throughput: 1000,
        cpuUsage: 50,
        memoryUsage: 60,
        activeUsers: 100
      })

      const comparison = monitor.getPerformanceComparison()
      expect(comparison).toHaveLength(2)
      expect(comparison[0]).toMatchObject({
        name: 'response-time',
        baseline: 500,
        current: 550,
        change: 10,
        acceptable: true
      })
    })
  })

  describe('initializeDefaultBaselines', () => {
    it('should set default baselines for common metrics', () => {
      monitor.initializeDefaultBaselines()

      monitor.updateMetrics({
        responseTime: 500,
        errorRate: 1,
        throughput: 1000,
        cpuUsage: 50,
        memoryUsage: 60,
        activeUsers: 100
      })

      const checks = monitor.checkStability()
      expect(checks.length).toBeGreaterThan(0)
    })
  })

  describe('generateStabilityReport', () => {
    beforeEach(() => {
      monitor.initializeDefaultBaselines()
    })

    it('should generate comprehensive stability report', () => {
      monitor.updateMetrics({
        responseTime: 500,
        errorRate: 1,
        throughput: 1000,
        cpuUsage: 50,
        memoryUsage: 60,
        activeUsers: 100
      })

      const report = monitor.generateStabilityReport()
      expect(report).toHaveProperty('stable')
      expect(report).toHaveProperty('checks')
      expect(report).toHaveProperty('trends')
      expect(report).toHaveProperty('recommendations')
    })

    it('should include recommendations for unstable metrics', () => {
      monitor.updateMetrics({
        responseTime: 800, // Unstable
        errorRate: 1,
        throughput: 1000,
        cpuUsage: 50,
        memoryUsage: 60,
        activeUsers: 100
      })

      const report = monitor.generateStabilityReport()
      expect(report.stable).toBe(false)
      expect(report.recommendations.length).toBeGreaterThan(0)
    })

    it('should include trend-based recommendations', () => {
      // Create degrading trend
      for (let i = 0; i < 10; i++) {
        monitor.updateMetrics({
          responseTime: 500 + i * 50,
          errorRate: 1,
          throughput: 1000,
          cpuUsage: 50,
          memoryUsage: 60,
          activeUsers: 100
        })
      }

      const report = monitor.generateStabilityReport()
      const hasTrendRecommendation = report.recommendations.some(
        rec => rec.includes('degrading trend')
      )
      expect(hasTrendRecommendation).toBe(true)
    })
  })

  describe('reset', () => {
    it('should clear all metrics and history', () => {
      monitor.updateMetrics({
        responseTime: 500,
        errorRate: 1,
        throughput: 1000,
        cpuUsage: 50,
        memoryUsage: 60,
        activeUsers: 100
      })

      monitor.reset()

      const checks = monitor.checkStability()
      expect(checks).toHaveLength(0)
    })
  })
})
