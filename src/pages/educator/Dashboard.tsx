import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactApexChart from 'react-apexcharts';
import {
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowRightIcon,
  PencilSquareIcon,
  DocumentChartBarIcon,
  TrophyIcon,
  AcademicCapIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  UserPlusIcon,
  FireIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import KPICard from '../../components/educator/KPICard';
import { 
  dashboardApi, 
  DashboardKPIs, 
  RecentActivity, 
  SkillAnalytics, 
  Announcement 
} from '../../services/educator/dashboardApi';
import { supabase } from '../../lib/supabaseClient';
// import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [skillAnalytics, setSkillAnalytics] = useState<SkillAnalytics | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [loadingMoreActivities, setLoadingMoreActivities] = useState(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    let refreshAttempts = 0;
    const MAX_REFRESH_ATTEMPTS = 3;

    // Attempt to refresh the session when it becomes invalid
    const attemptSessionRefresh = async () => {
      if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
        return null;
      }

      refreshAttempts += 1;
      
      try {
        console.log('Dashboard: Attempting session refresh...');
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
          console.warn('Dashboard: Session refresh failed:', error.message);
          return null;
        }
        
        if (data?.session) {
          console.log('Dashboard: Session refreshed successfully');
          refreshAttempts = 0; // Reset on success
          return data.session;
        }
        
        return null;
      } catch (err) {
        console.error('Dashboard: Session refresh error:', err);
        return null;
      }
    };

    // Listen for auth changes first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'TOKEN_REFRESHED') {
        console.log('✅ Token refreshed, reloading data...');
        refreshAttempts = 0;
      }

      if (session?.user) {
        console.log('✅ Auth state change - user found, loading data...');
        setIsAuthenticated(true);
        setError(null);
        loadDashboardData();
      } else {
        console.log('❌ Auth state change - no user');
        setIsAuthenticated(false);
        setLoading(false);
        setError('Please log in to view the dashboard');
      }
    });

    // Check current session immediately
    const checkCurrentSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error('Session error:', error);
          
          // If 403 error, try to refresh the session
          if (error.status === 403 || error.message?.includes('403')) {
            console.log('Dashboard: Session invalid (403), attempting refresh...');
            const refreshedSession = await attemptSessionRefresh();
            
            if (refreshedSession?.user && mounted) {
              console.log('✅ Session refreshed, loading data...');
              setIsAuthenticated(true);
              setError(null);
              loadDashboardData();
              return;
            }
          }
        }

        if (session?.user) {
          console.log('✅ Session check - user found, loading data...');
          setIsAuthenticated(true);
          setError(null);
          loadDashboardData();
        } else {
          // No session - try to refresh before giving up
          console.log('No session found, attempting refresh...');
          const refreshedSession = await attemptSessionRefresh();
          
          if (refreshedSession?.user && mounted) {
            console.log('✅ Session refreshed, loading data...');
            setIsAuthenticated(true);
            setError(null);
            loadDashboardData();
          } else if (mounted) {
            console.log('❌ Session check - no user');
            setIsAuthenticated(false);
            setLoading(false);
            setError('Please log in to view the dashboard');
          }
        }
      } catch (err) {
        console.error('Authentication error:', err);
        if (mounted) {
          // Try to refresh on any auth error
          const refreshedSession = await attemptSessionRefresh();
          
          if (refreshedSession?.user) {
            setIsAuthenticated(true);
            setError(null);
            loadDashboardData();
          } else {
            setIsAuthenticated(false);
            setLoading(false);
            setError('Authentication error. Please refresh the page.');
          }
        }
      }
    };

    // Check session immediately
    checkCurrentSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array to run only once

  const loadDashboardData = useCallback(async () => {
    // Prevent multiple simultaneous loads
    if (loadingRef.current) return;
    
    // Check session state again before loading data
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setError('Please log in to view the dashboard');
      setLoading(false);
      return;
    }

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);
      
      console.log('🔄 Starting data load...');
      
      const [kpisData, activitiesData, analyticsData, announcementsData] = await Promise.all([
        dashboardApi.getKPIs(),
        dashboardApi.getRecentActivities(),
        dashboardApi.getSkillAnalytics(),
        dashboardApi.getAnnouncements(),
      ]);

      console.log('📊 Data loaded successfully:', {
        kpis: kpisData,
        activities: activitiesData.length,
        analytics: analyticsData,
        announcements: announcementsData.length
      });

      setKpis(kpisData);
      setRecentActivities(activitiesData);
      setSkillAnalytics(analyticsData);
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      
      // Check if it's an educator registration issue
      if (error instanceof Error && error.message.includes('not registered with any school')) {
        setError('You are not registered as an educator. Please contact your administrator or run the educator registration script.');
      } else {
        setError('Failed to load dashboard data. Please try again.');
      }
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []); // Empty dependency array since this function doesn't depend on any props or state

  const handleSendAnnouncement = async () => {
    if (!newAnnouncement.trim()) return;
    
    try {
      setSendingAnnouncement(true);
      const success = await dashboardApi.addAnnouncement(newAnnouncement);
      
      if (success) {
        // Add to local state for immediate feedback
        const newAnnouncementObj: Announcement = {
          id: Date.now().toString(),
          message: newAnnouncement,
          createdAt: new Date().toISOString(),
        };
        setAnnouncements(prev => [newAnnouncementObj, ...prev]);
        setNewAnnouncement('');
      }
    } catch (error) {
      console.error('Failed to send announcement:', error);
    } finally {
      setSendingAnnouncement(false);
    }
  };

  const handleShowMoreActivities = async () => {
    if (showAllActivities) {
      // If already showing all, just toggle back to limited view
      setShowAllActivities(false);
      return;
    }

    try {
      setLoadingMoreActivities(true);
      // Fetch more activities (up to 20)
      const moreActivities = await dashboardApi.getRecentActivities(20);
      setRecentActivities(moreActivities);
      setShowAllActivities(true);
    } catch (error) {
      console.error('Failed to load more activities:', error);
    } finally {
      setLoadingMoreActivities(false);
    }
  };

  const handleActivityClick = (activity: RecentActivity) => {
    // Navigate to appropriate page based on activity type
    switch (activity.category.toLowerCase()) {
      case 'attendance':
        navigate('/educator/mark-attendance');
        break;
      case 'assessment':
        navigate('/educator/assessment-results');
        break;
      case 'assignment':
        navigate('/educator/assignments');
        break;
      case 'mentor note':
        navigate('/educator/mentornotes');
        break;
      case 'schedule':
        navigate('/educator/my-timetable');
        break;
      case 'club':
        navigate('/educator/clubs');
        break;
      case 'competition':
        navigate('/educator/competitions');
        break;
      case 'course':
        navigate('/educator/courses');
        break;
      case 'project':
      case 'training':
      case 'certificate':
        navigate('/educator/activities'); // Verification page for these
        break;
      default:
        navigate('/educator/activities'); // Default fallback
        break;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      sent_to_admin: 'bg-blue-100 text-blue-800 border-blue-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'attendance':
        return <ClockIcon className="h-4 w-4" />;
      case 'assessment':
        return <DocumentChartBarIcon className="h-4 w-4" />;
      case 'assignment':
        return <PencilSquareIcon className="h-4 w-4" />;
      case 'mentor note':
        return <PencilSquareIcon className="h-4 w-4" />;
      case 'project':
        return <TrophyIcon className="h-4 w-4" />;
      case 'training':
        return <AcademicCapIcon className="h-4 w-4" />;
      case 'certificate':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'schedule':
        return <CalendarDaysIcon className="h-4 w-4" />;
      case 'club':
        return <UserPlusIcon className="h-4 w-4" />;
      case 'competition':
        return <FireIcon className="h-4 w-4" />;
      case 'course':
        return <BookOpenIcon className="h-4 w-4" />;
      default:
        return <DocumentChartBarIcon className="h-4 w-4" />;
    }
  };

  const getNavigationHint = (category: string) => {
    switch (category.toLowerCase()) {
      case 'attendance':
        return 'attendance records';
      case 'assessment':
        return 'assessment results';
      case 'assignment':
        return 'assignments';
      case 'mentor note':
        return 'mentor notes';
      case 'schedule':
        return 'my timetable';
      case 'club':
        return 'club management';
      case 'competition':
        return 'competition details';
      case 'course':
        return 'course management';
      case 'project':
      case 'training':
      case 'certificate':
        return 'verification';
      default:
        return 'details';
    }
  };

  const getStatusText = (status: string, category: string) => {
    // Special handling for assignments, attendance, and schedule
    if ((category === 'Assignment' || category === 'Attendance') && status === 'sent_to_admin') {
      return 'Submitted';
    }
    
    if (category === 'Schedule' && status === 'sent_to_admin') {
      return 'Assigned';
    }
    
    // Default status text mapping
    const statusTexts: { [key: string]: string } = {
      'pending': 'pending',
      'sent_to_admin': 'Verified',
      'approved': 'approved',
      'rejected': 'rejected'
    };
    
    return statusTexts[status] || status;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = date.getTime() - now.getTime();
    const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
    
    // Handle same day
    if (Math.abs(diffInDays) < 1) {
      const diffInHours = Math.round(diffInMs / (1000 * 60 * 60));
      if (Math.abs(diffInHours) < 1) {
        const diffInMinutes = Math.round(diffInMs / (1000 * 60));
        if (Math.abs(diffInMinutes) < 1) {
          return 'just now';
        }
        return diffInMinutes < 0 ? `${Math.abs(diffInMinutes)}m ago` : `in ${diffInMinutes}m`;
      }
      return diffInHours < 0 ? `${Math.abs(diffInHours)}h ago` : `in ${diffInHours}h`;
    }
    
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(diffInDays, 'day');
  };

  // Chart configurations
  const barChartOptions = {
    chart: {
      type: 'bar' as const,
      height: 250,
      toolbar: {
        show: false,
      },
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '60%',
        borderRadius: 6,
        borderRadiusApplication: 'end' as const,
      },
    },
    dataLabels: {
      enabled: false,
    },
    colors: ['#3B82F6'],
    grid: {
      borderColor: '#F3F4F6',
      strokeDashArray: 3,
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    xaxis: {
      categories: skillAnalytics?.skillParticipation.map(item => item.skill) || [],
      labels: {
        style: {
          fontSize: '11px',
          fontWeight: 500,
          colors: '#6B7280',
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '11px',
          fontWeight: 500,
          colors: '#6B7280',
        },
      },
    },
    tooltip: {
      theme: 'light',
      style: {
        fontSize: '12px',
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      y: {
        formatter: (val: number) => `${val} activities`,
      },
    },
  };

  const barChartSeries = [{
    name: 'Activities',
    data: skillAnalytics?.skillParticipation.map(item => item.count) || [],
  }];

  const pieChartOptions = {
    chart: {
      type: 'pie' as const,
      height: 250,
      fontFamily: 'Inter, system-ui, sans-serif',
    },
    labels: skillAnalytics?.skillDistribution.map(item => item.category) || [],
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
    legend: {
      position: 'bottom' as const,
      fontSize: '12px',
      fontWeight: 500,
      labels: {
        colors: '#6B7280',
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '11px',
        fontWeight: 600,
        colors: ['#FFFFFF'],
      },
      formatter: (val: number) => `${Math.round(val)}%`,
    },
    tooltip: {
      theme: 'light',
      style: {
        fontSize: '12px',
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      y: {
        formatter: (val: number) => `${val} activities`,
      },
    },
    stroke: {
      width: 0,
    },
  };

  const pieChartSeries = skillAnalytics?.skillDistribution.map(item => item.count) || [];

  return (
    <div className="min-h-screen bg-gray-50" data-testid="educator-dashboard">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-red-800 mb-2">{error}</p>
                {error.includes('not registered as an educator') && (
                  <div className="text-xs text-red-700 bg-red-100 rounded p-2">
                    <p className="font-medium mb-1">To fix this issue:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Open Supabase SQL Editor</li>
                      <li>Run the script: <code className="bg-red-200 px-1 rounded">register-current-user-as-educator.sql</code></li>
                      <li>Refresh this page</li>
                    </ol>
                  </div>
                )}
                {error.includes('Please log in') && (
                  <div className="mt-2">
                    <button
                      onClick={() => {
                        setError(null);
                        setLoading(true);
                        window.location.reload();
                      }}
                      className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                    >
                      Retry Authentication
                    </button>
                  </div>
                )}
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex text-red-400 hover:text-red-600 transition-colors"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-2 text-gray-600">Monitor student progress and manage activities</p>


            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Total Students"
            value={kpis?.totalStudents || 0}
            icon={<UserGroupIcon className="h-6 w-6" />}
            color="blue"
            loading={loading}
          />
          <KPICard
            title="Pending Reviews"
            value={kpis?.pendingActivities || 0}
            icon={<ClockIcon className="h-6 w-6" />}
            color="yellow"
            loading={loading}
          />
          <KPICard
            title="Verified Activities"
            value={kpis?.verifiedActivities || 0}
            icon={<CheckCircleIcon className="h-6 w-6" />}
            color="green"
            loading={loading}
          />
          <KPICard
            title="Verification Rate"
            value={`${kpis?.verificationRate || 0}%`}
            icon={<ChartBarIcon className="h-6 w-6" />}
            color="purple"
            loading={loading}
          />
        </div>

        {/* Quick Actions Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Mentor Notes Module */}
          <div
            onClick={() => navigate('/educator/mentornotes')}
            className="group bg-white rounded-lg border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <PencilSquareIcon className="h-5 w-5 text-blue-600" />
              </div>
              <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Mentor Notes</h3>
            <p className="text-sm text-gray-600 mb-4">Record feedback and observations for students</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <UserGroupIcon className="h-3 w-3" />
                <span>{kpis?.totalStudents || 0} Students</span>
              </div>
              <div className="flex items-center gap-1">
                <DocumentChartBarIcon className="h-3 w-3" />
                <span>{kpis?.totalMentorNotes || 0} Notes</span>
              </div>
            </div>
          </div>

          {/* Verification Module */}
          <div
            onClick={() => navigate('/educator/activities')}
            className="group bg-white rounded-lg border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-green-200 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              </div>
              <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Activity Verification</h3>
            <p className="text-sm text-gray-600 mb-4">Review and approve student submissions</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <ClockIcon className="h-3 w-3" />
                <span>{kpis?.pendingActivities || 0} Pending</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircleIcon className="h-3 w-3" />
                <span>{kpis?.verifiedActivities || 0} Verified</span>
              </div>
            </div>
          </div>

          {/* Analytics Module */}
          <div
            onClick={() => navigate('/educator/analytics')}
            className="group bg-white rounded-lg border border-gray-200 p-6 cursor-pointer hover:shadow-md hover:border-purple-200 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                <ChartBarIcon className="h-5 w-5 text-purple-600" />
              </div>
              <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
            <p className="text-sm text-gray-600 mb-4">View performance and skill insights</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <TrophyIcon className="h-3 w-3" />
                <span>Performance</span>
              </div>
              <div className="flex items-center gap-1">
                <AcademicCapIcon className="h-3 w-3" />
                <span>Skills</span>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Skill Participation Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Skill Participation</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {skillAnalytics?.skillParticipation.length ? 
                    `${skillAnalytics.skillParticipation.length} skills tracked` : 
                    'No data available'
                  }
                </p>
              </div>
            </div>
            <div className="h-64">
              {loading ? (
                <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Loading chart...</p>
                  </div>
                </div>
              ) : skillAnalytics?.skillParticipation.length ? (
                <ReactApexChart
                  options={barChartOptions}
                  series={barChartSeries}
                  type="bar"
                  height={250}
                />
              ) : (
                <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <ChartBarIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No participation data available</p>
                    <p className="text-xs text-gray-400 mt-1">Data will appear as students submit activities</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Skill Distribution Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Skill Categories</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {skillAnalytics?.skillDistribution.length ? 
                    `${skillAnalytics.skillDistribution.length} categories` : 
                    'No data available'
                  }
                </p>
              </div>
            </div>
            <div className="h-64">
              {loading ? (
                <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Loading chart...</p>
                  </div>
                </div>
              ) : skillAnalytics?.skillDistribution.length ? (
                <ReactApexChart
                  options={pieChartOptions}
                  series={pieChartSeries}
                  type="pie"
                  height={250}
                />
              ) : (
                <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <svg className="h-12 w-12 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-sm text-gray-500">No distribution data available</p>
                    <p className="text-xs text-gray-400 mt-1">Data will appear as students submit activities</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Activities */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
              <button
                onClick={() => navigate('/educator/activities')}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                data-testid="view-all-activities"
              >
                View All →
              </button>
            </div>

            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Loading activities...</p>
              </div>
            ) : recentActivities.length === 0 ? (
              <div className="p-8 text-center" data-testid="empty-activities">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <DocumentChartBarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-1">No recent activities</p>
                <p className="text-xs text-gray-400">Activities will appear as students submit work</p>
              </div>
            ) : (
              <>
                {/* Scrollable Activities Container */}
                <div className={`divide-y divide-gray-100 ${showAllActivities ? 'max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100' : ''}`}>
                  {/* Show limited activities initially (first 5), or all if expanded */}
                  {(showAllActivities ? recentActivities : recentActivities.slice(0, 5)).map((activity) => (
                    <div
                      key={activity.id}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleActivityClick(activity)}
                      data-testid="activity-item"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                            {getCategoryIcon(activity.category)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {activity.title}
                              </h4>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                                  activity.status
                                )}`}
                              >
                                {getStatusText(activity.status, activity.category)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {activity.studentName} • {activity.category}
                              <span className="text-xs text-gray-400 ml-2">
                                → {getNavigationHint(activity.category)}
                              </span>
                            </p>
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {activity.description}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 ml-4 whitespace-nowrap">
                          {formatDate(activity.submittedDate)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                  
                {/* Show More / Show Less Button */}
                {recentActivities.length > 5 && (
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                      <button
                        onClick={handleShowMoreActivities}
                        disabled={loadingMoreActivities}
                        className="w-full flex items-center justify-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50"
                        data-testid="show-more-activities"
                      >
                        {loadingMoreActivities ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            Loading more...
                          </>
                        ) : showAllActivities ? (
                          <>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                            Show Less
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            Show More
                          </>
                        )}
                      </button>
                    </div>
                )}
              </>
            )}
          </div>

          {/* Announcements Panel */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Announcements</h3>
            </div>

            <div className="p-6">
              {/* Input Row */}
              <div className="flex flex-col gap-3 mb-4">
                <textarea
                  value={newAnnouncement}
                  onChange={(e) => setNewAnnouncement(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Write an announcement..."
                  rows={3}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendAnnouncement()}
                />
                <button 
                  onClick={handleSendAnnouncement}
                  disabled={!newAnnouncement.trim() || sendingAnnouncement}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                  {sendingAnnouncement ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-4 w-4" />
                      Send
                    </>
                  )}
                </button>
              </div>

              {/* Announcements List */}
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ) : announcements.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500">No announcements yet</p>
                  </div>
                ) : (
                  announcements.map((announcement) => (
                    <div key={announcement.id} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700 mb-1">{announcement.message}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(announcement.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>


        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => navigate('/educator/activities')}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-200 hover:bg-blue-50 transition-all group"
                data-testid="quick-action-verify"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">Verify Activities</span>
                </div>
                <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </button>

              <button
                onClick={() => navigate('/educator/students')}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-green-200 hover:bg-green-50 transition-all group"
                data-testid="quick-action-students"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center group-hover:bg-green-100 transition-colors">
                    <UserGroupIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">View Students</span>
                </div>
                <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-green-600 transition-colors" />
              </button>

              <button
                onClick={() => navigate('/educator/students')}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-200 hover:bg-purple-50 transition-all group"
                data-testid="quick-action-import"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                    <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-900">Import Students</span>
                </div>
                <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </button>

              <button
                onClick={() => navigate('/educator/reports')}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-orange-200 hover:bg-orange-50 transition-all group"
                data-testid="quick-action-reports"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                    <ChartBarIcon className="h-5 w-5 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">View Reports</span>
                </div>
                <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-orange-600 transition-colors" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
