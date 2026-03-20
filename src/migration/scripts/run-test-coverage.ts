#!/usr/bin/env node
/**
 * Script to run comprehensive test coverage analysis
 * Usage: npx tsx src/migration/scripts/run-test-coverage.ts [options]
 */

import { TestCoverageSystem } from '../testing/TestCoverageSystem'

async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'comprehensive'

  const system = new TestCoverageSystem({
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80,
  })

  try {
    switch (command) {
      case 'comprehensive':
        await runComprehensive(system)
        break

      case 'entities':
        await validateEntities(system)
        break

      case 'widgets':
        await validateWidgets(system)
        break

      case 'integration':
        await validateIntegration(system)
        break

      case 'e2e':
        await validateE2E(system)
        break

      case 'quality-gates':
        await validateQualityGates(system)
        break

      case 'untested':
        await identifyUntested(system)
        break

      case 'summary':
        await printSummary(system)
        break

      default:
        console.error(`Unknown command: ${command}`)
        printUsage()
        process.exit(1)
    }
  } catch (error) {
    console.error('Error running test coverage:', error)
    process.exit(1)
  }
}

async function runComprehensive(system: TestCoverageSystem) {
  const result = await system.runComprehensiveTests()

  console.log('\n=== Test Results ===')
  console.log(`Total: ${result.testResults.totalTests}`)
  console.log(`Passed: ${result.testResults.passedTests}`)
  console.log(`Failed: ${result.testResults.failedTests}`)
  console.log(`Duration: ${result.testResults.duration}ms`)

  console.log('\n=== Coverage Summary ===')
  console.log(
    `Statements: ${result.coverageAnalysis.overallCoverage.statements.percentage.toFixed(1)}%`
  )
  console.log(
    `Branches: ${result.coverageAnalysis.overallCoverage.branches.percentage.toFixed(1)}%`
  )
  console.log(
    `Functions: ${result.coverageAnalysis.overallCoverage.functions.percentage.toFixed(1)}%`
  )
  console.log(
    `Lines: ${result.coverageAnalysis.overallCoverage.lines.percentage.toFixed(1)}%`
  )

  if (!result.qualityGatesPassed) {
    console.error('\n❌ Quality gates failed')
    process.exit(1)
  }

  console.log('\n✅ All tests and quality gates passed')
}

async function validateEntities(system: TestCoverageSystem) {
  const passed = await system.validateEntityCoverage()
  process.exit(passed ? 0 : 1)
}

async function validateWidgets(system: TestCoverageSystem) {
  const passed = await system.validateWidgetCoverage()
  process.exit(passed ? 0 : 1)
}

async function validateIntegration(system: TestCoverageSystem) {
  const passed = await system.validateIntegrationTests()
  process.exit(passed ? 0 : 1)
}

async function validateE2E(system: TestCoverageSystem) {
  const passed = await system.validateE2ETests()
  process.exit(passed ? 0 : 1)
}

async function validateQualityGates(system: TestCoverageSystem) {
  const passed = await system.validateQualityGates()
  process.exit(passed ? 0 : 1)
}

async function identifyUntested(system: TestCoverageSystem) {
  await system.identifyUntestedCode()
}

async function printSummary(system: TestCoverageSystem) {
  const summary = await system.getCoverageSummary()
  console.log(summary)
}

function printUsage() {
  console.log(`
Usage: npx tsx src/migration/scripts/run-test-coverage.ts [command]

Commands:
  comprehensive    Run comprehensive test suite with coverage (default)
  entities         Validate entity layer coverage
  widgets          Validate widget layer coverage
  integration      Run integration tests
  e2e              Run E2E tests
  quality-gates    Validate all quality gates
  untested         Identify untested code
  summary          Print coverage summary

Examples:
  npx tsx src/migration/scripts/run-test-coverage.ts
  npx tsx src/migration/scripts/run-test-coverage.ts entities
  npx tsx src/migration/scripts/run-test-coverage.ts quality-gates
`)
}

main()
