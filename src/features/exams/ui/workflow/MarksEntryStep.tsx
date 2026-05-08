/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { getLogger } from '@/shared/config/logging';
import {
  ArrowLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { UIExam, UIlearnerMark } from '@/features/exams';
import { WorkflowStage } from '../types';

const logger = getLogger('MarksEntryStep');

interface MarksEntryStepProps {
  exam: UIExam;
  setActiveStep: (step: WorkflowStage) => void;
  loadlearners: (targetClasses?: any, grade?: string, section?: string) => Promise<any[]>;
  saveMarks: (examId: string, subjectId: string, marks: UIlearnerMark[]) => Promise<void>;
  updateExam: (updates: Partial<UIExam>) => void;
}

const MarksEntryStep: React.FC<MarksEntryStepProps> = ({ 
  exam, 
  setActiveStep, 
  loadlearners, 
  saveMarks, 
  updateExam 
}) => {
  const [selectedSubject, setSelectedSubject] = useState(exam.subjects[0]?.id || "");
  const [learnerMarks, setlearnerMarks] = useState<UIlearnerMark[]>([]);
  const [loadinglearners, setLoadinglearners] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[learnerId: string]: string}>({});
  const [saveStatus, setSaveStatus] = useState<{type: 'success' | 'error' | null, message: string}>({type: null, message: ''});

  // Initialize selectedSubject when exam changes
  useEffect(() => {
    if (exam.subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(exam.subjects[0].id);
    }
  }, [exam.subjects, selectedSubject]);

  // Load learners when component mounts or when selected subject changes
  useEffect(() => {
    const loadExamlearners = async () => {
      if (exam.grade) {
        setLoadinglearners(true);
        try {
          // Use new targeting system
          const learnersData = await loadlearners(exam.targetClasses, exam.grade, exam.section);
          
          // Check if we have existing marks for the selected subject
          const existingMarks = exam.marks.find(m => m.subjectId === selectedSubject);
          
          if (existingMarks) {
            setlearnerMarks(existingMarks.learnerMarks);
          } else {
            const transformedlearners: UIlearnerMark[] = learnersData.map(learner => ({
              learnerId: learner.id,
              learnerName: learner.name,
              rollNumber: learner.roll_number || learner.admission_number || 'N/A',
              marks: null,
              isAbsent: false,
              isExempt: false
            }));
            setlearnerMarks(transformedlearners);
          }
        } catch (error) {
          logger.error('Failed to load learners', error as Error);
          setlearnerMarks([]);
        } finally {
          setLoadinglearners(false);
        }
      }
    };

    loadExamlearners();
  }, [exam.targetClasses, selectedSubject, exam.marks, loadlearners]);

  // Update learnerMarks when selectedSubject changes
  useEffect(() => {
    if (selectedSubject) {
      const existing = exam.marks.find(m => m.subjectId === selectedSubject);
      if (existing?.learnerMarks) {
        setlearnerMarks(existing.learnerMarks);
      }
    }
  }, [selectedSubject, exam.marks]);

  // Validation function for marks
  const validateMarks = (marks: number | null, totalMarks: number): string | null => {
    if (marks === null) return null; // Allow null marks (not entered)
    
    if (marks < 0) {
      return "Marks cannot be negative";
    }
    
    if (marks > totalMarks) {
      return "Marks cannot exceed total marks";
    }
    
    return null; // Valid
  };

  // Handle marks change with validation
  const handleMarksChange = (learnerId: string, value: string) => {
    const newValue = value ? parseInt(value) : null;
    const currentSubject = exam.subjects.find(s => s.id === selectedSubject);
    const totalMarks = currentSubject?.totalMarks || 100;
    
    // Validate the new value
    const error = validateMarks(newValue, totalMarks);
    
    // Update validation errors
    setValidationErrors(prev => ({
      ...prev,
      [learnerId]: error || ''
    }));
    
    // Only update marks if valid or null
    if (!error || newValue === null) {
      setlearnerMarks(prev => prev.map(s => 
        s.learnerId === learnerId ? { ...s, marks: newValue } : s
      ));
    }
  };

  const saveSubjectMarks = async () => {
    // Check for validation errors before saving
    const hasErrors = Object.values(validationErrors).some(error => error !== '');
    if (hasErrors) {
      setSaveStatus({
        type: 'error',
        message: 'Please fix validation errors before saving marks.'
      });
      return;
    }

    try {
      setSaveStatus({type: null, message: ''});
      await saveMarks(exam.id, selectedSubject, learnerMarks);
      
      // Update local exam state immediately to show the saved marks
      const subjectMarks = {
        subjectId: selectedSubject,
        subjectName: exam.subjects.find(s => s.id === selectedSubject)?.name || 'Unknown',
        totalMarks: exam.subjects.find(s => s.id === selectedSubject)?.totalMarks || 100,
        learnerMarks: learnerMarks,
        submittedBy: 'Current User',
        submittedAt: new Date().toISOString()
      };

      const existingMarkIndex = exam.marks.findIndex(m => m.subjectId === selectedSubject);
      let updatedMarks;
      
      if (existingMarkIndex >= 0) {
        updatedMarks = [...exam.marks];
        updatedMarks[existingMarkIndex] = subjectMarks;
      } else {
        updatedMarks = [...exam.marks, subjectMarks];
      }

      updateExam({ marks: updatedMarks });
      setSaveStatus({
        type: 'success',
        message: 'Marks saved successfully!'
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus({type: null, message: ''});
      }, 3000);
    } catch (error) {
      logger.error('Failed to save marks', error as Error);
      setSaveStatus({
        type: 'error',
        message: 'Failed to save marks. Please try again.'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Enter Learner Marks</h3>
          <p className="text-sm text-gray-500 mt-1">Enter marks for each subject</p>
        </div>
      </div>

      {/* Status Messages */}
      {saveStatus.type && (
        <div className={`rounded-lg p-4 ${
          saveStatus.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {saveStatus.type === 'success' ? (
              <CheckIcon className="h-5 w-5 text-green-600" />
            ) : (
              <div className="h-5 w-5 text-red-600">⚠️</div>
            )}
            <p className={`text-sm font-medium ${
              saveStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
            }`}>
              {saveStatus.message}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div></div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              // Bulk upload handler
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.csv,.xlsx,.xls';
              input.onchange = (e: any) => {
                const file = e.target?.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const text = event.target?.result as string;
                      const lines = text.split('\n').filter(line => line.trim());
                      
                      // Skip header row
                      const dataLines = lines.slice(1);
                      
                      const uploadedMarks: UIlearnerMark[] = [];
                      let successCount = 0;
                      let errorCount = 0;
                      
                      dataLines.forEach(line => {
                        const [rollNumber, , marks, absent] = line.split(',').map(s => s.trim());
                        
                        // Find existing learner by roll number
                        const existingLearner = learnerMarks.find(s => s.rollNumber === rollNumber);
                        
                        if (existingLearner) {
                          const isAbsent = absent?.toLowerCase() === 'yes' || absent?.toLowerCase() === 'true';
                          const parsedMarks = isAbsent ? null : (marks ? parseInt(marks) : null);
                          
                          uploadedMarks.push({
                            ...existingLearner,
                            marks: parsedMarks,
                            isAbsent: isAbsent
                          });
                          successCount++;
                        } else {
                          errorCount++;
                        }
                      });
                      
                      if (uploadedMarks.length > 0) {
                        // Merge uploaded marks with existing learner marks
                        const updatedMarks = learnerMarks.map(learner => {
                          const uploaded = uploadedMarks.find(u => u.learnerId === learner.learnerId);
                          return uploaded || learner;
                        });
                        
                        setlearnerMarks(updatedMarks);
                        setSaveStatus({
                          type: 'success',
                          message: `Bulk upload successful! ${successCount} records imported${errorCount > 0 ? `, ${errorCount} records skipped` : ''}`
                        });
                      } else {
                        setSaveStatus({
                          type: 'error',
                          message: 'No valid records found in the file. Please check the format.'
                        });
                      }
                    } catch (error) {
                      setSaveStatus({
                        type: 'error',
                        message: 'Error processing file. Please ensure it\'s a valid CSV file with the correct format.'
                      });
                      logger.error('Bulk upload error', error as Error);
                    }
                  };
                  reader.readAsText(file);
                }
              };
              input.click();
            }}
            className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium inline-flex items-center gap-2"
            title="Upload marks via Excel/CSV"
          >
            <ArrowUpTrayIcon className="h-4 w-4" />
            Bulk Upload
          </button>
          <button
            onClick={() => {
              // Generate CSV template with current learners
              const subject = exam.subjects.find(s => s.id === selectedSubject);
              const csvContent = [
                ['Roll Number', 'Learner Name', 'Marks', 'Absent (Yes/No)'].join(','),
                ...learnerMarks.map(learner => 
                  [learner.rollNumber, learner.learnerName, '', 'No'].join(',')
                )
              ].join('\n');
              
              // Create blob and download
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement('a');
              const url = URL.createObjectURL(blob);
              
              link.setAttribute('href', url);
              link.setAttribute('download', `marks_template_${subject?.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
              link.style.visibility = 'hidden';
              
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium inline-flex items-center gap-2"
            title="Download template"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Template
          </button>
          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
            {exam.subjects.map(subject => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </select>
          <span className="text-sm font-medium text-gray-600">{exam.marks.length} / {exam.subjects.length} completed</span>
        </div>
      </div>

      {/* Subject Progress Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Subject Progress</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {exam.subjects.map(subject => {
            const subjectMarks = exam.marks.find(m => m.subjectId === subject.id);
            
            // If this is the currently selected subject, use live learnerMarks data
            // Otherwise use saved data from exam.marks
            const currentMarks = subject.id === selectedSubject && learnerMarks.length > 0 
              ? learnerMarks 
              : subjectMarks?.learnerMarks || [];
            
            const isCompleted = !!subjectMarks;
            const enteredCount = currentMarks.filter(s => s.marks !== null || s.isAbsent).length;
            const totallearners = currentMarks.length > 0 ? currentMarks.length : learnerMarks.length;
            
            return (
              <button
                key={subject.id}
                onClick={() => setSelectedSubject(subject.id)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  selectedSubject === subject.id 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : isCompleted 
                      ? 'border-green-200 bg-green-50 hover:border-green-300' 
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className={`text-sm font-medium ${
                    selectedSubject === subject.id ? 'text-indigo-900' : 
                    isCompleted ? 'text-green-900' : 'text-gray-900'
                  }`}>
                    {subject.name}
                  </h5>
                  {isCompleted && (
                    <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckIcon className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className={selectedSubject === subject.id ? 'text-indigo-700' : 'text-gray-600'}>
                      Progress
                    </span>
                    <span className={`font-medium ${
                      selectedSubject === subject.id ? 'text-indigo-700' : 
                      isCompleted ? 'text-green-700' : 'text-gray-700'
                    }`}>
                      {enteredCount} / {totallearners}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all ${
                        selectedSubject === subject.id ? 'bg-indigo-500' :
                        isCompleted ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                      style={{ width: `${totallearners > 0 ? (enteredCount / totallearners) * 100 : 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {subject.totalMarks} marks • Pass: {subject.passingMarks}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedSubject && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-medium text-blue-900">
                {exam.subjects.find(s => s.id === selectedSubject)?.name}
              </h4>
              <p className="text-xs text-blue-700 mt-1">
                Total Marks: {exam.subjects.find(s => s.id === selectedSubject)?.totalMarks} | 
                Passing: {exam.subjects.find(s => s.id === selectedSubject)?.passingMarks}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-700">
                {learnerMarks.filter(s => s.marks !== null || s.isAbsent).length} / {learnerMarks.length} entered
              </p>
              <div className="w-24 bg-blue-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ 
                    width: `${learnerMarks.length > 0 ? (learnerMarks.filter(s => s.marks !== null || s.isAbsent).length / learnerMarks.length) * 100 : 0}%` 
                  }}
                />
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="bg-white rounded-lg p-2 border border-blue-200">
              <p className="text-lg font-bold text-blue-900">{learnerMarks.length}</p>
              <p className="text-xs text-blue-600">Total Learners</p>
            </div>
            <div className="bg-white rounded-lg p-2 border border-blue-200">
              <p className="text-lg font-bold text-green-600">
                {learnerMarks.filter(s => s.marks !== null && !s.isAbsent).length}
              </p>
              <p className="text-xs text-blue-600">Marks Entered</p>
            </div>
            <div className="bg-white rounded-lg p-2 border border-blue-200">
              <p className="text-lg font-bold text-red-600">
                {learnerMarks.filter(s => s.isAbsent).length}
              </p>
              <p className="text-xs text-blue-600">Absent</p>
            </div>
            <div className="bg-white rounded-lg p-2 border border-blue-200">
              <p className="text-lg font-bold text-gray-600">
                {learnerMarks.filter(s => s.marks === null && !s.isAbsent).length}
              </p>
              <p className="text-xs text-blue-600">Pending</p>
            </div>
          </div>
        </div>
      )}

      {loadinglearners ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading learners...</p>
        </div>
      ) : learnerMarks.length === 0 ? (
        <div className="text-center py-8 bg-amber-50 rounded-lg border border-amber-200">
          <div className="text-amber-600 mb-2">⚠️ No learners found</div>
          <p className="text-sm text-amber-700 mb-2">
            No learners found for Grade {exam.grade}{exam.section ? ` Section ${exam.section}` : ' (All Sections)'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Roll No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Learner Name</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Marks</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Absent</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {learnerMarks.map(learner => {
              const maxMarks = exam.subjects.find(s => s.id === selectedSubject)?.totalMarks || 100;
              const passingMarks = exam.subjects.find(s => s.id === selectedSubject)?.passingMarks || 35;
              const isPassing = learner.marks !== null && learner.marks >= passingMarks;
              
              return (
                <tr key={learner.learnerId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{learner.rollNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{learner.learnerName}</td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <input
                        type="number"
                        value={learner.marks ?? ""}
                        onChange={(e) => handleMarksChange(learner.learnerId, e.target.value)}
                        disabled={learner.isAbsent || exam.status === "published"}
                        min="0"
                        max={maxMarks}
                        className={`w-20 mx-auto block rounded-lg border px-3 py-1.5 text-sm text-center ${
                          learner.isAbsent || exam.status === "published" 
                            ? "bg-gray-100 text-gray-400" 
                            : validationErrors[learner.learnerId] 
                              ? "border-red-300 bg-red-50" 
                              : "border-gray-300"
                        }`}
                        placeholder="-"
                      />
                      {validationErrors[learner.learnerId] && (
                        <div className="absolute top-full left-0 right-0 mt-1 text-xs text-red-600 text-center bg-white border border-red-200 rounded px-2 py-1 shadow-sm z-10">
                          {validationErrors[learner.learnerId]}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={learner.isAbsent}
                      onChange={() => setlearnerMarks(prev => prev.map(s => s.learnerId === learner.learnerId ? { ...s, isAbsent: !s.isAbsent, marks: !s.isAbsent ? null : s.marks } : s))}
                      disabled={exam.status === "published"}
                      className={`h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500 ${
                        exam.status === "published" ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {learner.isAbsent ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Absent</span>
                    ) : learner.marks !== null ? (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${isPassing ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {isPassing ? "Pass" : "Fail"}
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">Pending</span>
                    )}
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-between gap-3 pt-4 border-t border-gray-200">
        <button onClick={() => setActiveStep("invigilation")} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 inline-flex items-center gap-2">
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </button>
        <div className="flex gap-3">
          {exam.status !== "published" ? (
            <>
              <button onClick={saveSubjectMarks} className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-flex items-center gap-2">
                <CheckIcon className="h-4 w-4" />
                Save Marks
              </button>
              <button onClick={() => setActiveStep("moderation")} disabled={exam.marks.length < exam.subjects.length} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center gap-2">
                Next: Moderation
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </>
          ) : (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 text-gray-600">
                <EyeIcon className="h-5 w-5" />
                <span className="text-sm font-medium">Read-Only Mode - Exam is Published</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Marks cannot be modified after publication</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MarksEntryStep;
