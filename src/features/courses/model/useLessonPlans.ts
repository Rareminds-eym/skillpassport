import { useState, useEffect } from 'react';
import { apiPost } from '@/shared/api/apiClient';
import { lessonPlansService } from '../api';
import { filterByStatus } from '../lib';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('use-lesson-plans');

interface LessonPlan {
  id: string;
  title: string;
  subject: string;
  class_name: string;
  date: string;
  status: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  review_comments: string | null;
  created_at: string;
}

interface UseLessonPlansReturn {
  lessonPlans: LessonPlan[];
  loading: boolean;
  filter: string;
  setFilter: (filter: string) => void;
  loadLessonPlans: () => Promise<void>;
  deleteLessonPlan: (id: string) => Promise<void>;
  filteredPlans: LessonPlan[];
}

export const useLessonPlans = (): UseLessonPlansReturn => {
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadLessonPlans();
  }, []);

  const loadLessonPlans = async () => {
    setLoading(true);
    try {
      const userEmail = localStorage.getItem('userEmail');
      
      const teacherResponse: any = await apiPost('/course/actions', {
        action: 'get-educator-by-email',
        email: userEmail,
      });
      const teacherData = teacherResponse?.data;

      if (!teacherData) {
        throw new Error('Teacher not found');
      }

      const plansResponse: any = await apiPost('/course/actions', {
        action: 'get-lesson-plans',
        teacherId: teacherData.id,
      });

      setLessonPlans(plansResponse?.data ?? []);
    } catch (error: any) {
      logger.error('Error loading lesson plans', error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  };

  const deleteLessonPlan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lesson plan?')) return;

    try {
      await lessonPlansService.deleteLessonPlan(id);
      setLessonPlans(lessonPlans.filter((lp) => lp.id !== id));
    } catch (error: any) {
      alert('Error deleting lesson plan: ' + error.message);
    }
  };

  const filteredPlans = filterByStatus(lessonPlans, filter);

  return {
    lessonPlans,
    loading,
    filter,
    setFilter,
    loadLessonPlans,
    deleteLessonPlan,
    filteredPlans,
  };
};
