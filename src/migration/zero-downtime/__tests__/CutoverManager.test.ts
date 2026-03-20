import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CutoverManager } from '../CutoverManager'
import { FeatureFlagManager } from '../FeatureFlagManager'
import { HealthMonitor } from '../HealthMonitor'
import { CutoverPlan } from '../../types/zero-downtime'

describe('CutoverManager', () => {
  let cutoverManager: CutoverManager
  let featureFlagManager: FeatureFlagManager
  let healthMonitor: HealthMonitor
  let cutoverPlan: CutoverPlan

  beforeEach(() => {
    featureFlagManager = new FeatureFlagManager()
    healthMonitor = new HealthMonitor()
    
    // Create a simple test plan with short durations
    cutoverPlan = {
      phases: [
        {
          id: 'phase-1',
          name: 'Initial Rollout',
          description: 'Test phase 1',
          rolloutPercentage: 25,
          duration: 100, // 100ms for testing
          successCriteria: [
            { metric: 'error-rate', operator: 'lt', value: 10, required: true }
          ],
          rollbackConditions: ['error-rate > 20']
        },
        {
          id: 'phase-2',
          name: 'Full Rollout',
          description: 'Test phase 2',
          rolloutPercentage: 100,
          duration: 100,
          successCriteria: [
            { metric: 'error-rate', operator: 'lt', value: 10, required: true }
          ],
          rollbackConditions: ['error-rate > 20']
        }
      ],
      rollbackTriggers: [
        {
          metric: 'error-rate',
          threshold: 20,
          action: 'rollback',
          severity: 'critical'
        }
      ],
      validationChecks: [
        {
          name: 'Health Check',
          type: 'health',
          frequency: 30000,
          timeout: 5000
        }
      ]
    }

    cutoverManager = new CutoverManager(cutoverPlan, featureFlagManager, healthMonitor)
  })

  describe('startCutover', () => {
    it('should complete all phases successfully with healthy metrics', async () => {
      // Setup healthy metrics
      healthMonitor.recordMetric('error-rate', 2, 10)

      const result = await cutoverManager.startCutover()

      expect(result.success).toBe(true)
      expect(result.completedPhases).toBe(2)
      expect(result.totalPhases).toBe(2)
      expect(result.finalRolloutPercentage).toBe(100)
      expect(result.phaseResults).toHaveLength(2)
    })

    it('should stop cutover if phase fails validation', async () => {
      // Setup unhealthy metrics that will fail validation
      healthMonitor.recordMetric('error-rate', 25, 10)
      healthMonitor.recordError('api-error', 25)

      const result = await cutoverManager.startCutover()

      expect(result.success).toBe(false)
      expect(result.completedPhases).toBeLessThan(2)
      expect(result.failureReason).toBeDefined()
    })

    it('should include phase results with metrics', async () => {
      healthMonitor.recordMetric('error-rate', 2, 10)

      const result = await cutoverManager.startCutover()

      expect(result.phaseResults[0]).toMatchObject({
        success: true,
        phase: 'Initial Rollout',
        rolloutPercentage: 25
      })
      expect(result.phaseResults[0].duration).toBeGreaterThan(0)
      expect(result.phaseResults[0].metrics).toBeDefined()
    })
  })

  describe('getCurrentPhase', () => {
    it('should return current phase during execution', () => {
      const phase = cutoverManager.getCurrentPhase()
      expect(phase).toBeDefined()
      expect(phase?.name).toBe('Initial Rollout')
    })
  })

  describe('getProgress', () => {
    it('should return cutover progress information', () => {
      const progress = cutoverManager.getProgress()

      expect(progress).toMatchObject({
        currentPhase: 1,
        totalPhases: 2,
        percentage: 50,
        phaseName: 'Initial Rollout'
      })
    })
  })

  describe('createDefaultPlan', () => {
    it('should create a valid default cutover plan', () => {
      const plan = CutoverManager.createDefaultPlan()

      expect(plan.phases).toHaveLength(4)
      expect(plan.phases[0].rolloutPercentage).toBe(10)
      expect(plan.phases[1].rolloutPercentage).toBe(25)
      expect(plan.phases[2].rolloutPercentage).toBe(50)
      expect(plan.phases[3].rolloutPercentage).toBe(100)
      expect(plan.rollbackTriggers).toBeDefined()
      expect(plan.validationChecks).toBeDefined()
    })

    it('should have increasing rollout percentages', () => {
      const plan = CutoverManager.createDefaultPlan()

      for (let i = 1; i < plan.phases.length; i++) {
        expect(plan.phases[i].rolloutPercentage).toBeGreaterThan(
          plan.phases[i - 1].rolloutPercentage
        )
      }
    })

    it('should have success criteria for each phase', () => {
      const plan = CutoverManager.createDefaultPlan()

      plan.phases.forEach(phase => {
        expect(phase.successCriteria).toBeDefined()
        expect(phase.successCriteria.length).toBeGreaterThan(0)
      })
    })
  })

  describe('phase execution with monitoring', () => {
    it('should monitor health during phase execution', async () => {
      const recordMetricSpy = vi.spyOn(healthMonitor, 'getHealth')
      healthMonitor.recordMetric('error-rate', 2, 10)

      await cutoverManager.startCutover()

      // Health should be checked multiple times during execution
      expect(recordMetricSpy).toHaveBeenCalled()
    })

    it('should capture initial and final metrics', async () => {
      healthMonitor.recordMetric('error-rate', 2, 10)

      const result = await cutoverManager.startCutover()

      expect(result.phaseResults[0].metrics.initialErrorRate).toBeDefined()
      expect(result.phaseResults[0].metrics.finalErrorRate).toBeDefined()
      expect(result.phaseResults[0].metrics.errorRateChange).toBeDefined()
    })
  })

  describe('rollback conditions', () => {
    it('should trigger rollback on critical health', async () => {
      // Simulate critical health
      healthMonitor.recordMetric('error-rate', 30, 10)
      healthMonitor.recordError('api-error', 30)

      const result = await cutoverManager.startCutover()

      expect(result.success).toBe(false)
      expect(result.failureReason).toContain('Rollback conditions triggered')
    })
  })

  describe('success criteria validation', () => {
    it('should pass when criteria are met', async () => {
      healthMonitor.recordMetric('error-rate', 3, 10)

      const result = await cutoverManager.startCutover()

      expect(result.success).toBe(true)
    })

    it('should fail when required criteria are not met', async () => {
      healthMonitor.recordMetric('error-rate', 15, 10)

      const result = await cutoverManager.startCutover()

      expect(result.success).toBe(false)
      expect(result.failureReason).toContain('Success criteria not met')
    })
  })
})
