import { useEffect, useState } from 'react';
import { 
  UsersIcon, 
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
  BanknotesIcon,
  ChartBarIcon,
  BookOpenIcon,
  ClockIcon,
  ArrowPathIcon,
  FunnelIcon
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

interface FilterOptions {
  grade?: string;
  section?: string;
  dateRange?: 'daily' | 'weekly' | 'monthly';
}

interface KPIDashboardAdvancedProps {
  schoolId?: string;
  refreshInterval?: number;
  onKPIClick?: (kpiType: string, data: any) => void;
  enableDrilldown?: boolean;
}

const KPIDashboardAdvanced: React.FC<KPIDashboardAdvancedProps> = ({ 
  schoolId,
  refreshInterval = 15 * 60 * 1000,
  onKPIClick,
  enableDrilldown = true
}) => {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: 'daily'
  });
  const [showFilters, setShowFilters] = useState(false);

  const fetchKPIData = async () => {
    try {
      setError(null);
      
      // Build base query with filters
      let studentsQuery = supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (schoolId) studentsQuery = studentsQuery.eq('school_id', schoolId);
      if (filters.grade) studentsQuery = studentsQuery.eq('grade', filters.grade);
      if (filters.section) studentsQuery = studentsQuery.eq('section', filters.section);

      const { count: totalStudents, error: studentsError } = await studentsQuery;
      if (studentsError) throw studentsError;

      // Fetch Attendance Today with real-time calculation
      const today = new Date().toISOString().split('T')[0];
      let attendanceQuery = supabase
        .from('attendance_records')
        .select('status, student_id');

      if (schoolId) attendanceQuery = attendanceQuery.eq('school_id', schoolId);
      attendanceQuery = attendanceQuery.eq('date', today);

      const { data: attendanceData, error: attendanceError } = await attendanceQuery;
      if (attendanceError) throw attendanceError;

      const presentCount = attendanceData?.filter(a => a.status === 'present').length || 0;
      const totalAttendance = attendanceData?.length || 1;
      const attendancePercentage = Math.round((presentCount / totalAttendance) * 100);

      // Fetch Exams Scheduled (active exams)
      let examsQuery = supabase
        .from('exams')
        .select('*', { count: 'exact', head: true })
        .gte('date', today);

      if (schoolId) examsQuery = examsQuery.eq('school_id', schoolId);

      const { count: examsScheduled, error: examsError } = await examsQuery;
      if (examsError) throw examsError;

      // Fetch Pending Assessments (unpublished marks)
      let assessmentsQuery = supabase
        .from('marks')
        .select('*', { count: 'exact', head: true })
        .eq('published', false);

      if (schoolId) assessmentsQuery = assessmentsQuery.eq('school_id', schoolId);

      const { count: pendingAssessments, error: assessmentsError } = await assessmentsQuery;
      if (assessmentsError) throw assessmentsError;

      // Fetch Fee Collection based on date range
      const getFeeData = async (daysBack: number) => {
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - daysBack);
        
        let feeQuery = supabase
          .from('fee_payments')
          .select('amount')
          .eq('status', 'success')
          .gte('payment_date', dateFrom.toISOString());

        if (schoolId) feeQuery = feeQuery.eq('school_id', schoolId);

        const { data, error } = await feeQuery;
        if (error) throw error;
        
        return data?.reduce((sum, fee) => sum + (fee.amount || 0), 0) || 0;
      };

      const dailyFees = await getFeeData(0);
      const weeklyFees = await getFeeData(7);
      const monthlyFees = await getFeeData(30);

      // Fetch Career Readiness Index (AI-driven average)
      let careerQuery = supabase
        .from('career_recommendations')
        .select('suitability_score');

      if (schoolId) careerQuery = careerQuery.eq('school_id', schoolId);

      const { data: careerData, error: careerError } = await careerQuery;
      if (careerError) throw careerError;

      const avgCareerReadiness = careerData?.length 
        ? Math.round(careerData.reduce((sum, c) => sum + (c.suitability_score || 0), 0) / careerData.length)
        : 0;

      // Fetch Library Overdue Items
      let libraryQuery = supabase
        .from('book_issue')
        .select('*', { count: 'exact', head: true })
        .lt('due_date', today)
        .is('return_date', null);

      if (schoolId) libraryQuery = libraryQuery.eq('school_id', schoolId);

      const { count: libraryOverdue, error: libraryError } = await libraryQuery;
      if (libraryError) throw libraryError;

      setKpiData({
        totalStudents: totalStudents || 0,
        attendanceToday: attendancePercentage,
        examsScheduled: examsScheduled || 0,
        pendingAssessments: pendingAssessments || 0,
        feeCollection: {
          daily: dailyFees,
          weekly: weeklyFees,
          monthly: monthlyFees,
        },
        careerReadinessIndex: avgCareerReadiness,
        libraryOverdue: libraryOverdue || 0,
      });

      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Error fetching KPI data:', err);
      setError('Failed to load dashboard data. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKPIData();

    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchKPIData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [schoolId, refreshInterval, autoRefresh, filters]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleKPIClick = (kpiType: string, value: any) => {
    if (enableDrilldown && onKPIClick) {
      onKPIClick(kpiType, { value, filters });
    }
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'green';
    if (percentage >= 75) return 'yellow';
    return 'red';
  };

  const getCareerReadinessColor = (score: number) => {
    if (score >= 75) return 'green';
    if (score >= 50) return 'yellow';
    return 'red';
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
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {lastUpdated && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <ClockIcon className="h-4 w-4" />
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
          )}
          
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-sm font-medium ${
              autoRefresh ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <FunnelIcon className="h-4 w-4" />
            <span>Filters</span>
          </button>

          <button
            onClick={fetchKPIData}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grade
              </label>
              <select
                value={filters.grade || ''}
                onChange={(e) => setFilters({ ...filters, grade: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Grades</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>Grade {i + 1}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section
              </label>
              <select
                value={filters.section || ''}
                onChange={(e) => setFilters({ ...filters, section: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Sections</option>
                {['A', 'B', 'C', 'D'].map((section) => (
                  <option key={section} value={section}>Section {section}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fee Period
              </label>
              <select
                value={filters.dateRange || 'daily'}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students */}
        <div onClick={() => handleKPIClick('students', kpiData?.totalStudents)}>
          <KPICard
            title="Total Students"
            value={kpiData?.totalStudents || 0}
            icon={<UsersIcon className="h-6 w-6" />}
            color="blue"
            loading={loading}
          />
        </div>

        {/* Attendance Today */}
        <div onClick={() => handleKPIClick('attendance', kpiData?.attendanceToday)}>
          <KPICard
            title="Attendance % Today"
            value={`${kpiData?.attendanceToday || 0}%`}
            icon={<ClipboardDocumentCheckIcon className="h-6 w-6" />}
            color={getAttendanceColor(kpiData?.attendanceToday || 0)}
            loading={loading}
          />
        </div>

        {/* Exams Scheduled */}
        <div onClick={() => handleKPIClick('exams', kpiData?.examsScheduled)}>
          <KPICard
            title="Exams Scheduled"
            value={kpiData?.examsScheduled || 0}
            icon={<AcademicCapIcon className="h-6 w-6" />}
            color="purple"
            loading={loading}
          />
        </div>

        {/* Pending Assessments */}
        <div onClick={() => handleKPIClick('assessments', kpiData?.pendingAssessments)}>
          <KPICard
            title="Pending Assessments"
            value={kpiData?.pendingAssessments || 0}
            icon={<ClipboardDocumentCheckIcon className="h-6 w-6" />}
            color={(kpiData?.pendingAssessments || 0) > 10 ? 'red' : 'green'}
            loading={loading}
          />
        </div>

        {/* Fee Collection */}
        <div onClick={() => handleKPIClick('fees', kpiData?.feeCollection)}>
          <KPICard
            title={`Fee Collection (${filters.dateRange || 'Daily'})`}
            value={formatCurrency(
              filters.dateRange === 'monthly' ? kpiData?.feeCollection.monthly || 0 :
              filters.dateRange === 'weekly' ? kpiData?.feeCollection.weekly || 0 :
              kpiData?.feeCollection.daily || 0
            )}
            icon={<BanknotesIcon className="h-6 w-6" />}
            color="green"
            loading={loading}
          />
        </div>

        {/* Fee Collection - Weekly */}
        <div onClick={() => handleKPIClick('fees-weekly', kpiData?.feeCollection.weekly)}>
          <KPICard
            title="Fee Collection (Week)"
            value={formatCurrency(kpiData?.feeCollection.weekly || 0)}
            icon={<BanknotesIcon className="h-6 w-6" />}
            color="green"
            loading={loading}
          />
        </div>

        {/* Career Readiness Index */}
        <div onClick={() => handleKPIClick('career', kpiData?.careerReadinessIndex)}>
          <KPICard
            title="Career Readiness Index"
            value={`${kpiData?.careerReadinessIndex || 0}/100`}
            icon={<ChartBarIcon className="h-6 w-6" />}
            color={getCareerReadinessColor(kpiData?.careerReadinessIndex || 0)}
            loading={loading}
          />
        </div>

        {/* Library Overdue Items */}
        <div onClick={() => handleKPIClick('library', kpiData?.libraryOverdue)}>
          <KPICard
            title="Library Overdue Items"
            value={kpiData?.libraryOverdue || 0}
            icon={<BookOpenIcon className="h-6 w-6" />}
            color={(kpiData?.libraryOverdue || 0) > 0 ? 'red' : 'green'}
            loading={loading}
          />
        </div>
      </div>

      {/* Drilldown Hint */}
      {enableDrilldown && (
        <p className="text-sm text-gray-500 text-center">
          Click on any KPI card to view detailed breakdown
        </p>
      )}
    </div>
  );
};

export default KPIDashboardAdvanced;
