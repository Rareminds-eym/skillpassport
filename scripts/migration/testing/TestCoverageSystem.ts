/**
 * Comprehensive test execution and coverage system
 * Integrates test runner, coverage analyzer, and quality gates
 */

import { TestRunner } from './TestRunner'
import { CoverageAnalyzer } from './CoverageAnalyzer'
import { IntegrationTestValidator } from './IntegrationTestValidator'
import { QualityGateValidator } from './QualityGateValidator'
import type {
  TestExecutionConfig,
  TestExecutionResult,
  TestCoverageAnalysis,
  CoverageThreshold,
} from '@/shared/types/test-coverage'

export class TestCoverageSystem {
  private testRunner: TestRunner
  private coverageAnalyzer: CoverageAnalyzer
  private integrationValidator: IntegrationTestValidator
  private qualityGateValidator: QualityGateValidator

  constructor(coverageThreshold?: CoverageThreshold) {
    this.testRunner = new TestRunner()
    this.coverageAnalyzer = new CoverageAnalyzer()
    this.integrationValidator = new IntegrationTestValidator()
    this.qualityGateValidator = new QualityGateValidator(coverageThreshold)
  }

  /**
   * Run comprehensive test suite with coverage analysis
   */
  async runComprehensiveTests(): Promise<{
    testResults: TestExecutionResult
    coverageAnalysis: TestCoverageAnalysis
    qualityGatesPassed: boolean
  }> {
    console.log('\n=== Running Comprehensive Test Suite ===\n')

    // Run all tests
    console.log('Running unit tests...')
    const unitTests = await this.testRunner.runUnitTests()

    console.log('Running integration tests...')
    const integrationTests = await this.testRunner.runIntegrationTests()

    // Combine results
    const testResults: TestExecutionResult = {
      success: unitTests.success && integrationTests.success,
      totalTests: unitTests.totalTests + integrationTests.totalTests,
      passedTests: unitTests.passedTests + integrationTests.passedTests,
      failedTests: unitTests.failedTests + integrationTests.failedTests,
      skippedTests: unitTests.skippedTests + integrationTests.skippedTests,
      duration: unitTests.duration + integrationTests.duration,
      failures: [...unitTests.failures, ...integrationTests.failures],
    }

    // Analyze coverage
    console.log('\nAnalyzing test coverage...')
    const coverageAnalysis = await this.coverageAnalyzer.analyzeCoverage()

    // Validate quality gates
    console.log('\nValidating quality gates...')
    const qualityGatesPassed =
      this.qualityGateValidator.validateQualityGates(coverageAnalysis)

    return {
      testResults,
      coverageAnalysis,
      qualityGatesPassed,
    }
  }

  /**
   * Run tests for specific migration step
   */
  async runMigrationStepTests(stepName: string): Promise<boolean> {
    console.log(`\n=== Testing Migration Step: ${stepName} ===\n`)

    const result = await this.testRunner.runMigrationStepTests(stepName)

    if (!result.success) {
      console.error(`\n❌ Migration step tests failed for ${stepName}`)
      result.failures.forEach((failure) => {
        console.error(`  ${failure.testFile}: ${failure.error}`)
      })
      return false
    }

    console.log(`✅ Migration step tests passed for ${stepName}`)
    return true
  }

  /**
   * Validate entity layer coverage
   */
  async validateEntityCoverage(): Promise<boolean> {
    console.log('\n=== Validating Entity Layer Coverage ===\n')

    const analysis = await this.coverageAnalyzer.analyzeCoverage()
    const entityLayer = analysis.layerCoverage.find((l) => l.layer === 'entities')

    if (!entityLayer) {
      console.error('❌ No entity layer found')
      return false
    }

    const threshold = 80
    const coverage = entityLayer.coverage.statements.percentage

    if (coverage < threshold) {
      console.error(
        `❌ Entity coverage is ${coverage.toFixed(1)}%, below ${threshold}% threshold`
      )
      return false
    }

    console.log(`✅ Entity coverage is ${coverage.toFixed(1)}%`)
    return true
  }

  /**
   * Validate widget layer coverage
   */
  async validateWidgetCoverage(): Promise<boolean> {
    console.log('\n=== Validating Widget Layer Coverage ===\n')

    const analysis = await this.coverageAnalyzer.analyzeCoverage()
    const widgetLayer = analysis.layerCoverage.find((l) => l.layer === 'widgets')

    if (!widgetLayer) {
      console.warn('⚠️  No widget layer found')
      return true // Not a failure if no widgets exist yet
    }

    const threshold = 80
    const coverage = widgetLayer.coverage.statements.percentage

    if (coverage < threshold) {
      console.error(
        `❌ Widget coverage is ${coverage.toFixed(1)}%, below ${threshold}% threshold`
      )
      return false
    }

    console.log(`✅ Widget coverage is ${coverage.toFixed(1)}%`)
    return true
  }

  /**
   * Run integration tests and validate
   */
  async validateIntegrationTests(): Promise<boolean> {
    console.log('\n=== Validating Integration Tests ===\n')

    const results = await this.integrationValidator.runIntegrationTests()

    const allPassed = results.every((r) => r.success)

    if (!allPassed) {
      console.error('\n❌ Integration test failures:')
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          console.error(`  - ${r.feature}`)
        })
      return false
    }

    console.log(`✅ All integration tests passed (${results.length} features)`)
    return true
  }

  /**
   * Run E2E tests and validate
   */
  async validateE2ETests(): Promise<boolean> {
    console.log('\n=== Validating E2E Tests ===\n')

    const results = await this.integrationValidator.runE2ETests()

    const allPassed = results.every((r) => r.passed)

    if (!allPassed) {
      console.error('\n❌ E2E test failures:')
      results
        .filter((r) => !r.passed)
        .forEach((r) => {
          console.error(`  - ${r.workflow}: ${r.error}`)
        })
      return false
    }

    console.log(`✅ All E2E tests passed (${results.length} workflows)`)
    return true
  }

  /**
   * Validate all quality gates
   */
  async validateQualityGates(): Promise<boolean> {
    console.log('\n=== Validating Quality Gates ===\n')

    const analysis = await this.coverageAnalyzer.analyzeCoverage()

    // Check coverage thresholds
    const coverageGates = this.qualityGateValidator.checkCoverageThresholds(analysis)

    // Check critical path coverage
    const criticalPathGate =
      this.qualityGateValidator.checkCriticalPathCoverage(analysis)

    // Run tests to check success rate
    const testResult = await this.testRunner.runTests({ coverage: false })
    const testSuccessGate = this.qualityGateValidator.checkTestSuccessRate(
      testResult.passedTests,
      testResult.totalTests
    )

    const allGates = [...coverageGates, criticalPathGate, testSuccessGate]

    this.qualityGateValidator.printSummary(allGates)

    return allGates.every((gate) => gate.passed)
  }

  /**
   * Get coverage summary
   */
  async getCoverageSummary(): Promise<string> {
    const analysis = await this.coverageAnalyzer.analyzeCoverage()

    const lines = [
      'Coverage Summary:',
      `  Statements: ${analysis.overallCoverage.statements.percentage.toFixed(1)}%`,
      `  Branches: ${analysis.overallCoverage.branches.percentage.toFixed(1)}%`,
      `  Functions: ${analysis.overallCoverage.functions.percentage.toFixed(1)}%`,
      `  Lines: ${analysis.overallCoverage.lines.percentage.toFixed(1)}%`,
    ]

    if (analysis.layerCoverage.length > 0) {
      lines.push('\nLayer Coverage:')
      analysis.layerCoverage.forEach((layer) => {
        lines.push(
          `  ${layer.layer}: ${layer.coverage.statements.percentage.toFixed(1)}%`
        )
      })
    }

    return lines.join('\n')
  }

  /**
   * Identify untested code
   */
  async identifyUntestedCode(): Promise<void> {
    const analysis = await this.coverageAnalyzer.analyzeCoverage()

    if (analysis.untested.length === 0) {
      console.log('✅ All code is tested')
      return
    }

    console.log(`\n⚠️  Found ${analysis.untested.length} untested code paths:\n`)

    const highPriority = analysis.untested.filter((u) => u.priority === 'high')
    if (highPriority.length > 0) {
      console.log('High Priority:')
      highPriority.forEach((u) => {
        console.log(`  - ${u.file} (${u.lines.length} uncovered lines)`)
      })
    }

    const mediumPriority = analysis.untested.filter((u) => u.priority === 'medium')
    if (mediumPriority.length > 0) {
      console.log('\nMedium Priority:')
      mediumPriority.forEach((u) => {
        console.log(`  - ${u.file} (${u.lines.length} uncovered lines)`)
      })
    }
  }

  /**
   * Verify tests pass after migration
   */
  async verifyPostMigration(): Promise<boolean> {
    console.log('\n=== Post-Migration Test Verification ===\n')

    // Run all tests
    const testResult = await this.testRunner.runTests({ coverage: true })

    if (!testResult.success) {
      console.error('❌ Tests failed after migration')
      return false
    }

    // Validate coverage
    const analysis = await this.coverageAnalyzer.analyzeCoverage()
    const qualityGatesPassed =
      this.qualityGateValidator.validateQualityGates(analysis)

    if (!qualityGatesPassed) {
      console.error('❌ Quality gates failed after migration')
      return false
    }

    console.log('✅ Post-migration verification passed')
    return true
  }
}
