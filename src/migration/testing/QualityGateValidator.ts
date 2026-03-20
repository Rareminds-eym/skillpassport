/**
 * Quality gate validation for coverage thresholds
 * Enforces minimum coverage requirements
 */

import type {
  QualityGate,
  CoverageThreshold,
  TestCoverageAnalysis,
} from '../types/test-coverage'

export class QualityGateValidator {
  private thresholds: CoverageThreshold

  constructor(thresholds?: CoverageThreshold) {
    this.thresholds = thresholds || {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    }
  }

  /**
   * Validate all quality gates
   */
  validateQualityGates(analysis: TestCoverageAnalysis): boolean {
    const allPassed = analysis.qualityGates.every((gate) => gate.passed)

    if (!allPassed) {
      console.error('\n❌ Quality gate failures:')
      analysis.qualityGates
        .filter((gate) => !gate.passed)
        .forEach((gate) => {
          console.error(`  - ${gate.name}: ${gate.message}`)
        })
    } else {
      console.log('\n✅ All quality gates passed')
    }

    return allPassed
  }

  /**
   * Check coverage thresholds
   */
  checkCoverageThresholds(analysis: TestCoverageAnalysis): QualityGate[] {
    const gates: QualityGate[] = []

    // Statement coverage
    if (this.thresholds.statements) {
      gates.push({
        name: 'Statement Coverage',
        type: 'coverage',
        threshold: this.thresholds.statements,
        actual: analysis.overallCoverage.statements.percentage,
        passed:
          analysis.overallCoverage.statements.percentage >= this.thresholds.statements,
        message: this.formatCoverageMessage(
          'statements',
          analysis.overallCoverage.statements.percentage,
          this.thresholds.statements
        ),
      })
    }

    // Branch coverage
    if (this.thresholds.branches) {
      gates.push({
        name: 'Branch Coverage',
        type: 'coverage',
        threshold: this.thresholds.branches,
        actual: analysis.overallCoverage.branches.percentage,
        passed: analysis.overallCoverage.branches.percentage >= this.thresholds.branches,
        message: this.formatCoverageMessage(
          'branches',
          analysis.overallCoverage.branches.percentage,
          this.thresholds.branches
        ),
      })
    }

    // Function coverage
    if (this.thresholds.functions) {
      gates.push({
        name: 'Function Coverage',
        type: 'coverage',
        threshold: this.thresholds.functions,
        actual: analysis.overallCoverage.functions.percentage,
        passed:
          analysis.overallCoverage.functions.percentage >= this.thresholds.functions,
        message: this.formatCoverageMessage(
          'functions',
          analysis.overallCoverage.functions.percentage,
          this.thresholds.functions
        ),
      })
    }

    // Line coverage
    if (this.thresholds.lines) {
      gates.push({
        name: 'Line Coverage',
        type: 'coverage',
        threshold: this.thresholds.lines,
        actual: analysis.overallCoverage.lines.percentage,
        passed: analysis.overallCoverage.lines.percentage >= this.thresholds.lines,
        message: this.formatCoverageMessage(
          'lines',
          analysis.overallCoverage.lines.percentage,
          this.thresholds.lines
        ),
      })
    }

    return gates
  }

  /**
   * Check critical path coverage
   */
  checkCriticalPathCoverage(analysis: TestCoverageAnalysis): QualityGate {
    const criticalLayers = ['entities', 'features']
    const criticalCoverage = analysis.layerCoverage.filter((layer) =>
      criticalLayers.includes(layer.layer)
    )

    const avgCoverage =
      criticalCoverage.reduce(
        (sum, layer) => sum + layer.coverage.statements.percentage,
        0
      ) / criticalCoverage.length

    return {
      name: 'Critical Path Coverage',
      type: 'coverage',
      threshold: 80,
      actual: avgCoverage,
      passed: avgCoverage >= 80,
      message:
        avgCoverage >= 80
          ? 'Critical paths have adequate coverage'
          : `Critical path coverage is ${avgCoverage.toFixed(1)}%, below 80% threshold`,
    }
  }

  /**
   * Check test success rate
   */
  checkTestSuccessRate(passedTests: number, totalTests: number): QualityGate {
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0

    return {
      name: 'Test Success Rate',
      type: 'test-success',
      threshold: 100,
      actual: successRate,
      passed: successRate === 100,
      message:
        successRate === 100
          ? 'All tests passing'
          : `${totalTests - passedTests} tests failing`,
    }
  }

  /**
   * Format coverage message
   */
  private formatCoverageMessage(
    type: string,
    actual: number,
    threshold: number
  ): string {
    if (actual >= threshold) {
      return `${type} coverage is ${actual.toFixed(1)}% (threshold: ${threshold}%)`
    }
    return `${type} coverage is ${actual.toFixed(1)}%, below ${threshold}% threshold`
  }

  /**
   * Get failing gates
   */
  getFailingGates(gates: QualityGate[]): QualityGate[] {
    return gates.filter((gate) => !gate.passed)
  }

  /**
   * Print quality gate summary
   */
  printSummary(gates: QualityGate[]): void {
    console.log('\n=== Quality Gate Summary ===')

    const passed = gates.filter((g) => g.passed).length
    const total = gates.length

    gates.forEach((gate) => {
      const icon = gate.passed ? '✅' : '❌'
      console.log(`${icon} ${gate.name}: ${gate.message}`)
    })

    console.log(`\nTotal: ${passed}/${total} gates passed`)
  }
}
