import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Calendar, FileText, TrendingUp, 
  Download, Upload, Search, Filter, BarChart3 
} from 'lucide-react';
import TeacherList from './TeacherList';
import TeacherOnboarding from './TeacherOnboarding';
import TimetableBuilderEnhanced from './TimetableBuilderEnhanced';
import TeacherPerformanceAnalytics from './TeacherPerformanceAnalytics';
import TeacherBulkImport from './TeacherBulkImport';
import { getTeacherStatistics } from '../../../../services/teacherService';
import { useUserRole } from '../../../../hooks/useUserRole';

const TeacherManagementDashboard: React.FC = () => {
  const { role, canAddTeacher } = useUserRole();
  const [activeTab, setActiveTab] = useState<'list' | 'onboarding' | 'timetable' | 'analytics' | 'import'>('list');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      // Get school_id from current user
      const schoolId = 'your-school-id'; // Replace with actual school ID from auth
      const statistics = await getTeacherStatistics(schoolId);
      setStats(statistics);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'list', label: 'Teachers', icon: Users, description: 'View and manage all teachers' },
    { id: 'onboarding', label: 'Onboarding', icon: UserPlus, description: 'Add new teachers', requiresPermission: true },
    { id: 'timetable', label: 'Timetable', icon: Calendar, description: 'Manage class schedules' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Teacher performance metrics' },
    { id: 'import', label: 'Bulk Import', icon: Upload, description: 'Import multiple teachers', requiresPermission: true },
  ];

  const filteredTabs = tabs.filter(tab => !tab.requiresPermission || canAddTeacher());

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border border-indigo-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Teacher Management
        </h1>
        <p className="text-gray-600 mb-6">
          Comprehensive teacher management system for your school
        </p>

        {/* Quick Stats */}
        {!loading && stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl p-4 border border-indigo-100">
              <p className="text-sm text-gray-600">Total Teachers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-green-100">
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-yellow-100">
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-blue-100">
              <p className="text-sm text-gray-600">Verified</p>
              <p className="text-2xl font-bold text-blue-600">{stats.verified}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <p className="text-sm text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-600">{stats.inactive}</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-2">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {filteredTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-6 w-6" />
                <div className="text-center">
                  <div className="text-sm font-semibold">{tab.label}</div>
                  <div className={`text-xs mt-1 ${activeTab === tab.id ? 'text-indigo-100' : 'text-gray-500'}`}>
                    {tab.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
        {activeTab === 'list' && <TeacherList />}
        {activeTab === 'onboarding' && <TeacherOnboarding />}
        {activeTab === 'timetable' && <TimetableBuilderEnhanced />}
        {activeTab === 'analytics' && <TeacherPerformanceAnalytics />}
        {activeTab === 'import' && <TeacherBulkImport />}
      </div>
    </div>
  );
};

export default TeacherManagementDashboard;
