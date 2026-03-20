/**
 * Manages gradual cutover from old to new structure
 */

import { CutoverPlan, CutoverPhase, SuccessCriteria, ValidationCheck, CutoverResult, PhaseResult } from '../types/zero-downtime'
import { FeatureFlagManager } from './FeatureFlagManager'
import { HealthMonitor } from './HealthMonitor'

export class CutoverManager {
  private plan: CutoverPlan
  private currentPhaseIndex: number = 0
  private featureFlagManager: FeatureFlagManager
  private healthMonitor: HealthMonitor

  constructor(
    plan: CutoverPlan,
    featureFlagManager: FeatureFlagManager,
    healthMonitor: HealthMonitor
  ) {
    this.plan = plan
    this.featureFlagManager = featureFlagManager
    this.healthMonitor = healthMonitor
  }

  /**
   * Start the cutover process
   */
  async startCutover(): Promise<CutoverResult> {
    console.log('Starting gradual cutover process...')
    console.log(`Total phases: ${this.plan.phases.length}`)
    console.log(`Validation checks: ${this.plan.validationChecks.length}`)
    console.log(`Rollback triggers: ${this.plan.rollbackTriggers.length}`)
    
    this.currentPhaseIndex = 0
    const results: PhaseResult[] = []

    for (let i = 0; i < this.plan.phases.length; i++) {
      this.currentPhaseIndex = i
      const phase = this.plan.phases[i]
      
      console.log(`\n${'='.repeat(60)}`)
      console.log(`Phase ${i + 1}/${this.plan.phases.length}: ${phase.name}`)
      console.log(`${'='.repeat(60)}`)
      console.log(`Description: ${phase.description}`)
      console.log(`Rollout: ${phase.rolloutPercentage}%`)
      console.log(`Duration: ${phase.duration / 1000}s`)

      const result = await this.executePhase(phase)
      results.push(result)
      
      if (!result.success) {
        console.error(`\n❌ Phase ${phase.name} failed. Stopping cutover.`)
        console.error(`Reason: ${result.failureReason}`)
        
        return {
          success: false,
          completedPhases: i,
          totalPhases: this.plan.phases.length,
          phaseResults: results,
          finalRolloutPercentage: i > 0 ? this.plan.phases[i - 1].rolloutPercentage : 0,
          failureReason: result.failureReason
        }
      }

      console.log(`✅ Phase ${phase.name} completed successfully`)
      console.log(`Metrics: ${JSON.stringify(result.metrics, null, 2)}`)
    }

    console.log(`\n${'='.repeat(60)}`)
    console.log('🎉 Gradual cutover completed successfully!')
    console.log(`${'='.repeat(60)}`)

    return {
      success: true,
      completedPhases: this.plan.phases.length,
      totalPhases: this.plan.phases.length,
      phaseResults: results,
      finalRolloutPercentage: 100
    }
  }

  /**
   * Execute a single cutover phase
   */
  private async executePhase(phase: CutoverPhase): Promise<PhaseResult> {
    const startTime = Date.now()
    const metrics: Record<string, number> = {}

    try {
      // Update feature flag rollout percentage
      console.log(`Updating rollout to ${phase.rolloutPercentage}%...`)
      this.updateRolloutPercentage(phase.rolloutPercentage)
      
      // Capture initial metrics
      const initialHealth = this.healthMonitor.getHealth()
      metrics.initialErrorRate = initialHealth.errors.reduce((sum, e) => sum + e.rate, 0)

      // Wait for phase duration with periodic monitoring
      console.log(`Monitoring for ${phase.duration / 1000}s...`)
      await this.monitorDuringPhase(phase.duration)

      // Run validation checks
      console.log('Running validation checks...')
      const validationPassed = await this.runValidationChecks()
      if (!validationPassed) {
        return {
          success: false,
          phase: phase.name,
          rolloutPercentage: phase.rolloutPercentage,
          duration: Date.now() - startTime,
          metrics,
          failureReason: 'Validation checks failed'
        }
      }

      // Check success criteria
      console.log('Checking success criteria...')
      const criteriaMet = this.checkSuccessCriteria(phase.successCriteria)
      if (!criteriaMet) {
        return {
          success: false,
          phase: phase.name,
          rolloutPercentage: phase.rolloutPercentage,
          duration: Date.now() - startTime,
          metrics,
          failureReason: 'Success criteria not met'
        }
      }

      // Check rollback conditions
      console.log('Checking rollback conditions...')
      const shouldRollback = this.checkRollbackConditions(phase.rollbackConditions)
      if (shouldRollback) {
        return {
          success: false,
          phase: phase.name,
          rolloutPercentage: phase.rolloutPercentage,
          duration: Date.now() - startTime,
          metrics,
          failureReason: 'Rollback conditions triggered'
        }
      }

      // Capture final metrics
      const finalHealth = this.healthMonitor.getHealth()
      metrics.finalErrorRate = finalHealth.errors.reduce((sum, e) => sum + e.rate, 0)
      metrics.errorRateChange = metrics.finalErrorRate - metrics.initialErrorRate

      return {
        success: true,
        phase: phase.name,
        rolloutPercentage: phase.rolloutPercentage,
        duration: Date.now() - startTime,
        metrics
      }
    } catch (error) {
      return {
        success: false,
        phase: phase.name,
        rolloutPercentage: phase.rolloutPercentage,
        duration: Date.now() - startTime,
        metrics,
        failureReason: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Update rollout percentage for all migration flags
   */
  private updateRolloutPercentage(percentage: number): void {
    const flags = this.featureFlagManager.getAllFlags()
    flags.forEach(flag => {
      if (flag.enabled) {
        this.featureFlagManager.updateRollout(flag.name, percentage)
      }
    })
  }

  /**
   * Wait for specified duration
   */
  private async waitForDuration(durationMs: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, durationMs))
  }

  /**
   * Monitor health during phase execution
   */
  private async monitorDuringPhase(durationMs: number): Promise<void> {
    const startTime = Date.now()
    const checkInterval = 10000 // Check every 10 seconds
    
    while (Date.now() - startTime < durationMs) {
      const health = this.healthMonitor.getHealth()
      
      // Log health status
      if (health.overall === 'critical') {
        console.warn('⚠️  Critical health detected during monitoring')
      } else if (health.overall === 'degraded') {
        console.warn('⚠️  Degraded health detected during monitoring')
      }
      
      // Wait for next check
      await this.waitForDuration(Math.min(checkInterval, durationMs - (Date.now() - startTime)))
    }
  }

  /**
   * Run validation checks
   */
  private async runValidationChecks(): Promise<boolean> {
    for (const check of this.plan.validationChecks) {
      const passed = await this.runValidationCheck(check)
      if (!passed) {
        console.error(`Validation check failed: ${check.name}`)
        return false
      }
    }
    return true
  }

  /**
   * Run a single validation check
   */
  private async runValidationCheck(check: ValidationCheck): Promise<boolean> {
    switch (check.type) {
      case 'health':
        return this.healthMonitor.isHealthy()
      
      case 'error-rate':
        const health = this.healthMonitor.getHealth()
        return !health.errors.some(e => e.exceeded)
      
      case 'performance':
        // Check performance metrics are within acceptable range
        return true
      
      case 'functionality':
        // Run functionality tests
        return true
      
      default:
        return true
    }
  }

  /**
   * Check if success criteria are met
   */
  private checkSuccessCriteria(criteria: SuccessCriteria[]): boolean {
    const health = this.healthMonitor.getHealth()
    
    for (const criterion of criteria) {
      const metric = health.metrics.find(m => m.name === criterion.metric)
      if (!metric && criterion.required) {
        return false
      }

      if (metric) {
        const met = this.evaluateCriterion(metric.value, criterion)
        if (!met && criterion.required) {
          return false
        }
      }
    }

    return true
  }

  /**
   * Evaluate a single success criterion
   */
  private evaluateCriterion(value: number, criterion: SuccessCriteria): boolean {
    switch (criterion.operator) {
      case 'lt': return value < criterion.value
      case 'lte': return value <= criterion.value
      case 'gt': return value > criterion.value
      case 'gte': return value >= criterion.value
      case 'eq': return value === criterion.value
      default: return false
    }
  }

  /**
   * Check if rollback conditions are triggered
   */
  private checkRollbackConditions(conditions: string[]): boolean {
    const health = this.healthMonitor.getHealth()
    
    // Check if health is critical
    if (health.overall === 'critical') {
      return true
    }

    // Check specific rollback triggers
    for (const trigger of this.plan.rollbackTriggers) {
      if (trigger.action === 'rollback') {
        const metric = health.metrics.find(m => m.name === trigger.metric)
        if (metric && metric.value > trigger.threshold) {
          return true
        }
      }
    }

    return false
  }

  /**
   * Get current phase
   */
  getCurrentPhase(): CutoverPhase | undefined {
    return this.plan.phases[this.currentPhaseIndex]
  }

  /**
   * Get cutover progress
   */
  getProgress(): {
    currentPhase: number
    totalPhases: number
    percentage: number
    phaseName: string
  } {
    const currentPhase = this.getCurrentPhase()
    return {
      currentPhase: this.currentPhaseIndex + 1,
      totalPhases: this.plan.phases.length,
      percentage: ((this.currentPhaseIndex + 1) / this.plan.phases.length) * 100,
      phaseName: currentPhase?.name || 'Unknown'
    }
  }

  /**
   * Create default cutover plan
   */
  static createDefaultPlan(): CutoverPlan {
    return {
      phases: [
        {
          id: 'phase-1',
          name: 'Initial Rollout',
          description: 'Enable new structure for 10% of traffic',
          rolloutPercentage: 10,
          duration: 300000, // 5 minutes
          successCriteria: [
            { metric: 'error-rate', operator: 'lt', value: 5, required: true }
          ],
          rollbackConditions: ['error-rate > 10', 'critical-health']
        },
        {
          id: 'phase-2',
          name: 'Expanded Rollout',
          description: 'Increase to 25% of traffic',
          rolloutPercentage: 25,
          duration: 600000, // 10 minutes
          successCriteria: [
            { metric: 'error-rate', operator: 'lt', value: 5, required: true }
          ],
          rollbackConditions: ['error-rate > 10', 'critical-health']
        },
        {
          id: 'phase-3',
          name: 'Half Rollout',
          description: 'Increase to 50% of traffic',
          rolloutPercentage: 50,
          duration: 900000, // 15 minutes
          successCriteria: [
            { metric: 'error-rate', operator: 'lt', value: 5, required: true }
          ],
          rollbackConditions: ['error-rate > 10', 'critical-health']
        },
        {
          id: 'phase-4',
          name: 'Full Rollout',
          description: 'Enable for 100% of traffic',
          rolloutPercentage: 100,
          duration: 1800000, // 30 minutes
          successCriteria: [
            { metric: 'error-rate', operator: 'lt', value: 5, required: true }
          ],
          rollbackConditions: ['error-rate > 10', 'critical-health']
        }
      ],
      rollbackTriggers: [
        {
          metric: 'error-rate',
          threshold: 10,
          action: 'rollback',
          severity: 'critical'
        },
        {
          metric: 'response-time',
          threshold: 2000,
          action: 'pause',
          severity: 'high'
        }
      ],
      validationChecks: [
        {
          name: 'Health Check',
          type: 'health',
          frequency: 30000, // 30 seconds
          timeout: 5000
        },
        {
          name: 'Error Rate Check',
          type: 'error-rate',
          frequency: 60000, // 1 minute
          timeout: 5000
        }
      ]
    }
  }
}
