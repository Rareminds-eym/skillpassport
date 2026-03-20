/**
 * Script to monitor migration health in real-time
 */

import { ZeroDowntimeMigration } from '../zero-downtime/ZeroDowntimeMigration'

async function main() {
  const baseDir = process.cwd()
  
  const config = {
    maintainReExports: true,
    deprecationWarnings: true,
    fallbackToOldPaths: true
  }

  const migration = new ZeroDowntimeMigration(baseDir, config)
  await migration.initialize()

  // Monitor health every 10 seconds
  const interval = setInterval(() => {
    const status = migration.getMonitoringStatus()
    
    console.clear()
    console.log('=== Migration Health Monitor ===\n')
    console.log(`Phase: ${status.currentPhase}`)
    console.log(`Rollout: ${status.rolloutPercentage.toFixed(1)}%`)
    console.log(`Health: ${status.health.overall}`)
    console.log(`Error Rate: ${status.errorRate.toFixed(2)}/min`)
    console.log(`Affected Users: ~${status.affectedUsers}`)
    
    console.log('\nMetrics:')
    status.health.metrics.forEach(metric => {
      const icon = metric.status === 'healthy' ? '✓' : 
                   metric.status === 'warning' ? '⚠' : '✗'
      console.log(`  ${icon} ${metric.name}: ${metric.value} (threshold: ${metric.threshold})`)
    })

    if (status.health.errors.length > 0) {
      console.log('\nErrors:')
      status.health.errors.forEach(error => {
        const icon = error.exceeded ? '✗' : '✓'
        console.log(`  ${icon} ${error.type}: ${error.rate.toFixed(2)}/min (threshold: ${error.threshold}/min)`)
      })
    }

    if (status.health.warnings.length > 0) {
      console.log('\nWarnings:')
      status.health.warnings.forEach(warn => console.log(`  ⚠ ${warn}`))
    }

    console.log('\nPress Ctrl+C to stop monitoring')

    // Check if should pause
    const healthMonitor = migration.getHealthMonitor()
    if (healthMonitor.shouldPauseMigration()) {
      console.log('\n⚠ CRITICAL: Migration should be paused!')
      migration.pauseMigration()
    }
  }, 10000)

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    clearInterval(interval)
    console.log('\nMonitoring stopped')
    process.exit(0)
  })
}

main()
