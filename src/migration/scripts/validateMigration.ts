#!/usr/bin/env node

import { createValidationRunner } from '../validation/ValidationRunner'
import { createMigrationLogger } from '../logging/MigrationLogger'
import { defaultConfig } from "@/shared/config/defaultConfig"
import { MigrationConfig } from '../types'

/**
 * CLI script for running migration validation
 * Usage: npm run validate:migration [pre|post]
 */
async function main() {
  const args = process.argv.slice(2)
  const phase = args[0] as 'pre' | 'post' || 'pre'
  
  if (!['pre', 'post'].includes(phase)) {
    console.error('Usage: npm run validate:migration [pre|post]')
    process.exit(1)
  }

  const logger = createMigrationLogger()
  const config: MigrationConfig = {
    ...defaultConfig,
    dryRun: false
  }

  const validationRunner = createValidationRunner(config, logger)

  try {
    console.log(`\n🔍 Running ${phase}-migration validation...\n`)

    let result
    if (phase === 'pre') {
      const { result: validationResult, report } = await validationRunner.runValidationWithReport('pre')
      result = validationResult
      
      // Display results
      displayValidationResults(report)
      
    } else {
      // For post-migration, we need to load integration and import data
      // This is a simplified version - in practice, this data would come from the migration process
      const integrations = []
      const importUpdates = []
      
      const { result: validationResult, report } = await validationRunner.runValidationWithReport(
        'post', 
        integrations, 
        importUpdates
      )
      result = validationResult
      
      displayValidationResults(report)
    }

    // Exit with appropriate code
    const success = result.testsPass && result.endpointsAccessible && result.importPathsResolved
    if (phase === 'post') {
      success && result.storeIntegrationsValid
    }

    if (success) {
      console.log('\n✅ Validation completed successfully!')
      process.exit(0)
    } else {
      console.log('\n❌ Validation failed - see errors above')
      process.exit(1)
    }

  } catch (error) {
    logger.error('Validation failed with error', { error: error.message })
    console.error('\n💥 Validation failed with error:', error.message)
    process.exit(1)
  }
}

function displayValidationResults(report: any) {
  console.log(`📊 Validation Report (${report.phase}-migration)`)
  console.log(`⏰ Timestamp: ${report.timestamp}`)
  console.log(`🎯 Overall Status: ${report.overall.passed ? '✅ PASSED' : '❌ FAILED'}`)
  
  if (report.overall.criticalIssues > 0) {
    console.log(`🚨 Critical Issues: ${report.overall.criticalIssues}`)
  }
  
  if (report.overall.warnings > 0) {
    console.log(`⚠️  Warnings: ${report.overall.warnings}`)
  }

  console.log('\n📋 Details:')
  console.log(`  Tests: ${report.details.tests.status} (${report.details.tests.passed}/${report.details.tests.total})`)
  console.log(`  Endpoints: ${report.details.endpoints.status} (${report.details.endpoints.accessible}/${report.details.endpoints.total})`)
  console.log(`  Imports: ${report.details.imports.status} (${report.details.imports.issues} issues)`)
  
  if (report.details.integrations) {
    console.log(`  Store Integrations: ${report.details.integrations.status} (${report.details.integrations.valid}/${report.details.integrations.total})`)
  }

  if (report.errors.length > 0) {
    console.log('\n🚨 Errors:')
    report.errors.forEach((error: any, index: number) => {
      console.log(`  ${index + 1}. [${error.type.toUpperCase()}] ${error.message}`)
      if (error.file) {
        console.log(`     File: ${error.file}`)
      }
      if (error.suggestion) {
        console.log(`     💡 Suggestion: ${error.suggestion}`)
      }
    })
  }

  if (report.warnings.length > 0) {
    console.log('\n⚠️  Warnings:')
    report.warnings.forEach((warning: string, index: number) => {
      console.log(`  ${index + 1}. ${warning}`)
    })
  }

  if (report.recommendations.length > 0) {
    console.log('\n💡 Recommendations:')
    report.recommendations.forEach((rec: string, index: number) => {
      console.log(`  ${index + 1}. ${rec}`)
    })
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error)
    process.exit(1)
  })
}

export { main as validateMigration }