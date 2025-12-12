import { useState, useEffect } from 'react';
import { assessmentService, timetableService } from '../../services/college';
import type { Assessment, ExamSlot } from '../../types/college';

interface UseAssessmentsOptions {
  type?: string;
  academic_year?: string;
  department_id?: string;
  program_id?: string;
  semester?: number;
  status?: string;
}

export const useAssessments = (options: UseAssessmentsOptions = {}) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssessments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await assessmentService.getAssessments(options);
      
      if (result.success) {
        setAssessments(result.data || []);
      } else {
        setError(result.error.message);
        setAssessments([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch assessments');
      setAssessments([]);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchAssessments();
  }, [options.type, options.academic_year, options.department_id, options.program_id, options.semester, options.status]);

  const createAssessment = async (data: Partial<Assessment>) => {
    const result = await assessmentService.createAssessment(data);
    if (result.success) {
      await fetchAssessments();
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error.message };
  };

  const updateAssessment = async (id: string, updates: Partial<Assessment>) => {
    const result = await assessmentService.updateAssessment(id, updates);
    if (result.success) {
      await fetchAssessments();
      return { success: true };
    }
    return { success: false, error: result.error.message };
  };

  const submitToExamCell = async (id: string) => {
    const result = await assessmentService.submitToExamCell(id);
    if (result.success) {
      await fetchAssessments();
      return { success: true };
    }
    return { success: false, error: result.error.message };
  };

  const approveAssessment = async (id: string, approvedBy: string) => {
    const result = await assessmentService.approveAssessment(id, approvedBy);
    if (result.success) {
      await fetchAssessments();
      return { success: true };
    }
    return { success: false, error: result.error.message };
  };

  return {
    assessments,
    loading,
    error,
    createAssessment,
    updateAssessment,
    submitToExamCell,
    approveAssessment,
    refetch: fetchAssessments,
  };
};

export const useExamTimetable = (assessmentId?: string) => {
  const [slots, setSlots] = useState<ExamSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = async () => {
    if (!assessmentId) {
      setSlots([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await timetableService.getExamSlots(assessmentId);
      
      if (result.success) {
        setSlots(result.data || []);
      } else {
        setError(result.error.message);
        setSlots([]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch exam slots');
      setSlots([]);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchSlots();
  }, [assessmentId]);

  const createSlot = async (data: Partial<ExamSlot>) => {
    const result = await timetableService.createExamSlot(data);
    if (result.success) {
      await fetchSlots();
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error.message };
  };

  const assignInvigilator = async (slotId: string, facultyId: string) => {
    const result = await timetableService.assignInvigilator(slotId, facultyId);
    if (result.success) {
      await fetchSlots();
      return { success: true };
    }
    return { success: false, error: result.error.message };
  };

  const detectConflicts = async () => {
    const result = await timetableService.detectConflicts(slots);
    if (result.success) {
      return { success: true, conflicts: result.data };
    }
    return { success: false, error: result.error.message };
  };

  const publishTimetable = async (assessmentId: string) => {
    const result = await timetableService.publishTimetable(assessmentId);
    if (result.success) {
      await fetchSlots();
      return { success: true };
    }
    return { success: false, error: result.error.message };
  };

  return {
    slots,
    loading,
    error,
    createSlot,
    assignInvigilator,
    detectConflicts,
    publishTimetable,
    refetch: fetchSlots,
  };
};
