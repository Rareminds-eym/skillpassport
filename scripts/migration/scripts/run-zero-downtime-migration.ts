/**
 * Script to run zero downtime migration
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

  try {
    // Initialize migration system
    await migration.initialize()

    // Start migration with monitoring
    console.log('\nStarting zero downtime migration...\n')
    const result = await migration.startMigration()

    // Display results
    console.log('\n=== Migration Result ===')
    console.log(`Success: ${result.success}`)
    console.log(`Phase: ${result.phase}`)
    console.log(`Rollout: ${result.rolloutPercentage}%`)
    console.log(`Health: ${result.health.overall}`)

    if (result.errors.length > 0) {
      console.log('\nErrors:')
      result.errors.forEach(err => console.log(`  - ${err}`))
    }

    if (result.warnings.length > 0) {
      console.log('\nWarnings:')
      result.warnings.forEach(warn => console.log(`  - ${warn}`))
    }

    if (result.recommendations.length > 0) {
      console.log('\nRecommendations:')
      result.recommendations.forEach(rec => console.log(`  - ${rec}`))
    }

    // Complete migration if successful
    if (result.success) {
      await migration.completeMigration()
    }

    process.exit(result.success ? 0 : 1)
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

main()
