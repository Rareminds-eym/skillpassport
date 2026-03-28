/**
 * Production metrics monitoring and stability verification
 */

import { PerformanceMetric } from '@/shared/types/zero-downtime'

export interface ProductionMetrics {
  responseTime: number
  errorRate: number
  throughput: number
  cpuUsage: number
  memoryUsage: number
  activeUsers: number
}

export interface MetricBaseline {
  metric: string
  baseline: number
  tolerance: number // percentage
}

export interface StabilityCheck {
  metric: string
  stable: boolean
  current: number
  baseline: number
  deviation: number
}

export class ProductionMonitor {
  private baselines: Map<string, MetricBaseline> = new Map()
  private currentMetrics: ProductionMetrics | null = null
  private metricsHistory: ProductionMetrics[] = []
  private maxHistorySize: number = 100

  /**
   * Set baseline metrics for comparison
   */
  setBaseline(metric: string, baseline: number, tolerance: number = 10): void {
    this.baselines.set(metric, { metric, baseline, tolerance })
  }

  /**
   * Update current production metrics
   */
  updateMetrics(metrics: ProductionMetrics): void {
    this.currentMetrics = metrics
    this.metricsHistory.push(metrics)

    // Keep history size manageable
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift()
    }
  }

  /**
   * Check if production metrics are stable
   */
  checkStability(): StabilityCheck[] {
    if (!this.currentMetrics) {
      return []
    }

    const checks: StabilityCheck[] = []

    this.baselines.forEach((baseline, metric) => {
      const current = this.getCurrentMetricValue(metric)
      const deviation = this.calculateDeviation(current, baseline.baseline)
      const stable = Math.abs(deviation) <= baseline.tolerance

      checks.push({
        metric,
        stable,
        current,
        baseline: baseline.baseline,
        deviation
      })
    })

    return checks
  }

  /**
   * Get current value for a specific metric
   */
  private getCurrentMetricValue(metric: string): number {
    if (!this.currentMetrics) {
      return 0
    }

    const metricMap: Record<string, number> = {
      'response-time': this.currentMetrics.responseTime,
      'error-rate': this.currentMetrics.errorRate,
      'throughput': this.currentMetrics.throughput,
      'cpu-usage': this.currentMetrics.cpuUsage,
      'memory-usage': this.currentMetrics.memoryUsage,
      'active-users': this.currentMetrics.activeUsers
    }

    return metricMap[metric] || 0
  }

  /**
   * Calculate percentage deviation from baseline
   */
  private calculateDeviation(current: number, baseline: number): number {
    if (baseline === 0) {
      return 0
    }
    return ((current - baseline) / baseline) * 100
  }

  /**
   * Verify all metrics are stable
   */
  areMetricsStable(): boolean {
    const checks = this.checkStability()
    return checks.every(check => check.stable)
  }

  /**
   * Get metrics that are unstable
   */
  getUnstableMetrics(): StabilityCheck[] {
    return this.checkStability().filter(check => !check.stable)
  }

  /**
   * Calculate metric trends over time
   */
  calculateTrends(): Record<string, 'improving' | 'stable' | 'degrading'> {
    if (this.metricsHistory.length < 2) {
      return {}
    }

    const trends: Record<string, 'improving' | 'stable' | 'degrading'> = {}
    const recent = this.metricsHistory.slice(-10)

    // Calculate trend for each metric
    const metrics = ['responseTime', 'errorRate', 'throughput', 'cpuUsage', 'memoryUsage']
    
    metrics.forEach(metric => {
      const values = recent.map(m => (m as any)[metric])
      const trend = this.calculateTrend(values)
      trends[metric] = trend
    })

    return trends
  }

  /**
   * Calculate trend direction from values
   */
  private calculateTrend(values: number[]): 'improving' | 'stable' | 'degrading' {
    if (values.length < 2) {
      return 'stable'
    }

    const first = values[0]
    const last = values[values.length - 1]
    const change = ((last - first) / first) * 100

    if (Math.abs(change) < 5) {
      return 'stable'
    }

    // For error rates and resource usage, lower is better
    return change < 0 ? 'improving' : 'degrading'
  }

  /**
   * Get performance comparison
   */
  getPerformanceComparison(): PerformanceMetric[] {
    if (!this.currentMetrics) {
      return []
    }

    const metrics: PerformanceMetric[] = []

    this.baselines.forEach((baseline, metric) => {
      const current = this.getCurrentMetricValue(metric)
      const change = this.calculateDeviation(current, baseline.baseline)
      const acceptable = Math.abs(change) <= baseline.tolerance

      metrics.push({
        name: metric,
        baseline: baseline.baseline,
        current,
        change,
        acceptable
      })
    })

    return metrics
  }

  /**
   * Initialize default baselines
   */
  initializeDefaultBaselines(): void {
    this.setBaseline('response-time', 500, 20) // 500ms ±20%
    this.setBaseline('error-rate', 1, 50) // 1% ±50%
    this.setBaseline('throughput', 1000, 15) // 1000 req/s ±15%
    this.setBaseline('cpu-usage', 50, 30) // 50% ±30%
    this.setBaseline('memory-usage', 60, 25) // 60% ±25%
  }

  /**
   * Generate stability report
   */
  generateStabilityReport(): {
    stable: boolean
    checks: StabilityCheck[]
    trends: Record<string, 'improving' | 'stable' | 'degrading'>
    recommendations: string[]
  } {
    const checks = this.checkStability()
    const trends = this.calculateTrends()
    const stable = checks.every(check => check.stable)
    const recommendations: string[] = []

    // Generate recommendations based on unstable metrics
    checks.forEach(check => {
      if (!check.stable) {
        recommendations.push(
          `${check.metric} has deviated ${check.deviation.toFixed(1)}% from baseline (current: ${check.current}, baseline: ${check.baseline})`
        )
      }
    })

    // Add trend-based recommendations
    Object.entries(trends).forEach(([metric, trend]) => {
      if (trend === 'degrading') {
        recommendations.push(`${metric} is showing a degrading trend`)
      }
    })

    return {
      stable,
      checks,
      trends,
      recommendations
    }
  }

  /**
   * Reset monitoring
   */
  reset(): void {
    this.currentMetrics = null
    this.metricsHistory = []
  }
}
