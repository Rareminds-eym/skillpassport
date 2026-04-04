/**
 * Application health monitoring during migration
 */

import { ApplicationHealth, HealthMetric, ErrorMetric } from '@/shared/types/zero-downtime'

export class HealthMonitor {
  private metrics: Map<string, HealthMetric> = new Map()
  private errorCounts: Map<string, number> = new Map()
  private startTime: Date = new Date()
  private checkInterval: number = 5000 // 5 seconds

  /**
   * Register a health metric to monitor
   */
  registerMetric(name: string, threshold: number): void {
    this.metrics.set(name, {
      name,
      value: 0,
      threshold,
      status: 'healthy',
      timestamp: new Date()
    })
  }

  /**
   * Update a metric value
   */
  updateMetric(name: string, value: number): void {
    const metric = this.metrics.get(name)
    if (metric) {
      metric.value = value
      metric.timestamp = new Date()
      metric.status = this.determineStatus(value, metric.threshold, name)
    }
  }

  /**
   * Determine health status based on metric value
   */
  private determineStatus(
    value: number,
    threshold: number,
    metricName: string
  ): 'healthy' | 'warning' | 'critical' {
    // For error rates, higher is worse
    if (metricName.includes('error') || metricName.includes('failure')) {
      if (value >= threshold * 2) return 'critical'
      if (value >= threshold) return 'warning'
      return 'healthy'
    }

    // For performance metrics, lower might be worse
    if (metricName.includes('response-time') || metricName.includes('latency')) {
      if (value >= threshold * 2) return 'critical'
      if (value >= threshold) return 'warning'
      return 'healthy'
    }

    return 'healthy'
  }

  /**
   * Record an error occurrence
   */
  recordError(errorType: string): void {
    const count = this.errorCounts.get(errorType) || 0
    this.errorCounts.set(errorType, count + 1)
  }

  /**
   * Get current application health
   */
  getHealth(): ApplicationHealth {
    const metrics = Array.from(this.metrics.values())
    const errorMetrics = this.calculateErrorMetrics()
    const warnings = this.generateWarnings(metrics, errorMetrics)
    const overall = this.calculateOverallHealth(metrics, errorMetrics)

    return {
      overall,
      metrics,
      errors: errorMetrics,
      warnings
    }
  }

  /**
   * Calculate error metrics
   */
  private calculateErrorMetrics(): ErrorMetric[] {
    const elapsedMinutes = (Date.now() - this.startTime.getTime()) / 60000
    const errorMetrics: ErrorMetric[] = []

    this.errorCounts.forEach((count, type) => {
      const rate = count / Math.max(elapsedMinutes, 1)
      const threshold = this.getErrorThreshold(type)
      
      errorMetrics.push({
        type,
        count,
        rate,
        threshold,
        exceeded: rate > threshold
      })
    })

    return errorMetrics
  }

  /**
   * Get error threshold for a specific error type
   */
  private getErrorThreshold(errorType: string): number {
    // Default thresholds (errors per minute)
    const thresholds: Record<string, number> = {
      'import-error': 0.1,
      'type-error': 0.5,
      'runtime-error': 1.0,
      'api-error': 2.0,
      'render-error': 0.5
    }

    return thresholds[errorType] || 1.0
  }

  /**
   * Generate warnings based on health status
   */
  private generateWarnings(
    metrics: HealthMetric[],
    errorMetrics: ErrorMetric[]
  ): string[] {
    const warnings: string[] = []

    // Check metric warnings
    metrics.forEach(metric => {
      if (metric.status === 'warning') {
        warnings.push(`${metric.name} is at warning level: ${metric.value} (threshold: ${metric.threshold})`)
      } else if (metric.status === 'critical') {
        warnings.push(`${metric.name} is CRITICAL: ${metric.value} (threshold: ${metric.threshold})`)
      }
    })

    // Check error rate warnings
    errorMetrics.forEach(error => {
      if (error.exceeded) {
        warnings.push(`${error.type} rate exceeded: ${error.rate.toFixed(2)}/min (threshold: ${error.threshold}/min)`)
      }
    })

    return warnings
  }

  /**
   * Calculate overall health status
   */
  private calculateOverallHealth(
    metrics: HealthMetric[],
    errorMetrics: ErrorMetric[]
  ): 'healthy' | 'degraded' | 'critical' {
    const hasCritical = metrics.some(m => m.status === 'critical') ||
                       errorMetrics.some(e => e.exceeded && e.rate > e.threshold * 2)
    
    if (hasCritical) {
      return 'critical'
    }

    const hasWarning = metrics.some(m => m.status === 'warning') ||
                      errorMetrics.some(e => e.exceeded)
    
    if (hasWarning) {
      return 'degraded'
    }

    return 'healthy'
  }

  /**
   * Initialize default health metrics
   */
  initializeDefaultMetrics(): void {
    this.registerMetric('error-rate', 5) // errors per minute
    this.registerMetric('response-time', 1000) // milliseconds
    this.registerMetric('memory-usage', 80) // percentage
    this.registerMetric('cpu-usage', 70) // percentage
  }

  /**
   * Reset monitoring
   */
  reset(): void {
    this.metrics.clear()
    this.errorCounts.clear()
    this.startTime = new Date()
  }

  /**
   * Check if health is acceptable for migration
   */
  isHealthy(): boolean {
    const health = this.getHealth()
    return health.overall !== 'critical'
  }

  /**
   * Should pause migration based on health
   */
  shouldPauseMigration(): boolean {
    const health = this.getHealth()
    return health.overall === 'critical'
  }
}
