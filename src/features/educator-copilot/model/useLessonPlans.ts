import { useState, useEffect } from "react";
import { getLogger } from "@/shared/config/logging";
import {
  getLessonPlans,
  createLessonPlan,
  updateLessonPlan,
  deleteLessonPlan,
  submitLessonPlan,
  getCurriculums,
  getChapters,
  getLearningOutcomes,
  getSubjects,
  getClasses,
  LessonPlan,
  LessonPlanFormData,
} from "../api";

const logger = getLogger('UseLessonPlans');

export function useLessonPlans() {
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load lesson plans
  const loadLessonPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await getLessonPlans();
      if (error) throw error;
      setLessonPlans(data || []);
    } catch (err: any) {
      logger.error('Failed to load lesson plans', err as Error);
      setError(err.message || "Failed to load lesson plans");
    } finally {
      setLoading(false);
    }
  };

  // Create lesson plan
  const create = async (formData: LessonPlanFormData, classId: string) => {
    try {
      const { data, error } = await createLessonPlan(formData, classId);
      if (error) throw error;
      if (data) {
        setLessonPlans((prev) => [data, ...prev]);
      }
      return { data, error: null };
    } catch (err: any) {
      logger.error('Failed to create lesson plan', err as Error);
      return { data: null, error: err.message || "Failed to create lesson plan" };
    }
  };

  // Update lesson plan
  const update = async (id: string, formData: LessonPlanFormData, classId: string) => {
    try {
      const { data, error } = await updateLessonPlan(id, formData, classId);
      if (error) throw error;
      if (data) {
        setLessonPlans((prev) =>
          prev.map((plan) => (plan.id === id ? data : plan))
        );
      }
      return { data, error: null };
    } catch (err: any) {
      logger.error('Failed to update lesson plan', err as Error);
      return { data: null, error: err.message || "Failed to update lesson plan" };
    }
  };

  // Delete lesson plan
  const remove = async (id: string) => {
    try {
      const { error } = await deleteLessonPlan(id);
      if (error) throw error;
      setLessonPlans((prev) => prev.filter((plan) => plan.id !== id));
      return { error: null };
    } catch (err: any) {
      logger.error('Failed to delete lesson plan', err as Error);
      return { error: err.message || "Failed to delete lesson plan" };
    }
  };

  // Submit lesson plan
  const submit = async (id: string) => {
    try {
      const { data, error } = await submitLessonPlan(id);
      if (error) throw error;
      if (data) {
        setLessonPlans((prev) =>
          prev.map((plan) => (plan.id === id ? data : plan))
        );
      }
      return { data, error: null };
    } catch (err: any) {
      logger.error('Failed to submit lesson plan', err as Error);
      return { data: null, error: err.message || "Failed to submit lesson plan" };
    }
  };

  // Load on mount
  useEffect(() => {
    loadLessonPlans();
  }, []);

  return {
    lessonPlans,
    loading,
    error,
    reload: loadLessonPlans,
    create,
    update,
    remove,
    submit,
  };
}

export function useCurriculum(subject: string, className: string, academicYear?: string) {
  const [curriculums, setCurriculums] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [learningOutcomes, setLearningOutcomes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load curriculums when subject, class, or academic year change
  useEffect(() => {
    if (subject && className) {
      loadCurriculums();
    } else {
      setCurriculums([]);
      setChapters([]);
      setLearningOutcomes([]);
    }
  }, [subject, className, academicYear]);

  const loadCurriculums = async () => {
    setLoading(true);
    try {
      const { data, error } = await getCurriculums(subject, className);
      if (error) throw error;

      // Filter by academic year if provided
      let filteredData = data || [];
      if (academicYear) {
        filteredData = filteredData.filter((c: any) => c.academic_year === academicYear);
      }

      setCurriculums(filteredData);

      // Auto-load chapters if there's only one curriculum
      if (filteredData && filteredData.length === 1) {
        loadChapters(filteredData[0].id);
      } else if (filteredData && filteredData.length === 0) {
        setChapters([]);
      }
    } catch (err) {
      logger.error('Failed to load curriculums', err as Error);
      setCurriculums([]);
    } finally {
      setLoading(false);
    }
  };

  const loadChapters = async (curriculumId: string) => {
    setLoading(true);
    try {
      const { data, error } = await getChapters(curriculumId);
      if (error) throw error;
      setChapters(data || []);
    } catch (err) {
      logger.error('Failed to load chapters', err as Error);
      setChapters([]);
    } finally {
      setLoading(false);
    }
  };

  const loadLearningOutcomes = async (chapterId: string) => {
    setLoading(true);
    try {
      const { data, error } = await getLearningOutcomes(chapterId);
      if (error) throw error;
      setLearningOutcomes(data || []);
    } catch (err) {
      logger.error('Failed to load learning outcomes', err as Error);
      setLearningOutcomes([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    curriculums,
    chapters,
    learningOutcomes,
    loading,
    loadChapters,
    loadLearningOutcomes,
  };
}

export function useSubjectsAndClasses(schoolId?: string) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [schoolId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subjectsResult, classesResult] = await Promise.all([
        getSubjects(schoolId),
        schoolId ? getClasses(schoolId) : { data: null, error: null },
      ]);

      if (subjectsResult.data) {
        setSubjects(subjectsResult.data);
      }
      if (classesResult.data) {
        setClasses(classesResult.data);
      }
    } catch (err) {
      logger.error('Failed to load subjects and classes', err as Error);
    } finally {
      setLoading(false);
    }
  };

  return {
    subjects,
    classes,
    loading,
  };
}
