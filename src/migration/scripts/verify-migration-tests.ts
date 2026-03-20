#!/usr/bin/env node
/**
 * Script to verify tests pass after migration step
 * Usage: npx tsx src/migration/scripts/verify-migration-tests.ts <step-name>
 */

import { TestCoverageSystem } from '../testing/TestCoverageSystem'

async function main() {
  const stepName = process.argv[2]

  if (!stepName) {
    console.error('Error: Migration step name required')
    console.log('Usage: npx tsx src/migration/scripts/verify-migration-tests.ts <step-name>')
    process.exit(1)
  }

  const system = new TestCoverageSystem()

  try {
    const passed = await system.runMigrationStepTests(stepName)

    if (!passed) {
      console.error(`\n❌ Migration tests failed for step: ${stepName}`)
      process.exit(1)
    }

    console.log(`\n✅ Migration tests passed for step: ${stepName}`)
    process.exit(0)
  } catch (error) {
    console.error('Error verifying migration tests:', error)
    process.exit(1)
  }
}

main()
