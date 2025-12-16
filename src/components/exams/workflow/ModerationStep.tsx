/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { 
  ArrowLeftIcon, 
  ChevronRightIcon, 
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  PencilIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { UIExam, UIStudentMark } from '../../../hooks/useExams';
import { WorkflowStage, MODERATION_TYPES } from '../types';
import StatusBadge from '../StatusBadge';

interface ModerationStepProps {
  exam: UIExam;
  setActiveStep: (step: WorkflowStage) => void;
  moderateMarks: (markEntryId: string, moderationData: any) => Promise<void>;
  approveSubjectModeration: (examId: string, subjectId: string, userId?: string) => Promise<void>;
  loadData: () => Promise<void>;
  currentUserId?: string;
}

interface ModerationSummary {
  subjectId: string;
  subjectName: string;
  totalStudents: number;
  marksEntered: boolean;
  hasModeration: boolean;
  moderationCount: number;
  approvalStatus: 'not_started' | 'pending_approval' | 'approved';
  reasonText: string;
  canModerate: boolean;
  canApprove: boolean;
}

const ModerationStep: React.FC<ModerationStepProps> = ({ 
  exam, 
  setActiveStep, 
  moderateMarks, 
  approveSubjectModeration, 
  loadData,
  currentUserId 
}) => {
  const [moderatingSubjectId, setModeratingSubjectId] = useState<string | null>(null);
  const [moderationData, setModerationData] = useState<UIStudentMark[]>([]);
  const [viewingSubjectId, setViewingSubjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Calculate moderation summary for each subject - Simplified Logic
  const moderationSummary: ModerationSummary[] = exam.subjects.map(subject => {
    const subjectMarks = exam.marks.find(m => m.subjectId === subject.id);
    const marksEntered = !!subjectMarks && subjectMarks.studentMarks.length > 0;
    
    // Count students with moderation (original_marks different from marks_obtained)
    const moderationCount = subjectMarks?.studentMarks.filter(s => 
      s.originalMarks !== null && s.originalMarks !== s.marks && !s.isAbsent
    ).length || 0;
    
    const hasModeration = moderationCount > 0;
    
    // Smart approval status logic
    let approvalStatus: ModerationSummary['approvalStatus'] = 'not_started';
    let reasonText = '';
    
    if (!marksEntered) {
      approvalStatus = 'not_started';
      reasonText = 'Marks not yet entered';
    } else if (subjectMarks?.isModerated) {
      // CASE: Subject has been manually approved
      approvalStatus = 'approved';
      reasonText = hasModeration ? 
        `Approved with ${moderationCount} moderation(s)` : 
        'Approved - no changes made';
    } else if (hasModeration) {
      // CASE: Has moderation changes but not yet approved
      approvalStatus = 'pending_approval';
      reasonText = `${moderationCount} student(s) have moderated marks - requires approval`;
    } else {
      // CASE: No moderation changes - automatically ready
      approvalStatus = 'approved';
      reasonText = 'Ready - no changes needed';
    }

    return {
      subjectId: subject.id,
      subjectName: subject.name,
      totalStudents: subjectMarks?.studentMarks.length || 0,
      marksEntered,
      hasModeration,
      moderationCount,
      approvalStatus,
      reasonText,
      // Allow moderation even after publishing and approval
      canModerate: marksEntered,
      // Only show approve button if there are actual moderation changes that need approval
      canApprove: marksEntered && hasModeration && moderationCount > 0 && !subjectMarks?.isModerated
    };
  });

  const overallStats = {
    totalSubjects: exam.subjects.length,
    subjectsWithMarks: moderationSummary.filter(s => s.marksEntered).length,
    subjectsApproved: moderationSummary.filter(s => s.approvalStatus === 'approved').length,
    subjectsPendingApproval: moderationSummary.filter(s => s.approvalStatus === 'pending_approval').length,
    totalModerations: moderationSummary.reduce((sum, s) => sum + s.moderationCount, 0)
  };

  const startModeration = (subjectId: string) => {
    const subjectMarks = exam.marks.find(m => m.subjectId === subjectId);
    if (subjectMarks) {
      setModerationData(subjectMarks.studentMarks.map(s => ({
        ...s,
        originalMarks: s.originalMarks || s.marks, // Preserve existing original marks
        moderationType: s.moderationType || "correction",
        moderationReason: s.moderationReason || ""
      })));
      setModeratingSubjectId(subjectId);
    }
  };

  const saveModeration = async () => {
    if (!moderatingSubjectId || !currentUserId) return;

    setLoading(true);
    try {
      const subject = exam.subjects.find(s => s.id === moderatingSubjectId);
      if (!subject) return;

      // Find students with actual changes
      const changedStudents = moderationData.filter(student => 
        student.originalMarks !== student.marks && !student.isAbsent && 
        student.marks !== null && student.originalMarks !== null
      );

      if (changedStudents.length === 0) {
        alert('ℹ️ No changes detected to moderate');
        setModeratingSubjectId(null);
        return;
      }

      // Validate required fields for changed students
      const missingData = changedStudents.filter(student => 
        !student.moderationType || !student.moderationReason?.trim()
      );
      
      if (missingData.length > 0) {
        alert(`Please provide moderation type and justification for all changed students:\n${missingData.map(s => `• ${s.studentName}`).join('\n')}`);
        return;
      }

      // Check ±10% rule violations
      const violations = changedStudents.filter(student => {
        const diff = Math.abs(student.marks! - student.originalMarks!);
        const tenPercent = student.originalMarks! * 0.1;
        return diff > tenPercent;
      });

      if (violations.length > 0) {
        const proceed = confirm(
          `⚠️ ${violations.length} student(s) have changes exceeding ±10%:\n\n` +
          violations.map(s => `• ${s.studentName}: ${s.originalMarks} → ${s.marks} (${Math.abs(s.marks! - s.originalMarks!)} marks)`).join('\n') +
          `\n\nThis requires special approval. Continue?`
        );
        if (!proceed) return;
      }

      // Save moderation for each changed student
      const moderationPromises = changedStudents.map(student => {
        return moderateMarks(student.markEntryId!, {
          assessment_id: exam.id,
          student_id: student.studentId,
          subject_id: moderatingSubjectId,
          original_marks: student.originalMarks!,
          marks_obtained: student.marks!,
          moderation_reason: student.moderationReason!,
          moderation_type: student.moderationType!,
          moderated_by: currentUserId
        });
      });

      await Promise.all(moderationPromises);
      await loadData();
      
      alert(`✅ Moderation saved for ${changedStudents.length} student(s)`);
      setModeratingSubjectId(null);
      setModerationData([]);
    } catch (error) {
      console.error('Error saving moderation:', error);
      alert('❌ Failed to save moderation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSubject = async (subjectId: string) => {
    if (!currentUserId) return;

    setLoading(true);
    try {
      const subject = exam.subjects.find(s => s.id === subjectId);
      await approveSubjectModeration(exam.id, subjectId, currentUserId);
      await loadData();
      alert(`✅ Moderation approved for ${subject?.name}`);
    } catch (error) {
      console.error('Error approving moderation:', error);
      alert('❌ Failed to approve moderation. Please try again.');
    } finally {
      setLoading(false);
    }
  };



  const getStatusIcon = (summary: ModerationSummary) => {
    switch (summary.approvalStatus) {
      case 'approved': return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case 'pending_approval': return <ExclamationCircleIcon className="h-4 w-4 text-amber-600" />;
      default: return <ClockIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusLabel = (summary: ModerationSummary) => {
    switch (summary.approvalStatus) {
      case 'approved': return 'Approved';
      case 'pending_approval': return 'Pending Approval';
      default: return 'Not Started';
    }
  };

  const getStatusColor = (summary: ModerationSummary) => {
    switch (summary.approvalStatus) {
      case 'approved': return 'bg-green-50 border-green-200 text-green-800';
      case 'pending_approval': return 'bg-amber-50 border-amber-200 text-amber-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Marks Moderation & Review</h3>
          <p className="text-sm text-gray-500 mt-1">
            Review marks and approve changes. Subjects without changes are automatically ready.
          </p>
        </div>
        <StatusBadge status={exam.status} />
      </div>

      {/* Moderation Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <ShieldCheckIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-2">Moderation Process</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-blue-700">
              <div>
                <p className="font-medium mb-1">1. Review Marks</p>
                <p>Examine submitted marks for accuracy and consistency</p>
              </div>
              <div>
                <p className="font-medium mb-1">2. Make Changes (Optional)</p>
                <p>Adjust marks with proper justification if needed</p>
              </div>
              <div>
                <p className="font-medium mb-1">3. Approve Changes</p>
                <p>Only subjects with changes need manual approval</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Legend */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Status Guide</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-4 w-4 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Ready/Approved</p>
              <p className="text-gray-600">No changes needed OR changes approved</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ExclamationCircleIcon className="h-4 w-4 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Pending Approval</p>
              <p className="text-gray-600">Has moderation changes - needs approval</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-gray-400" />
            <div>
              <p className="font-medium text-gray-600">Not Started</p>
              <p className="text-gray-600">Marks not yet entered</p>
            </div>
          </div>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Subjects Ready</p>
              <p className="text-xl font-bold text-blue-600">{overallStats.subjectsWithMarks} / {overallStats.totalSubjects}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Approved</p>
              <p className="text-xl font-bold text-green-600">{overallStats.subjectsApproved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <ExclamationCircleIcon className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Pending</p>
              <p className="text-xl font-bold text-amber-600">{overallStats.subjectsPendingApproval}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <PencilIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Moderations</p>
              <p className="text-xl font-bold text-purple-600">{overallStats.totalModerations}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subject-wise Moderation Status */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900">Subject Moderation Status</h4>
        
        <div className="space-y-3">
          {moderationSummary.map(summary => (
            <div key={summary.subjectId} className={`rounded-lg border p-4 ${getStatusColor(summary)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(summary)}
                  <div>
                    <h5 className="font-semibold text-gray-900">{summary.subjectName}</h5>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span>Students: {summary.totalStudents}</span>
                      {summary.moderationCount > 0 && (
                        <span className="text-purple-600 font-medium">
                          {summary.moderationCount} moderation(s)
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(summary)}`}>
                        {getStatusLabel(summary)}
                      </span>
                    </div>
                    {/* Show reason text for better clarity */}
                    <p className="text-xs text-gray-500 mt-1">{summary.reasonText}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* View Details Button */}
                  {summary.marksEntered && (
                    <button
                      onClick={() => setViewingSubjectId(summary.subjectId)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 inline-flex items-center gap-1"
                    >
                      <EyeIcon className="h-3 w-3" />
                      View
                    </button>
                  )}

                  {/* Moderate Button - Always available if marks are entered */}
                  {summary.canModerate && (
                    <button
                      onClick={() => startModeration(summary.subjectId)}
                      className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 inline-flex items-center gap-1"
                    >
                      <PencilIcon className="h-3 w-3" />
                      Moderate
                    </button>
                  )}

                  {/* Approve Button */}
                  {summary.canApprove && (
                    <button
                      onClick={() => handleApproveSubject(summary.subjectId)}
                      disabled={loading}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-300 inline-flex items-center gap-1"
                    >
                      <CheckIcon className="h-3 w-3" />
                      Approve
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {summary.marksEntered && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Moderation Progress</span>
                    <span>
                      {summary.approvalStatus === 'approved' ? 'Approved for publishing' : 
                       summary.moderationCount > 0 ? `${summary.moderationCount} changes pending approval` : 'Ready for approval'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        summary.approvalStatus === 'approved' ? 'bg-green-500' :
                        summary.approvalStatus === 'pending_approval' ? 'bg-amber-500' :
                        'bg-gray-400'
                      }`}
                      style={{ 
                        width: summary.approvalStatus === 'approved' ? '100%' : 
                               summary.approvalStatus === 'pending_approval' ? '75%' : '25%'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Moderation Modal */}
      {moderatingSubjectId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Moderate Marks - {exam.subjects.find(s => s.id === moderatingSubjectId)?.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Adjust marks within ±10% with proper justification
                  </p>
                </div>
                <button
                  onClick={() => {
                    setModeratingSubjectId(null);
                    setModerationData([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {/* Moderation Guidelines */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <ExclamationTriangleIcon className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">Moderation Guidelines</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-purple-700">
                  {MODERATION_TYPES.map(type => (
                    <div key={type.value} className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      <span className="font-medium">{type.label}:</span>
                      <span>{type.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Roll No</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Student Name</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Original</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Current</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">±10% Range</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Type</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Justification</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {moderationData.map((student, idx) => {
                      const original = student.originalMarks ?? student.marks ?? 0;
                      const tenPercentLower = Math.max(0, Math.floor(original - (original * 0.1)));
                      const tenPercentUpper = Math.min(
                        exam.subjects.find(s => s.id === moderatingSubjectId)?.totalMarks || 100, 
                        Math.ceil(original + (original * 0.1))
                      );
                      const isWithinRange = student.marks !== null && student.marks >= tenPercentLower && student.marks <= tenPercentUpper;
                      const hasChanged = student.marks !== student.originalMarks;

                      return (
                        <tr key={student.studentId} className={hasChanged ? "bg-yellow-50" : ""}>
                          <td className="px-3 py-2 text-xs font-medium">{student.rollNumber}</td>
                          <td className="px-3 py-2 text-xs">{student.studentName}</td>
                          <td className="px-3 py-2 text-center text-xs font-medium">
                            {student.isAbsent ? "Absent" : student.originalMarks}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="number"
                              value={student.marks ?? ""}
                              onChange={(e) => {
                                const newMarks = e.target.value ? parseInt(e.target.value) : null;
                                setModerationData(prev => prev.map((s, i) => 
                                  i === idx ? { ...s, marks: newMarks } : s
                                ));
                              }}
                              disabled={student.isAbsent}
                              min="0"
                              max={exam.subjects.find(s => s.id === moderatingSubjectId)?.totalMarks || 100}
                              className={`w-16 rounded border px-2 py-1 text-xs text-center ${
                                student.isAbsent ? "bg-gray-100" : 
                                !isWithinRange && hasChanged ? "border-red-500 bg-red-50" : 
                                hasChanged ? "border-yellow-500 bg-yellow-50" : "border-gray-300"
                              }`}
                            />
                          </td>
                          <td className="px-3 py-2 text-center text-xs text-gray-500">
                            {student.isAbsent ? "-" : `${tenPercentLower}-${tenPercentUpper}`}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <select
                              value={student.moderationType || "correction"}
                              onChange={(e) => {
                                setModerationData(prev => prev.map((s, i) => 
                                  i === idx ? { ...s, moderationType: e.target.value } : s
                                ));
                              }}
                              disabled={student.isAbsent || !hasChanged}
                              className="w-24 rounded border px-1 py-1 text-xs"
                            >
                              {MODERATION_TYPES.map(type => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="text"
                              value={student.moderationReason || ""}
                              onChange={(e) => {
                                setModerationData(prev => prev.map((s, i) => 
                                  i === idx ? { ...s, moderationReason: e.target.value } : s
                                ));
                              }}
                              disabled={student.isAbsent || !hasChanged}
                              placeholder="Required for changes"
                              className="w-32 rounded border px-2 py-1 text-xs"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            {student.isAbsent ? (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">Absent</span>
                            ) : hasChanged ? (
                              isWithinRange ? (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">✓ Valid</span>
                              ) : (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">⚠ Exceeds ±10%</span>
                              )
                            ) : (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">No change</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-between">
              <div className="text-sm text-gray-600">
                Changes: {moderationData.filter(s => s.marks !== s.originalMarks && !s.isAbsent).length} students
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setModeratingSubjectId(null);
                    setModerationData([]);
                  }}
                  className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveModeration}
                  disabled={loading}
                  className="px-4 py-2 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 inline-flex items-center gap-2"
                >
                  <CheckIcon className="h-4 w-4" />
                  {loading ? 'Saving...' : 'Save Moderation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingSubjectId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {exam.subjects.find(s => s.id === viewingSubjectId)?.name} - Marks Overview
                </h3>
                <button
                  onClick={() => setViewingSubjectId(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {(() => {
                const subjectMarks = exam.marks.find(m => m.subjectId === viewingSubjectId);
                if (!subjectMarks) return <p>No marks data available</p>;

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Roll No</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Student Name</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Original</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Current</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Change</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {subjectMarks.studentMarks.map(student => {
                          // Only consider it changed if:
                          // 1. originalMarks exists (not null/undefined)
                          // 2. originalMarks is different from current marks
                          // 3. There's an actual numerical difference (not just null vs 0 issues)
                          const hasOriginalMarks = student.originalMarks !== null && student.originalMarks !== undefined;
                          const hasActualChange = hasOriginalMarks && student.originalMarks !== student.marks;
                          const hasChanged = hasActualChange;
                          const change = hasChanged ? (student.marks || 0) - (student.originalMarks || 0) : 0;
                          
                          return (
                            <tr key={student.studentId} className={hasChanged ? "bg-yellow-50" : ""}>
                              <td className="px-3 py-2 text-xs font-medium">{student.rollNumber}</td>
                              <td className="px-3 py-2 text-xs">{student.studentName}</td>
                              <td className="px-3 py-2 text-center text-xs">
                                {student.isAbsent ? "Absent" : student.originalMarks ?? student.marks}
                              </td>
                              <td className="px-3 py-2 text-center text-xs font-medium">
                                {student.isAbsent ? "Absent" : student.marks}
                              </td>
                              <td className="px-3 py-2 text-center text-xs">
                                {student.isAbsent ? "-" : hasChanged && change !== 0 ? (
                                  <span className={change > 0 ? "text-green-600" : "text-red-600"}>
                                    {change > 0 ? "+" : ""}{change}
                                  </span>
                                ) : "-"}
                              </td>
                              <td className="px-3 py-2 text-center">
                                {student.isAbsent ? (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">Absent</span>
                                ) : hasChanged ? (
                                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">Modified</span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">Original</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between gap-3 pt-4 border-t border-gray-200">
        <button 
          onClick={() => setActiveStep("marks")} 
          className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 inline-flex items-center gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Marks
        </button>
        <button 
          onClick={() => setActiveStep("publishing")} 
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 inline-flex items-center gap-2"
        >
          Next: Publish Results
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default ModerationStep;