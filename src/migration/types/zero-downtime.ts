/**
 * Type definitions for zero downtime migration system
 */

export interface MigrationFeatureFlag {
  name: string
  enabled: boolean
  rolloutPercentage: number
  description: string
}

export interface BackwardCompatibilityConfig {
  maintainReExports: boolean
  deprecationWarnings: boolean
  fallbackToOldPaths: boolean
}

export interface HealthMetric {
  name: string
  value: number
  threshold: number
  status: 'healthy' | 'warning' | 'critical'
  timestamp: Date
}

export interface ApplicationHealth {
  overall: 'healthy' | 'degraded' | 'critical'
  metrics: HealthMetric[]
  errors: ErrorMetric[]
  warnings: string[]
}

export interface ErrorMetric {
  type: string
  count: number
  rate: number
  threshold: number
  exceeded: boolean
}

export interface CutoverPlan {
  phases: CutoverPhase[]
  rollbackTriggers: RollbackTrigger[]
  validationChecks: ValidationCheck[]
}

export interface CutoverPhase {
  id: string
  name: string
  description: string
  rolloutPercentage: number
  duration: number
  successCriteria: SuccessCriteria[]
  rollbackConditions: string[]
}

export interface RollbackTrigger {
  metric: string
  threshold: number
  action: 'pause' | 'rollback' | 'alert'
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface ValidationCheck {
  name: string
  type: 'health' | 'performance' | 'error-rate' | 'functionality'
  frequency: number
  timeout: number
}

export interface SuccessCriteria {
  metric: string
  operator: 'lt' | 'lte' | 'gt' | 'gte' | 'eq'
  value: number
  required: boolean
}

export interface MigrationMonitoring {
  startTime: Date
  currentPhase: string
  health: ApplicationHealth
  rolloutPercentage: number
  affectedUsers: number
  errorRate: number
  performanceMetrics: PerformanceMetric[]
}

export interface PerformanceMetric {
  name: string
  baseline: number
  current: number
  change: number
  acceptable: boolean
}

export interface ReExportConfig {
  oldPath: string
  newPath: string
  deprecationMessage?: string
  removeAfter?: Date
}

export interface ZeroDowntimeResult {
  success: boolean
  phase: string
  health: ApplicationHealth
  rolloutPercentage: number
  errors: string[]
  warnings: string[]
  recommendations: string[]
}

export interface CutoverResult {
  success: boolean
  completedPhases: number
  totalPhases: number
  phaseResults: PhaseResult[]
  finalRolloutPercentage: number
  failureReason?: string
}

export interface PhaseResult {
  success: boolean
  phase: string
  rolloutPercentage: number
  duration: number
  metrics: Record<string, number>
  failureReason?: string
}
