import React, { useState, useEffect } from 'react';
import { GraduationCap, Calendar, TrendingUp, BookOpen, Target, Award, BarChart3 } from 'lucide-react';
import { supabase } from '../../../../lib/supabaseClient';

interface ExamResult {
  id: string;
  student_id: string;
  exam_id: string;
  subject: string;
  exam_name: string;
  exam_type: 'midterm' | 'final' | 'unit_test' | 'assignment' | 'project' | 'quiz';
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  grade: string;
  exam_date: string;
  academic_year: string;
  semester?: string;
  class_name?: string;
  remarks?: string;
  created_at: string;
}

interface SubjectSummary {
  subject: string;
  total_exams: number;
  average_percentage: number;
  best_score: number;
  latest_grade: string;
  trend: 'up' | 'down' | 'stable';
}

interface ExamResultsTabProps {
  student: any;
  loading: boolean;
}

const ExamResultsTab: React.FC<ExamResultsTabProps> = ({ student, loading }) => {
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [subjectSummaries, setSubjectSummaries] = useState<SubjectSummary[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedExamType, setSelectedExamType] = useState<string>('all');
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (student?.id || student?.email) {
      fetchExamResults();
    }
  }, [student?.id, student?.email]);

  // Calculate grade based on percentage
  const calculateGrade = (percentage: number): string => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    if (percentage >= 35) return 'D';
    return 'F';
  };

  const fetchExamResults = async () => {
    try {
      setDataLoading(true);
      
      let studentId = student.id;
      
      // If we don't have student.id but have email, try to find the student ID
      if (!studentId && student.email) {
        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('email', student.email)
          .single();
          
        if (studentData?.id) {
          studentId = studentData.id;
        }
      }
      
      if (!studentId) {
        console.log('No student ID available for exam results lookup');
        return;
      }

      // Get mark entries with assessment data
      const { data: markEntries, error: markError } = await supabase
        .from('mark_entries')
        .select(`
          id,
          marks_obtained,
          total_marks,
          percentage,
          grade,
          is_absent,
          remarks,
          created_at,
          assessment_id,
          subject_id,
          assessments!inner(
            id,
            assessment_code,
            type,
            academic_year,
            start_date,
            end_date,
            target_classes
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (markError) {
        console.error('Error fetching mark entries:', markError);
        return;
      }

      // Get all timetable data for these assessments
      const assessmentIds = [...new Set((markEntries || []).map(entry => entry.assessment_id))];
      let timetableData: any[] = [];
      
      if (assessmentIds.length > 0) {
        const { data: timetable, error: timetableError } = await supabase
          .from('exam_timetable')
          .select('assessment_id, course_name, exam_date')
          .in('assessment_id', assessmentIds)
          .order('exam_date', { ascending: true });

        if (!timetableError && timetable) {
          timetableData = timetable;
        }
      }

      // Create a map of assessment_id -> unique subjects
      const assessmentSubjectsMap = new Map();
      timetableData.forEach(tt => {
        if (!assessmentSubjectsMap.has(tt.assessment_id)) {
          assessmentSubjectsMap.set(tt.assessment_id, []);
        }
        const existingSubjects = assessmentSubjectsMap.get(tt.assessment_id);
        if (!existingSubjects.find((s: any) => s.course_name === tt.course_name)) {
          assessmentSubjectsMap.get(tt.assessment_id).push(tt);
        }
      });

      // Process mark entries to create exam results
      const results: ExamResult[] = [];
      
      (markEntries || []).forEach((entry: any, index: number) => {
        const assessment = entry.assessments;
        const subjects = assessmentSubjectsMap.get(entry.assessment_id) || [];
        
        const marksObtained = entry.is_absent ? 0 : (entry.marks_obtained ? Number(entry.marks_obtained) : 0);
        const totalMarks = entry.total_marks ? Number(entry.total_marks) : 100;
        const percentage = entry.is_absent ? 0 : 
          (entry.percentage ? Number(entry.percentage) : 
           (marksObtained && totalMarks ? Math.round((marksObtained / totalMarks) * 100) : 0));
        const calculatedGrade = entry.is_absent ? 'Absent' : calculateGrade(percentage);
        
        if (subjects.length === 0) {
          // No timetable data - single entry
          results.push({
            id: entry.id,
            student_id: studentId,
            exam_id: entry.assessment_id,
            subject: 'General',
            exam_name: assessment?.assessment_code || 'Unknown Exam',
            exam_type: assessment?.type || 'exam',
            marks_obtained: marksObtained,
            total_marks: totalMarks,
            percentage: percentage,
            grade: calculatedGrade,
            exam_date: assessment?.start_date || entry.created_at,
            academic_year: assessment?.academic_year || 'Current',
            class_name: assessment?.target_classes?.grade ? `Class ${assessment.target_classes.grade}${assessment.target_classes.sections?.[0] ? `-${assessment.target_classes.sections[0]}` : ''}` : '',
            remarks: entry.is_absent ? 'Student was absent' : (entry.remarks || ''),
            created_at: entry.created_at
          });
        } else if (subjects.length === 1) {
          // Single subject exam
          const subject = subjects[0];
          results.push({
            id: entry.id,
            student_id: studentId,
            exam_id: entry.assessment_id,
            subject: subject.course_name,
            exam_name: `${assessment?.assessment_code} - ${subject.course_name}`,
            exam_type: assessment?.type || 'exam',
            marks_obtained: marksObtained,
            total_marks: totalMarks,
            percentage: percentage,
            grade: calculatedGrade,
            exam_date: subject.exam_date || assessment?.start_date || entry.created_at,
            academic_year: assessment?.academic_year || 'Current',
            class_name: assessment?.target_classes?.grade ? `Class ${assessment.target_classes.grade}${assessment.target_classes.sections?.[0] ? `-${assessment.target_classes.sections[0]}` : ''}` : '',
            remarks: entry.is_absent ? 'Student was absent' : (entry.remarks || ''),
            created_at: entry.created_at
          });
        } else {
          // Multi-subject exam - assign each mark_entry to a specific subject
          // Use modulo to cycle through subjects for each mark entry
          const subjectIndex = index % subjects.length;
          const subject = subjects[subjectIndex];
          
          results.push({
            id: entry.id,
            student_id: studentId,
            exam_id: entry.assessment_id,
            subject: subject.course_name,
            exam_name: `${assessment?.assessment_code} - ${subject.course_name}`,
            exam_type: assessment?.type || 'exam',
            marks_obtained: marksObtained,
            total_marks: totalMarks,
            percentage: percentage,
            grade: calculatedGrade,
            exam_date: subject.exam_date || assessment?.start_date || entry.created_at,
            academic_year: assessment?.academic_year || 'Current',
            class_name: assessment?.target_classes?.grade ? `Class ${assessment.target_classes.grade}${assessment.target_classes.sections?.[0] ? `-${assessment.target_classes.sections[0]}` : ''}` : '',
            remarks: entry.is_absent ? 'Student was absent' : (entry.remarks || ''),
            created_at: entry.created_at
          });
        }
      });

      setExamResults(results);
      
      // Calculate subject summaries
      const subjectSummaryMap = new Map<string, ExamResult[]>();
      results.forEach(result => {
        if (!subjectSummaryMap.has(result.subject)) {
          subjectSummaryMap.set(result.subject, []);
        }
        subjectSummaryMap.get(result.subject)!.push(result);
      });

      const summaries: SubjectSummary[] = Array.from(subjectSummaryMap.entries()).map(([subject, subjectResults]) => {
        const sortedResults = subjectResults.sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime());
        const totalPercentage = subjectResults.reduce((sum, result) => sum + result.percentage, 0);
        const averagePercentage = totalPercentage / subjectResults.length;
        const bestScore = Math.max(...subjectResults.map(r => r.percentage));
        const latestGrade = sortedResults[sortedResults.length - 1]?.grade || 'N/A';
        
        // Calculate trend (comparing last 2 results)
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (sortedResults.length >= 2) {
          const latest = sortedResults[sortedResults.length - 1].percentage;
          const previous = sortedResults[sortedResults.length - 2].percentage;
          if (latest > previous) trend = 'up';
          else if (latest < previous) trend = 'down';
        }

        return {
          subject,
          total_exams: subjectResults.length,
          average_percentage: Math.round(averagePercentage * 100) / 100,
          best_score: bestScore,
          latest_grade: latestGrade,
          trend
        };
      });

      setSubjectSummaries(summaries);
    } catch (error) {
      console.error('Error fetching exam results:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade.toUpperCase()) {
      case 'A+': case 'A': return 'bg-green-50 text-green-700';
      case 'B+': case 'B': return 'bg-blue-50 text-blue-700';
      case 'C+': case 'C': return 'bg-yellow-50 text-yellow-700';
      case 'D': return 'bg-orange-50 text-orange-700';
      case 'F': return 'bg-red-50 text-red-700';
      case 'ABSENT': return 'bg-gray-50 text-gray-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const getExamTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'final': case 'final_exam': return <GraduationCap className="h-4 w-4" />;
      case 'midterm': case 'mid_term': case 'term_exam': return <BookOpen className="h-4 w-4" />;
      case 'unit_test': case 'unit test': return <Target className="h-4 w-4" />;
      case 'assignment': return <BookOpen className="h-4 w-4" />;
      case 'project': return <Award className="h-4 w-4" />;
      case 'quiz': return <Target className="h-4 w-4" />;
      case 'practical': case 'practical_exam': return <Award className="h-4 w-4" />;
      case 'oral': return <BookOpen className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      default: return <BarChart3 className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredResults = examResults.filter(result => {
    const subjectMatch = selectedSubject === 'all' || result.subject === selectedSubject;
    const typeMatch = selectedExamType === 'all' || result.exam_type === selectedExamType;
    return subjectMatch && typeMatch;
  });

  const uniqueSubjects = Array.from(new Set(examResults.map(r => r.subject)));
  const uniqueExamTypes = Array.from(new Set(examResults.map(r => r.exam_type)));

  if (loading || dataLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-100 rounded w-1/3"></div>
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-gray-100 rounded-full w-24"></div>
            ))}
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-50 h-24 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const EmptyState = () => (
    <div className="text-center py-16">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-50 mb-4">
        <GraduationCap className="h-6 w-6 text-gray-400" />
      </div>
      <h3 className="text-sm font-medium text-gray-900 mb-1">No exam results found</h3>
      <p className="text-xs text-gray-500 max-w-sm mx-auto">
        No exam results have been recorded for this student yet.
      </p>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center">
          <GraduationCap className="h-4 w-4 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Exam Results</h3>
          <p className="text-sm text-gray-500">
            Academic performance and examination records
          </p>
        </div>
      </div>

      {examResults.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Subject Summaries */}
          {subjectSummaries.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Subject Overview</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {subjectSummaries.map((summary) => (
                  <div key={summary.subject} className="bg-white border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-gray-900">{summary.subject}</h5>
                      {getTrendIcon(summary.trend)}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Average</span>
                        <span className="font-medium text-gray-900">{summary.average_percentage}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Best Score</span>
                        <span className="font-medium text-gray-900">{summary.best_score}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Latest Grade</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getGradeColor(summary.latest_grade)}`}>
                          {summary.latest_grade}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {summary.total_exams} exam{summary.total_exams !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex gap-1 p-1 bg-gray-50 rounded-lg">
              <button
                onClick={() => setSelectedSubject('all')}
                className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  selectedSubject === 'all'
                    ? 'bg-white text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All Subjects
              </button>
              {uniqueSubjects.map((subject) => (
                <button
                  key={subject}
                  onClick={() => setSelectedSubject(subject)}
                  className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    selectedSubject === subject
                      ? 'bg-white text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>

            <div className="flex gap-1 p-1 bg-gray-50 rounded-lg">
              <button
                onClick={() => setSelectedExamType('all')}
                className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  selectedExamType === 'all'
                    ? 'bg-white text-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All Types
              </button>
              {uniqueExamTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedExamType(type)}
                  className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    selectedExamType === type
                      ? 'bg-white text-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>

          {/* Exam Results List */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">
              Exam Results ({filteredResults.length})
            </h4>
            <div className="space-y-3">
              {filteredResults.map((result) => (
                <div key={result.id} className="bg-white border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                        {getExamTypeIcon(result.exam_type)}
                      </div>
                      <div>
                        <h5 className="font-semibold text-gray-900">{result.exam_name}</h5>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-medium text-gray-700">{result.subject}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {result.exam_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(result.exam_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {result.grade === 'Absent' ? 'Absent' : `${result.percentage}%`}
                      </div>
                      <div className="text-xs text-gray-500">
                        {result.grade === 'Absent' ? 'Was absent' : `${result.marks_obtained}/${result.total_marks} marks`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {result.academic_year && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{result.academic_year}</span>
                        </div>
                      )}
                      {result.class_name && (
                        <span>{result.class_name}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(result.grade)}`}>
                        Grade {result.grade}
                      </span>
                      
                      {/* Progress bar - only show if not absent */}
                      {result.grade !== 'Absent' && (
                        <div className="w-20 bg-gray-100 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              result.percentage >= 90 ? 'bg-green-500' :
                              result.percentage >= 80 ? 'bg-blue-500' :
                              result.percentage >= 70 ? 'bg-yellow-500' :
                              result.percentage >= 60 ? 'bg-orange-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${result.percentage}%` }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {result.remarks && (
                    <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{result.remarks}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExamResultsTab;