import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UsersIcon,
  BookmarkIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { getDashboardData } from '../../services/dashboardService';
import ActivityFeed from '../../components/ActivityFeed';
import { useRealtimeActivities } from '../../hooks/useRealtimeActivities';
import { trackSearchUsage } from '../../services/savedSearchesService';

const KpiCard = ({ title, value, icon: Icon, trend, color = 'primary' }) => {
  const colorClasses = {
    primary: 'text-primary-600 bg-primary-50',
    success: 'text-success-600 bg-success-50',
    warning: 'text-warning-600 bg-warning-50',
    danger: 'text-danger-600 bg-danger-50'
  };

  return (
    <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
              <Icon className="h-6 w-6" aria-hidden="true" />
            </div>
          </div>
          <div className="ml-4 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {trend && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    trend > 0 ? 'text-success-600' : 'text-danger-600'
                  }`}>
                    {trend > 0 ? '+' : ''}{trend}%
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

const AlertCard = ({ type, title, message, time, urgent = false, action, onActionClick }) => {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-warning-500" />;
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-success-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-danger-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className={`border-l-4 p-4 ${urgent ? 'border-danger-400 bg-danger-50' : 'border-gray-200 bg-white'} rounded-r-lg shadow-sm`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="mt-1 text-sm text-gray-600">{message}</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-gray-500">{time}</p>
            {action && onActionClick && (
              <button
                onClick={onActionClick}
                className="text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                {action}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Overview = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isActivityExpanded, setIsActivityExpanded] = useState(false);
  
  // Real-time activities hook
  const { activities: realtimeActivities, isLoading: activitiesLoading } = useRealtimeActivities(15);
  
  // Show only 4 activities by default, all when expanded
  const displayedActivities = isActivityExpanded ? realtimeActivities : realtimeActivities.slice(0, 4);
  
  // Handle quick search click
  const handleQuickSearchClick = async (search) => {
    try {
      // Track search usage if it has an ID
      if (search.id && !search.id.startsWith('default-')) {
        await trackSearchUsage(search.id);
      }
      
      // Navigate to talent pool with search criteria
      const searchCriteria = search.search_criteria || {};
      const params = new URLSearchParams();
      
      if (searchCriteria.query) {
        params.append('q', searchCriteria.query);
      }
      if (searchCriteria.skills && searchCriteria.skills.length > 0) {
        params.append('skills', searchCriteria.skills.join(','));
      }
      if (searchCriteria.location) {
        params.append('location', searchCriteria.location);
      }
      if (searchCriteria.experience) {
        params.append('experience', searchCriteria.experience);
      }
      
      navigate(`/recruitment/talent-pool?${params.toString()}`);
    } catch (error) {
      console.error('Error handling quick search:', error);
      // Navigate anyway even if tracking fails
      navigate('/recruitment/talent-pool');
    }
  };
  
  // Handle alert action clicks
  const handleAlertAction = (alert) => {
    // Route based on alert source and ID
    const alertId = alert.id || alert;
    const source = alert.source;
    
    // Handle by source
    if (source === 'talent_pool' || alertId.startsWith('talent-pool')) {
      if (alertId.includes('unverified')) {
        navigate('/recruitment/talent-pool?verified=false');
      } else if (alertId.includes('incomplete')) {
        navigate('/recruitment/talent-pool?filter=incomplete');
      } else {
        navigate('/recruitment/talent-pool');
      }
    } else if (source === 'shortlists' || alertId.startsWith('shortlist')) {
      if (alertId.includes('empty')) {
        navigate('/recruitment/shortlists?filter=empty');
      } else {
        navigate('/recruitment/shortlists');
      }
    } else if (source === 'interviews' || alertId.startsWith('interview')) {
      if (alertId.includes('upcoming')) {
        navigate('/recruitment/interviews?upcoming=true');
      } else if (alertId.includes('scorecard') || alertId.includes('pending')) {
        navigate('/recruitment/interviews?status=completed&feedback=pending');
      } else if (alertId.includes('positive') || alertId.includes('feedback')) {
        navigate('/recruitment/interviews?feedback=positive');
      } else {
        navigate('/recruitment/interviews');
      }
    } else if (source === 'offers' || alertId.startsWith('offer')) {
      if (alertId.includes('expiring')) {
        navigate('/recruitment/offers-decisions?status=expiring');
      } else if (alertId.includes('accepted')) {
        navigate('/recruitment/offers-decisions?status=accepted');
      } else {
        navigate('/recruitment/offers-decisions');
      }
    } else if (source === 'pipelines' || alertId.startsWith('pipeline')) {
      if (alertId.includes('stalled')) {
        navigate('/recruitment/pipelines?filter=stalled');
      } else if (alertId.includes('overdue')) {
        navigate('/recruitment/pipelines?filter=overdue');
      } else if (alertId.includes('bottleneck')) {
        navigate('/recruitment/pipelines');
      } else {
        navigate('/recruitment/pipelines');
      }
    } else {
      // Fallback for legacy alert IDs
      switch (alertId) {
        case 'verification-pending':
          navigate('/recruitment/talent-pool?verification=pending');
          break;
        case 'expiring-offers':
          navigate('/recruitment/offers-decisions?status=expiring');
          break;
        case 'positive-feedback':
          navigate('/recruitment/interviews?feedback=positive');
          break;
        case 'upcoming-interviews':
          navigate('/recruitment/interviews?upcoming=true');
          break;
        default:
          console.log('No action defined for alert:', alertId);
      }
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      console.log('🔄 Overview: Starting dashboard data fetch...');
      
      try {
        const result = await getDashboardData();
        console.log('📊 Overview: Dashboard data result:', result);
        
        if (result.data) {
          console.log('✅ Overview: Successfully got dashboard data, setting state...');
          setDashboardData(result.data);
          setError(null);
        } else {
          console.log('⚠️ Overview: No data returned, using fallback');
          setError(result.error || 'No data returned from service');
        }
      } catch (err) {
        console.error('❌ Overview: Error fetching dashboard data:', err);
        setError(err);
      } finally {
        setLoading(false);
        console.log('🏁 Overview: Fetch complete');
      }
    };

    fetchDashboardData();
  }, []);

  // Fallback data when database is not available or during loading
  const fallbackData = {
    kpis: {
      newProfiles: 24,
      newProfilesTrend: 12,
      shortlisted: 18,
      shortlistedTrend: 8,
      interviewsScheduled: 12,
      interviewsTrend: -5,
      offersExtended: 8,
      offersTrend: 15,
      timeToHire: 16,
      timeToHireTrend: -8
    },
    alerts: [
      {
        id: 'verification-pending',
        type: 'warning',
        title: 'Verification Pending',
        message: '3 candidates waiting for document verification',
        time: '2 hours ago',
        urgent: true
      },
      {
        id: 'expiring-offers',
        type: 'error',
        title: 'Expiring Offers',
        message: 'Offer for Arjun Kumar expires in 24 hours',
        time: '4 hours ago',
        urgent: true
      },
      {
        id: 'positive-feedback',
        type: 'success',
        title: 'Interview Feedback',
        message: 'Positive feedback received for Priya S',
        time: '1 day ago',
        urgent: false
      }
    ],
    recentActivity: [
      {
        id: 'activity-1',
        user: 'Sarah Johnson',
        action: 'shortlisted',
        candidate: 'Priya S',
        timestamp: '2 hours ago'
      },
      {
        id: 'activity-2',
        user: 'Mike Chen',
        action: 'added note for',
        candidate: 'Arjun Kumar',
        timestamp: '4 hours ago'
      },
      {
        id: 'activity-3',
        user: 'Lisa Wang',
        action: 'scheduled interview with',
        candidate: 'Deepika M',
        timestamp: '1 day ago'
      }
    ],
    shortlists: [
      {
        id: 'sl_001',
        name: 'FSQM Q4 Plant Quality Interns',
        candidates: [null, null, null],
        created_date: '2025-09-25'
      }
    ],
    savedSearches: [
      'React + Node.js',
      'Python Developers',
      'Data Science + ML',
      'Frontend Developers'
    ]
  };

  // Prioritize database data over fallback - only use fallback if we have an error AND no data
  const data = dashboardData || (error ? fallbackData : {
    kpis: { newProfiles: 0, shortlisted: 0, interviewsScheduled: 0, offersExtended: 0, timeToHire: 0 },
    alerts: [],
    recentActivity: [],
    shortlists: [],
    savedSearches: []
  });
  const alerts = data.alerts || [];
  
  // Debug logging
  console.log('📊 Overview render state:', {
    loading,
    error: error?.message || error,
    hasDashboardData: !!dashboardData,
    dataSource: dashboardData ? 'database' : (error ? 'fallback' : 'empty'),
    activityCount: data.recentActivity?.length || 0
  });


  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {loading ? (
          // Loading skeleton
          [...Array(5)].map((_, i) => (
            <div key={i} className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 animate-pulse">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="p-3 rounded-lg bg-gray-200 h-12 w-12"></div>
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <>
            <KpiCard
              title="New Profiles This Week"
              value={data.kpis?.newProfiles || 0}
              icon={UsersIcon}
              trend={data.kpis?.newProfilesTrend || 0}
              color="primary"
            />
            <KpiCard
              title="Shortlisted"
              value={data.kpis?.shortlisted || 0}
              icon={BookmarkIcon}
              trend={data.kpis?.shortlistedTrend || 0}
              color="success"
            />
            <KpiCard
              title="Interviews Scheduled"
              value={data.kpis?.interviewsScheduled || 0}
              icon={CalendarDaysIcon}
              trend={data.kpis?.interviewsTrend || 0}
              color="warning"
            />
            <KpiCard
              title="Offers Extended"
              value={data.kpis?.offersExtended || 0}
              icon={DocumentTextIcon}
              trend={data.kpis?.offersTrend || 0}
              color="primary"
            />
            <KpiCard
              title="Time-to-hire (Days)"
              value={data.kpis?.timeToHire || 0}
              icon={ClockIcon}
              trend={data.kpis?.timeToHireTrend || 0}
              color="success"
            />
          </>
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Alerts and Saved Searches */}
        <div className="lg:col-span-2 space-y-6">
          {/* Alerts */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Alerts & Tasks</h3>
            </div>
            <div className="p-6 space-y-4">
              {alerts.map((alert) => (
                <AlertCard 
                  key={alert.id} 
                  {...alert}
                  action="View Details"
                  onActionClick={() => handleAlertAction(alert)}
                />
              ))}
            </div>
          </div>

          {/* Saved Searches */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Quick Searches</h3>
            </div>
            <div className="p-6">
              <div className="flex flex-wrap gap-2">
                {(data.savedSearches || []).map((search, index) => {
                  const searchName = typeof search === 'string' ? search : search.name;
                  const searchObj = typeof search === 'string' 
                    ? { id: `search-${index}`, name: search, search_criteria: { query: search } }
                    : search;
                  
                  return (
                    <button
                      key={searchObj.id || index}
                      onClick={() => handleQuickSearchClick(searchObj)}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200 transition-colors cursor-pointer"
                    >
                      {searchName}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Shortlists */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Recent Shortlists</h3>
              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                View all
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {(data.shortlists || []).map((shortlist) => (
                  <div key={shortlist.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{shortlist.name}</p>
                      <p className="text-xs text-gray-500">{shortlist.candidates.length} candidates • {shortlist.created_date}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                        Open
                      </button>
                      <button className="text-xs text-gray-500 hover:text-gray-700 font-medium">
                        Share
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Activity Feed */}
        <div className="space-y-6">
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <button
              onClick={() => setIsActivityExpanded(!isActivityExpanded)}
              className="w-full px-6 py-4 border-b border-gray-200 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
            >
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-primary-600 font-medium">
                  {isActivityExpanded ? 'Hide' : 'View All'}
                </span>
                {isActivityExpanded ? (
                  <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </button>
            <div className="p-6">
              <ActivityFeed 
                activities={displayedActivities} 
                loading={activitiesLoading}
                showRealtimeIndicator={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
