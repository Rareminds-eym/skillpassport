/**
 * Coverage measurement for entities and widgets
 * Analyzes test coverage by FSD layer
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'
import type {
  CoverageReport,
  CoverageMetric,
  FileCoverage,
  LayerCoverage,
  TestCoverageAnalysis,
  UntestedCode,
  CoverageThreshold,
} from '@/shared/types/test-coverage'

export class CoverageAnalyzer {
  private srcDir: string
  private coverageDir: string

  constructor(srcDir: string = 'src', coverageDir: string = 'coverage') {
    this.srcDir = srcDir
    this.coverageDir = coverageDir
  }

  /**
   * Analyze test coverage for the entire codebase
   */
  async analyzeCoverage(): Promise<TestCoverageAnalysis> {
    // Run tests with coverage
    await this.generateCoverage()

    // Parse coverage report
    const overallCoverage = await this.parseCoverageReport()

    // Analyze by layer
    const layerCoverage = await this.analyzeLayerCoverage(overallCoverage)

    // Find untested code
    const untested = await this.findUntestedCode(overallCoverage)

    // Check quality gates
    const qualityGates = this.checkQualityGates(overallCoverage, layerCoverage)

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      overallCoverage,
      layerCoverage,
      untested
    )

    return {
      overallCoverage,
      layerCoverage,
      qualityGates,
      untested,
      recommendations,
    }
  }

  /**
   * Analyze coverage for specific layer
   */
  async analyzeLayerCoverage(
    overallCoverage: CoverageReport
  ): Promise<LayerCoverage[]> {
    const layers: Array<'entities' | 'widgets' | 'features' | 'shared' | 'app' | 'pages'> = [
      'entities',
      'widgets',
      'features',
      'shared',
      'app',
      'pages',
    ]

    const layerCoverage: LayerCoverage[] = []

    for (const layer of layers) {
      const layerFiles = overallCoverage.files.filter((file) =>
        file.path.includes(`/${layer}/`)
      )

      if (layerFiles.length === 0) {
        continue
      }

      const coverage = this.aggregateCoverage(layerFiles)

      layerCoverage.push({
        layer,
        coverage,
        files: layerFiles.map((f) => f.path),
      })
    }

    return layerCoverage
  }

  /**
   * Find untested code paths
   */
  async findUntestedCode(coverage: CoverageReport): Promise<UntestedCode[]> {
    const untested: UntestedCode[] = []

    for (const file of coverage.files) {
      // Skip test files
      if (file.path.includes('__tests__') || file.path.includes('.test.')) {
        continue
      }

      // Find files with low coverage
      if (file.statements.percentage < 80) {
        const priority = this.determinePriority(file)

        untested.push({
          file: file.path,
          type: 'function',
          name: path.basename(file.path, path.extname(file.path)),
          lines: file.uncoveredLines,
          priority,
        })
      }
    }

    // Sort by priority
    return untested.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
  }

  /**
   * Check quality gates
   */
  private checkQualityGates(
    overallCoverage: CoverageReport,
    layerCoverage: LayerCoverage[]
  ) {
    const gates = []

    // Overall coverage gate
    gates.push({
      name: 'Overall Statement Coverage',
      type: 'coverage' as const,
      threshold: 80,
      actual: overallCoverage.statements.percentage,
      passed: overallCoverage.statements.percentage >= 80,
      message:
        overallCoverage.statements.percentage >= 80
          ? 'Overall coverage meets threshold'
          : `Coverage is ${overallCoverage.statements.percentage.toFixed(1)}%, below 80% threshold`,
    })

    // Entity layer coverage gate
    const entityLayer = layerCoverage.find((l) => l.layer === 'entities')
    if (entityLayer) {
      gates.push({
        name: 'Entity Layer Coverage',
        type: 'coverage' as const,
        threshold: 80,
        actual: entityLayer.coverage.statements.percentage,
        passed: entityLayer.coverage.statements.percentage >= 80,
        message:
          entityLayer.coverage.statements.percentage >= 80
            ? 'Entity layer coverage meets threshold'
            : `Entity coverage is ${entityLayer.coverage.statements.percentage.toFixed(1)}%, below 80% threshold`,
      })
    }

    // Widget layer coverage gate
    const widgetLayer = layerCoverage.find((l) => l.layer === 'widgets')
    if (widgetLayer) {
      gates.push({
        name: 'Widget Layer Coverage',
        type: 'coverage' as const,
        threshold: 80,
        actual: widgetLayer.coverage.statements.percentage,
        passed: widgetLayer.coverage.statements.percentage >= 80,
        message:
          widgetLayer.coverage.statements.percentage >= 80
            ? 'Widget layer coverage meets threshold'
            : `Widget coverage is ${widgetLayer.coverage.statements.percentage.toFixed(1)}%, below 80% threshold`,
      })
    }

    return gates
  }

  /**
   * Generate coverage recommendations
   */
  private generateRecommendations(
    overallCoverage: CoverageReport,
    layerCoverage: LayerCoverage[],
    untested: UntestedCode[]
  ): string[] {
    const recommendations: string[] = []

    // Overall coverage recommendations
    if (overallCoverage.statements.percentage < 80) {
      recommendations.push(
        `Increase overall test coverage from ${overallCoverage.statements.percentage.toFixed(1)}% to at least 80%`
      )
    }

    // Layer-specific recommendations
    for (const layer of layerCoverage) {
      if (layer.coverage.statements.percentage < 80) {
        recommendations.push(
          `Add tests for ${layer.layer} layer (current: ${layer.coverage.statements.percentage.toFixed(1)}%)`
        )
      }
    }

    // High-priority untested code
    const highPriority = untested.filter((u) => u.priority === 'high')
    if (highPriority.length > 0) {
      recommendations.push(
        `Add tests for ${highPriority.length} high-priority untested files`
      )
    }

    // Branch coverage
    if (overallCoverage.branches.percentage < 75) {
      recommendations.push(
        `Improve branch coverage from ${overallCoverage.branches.percentage.toFixed(1)}% to at least 75%`
      )
    }

    return recommendations
  }

  /**
   * Generate coverage report
   */
  private async generateCoverage(): Promise<void> {
    try {
      execSync('npx vitest run --coverage', {
        stdio: 'pipe',
        encoding: 'utf-8',
      })
    } catch (error) {
      // Coverage may be generated even if tests fail
      console.warn('Some tests failed, but coverage was generated')
    }
  }

  /**
   * Parse coverage report from JSON
   */
  private async parseCoverageReport(): Promise<CoverageReport> {
    const coverageFile = path.join(this.coverageDir, 'coverage-summary.json')

    if (!fs.existsSync(coverageFile)) {
      // Return empty coverage if file doesn't exist
      return this.createEmptyCoverage()
    }

    const data = JSON.parse(fs.readFileSync(coverageFile, 'utf-8'))

    const files: FileCoverage[] = []
    for (const [filePath, coverage] of Object.entries(data)) {
      if (filePath === 'total') continue

      const fileCov = coverage as any
      files.push({
        path: filePath,
        statements: {
          total: fileCov.statements.total,
          covered: fileCov.statements.covered,
          percentage: fileCov.statements.pct,
        },
        branches: {
          total: fileCov.branches.total,
          covered: fileCov.branches.covered,
          percentage: fileCov.branches.pct,
        },
        functions: {
          total: fileCov.functions.total,
          covered: fileCov.functions.covered,
          percentage: fileCov.functions.pct,
        },
        lines: {
          total: fileCov.lines.total,
          covered: fileCov.lines.covered,
          percentage: fileCov.lines.pct,
        },
        uncoveredLines: fileCov.lines.uncovered || [],
      })
    }

    const total = data.total as any
    return {
      statements: {
        total: total.statements.total,
        covered: total.statements.covered,
        percentage: total.statements.pct,
      },
      branches: {
        total: total.branches.total,
        covered: total.branches.covered,
        percentage: total.branches.pct,
      },
      functions: {
        total: total.functions.total,
        covered: total.functions.covered,
        percentage: total.functions.pct,
      },
      lines: {
        total: total.lines.total,
        covered: total.lines.covered,
        percentage: total.lines.pct,
      },
      files,
    }
  }

  /**
   * Aggregate coverage for multiple files
   */
  private aggregateCoverage(files: FileCoverage[]): CoverageReport {
    const totals = {
      statements: { total: 0, covered: 0 },
      branches: { total: 0, covered: 0 },
      functions: { total: 0, covered: 0 },
      lines: { total: 0, covered: 0 },
    }

    for (const file of files) {
      totals.statements.total += file.statements.total
      totals.statements.covered += file.statements.covered
      totals.branches.total += file.branches.total
      totals.branches.covered += file.branches.covered
      totals.functions.total += file.functions.total
      totals.functions.covered += file.functions.covered
      totals.lines.total += file.lines.total
      totals.lines.covered += file.lines.covered
    }

    return {
      statements: {
        ...totals.statements,
        percentage:
          totals.statements.total > 0
            ? (totals.statements.covered / totals.statements.total) * 100
            : 0,
      },
      branches: {
        ...totals.branches,
        percentage:
          totals.branches.total > 0
            ? (totals.branches.covered / totals.branches.total) * 100
            : 0,
      },
      functions: {
        ...totals.functions,
        percentage:
          totals.functions.total > 0
            ? (totals.functions.covered / totals.functions.total) * 100
            : 0,
      },
      lines: {
        ...totals.lines,
        percentage:
          totals.lines.total > 0 ? (totals.lines.covered / totals.lines.total) * 100 : 0,
      },
      files,
    }
  }

  /**
   * Determine priority for untested code
   */
  private determinePriority(file: FileCoverage): 'high' | 'medium' | 'low' {
    // High priority: entities and critical features
    if (file.path.includes('/entities/') || file.path.includes('/features/auth')) {
      return 'high'
    }

    // Medium priority: widgets and other features
    if (file.path.includes('/widgets/') || file.path.includes('/features/')) {
      return 'medium'
    }

    // Low priority: shared utilities
    return 'low'
  }

  /**
   * Create empty coverage report
   */
  private createEmptyCoverage(): CoverageReport {
    const emptyMetric: CoverageMetric = {
      total: 0,
      covered: 0,
      percentage: 0,
    }

    return {
      statements: emptyMetric,
      branches: emptyMetric,
      functions: emptyMetric,
      lines: emptyMetric,
      files: [],
    }
  }
}
