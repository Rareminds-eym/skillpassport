import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@heroicons/react/24/outline';
import KPICard from '../../components/educator/KPICard';
import { educatorApi } from '../../services/educator/mockApi';
import { Activity } from '../../data/educator/mockActivities';

interface DashboardKPIs {
  totalStudents: number;
  activeStudents: number;
  pendingActivities: number;
  verifiedActivities: number;
  totalActivities: number;
  verificationRate: number;
  recentActivitiesCount: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [kpisData, activitiesData] = await Promise.all([
        educatorApi.dashboard.getKPIs(),
        educatorApi.activities.getAll(),
      ]);
      
      setKpis(kpisData);
      // Get the 5 most recent activities
      const sorted = [...activitiesData].sort(
        (a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime()
      );
      setRecentActivities(sorted.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      'day'
    );
  };

  return (
    <div className="space-y-8" data-testid="educator-dashboard">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back! Here's what's happening with your students.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Featured Modules Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mentor Notes Module */}
        <div 
          onClick={() => navigate('/educator/mentornotes')}
          className="group bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-xl">
              <PencilSquareIcon className="h-8 w-8" />
            </div>
            <ArrowRightIcon className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
          </div>
          <h3 className="text-2xl font-bold mb-2">📝 Mentor Notes</h3>
          <p className="text-blue-100 mb-4">Record feedback and personal observations for students</p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <UserGroupIcon className="h-4 w-4" />
              <span>{kpis?.totalStudents || 0} Students</span>
            </div>
            <div className="flex items-center gap-1">
              <DocumentChartBarIcon className="h-4 w-4" />
              <span>45 Notes</span>
            </div>
          </div>
        </div>

        {/* Verification Module */}
        <div 
          onClick={() => navigate('/educator/activities')}
          className="group bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 text-white cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-xl">
              <CheckCircleIcon className="h-8 w-8" />
            </div>
            <ArrowRightIcon className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
          </div>
          <h3 className="text-2xl font-bold mb-2">✅ Verification</h3>
          <p className="text-emerald-100 mb-4">Approve or reject student-submitted skill activities</p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <ClockIcon className="h-4 w-4" />
              <span>{kpis?.pendingActivities || 0} Pending</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircleIcon className="h-4 w-4" />
              <span>{kpis?.verifiedActivities || 0} Verified</span>
            </div>
          </div>
        </div>

        {/* Analytics Module */}
        <div 
          onClick={() => navigate('/educator/analytics')}
          className="group bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-xl">
              <ChartBarIcon className="h-8 w-8" />
            </div>
            <ArrowRightIcon className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
          </div>
          <h3 className="text-2xl font-bold mb-2">📊 Analytics</h3>
          <p className="text-purple-100 mb-4">Class performance and student skill growth insights</p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <TrophyIcon className="h-4 w-4" />
              <span>Top 10</span>
            </div>
            <div className="flex items-center gap-1">
              <AcademicCapIcon className="h-4 w-4" />
              <span>6 Categories</span>
            </div>
          </div>
        </div>
      </div>

      {/* Skill Analytics Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Skill Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-2">Skill Participation (Bar Chart)</p>
            <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">[Bar Chart Placeholder]</div>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Skill Distribution (Pie Chart)</p>
            <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">[Pie Chart Placeholder]</div>
          </div>
        </div>
      </div>

      {/* Announcements Panel */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Announcements</h2>
        <div className="flex gap-3 mb-4">
          <input type="text" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg" placeholder="Type announcement..." />
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg">Send</button>
        </div>
        <ul className="space-y-2">
          <li className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">Submit project by Friday</li>
          <li className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">School event on Monday</li>
        </ul>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/educator/activities')}
            className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all"
            data-testid="quick-action-verify"
          >
            <div className="flex items-center space-x-3">
              <CheckCircleIcon className="h-6 w-6 text-indigo-600" />
              <span className="font-medium text-gray-900">Verify Activities</span>
            </div>
            <ArrowRightIcon className="h-5 w-5 text-gray-400" />
          </button>

          <button
            onClick={() => navigate('/educator/students')}
            className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all"
            data-testid="quick-action-students"
          >
            <div className="flex items-center space-x-3">
              <UserGroupIcon className="h-6 w-6 text-indigo-600" />
              <span className="font-medium text-gray-900">View Students</span>
            </div>
            <ArrowRightIcon className="h-5 w-5 text-gray-400" />
          </button>

          <button
            onClick={() => navigate('/educator/import')}
            className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all"
            data-testid="quick-action-import"
          >
            <div className="flex items-center space-x-3">
              <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="font-medium text-gray-900">Import Students</span>
            </div>
            <ArrowRightIcon className="h-5 w-5 text-gray-400" />
          </button>

          <button
            onClick={() => navigate('/educator/reports')}
            className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all"
            data-testid="quick-action-reports"
          >
            <div className="flex items-center space-x-3">
              <ChartBarIcon className="h-6 w-6 text-indigo-600" />
              <span className="font-medium text-gray-900">View Reports</span>
            </div>
            <ArrowRightIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Recent Activities Feed */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity Submissions</h2>
          <button
            onClick={() => navigate('/educator/activities')}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            data-testid="view-all-activities"
          >
            View All
          </button>
        </div>
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading activities...</div>
          ) : recentActivities.length === 0 ? (
            <div className="p-6 text-center text-gray-500" data-testid="empty-activities">
              No recent activities
            </div>
          ) : (
            recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => navigate(`/educator/activities/${activity.id}`)}
                data-testid="activity-item"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-base font-medium text-gray-900">{activity.title}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(activity.status)}`}>
                        {activity.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{activity.studentName} • {activity.category}</p>
                    <p className="text-sm text-gray-500 line-clamp-2">{activity.description}</p>
                  </div>
                  <span className="text-sm text-gray-500 whitespace-nowrap ml-4">
                    {formatDate(activity.submittedDate)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
