import {
    Award,
    Briefcase,
    Calendar,
    Clock,
    Target,
    TrendingUp
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import TopSkillsInDemand from './TopSkillsInDemand';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const AnalyticsView = ({ studentId, userEmail }) => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [debugMode, setDebugMode] = useState(process.env.NODE_ENV === 'development');

  // Debug logging
  const debugLog = (message, data = null) => {
    if (debugMode) {
      console.log(`[AnalyticsView] ${message}`, data || '');
    }
  };

  useEffect(() => {
    debugLog('AnalyticsView mounted', { studentId, userEmail });
    if (studentId) {
      fetchApplicationData();
    }
  }, [studentId]);

  const fetchApplicationData = async () => {
    try {
      debugLog('Fetching application data...');
      setLoading(true);
      const { data: appliedJobs, error: jobsError } = await supabase
        .from('applied_jobs')
        .select(`
          *,
          opportunities!fk_applied_jobs_opportunity (
            id,
            job_title,
            title,
            company_name,
            employment_type,
            location,
            salary_range_min,
            salary_range_max,
            mode
          )
        `)
        .eq('student_id', studentId)
        .order('applied_at', { ascending: false });

      if (!jobsError) {
        debugLog(`Fetched ${appliedJobs?.length || 0} applications`);
        setApplications(appliedJobs || []);
      } else {
        debugLog('Error fetching applications:', jobsError);
      }
    } catch (error) {
      debugLog('Error in fetchApplicationData:', error);
      console.error('Error in fetchApplicationData:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate analytics data
  const analytics = useMemo(() => {
    if (!applications.length) {
      return {
        totalApplications: 0,
        statusCounts: {},
        applicationsByMonth: {},
        jobTypeDistribution: {},
        locationDistribution: {},
        responseRate: 0,
        averageResponseTime: 0,
      };
    }

    const statusCounts = applications.reduce((acc, app) => {
      acc[app.application_status] = (acc[app.application_status] || 0) + 1;
      return acc;
    }, {});

    const applicationsByMonth = applications.reduce((acc, app) => {
      const month = new Date(app.applied_at).toLocaleString('default', { month: 'short', year: 'numeric' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    const jobTypeDistribution = applications.reduce((acc, app) => {
      const jobType = app.opportunities?.employment_type || app.opportunities?.mode || 'Unknown';
      acc[jobType] = (acc[jobType] || 0) + 1;
      return acc;
    }, {});

    const locationDistribution = applications.reduce((acc, app) => {
      const location = app.opportunities?.location || 'Unknown';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {});

    const respondedApps = applications.filter(app => app.responded_at).length;
    const responseRate = applications.length > 0 ? (respondedApps / applications.length) * 100 : 0;

    const responseTimes = applications
      .filter(app => app.responded_at)
      .map(app => {
        const applied = new Date(app.applied_at);
        const responded = new Date(app.responded_at);
        return (responded - applied) / (1000 * 60 * 60 * 24);
      });
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    return {
      totalApplications: applications.length,
      statusCounts,
      applicationsByMonth,
      jobTypeDistribution,
      locationDistribution,
      responseRate: Math.round(responseRate),
      averageResponseTime: Math.round(averageResponseTime * 10) / 10,
    };
  }, [applications]);

  // Chart configurations
  const statusRadialChartOptions = {
    chart: { type: 'radialBar', toolbar: { show: false } },
    plotOptions: {
      radialBar: {
        offsetY: 0,
        startAngle: 0,
        endAngle: 270,
        hollow: { margin: 5, size: '30%', background: 'transparent' },
        dataLabels: {
          name: { show: true, fontSize: '14px', fontWeight: 600, offsetY: -10 },
          value: { show: true, fontSize: '22px', fontWeight: 700, offsetY: 5, formatter: (val) => Math.round(val) + '%' }
        }
      }
    },
    colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
    labels: ['Accepted', 'Under Review', 'Pending', 'Rejected'],
    legend: { show: true, floating: true, fontSize: '13px', position: 'left', offsetX: 10, offsetY: 10 }
  };

  const statusRadialChartSeries = [
    ((analytics.statusCounts['accepted'] || 0) / analytics.totalApplications * 100) || 0,
    ((analytics.statusCounts['under_review'] || 0) / analytics.totalApplications * 100) || 0,
    ((analytics.statusCounts['applied'] || analytics.statusCounts['pending'] || 0) / analytics.totalApplications * 100) || 0,
    ((analytics.statusCounts['rejected'] || 0) / analytics.totalApplications * 100) || 0
  ];

  const timelineColumnChartOptions = {
    chart: { type: 'bar', toolbar: { show: true }, zoom: { enabled: false } },
    plotOptions: { bar: { borderRadius: 8, columnWidth: '60%', dataLabels: { position: 'top' } } },
    dataLabels: { enabled: true, offsetY: -20, style: { fontSize: '12px', colors: ["#304758"] } },
    colors: ['#6366f1'],
    xaxis: { categories: Object.keys(analytics.applicationsByMonth), labels: { style: { fontSize: '12px' } } },
    yaxis: { title: { text: 'Number of Applications' } },
    grid: { borderColor: '#f1f1f1' }
  };

  const timelineColumnChartSeries = [{ name: 'Applications', data: Object.values(analytics.applicationsByMonth) }];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Total Applications</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.totalApplications}</p>
              </div>
              <div className="h-12 w-12 bg-indigo-50 rounded-lg flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Response Rate</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.responseRate}<span className="text-xl text-gray-600">%</span></p>
              </div>
              <div className="h-12 w-12 bg-indigo-50 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Avg Response Time</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.averageResponseTime} <span className="text-sm text-gray-500 font-normal">days</span></p>
              </div>
              <div className="h-12 w-12 bg-indigo-50 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Offers Received</p>
                <p className="text-3xl font-bold text-gray-900">{analytics.statusCounts['accepted'] || 0}</p>
              </div>
              <div className="h-12 w-12 bg-green-50 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Application Status */}
        <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
          <CardHeader className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Target className="w-4 h-4 text-indigo-600" />
              Application Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {analytics.totalApplications > 0 ? (
              <ReactApexChart options={statusRadialChartOptions} series={statusRadialChartSeries} type="radialBar" height={350} />
            ) : (
              <div className="h-[350px] flex items-center justify-center">
                <p className="text-gray-500 text-sm">No application data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Applications Timeline */}
        <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
          <CardHeader className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Applications Over Time
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {Object.keys(analytics.applicationsByMonth).length > 0 ? (
              <ReactApexChart options={timelineColumnChartOptions} series={timelineColumnChartSeries} type="bar" height={350} />
            ) : (
              <div className="h-[350px] flex items-center justify-center">
                <p className="text-gray-500 text-sm">No timeline data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skills in Demand */}
        <TopSkillsInDemand 
          limit={5} 
          className="lg:col-span-2" 
          showHeader={true}
        />
      </div>

      {/* Empty State */}
      {analytics.totalApplications === 0 && (
        <Card className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-16">
          <CardContent>
            <div className="max-w-md mx-auto px-6">
              <div className="mb-6 inline-block p-4 bg-indigo-50 rounded-full">
                <TrendingUp className="w-12 h-12 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Applications Yet</h3>
              <p className="text-gray-600 text-sm mb-6">Start applying to jobs to see your analytics dashboard</p>
              <button 
                onClick={() => navigate('/student/opportunities')}
                className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200"
              >
                Browse Opportunities
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsView;
