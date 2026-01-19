import {
    AcademicCapIcon,
    ArrowDownTrayIcon,
    CalendarIcon,
    ChartBarIcon,
    DocumentChartBarIcon,
    PrinterIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { attendanceService, studentReportService } from '../../../services/studentManagementService';

interface StudentReportData {
  id: string;
  name: string;
  rollNumber: string;
  class: string;
  section: string;
  enrollmentNumber: string;
  attendancePercentage: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  assessmentCount: number;
  averageScore: number;
}

const StudentReports: React.FC = () => {
  const [students, setStudents] = useState<StudentReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolId, setSchoolId] = useState<string | null>(null);

  useEffect(() => {
    fetchSchoolIdAndReports();
  }, []);

  const fetchSchoolIdAndReports = async () => {
    try {
      setLoading(true);

      // Get current user's school_id
      let currentSchoolId: string | null = null;

      // First, check if user is logged in via AuthContext (for school admins)
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          if (userData.role === 'school_admin' && userData.schoolId) {
            currentSchoolId = userData.schoolId;
            console.log('✅ School admin detected, using schoolId:', currentSchoolId);
          }
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }

      // If not found in localStorage, try Supabase Auth (for educators/teachers)
      if (!currentSchoolId) {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Check school_educators table - use maybeSingle() to avoid 406 error
          const { data: educator } = await supabase
            .from('school_educators')
            .select('school_id')
            .eq('user_id', user.id)
            .maybeSingle();

          if (educator?.school_id) {
            currentSchoolId = educator.school_id;
          } else {
            // Check organizations table for school admins (by admin_id or email)
            const { data: org } = await supabase
              .from('organizations')
              .select('id')
              .eq('organization_type', 'school')
              .or(`admin_id.eq.${user.id},email.eq.${user.email}`)
              .maybeSingle();

            currentSchoolId = org?.id || null;
          }
        }
      }

      if (!currentSchoolId) {
        console.error('No school_id found for this user');
        setLoading(false);
        return;
      }

      setSchoolId(currentSchoolId);
      console.log('Fetching reports for school_id:', currentSchoolId);

      // Fetch students with their data
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          name,
          roll_number,
          grade,
          section,
          extended:student_management_records(enrollment_number)
        `)
        .eq('school_id', currentSchoolId);

      if (studentsError) throw studentsError;

      // Fetch attendance and assessment data for each student
      const enrichedStudents = await Promise.all(
        (studentsData || []).map(async (student: any) => {
          // Get attendance summary
          const { data: attendanceData } = await attendanceService.getStudentAttendanceSummary(student.id);
          
          // Get assessments
          const { data: assessments } = await supabase
            .from('skill_assessments')
            .select('score, max_score')
            .eq('student_id', student.id)
            .eq('school_id', currentSchoolId);

          const avgScore = assessments && assessments.length > 0
            ? assessments.reduce((sum: number, a: any) => sum + (a.score / a.max_score * 100), 0) / assessments.length
            : 0;

          return {
            id: student.id,
            name: student.name,
            rollNumber: student.roll_number || 'N/A',
            class: student.grade || 'N/A',
            section: student.section || 'N/A',
            enrollmentNumber: student.extended?.enrollment_number || 'N/A',
            attendancePercentage: attendanceData?.percentage || 0,
            totalDays: attendanceData?.totalDays || 0,
            presentDays: attendanceData?.presentDays || 0,
            absentDays: attendanceData?.absentDays || 0,
            assessmentCount: assessments?.length || 0,
            averageScore: avgScore,
          };
        })
      );

      setStudents(enrichedStudents);
    } catch (error) {
      console.error('Error fetching student reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (studentId: string, type: string) => {
    if (!schoolId) {
      alert('School information not available');
      return;
    }

    try {
      const academicYear = '2024-2025';
      
      let result;
      switch (type) {
        case 'attendance':
          result = await studentReportService.generateAttendanceReport(studentId, schoolId, academicYear);
          break;
        case 'academic':
          result = await studentReportService.generateAcademicReport(studentId, schoolId, academicYear);
          break;
        case 'career_readiness':
          result = await studentReportService.generateCareerReadinessReport(studentId, schoolId, academicYear);
          break;
      }

      if (result?.data) {
        alert('Report generated successfully!');
        // Optionally download or display the report
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report');
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Roll Number', 'Class', 'Section', 'Enrollment', 'Attendance %', 'Total Days', 'Present', 'Absent', 'Assessments', 'Avg Score'];
    const rows = students.map(s => [
      s.name,
      s.rollNumber,
      s.class,
      s.section,
      s.enrollmentNumber,
      s.attendancePercentage.toFixed(1),
      s.totalDays,
      s.presentDays,
      s.absentDays,
      s.assessmentCount,
      s.averageScore.toFixed(1),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `student_reports_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading student reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <DocumentChartBarIcon className="h-8 w-8 text-indigo-600" />
              Student Reports
            </h1>
            <p className="text-sm sm:text-base mt-2 text-gray-600">
              Comprehensive student performance and attendance reports
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <PrinterIcon className="h-4 w-4" />
              Print
            </button>
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{students.length}</p>
            </div>
            <UserGroupIcon className="h-10 w-10 text-indigo-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Attendance</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {students.length > 0
                  ? (students.reduce((sum, s) => sum + s.attendancePercentage, 0) / students.length).toFixed(1)
                  : 0}%
              </p>
            </div>
            <CalendarIcon className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Score</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {students.length > 0
                  ? (students.reduce((sum, s) => sum + s.averageScore, 0) / students.length).toFixed(1)
                  : 0}%
              </p>
            </div>
            <AcademicCapIcon className="h-10 w-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Assessments</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {students.reduce((sum, s) => sum + s.assessmentCount, 0)}
              </p>
            </div>
            <ChartBarIcon className="h-10 w-10 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Student Performance Overview</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Enrollment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assessments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      <div className="text-sm text-gray-500">Roll: {student.rollNumber}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.class} - {student.section}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.enrollmentNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {student.attendancePercentage.toFixed(1)}%
                      </div>
                      <div className="ml-2 text-xs text-gray-500">
                        ({student.presentDays}/{student.totalDays})
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div
                        className={`h-1.5 rounded-full ${
                          student.attendancePercentage >= 75 ? 'bg-green-600' : 'bg-red-600'
                        }`}
                        style={{ width: `${student.attendancePercentage}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.assessmentCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      student.averageScore >= 75
                        ? 'bg-green-100 text-green-800'
                        : student.averageScore >= 50
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {student.averageScore.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => generateReport(student.id, 'attendance')}
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                        title="Generate Attendance Report"
                      >
                        Attendance
                      </button>
                      <button
                        onClick={() => generateReport(student.id, 'academic')}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                        title="Generate Academic Report"
                      >
                        Academic
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {students.length === 0 && (
          <div className="text-center py-12">
            <DocumentChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No student data available for reports.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentReports;
