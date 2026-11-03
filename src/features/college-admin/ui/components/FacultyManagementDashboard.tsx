import {
  BarChart3,
  Calendar,
  CalendarOff,
  ClipboardCheck,
  RefreshCw,
  Upload,
  UserPlus,
  Users
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';
import { getFacultyStatistics } from '@/features/college-admin';
import FacultyLeaveManagement from '@/features/college-admin/ui/FacultyLeaveManagement';
import CalendarTimetable from './CalendarTimetable';
import EducatorAttendanceTracking from './EducatorAttendanceTracking';
import FacultyBulkImport from './FacultyBulkImport';
import FacultyList from './FacultyList';
import FacultyOnboarding from './FacultyOnboarding';
import FacultyPerformanceAnalytics from './FacultyPerformanceAnalytics';
import SwapRequestsManagement from './SwapRequestsManagement';

const logger = getLogger('college-admin:FacultyManagementDashboard');

import { useUser } from '@/shared/model/authStore';
const FacultyManagementDashboard: React.FC = () => {
  const user = useUser();
  const [activeTab, setActiveTab] = useState<'list' | 'onboarding' | 'timetable' | 'analytics' | 'leave' | 'import' | 'swaps' | 'attendance'>('list');
  const [visited, setVisited] = useState<string[]>(['list']);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [revision, setRevision] = useState(0);
  const onChanged = useCallback(() => setRevision(value => value + 1), []);
  const [error, setError] = useState('');
  const [resolving, setResolving] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [collegeId, setCollegeId] = useState<string | null>(null);

  useEffect(() => {
    void fetchCollegeId();
  }, [user?.id, user?.email]);

  useEffect(() => {
    if (collegeId) {
      loadStatistics();
    }
  }, [collegeId, revision]);

  const fetchCollegeId = async () => {
    setResolving(true);
    setError('');
    if (!user?.email) {
      setError('Sign in with your college administrator account to manage faculty.');
      setResolving(false);
      setLoading(false);
      return;
    }

    try {
      const result = await apiPost<{ data?: { college_id?: string } }>('/college-admin/faculty', {
        action: 'resolve-user-college',
        user_id: user.id,
        email: user.email,
      });

      if (result.data?.college_id) {
        setCollegeId(result.data.college_id);
        setResolving(false);
        return;
      }

      setError('Your account is not linked to a college. Contact your administrator.');
      setResolving(false);
      setLoading(false);
    } catch (error) {
      logger.error('Error in fetchCollegeId', error as Error);
      setError('Could not load your college. Please try again.');
      setResolving(false);
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
      setError('');
      const statistics = await getFacultyStatistics(collegeId);
      setStats(statistics);
    } catch (error) {
      logger.error('Failed to load statistics', error as Error);
      setError('Could not refresh faculty totals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'list', label: 'Faculty', icon: Users, description: 'View and manage all faculty' },
    { id: 'onboarding', label: 'Onboarding', icon: UserPlus, description: 'Add new faculty members' },
    { id: 'timetable', label: 'Timetable', icon: Calendar, description: 'Manage class schedules' },
    { id: 'swaps', label: 'Swap Requests', icon: RefreshCw, description: 'Manage class swap requests' },
    { id: 'attendance', label: 'Attendance', icon: ClipboardCheck, description: 'Track educator attendance' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Faculty performance metrics' },
    { id: 'leave', label: 'Leave', icon: CalendarOff, description: 'Leave & substitution' },
    { id: 'import', label: 'Bulk Import', icon: Upload, description: 'Import multiple faculty' },
  ] as const;

  const selectTab = (id: typeof activeTab) => {
    setVisited(current => current.includes(id) ? current : [...current, id]);
    setActiveTab(id);
  };

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

      {error && <div role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">{error} <button type="button" className="font-semibold underline" onClick={() => void (collegeId ? loadStatistics() : fetchCollegeId())}>Try again</button></div>}
      {resolving && <p role="status">Loading your college…</p>}
      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-2">
        <div role="tablist" aria-label="Faculty management sections" className="flex gap-2 overflow-x-auto">
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`faculty-tab-${tab.id}`}
                aria-controls={`faculty-panel-${tab.id}`}
                aria-selected={activeTab === tab.id}
                tabIndex={activeTab === tab.id ? 0 : -1}
                ref={node => { tabRefs.current[tab.id] = node; }}
                onClick={() => selectTab(tab.id)}
                onKeyDown={event => {
                  const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1;
                  if (next < 0) return;
                  event.preventDefault();
                  selectTab(tabs[next].id);
                  tabRefs.current[tabs[next].id]?.focus();
                }}
                className={`flex shrink-0 items-center justify-center gap-2 p-3 rounded-lg font-medium transition-all ${activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <Icon className="h-6 w-6" />
                <div className="text-center">
                  <div className="text-sm font-semibold">{tab.label}</div>
                  <div className={`hidden text-xs mt-1 ${activeTab === tab.id ? 'text-indigo-100' : 'text-gray-500'}`}>
                    {tab.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {!resolving && collegeId && tabs.map(tab => (
        <div key={`${collegeId}-${tab.id}`} role="tabpanel" id={`faculty-panel-${tab.id}`} aria-labelledby={`faculty-tab-${tab.id}`} hidden={activeTab !== tab.id} tabIndex={0} className="min-w-0 rounded-2xl border border-gray-200 bg-white shadow-sm">
          {tab.id === 'list' && activeTab === 'list' && <FacultyList collegeId={collegeId} revision={revision} onChanged={onChanged} onAdd={() => selectTab('onboarding')} />}
          {tab.id === 'onboarding' && visited.includes('onboarding') && <FacultyOnboarding collegeId={collegeId} onChanged={onChanged} />}
          {tab.id === 'import' && visited.includes('import') && <FacultyBulkImport collegeId={collegeId} onChanged={onChanged} />}
          {tab.id === 'timetable' && activeTab === tab.id && <CalendarTimetable collegeId={collegeId} />}
          {tab.id === 'swaps' && activeTab === tab.id && <SwapRequestsManagement collegeId={collegeId} />}
          {tab.id === 'attendance' && activeTab === tab.id && <EducatorAttendanceTracking />}
          {tab.id === 'analytics' && activeTab === tab.id && <FacultyPerformanceAnalytics collegeId={collegeId} />}
          {tab.id === 'leave' && activeTab === tab.id && <FacultyLeaveManagement collegeId={collegeId} />}
        </div>
      ))}
    </div>
  );
};

export default FacultyManagementDashboard;
