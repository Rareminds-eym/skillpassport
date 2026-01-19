import React from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  AcademicCapIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface AnalyticsProps {
  results: any[];
  students: any[];
  getStudentById: (id: string) => any;
  getSubjectById: (id: string) => any;
}

export const ResultsAnalytics: React.FC<AnalyticsProps> = ({
  results,
  students,
  getStudentById,
  getSubjectById
}) => {
  // Calculate analytics data
  const calculateAnalytics = () => {
    const totalResults = results.length;
    const passedResults = results.filter(r => r.status === 'pass').length;
    const failedResults = results.filter(r => r.status === 'fail').length;
    const absentResults = results.filter(r => r.status === 'absent').length;
    
    const passRate = totalResults > 0 ? (passedResults / totalResults) * 100 : 0;
    
    // Grade distribution
    const gradeDistribution = ['A+', 'A', 'B+', 'B', 'C', 'D', 'F'].map(grade => ({
      grade,
      count: results.filter(r => r.grade === grade).length,
      percentage: totalResults > 0 ? (results.filter(r => r.grade === grade).length / totalResults) * 100 : 0
    }));
    
    // Program-wise analysis
    const programAnalysis = ['Computer Science', 'Mechanical Engineering', 'Electrical Engineering'].map(program => {
      const programResults = results.filter(r => {
        const student = getStudentById(r.studentId);
        return student?.program === program;
      });
      const programPassed = programResults.filter(r => r.status === 'pass').length;
      const programPassRate = programResults.length > 0 ? (programPassed / programResults.length) * 100 : 0;
      
      return {
        program,
        totalResults: programResults.length,
        passed: programPassed,
        failed: programResults.filter(r => r.status === 'fail').length,
        absent: programResults.filter(r => r.status === 'absent').length,
        passRate: programPassRate
      };
    });
    
    // College-wise analysis
    const collegeAnalysis = ['Engineering College A', 'Engineering College B'].map(college => {
      const collegeResults = results.filter(r => {
        const student = getStudentById(r.studentId);
        return student?.college === college;
      });
      const published = collegeResults.filter(r => r.publishedAt).length;
      const pending = collegeResults.length - published;
      
      return {
        college,
        totalResults: collegeResults.length,
        published,
        pending,
        publishRate: collegeResults.length > 0 ? (published / collegeResults.length) * 100 : 0
      };
    });
    
    return {
      totalResults,
      passedResults,
      failedResults,
      absentResults,
      passRate,
      gradeDistribution,
      programAnalysis,
      collegeAnalysis
    };
  };

  const analytics = calculateAnalytics();

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overall Pass Rate</p>
              <p className="text-3xl font-bold text-green-600">{analytics.passRate.toFixed(1)}%</p>
              <div className="flex items-center mt-2">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+2.3% from last semester</span>
              </div>
            </div>
            <ChartBarIcon className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-3xl font-bold text-blue-600">{students.length}</p>
              <div className="flex items-center mt-2">
                <ArrowTrendingUpIcon className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-sm text-blue-600">+15 new admissions</span>
              </div>
            </div>
            <UserGroupIcon className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Results Published</p>
              <p className="text-3xl font-bold text-purple-600">
                {results.filter(r => r.publishedAt).length}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-sm text-gray-600">
                  {results.filter(r => !r.publishedAt).length} pending
                </span>
              </div>
            </div>
            <AcademicCapIcon className="h-12 w-12 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Absent Rate</p>
              <p className="text-3xl font-bold text-orange-600">
                {analytics.totalResults > 0 ? ((analytics.absentResults / analytics.totalResults) * 100).toFixed(1) : 0}%
              </p>
              <div className="flex items-center mt-2">
                <ArrowTrendingDownIcon className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">-1.2% improvement</span>
              </div>
            </div>
            <ChartBarIcon className="h-12 w-12 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Grade Distribution Chart */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Grade Distribution</h3>
        <div className="space-y-4">
          {analytics.gradeDistribution.map(({ grade, count, percentage }) => (
            <div key={grade} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 w-8">Grade {grade}</span>
                <div className="w-64 bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${
                      grade === 'A+' || grade === 'A' ? 'bg-green-500' :
                      grade === 'B+' || grade === 'B' ? 'bg-blue-500' :
                      grade === 'C' || grade === 'D' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-900">{count}</span>
                <span className="text-xs text-gray-500 ml-2">({percentage.toFixed(1)}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Program-wise Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Program-wise Performance</h3>
          <div className="space-y-4">
            {analytics.programAnalysis.map((program) => (
              <div key={program.program} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{program.program}</h4>
                  <span className="text-sm font-semibold text-green-600">
                    {program.passRate.toFixed(1)}% pass rate
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div 
                    className="h-2 bg-green-500 rounded-full"
                    style={{ width: `${program.passRate}%` }}
                  ></div>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div>
                    <p className="font-semibold text-gray-900">{program.totalResults}</p>
                    <p className="text-gray-500">Total</p>
                  </div>
                  <div>
                    <p className="font-semibold text-green-600">{program.passed}</p>
                    <p className="text-gray-500">Passed</p>
                  </div>
                  <div>
                    <p className="font-semibold text-red-600">{program.failed}</p>
                    <p className="text-gray-500">Failed</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600">{program.absent}</p>
                    <p className="text-gray-500">Absent</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* College-wise Statistics */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">College-wise Publication Status</h3>
          <div className="space-y-4">
            {analytics.collegeAnalysis.map((college) => (
              <div key={college.college} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{college.college}</h4>
                  <span className="text-sm font-semibold text-blue-600">
                    {college.publishRate.toFixed(1)}% published
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div 
                    className="h-2 bg-blue-500 rounded-full"
                    style={{ width: `${college.publishRate}%` }}
                  ></div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center text-xs">
                  <div>
                    <p className="font-semibold text-gray-900">{college.totalResults}</p>
                    <p className="text-gray-500">Total Results</p>
                  </div>
                  <div>
                    <p className="font-semibold text-green-600">{college.published}</p>
                    <p className="text-gray-500">Published</p>
                  </div>
                  <div>
                    <p className="font-semibold text-yellow-600">{college.pending}</p>
                    <p className="text-gray-500">Pending</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Trends */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <ArrowTrendingUpIcon className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-700">Pass Rate Improvement</p>
            <p className="text-2xl font-bold text-green-600">+5.2%</p>
            <p className="text-xs text-green-600">vs last semester</p>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <ChartBarIcon className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-blue-700">Average Grade</p>
            <p className="text-2xl font-bold text-blue-600">B+</p>
            <p className="text-xs text-blue-600">Maintained from last semester</p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <AcademicCapIcon className="h-8 w-8 text-purple-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-purple-700">Publication Rate</p>
            <p className="text-2xl font-bold text-purple-600">
              {analytics.totalResults > 0 ? 
                ((results.filter(r => r.publishedAt).length / analytics.totalResults) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-purple-600">Results published on time</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsAnalytics;