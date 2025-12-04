import { useState, useEffect } from 'react';
import * as curriculumService from '../services/curriculumService';

export interface Chapter {
  id: string;
  name: string;
  code?: string;
  description: string;
  order: number;
  estimatedDuration?: number;
  durationUnit?: 'hours' | 'weeks';
}

export interface AssessmentMapping {
  assessmentType: string;
  assessment_type_id?: string;
  weightage?: number;
}

export interface LearningOutcome {
  id: string;
  chapterId: string;
  outcome: string;
  assessmentMappings: AssessmentMapping[];
  bloomLevel?: string;
}

export interface AssessmentType {
  id: string;
  name: string;
  description: string;
}

export const useCurriculum = (
  subject: string,
  className: string,
  academicYear: string
) => {
  const [curriculumId, setCurriculumId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [learningOutcomes, setLearningOutcomes] = useState<LearningOutcome[]>([]);
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([]);
  const [status, setStatus] = useState<'draft' | 'pending_approval' | 'approved' | 'rejected'>('draft');
  const [rejectionReason, setRejectionReason] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Load assessment types on mount
  useEffect(() => {
    loadAssessmentTypes();
  }, []);

  // Load curriculum when parameters change
  useEffect(() => {
    if (subject && className && academicYear) {
      loadCurriculum();
    }
  }, [subject, className, academicYear]);

  const loadAssessmentTypes = async () => {
    try {
      const types = await curriculumService.getAssessmentTypes();
      setAssessmentTypes(types);
    } catch (error: any) {
      console.error('Error loading assessment types:', error);
    }
  };

  const loadCurriculum = async () => {
    setLoading(true);
    try {
      const curriculum = await curriculumService.getCurriculum(subject, className, academicYear);

      if (curriculum) {
        setCurriculumId(curriculum.id);
        setStatus(curriculum.status);
        setRejectionReason(curriculum.rejection_reason);

        // Load chapters
        const chaps = await curriculumService.getChapters(curriculum.id);
        setChapters(
          chaps.map((ch) => ({
            id: ch.id,
            name: ch.name,
            code: ch.code,
            description: ch.description,
            order: ch.order_number,
            estimatedDuration: ch.estimated_duration,
            durationUnit: ch.duration_unit,
          }))
        );

        // Load learning outcomes
        const outcomes = await curriculumService.getLearningOutcomes(curriculum.id);
        setLearningOutcomes(
          outcomes.map((lo) => ({
            id: lo.id,
            chapterId: lo.chapter_id,
            outcome: lo.outcome,
            bloomLevel: lo.bloom_level,
            assessmentMappings: lo.assessmentMappings || [],
          }))
        );
      } else {
        // Create new curriculum
        const newCurriculum = await curriculumService.createCurriculum(
          subject,
          className,
          academicYear
        );
        setCurriculumId(newCurriculum.id);
        setStatus('draft');
        setChapters([]);
        setLearningOutcomes([]);
      }
    } catch (error: any) {
      console.error('Error loading curriculum:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addChapter = async (chapter: Omit<Chapter, 'id'>) => {
    if (!curriculumId) return;

    try {
      setSaveStatus('saving');

      const newChapter = await curriculumService.createChapter(curriculumId, {
        name: chapter.name,
        code: chapter.code,
        description: chapter.description,
        order_number: chapter.order,
        estimated_duration: chapter.estimatedDuration,
        duration_unit: chapter.durationUnit,
      });

      const mappedChapter: Chapter = {
        id: newChapter.id,
        name: newChapter.name,
        code: newChapter.code,
        description: newChapter.description,
        order: newChapter.order_number,
        estimatedDuration: newChapter.estimated_duration,
        durationUnit: newChapter.duration_unit,
      };

      setChapters((prev) => [...prev, mappedChapter]);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      
      return mappedChapter;
    } catch (error: any) {
      console.error('Error adding chapter:', error);
      setSaveStatus('idle');
      throw error;
    }
  };

  const updateChapter = async (chapterId: string, updates: Partial<Chapter>) => {
    try {
      setSaveStatus('saving');

      await curriculumService.updateChapter(chapterId, {
        name: updates.name,
        code: updates.code,
        description: updates.description,
        order_number: updates.order,
        estimated_duration: updates.estimatedDuration,
        duration_unit: updates.durationUnit,
      });

      setChapters((prev) =>
        prev.map((ch) => (ch.id === chapterId ? { ...ch, ...updates } : ch))
      );

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error: any) {
      console.error('Error updating chapter:', error);
      setSaveStatus('idle');
      throw error;
    }
  };

  const deleteChapter = async (chapterId: string) => {
    try {
      await curriculumService.deleteChapter(chapterId);
      setChapters((prev) => prev.filter((ch) => ch.id !== chapterId));
      setLearningOutcomes((prev) => prev.filter((lo) => lo.chapterId !== chapterId));
    } catch (error: any) {
      console.error('Error deleting chapter:', error);
      throw error;
    }
  };

  const addLearningOutcome = async (outcome: Omit<LearningOutcome, 'id'>) => {
    try {
      setSaveStatus('saving');

      // Map assessment types to IDs
      const mappingsWithIds = outcome.assessmentMappings.map((mapping) => {
        const assessmentType = assessmentTypes.find((at) => at.name === mapping.assessmentType);
        return {
          assessmentType: mapping.assessmentType,
          assessment_type_id: assessmentType?.id,
          weightage: mapping.weightage,
        };
      });

      const newOutcome = await curriculumService.createLearningOutcome(
        outcome.chapterId,
        outcome.outcome,
        outcome.bloomLevel,
        mappingsWithIds
      );

      const mappedOutcome: LearningOutcome = {
        id: newOutcome.id,
        chapterId: newOutcome.chapter_id,
        outcome: newOutcome.outcome,
        bloomLevel: newOutcome.bloom_level,
        assessmentMappings: mappingsWithIds,
      };

      setLearningOutcomes((prev) => [...prev, mappedOutcome]);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      
      return mappedOutcome;
    } catch (error: any) {
      console.error('Error adding learning outcome:', error);
      setSaveStatus('idle');
      throw error;
    }
  };

  const updateLearningOutcome = async (
    outcomeId: string,
    updates: Partial<LearningOutcome>
  ) => {
    try {
      setSaveStatus('saving');

      // Map assessment types to IDs
      const mappingsWithIds = updates.assessmentMappings?.map((mapping) => {
        const assessmentType = assessmentTypes.find((at) => at.name === mapping.assessmentType);
        return {
          assessmentType: mapping.assessmentType,
          assessment_type_id: assessmentType?.id,
          weightage: mapping.weightage,
        };
      });

      await curriculumService.updateLearningOutcome(
        outcomeId,
        updates.outcome || '',
        updates.bloomLevel,
        mappingsWithIds
      );

      setLearningOutcomes((prev) =>
        prev.map((lo) => (lo.id === outcomeId ? { ...lo, ...updates } : lo))
      );

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error: any) {
      console.error('Error updating learning outcome:', error);
      setSaveStatus('idle');
      throw error;
    }
  };

  const deleteLearningOutcome = async (outcomeId: string) => {
    try {
      await curriculumService.deleteLearningOutcome(outcomeId);
      setLearningOutcomes((prev) => prev.filter((lo) => lo.id !== outcomeId));
    } catch (error: any) {
      console.error('Error deleting learning outcome:', error);
      throw error;
    }
  };

  const submitForApproval = async () => {
    if (!curriculumId) return;

    try {
      // Validate first
      const validation = await curriculumService.validateCurriculum(curriculumId);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Check if user is school_admin - they can auto-approve
      const { data: { user } } = await curriculumService.supabase.auth.getUser();
      if (user) {
        const { data: userData } = await curriculumService.supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (userData?.role === 'school_admin') {
          // School admins can directly approve their own curriculums
          await curriculumService.updateCurriculumStatus(curriculumId, 'approved');
          setStatus('approved');
          return;
        }
      }

      // For regular educators, submit for approval
      await curriculumService.updateCurriculumStatus(curriculumId, 'pending_approval');
      setStatus('pending_approval');
    } catch (error: any) {
      console.error('Error submitting curriculum:', error);
      throw error;
    }
  };

  const approveCurriculum = async () => {
    if (!curriculumId) return;

    try {
      await curriculumService.updateCurriculumStatus(curriculumId, 'approved');
      setStatus('approved');
    } catch (error: any) {
      console.error('Error approving curriculum:', error);
      throw error;
    }
  };

  const rejectCurriculum = async (reason: string) => {
    if (!curriculumId) return;

    try {
      await curriculumService.updateCurriculumStatus(curriculumId, 'rejected', reason);
      setStatus('rejected');
      setRejectionReason(reason);
    } catch (error: any) {
      console.error('Error rejecting curriculum:', error);
      throw error;
    }
  };

  return {
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
  };
};
