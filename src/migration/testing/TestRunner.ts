/**
 * Test runner integration for migration steps
 * Executes tests and collects results
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import type {
  TestExecutionConfig,
  TestExecutionResult,
  TestFailure,
  TestRunnerConfig,
} from '../types/test-coverage'

export class TestRunner {
  private config: TestRunnerConfig

  constructor(config: TestRunnerConfig = { runner: 'vitest' }) {
    this.config = config
  }

  /**
   * Run tests with specified configuration
   */
  async runTests(config: TestExecutionConfig = {}): Promise<TestExecutionResult> {
    const startTime = Date.now()

    try {
      const command = this.buildTestCommand(config)
      const output = execSync(command, {
        encoding: 'utf-8',
        stdio: 'pipe',
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      })

      const result = this.parseTestOutput(output)
      result.duration = Date.now() - startTime

      return result
    } catch (error: any) {
      // Test failures throw errors in exec, parse the output anyway
      const output = error.stdout || error.stderr || ''
      const result = this.parseTestOutput(output)
      result.duration = Date.now() - startTime
      result.success = false

      return result
    }
  }

  /**
   * Run tests for specific migration step
   */
  async runMigrationStepTests(
    stepName: string,
    testPattern?: string
  ): Promise<TestExecutionResult> {
    const config: TestExecutionConfig = {
      testPattern: testPattern || `**/${stepName}/**/*.test.ts`,
      coverage: true,
    }

    return this.runTests(config)
  }

  /**
   * Run unit tests
   */
  async runUnitTests(pattern?: string): Promise<TestExecutionResult> {
    return this.runTests({
      testPattern: pattern || '**/__tests__/**/*.test.ts',
      testTypes: ['unit'],
      coverage: true,
    })
  }

  /**
   * Run integration tests
   */
  async runIntegrationTests(): Promise<TestExecutionResult> {
    return this.runTests({
      testPattern: '**/__tests__/**/integration.test.ts',
      testTypes: ['integration'],
      coverage: true,
    })
  }

  /**
   * Run e2e tests
   */
  async runE2ETests(): Promise<TestExecutionResult> {
    try {
      const output = execSync('npm run test:e2e', {
        encoding: 'utf-8',
        stdio: 'pipe',
      })

      return {
        success: true,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        duration: 0,
        failures: [],
      }
    } catch (error: any) {
      return {
        success: false,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        duration: 0,
        failures: [
          {
            testName: 'E2E Tests',
            testFile: 'tests/e2e',
            error: error.message,
          },
        ],
      }
    }
  }

  /**
   * Run property-based tests
   */
  async runPropertyTests(): Promise<TestExecutionResult> {
    return this.runTests({
      testPattern: 'src/__tests__/property/**/*.test.ts',
      testTypes: ['property'],
      coverage: false,
    })
  }

  /**
   * Build test command based on configuration
   */
  private buildTestCommand(config: TestExecutionConfig): string {
    const parts: string[] = []

    if (this.config.runner === 'vitest') {
      parts.push('npx vitest run')

      if (config.testPattern) {
        parts.push(config.testPattern)
      }

      if (config.coverage) {
        parts.push('--coverage')
      }

      if (config.parallel === false) {
        parts.push('--no-threads')
      }

      if (config.timeout) {
        parts.push(`--testTimeout=${config.timeout}`)
      }
    }

    return parts.join(' ')
  }

  /**
   * Parse test output to extract results
   */
  private parseTestOutput(output: string): TestExecutionResult {
    const result: TestExecutionResult = {
      success: true,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      duration: 0,
      failures: [],
    }

    // Parse vitest output
    const testSummaryMatch = output.match(/Test Files\s+(\d+)\s+passed.*?\((\d+)\)/)
    if (testSummaryMatch) {
      result.passedTests = parseInt(testSummaryMatch[1], 10)
      result.totalTests = parseInt(testSummaryMatch[2], 10)
    }

    const failedMatch = output.match(/(\d+)\s+failed/)
    if (failedMatch) {
      result.failedTests = parseInt(failedMatch[1], 10)
      result.success = false
    }

    const skippedMatch = output.match(/(\d+)\s+skipped/)
    if (skippedMatch) {
      result.skippedTests = parseInt(skippedMatch[1], 10)
    }

    // Parse failures
    const failurePattern = /FAIL\s+(.+?)\n.*?Error:\s+(.+?)(?=\n\s*at|$)/gs
    let match
    while ((match = failurePattern.exec(output)) !== null) {
      result.failures.push({
        testName: 'Test',
        testFile: match[1].trim(),
        error: match[2].trim(),
      })
    }

    return result
  }

  /**
   * Check if tests are passing
   */
  async areTestsPassing(): Promise<boolean> {
    const result = await this.runTests({ coverage: false })
    return result.success && result.failedTests === 0
  }

  /**
   * Verify tests pass after migration
   */
  async verifyMigrationTests(migrationStep: string): Promise<boolean> {
    console.log(`\nVerifying tests for migration step: ${migrationStep}`)

    const result = await this.runMigrationStepTests(migrationStep)

    if (!result.success) {
      console.error(`\n❌ Tests failed for ${migrationStep}:`)
      result.failures.forEach((failure) => {
        console.error(`  - ${failure.testFile}: ${failure.error}`)
      })
      return false
    }

    console.log(`✅ All tests passed for ${migrationStep}`)
    return true
  }
}
