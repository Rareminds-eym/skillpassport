import {
  BarChart3,
  Calendar,
  CalendarOff,
  RefreshCw,
  Upload,
  UserPlus,
  Users
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';
import { getFacultyStatistics } from '@/features/college-admin';
import FacultyLeaveManagement from '@/features/college-admin/ui/FacultyLeaveManagement';
import CalendarTimetable from './CalendarTimetable';
import FacultyBulkImport from './FacultyBulkImport';
import FacultyList from './FacultyList';
import FacultyOnboarding from './FacultyOnboarding';
import FacultyPerformanceAnalytics from './FacultyPerformanceAnalytics';
import SwapRequestsManagement from './SwapRequestsManagement';

const logger = getLogger('college-admin:FacultyManagementDashboard');

import { useUser } from '@/shared/model/authStore';
const FacultyManagementDashboard: React.FC = () => {
  const user = useUser();
  const [activeTab, setActiveTab] = useState<'list' | 'onboarding' | 'timetable' | 'analytics' | 'leave' | 'import' | 'swaps'>('list');
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
      logger.error('No user email found');
      setLoading(false);
      return;
    }

    try {
      const result = await apiPost('/college-admin/faculty', {
        action: 'resolve-user-college',
        user_id: user.id,
        email: user.email,
      });

      if (result.data?.college_id) {
        setCollegeId(result.data.college_id);
        return;
      }

      logger.error('No college_id found for user in any table');
      setLoading(false);
    } catch (error) {
      logger.error('Error in fetchCollegeId', error as Error);
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    if (!collegeId) {
      logger.error('No college_id available for statistics');
      setLoading(false);
      return;
    }

    try {
      const statistics = await getFacultyStatistics(collegeId);
      setStats(statistics);
    } catch (error) {
      logger.error('Failed to load statistics', error as Error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'list', label: 'Faculty', icon: Users, description: 'View and manage all faculty' },
    { id: 'onboarding', label: 'Onboarding', icon: UserPlus, description: 'Add new faculty members' },
    { id: 'timetable', label: 'Timetable', icon: Calendar, description: 'Manage class schedules' },
    { id: 'swaps', label: 'Swap Requests', icon: RefreshCw, description: 'Manage class swap requests' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Faculty performance metrics' },
    { id: 'leave', label: 'Leave', icon: CalendarOff, description: 'Leave & substitution' },
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-lg font-medium transition-all ${activeTab === tab.id
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
        {activeTab === 'timetable' && <CalendarTimetable collegeId={collegeId} />}
        {activeTab === 'swaps' && <SwapRequestsManagement collegeId={collegeId} />}
        {activeTab === 'analytics' && <FacultyPerformanceAnalytics collegeId={collegeId} />}
        {activeTab === 'leave' && <FacultyLeaveManagement collegeId={collegeId} />}
        {activeTab === 'import' && <FacultyBulkImport collegeId={collegeId} />}
      </div>
    </div>
  );
};

export default FacultyManagementDashboard;
