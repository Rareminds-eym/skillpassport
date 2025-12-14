import React from "react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import { UIExam } from "../../hooks/useExams";

interface PerformanceTrendsProps {
  exams: UIExam[];
}

const PerformanceTrends: React.FC<PerformanceTrendsProps> = ({ exams }) => {
  const publishedExams = exams.filter(e => e.status === 'published');

  if (publishedExams.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-500 mb-2">No published exam data available</p>
          <p className="text-xs text-gray-400">
            Performance trends will be displayed here once exams are published and results are available.
          </p>
        </div>
      </div>
    );
  }

  // Calculate overall performance trends across ALL published exams
  const calculatePerformanceData = () => {
    const subjectPerformance: Record<string, { total: number; passed: number; marks: number[] }> = {};
    const gradeDistribution = { 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };
    let totalStudentExamInstances = 0;
    let totalPassedInstances = 0;

    // Track all unique students across all exams for grade distribution
    const allStudentExamResults: Array<{studentId: string, examId: string, overallPassed: boolean, percentage: number}> = [];

    // Aggregate data across ALL published exams for overall trends
    publishedExams.forEach(exam => {
      // Calculate grade distribution for each exam (strict absence policy)
      const allStudents = exam.marks.flatMap(m => m.studentMarks);
      const uniqueStudents = Array.from(new Set(allStudents.map(s => s.studentId)));

      uniqueStudents.forEach(studentId => {
        const studentSubjectMarks = exam.marks.map(subjectMark => {
          const mark = subjectMark.studentMarks.find(sm => sm.studentId === studentId);
          const subject = exam.subjects.find(s => s.id === subjectMark.subjectId);
          return {
            subjectName: subjectMark.subjectName,
            marks: mark?.marks || null,
            isAbsent: mark?.isAbsent || false,
            passed: mark && !mark.isAbsent && mark.marks !== null && mark.marks >= (subject?.passingMarks || 0),
            totalMarks: subject?.totalMarks || 100
          };
        });

        const appearedSubjects = studentSubjectMarks.filter(sm => !sm.isAbsent);
        const passedSubjects = studentSubjectMarks.filter(sm => sm.passed);
        
        // Student passes overall ONLY if appeared for ALL subjects AND passed all
        const overallPassed = appearedSubjects.length === exam.subjects.length && passedSubjects.length === exam.subjects.length;
        
        let percentage = 0;
        if (appearedSubjects.length === exam.subjects.length) {
          // Student appeared for all subjects - calculate percentage
          const totalMarks = appearedSubjects.reduce((sum, sm) => sum + (sm.marks || 0), 0);
          const maxMarks = appearedSubjects.reduce((sum, sm) => sum + sm.totalMarks, 0);
          percentage = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;
        }

        allStudentExamResults.push({
          studentId,
          examId: exam.id,
          overallPassed,
          percentage
        });

        // Update subject-wise performance for each subject this student encountered
        studentSubjectMarks.forEach(sm => {
          if (!subjectPerformance[sm.subjectName]) {
            subjectPerformance[sm.subjectName] = { total: 0, passed: 0, marks: [] };
          }
          subjectPerformance[sm.subjectName].total++;
          totalStudentExamInstances++;

          if (!sm.isAbsent && sm.marks !== null) {
            subjectPerformance[sm.subjectName].marks.push(sm.marks);
            if (sm.passed) {
              subjectPerformance[sm.subjectName].passed++;
              totalPassedInstances++;
            }
          }
          // Absent students are counted in total but not in passed (they fail)
        });
      });
    });

    // Calculate grade distribution from all student-exam results
    allStudentExamResults.forEach(result => {
      if (result.overallPassed && result.percentage > 0) {
        const grade = result.percentage >= 90 ? 'A+' : 
                     result.percentage >= 80 ? 'A' : 
                     result.percentage >= 70 ? 'B+' : 
                     result.percentage >= 60 ? 'B' : 
                     result.percentage >= 50 ? 'C' : 'D';
        gradeDistribution[grade as keyof typeof gradeDistribution]++;
      } else {
        gradeDistribution['F']++;
      }
    });

    // Calculate overall pass rate across all subject instances
    const overallPassRate = totalStudentExamInstances > 0 ? (totalPassedInstances / totalStudentExamInstances) * 100 : 0;
    
    // Find best and worst performing subjects
    const subjectAverages = Object.entries(subjectPerformance).map(([name, data]) => ({
      name,
      average: data.marks.length > 0 ? data.marks.reduce((a, b) => a + b, 0) / data.marks.length : 0,
      passRate: data.total > 0 ? (data.passed / data.total) * 100 : 0,
      total: data.total,
      passed: data.passed,
      range: data.marks.length > 0 ? `${Math.min(...data.marks)}-${Math.max(...data.marks)}` : '0-0'
    }));

    const topPerformer = subjectAverages.reduce((prev, current) => 
      (prev.average > current.average) ? prev : current, subjectAverages[0] || { name: 'N/A', average: 0, passRate: 0 }
    );

    const needsAttention = subjectAverages.reduce((prev, current) => 
      (prev.passRate < current.passRate) ? prev : current, subjectAverages[0] || { name: 'N/A', passRate: 100 }
    );

    return {
      subjectAverages,
      gradeDistribution,
      overallAverage: overallPassRate,
      topPerformer,
      needsAttention,
      totalStudents: Object.values(gradeDistribution).reduce((sum, count) => sum + count, 0)
    };
  };

  const performanceData = calculatePerformanceData();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
      <div className="space-y-6">
        {/* Subject-wise Performance Comparison */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Average Marks by Subject */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
            <h4 className="text-sm font-semibold text-blue-900 mb-3">Subject Performance Overview</h4>
            <div className="space-y-3">
              {performanceData.subjectAverages.slice(0, 3).map((subject, index) => (
                <div key={subject.name} className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{subject.name}</span>
                    <span className="text-lg font-bold text-blue-600">{subject.passRate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        subject.passRate >= 75 ? "bg-green-500" : 
                        subject.passRate >= 60 ? "bg-blue-500" : 
                        subject.passRate >= 45 ? "bg-yellow-500" : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(subject.passRate, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Pass Rate: {subject.passRate.toFixed(0)}% ({subject.passed}/{subject.total})</span>
                    <span>Avg: {subject.average.toFixed(1)} | Range: {subject.range}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grade Distribution */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
            <h4 className="text-sm font-semibold text-green-900 mb-3">Grade Distribution</h4>
            <div className="space-y-2">
              {Object.entries(performanceData.gradeDistribution).map(([grade, count]) => {
                const percentage = performanceData.totalStudents > 0 ? (count / performanceData.totalStudents) * 100 : 0;
                const colors = {
                  'A+': 'bg-green-600',
                  'A': 'bg-blue-500',
                  'B+': 'bg-indigo-500',
                  'B': 'bg-purple-500',
                  'C': 'bg-yellow-500',
                  'D': 'bg-orange-500',
                  'F': 'bg-red-600'
                };
                
                return (
                  <div key={grade} className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">
                      {grade} ({grade === 'A+' ? '90-100' : 
                           grade === 'A' ? '80-89' :
                           grade === 'B+' ? '70-79' :
                           grade === 'B' ? '60-69' :
                           grade === 'C' ? '50-59' :
                           grade === 'D' ? '35-49' : '0-34'})
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`${colors[grade as keyof typeof colors]} h-1.5 rounded-full`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className={`text-xs font-bold ${colors[grade as keyof typeof colors].replace('bg-', 'text-')}`}>
                        {count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-4 border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-900">Top Performer</p>
                <p className="text-lg font-bold text-emerald-700">{performanceData.topPerformer.name}</p>
                <p className="text-xs text-emerald-600">{performanceData.topPerformer.average.toFixed(1)}% average</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-900">Needs Attention</p>
                <p className="text-lg font-bold text-amber-700">{performanceData.needsAttention.name}</p>
                <p className="text-xs text-amber-600">{(100 - performanceData.needsAttention.passRate).toFixed(0)}% failure rate</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClipboardDocumentListIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Overall Performance</p>
                <p className="text-lg font-bold text-blue-700">{performanceData.overallAverage.toFixed(1)}%</p>
                <p className="text-xs text-blue-600">Class average</p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Analytics */}
        <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Performance Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-xs font-medium text-gray-700 mb-2">Strengths</h5>
              <ul className="space-y-1 text-xs text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  {performanceData.topPerformer.name} shows excellent performance ({performanceData.topPerformer.passRate.toFixed(0)}% pass rate)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  Strong performance in higher grade bands (A+, A, B+)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  Overall class average {performanceData.overallAverage >= 60 ? 'above' : 'approaching'} 60%
                </li>
              </ul>
            </div>
            <div>
              <h5 className="text-xs font-medium text-gray-700 mb-2">Areas for Improvement</h5>
              <ul className="space-y-1 text-xs text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                  {performanceData.needsAttention.name} needs focused attention ({(100 - performanceData.needsAttention.passRate).toFixed(0)}% failure rate)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                  Consider additional support for struggling students
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                  Review teaching methods for {performanceData.needsAttention.name} concepts
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
          <h4 className="text-sm font-semibold text-indigo-900 mb-3">Recommended Actions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button className="flex items-center gap-3 p-3 bg-white rounded-lg border border-indigo-200 hover:border-indigo-300 transition-colors text-left">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <UserGroupIcon className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-indigo-900">Schedule Remedial Classes</p>
                <p className="text-xs text-indigo-600">For {performanceData.needsAttention.name} underperformers</p>
              </div>
            </button>
            <button className="flex items-center gap-3 p-3 bg-white rounded-lg border border-indigo-200 hover:border-indigo-300 transition-colors text-left">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <DocumentTextIcon className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-indigo-900">Generate Detailed Report</p>
                <p className="text-xs text-indigo-600">For parent-teacher meetings</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceTrends;