/**
 * Tests for CoverageAnalyzer
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CoverageAnalyzer } from '../CoverageAnalyzer'
import type { CoverageReport, FileCoverage } from '../../types/test-coverage'

describe('CoverageAnalyzer', () => {
  let analyzer: CoverageAnalyzer

  beforeEach(() => {
    analyzer = new CoverageAnalyzer()
  })

  describe('aggregateCoverage', () => {
    it('should aggregate coverage from multiple files', () => {
      const files: FileCoverage[] = [
        {
          path: 'src/entities/user/model/types.ts',
          statements: { total: 10, covered: 8, percentage: 80 },
          branches: { total: 5, covered: 4, percentage: 80 },
          functions: { total: 3, covered: 3, percentage: 100 },
          lines: { total: 10, covered: 8, percentage: 80 },
          uncoveredLines: [5, 10],
        },
        {
          path: 'src/entities/user/model/validation.ts',
          statements: { total: 20, covered: 18, percentage: 90 },
          branches: { total: 10, covered: 9, percentage: 90 },
          functions: { total: 5, covered: 5, percentage: 100 },
          lines: { total: 20, covered: 18, percentage: 90 },
          uncoveredLines: [15, 20],
        },
      ]

      const result = (analyzer as any).aggregateCoverage(files)

      expect(result.statements.total).toBe(30)
      expect(result.statements.covered).toBe(26)
      expect(result.statements.percentage).toBeCloseTo(86.67, 1)
    })

    it('should handle empty file list', () => {
      const result = (analyzer as any).aggregateCoverage([])

      expect(result.statements.total).toBe(0)
      expect(result.statements.covered).toBe(0)
      expect(result.statements.percentage).toBe(0)
    })
  })

  describe('determinePriority', () => {
    it('should assign high priority to entity files', () => {
      const file: FileCoverage = {
        path: 'src/entities/user/model/types.ts',
        statements: { total: 10, covered: 5, percentage: 50 },
        branches: { total: 5, covered: 2, percentage: 40 },
        functions: { total: 3, covered: 1, percentage: 33 },
        lines: { total: 10, covered: 5, percentage: 50 },
        uncoveredLines: [1, 2, 3, 4, 5],
      }

      const priority = (analyzer as any).determinePriority(file)
      expect(priority).toBe('high')
    })

    it('should assign medium priority to widget files', () => {
      const file: FileCoverage = {
        path: 'src/widgets/dashboard/ui/Dashboard.tsx',
        statements: { total: 10, covered: 5, percentage: 50 },
        branches: { total: 5, covered: 2, percentage: 40 },
        functions: { total: 3, covered: 1, percentage: 33 },
        lines: { total: 10, covered: 5, percentage: 50 },
        uncoveredLines: [1, 2, 3, 4, 5],
      }

      const priority = (analyzer as any).determinePriority(file)
      expect(priority).toBe('medium')
    })

    it('should assign low priority to shared files', () => {
      const file: FileCoverage = {
        path: 'src/shared/utils/helpers.ts',
        statements: { total: 10, covered: 5, percentage: 50 },
        branches: { total: 5, covered: 2, percentage: 40 },
        functions: { total: 3, covered: 1, percentage: 33 },
        lines: { total: 10, covered: 5, percentage: 50 },
        uncoveredLines: [1, 2, 3, 4, 5],
      }

      const priority = (analyzer as any).determinePriority(file)
      expect(priority).toBe('low')
    })
  })

  describe('createEmptyCoverage', () => {
    it('should create empty coverage report', () => {
      const result = (analyzer as any).createEmptyCoverage()

      expect(result.statements.total).toBe(0)
      expect(result.statements.covered).toBe(0)
      expect(result.statements.percentage).toBe(0)
      expect(result.files).toEqual([])
    })
  })

  describe('findUntestedCode', () => {
    it('should identify files with low coverage', async () => {
      const coverage: CoverageReport = {
        statements: { total: 100, covered: 70, percentage: 70 },
        branches: { total: 50, covered: 35, percentage: 70 },
        functions: { total: 20, covered: 14, percentage: 70 },
        lines: { total: 100, covered: 70, percentage: 70 },
        files: [
          {
            path: 'src/entities/user/model/types.ts',
            statements: { total: 10, covered: 5, percentage: 50 },
            branches: { total: 5, covered: 2, percentage: 40 },
            functions: { total: 3, covered: 1, percentage: 33 },
            lines: { total: 10, covered: 5, percentage: 50 },
            uncoveredLines: [1, 2, 3, 4, 5],
          },
        ],
      }

      const untested = await analyzer.findUntestedCode(coverage)

      expect(untested.length).toBeGreaterThan(0)
      expect(untested[0].file).toContain('user')
      expect(untested[0].priority).toBe('high')
    })

    it('should skip test files', async () => {
      const coverage: CoverageReport = {
        statements: { total: 100, covered: 70, percentage: 70 },
        branches: { total: 50, covered: 35, percentage: 70 },
        functions: { total: 20, covered: 14, percentage: 70 },
        lines: { total: 100, covered: 70, percentage: 70 },
        files: [
          {
            path: 'src/entities/user/__tests__/types.test.ts',
            statements: { total: 10, covered: 5, percentage: 50 },
            branches: { total: 5, covered: 2, percentage: 40 },
            functions: { total: 3, covered: 1, percentage: 33 },
            lines: { total: 10, covered: 5, percentage: 50 },
            uncoveredLines: [1, 2, 3, 4, 5],
          },
        ],
      }

      const untested = await analyzer.findUntestedCode(coverage)

      expect(untested.length).toBe(0)
    })
  })
})
