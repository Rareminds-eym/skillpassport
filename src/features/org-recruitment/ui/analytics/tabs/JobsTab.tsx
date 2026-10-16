/**
 * Jobs Analytics Tab Component
 * Displays job performance, requisition status, and distribution charts
 */

import { useState } from 'react';
import {
  BriefcaseIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChevronUpDownIcon,
  EyeIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useJobsData } from '../hooks/useJobsData';
import type { JobPerformance } from '../types';

interface JobsTabProps {
  orgId: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800 border-green-200',
  draft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  closed: 'bg-gray-100 text-gray-800 border-gray-200',
  paused: 'bg-blue-100 text-blue-800 border-blue-200',
};

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#EC4899', '#84CC16'];

type SortField = 'title' | 'applicationsCount' | 'viewsCount' | 'applicationRate' | 'daysOpen';
type SortOrder = 'asc' | 'desc';

export function JobsTab({ orgId }: JobsTabProps) {
  const { data, isLoading, isError, error } = useJobsData({ orgId });
  const [sortField, setSortField] = useState<SortField>('daysOpen');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
          <div className="h-96 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Jobs Analytics</h3>
        <p className="text-red-700 mb-4">{error instanceof Error ? error.message : 'Unknown error'}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Reload Page
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { jobPerformance, requisitionStatus, departmentDistribution, locationDistribution } = data;

  // Sort job performance
  const sortedJobs = [...jobPerformance].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    
    const aNum = Number(aVal) || 0;
    const bNum = Number(bVal) || 0;
    return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Prepare chart data
  const deptChartData = departmentDistribution.slice(0, 8).map((dept, index) => ({
    name: dept.department,
    value: dept.count,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const locChartData = locationDistribution.slice(0, 8).map((loc, index) => ({
    name: loc.location,
    value: loc.count,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      {/* Requisition Status Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Requisition Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <BriefcaseIcon className="h-5 w-5 text-green-600" />
              <span className="text-xs font-medium text-gray-600">Active</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{requisitionStatus.active}</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircleIcon className="h-5 w-5 text-blue-600" />
              <span className="text-xs font-medium text-gray-600">Filled</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{requisitionStatus.filled}</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <ClockIcon className="h-5 w-5 text-yellow-600" />
              <span className="text-xs font-medium text-gray-600">On Hold</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{requisitionStatus.onHold}</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
              <span className="text-xs font-medium text-gray-600">Overdue</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{requisitionStatus.pastTargetDate}</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <ClockIcon className="h-5 w-5 text-purple-600" />
              <span className="text-xs font-medium text-gray-600">Avg Fill Time</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{requisitionStatus.avgFillTimeDays}d</div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <BriefcaseIcon className="h-5 w-5 text-gray-600" />
              <span className="text-xs font-medium text-gray-600">Cancelled</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{requisitionStatus.cancelled}</div>
          </div>
        </div>
      </div>

      {/* Job Performance Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Job Performance</h3>
          <p className="text-sm text-gray-500 mt-1">Top {sortedJobs.length} jobs by performance metrics</p>
        </div>
        
        {sortedJobs.length === 0 ? (
          <div className="p-8 text-center">
            <BriefcaseIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No Jobs Found</p>
            <p className="text-sm text-gray-500 mt-1">Post jobs to see analytics</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('title')}
                      className="flex items-center gap-1 hover:text-gray-700"
                    >
                      Job Title
                      <ChevronUpDownIcon className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('viewsCount')}
                      className="flex items-center gap-1 hover:text-gray-700 mx-auto"
                    >
                      Views
                      <ChevronUpDownIcon className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('applicationsCount')}
                      className="flex items-center gap-1 hover:text-gray-700 mx-auto"
                    >
                      Applications
                      <ChevronUpDownIcon className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('applicationRate')}
                      className="flex items-center gap-1 hover:text-gray-700 mx-auto"
                    >
                      Conversion
                      <ChevronUpDownIcon className="h-4 w-4" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('daysOpen')}
                      className="flex items-center gap-1 hover:text-gray-700 mx-auto"
                    >
                      Days Open
                      <ChevronUpDownIcon className="h-4 w-4" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedJobs.slice(0, 20).map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{job.title}</div>
                      <div className="text-xs text-gray-500">{job.location}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{job.department}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${STATUS_COLORS[job.status] || STATUS_COLORS.active}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <EyeIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{job.viewsCount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <UserGroupIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{job.applicationsCount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              job.applicationRate >= 10
                                ? 'bg-green-500'
                                : job.applicationRate >= 5
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(job.applicationRate * 10, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">{job.applicationRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-sm font-medium ${
                        job.daysOpen > 60 ? 'text-red-600' : job.daysOpen > 30 ? 'text-yellow-600' : 'text-gray-900'
                      }`}>
                        {job.daysOpen}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Jobs by Department</h3>
          {deptChartData.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-gray-500">
              <p className="text-sm">No department data</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={deptChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={{ stroke: '#9CA3AF', strokeWidth: 1 }}
                >
                  {deptChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Location Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Jobs by Location</h3>
          {locChartData.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-gray-500">
              <p className="text-sm">No location data</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={locChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={{ stroke: '#9CA3AF', strokeWidth: 1 }}
                >
                  {locChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
