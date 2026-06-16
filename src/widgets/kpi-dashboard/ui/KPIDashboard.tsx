/**
 * KPI Dashboard Widget
 * 
 * Complex dashboard widget that displays key performance indicators
 * Composes multiple KPI cards with real-time data fetching
 */

import {
  AcademicCapIcon,
  BanknotesIcon,
  BookOpenIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  UsersIcon
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { apiPost } from '@/shared/api/apiClient'
import { FeatureGate } from '@/features/subscription'
import { KPICard } from '@/features/analytics'
import type { KPIDashboardProps, KPIData } from '..'

import { getLogger } from '@/shared/config/logging';

const logger = getLogger('kpi-dashboard');

interface KPIResponse {
  data?: {
    totalLearners: number;
    attendancePercentage: number;
    examsScheduled: number;
    pendingAssessments: number;
    dailyTotal: number;
    weeklyTotal: number;
    monthlyTotal: number;
    libraryOverdue: number;
  };
}

const KPIDashboardComponent: React.FC<KPIDashboardProps> = ({ 
  schoolId,
  refreshInterval = 15 * 60 * 1000 // 15 minutes
}) => {
  const [kpiData, setKpiData] = useState<KPIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchKPIData = async () => {
    try {
      setError(null)
      setLoading(true)

      const resp = await apiPost<KPIResponse>('/kpi-dashboard/actions', {
        action: 'get-kpi-data',
        schoolId,
      })

      const data = resp?.data
      if (!data) return

      setKpiData({
        totallearners: data.totalLearners || 0,
        attendanceToday: data.attendancePercentage || 0,
        examsScheduled: data.examsScheduled || 0,
        pendingAssessments: data.pendingAssessments || 0,
        feeCollection: {
          daily: data.dailyTotal || 0,
          weekly: data.weeklyTotal || 0,
          monthly: data.monthlyTotal || 0,
        },
        careerReadinessIndex: 0,
        libraryOverdue: data.libraryOverdue || 0,
      })

      setLoading(false)
    } catch (err: any) {
      logger.error('Unexpected error fetching KPI data', err);
      setError('An unexpected error occurred. Please check the logs for details.')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKPIData()

    const interval = setInterval(() => {
      fetchKPIData()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [schoolId, refreshInterval])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
        <p className="text-red-800 font-medium">{error}</p>
        <button
          onClick={fetchKPIData}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <KPICard
        title="Total Learners"
        value={kpiData?.totallearners || 0}
        icon={<UsersIcon className="h-6 w-6" />}
        color="blue"
        loading={loading}
      />

      <KPICard
        title="Attendance % Today"
        value={`${kpiData?.attendanceToday || 0}%`}
        icon={<ClipboardDocumentCheckIcon className="h-6 w-6" />}
        color={
          (kpiData?.attendanceToday || 0) >= 90 ? 'green' :
          (kpiData?.attendanceToday || 0) >= 75 ? 'yellow' : 'red'
        }
        loading={loading}
      />

      <KPICard
        title="Exams Scheduled"
        value={kpiData?.examsScheduled || 0}
        icon={<AcademicCapIcon className="h-6 w-6" />}
        color="purple"
        loading={loading}
      />

      <KPICard
        title="Pending Assessments"
        value={kpiData?.pendingAssessments || 0}
        icon={<ClipboardDocumentCheckIcon className="h-6 w-6" />}
        color={(kpiData?.pendingAssessments || 0) > 10 ? 'red' : 'green'}
        loading={loading}
      />

      <KPICard
        title="Fee Collection (Today)"
        value={formatCurrency(kpiData?.feeCollection.daily || 0)}
        icon={<BanknotesIcon className="h-6 w-6" />}
        color="green"
        loading={loading}
      />

      <KPICard
        title="Fee Collection (Week)"
        value={formatCurrency(kpiData?.feeCollection.weekly || 0)}
        icon={<BanknotesIcon className="h-6 w-6" />}
        color="green"
        loading={loading}
      />

      <KPICard
        title="Career Readiness Index"
        value={`${kpiData?.careerReadinessIndex || 0}/100`}
        icon={<ChartBarIcon className="h-6 w-6" />}
        color={
          (kpiData?.careerReadinessIndex || 0) >= 75 ? 'green' :
          (kpiData?.careerReadinessIndex || 0) >= 50 ? 'yellow' : 'red'
        }
        loading={loading}
      />

      <KPICard
        title="Library Overdue Items"
        value={kpiData?.libraryOverdue || 0}
        icon={<BookOpenIcon className="h-6 w-6" />}
        color={(kpiData?.libraryOverdue || 0) > 0 ? 'red' : 'green'}
        loading={loading}
      />
    </div>
  )
}

/**
 * Wrapped KPIDashboard with FeatureGate for kpi_dashboard add-on
 */
export const KPIDashboard: React.FC<KPIDashboardProps> = (props) => (
  <FeatureGate 
    featureKey="kpi_dashboard" 
    showUpgradePrompt={true}
    fallback={null}
    onUpgradeClick={() => {}}
  >
  <KPIDashboardComponent {...props} />
  </FeatureGate>
)
