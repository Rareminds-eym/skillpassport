/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { 
  ArrowLeftIcon, 
  BellAlertIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  DocumentTextIcon,
  ClockIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { UIExam } from '../../../hooks/useExams';
import { WorkflowStage } from '../types';

interface PublishingStepProps {
  exam: UIExam;
  setActiveStep: (step: WorkflowStage) => void;
  updateExam: (updates: Partial<UIExam>) => void;
  // Add other props as needed
}

const PublishingStep: React.FC<PublishingStepProps> = ({ exam, setActiveStep, updateExam }) => {
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const publishResults = async () => {
    // Smart validation logic: Check if all subjects are ready for publishing
    const subjectsReadyForPublishing = exam.marks.filter(subjectMark => {
      // A subject is ready if:
      // 1. It has no moderation (clean marks) - automatically ready
      // 2. OR it has moderation and is approved (isModerated = true)
      
      // Count students with moderation (original_marks different from current marks)
      const moderationCount = subjectMark.studentMarks.filter(s => 
        s.originalMarks !== null && s.originalMarks !== s.marks && !s.isAbsent
      ).length;
      
      const hasModeration = moderationCount > 0;
      
      // If no moderation needed, it's automatically ready
      if (!hasModeration) return true;
      
      // If has moderation, check if it's approved
      return subjectMark.isModerated;
    }).length;

    if (exam.marks.length < exam.subjects.length) {
      alert('Cannot publish: All subjects must have marks entered.');
      return;
    }

    if (subjectsReadyForPublishing < exam.marks.length) {
      const pendingSubjects = exam.marks.filter(subjectMark => {
        const moderationCount = subjectMark.studentMarks.filter(s => 
          s.originalMarks !== null && s.originalMarks !== s.marks && !s.isAbsent
        ).length;
        const hasModeration = moderationCount > 0;
        return hasModeration && !subjectMark.isModerated;
      });
      
      alert(`Cannot publish: The following subjects need moderation approval:\n${pendingSubjects.map(s => `• ${s.subjectName}`).join('\n')}`);
      return;
    }

    try {
      setPublishing(true);
      
      // Update exam status to published
      const updatedExam = {
        ...exam,
        status: "published" as const,
        publishedAt: new Date().toISOString()
      };
      
      updateExam(updatedExam);
      setShowPublishConfirm(false);
      
      // Move to results view
      setTimeout(() => {
        setActiveStep("results");
      }, 1000);
      
    } catch (error) {
      console.error('Error publishing results:', error);
      alert('Failed to publish results. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  // Calculate subjects ready for publishing using the same logic as publishResults
  const subjectsReadyForPublishing = exam.marks.filter(subjectMark => {
    const moderationCount = subjectMark.studentMarks.filter(s => 
      s.originalMarks !== null && s.originalMarks !== s.marks && !s.isAbsent
    ).length;
    const hasModeration = moderationCount > 0;
    
    // Ready if: no moderation needed OR has moderation and is approved
    return !hasModeration || subjectMark.isModerated;
  }).length;
  
  const canPublish = exam.marks.length === exam.subjects.length && subjectsReadyForPublishing === exam.marks.length;

  return (
    <>
      {/* Enhanced Publish Confirmation Modal */}
      {showPublishConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="text-center">
                <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-4">
                  <BellAlertIcon className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Publish Exam Results</h3>
                <p className="text-sm text-gray-600">
                  You're about to publish results for <span className="font-semibold">{exam.name}</span>
                </p>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {/* Summary Stats */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Publication Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Students:</span>
                    <span className="font-medium">{exam.marks[0]?.studentMarks.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subjects:</span>
                    <span className="font-medium">{exam.marks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Grade:</span>
                    <span className="font-medium">{exam.grade}{exam.section ? `-${exam.section}` : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Academic Year:</span>
                    <span className="font-medium">{exam.academicYear}</span>
                  </div>
                </div>
              </div>

              {/* Warning Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-900 mb-1">Important Notice</p>
                    <ul className="text-amber-700 space-y-1">
                      <li>• Results will be immediately visible to students and parents</li>
                      <li>• Notifications will be sent automatically</li>
                      <li>• This action cannot be undone</li>
                      <li>• Report cards will be generated in the background</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Confirmation Checkbox */}
              <label className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg cursor-pointer">
                <input 
                  type="checkbox" 
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                  required 
                />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">I confirm that:</p>
                  <p className="text-blue-700">All results have been reviewed and are ready for publication</p>
                </div>
              </label>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => setShowPublishConfirm(false)}
                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={publishResults}
                disabled={publishing}
                className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium inline-flex items-center gap-2"
              >
                {publishing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Publishing...
                  </>
                ) : (
                  <>
                    <BellAlertIcon className="h-4 w-4" />
                    Publish Results
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <BellAlertIcon className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Publish Results</h3>
              <p className="text-sm text-gray-600 mt-1">
                Final step: Review and publish exam results to students and parents
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  {exam.name}
                </span>
                <span className="flex items-center gap-1">
                  <AcademicCapIcon className="h-3 w-3" />
                  Grade {exam.grade}{exam.section ? `-${exam.section}` : ''}
                </span>
                <span className="flex items-center gap-1">
                  <UserGroupIcon className="h-3 w-3" />
                  {exam.marks[0]?.studentMarks.length || 0} Students
                </span>
              </div>
            </div>
          </div>
          {exam.status === "published" ? (
            <div className="text-center">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                <CheckCircleIcon className="h-5 w-5" />
                Published
              </span>
              <p className="text-xs text-gray-500 mt-1">
                {exam.publishedAt ? new Date(exam.publishedAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          ) : (
            <div className="text-center">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-800 text-sm font-semibold rounded-full">
                <ClockIcon className="h-5 w-5" />
                Ready to Publish
              </span>
              <p className="text-xs text-gray-500 mt-1">
                Awaiting final approval
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Pre-publish Checklist */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Pre-Publication Checklist</h4>
              <p className="text-sm text-gray-500">Ensure all requirements are met before publishing</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {/* Marks Entry Check */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {exam.marks.length === exam.subjects.length ? (
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                </div>
              ) : (
                <div className="p-2 bg-amber-100 rounded-full">
                  <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">Marks Entry Complete</p>
                <p className="text-sm text-gray-500">All subjects must have marks entered</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">{exam.marks.length}/{exam.subjects.length}</p>
              <p className="text-xs text-gray-500">Subjects</p>
            </div>
          </div>

          {/* Moderation Check */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {subjectsReadyForPublishing === exam.marks.length ? (
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                </div>
              ) : (
                <div className="p-2 bg-amber-100 rounded-full">
                  <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">Moderation Complete</p>
                <p className="text-sm text-gray-500">All subjects ready for publishing</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">{subjectsReadyForPublishing}/{exam.marks.length}</p>
              <p className="text-xs text-gray-500">Ready</p>
            </div>
          </div>

          {/* Timetable Check */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {exam.timetable.length > 0 ? (
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                </div>
              ) : (
                <div className="p-2 bg-amber-100 rounded-full">
                  <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
                </div>
              )}
              <div>
                <p className="font-medium text-gray-900">Timetable Configured</p>
                <p className="text-sm text-gray-500">Exam schedule is set up</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">{exam.timetable.length}</p>
              <p className="text-xs text-gray-500">Sessions</p>
            </div>
          </div>

          {/* Overall Status */}
          <div className={`p-4 rounded-lg border-2 ${canPublish ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
            <div className="flex items-center gap-3">
              {canPublish ? (
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              ) : (
                <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
              )}
              <div>
                <p className={`font-semibold ${canPublish ? 'text-green-900' : 'text-amber-900'}`}>
                  {canPublish ? '✅ Ready to Publish' : '⏳ Pending Requirements'}
                </p>
                <p className={`text-sm ${canPublish ? 'text-green-700' : 'text-amber-700'}`}>
                  {canPublish 
                    ? 'All requirements met. You can now publish the results.'
                    : 'Please complete all requirements before publishing.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Results Preview */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <ChartBarIcon className="h-6 w-6 text-purple-600" />
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Results Preview</h4>
              <p className="text-sm text-gray-500">Performance summary across all subjects</p>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {exam.marks.length > 0 ? (
            <>
              {/* Overall Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {(() => {
                  const totalStudents = exam.marks[0]?.studentMarks.length || 0;
                  const totalPresent = exam.marks.reduce((sum, subject) => 
                    sum + subject.studentMarks.filter(s => !s.isAbsent).length, 0) / exam.marks.length;
                  const overallPassRate = exam.marks.reduce((sum, subject) => {
                    const subjectData = exam.subjects.find(s => s.id === subject.subjectId);
                    const presentStudents = subject.studentMarks.filter(s => !s.isAbsent);
                    const passedStudents = presentStudents.filter(s => s.marks !== null && s.marks >= (subjectData?.passingMarks || 0));
                    return sum + (presentStudents.length > 0 ? (passedStudents.length / presentStudents.length) * 100 : 0);
                  }, 0) / exam.marks.length;
                  
                  return (
                    <>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{totalStudents}</p>
                        <p className="text-xs text-gray-600">Total Students</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{Math.round(totalPresent)}</p>
                        <p className="text-xs text-gray-600">Present</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">{Math.round(overallPassRate)}%</p>
                        <p className="text-xs text-gray-600">Pass Rate</p>
                      </div>
                      <div className="text-center p-4 bg-amber-50 rounded-lg">
                        <p className="text-2xl font-bold text-amber-600">{exam.marks.length}</p>
                        <p className="text-xs text-gray-600">Subjects</p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Subject-wise Performance */}
              <div className="space-y-4">
                <h5 className="font-medium text-gray-900">Subject-wise Performance</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {exam.marks.map(subjectMark => {
                    const subject = exam.subjects.find(s => s.id === subjectMark.subjectId);
                    const presentStudents = subjectMark.studentMarks.filter(s => !s.isAbsent);
                    const passedStudents = presentStudents.filter(s => s.marks !== null && s.marks >= (subject?.passingMarks || 0));
                    const passRate = presentStudents.length > 0 ? Math.round((passedStudents.length / presentStudents.length) * 100) : 0;
                    const avgMarks = presentStudents.length > 0 ? 
                      Math.round(presentStudents.reduce((sum, s) => sum + (s.marks || 0), 0) / presentStudents.length) : 0;
                    
                    // Check if subject has moderation
                    const moderationCount = subjectMark.studentMarks.filter(s => 
                      s.originalMarks !== null && s.originalMarks !== s.marks && !s.isAbsent
                    ).length;
                    
                    return (
                      <div key={subjectMark.subjectId} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <h6 className="font-semibold text-gray-900 text-sm">{subjectMark.subjectName}</h6>
                          {moderationCount > 0 && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                              {moderationCount} moderated
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="text-center">
                            <p className="text-xl font-bold text-gray-900">{passRate}%</p>
                            <p className="text-xs text-gray-500">Pass Rate</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xl font-bold text-gray-900">{avgMarks}</p>
                            <p className="text-xs text-gray-500">Avg Marks</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-xs text-gray-600">
                          <div className="flex justify-between">
                            <span>Present:</span>
                            <span className="font-medium">{presentStudents.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Passed:</span>
                            <span className="font-medium text-green-600">{passedStudents.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Failed:</span>
                            <span className="font-medium text-red-600">{presentStudents.length - passedStudents.length}</span>
                          </div>
                        </div>
                        
                        <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              passRate >= 75 ? "bg-green-500" : 
                              passRate >= 50 ? "bg-amber-500" : "bg-red-500"
                            }`}
                            style={{ width: `${passRate}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ChartBarIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No results data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Publication Options */}
      {exam.status !== "published" && canPublish && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <BellAlertIcon className="h-6 w-6 text-green-600" />
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Publication Settings</h4>
                <p className="text-sm text-gray-500">Configure how results will be shared</p>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Notification Options */}
              <div className="space-y-4">
                <h5 className="font-medium text-gray-900 flex items-center gap-2">
                  <BellAlertIcon className="h-4 w-4" />
                  Notifications
                </h5>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                    <div>
                      <p className="font-medium text-gray-900">Students</p>
                      <p className="text-xs text-gray-500">Send SMS/Email to students</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                    <div>
                      <p className="font-medium text-gray-900">Parents</p>
                      <p className="text-xs text-gray-500">Send SMS/Email to parents</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Report Generation */}
              <div className="space-y-4">
                <h5 className="font-medium text-gray-900 flex items-center gap-2">
                  <DocumentTextIcon className="h-4 w-4" />
                  Reports
                </h5>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                    <div>
                      <p className="font-medium text-gray-900">Report Cards</p>
                      <p className="text-xs text-gray-500">Individual student reports</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                    <div>
                      <p className="font-medium text-gray-900">Class Summary</p>
                      <p className="text-xs text-gray-500">Performance analytics</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Publication Timeline */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h5 className="font-medium text-blue-900 mb-2">Publication Timeline</h5>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• Results will be immediately visible to students and parents</p>
                <p>• Notifications will be sent within 5 minutes</p>
                <p>• Report cards will be generated in the background</p>
                <p>• This action cannot be undone once completed</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Published Status */}
      {exam.status === "published" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-green-900">Results Successfully Published</h4>
                <p className="text-sm text-gray-500">Results are now live and accessible to students and parents</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Publication Details */}
              <div className="space-y-4">
                <h5 className="font-medium text-gray-900">Publication Details</h5>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Published Date:</span>
                    <span className="font-medium text-gray-900">
                      {exam.publishedAt ? new Date(exam.publishedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Students:</span>
                    <span className="font-medium text-gray-900">{exam.marks[0]?.studentMarks.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subjects Published:</span>
                    <span className="font-medium text-gray-900">{exam.marks.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      <CheckCircleIcon className="h-3 w-3" />
                      Live
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <h5 className="font-medium text-gray-900">Quick Actions</h5>
                <div className="space-y-3">
                  <button 
                    onClick={() => setActiveStep("results")}
                    className="w-full px-4 py-3 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 inline-flex items-center justify-center gap-2"
                  >
                    <EyeIcon className="h-4 w-4" />
                    View Detailed Results
                  </button>
                  <button 
                    onClick={() => {
                      alert("📄 Report Generation\n\nThis will generate:\n• Individual student report cards\n• Class performance summary\n• Subject-wise analysis\n• Grade distribution charts\n• Export to PDF format\n\nEstimated time: 2-3 minutes");
                    }}
                    className="w-full px-4 py-3 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 inline-flex items-center justify-center gap-2"
                  >
                    <DocumentTextIcon className="h-4 w-4" />
                    Generate Report Cards
                  </button>
                  <button 
                    onClick={() => {
                      alert("📊 Analytics Dashboard\n\nView comprehensive analytics:\n• Performance trends\n• Subject-wise comparisons\n• Student progress tracking\n• Historical data analysis");
                    }}
                    className="w-full px-4 py-3 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 inline-flex items-center justify-center gap-2"
                  >
                    <ChartBarIcon className="h-4 w-4" />
                    View Analytics
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Enhanced Navigation */}
      <div className="bg-white border-t border-gray-200 p-6 mt-8">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setActiveStep("moderation")} 
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium inline-flex items-center gap-2 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Moderation
          </button>
          
          {exam.status === "published" ? (
            <div className="flex gap-3">
              <button
                onClick={() => setActiveStep("results")}
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium inline-flex items-center gap-2 transition-colors"
              >
                <EyeIcon className="h-5 w-5" />
                View Detailed Results
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {!canPublish && (
                <div className="text-right">
                  <p className="text-sm text-amber-600 font-medium">⏳ Pending Requirements</p>
                  <p className="text-xs text-gray-500">Complete checklist to publish</p>
                </div>
              )}
              <button
                onClick={() => setShowPublishConfirm(true)}
                disabled={!canPublish}
                className={`px-8 py-3 rounded-xl font-semibold inline-flex items-center gap-2 transition-all ${
                  canPublish 
                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <BellAlertIcon className="h-5 w-5" />
                {canPublish ? 'Publish Results' : 'Cannot Publish Yet'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default PublishingStep;