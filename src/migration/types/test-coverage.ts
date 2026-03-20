/**
 * Type definitions for test execution and coverage system
 */

export interface TestExecutionConfig {
  testPattern?: string
  coverage?: boolean
  coverageThreshold?: CoverageThreshold
  testTypes?: TestType[]
  parallel?: boolean
  timeout?: number
}

export type TestType = 'unit' | 'integration' | 'e2e' | 'property'

export interface CoverageThreshold {
  statements?: number
  branches?: number
  functions?: number
  lines?: number
}

export interface TestExecutionResult {
  success: boolean
  totalTests: number
  passedTests: number
  failedTests: number
  skippedTests: number
  duration: number
  coverage?: CoverageReport
  failures: TestFailure[]
}

export interface TestFailure {
  testName: string
  testFile: string
  error: string
  stackTrace?: string
}

export interface CoverageReport {
  statements: CoverageMetric
  branches: CoverageMetric
  functions: CoverageMetric
  lines: CoverageMetric
  files: FileCoverage[]
}

export interface CoverageMetric {
  total: number
  covered: number
  percentage: number
}

export interface FileCoverage {
  path: string
  statements: CoverageMetric
  branches: CoverageMetric
  functions: CoverageMetric
  lines: CoverageMetric
  uncoveredLines: number[]
}

export interface LayerCoverage {
  layer: 'entities' | 'widgets' | 'features' | 'shared' | 'app' | 'pages'
  coverage: CoverageReport
  files: string[]
}

export interface QualityGate {
  name: string
  type: 'coverage' | 'test-success' | 'performance'
  threshold: number
  actual: number
  passed: boolean
  message: string
}

export interface TestCoverageAnalysis {
  overallCoverage: CoverageReport
  layerCoverage: LayerCoverage[]
  qualityGates: QualityGate[]
  untested: UntestedCode[]
  recommendations: string[]
}

export interface UntestedCode {
  file: string
  type: 'function' | 'class' | 'branch'
  name: string
  lines: number[]
  complexity?: number
  priority: 'high' | 'medium' | 'low'
}

export interface TestRunnerConfig {
  runner: 'vitest' | 'jest' | 'playwright'
  configPath?: string
  environment?: string
  reporters?: string[]
}

export interface IntegrationTestResult {
  feature: string
  scenarios: ScenarioResult[]
  duration: number
  success: boolean
}

export interface ScenarioResult {
  name: string
  steps: StepResult[]
  passed: boolean
  duration: number
  error?: string
}

export interface StepResult {
  description: string
  passed: boolean
  duration: number
  error?: string
}

export interface E2ETestResult {
  workflow: string
  browser?: string
  viewport?: string
  passed: boolean
  duration: number
  screenshots?: string[]
  error?: string
}
