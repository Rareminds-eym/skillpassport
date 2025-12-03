/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useCurriculum } from '../../../hooks/useCurriculum';
import * as curriculumService from '../../../services/curriculumService';

// Import all the modal and card components from the original file
import CurriculumBuilder from './CurriculumBuilder';

const CurriculumBuilderWrapper: React.FC = () => {
  // Local state for selections
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  
  // Configuration data from database
  const [subjects, setSubjects] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [academicYears, setAcademicYears] = useState<string[]>([]);

  // Load configuration data on mount
  useEffect(() => {
    loadConfigurationData();
  }, []);

  const loadConfigurationData = async () => {
    try {
      // Load configuration data with individual error handling
      let subjectsData: string[] = [];
      let classesData: string[] = [];
      let yearsData: string[] = [];

      try {
        subjectsData = await curriculumService.getSubjects();
      } catch (err) {
        console.error('Error loading subjects:', err);
      }

      try {
        classesData = await curriculumService.getClasses();
      } catch (err) {
        console.error('Error loading classes:', err);
      }

      try {
        yearsData = await curriculumService.getAcademicYears();
      } catch (err) {
        console.error('Error loading academic years:', err);
      }
      
      setSubjects(subjectsData);
      setClasses(classesData);
      setAcademicYears(yearsData);
      
      // Auto-select current academic year if available
      try {
        const currentYear = await curriculumService.getCurrentAcademicYear();
        if (currentYear && yearsData.includes(currentYear)) {
          setSelectedAcademicYear(currentYear);
        }
      } catch (err) {
        console.error('Error loading current academic year:', err);
      }

      // Show warning if no data was loaded
      if (subjectsData.length === 0 || classesData.length === 0 || yearsData.length === 0) {
        console.warn('Some configuration data is missing:', {
          subjects: subjectsData.length,
          classes: classesData.length,
          years: yearsData.length,
        });
      }
    } catch (error: any) {
      console.error('Error loading configuration:', error);
      alert('Failed to load configuration data. Please check the console for details.');
    }
  };

  // Use the curriculum hook
  const {
    curriculumId,
    chapters,
    learningOutcomes,
    assessmentTypes,
    status,
    rejectionReason,
    loading,
    saveStatus,
    addChapter,
    updateChapter,
    deleteChapter,
    addLearningOutcome,
    updateLearningOutcome,
    deleteLearningOutcome,
    submitForApproval,
    approveCurriculum,
    rejectCurriculum,
  } = useCurriculum(selectedSubject, selectedClass, selectedAcademicYear);

  // Handler wrappers to match the original component's interface
  const handleAddChapter = async (chapter: any) => {
    try {
      if (chapter.id && chapters.find(ch => ch.id === chapter.id)) {
        // Update existing
        await updateChapter(chapter.id, {
          name: chapter.name,
          code: chapter.code,
          description: chapter.description,
          order: chapter.order,
          estimatedDuration: chapter.estimatedDuration,
          durationUnit: chapter.durationUnit,
        });
      } else {
        // Create new
        await addChapter({
          name: chapter.name,
          code: chapter.code,
          description: chapter.description,
          order: chapter.order || chapters.length + 1,
          estimatedDuration: chapter.estimatedDuration,
          durationUnit: chapter.durationUnit,
        });
      }
    } catch (error: any) {
      alert('Error saving chapter: ' + error.message);
      throw error;
    }
  };

  const handleDeleteChapter = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this chapter?')) return;
    
    try {
      await deleteChapter(id);
    } catch (error: any) {
      alert('Error deleting chapter: ' + error.message);
      throw error;
    }
  };

  const handleAddOutcome = async (outcome: any) => {
    try {
      if (outcome.id && learningOutcomes.find(lo => lo.id === outcome.id)) {
        // Update existing
        await updateLearningOutcome(outcome.id, {
          outcome: outcome.outcome,
          bloomLevel: outcome.bloomLevel,
          assessmentMappings: outcome.assessmentMappings,
          chapterId: outcome.chapterId,
        });
      } else {
        // Create new
        await addLearningOutcome({
          chapterId: outcome.chapterId,
          outcome: outcome.outcome,
          bloomLevel: outcome.bloomLevel,
          assessmentMappings: outcome.assessmentMappings,
        });
      }
    } catch (error: any) {
      alert('Error saving learning outcome: ' + error.message);
      throw error;
    }
  };

  const handleDeleteOutcome = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this outcome?')) return;
    
    try {
      await deleteLearningOutcome(id);
    } catch (error: any) {
      alert('Error deleting outcome: ' + error.message);
      throw error;
    }
  };

  const handleSubmitForApproval = async () => {
    try {
      // Check if user is school_admin to show appropriate message
      const { data: { user } } = await curriculumService.supabase.auth.getUser();
      let isSchoolAdmin = false;
      
      if (user) {
        const { data: userData } = await curriculumService.supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        isSchoolAdmin = userData?.role === 'school_admin';
      }

      await submitForApproval();
      
      const message = isSchoolAdmin
        ? 'Curriculum approved and published successfully!'
        : 'Curriculum submitted for approval! The Academic Coordinator will review it.';
      
      setNotification({ type: 'success', message });
      setTimeout(() => setNotification(null), 5000);
    } catch (error: any) {
      setNotification({ type: 'error', message: 'Error submitting curriculum: ' + error.message });
      setTimeout(() => setNotification(null), 5000);
      throw error;
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Approve this curriculum?')) return;
    
    try {
      await approveCurriculum();
      setNotification({ type: 'success', message: 'Curriculum approved successfully!' });
      setTimeout(() => setNotification(null), 5000);
    } catch (error: any) {
      setNotification({ type: 'error', message: 'Error approving curriculum: ' + error.message });
      setTimeout(() => setNotification(null), 5000);
      throw error;
    }
  };

  const handleReject = async () => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    try {
      await rejectCurriculum(reason);
      setNotification({ type: 'success', message: 'Curriculum rejected. Teacher will be notified.' });
      setTimeout(() => setNotification(null), 5000);
    } catch (error: any) {
      setNotification({ type: 'error', message: 'Error rejecting curriculum: ' + error.message });
      setTimeout(() => setNotification(null), 5000);
      throw error;
    }
  };

  // Pass all props to the original component
  return (
    <>
      {/* Notification Banner */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2">
          <div
            className={`rounded-lg border px-6 py-4 shadow-lg ${
              notification.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center gap-3">
              {notification.type === 'success' ? (
                <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
              <p className="text-sm font-medium">{notification.message}</p>
              <button
                onClick={() => setNotification(null)}
                className="ml-4 text-current opacity-70 hover:opacity-100"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      <CurriculumBuilder
      // Selections
      selectedSubject={selectedSubject}
      setSelectedSubject={setSelectedSubject}
      selectedClass={selectedClass}
      setSelectedClass={setSelectedClass}
      selectedAcademicYear={selectedAcademicYear}
      setSelectedAcademicYear={setSelectedAcademicYear}
      // Configuration data from database
      subjects={subjects}
      classes={classes}
      academicYears={academicYears}
      // Data from hook
      curriculumId={curriculumId}
      chapters={chapters}
      learningOutcomes={learningOutcomes}
      assessmentTypes={assessmentTypes}
      status={status}
      rejectionReason={rejectionReason}
      loading={loading}
      saveStatus={saveStatus}
      // Search
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      // Handlers
      onAddChapter={handleAddChapter}
      onDeleteChapter={handleDeleteChapter}
      onAddOutcome={handleAddOutcome}
      onDeleteOutcome={handleDeleteOutcome}
      onSubmitForApproval={handleSubmitForApproval}
      onApprove={handleApprove}
      onReject={handleReject}
    />
    </>
  );
};

export default CurriculumBuilderWrapper;
