import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import {
  Users,
  UserCheck,
  Clock,
  BookOpen,
  AlertTriangle,
  TrendingUp,
  Award,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface FacultyPerformanceAnalyticsProps {
  collegeId: string | null;
}

interface FacultyData {
  id: string;
  name: string;
  department: string | null;
  designation: string | null;
  experienceYears: number | null;
  totalSlots: number;
  classesCount: number;
  subjectsCount: number;
  teachingHours: number;
  status: 'overloaded' | 'balanced' | 'underutilized' | 'unassigned';
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

const STATUS_CONFIG = {
  overloaded: { label: 'Overloaded', color: 'bg-red-100 text-red-800', threshold: 20 },
  balanced: { label: 'Balanced', color: 'bg-green-100 text-green-800', threshold: 10 },
  underutilized: { label: 'Underutilized', color: 'bg-amber-100 text-amber-800', threshold: 1 },
  unassigned: { label: 'Unassigned', color: 'bg-gray-100 text-gray-800', threshold: 0 },
};

const FacultyPerformanceAnalytics: React.FC<FacultyPerformanceAnalyticsProps> = ({ collegeId }) => {
  const [facultyData, setFacultyData] = useState<FacultyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof FacultyData>('totalSlots');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (collegeId) {
      loadFacultyAnalytics();
    }
  }, [collegeId]);

  const loadFacultyAnalytics = async () => {
    setLoading(true);
    try {
      // Fetch faculty with their timetable stats
      const { data, error } = await supabase
        .from('college_lecturers')
        .select(`
          id,
          first_name,
          last_name,
          department,
          designation,
          experienceYears,
          accountStatus
        `)
        .eq('collegeId', collegeId)
        .eq('accountStatus', 'active');

      if (error) throw error;

      // Fetch timetable slots for each faculty
      const { data: slots } = await supabase
        .from('college_timetable_slots')
        .select('educator_id, class_id, subject_name')
        .in('educator_id', data?.map(f => f.id) || []);

      // Process data
      const processedData: FacultyData[] = (data || []).map(faculty => {
        const facultySlots = slots?.filter(s => s.educator_id === faculty.id) || [];
        const uniqueClasses = new Set(facultySlots.map(s => s.class_id));
        const uniqueSubjects = new Set(facultySlots.map(s => s.subject_name));
        const totalSlots = facultySlots.length;
        const teachingHours = totalSlots * 0.83; // ~50 min per slot

        let status: FacultyData['status'] = 'unassigned';
        if (totalSlots >= STATUS_CONFIG.overloaded.threshold) status = 'overloaded';
        else if (totalSlots >= STATUS_CONFIG.balanced.threshold) status = 'balanced';
        else if (totalSlots >= STATUS_CONFIG.underutilized.threshold) status = 'underutilized';

        return {
          id: faculty.id,
          name: `${faculty.first_name || ''} ${faculty.last_name || ''}`.trim() || 'Unknown',
          department: faculty.department,
          designation: faculty.designation,
          experienceYears: faculty.experienceYears,
          totalSlots,
          classesCount: uniqueClasses.size,
          subjectsCount: uniqueSubjects.size,
          teachingHours: Math.round(teachingHours * 10) / 10,
          status,
        };
      });

      setFacultyData(processedData);
    } catch (error) {
      console.error('Error loading faculty analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Computed stats
  const stats = useMemo(() => {
    const totalFaculty = facultyData.length;
    const activeFaculty = facultyData.filter(f => f.totalSlots > 0).length;
    const totalSlots = facultyData.reduce((sum, f) => sum + f.totalSlots, 0);
    const avgTeachingHours = activeFaculty > 0 
      ? Math.round((facultyData.reduce((sum, f) => sum + f.teachingHours, 0) / activeFaculty) * 10) / 10
      : 0;
    const totalClasses = new Set(facultyData.flatMap(f => f.classesCount)).size;

    return { totalFaculty, activeFaculty, totalSlots, avgTeachingHours, totalClasses };
  }, [facultyData]);

  // Department distribution for pie chart
  const departmentData = useMemo(() => {
    const deptMap = new Map<string, number>();
    facultyData.forEach(f => {
      const dept = f.department || 'Unassigned';
      deptMap.set(dept, (deptMap.get(dept) || 0) + 1);
    });
    return Array.from(deptMap.entries()).map(([name, count]) => ({ name, count }));
  }, [facultyData]);

  // Teaching load chart data
  const teachingLoadData = useMemo(() => {
    return facultyData
      .filter(f => f.totalSlots > 0)
      .sort((a, b) => b.totalSlots - a.totalSlots)
      .slice(0, 10)
      .map(f => ({
        name: f.name.split(' ')[0], // First name only for chart
        slots: f.totalSlots,
        hours: f.teachingHours,
      }));
  }, [facultyData]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    const dist = { overloaded: 0, balanced: 0, underutilized: 0, unassigned: 0 };
    facultyData.forEach(f => dist[f.status]++);
    return dist;
  }, [facultyData]);

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    let result = [...facultyData];

    if (searchTerm) {
      result = result.filter(f => 
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (departmentFilter !== 'all') {
      result = result.filter(f => f.department === departmentFilter);
    }

    if (statusFilter !== 'all') {
      result = result.filter(f => f.status === statusFilter);
    }

    result.sort((a, b) => {
      const aVal = a[sortField] ?? 0;
      const bVal = b[sortField] ?? 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    return result;
  }, [facultyData, searchTerm, departmentFilter, statusFilter, sortField, sortDirection]);

  const departments = useMemo(() => {
    const depts = new Set(facultyData.map(f => f.department).filter(Boolean));
    return Array.from(depts) as string[];
  }, [facultyData]);

  const handleSort = (field: keyof FacultyData) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border border-indigo-100">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
          Faculty Analytics
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Performance metrics and insights for your faculty
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalFaculty}</p>
              <p className="text-xs text-gray-500">Total Faculty</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.activeFaculty}</p>
              <p className="text-xs text-gray-500">Active (Assigned)</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.avgTeachingHours}h</p>
              <p className="text-xs text-gray-500">Avg Hours/Week</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <BookOpen className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSlots}</p>
              <p className="text-xs text-gray-500">Total Slots</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <div
            key={key}
            className={`rounded-lg p-3 ${config.color} cursor-pointer transition hover:opacity-80`}
            onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
          >
            <p className="text-2xl font-bold">{statusDistribution[key as keyof typeof statusDistribution]}</p>
            <p className="text-sm">{config.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Teaching Load Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            Teaching Load (Top 10)
          </h3>
          {teachingLoadData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={teachingLoadData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'slots' ? `${value} slots` : `${value} hours`,
                    name === 'slots' ? 'Weekly Slots' : 'Teaching Hours'
                  ]}
                />
                <Bar dataKey="slots" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500">
              No teaching data available
            </div>
          )}
        </div>

        {/* Department Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-purple-600" />
            Department Distribution
          </h3>
          {departmentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="name"
                  label={({ name, percent }) => `${(name || '').substring(0, 10)}... (${((percent || 0) * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {departmentData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500">
              No department data available
            </div>
          )}
        </div>
      </div>

      {/* Alerts Section */}
      {(statusDistribution.unassigned > 0 || statusDistribution.overloaded > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Attention Required
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            {statusDistribution.unassigned > 0 && (
              <div className="bg-white rounded-lg p-3 border border-amber-200">
                <p className="text-sm text-amber-800">
                  <span className="font-bold">{statusDistribution.unassigned}</span> faculty members have no classes assigned
                </p>
              </div>
            )}
            {statusDistribution.overloaded > 0 && (
              <div className="bg-white rounded-lg p-3 border border-red-200">
                <p className="text-sm text-red-800">
                  <span className="font-bold">{statusDistribution.overloaded}</span> faculty members may be overloaded (20+ slots/week)
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Faculty Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-600" />
              Faculty Performance Details
            </h3>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 w-40"
                />
              </div>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="overloaded">Overloaded</option>
                <option value="balanced">Balanced</option>
                <option value="underutilized">Underutilized</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Faculty
                    {sortField === 'name' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Department</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Designation</th>
                <th 
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('totalSlots')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Slots
                    {sortField === 'totalSlots' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('teachingHours')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Hours
                    {sortField === 'teachingHours' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Classes</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Subjects</th>
                <th 
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('experienceYears')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Exp
                    {sortField === 'experienceYears' && (sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map((faculty) => (
                <tr key={faculty.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-indigo-600">
                          {faculty.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">{faculty.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{faculty.department || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">{faculty.designation?.replace('_', ' ') || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-semibold ${faculty.totalSlots > 0 ? 'text-indigo-600' : 'text-gray-400'}`}>
                      {faculty.totalSlots}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">{faculty.teachingHours}h</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">{faculty.classesCount}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">{faculty.subjectsCount}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-600">
                    {faculty.experienceYears !== null ? `${faculty.experienceYears}y` : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[faculty.status].color}`}>
                      {STATUS_CONFIG[faculty.status].label}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                    No faculty found matching your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-sm text-gray-600">
          Showing {filteredData.length} of {facultyData.length} faculty members
        </div>
      </div>
    </div>
  );
};

export default FacultyPerformanceAnalytics;
