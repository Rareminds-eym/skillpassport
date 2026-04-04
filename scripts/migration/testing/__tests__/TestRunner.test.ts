/**
 * Tests for TestRunner
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TestRunner } from '../TestRunner'
import type { TestExecutionConfig } from '@/shared/types/test-coverage'

describe('TestRunner', () => {
  let testRunner: TestRunner

  beforeEach(() => {
    testRunner = new TestRunner()
  })

  describe('buildTestCommand', () => {
    it('should build basic vitest command', () => {
      const command = (testRunner as any).buildTestCommand({})
      expect(command).toContain('vitest run')
    })

    it('should include test pattern when provided', () => {
      const config: TestExecutionConfig = {
        testPattern: '**/*.test.ts',
      }
      const command = (testRunner as any).buildTestCommand(config)
      expect(command).toContain('**/*.test.ts')
    })

    it('should include coverage flag when enabled', () => {
      const config: TestExecutionConfig = {
        coverage: true,
      }
      const command = (testRunner as any).buildTestCommand(config)
      expect(command).toContain('--coverage')
    })

    it('should include timeout when provided', () => {
      const config: TestExecutionConfig = {
        timeout: 5000,
      }
      const command = (testRunner as any).buildTestCommand(config)
      expect(command).toContain('--testTimeout=5000')
    })
  })

  describe('parseTestOutput', () => {
    it('should parse successful test output', () => {
      const output = 'Test Files  5 passed (5)\nTests  25 passed (25)'
      const result = (testRunner as any).parseTestOutput(output)

      expect(result.passedTests).toBe(5)
      expect(result.totalTests).toBe(5)
      expect(result.success).toBe(true)
    })

    it('should parse failed test output', () => {
      const output = 'Test Files  3 passed, 2 failed (5)\n2 failed'
      const result = (testRunner as any).parseTestOutput(output)

      expect(result.failedTests).toBe(2)
      expect(result.success).toBe(false)
    })

    it('should parse skipped tests', () => {
      const output = 'Test Files  5 passed (5)\n3 skipped'
      const result = (testRunner as any).parseTestOutput(output)

      expect(result.skippedTests).toBe(3)
    })
  })

  describe('runTests', () => {
    it('should return test execution result', async () => {
      const result = await testRunner.runTests({ coverage: false })

      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('totalTests')
      expect(result).toHaveProperty('passedTests')
      expect(result).toHaveProperty('failedTests')
      expect(result).toHaveProperty('duration')
    })
  })
})
