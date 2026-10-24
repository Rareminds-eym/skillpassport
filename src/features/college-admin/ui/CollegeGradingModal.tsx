import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  GraduationCap,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Download,
  ExternalLink,
  MessageSquare,
  Search,
  Award,
  Loader2,
  Calendar,
  BookOpen
} from 'lucide-react';
import { useAuthStore } from '@/shared/model/authStore';
import { getDocumentUrl } from '@/shared/api';
import { ssoClient } from '@/shared/api/ssoClient';
import toast from 'react-hot-toast';
import {
  fetchCollegeAssignmentSubmissions,
  gradeCollegeAssignment
} from '../api/collegeLearnerAssignmentService';

interface LearnerSubmission {
  learner_assignment_id: string;
  assignment_id: string;
  learner_id: string;
  status: 'todo' | 'in-progress' | 'submitted' | 'graded';
  priority?: string;
  grade_received?: number;
  grade_percentage?: number;
  instructor_feedback?: string;
  feedback_date?: string;
  graded_by?: string;
  graded_date?: string;
  submission_date?: string;
  submission_type?: string;
  submission_content?: string;
  submission_url?: string;
  submission_files?: Array<{
    name?: string;
    original_filename?: string;
    url?: string;
    file_url?: string;
    size?: number;
    file_size?: number;
    type?: string;
  }>;
  is_late?: boolean;
  assigned_date?: string;
  completed_date?: string;
  learner: {
    id: string;
    name: string;
    email: string;
    roll_number?: string;
    branch_field?: string;
    college_school_name?: string;
    semester?: number;
    section?: string;
  };
}

interface Assignment {
  assignment_id: string;
  title: string;
  description?: string;
  course_name?: string;
  course_code?: string;
  total_points: number;
  due_date?: string;
  program_name?: string;
}

interface CollegeGradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  onGradeUpdated?: () => void;
}

export const CollegeGradingModal: React.FC<CollegeGradingModalProps> = ({
  isOpen,
  onClose,
  assignment,
  onGradeUpdated,
}) => {
  const [submissions, setSubmissions] = useState<LearnerSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<LearnerSubmission | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Grading form state
  const [gradeInput, setGradeInput] = useState<string>('');
  const [feedbackInput, setFeedbackInput] = useState<string>('');
  const [submittingGrade, setSubmittingGrade] = useState(false);

  useEffect(() => {
    if (isOpen && assignment?.assignment_id) {
      loadSubmissions();
    } else {
      setSubmissions([]);
      setSelectedSubmission(null);
      setGradeInput('');
      setFeedbackInput('');
    }
  }, [isOpen, assignment?.assignment_id]);

  const loadSubmissions = async () => {
    if (!assignment) return;
    setLoading(true);
    try {
      const result = await fetchCollegeAssignmentSubmissions(assignment.assignment_id);
      if (result.error) {
        toast.error(result.error);
        setSubmissions([]);
      } else {
        const data = (result.data || []) as LearnerSubmission[];
        setSubmissions(data);
        // Automatically select the first submission or first submitted one
        if (data.length > 0) {
          const firstSubmitted = data.find(s => s.status === 'submitted') || data[0];
          selectSubmission(firstSubmitted);
        } else {
          setSelectedSubmission(null);
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const selectSubmission = (sub: LearnerSubmission) => {
    setSelectedSubmission(sub);
    setGradeInput(sub.grade_received !== undefined && sub.grade_received !== null ? String(sub.grade_received) : '');
    setFeedbackInput(sub.instructor_feedback || '');
  };

  const handleGradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission || !assignment) return;

    const numericGrade = parseFloat(gradeInput);
    if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > assignment.total_points) {
      toast.error(`Please enter a valid grade between 0 and ${assignment.total_points}`);
      return;
    }

    setSubmittingGrade(true);
    try {
      const user = useAuthStore.getState().user;
      const result = await gradeCollegeAssignment(selectedSubmission.learner_assignment_id, {
        grade_received: numericGrade,
        total_points: assignment.total_points,
        instructor_feedback: feedbackInput.trim(),
        educator_id: user?.id,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Grade submitted successfully!');

      const updatedGradePct = assignment.total_points > 0 ? Math.round((numericGrade / assignment.total_points) * 100) : 0;

      // Update local state
      const updatedSub: LearnerSubmission = {
        ...selectedSubmission,
        status: 'graded',
        grade_received: numericGrade,
        grade_percentage: updatedGradePct,
        instructor_feedback: feedbackInput.trim(),
        graded_date: new Date().toISOString(),
      };

      setSubmissions(prev =>
        prev.map(s => (s.learner_assignment_id === updatedSub.learner_assignment_id ? updatedSub : s))
      );
      setSelectedSubmission(updatedSub);

      if (onGradeUpdated) {
        onGradeUpdated();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit grade');
    } finally {
      setSubmittingGrade(false);
    }
  };

  const openSubmittedFile = async (fileUrl: string) => {
    try {
      const url = getDocumentUrl(fileUrl, 'inline');
      
      // Fetch with authentication using ssoClient
      const response = await ssoClient.fetch(url);
      
      if (!response.ok) {
        console.error('Failed to access file:', response.status);
        toast.error(`Failed to access file: ${response.status}`);
        return;
      }
      
      // Get the blob
      const blob = await response.blob();
      
      // Create object URL
      const blobUrl = URL.createObjectURL(blob);
      
      // Open in new tab
      window.open(blobUrl, '_blank');
      
      // Clean up blob URL after a delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (e) {
      console.error('Error opening file:', e);
      toast.error('Failed to open file. Please try again.');
    }
  };

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      // Status filter
      if (filterStatus === 'submitted' && sub.status !== 'submitted') return false;
      if (filterStatus === 'graded' && sub.status !== 'graded') return false;
      if (filterStatus === 'pending' && (sub.status === 'submitted' || sub.status === 'graded')) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = sub.learner?.name?.toLowerCase().includes(q);
        const emailMatch = sub.learner?.email?.toLowerCase().includes(q);
        const rollMatch = sub.learner?.roll_number?.toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !rollMatch) return false;
      }

      return true;
    });
  }, [submissions, filterStatus, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: submissions.length,
      submitted: submissions.filter(s => s.status === 'submitted').length,
      graded: submissions.filter(s => s.status === 'graded').length,
      pending: submissions.filter(s => s.status === 'todo' || s.status === 'in-progress').length,
    };
  }, [submissions]);

  if (!isOpen || !assignment) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-center items-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">

        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white truncate">{assignment.title}</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white shrink-0">
                  {assignment.total_points} Points
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-blue-100 mt-0.5">
                {assignment.course_name && (
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {assignment.course_name}
                  </span>
                )}
                {assignment.due_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Due: {new Date(assignment.due_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Two Columns */}
        <div className="flex-1 flex overflow-hidden min-h-0 bg-gray-50">

          {/* Left Column: Learners List & Search */}
          <div className="w-full md:w-[380px] lg:w-[420px] bg-white border-r border-gray-200 flex flex-col shrink-0 min-h-0">

            {/* Search and Filters */}
            <div className="p-4 border-b border-gray-100 space-y-3 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by learner name or roll #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-gray-100 rounded-xl text-xs font-medium text-gray-600">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`py-1.5 rounded-lg transition-all text-center ${filterStatus === 'all' ? 'bg-white text-blue-700 shadow-sm font-semibold' : 'hover:text-gray-900'}`}
                >
                  All ({stats.total})
                </button>
                <button
                  onClick={() => setFilterStatus('submitted')}
                  className={`py-1.5 rounded-lg transition-all text-center ${filterStatus === 'submitted' ? 'bg-white text-amber-700 shadow-sm font-semibold' : 'hover:text-gray-900'}`}
                >
                  Submitted ({stats.submitted})
                </button>
                <button
                  onClick={() => setFilterStatus('graded')}
                  className={`py-1.5 rounded-lg transition-all text-center ${filterStatus === 'graded' ? 'bg-white text-emerald-700 shadow-sm font-semibold' : 'hover:text-gray-900'}`}
                >
                  Graded ({stats.graded})
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`py-1.5 rounded-lg transition-all text-center ${filterStatus === 'pending' ? 'bg-white text-gray-700 shadow-sm font-semibold' : 'hover:text-gray-900'}`}
                >
                  Pending ({stats.pending})
                </button>
              </div>
            </div>

            {/* Learners List */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {loading ? (
                <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                  <p className="text-sm">Loading submissions...</p>
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="p-8 text-center text-gray-400 flex flex-col items-center justify-center h-full">
                  <Users className="w-10 h-10 mb-2 opacity-60" />
                  <p className="text-sm font-medium">No learners found</p>
                  <p className="text-xs text-gray-400 mt-1">Try adjusting your filter or search query</p>
                </div>
              ) : (
                filteredSubmissions.map((sub) => {
                  const isSelected = selectedSubmission?.learner_assignment_id === sub.learner_assignment_id;
                  return (
                    <div
                      key={sub.learner_assignment_id}
                      onClick={() => selectSubmission(sub)}
                      className={`p-3.5 cursor-pointer transition-all border-l-4 ${isSelected
                          ? 'bg-blue-50/70 border-blue-600 shadow-sm'
                          : 'border-transparent hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {sub.learner?.name || 'Unnamed Learner'}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {sub.learner?.email || sub.learner?.roll_number || 'No email'}
                          </p>
                        </div>

                        {/* Status Badge */}
                        <div className="shrink-0">
                          {sub.status === 'graded' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                              Graded: {sub.grade_received}/{assignment.total_points}
                            </span>
                          ) : sub.status === 'submitted' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              Submitted
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              Not Submitted
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                        {sub.submission_date ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {new Date(sub.submission_date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        ) : (
                          <span>Assigned</span>
                        )}

                        {sub.is_late && (
                          <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-medium">
                            Late
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Submission Details & Grading */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col">
            {selectedSubmission ? (
              <div className="space-y-6 max-w-3xl mx-auto w-full">

                {/* Learner Profile Card */}
                <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {selectedSubmission.learner?.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
                        <span>{selectedSubmission.learner?.email}</span>
                        {selectedSubmission.learner?.roll_number && (
                          <span>• Roll: <strong className="text-gray-800">{selectedSubmission.learner.roll_number}</strong></span>
                        )}
                        {selectedSubmission.learner?.branch_field && (
                          <span>• {selectedSubmission.learner.branch_field}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${selectedSubmission.status === 'graded'
                            ? 'bg-emerald-100 text-emerald-800'
                            : selectedSubmission.status === 'submitted'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                      >
                        {selectedSubmission.status === 'graded' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {selectedSubmission.status === 'submitted' && <Clock className="w-3.5 h-3.5" />}
                        {selectedSubmission.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submission Content & Files */}
                <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm space-y-4">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Submission Details
                  </h4>

                  {selectedSubmission.submission_date ? (
                    <>
                      <div className="flex items-center gap-4 text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <span>
                          <strong>Submitted on:</strong>{' '}
                          {new Date(selectedSubmission.submission_date).toLocaleString()}
                        </span>
                        {selectedSubmission.is_late && (
                          <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-semibold">
                            Submitted Late
                          </span>
                        )}
                      </div>

                      {/* Text Submission Content */}
                      {selectedSubmission.submission_content && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Notes / Description:</p>
                          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                            {selectedSubmission.submission_content}
                          </div>
                        </div>
                      )}

                      {/* Submitted Project / Repository URL */}
                      {selectedSubmission.submission_url && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2">Submitted Project / Repository Link:</p>
                          <div className="flex items-center justify-between p-3.5 bg-purple-50/70 border border-purple-200/80 rounded-xl hover:bg-purple-50 transition-colors">
                            <div className="flex items-center gap-3 min-w-0 pr-3">
                              <div className="p-2 bg-purple-600 text-white rounded-lg">
                                <ExternalLink className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                  {selectedSubmission.submission_url}
                                </p>
                                <p className="text-xs text-purple-700">Project / Web URL</p>
                              </div>
                            </div>

                            <a
                              href={selectedSubmission.submission_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm shrink-0"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              Open Link
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Uploaded Files */}
                      {selectedSubmission.submission_files && selectedSubmission.submission_files.length > 0 ? (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2">Submitted Attachments:</p>
                          <div className="space-y-2">
                            {selectedSubmission.submission_files.map((file, idx) => {
                              const fileName = file.name || file.original_filename || `Submission_File_${idx + 1}`;
                              const fileUrl = file.url || file.file_url || '';
                              const sizeInMb = file.size
                                ? (file.size / (1024 * 1024)).toFixed(2)
                                : file.file_size
                                  ? (file.file_size / (1024 * 1024)).toFixed(2)
                                  : null;

                              return (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-200/70 rounded-xl hover:bg-blue-50 transition-colors"
                                >
                                  <div className="flex items-center gap-3 min-w-0 pr-3">
                                    <div className="p-2 bg-blue-600 text-white rounded-lg">
                                      <FileText className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold text-gray-900 truncate">
                                        {fileName}
                                      </p>
                                      {sizeInMb && (
                                        <p className="text-xs text-gray-500">{sizeInMb} MB</p>
                                      )}
                                    </div>
                                  </div>

                                  {fileUrl && (
                                    <button
                                      type="button"
                                      onClick={() => openSubmittedFile(fileUrl)}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm shrink-0"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                      View File
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        !selectedSubmission.submission_url && (
                          <p className="text-xs text-gray-500 italic">No files attached with this submission.</p>
                        )
                      )}
                    </>
                  ) : (
                    <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                      <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">No Submission Yet</p>
                      <p className="text-xs text-gray-500 mt-1">This learner has not uploaded an assignment submission.</p>
                    </div>
                  )}
                </div>

                {/* Grading Form */}
                <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                    <Award className="w-4 h-4 text-emerald-600" />
                    Assessment & Grading
                  </h4>

                  <form onSubmit={handleGradeSubmit} className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm font-semibold text-gray-800">
                          Grade / Score (out of {assignment.total_points})
                        </label>
                        {gradeInput && !isNaN(parseFloat(gradeInput)) && (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {assignment.total_points > 0
                              ? Math.round((parseFloat(gradeInput) / assignment.total_points) * 100)
                              : 0}
                            %
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        min="0"
                        max={assignment.total_points}
                        step="0.5"
                        placeholder={`e.g. 85`}
                        value={gradeInput}
                        onChange={(e) => setGradeInput(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-800 block mb-1.5">
                        Educator Feedback
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Write constructive feedback for this learner..."
                        value={feedbackInput}
                        onChange={(e) => setFeedbackInput(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
                      />
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingGrade}
                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
                      >
                        {submittingGrade ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving Grade...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            {selectedSubmission.status === 'graded' ? 'Update Grade & Feedback' : 'Submit Grade & Feedback'}
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
                <GraduationCap className="w-12 h-12 mb-3 opacity-50" />
                <h4 className="text-base font-semibold text-gray-700">Select a Learner</h4>
                <p className="text-sm text-gray-500 max-w-sm mt-1">
                  Choose a learner from the list on the left to inspect their submission and provide grading.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default CollegeGradingModal;
