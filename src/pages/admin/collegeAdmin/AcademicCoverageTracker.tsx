/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import {
  BookOpenIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
  CalendarIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import { supabase } from '../../../lib/supabaseClient';

interface CoverageData {
  id: string;
  department: string;
  program: string;
  semester: number;
  course_code: string;
  course_name: string;
  faculty_name: string;
  total_units: number;
  completed_units: number;
  total_outcomes: number;
  completed_outcomes: number;
  completion_percentage: number;
  status: 'on_track' | 'behind' | 'completed';
  last_updated: string;
}

const AcademicCoverageTracker: React.FC = () => {
  const [coverageData, setCoverageData] = useState<CoverageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadCoverageData();
  }, []);

  const loadCoverageData = async () => {
    try {
      setLoading(true);

      // Fetch curriculum data with completion tracking
      const { data: curriculumData, error } = await supabase
        .from('curriculum')
        .select(
          `
          id,
          course_id,
          units,
          outcomes,
          updated_at,
          course_mappings (
            course_code,
            course_name,
            semester,
            program_id,
            faculty_id,
            programs (
              name,
              department_id,
              departments (
                name
              )
            ),
            users (
              name
            )
          )
        `
        )
        .eq('status', 'published');

      if (error) throw error;

      // Transform data to coverage format
      const coverage: CoverageData[] = (curriculumData || []).map((item: any) => {
        const units = item.units || [];
        const outcomes = item.outcomes || [];

        // Mock completion data - in real implementation, fetch from lesson_plans and assessments
        const completedUnits = Math.floor(units.length * Math.random());
        const completedOutcomes = Math.floor(outcomes.length * Math.random());
        const completionPercentage =
          units.length > 0 ? Math.round((completedUnits / units.length) * 100) : 0;

        let status: 'on_track' | 'behind' | 'completed' = 'on_track';
        if (completionPercentage === 100) status = 'completed';
        else if (completionPercentage < 50) status = 'behind';

        return {
          id: item.id,
          department: item.course_mappings?.programs?.departments?.name || 'N/A',
          program: item.course_mappings?.programs?.name || 'N/A',
          semester: item.course_mappings?.semester || 0,
          course_code: item.course_mappings?.course_code || 'N/A',
          course_name: item.course_mappings?.course_name || 'N/A',
          faculty_name: item.course_mappings?.users?.name || 'Unassigned',
          total_units: units.length,
          completed_units: completedUnits,
          total_outcomes: outcomes.length,
          completed_outcomes: completedOutcomes,
          completion_percentage: completionPercentage,
          status,
          last_updated: item.updated_at,
        };
      });

      setCoverageData(coverage);
    } catch (error: any) {
      console.error('Error loading coverage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = coverageData.filter((item) => {
    if (departmentFilter && item.department !== departmentFilter) return false;
    if (programFilter && item.program !== programFilter) return false;
    if (semesterFilter && item.semester.toString() !== semesterFilter) return false;
    if (statusFilter && item.status !== statusFilter) return false;
    return true;
  });

  const departments = Array.from(new Set(coverageData.map((d) => d.department)));
  const programs = Array.from(new Set(coverageData.map((d) => d.program)));
  const semesters = Array.from(new Set(coverageData.map((d) => d.semester))).sort();

  const getStatusBadge = (status: string) => {
    const styles = {
      on_track: 'bg-green-100 text-green-700',
      behind: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-blue-100 text-blue-700',
    };
    const labels = {
      on_track: 'On Track',
      behind: 'Behind Schedule',
      completed: 'Completed',
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}
      >
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Calculate summary stats
  const totalCourses = filteredData.length;
  const completedCourses = filteredData.filter((d) => d.status === 'completed').length;
  const behindSchedule = filteredData.filter((d) => d.status === 'behind').length;
  const avgCompletion =
    totalCourses > 0
      ? Math.round(filteredData.reduce((sum, d) => sum + d.completion_percentage, 0) / totalCourses)
      : 0;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Academic Coverage Tracker
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Monitor curriculum completion and learning outcome progress
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Total Courses
              </p>
              <p className="text-2xl font-bold text-gray-900">{totalCourses}</p>
            </div>
            <div className="p-3 rounded-xl border bg-blue-50 text-blue-600 border-blue-200">
              <BookOpenIcon className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Completed
              </p>
              <p className="text-2xl font-bold text-gray-900">{completedCourses}</p>
            </div>
            <div className="p-3 rounded-xl border bg-green-50 text-green-600 border-green-200">
              <CheckCircleIcon className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Behind Schedule
              </p>
              <p className="text-2xl font-bold text-gray-900">{behindSchedule}</p>
            </div>
            <div className="p-3 rounded-xl border bg-yellow-50 text-yellow-600 border-yellow-200">
              <ExclamationTriangleIcon className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Avg Completion
              </p>
              <p className="text-2xl font-bold text-gray-900">{avgCompletion}%</p>
            </div>
            <div className="p-3 rounded-xl border bg-purple-50 text-purple-600 border-purple-200">
              <ChartBarIcon className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Programs</option>
            {programs.map((prog) => (
              <option key={prog} value={prog}>
                {prog}
              </option>
            ))}
          </select>

          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Semesters</option>
            {semesters.map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="on_track">On Track</option>
            <option value="behind">Behind Schedule</option>
          </select>
        </div>
      </div>

      {/* Coverage Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Course Coverage ({filteredData.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-12">
            <BookOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No coverage data found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Course
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Department
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Program
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Semester
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Faculty
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Units Progress
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Outcomes Progress
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Completion
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.course_code}</p>
                        <p className="text-xs text-gray-500">{item.course_name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.department}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.program}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">Sem {item.semester}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.faculty_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.completed_units} / {item.total_units}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {item.completed_outcomes} / {item.total_outcomes}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 w-20">
                          <div
                            className={`h-2 rounded-full ${getProgressColor(
                              item.completion_percentage
                            )}`}
                            style={{ width: `${item.completion_percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {item.completion_percentage}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademicCoverageTracker;
