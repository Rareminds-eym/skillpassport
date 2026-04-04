/**
 * Main zero downtime migration orchestrator
 */

import { 
  BackwardCompatibilityConfig, 
  ZeroDowntimeResult,
  MigrationMonitoring,
  PerformanceMetric
} from '@/shared/types/zero-downtime'
import { FeatureFlagManager } from './FeatureFlagManager'
import { BackwardCompatibilityManager } from './BackwardCompatibilityManager'
import { HealthMonitor } from './HealthMonitor'
import { CutoverManager } from './CutoverManager'

export class ZeroDowntimeMigration {
  private featureFlagManager: FeatureFlagManager
  private backwardCompatibilityManager: BackwardCompatibilityManager
  private healthMonitor: HealthMonitor
  private cutoverManager: CutoverManager
  private baseDir: string
  private startTime: Date | null = null

  constructor(baseDir: string, config: BackwardCompatibilityConfig) {
    this.baseDir = baseDir
    this.featureFlagManager = new FeatureFlagManager()
    this.backwardCompatibilityManager = new BackwardCompatibilityManager(config)
    this.healthMonitor = new HealthMonitor()
    
    const cutoverPlan = CutoverManager.createDefaultPlan()
    this.cutoverManager = new CutoverManager(
      cutoverPlan,
      this.featureFlagManager,
      this.healthMonitor
    )
  }

  /**
   * Initialize zero downtime migration
   */
  async initialize(): Promise<void> {
    console.log('Initializing zero downtime migration system...')
    
    // Initialize feature flags
    this.featureFlagManager.initializeDefaultFlags()
    
    // Initialize health monitoring
    this.healthMonitor.initializeDefaultMetrics()
    
    // Register backward compatibility re-exports
    this.backwardCompatibilityManager.registerEntityReExports()
    this.backwardCompatibilityManager.registerWidgetReExports()
    
    // Create re-export files
    await this.backwardCompatibilityManager.createReExports(this.baseDir)
    
    console.log('Zero downtime migration system initialized')
  }

  /**
   * Start migration with zero downtime
   */
  async startMigration(): Promise<ZeroDowntimeResult> {
    this.startTime = new Date()
    console.log('Starting zero downtime migration...')

    try {
      // Enable feature flags
      this.enableMigrationFlags()

      // Start health monitoring
      this.startHealthMonitoring()

      // Execute gradual cutover
      await this.cutoverManager.startCutover()

      // Verify production metrics
      const metricsStable = await this.verifyProductionMetrics()
      if (!metricsStable) {
        return this.createResult(false, 'Production metrics unstable')
      }

      // Check if migration completed successfully
      const health = this.healthMonitor.getHealth()
      const success = health.overall !== 'critical'

      return this.createResult(success, 'Migration completed')
    } catch (error) {
      console.error('Migration failed:', error)
      return this.createResult(false, `Migration error: ${error}`)
    }
  }

  /**
   * Enable migration feature flags
   */
  private enableMigrationFlags(): void {
    const flags = this.featureFlagManager.getAllFlags()
    flags.forEach(flag => {
      this.featureFlagManager.enable(flag.name)
    })
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    // In a real implementation, this would set up periodic health checks
    console.log('Health monitoring started')
  }

  /**
   * Verify production metrics remain stable
   */
  private async verifyProductionMetrics(): Promise<boolean> {
    const health = this.healthMonitor.getHealth()
    
    // Check overall health
    if (health.overall === 'critical') {
      console.error('Production health is critical')
      return false
    }

    // Check error rates
    const hasHighErrors = health.errors.some(e => e.exceeded)
    if (hasHighErrors) {
      console.error('Error rates exceeded thresholds')
      return false
    }

    // Check performance metrics
    const hasPerformanceIssues = health.metrics.some(
      m => m.status === 'critical' && m.name.includes('performance')
    )
    if (hasPerformanceIssues) {
      console.error('Performance metrics degraded')
      return false
    }

    return true
  }

  /**
   * Create migration result
   */
  private createResult(success: boolean, message: string): ZeroDowntimeResult {
    const health = this.healthMonitor.getHealth()
    const progress = this.cutoverManager.getProgress()
    const errors: string[] = []
    const warnings: string[] = []
    const recommendations: string[] = []

    if (!success) {
      errors.push(message)
    }

    // Add health warnings
    warnings.push(...health.warnings)

    // Add recommendations based on health
    if (health.overall === 'degraded') {
      recommendations.push('Monitor application closely for the next 24 hours')
    }

    if (health.errors.some(e => e.exceeded)) {
      recommendations.push('Investigate error rate increases')
    }

    return {
      success,
      phase: progress.phaseName,
      health,
      rolloutPercentage: progress.percentage,
      errors,
      warnings,
      recommendations
    }
  }

  /**
   * Get current migration monitoring status
   */
  getMonitoringStatus(): MigrationMonitoring {
    const health = this.healthMonitor.getHealth()
    const progress = this.cutoverManager.getProgress()
    const performanceMetrics = this.calculatePerformanceMetrics()

    return {
      startTime: this.startTime || new Date(),
      currentPhase: progress.phaseName,
      health,
      rolloutPercentage: progress.percentage,
      affectedUsers: Math.floor((progress.percentage / 100) * 1000), // Estimate
      errorRate: this.calculateErrorRate(),
      performanceMetrics
    }
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(): PerformanceMetric[] {
    const health = this.healthMonitor.getHealth()
    const metrics: PerformanceMetric[] = []

    health.metrics.forEach(metric => {
      if (metric.name.includes('response-time') || metric.name.includes('performance')) {
        metrics.push({
          name: metric.name,
          baseline: metric.threshold,
          current: metric.value,
          change: ((metric.value - metric.threshold) / metric.threshold) * 100,
          acceptable: metric.status !== 'critical'
        })
      }
    })

    return metrics
  }

  /**
   * Calculate overall error rate
   */
  private calculateErrorRate(): number {
    const health = this.healthMonitor.getHealth()
    const errorMetric = health.errors.find(e => e.type === 'runtime-error')
    return errorMetric?.rate || 0
  }

  /**
   * Pause migration if health degrades
   */
  async pauseMigration(): Promise<void> {
    console.log('Pausing migration due to health issues')
    // Disable feature flags to stop rollout
    const flags = this.featureFlagManager.getAllFlags()
    flags.forEach(flag => {
      this.featureFlagManager.disable(flag.name)
    })
  }

  /**
   * Resume migration after issues resolved
   */
  async resumeMigration(): Promise<void> {
    console.log('Resuming migration')
    this.enableMigrationFlags()
  }

  /**
   * Complete migration and cleanup
   */
  async completeMigration(): Promise<void> {
    console.log('Completing migration...')
    
    // Check if re-exports can be removed
    const canRemove = await this.backwardCompatibilityManager.canRemoveReExports(this.baseDir)
    
    if (canRemove) {
      await this.backwardCompatibilityManager.removeReExports(this.baseDir)
      console.log('Backward compatibility re-exports removed')
    } else {
      console.log('Re-exports still needed, keeping them in place')
    }

    // Generate final report
    const compatReport = this.backwardCompatibilityManager.generateReport()
    console.log('Backward compatibility report:', compatReport)
  }

  /**
   * Get feature flag manager
   */
  getFeatureFlagManager(): FeatureFlagManager {
    return this.featureFlagManager
  }

  /**
   * Get health monitor
   */
  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor
  }

  /**
   * Get backward compatibility manager
   */
  getBackwardCompatibilityManager(): BackwardCompatibilityManager {
    return this.backwardCompatibilityManager
  }
}
