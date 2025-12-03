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
      const [subjectsData, classesData, yearsData] = await Promise.all([
        curriculumService.getSubjects(),
        curriculumService.getClasses(),
        curriculumService.getAcademicYears(),
      ]);
      
      setSubjects(subjectsData);
      setClasses(classesData);
      setAcademicYears(yearsData);
      
      // Auto-select current academic year if available
      const currentYear = await curriculumService.getCurrentAcademicYear();
      if (currentYear && yearsData.includes(currentYear)) {
        setSelectedAcademicYear(currentYear);
      }
    } catch (error: any) {
      console.error('Error loading configuration:', error);
      alert('Failed to load configuration data: ' + error.message);
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
      await submitForApproval();
      alert('Curriculum submitted for approval! The Academic Coordinator will review it.');
    } catch (error: any) {
      alert('Error submitting curriculum: ' + error.message);
      throw error;
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Approve this curriculum?')) return;
    
    try {
      await approveCurriculum();
      alert('Curriculum approved successfully!');
    } catch (error: any) {
      alert('Error approving curriculum: ' + error.message);
      throw error;
    }
  };

  const handleReject = async () => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;
    
    try {
      await rejectCurriculum(reason);
      alert('Curriculum rejected. Teacher will be notified.');
    } catch (error: any) {
      alert('Error rejecting curriculum: ' + error.message);
      throw error;
    }
  };

  // Pass all props to the original component
  return (
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
  );
};

export default CurriculumBuilderWrapper;
