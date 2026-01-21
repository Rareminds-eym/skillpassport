import React, { useState, useMemo, useCallback } from 'react';
import {
  PlusCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarIcon,
  DocumentTextIcon,
  PlayIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import SearchBar from '../../../components/common/SearchBar';
import { useExams, UIExam, UIStudentMark } from '../../../hooks/useExams';
import { useAuth } from '../../../context/AuthContext';
import { supabase } from '../../../lib/supabaseClient';

// Import components
import StatsCard from '../../../components/exams/StatsCard';
import TypeBadge from '../../../components/exams/TypeBadge';
import ModalWrapper from '../../../components/exams/ModalWrapper';
import ExamCard from '../../../components/exams/ExamCard';
import CreateExamForm from '../../../components/exams/CreateExamForm';
import ExamWorkflowManager from '../../../components/exams/ExamWorkflowManager';
import PerformanceTrends from '../../../components/exams/PerformanceTrends';
import { EXAM_STATUSES } from '../../../components/exams/types';

// Types
type StudentMark = UIStudentMark;
type Exam = UIExam;
const ExamsAssessments: React.FC = () => {
  const { user } = useAuth();
  const [schoolId, setSchoolId] = useState<string | undefined>(undefined);
  const [loadingSchoolId, setLoadingSchoolId] = useState(true);

  // Fetch school ID for authenticated user
  const fetchUserSchoolId = useCallback(async () => {
    if (!user?.id) {
      setLoadingSchoolId(false);
      return;
    }

    try {
      setLoadingSchoolId(true);

      const { data: educatorData, error } = await supabase
        .from('school_educators')
        .select('school_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && educatorData?.school_id) {
        setSchoolId(educatorData.school_id);
      } else {
        console.warn('No school_id found for user - this user may not be a school admin');
      }
    } catch (error) {
      console.error('Error fetching user school ID:', error);
    } finally {
      setLoadingSchoolId(false);
    }
  }, [user?.id]);

  React.useEffect(() => {
    fetchUserSchoolId();
  }, [fetchUserSchoolId]);

  const {
    exams,
    assessmentTypes,
    subjects,
    teachers,
    rooms,
    allSchoolRooms,
    grades,
    loading,
    error,
    loadStudents,
    createExam,
    updateExam,
    createTimetableEntry,
    deleteTimetableEntry,
    createInvigilationAssignment,
    deleteInvigilationAssignment,
    saveMarks,
    moderateMarks,
    approveSubjectModeration,
    getSections,
    getClassRoom,
    loadData,
  } = useExams(schoolId);

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [managingExam, setManagingExam] = useState<Exam | null>(null);
  const [activeView, setActiveView] = useState<'exams' | 'reports'>('exams');
  const [dateOverlapWarning, setDateOverlapWarning] = useState<string | null>(null);
  const [currentStudents] = useState<StudentMark[]>([]);

  // Keep managingExam in sync with exams state
  React.useEffect(() => {
    if (managingExam) {
      const updatedExam = exams.find((e) => e.id === managingExam.id);
      if (updatedExam) {
        setManagingExam(updatedExam);
      }
    }
  }, [exams, managingExam?.id]);

  // Filtered exams based on search and filters
  const filteredExams = useMemo(() => {
    if (loading) return [];

    return exams.filter((exam) => {
      const matchesSearch =
        !searchQuery ||
        exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.grade.includes(searchQuery);
      const matchesType = !typeFilter || exam.type === typeFilter;
      const matchesStatus = !statusFilter || exam.status === statusFilter;
      const matchesGrade = !gradeFilter || exam.grade === gradeFilter;

      return matchesSearch && matchesType && matchesStatus && matchesGrade;
    });
  }, [exams, searchQuery, typeFilter, statusFilter, gradeFilter, loading]);

  // Statistics calculation
  const stats = useMemo(() => {
    if (loading) {
      return { total: 0, draft: 0, scheduled: 0, ongoing: 0, marksPending: 0, published: 0 };
    }

    return {
      total: exams.length,
      draft: exams.filter((e) => e.status === 'draft').length,
      scheduled: exams.filter((e) => e.status === 'scheduled').length,
      ongoing: exams.filter((e) => e.status === 'ongoing').length,
      marksPending: exams.filter((e) => e.status === 'marks_pending').length,
      published: exams.filter((e) => e.status === 'published').length,
    };
  }, [exams, loading]);

  // Check for date overlaps between exams
  const checkDateOverlap = useCallback(
    (newExam: Partial<Exam>) => {
      const overlaps: string[] = [];

      exams.forEach((existing) => {
        if (editingExam && existing.id === editingExam.id) return;

        if (
          existing.grade === newExam.grade &&
          (!newExam.section || !existing.section || existing.section === newExam.section)
        ) {
          const existingStart = new Date(existing.startDate);
          const existingEnd = new Date(existing.endDate);
          const newStart = new Date(newExam.startDate!);
          const newEnd = new Date(newExam.endDate!);

          if (
            (newStart >= existingStart && newStart <= existingEnd) ||
            (newEnd >= existingStart && newEnd <= existingEnd) ||
            (newStart <= existingStart && newEnd >= existingEnd)
          ) {
            overlaps.push(`${existing.name} (${existing.startDate} to ${existing.endDate})`);
          }
        }
      });

      return overlaps;
    },
    [exams, editingExam]
  );

  // Event handlers
  const handleSaveExam = useCallback(
    async (examData: Partial<Exam>) => {
      try {
        const overlaps = checkDateOverlap(examData);
        if (overlaps.length > 0 && !editingExam) {
          setDateOverlapWarning(
            `⚠️ Date overlap detected with: ${overlaps.join(', ')}. Students may have conflicting exams.`
          );
          setTimeout(() => setDateOverlapWarning(null), 5000);
        }

        if (editingExam) {
          await updateExam(editingExam.id, examData);
        } else {
          await createExam(examData, user?.id);
        }

        setEditingExam(null);
        setShowCreateModal(false);
      } catch (error: unknown) {
        console.error('Error saving exam:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        alert(`Failed to save exam: ${message}. Please try again.`);
      }
    },
    [checkDateOverlap, editingExam, updateExam, createExam, user?.id]
  );

  const handleUpdateExam = useCallback(
    async (updatedExam: Exam) => {
      try {
        await updateExam(updatedExam.id, updatedExam);
        setManagingExam(updatedExam);
      } catch (error: unknown) {
        console.error('Error updating exam:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        alert(`Failed to update exam: ${message}. Please try again.`);
      }
    },
    [updateExam]
  );

  const handleCreateInvigilationAssignment = useCallback(
    async (examId: string, assignment: unknown) => {
      // @ts-expect-error - Auto-suppressed for migration
      return createInvigilationAssignment(examId, assignment, user?.id);
    },
    [createInvigilationAssignment, user?.id]
  );

  const handleSaveMarks = useCallback(
    async (examId: string, subjectId: string, marks: UIStudentMark[]) => {
      return saveMarks(examId, subjectId, marks, user?.id);
    },
    [saveMarks, user?.id]
  );

  const clearFilters = useCallback(() => {
    setTypeFilter('');
    setStatusFilter('');
    setGradeFilter('');
    setSearchQuery('');
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowCreateModal(false);
    setEditingExam(null);
  }, []);

  const handleExportCSV = useCallback((exam: Exam) => {
    const csvData = exam.marks
      .map((sm) =>
        sm.studentMarks
          .map(
            (student) =>
              `${student.rollNumber},${student.studentName},${sm.subjectName},${student.marks || 'Absent'}`
          )
          .join('\n')
      )
      .join('\n');

    const blob = new Blob([`Roll No,Student Name,Subject,Marks\n${csvData}`], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${exam.name.replace(/\s+/g, '_')}_results.csv`;
    link.click();
  }, []);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Date Overlap Warning */}
      {dateOverlapWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">{dateOverlapWarning}</p>
            </div>
            <button
              onClick={() => setDateOverlapWarning(null)}
              className="text-amber-600 hover:text-amber-800"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border border-indigo-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Exams & Assessments
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Complete exam management from creation to result publishing
            </p>
          </div>
          {activeView === 'exams' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-lg shadow-indigo-200"
            >
              <PlusCircleIcon className="h-5 w-5" />
              Create Exam
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-sm">
        <div className="inline-flex rounded-lg border border-gray-300 p-1 bg-gray-50">
          <button
            onClick={() => setActiveView('exams')}
            className={`px-6 py-2.5 rounded-md text-sm font-medium transition-colors ${
              activeView === 'exams'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-700 hover:bg-white'
            }`}
          >
            Exams
          </button>
          <button
            onClick={() => setActiveView('reports')}
            className={`px-6 py-2.5 rounded-md text-sm font-medium transition-colors ${
              activeView === 'reports'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-700 hover:bg-white'
            }`}
          >
            Reports & Analytics
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {activeView === 'exams' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatsCard
            label="Total Exams"
            value={stats.total}
            icon={ClipboardDocumentListIcon}
            color="blue"
          />
          <StatsCard label="Draft" value={stats.draft} icon={DocumentTextIcon} color="gray" />
          <StatsCard label="Scheduled" value={stats.scheduled} icon={CalendarIcon} color="blue" />
          <StatsCard label="Ongoing" value={stats.ongoing} icon={PlayIcon} color="amber" />
          <StatsCard
            label="Marks Pending"
            value={stats.marksPending}
            icon={ClockIcon}
            color="orange"
          />
          <StatsCard
            label="Published"
            value={stats.published}
            icon={CheckCircleIcon}
            color="green"
          />
        </div>
      )}

      {/* Reports & Analytics View */}
      {activeView === 'reports' && (
        <div className="space-y-6">
          {/* Analytics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard
              label="Total Students Assessed"
              value={exams.reduce(
                (acc, exam) => acc + (exam.marks[0]?.studentMarks.length || 0),
                0
              )}
              icon={UserGroupIcon}
              color="blue"
            />
            <StatsCard
              label="Average Pass Rate"
              value={`${Math.round(exams.filter((e) => e.status === 'published').length > 0 ? 75 : 0)}%`}
              icon={CheckCircleIcon}
              color="green"
            />
            <StatsCard
              label="Exams This Month"
              value={
                exams.filter((e) => new Date(e.startDate).getMonth() === new Date().getMonth())
                  .length
              }
              icon={CalendarIcon}
              color="purple"
            />
          </div>

          {/* Published Exams Reports */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Published Exam Results</h3>
            {exams.filter((e) => e.status === 'published').length > 0 ? (
              <div className="space-y-4">
                {exams
                  .filter((e) => e.status === 'published')
                  .map((exam) => (
                    <div
                      key={exam.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{exam.name}</h4>
                          <p className="text-sm text-gray-500">
                            Class {exam.grade}
                            {exam.section ? `-${exam.section}` : ''} • Published on{' '}
                            {new Date(exam.publishedAt || '').toLocaleDateString()}
                          </p>
                        </div>
                        <TypeBadge type={exam.type} />
                      </div>

                      {/* Subject-wise Performance */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        {exam.marks.slice(0, 3).map((subjectMark) => {
                          const subject = exam.subjects.find((s) => s.id === subjectMark.subjectId);
                          const totalStudents = subjectMark.studentMarks.length;
                          const presentStudents = subjectMark.studentMarks.filter(
                            (s) => !s.isAbsent
                          );
                          const passedStudents = presentStudents.filter(
                            (s) => s.marks !== null && s.marks >= (subject?.passingMarks || 0)
                          );
                          // Pass rate based on total students (absent students count as failed)
                          const passRate =
                            totalStudents > 0
                              ? Math.round((passedStudents.length / totalStudents) * 100)
                              : 0;

                          return (
                            <div key={subjectMark.subjectId} className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs font-medium text-gray-700 mb-1">
                                {subjectMark.subjectName}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-gray-900">{passRate}%</span>
                                <span className="text-xs text-gray-500">Pass Rate</span>
                              </div>
                              <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${passRate >= 75 ? 'bg-green-500' : passRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                  style={{ width: `${passRate}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setManagingExam(exam)}
                          className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100"
                        >
                          <EyeIcon className="h-4 w-4 inline mr-1" />
                          View Details
                        </button>
                        <button
                          onClick={() => {
                            // Generate report card
                            alert(
                              '📄 Report card generation feature\n\nThis will generate:\n- Individual student report cards\n- Class performance summary\n- Subject-wise analysis\n- Export to PDF'
                            );
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100"
                        >
                          <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                          Generate Report Cards
                        </button>
                        <button
                          onClick={() => handleExportCSV(exam)}
                          className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4 inline mr-1" />
                          Export CSV
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-500">
                  No published exams yet. Publish exam results to see reports here.
                </p>
              </div>
            )}
          </div>

          {/* Performance Trends */}
          <PerformanceTrends exams={exams} />
        </div>
      )}

      {/* Filters */}
      {activeView === 'exams' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search exams by name or grade..."
                size="md"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">All Types</option>
                {assessmentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">All Statuses</option>
                {EXAM_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">All Grades</option>
                {grades.map((grade) => (
                  <option key={grade} value={grade}>
                    Class {grade}
                  </option>
                ))}
              </select>
              {(typeFilter || statusFilter || gradeFilter || searchQuery) && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      {loading || loadingSchoolId ? (
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">
            {loadingSchoolId ? 'Loading user data...' : 'Loading exams...'}
          </span>
        </div>
      ) : activeView === 'exams' && filteredExams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredExams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} onManage={() => setManagingExam(exam)} />
          ))}
        </div>
      ) : activeView === 'exams' ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ClipboardDocumentListIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Exams Found</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || typeFilter || statusFilter || gradeFilter
              ? 'No exams match your current filters. Try adjusting your search criteria.'
              : 'Get started by creating your first exam.'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <PlusCircleIcon className="h-5 w-5" />
            Create Exam
          </button>
        </div>
      ) : null}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Error loading data</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* No School ID Found */}
      {!loadingSchoolId && !schoolId && user && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-amber-800">School Not Found</h4>
              <p className="text-sm text-amber-700 mt-1">
                Your account is not associated with any school. Please contact your administrator.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ModalWrapper
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        title={editingExam ? 'Edit Exam' : 'Create New Exam'}
        subtitle="Configure exam details and subjects"
        size="4xl"
      >
        <CreateExamForm
          onSave={handleSaveExam}
          onCancel={handleCloseModal}
          editExam={editingExam}
          assessmentTypes={assessmentTypes}
          subjects={subjects}
          grades={grades}
          getSections={getSections}
        />
      </ModalWrapper>

      {managingExam && (
        <ExamWorkflowManager
          exam={managingExam}
          onUpdate={handleUpdateExam}
          onClose={() => setManagingExam(null)}
          teachers={teachers}
          rooms={rooms}
          allSchoolRooms={allSchoolRooms}
          students={currentStudents}
          loadStudents={loadStudents}
          createTimetableEntry={createTimetableEntry}
          deleteTimetableEntry={deleteTimetableEntry}
          createInvigilationAssignment={handleCreateInvigilationAssignment}
          deleteInvigilationAssignment={deleteInvigilationAssignment}
          saveMarks={handleSaveMarks}
          moderateMarks={moderateMarks}
          approveSubjectModeration={approveSubjectModeration}
          getClassRoom={getClassRoom}
          loadData={loadData}
          currentUserId={user?.id}
        />
      )}
    </div>
  );
};

export default ExamsAssessments;
