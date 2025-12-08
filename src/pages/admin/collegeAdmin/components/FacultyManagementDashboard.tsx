import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Calendar, FileText, TrendingUp, 
  Download, Upload, Search, Filter, BarChart3 
} from 'lucide-react';
import FacultyList from './FacultyList';
import FacultyOnboarding from './FacultyOnboarding';
import FacultyTimetable from './FacultyTimetable';
import FacultyPerformanceAnalytics from './FacultyPerformanceAnalytics';
import FacultyBulkImport from './FacultyBulkImport';
import { getFacultyStatistics } from '../../../../services/facultyService';
import { useAuth } from '../../../../context/AuthContext';
import { supabase } from '../../../../lib/supabaseClient';

const FacultyManagementDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'list' | 'onboarding' | 'timetable' | 'analytics' | 'import'>('list');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [collegeId, setCollegeId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email) {
      fetchCollegeId();
    }
  }, [user?.email]);

  useEffect(() => {
    if (collegeId) {
      loadStatistics();
    }
  }, [collegeId]);

  const fetchCollegeId = async () => {
    if (!user?.email) {
      console.error('No user email found');
      setLoading(false);
      return;
    }

    try {
      // First, try to get college_id from college_lecturers table
      const { data: educatorData, error: educatorError } = await supabase
        .from('college_lecturers')
        .select('collegeId')
        .eq('metadata->>email', user.email)
        .maybeSingle();

      if (educatorData?.collegeId) {
        console.log('Found college_id from college_lecturers:', educatorData.collegeId);
        setCollegeId(educatorData.collegeId);
        return;
      }

      // If not found in college_educators, check if user is a college admin in colleges table
      console.log('Not found in college_educators, checking colleges table...');
      const { data: collegeData, error: collegeError } = await supabase
        .from('colleges')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();

      if (collegeError) {
        console.error('Error fetching from colleges:', collegeError);
      }

      if (collegeData?.id) {
        console.log('Found college_id from colleges table:', collegeData.id);
        setCollegeId(collegeData.id);
        return;
      }

      // Also try admin_email field
      const { data: collegeByAdmin, error: adminError } = await supabase
        .from('colleges')
        .select('id')
        .eq('admin_email', user.email)
        .maybeSingle();

      if (collegeByAdmin?.id) {
        console.log('Found college_id from admin_email:', collegeByAdmin.id);
        setCollegeId(collegeByAdmin.id);
        return;
      }

      console.error('No college_id found for user in any table');
      setLoading(false);
    } catch (error) {
      console.error('Error in fetchCollegeId:', error);
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    if (!collegeId) {
      console.error('No college_id available for statistics');
      setLoading(false);
      return;
    }

    try {
      const statistics = await getFacultyStatistics(collegeId);
      setStats(statistics);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'list', label: 'Faculty', icon: Users, description: 'View and manage all faculty' },
    { id: 'onboarding', label: 'Onboarding', icon: UserPlus, description: 'Add new faculty members' },
    { id: 'timetable', label: 'Timetable', icon: Calendar, description: 'Manage class schedules' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Faculty performance metrics' },
    { id: 'import', label: 'Bulk Import', icon: Upload, description: 'Import multiple faculty' },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border border-indigo-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Faculty Management
        </h1>
        <p className="text-gray-600 mb-6">
          Comprehensive faculty management system for your college
        </p>

        {/* Quick Stats */}
        {!loading && stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl p-4 border border-indigo-100">
              <p className="text-sm text-gray-600">Total Faculty</p>
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
          {tabs.map((tab) => {
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
        {activeTab === 'list' && <FacultyList collegeId={collegeId} />}
        {activeTab === 'onboarding' && <FacultyOnboarding collegeId={collegeId} />}
        {activeTab === 'timetable' && <FacultyTimetable collegeId={collegeId} />}
        {activeTab === 'analytics' && <FacultyPerformanceAnalytics collegeId={collegeId} />}
        {activeTab === 'import' && <FacultyBulkImport collegeId={collegeId} />}
      </div>
    </div>
  );
};

export default FacultyManagementDashboard;
