import React from 'react';
import { Award, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';

export interface SchoolStudentResult {
  id: string;
  assessment_id: string;
  assessment_code: string;
  type: string;
  exam_date: string;
  subject_name: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  grade?: string;
  is_pass: boolean;
  is_absent: boolean;
  is_exempt: boolean;
  is_moderated: boolean;
  original_marks?: number;
  moderation_reason?: string;
}

export interface SchoolResultStats {
  totalExams: number;
  passed: number;
  failed: number;
  absent: number;
  averagePercentage: number;
}

interface SchoolResultsTabProps {
  results: SchoolStudentResult[];
  resultStats: SchoolResultStats;
  loading?: boolean;
}

const ResultsTab: React.FC<SchoolResultsTabProps> = ({ 
  results, 
  resultStats, 
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
        </div>
        
        {/* Performance Summary Skeleton */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Results Skeleton */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm animate-pulse">
          <div className="border-b border-gray-200 p-6">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Academic Results</h2>
        <p className="text-gray-600">Comprehensive examination results and performance analysis</p>
      </div>

      {/* Performance Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
          Performance Summary
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{resultStats.totalExams}</p>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Total Exams</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
            <p className="text-xl sm:text-2xl font-bold text-green-600">{resultStats.passed}</p>
            <p className="text-xs sm:text-sm text-green-700 mt-1">Passed</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg border border-red-100">
            <p className="text-xl sm:text-2xl font-bold text-red-600">{resultStats.failed}</p>
            <p className="text-xs sm:text-sm text-red-700 mt-1">Failed</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-100">
            <p className="text-xl sm:text-2xl font-bold text-yellow-600">{resultStats.absent}</p>
            <p className="text-xs sm:text-sm text-yellow-700 mt-1">Absent</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100 col-span-2 sm:col-span-1">
            <p className="text-xl sm:text-2xl font-bold text-blue-600">{resultStats.averagePercentage}%</p>
            <p className="text-xs sm:text-sm text-blue-700 mt-1">Average</p>
          </div>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Published</h3>
          <p className="text-gray-500">Your examination results will appear here once they are published.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Group results by assessment */}
          {(() => {
            // Group results by assessment_id
            const groupedResults = results.reduce((acc, result) => {
              const key = result.assessment_id;
              if (!acc[key]) {
                acc[key] = {
                  assessment_id: result.assessment_id,
                  assessment_code: result.assessment_code,
                  type: result.type,
                  exam_date: result.exam_date,
                  subjects: []
                };
              }
              acc[key].subjects.push(result);
              return acc;
            }, {} as Record<string, any>);

            return Object.values(groupedResults).map((assessment: any) => (
              <div key={assessment.assessment_id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                {/* Assessment Header */}
                <div className="border-b border-gray-200 p-6 bg-gradient-to-r from-blue-50 to-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                        {assessment.assessment_code}
                      </h3>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {assessment.type.replace('_', ' ').toUpperCase()}
                        </span>
                        {assessment.exam_date && (
                          <span className="text-sm text-gray-600 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(assessment.exam_date).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right bg-white rounded-lg p-3 border border-gray-100">
                      <p className="text-sm text-gray-600">Subjects</p>
                      <p className="text-2xl font-bold text-blue-600">{assessment.subjects.length}</p>
                    </div>
                  </div>
                </div>

                {/* Results Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Subject</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Marks Obtained</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Total Marks</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Percentage</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Grade</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {assessment.subjects.map((result: SchoolStudentResult) => {
                        const isPassed = !result.is_absent && !result.is_exempt && result.is_pass === true;
                        const isFailed = !result.is_absent && !result.is_exempt && result.is_pass === false;
                        
                        return (
                          <tr key={result.id} className="hover:bg-blue-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
                              <div className="flex items-center">
                                <div>
                                  <div className="text-sm font-semibold text-gray-900">{result.subject_name}</div>
                                  {result.is_moderated && (
                                    <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                      <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                                      Moderated from {result.original_marks}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center border-r border-gray-100">
                              {result.is_absent ? (
                                <span className="text-sm text-yellow-600 font-semibold">Absent</span>
                              ) : result.is_exempt ? (
                                <span className="text-sm text-blue-600 font-semibold">Exempt</span>
                              ) : (
                                <div className="text-sm font-semibold text-gray-900">
                                  {result.marks_obtained}
                                  {result.is_moderated && (
                                    <span 
                                      className="text-blue-600 ml-1" 
                                      title={`Moderated from ${result.original_marks} to ${result.marks_obtained}. Reason: ${result.moderation_reason}`}
                                    >
                                      *
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-700 border-r border-gray-100">
                              {result.total_marks}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center border-r border-gray-100">
                              {result.is_absent || result.is_exempt ? (
                                <span className="text-sm text-gray-400">-</span>
                              ) : (
                                <span className={`text-sm font-semibold ${
                                  isPassed ? 'text-green-600' : isFailed ? 'text-red-600' : 'text-gray-900'
                                }`}>
                                  {result.percentage?.toFixed(1)}%
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center border-r border-gray-100">
                              {result.is_absent || result.is_exempt ? (
                                <span className="text-sm text-gray-400">-</span>
                              ) : (
                                <span className={`text-sm font-semibold ${
                                  isPassed ? 'text-green-600' : isFailed ? 'text-red-600' : 'text-gray-900'
                                }`}>
                                  {result.grade || 'N/A'}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {result.is_absent ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                                  Absent
                                </span>
                              ) : result.is_exempt ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                                  Exempt
                                </span>
                              ) : isPassed ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Pass
                                </span>
                              ) : isFailed ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Fail
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Assessment Summary */}
                <div className="border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-8">
                      <div className="text-sm flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                        <span className="text-gray-600">Total Subjects: </span>
                        <span className="font-semibold text-gray-900">{assessment.subjects.length}</span>
                      </div>
                      <div className="text-sm flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-600">Passed: </span>
                        <span className="font-semibold text-green-600">
                          {assessment.subjects.filter((s: SchoolStudentResult) => !s.is_absent && !s.is_exempt && s.is_pass === true).length}
                        </span>
                      </div>
                      <div className="text-sm flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-gray-600">Failed: </span>
                        <span className="font-semibold text-red-600">
                          {assessment.subjects.filter((s: SchoolStudentResult) => !s.is_absent && !s.is_exempt && s.is_pass === false).length}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
                      <span className="text-gray-600">Overall Average: </span>
                      <span className="font-bold text-blue-600">
                        {(() => {
                          const validResults = assessment.subjects.filter((s: SchoolStudentResult) => !s.is_absent && !s.is_exempt && s.percentage !== undefined);
                          const average = validResults.length > 0
                            ? validResults.reduce((sum: number, s: SchoolStudentResult) => sum + (s.percentage || 0), 0) / validResults.length
                            : 0;
                          return average.toFixed(1);
                        })()}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Moderation Notes */}
                {assessment.subjects.some((s: SchoolStudentResult) => s.is_moderated) && (
                  <div className="border-t border-gray-200 bg-blue-50 px-6 py-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Moderation Applied</p>
                        <p className="text-xs text-blue-700 mt-1">
                          * Indicates marks that have been moderated. Hover over the asterisk for details.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ));
          })()}
        </div>
      )}
    </div>
  );
};

export default ResultsTab;