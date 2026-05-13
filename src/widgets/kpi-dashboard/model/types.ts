/**
 * KPI Dashboard Widget Types
 */

export interface KPIData {
  totallearners: number
  attendanceToday: number
  examsScheduled: number
  pendingAssessments: number
  feeCollection: {
    daily: number
    weekly: number
    monthly: number
  }
  careerReadinessIndex: number
  libraryOverdue: number
}

export interface KPIDashboardProps {
  schoolId?: string
  refreshInterval?: number // in milliseconds, default 15 minutes
}
