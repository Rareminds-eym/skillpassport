import { useEffect, useState } from 'react';
import { 
  UsersIcon, 
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
  BanknotesIcon,
  ChartBarIcon,
  BookOpenIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import KPICard from './KPICard';
import { supabase } from '../../lib/supabaseClient';

interface KPIData {
  totalStudents: number;
  attendanceToday: number;
  examsScheduled: number;
  pendingAssessments: number;
  feeCollection: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  careerReadinessIndex: number;
  libraryOverdue: number;
}

interface KPIDashboardProps {
  schoolId?: string;
  refreshInterval?: number; // in milliseconds, default 15 minutes
}

const KPIDashboard: React.FC<KPIDashboardProps> = ({ 
  schoolId,
  refreshInterval = 15 * 60 * 1000 // 15 minutes
}) => {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchKPIData = async () => {
    try {
      setError(null);
      setLoading(true);
      
      console.log('Fetching KPI data for school:', schoolId);
      
      // Initialize with default values
      let totalStudents = 0;
      let attendancePercentage = 0;
      let examsScheduled = 0;
      let pendingAssessments = 0;
      let dailyTotal = 0;
      let weeklyTotal = 0;
      let monthlyTotal = 0;
      let avgCareerReadiness = 0;
      let libraryOverdue = 0;
      
      // Fetch Total Students (with error handling)
      try {
        let studentsQuery = supabase
          .from('students')
          .select('*', { count: 'exact', head: true });
        
        if (schoolId) {
          studentsQuery = studentsQuery.eq('school_id', schoolId);
        }
        
        const { count, error: studentsError } = await studentsQuery;
        
        if (studentsError) {
          console.warn('Students query error:', studentsError.message);
        } else {
          totalStudents = count || 0;
        }
      } catch (err) {
        console.warn('Failed to fetch students:', err);
      }

      // Fetch Attendance Today (with error handling)
      const today = new Date().toISOString().split('T')[0];
      try {
        let attendanceQuery = supabase
          .from('attendance_records')
          .select('status')
          .eq('date', today);
        
        if (schoolId) {
          attendanceQuery = attendanceQuery.eq('school_id', schoolId);
        }
        
        const { data: attendanceData, error: attendanceError } = await attendanceQuery;

        if (attendanceError) {
          console.warn('Attendance query error:', attendanceError.message);
        } else {
          const presentCount = attendanceData?.filter(a => a.status === 'present').length || 0;
          const totalAttendance = attendanceData?.length || 1;
          attendancePercentage = Math.round((presentCount / totalAttendance) * 100);
        }
      } catch (err) {
        console.warn('Failed to fetch attendance:', err);
      }

      // Fetch Exams Scheduled (with error handling)
      try {
        let examsQuery = supabase
          .from('exams')
          .select('*', { count: 'exact', head: true })
          .gte('date', today);
        
        if (schoolId) {
          examsQuery = examsQuery.eq('school_id', schoolId);
        }
        
        const { count, error: examsError } = await examsQuery;

        if (examsError) {
          console.warn('Exams query error:', examsError.message);
        } else {
          examsScheduled = count || 0;
        }
      } catch (err) {
        console.warn('Failed to fetch exams:', err);
      }

      // Fetch Pending Assessments (with error handling)
      try {
        let assessmentsQuery = supabase
          .from('marks')
          .select('*', { count: 'exact', head: true })
          .eq('published', false);
        
        if (schoolId) {
          assessmentsQuery = assessmentsQuery.eq('school_id', schoolId);
        }
        
        const { count, error: assessmentsError } = await assessmentsQuery;

        if (assessmentsError) {
          console.warn('Assessments query error:', assessmentsError.message);
        } else {
          pendingAssessments = count || 0;
        }
      } catch (err) {
        console.warn('Failed to fetch assessments:', err);
      }

      // Fetch Fee Collection (with error handling)
      try {
        let dailyFeesQuery = supabase
          .from('fee_payments')
          .select('amount')
          .eq('status', 'success')
          .gte('payment_date', today)
          .lt('payment_date', `${today}T23:59:59`);
        
        if (schoolId) {
          dailyFeesQuery = dailyFeesQuery.eq('school_id', schoolId);
        }
        
        const { data: dailyFees, error: dailyFeesError } = await dailyFeesQuery;

        if (dailyFeesError) {
          console.warn('Daily fees query error:', dailyFeesError.message);
        } else {
          dailyTotal = dailyFees?.reduce((sum, fee) => sum + (fee.amount || 0), 0) || 0;
        }
      } catch (err) {
        console.warn('Failed to fetch daily fees:', err);
      }

      try {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        let weeklyFeesQuery = supabase
          .from('fee_payments')
          .select('amount')
          .eq('status', 'success')
          .gte('payment_date', weekAgo.toISOString());
        
        if (schoolId) {
          weeklyFeesQuery = weeklyFeesQuery.eq('school_id', schoolId);
        }
        
        const { data: weeklyFees, error: weeklyFeesError } = await weeklyFeesQuery;

        if (weeklyFeesError) {
          console.warn('Weekly fees query error:', weeklyFeesError.message);
        } else {
          weeklyTotal = weeklyFees?.reduce((sum, fee) => sum + (fee.amount || 0), 0) || 0;
        }
      } catch (err) {
        console.warn('Failed to fetch weekly fees:', err);
      }

      try {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        let monthlyFeesQuery = supabase
          .from('fee_payments')
          .select('amount')
          .eq('status', 'success')
          .gte('payment_date', monthAgo.toISOString());
        
        if (schoolId) {
          monthlyFeesQuery = monthlyFeesQuery.eq('school_id', schoolId);
        }
        
        const { data: monthlyFees, error: monthlyFeesError } = await monthlyFeesQuery;

        if (monthlyFeesError) {
          console.warn('Monthly fees query error:', monthlyFeesError.message);
        } else {
          monthlyTotal = monthlyFees?.reduce((sum, fee) => sum + (fee.amount || 0), 0) || 0;
        }
      } catch (err) {
        console.warn('Failed to fetch monthly fees:', err);
      }

      // Fetch Career Readiness Index (with error handling)
      try {
        let careerQuery = supabase
          .from('career_recommendations')
          .select('suitability_score');
        
        if (schoolId) {
          careerQuery = careerQuery.eq('school_id', schoolId);
        }
        
        const { data: careerData, error: careerError } = await careerQuery;

        if (careerError) {
          console.warn('Career query error:', careerError.message);
        } else {
          avgCareerReadiness = careerData?.length 
            ? Math.round(careerData.reduce((sum, c) => sum + (c.suitability_score || 0), 0) / careerData.length)
            : 0;
        }
      } catch (err) {
        console.warn('Failed to fetch career data:', err);
      }

      // Fetch Library Overdue Items (with error handling)
      try {
        let libraryQuery = supabase
          .from('book_issue')
          .select('*', { count: 'exact', head: true })
          .lt('due_date', today)
          .is('return_date', null);
        
        if (schoolId) {
          libraryQuery = libraryQuery.eq('school_id', schoolId);
        }
        
        const { count, error: libraryError } = await libraryQuery;

        if (libraryError) {
          console.warn('Library query error:', libraryError.message);
        } else {
          libraryOverdue = count || 0;
        }
      } catch (err) {
        console.warn('Failed to fetch library data:', err);
      }

      // Set the KPI data (even if some queries failed, we'll show what we have)
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
      });

      setLastUpdated(new Date());
      setLoading(false);
      console.log('KPI data loaded successfully');
    } catch (err: any) {
      console.error('Unexpected error fetching KPI data:', err);
      setError('An unexpected error occurred. Please check the console for details.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIData();

    // Set up auto-refresh
    const interval = setInterval(() => {
      fetchKPIData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [schoolId, refreshInterval]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-2">
          <ClockIcon className="h-5 w-5 text-red-600" />
          <p className="text-red-800 font-medium">{error}</p>
        </div>
        <button
          onClick={fetchKPIData}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Last Updated Indicator */}
      {lastUpdated && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            <ClockIcon className="h-4 w-4" />
            <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
          <button
            onClick={fetchKPIData}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Refresh Now
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students */}
        <KPICard
          title="Total Students"
          value={kpiData?.totalStudents || 0}
          icon={<UsersIcon className="h-6 w-6" />}
          color="blue"
          loading={loading}
        />

        {/* Attendance Today */}
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

        {/* Exams Scheduled */}
        <KPICard
          title="Exams Scheduled"
          value={kpiData?.examsScheduled || 0}
          icon={<AcademicCapIcon className="h-6 w-6" />}
          color="purple"
          loading={loading}
        />

        {/* Pending Assessments */}
        <KPICard
          title="Pending Assessments"
          value={kpiData?.pendingAssessments || 0}
          icon={<ClipboardDocumentCheckIcon className="h-6 w-6" />}
          color={(kpiData?.pendingAssessments || 0) > 10 ? 'red' : 'green'}
          loading={loading}
        />

        {/* Fee Collection - Daily */}
        <KPICard
          title="Fee Collection (Today)"
          value={formatCurrency(kpiData?.feeCollection.daily || 0)}
          icon={<BanknotesIcon className="h-6 w-6" />}
          color="green"
          loading={loading}
        />

        {/* Fee Collection - Weekly */}
        <KPICard
          title="Fee Collection (Week)"
          value={formatCurrency(kpiData?.feeCollection.weekly || 0)}
          icon={<BanknotesIcon className="h-6 w-6" />}
          color="green"
          loading={loading}
        />

        {/* Career Readiness Index */}
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

        {/* Library Overdue Items */}
        <KPICard
          title="Library Overdue Items"
          value={kpiData?.libraryOverdue || 0}
          icon={<BookOpenIcon className="h-6 w-6" />}
          color={(kpiData?.libraryOverdue || 0) > 0 ? 'red' : 'green'}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default KPIDashboard;
