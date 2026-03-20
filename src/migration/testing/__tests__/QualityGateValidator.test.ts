/**
 * Tests for QualityGateValidator
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { QualityGateValidator } from '../QualityGateValidator'
import type { TestCoverageAnalysis, QualityGate } from '../../types/test-coverage'

describe('QualityGateValidator', () => {
  let validator: QualityGateValidator

  beforeEach(() => {
    validator = new QualityGateValidator({
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    })
  })

  describe('checkCoverageThresholds', () => {
    it('should pass when coverage meets thresholds', () => {
      const analysis: TestCoverageAnalysis = {
        overallCoverage: {
          statements: { total: 100, covered: 85, percentage: 85 },
          branches: { total: 50, covered: 40, percentage: 80 },
          functions: { total: 20, covered: 18, percentage: 90 },
          lines: { total: 100, covered: 85, percentage: 85 },
          files: [],
        },
        layerCoverage: [],
        qualityGates: [],
        untested: [],
        recommendations: [],
      }

      const gates = validator.checkCoverageThresholds(analysis)

      expect(gates.every((g) => g.passed)).toBe(true)
    })

    it('should fail when coverage below thresholds', () => {
      const analysis: TestCoverageAnalysis = {
        overallCoverage: {
          statements: { total: 100, covered: 70, percentage: 70 },
          branches: { total: 50, covered: 30, percentage: 60 },
          functions: { total: 20, covered: 14, percentage: 70 },
          lines: { total: 100, covered: 70, percentage: 70 },
          files: [],
        },
        layerCoverage: [],
        qualityGates: [],
        untested: [],
        recommendations: [],
      }

      const gates = validator.checkCoverageThresholds(analysis)

      expect(gates.some((g) => !g.passed)).toBe(true)
    })

    it('should create gate for each coverage metric', () => {
      const analysis: TestCoverageAnalysis = {
        overallCoverage: {
          statements: { total: 100, covered: 85, percentage: 85 },
          branches: { total: 50, covered: 40, percentage: 80 },
          functions: { total: 20, covered: 18, percentage: 90 },
          lines: { total: 100, covered: 85, percentage: 85 },
          files: [],
        },
        layerCoverage: [],
        qualityGates: [],
        untested: [],
        recommendations: [],
      }

      const gates = validator.checkCoverageThresholds(analysis)

      expect(gates.length).toBe(4) // statements, branches, functions, lines
      expect(gates.map((g) => g.name)).toContain('Statement Coverage')
      expect(gates.map((g) => g.name)).toContain('Branch Coverage')
      expect(gates.map((g) => g.name)).toContain('Function Coverage')
      expect(gates.map((g) => g.name)).toContain('Line Coverage')
    })
  })

  describe('checkCriticalPathCoverage', () => {
    it('should pass when critical paths have adequate coverage', () => {
      const analysis: TestCoverageAnalysis = {
        overallCoverage: {
          statements: { total: 100, covered: 85, percentage: 85 },
          branches: { total: 50, covered: 40, percentage: 80 },
          functions: { total: 20, covered: 18, percentage: 90 },
          lines: { total: 100, covered: 85, percentage: 85 },
          files: [],
        },
        layerCoverage: [
          {
            layer: 'entities',
            coverage: {
              statements: { total: 50, covered: 45, percentage: 90 },
              branches: { total: 25, covered: 22, percentage: 88 },
              functions: { total: 10, covered: 9, percentage: 90 },
              lines: { total: 50, covered: 45, percentage: 90 },
              files: [],
            },
            files: [],
          },
          {
            layer: 'features',
            coverage: {
              statements: { total: 50, covered: 40, percentage: 80 },
              branches: { total: 25, covered: 20, percentage: 80 },
              functions: { total: 10, covered: 8, percentage: 80 },
              lines: { total: 50, covered: 40, percentage: 80 },
              files: [],
            },
            files: [],
          },
        ],
        qualityGates: [],
        untested: [],
        recommendations: [],
      }

      const gate = validator.checkCriticalPathCoverage(analysis)

      expect(gate.passed).toBe(true)
      expect(gate.actual).toBeGreaterThanOrEqual(80)
    })

    it('should fail when critical paths have low coverage', () => {
      const analysis: TestCoverageAnalysis = {
        overallCoverage: {
          statements: { total: 100, covered: 70, percentage: 70 },
          branches: { total: 50, covered: 35, percentage: 70 },
          functions: { total: 20, covered: 14, percentage: 70 },
          lines: { total: 100, covered: 70, percentage: 70 },
          files: [],
        },
        layerCoverage: [
          {
            layer: 'entities',
            coverage: {
              statements: { total: 50, covered: 35, percentage: 70 },
              branches: { total: 25, covered: 17, percentage: 68 },
              functions: { total: 10, covered: 7, percentage: 70 },
              lines: { total: 50, covered: 35, percentage: 70 },
              files: [],
            },
            files: [],
          },
          {
            layer: 'features',
            coverage: {
              statements: { total: 50, covered: 35, percentage: 70 },
              branches: { total: 25, covered: 17, percentage: 68 },
              functions: { total: 10, covered: 7, percentage: 70 },
              lines: { total: 50, covered: 35, percentage: 70 },
              files: [],
            },
            files: [],
          },
        ],
        qualityGates: [],
        untested: [],
        recommendations: [],
      }

      const gate = validator.checkCriticalPathCoverage(analysis)

      expect(gate.passed).toBe(false)
      expect(gate.actual).toBeLessThan(80)
    })
  })

  describe('checkTestSuccessRate', () => {
    it('should pass when all tests pass', () => {
      const gate = validator.checkTestSuccessRate(100, 100)

      expect(gate.passed).toBe(true)
      expect(gate.actual).toBe(100)
    })

    it('should fail when tests fail', () => {
      const gate = validator.checkTestSuccessRate(95, 100)

      expect(gate.passed).toBe(false)
      expect(gate.actual).toBe(95)
    })

    it('should handle zero tests', () => {
      const gate = validator.checkTestSuccessRate(0, 0)

      expect(gate.actual).toBe(0)
    })
  })

  describe('getFailingGates', () => {
    it('should return only failing gates', () => {
      const gates: QualityGate[] = [
        {
          name: 'Gate 1',
          type: 'coverage',
          threshold: 80,
          actual: 85,
          passed: true,
          message: 'Passed',
        },
        {
          name: 'Gate 2',
          type: 'coverage',
          threshold: 80,
          actual: 70,
          passed: false,
          message: 'Failed',
        },
        {
          name: 'Gate 3',
          type: 'coverage',
          threshold: 80,
          actual: 90,
          passed: true,
          message: 'Passed',
        },
      ]

      const failing = validator.getFailingGates(gates)

      expect(failing.length).toBe(1)
      expect(failing[0].name).toBe('Gate 2')
    })

    it('should return empty array when all gates pass', () => {
      const gates: QualityGate[] = [
        {
          name: 'Gate 1',
          type: 'coverage',
          threshold: 80,
          actual: 85,
          passed: true,
          message: 'Passed',
        },
      ]

      const failing = validator.getFailingGates(gates)

      expect(failing.length).toBe(0)
    })
  })
})
