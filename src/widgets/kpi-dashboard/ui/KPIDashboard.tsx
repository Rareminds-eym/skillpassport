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
import { supabase } from '@/shared/api/supabaseClient'
import { FeatureGate } from '@/features/subscription'
import { KPICard } from '@/features/analytics'
import type { KPIDashboardProps, KPIData } from '..'

import { getLogger } from '@/shared/config/logging';

const logger = getLogger('kpi-dashboard');

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
      
      let totalStudents = 0
      let attendancePercentage = 0
      let examsScheduled = 0
      let pendingAssessments = 0
      let dailyTotal = 0
      let weeklyTotal = 0
      let monthlyTotal = 0
      let avgCareerReadiness = 0
      let libraryOverdue = 0
      
      // Fetch Total Students
      try {
        if (schoolId) {
          const { count, error: studentsError } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('school_id', schoolId)
          
          if (!studentsError) {
            totalStudents = count || 0
          }
        }
      } catch (err) {
        logger.warn('Failed to fetch students', { error: err });
      }

      // Fetch Attendance Today
      const today = new Date().toISOString().split('T')[0]
      try {
        let attendanceQuery = supabase
          .from('attendance_records')
          .select('status')
          .eq('date', today)
        
        if (schoolId) {
          attendanceQuery = attendanceQuery.eq('school_id', schoolId)
        }
        
        const { data: attendanceData, error: attendanceError } = await attendanceQuery

        if (!attendanceError && attendanceData) {
          const presentCount = attendanceData.filter(a => a.status === 'present').length
          const totalAttendance = attendanceData.length || 1
          attendancePercentage = Math.round((presentCount / totalAttendance) * 100)
        }
      } catch (err) {
        logger.warn('Failed to fetch attendance', { error: err });
      }

      // Fetch Exams Scheduled
      try {
        let examsQuery = supabase
          .from('exam_timetable')
          .select('*', { count: 'exact', head: true })
          .gte('exam_date', today)
        
        if (schoolId) {
          examsQuery = examsQuery.eq('school_id', schoolId)
        }
        
        const { count, error: examsError } = await examsQuery

        if (!examsError) {
          examsScheduled = count || 0
        }
      } catch (err) {
        logger.warn('Failed to fetch exams', { error: err });
      }

      // Fetch Pending Assessments
      try {
        let assessmentsQuery = supabase
          .from('assessments')
          .select('*', { count: 'exact', head: true })
          .eq('is_published', false)
        
        if (schoolId) {
          assessmentsQuery = assessmentsQuery.eq('school_id', schoolId)
        }
        
        const { count, error: assessmentsError } = await assessmentsQuery

        if (!assessmentsError) {
          pendingAssessments = count || 0
        }
      } catch (err) {
        logger.warn('Failed to fetch assessments', { error: err });
      }

      // Fetch Fee Collection - Daily
      try {
        const { data: dailyFees, error: dailyFeesError } = await supabase
          .from('fee_payments')
          .select('amount')
          .eq('status', 'success')
          .gte('payment_date', today)
          .lt('payment_date', `${today}T23:59:59`)

        if (!dailyFeesError && dailyFees) {
          dailyTotal = dailyFees.reduce((sum, fee) => sum + (fee.amount || 0), 0)
        }
      } catch (err) {
        logger.warn('Failed to fetch daily fees', { error: err });
      }

      // Fetch Fee Collection - Weekly
      try {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const { data: weeklyFees, error: weeklyFeesError } = await supabase
          .from('fee_payments')
          .select('amount')
          .eq('status', 'success')
          .gte('payment_date', weekAgo.toISOString())

        if (!weeklyFeesError && weeklyFees) {
          weeklyTotal = weeklyFees.reduce((sum, fee) => sum + (fee.amount || 0), 0)
        }
      } catch (err) {
        logger.warn('Failed to fetch weekly fees', { error: err });
      }

      // Fetch Fee Collection - Monthly
      try {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        const { data: monthlyFees, error: monthlyFeesError } = await supabase
          .from('fee_payments')
          .select('amount')
          .eq('status', 'success')
          .gte('payment_date', monthAgo.toISOString())

        if (!monthlyFeesError && monthlyFees) {
          monthlyTotal = monthlyFees.reduce((sum, fee) => sum + (fee.amount || 0), 0)
        }
      } catch (err) {
        logger.warn('Failed to fetch monthly fees', { error: err });
      }

      // Career Readiness Index - placeholder
      avgCareerReadiness = 0

      // Fetch Library Overdue Items
      try {
        let libraryQuery = supabase
          .from('library_book_issues_school')
          .select('*', { count: 'exact', head: true })
          .lt('due_date', today)
          .is('return_date', null)
        
        if (schoolId) {
          libraryQuery = libraryQuery.eq('school_id', schoolId)
        }
        
        const { count, error: libraryError } = await libraryQuery

        if (!libraryError) {
          libraryOverdue = count || 0
        }
      } catch (err) {
        logger.warn('Failed to fetch library data', { error: err });
      }

      setKpiData({
        totalStudents,
        attendanceToday: attendancePercentage,
        examsScheduled,
        pendingAssessments,
        feeCollection: {
          daily: dailyTotal,
          weekly: weeklyTotal,
          monthly: monthlyTotal,
        },
        careerReadinessIndex: avgCareerReadiness,
        libraryOverdue,
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
        title="Total Students"
        value={kpiData?.totalStudents || 0}
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
