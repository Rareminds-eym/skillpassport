import React from 'react';
import { 
  FileText, 
  Clock, 
  Calendar, 
  MapPin, 
  ClipboardList,
  Calculator,
  FlaskConical,
  Atom,
  BookOpenCheck,
  BookOpen,
  CheckCircle2
} from 'lucide-react';

export interface SchoolStudentExam {
  id: string;
  assessment_id: string;
  assessment_code: string;
  type: string;
  subject_name: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_marks: number;
  room?: string;
  instructions?: string;
}

export interface SchoolGroupedExam {
  assessment_id: string;
  assessment_code: string;
  type: string;
  overall_total_marks: number;
  instructions?: string;
  subjects: SchoolStudentExam[];
}

interface SchoolExamsTabProps {
  groupedExams: SchoolGroupedExam[];
  loading?: boolean;
}

// Subject icon mapping for better visual representation
const getSubjectIcon = (subjectName: string) => {
  const subject = subjectName?.toLowerCase() || '';
  
  if (subject.includes('math')) {
    return Calculator;
  }
  if (subject.includes('physics')) {
    return Atom;
  }
  if (subject.includes('chemistry')) {
    return FlaskConical;
  }
  if (subject.includes('biology') || subject.includes('bio')) {
    return BookOpenCheck;
  }
  if (subject.includes('english') || subject.includes('language')) {
    return BookOpen;
  }
  return FileText; // Default icon
};

// Exam type icon mapping
const getExamTypeIcon = (examType: string) => {
  const type = examType?.toLowerCase() || '';
  
  if (type.includes('term') || type.includes('mid')) {
    return ClipboardList;
  }
  if (type.includes('practical')) {
    return ClipboardList;
  }
  if (type.includes('final')) {
    return FileText;
  }
  return FileText; // Default icon
};

const ExamsTab: React.FC<SchoolExamsTabProps> = ({ 
  groupedExams, 
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
        </div>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="h-12 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Exam Schedule</h2>
        <p className="text-gray-600">View your upcoming and past examinations</p>
      </div>

      {groupedExams.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Exams Scheduled</h3>
          <p className="text-gray-500">Your exam schedule will appear here when available.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming Exams */}
          {groupedExams.filter(exam => exam.subjects.some(s => new Date(s.exam_date) >= new Date())).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Upcoming Exams
              </h3>
              <div className="space-y-6">
                {groupedExams
                  .filter(exam => exam.subjects.some(s => new Date(s.exam_date) >= new Date()))
                  .map(groupedExam => (
                    <div
                      key={groupedExam.assessment_id}
                      className="bg-white border-2 border-blue-200 rounded-xl p-6"
                    >
                      {/* Exam Header */}
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              {React.createElement(getExamTypeIcon(groupedExam.type), { 
                                className: "w-6 h-6 text-blue-600" 
                              })}
                              <h4 className="text-xl font-bold text-gray-900">{groupedExam.assessment_code}</h4>
                            </div>
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-1">
                              {React.createElement(getExamTypeIcon(groupedExam.type), { 
                                className: "w-3 h-3" 
                              })}
                              {groupedExam.type.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <p className="text-gray-600">
                            {groupedExam.subjects.length} subject{groupedExam.subjects.length > 1 ? 's' : ''} • 
                            Total {groupedExam.overall_total_marks} marks
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-600">Total Marks</p>
                          <p className="text-3xl font-bold text-blue-600">{groupedExam.overall_total_marks}</p>
                        </div>
                      </div>

                      {/* Instructions */}
                      {groupedExam.instructions && (
                        <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-100">
                          <div className="flex items-center gap-2 mb-2">
                            <ClipboardList className="w-4 h-4 text-blue-600" />
                            <p className="text-sm font-medium text-blue-900">Instructions:</p>
                          </div>
                          <p className="text-sm text-blue-800">{groupedExam.instructions}</p>
                        </div>
                      )}

                      {/* Subject Timetable */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-3">
                          <Calendar className="w-5 h-5 text-gray-700" />
                          <h5 className="text-lg font-semibold text-gray-800">Exam Timetable</h5>
                        </div>
                        {groupedExam.subjects
                          .sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime())
                          .map(subject => {
                            const SubjectIcon = getSubjectIcon(subject.subject_name);
                            return (
                              <div
                                key={subject.id}
                                className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <div className="flex items-center gap-2">
                                        <SubjectIcon className="w-5 h-5 text-blue-600" />
                                        <h6 className="text-lg font-semibold text-gray-900">{subject.subject_name}</h6>
                                      </div>
                                      <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                                        {subject.total_marks} marks
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                      <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <div>
                                          <p className="text-xs text-gray-500">Date</p>
                                          <p className="font-medium text-gray-900">
                                            {new Date(subject.exam_date).toLocaleDateString('en-US', {
                                              weekday: 'short',
                                              month: 'short',
                                              day: 'numeric'
                                            })}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <div>
                                          <p className="text-xs text-gray-500">Time</p>
                                          <p className="font-medium text-gray-900">
                                            {subject.start_time.slice(0, 5)} - {subject.end_time.slice(0, 5)}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <div>
                                          <p className="text-xs text-gray-500">Duration</p>
                                          <p className="font-medium text-gray-900">{subject.duration_minutes} mins</p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        <div>
                                          <p className="text-xs text-gray-500">Room</p>
                                          <p className="font-medium text-gray-900">{subject.room || 'TBA'}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Past Exams */}
          {groupedExams.filter(exam => exam.subjects.every(s => new Date(s.exam_date) < new Date())).length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-gray-600" />
                Past Exams
              </h3>
              <div className="space-y-4">
                {groupedExams
                  .filter(exam => exam.subjects.every(s => new Date(s.exam_date) < new Date()))
                  .map(groupedExam => (
                    <div
                      key={groupedExam.assessment_id}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              {React.createElement(getExamTypeIcon(groupedExam.type), { 
                                className: "w-4 h-4 text-gray-600" 
                              })}
                              <h4 className="font-semibold text-gray-900">{groupedExam.assessment_code}</h4>
                            </div>
                            <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-medium flex items-center gap-1">
                              {React.createElement(getExamTypeIcon(groupedExam.type), { 
                                className: "w-3 h-3" 
                              })}
                              {groupedExam.type.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{groupedExam.subjects.length} subjects</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(groupedExam.subjects[0]?.exam_date).toLocaleDateString()} - {new Date(groupedExam.subjects[groupedExam.subjects.length - 1]?.exam_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Total Marks</p>
                          <p className="text-lg font-bold text-gray-700">{groupedExam.overall_total_marks}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExamsTab;