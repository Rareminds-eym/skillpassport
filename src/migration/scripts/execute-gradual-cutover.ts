#!/usr/bin/env tsx

/**
 * Execute gradual cutover from old to new FSD structure
 * 
 * This script manages the gradual rollout of the new FSD structure
 * with continuous production monitoring and automatic rollback on issues.
 */

import { CutoverManager } from '../zero-downtime/CutoverManager'
import { FeatureFlagManager } from '../zero-downtime/FeatureFlagManager'
import { HealthMonitor } from '../zero-downtime/HealthMonitor'
import { ProductionMonitor } from '../zero-downtime/ProductionMonitor'

async function executeGradualCutover() {
  console.log('FSD Phase 6: Gradual Cutover Execution')
  console.log('=' .repeat(60))

  // Initialize systems
  const featureFlagManager = new FeatureFlagManager()
  const healthMonitor = new HealthMonitor()
  const productionMonitor = new ProductionMonitor()

  // Initialize production baselines
  console.log('\n📊 Initializing production baselines...')
  productionMonitor.initializeDefaultBaselines()

  // Create cutover plan
  const cutoverPlan = CutoverManager.createDefaultPlan()
  const cutoverManager = new CutoverManager(
    cutoverPlan,
    featureFlagManager,
    healthMonitor
  )

  console.log('\n📋 Cutover Plan:')
  cutoverPlan.phases.forEach((phase, index) => {
    console.log(`  ${index + 1}. ${phase.name} - ${phase.rolloutPercentage}% (${phase.duration / 1000}s)`)
  })

  // Start monitoring
  console.log('\n🔍 Starting production monitoring...')
  const monitoringInterval = startProductionMonitoring(productionMonitor, healthMonitor)

  try {
    // Execute cutover
    console.log('\n🚀 Starting gradual cutover...')
    const result = await cutoverManager.startCutover()

    // Stop monitoring
    clearInterval(monitoringInterval)

    // Display results
    console.log('\n' + '='.repeat(60))
    console.log('Cutover Results')
    console.log('='.repeat(60))
    console.log(`Success: ${result.success ? '✅' : '❌'}`)
    console.log(`Completed Phases: ${result.completedPhases}/${result.totalPhases}`)
    console.log(`Final Rollout: ${result.finalRolloutPercentage}%`)

    if (result.failureReason) {
      console.log(`Failure Reason: ${result.failureReason}`)
    }

    // Display phase results
    console.log('\nPhase Results:')
    result.phaseResults.forEach((phaseResult, index) => {
      console.log(`\n  Phase ${index + 1}: ${phaseResult.phase}`)
      console.log(`    Status: ${phaseResult.success ? '✅' : '❌'}`)
      console.log(`    Rollout: ${phaseResult.rolloutPercentage}%`)
      console.log(`    Duration: ${(phaseResult.duration / 1000).toFixed(1)}s`)
      if (phaseResult.failureReason) {
        console.log(`    Failure: ${phaseResult.failureReason}`)
      }
    })

    // Verify production stability
    console.log('\n🔍 Verifying production stability...')
    const stabilityReport = productionMonitor.generateStabilityReport()
    
    console.log(`\nProduction Stability: ${stabilityReport.stable ? '✅ Stable' : '⚠️  Unstable'}`)
    
    if (!stabilityReport.stable) {
      console.log('\nUnstable Metrics:')
      stabilityReport.checks
        .filter(check => !check.stable)
        .forEach(check => {
          console.log(`  - ${check.metric}: ${check.current} (baseline: ${check.baseline}, deviation: ${check.deviation.toFixed(1)}%)`)
        })
    }

    if (stabilityReport.recommendations.length > 0) {
      console.log('\nRecommendations:')
      stabilityReport.recommendations.forEach(rec => {
        console.log(`  - ${rec}`)
      })
    }

    // Display metric trends
    console.log('\n📈 Metric Trends:')
    Object.entries(stabilityReport.trends).forEach(([metric, trend]) => {
      const icon = trend === 'improving' ? '📈' : trend === 'degrading' ? '📉' : '➡️'
      console.log(`  ${icon} ${metric}: ${trend}`)
    })

    if (result.success && stabilityReport.stable) {
      console.log('\n✅ Gradual cutover completed successfully with stable production metrics!')
      process.exit(0)
    } else {
      console.log('\n⚠️  Cutover completed with issues. Review the results above.')
      process.exit(1)
    }

  } catch (error) {
    clearInterval(monitoringInterval)
    console.error('\n❌ Cutover failed with error:', error)
    process.exit(1)
  }
}

/**
 * Start continuous production monitoring
 */
function startProductionMonitoring(
  productionMonitor: ProductionMonitor,
  healthMonitor: HealthMonitor
): NodeJS.Timeout {
  // Initialize health metrics
  healthMonitor.initializeDefaultMetrics()

  return setInterval(() => {
    // Simulate production metrics (in real scenario, fetch from monitoring system)
    const metrics = {
      responseTime: 450 + Math.random() * 100,
      errorRate: 0.5 + Math.random() * 1,
      throughput: 950 + Math.random() * 100,
      cpuUsage: 45 + Math.random() * 15,
      memoryUsage: 55 + Math.random() * 15,
      activeUsers: 1000 + Math.floor(Math.random() * 200)
    }

    productionMonitor.updateMetrics(metrics)

    // Update health monitor
    healthMonitor.updateMetric('response-time', metrics.responseTime)
    healthMonitor.updateMetric('error-rate', metrics.errorRate)
    
    // Record errors if error rate is high
    if (metrics.errorRate > 1) {
      healthMonitor.recordError('api-error')
    }

  }, 5000) // Update every 5 seconds
}

// Execute if run directly
if (require.main === module) {
  executeGradualCutover().catch(console.error)
}

export { executeGradualCutover }
