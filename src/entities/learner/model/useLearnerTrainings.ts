import { useCallback, useEffect, useState } from 'react';
import { apiPost } from "@/shared/api/apiClient";
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('learner-trainings-hook');

export const useLearnerTrainings = (learnerId, options = {}) => {
  const {
    sortBy = 'created_at',
    sortDirection = 'desc',
    status = 'all',
    approvalStatus = 'all',
    searchTerm = '',
  } = options;

  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ total: 0, completed: 0, ongoing: 0 });

  const fetchTrainings = useCallback(async () => {
    if (!learnerId) {
      setLoading(false);
      setTrainings([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [trainingsResult, enrollmentsResult] = await Promise.all([
        apiPost('/learner-profile/actions', {
          action: 'fetch-trainings', learnerId,
          filters: {
            status: status !== 'all' ? status : undefined,
            approval_status: approvalStatus !== 'all' ? approvalStatus : undefined,
            search: searchTerm?.trim() || undefined,
            sortField: sortBy,
            sortAsc: sortDirection === 'asc',
          },
        }),
        apiPost('/learner-profile/actions', {
          action: 'fetch-course-enrollments', learnerId,
        }),
      ]);

      const trainingsData = trainingsResult?.data || [];
      const enrollmentsData = enrollmentsResult?.data || [];

      let courseLessonCounts = {};
      if (enrollmentsData.length > 0) {
        const courseIds = enrollmentsData.map(e => e.course_id).filter(Boolean);
        if (courseIds.length > 0) {
          const modulesResult = await apiPost('/learner-profile/actions', {
            action: 'fetch-course-modules', courseIds,
          });
          const allCourseLessons = modulesResult?.data || [];
          courseLessonCounts = allCourseLessons.reduce((acc, module) => {
            if (!acc[module.course_id]) acc[module.course_id] = 0;
            acc[module.course_id] += module.lessons?.length || 0;
            return acc;
          }, {});
        }
      }

      const enrollmentsWithCorrectTotals = enrollmentsData.map(enrollment => ({
        ...enrollment,
        calculated_total_lessons: courseLessonCounts[enrollment.course_id] || 0,
      }));

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      let filteredEnrollments = enrollmentsWithCorrectTotals.filter(e =>
        e.progress > 0 || e.status === 'completed' ||
        (e.last_accessed && new Date(e.last_accessed) > sevenDaysAgo)
      );

      if (status && status !== 'all') {
        if (status === 'completed') filteredEnrollments = filteredEnrollments.filter(e => e.status === 'completed');
        else if (status === 'ongoing') filteredEnrollments = filteredEnrollments.filter(e => e.status !== 'completed');
      }

      if (searchTerm?.trim()) {
        const term = searchTerm.trim().toLowerCase();
        filteredEnrollments = filteredEnrollments.filter(e =>
          (e.course_title || '').toLowerCase().includes(term) ||
          (e.educator_name || '').toLowerCase().includes(term)
        );
      }

      const trainingIds = trainingsData.map(t => t.id);

      const [skillsResult, certsResult] = trainingIds.length > 0 ? await Promise.all([
        apiPost('/learner-profile/actions', { action: 'fetch-skills-by-training', trainingIds }),
        apiPost('/learner-profile/actions', { action: 'fetch-certificates-by-training', trainingIds }),
      ]) : [{ data: [] }, { data: [] }];

      const skillsByTraining = {};
      for (const s of (skillsResult?.data || [])) {
        if (!skillsByTraining[s.training_id]) skillsByTraining[s.training_id] = [];
        skillsByTraining[s.training_id].push(s);
      }

      const certsByTraining = {};
      for (const c of (certsResult?.data || [])) {
        if (!certsByTraining[c.training_id]) certsByTraining[c.training_id] = [];
        certsByTraining[c.training_id].push(c);
      }

      const formattedTrainings = trainingsData.map(train => ({
        id: train.id,
        title: String(train.title || ''),
        course: String(train.title || ''),
        organization: String(train.organization || ''),
        provider: String(train.organization || ''),
        start_date: train.start_date,
        end_date: train.end_date,
        startDate: train.start_date,
        endDate: train.end_date,
        duration: String(train.duration || ''),
        description: String(train.description || ''),
        status: String(train.status || 'ongoing'),
        completedModules: Number(train.completed_modules) || 0,
        totalModules: Number(train.total_modules) || 0,
        hoursSpent: Number(train.hours_spent) || 0,
        approval_status: String(train.approval_status || 'pending'),
        verified: train.approval_status === 'approved' || train.approval_status === 'verified',
        processing: train.approval_status === 'pending',
        enabled: train.approval_status !== 'rejected',
        source: String(train.source || 'manual'),
        course_id: train.course_id,
        skills: skillsByTraining[train.id] || [],
        certificateUrl: (certsByTraining[train.id] || [])[0]?.link || '',
        createdAt: train.created_at,
        updatedAt: train.updated_at,
        type: 'training',
      }));

      const formattedEnrollments = filteredEnrollments.map(enroll => {
        const completedLessonsCount = enroll.completed_lessons?.length || 0;
        const totalLessonsCount = enroll.calculated_total_lessons || 0;
        const calculatedProgress = totalLessonsCount > 0 ? Math.round((completedLessonsCount / totalLessonsCount) * 100) : 0;

        return {
          id: `enrollment-${enroll.id}`,
          title: String(enroll.course_title || 'Untitled Course'),
          course: String(enroll.course_title || 'Untitled Course'),
          organization: String(enroll.educator_name || 'Platform Course'),
          provider: String(enroll.educator_name || 'Platform Course'),
          start_date: enroll.enrolled_at,
          end_date: enroll.completed_at,
          startDate: enroll.enrolled_at,
          endDate: enroll.completed_at,
          duration: '',
          description: '',
          status: calculatedProgress >= 100 ? 'completed' : 'ongoing',
          completedModules: completedLessonsCount,
          totalModules: totalLessonsCount,
          hoursSpent: Math.round((enroll.total_time_spent_seconds || 0) / 3600),
          progress: calculatedProgress,
          approval_status: 'approved',
          verified: true,
          processing: false,
          enabled: true,
          source: 'course_enrollment',
          course_id: enroll.course_id,
          skills: [],
          certificateUrl: enroll.certificate_url || '',
          createdAt: enroll.enrolled_at,
          updatedAt: enroll.last_accessed,
          type: 'course_enrollment',
          lastAccessed: enroll.last_accessed,
          lastModuleIndex: enroll.last_module_index,
          lastLessonIndex: enroll.last_lesson_index,
          sessionsCount: enroll.sessions_count,
        };
      });

      const enrollmentCourseIds = new Set(formattedEnrollments.map(e => e.course_id).filter(Boolean));
      const filteredTrainings = formattedTrainings.filter(t => !t.course_id || !enrollmentCourseIds.has(t.course_id));
      const allItems = [...filteredTrainings, ...formattedEnrollments];

      allItems.sort((a, b) => {
        let aVal, bVal;
        if (sortBy === 'title') {
          aVal = a.title?.toLowerCase() || '';
          bVal = b.title?.toLowerCase() || '';
        } else if (sortBy === 'organization') {
          aVal = a.organization?.toLowerCase() || '';
          bVal = b.organization?.toLowerCase() || '';
        } else if (sortBy === 'start_date') {
          aVal = new Date(a.start_date || 0);
          bVal = new Date(b.start_date || 0);
        } else if (sortBy === 'status') {
          aVal = a.status || '';
          bVal = b.status || '';
        } else {
          aVal = new Date(a.createdAt || 0);
          bVal = new Date(b.createdAt || 0);
        }
        return sortDirection === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
      });

      setTrainings(allItems);
      await fetchStats();

    } catch (err) {
      logger.error('Failed to fetch learner trainings', err instanceof Error ? err : new Error(String(err)), { learnerId });
      setError(err.message);
      setTrainings([]);
    } finally {
      setLoading(false);
    }
  }, [learnerId, sortBy, sortDirection, status, approvalStatus, searchTerm]);

  const fetchStats = useCallback(async () => {
    if (!learnerId) return;

    try {
      const [trainingsResult, enrollmentsResult] = await Promise.all([
        apiPost('/learner-profile/actions', {
          action: 'fetch-trainings', learnerId,
          filters: { approval_status: 'rejected', sortField: 'created_at' },
        }),
        apiPost('/learner-profile/actions', {
          action: 'fetch-course-enrollments', learnerId,
        }),
      ]);

      const externalTrainings = (trainingsResult?.data || []).filter(t => !t.course_id);
      const externalStats = {
        total: externalTrainings.length,
        completed: externalTrainings.filter(t => t.status === 'completed').length,
        ongoing: externalTrainings.filter(t => t.status === 'ongoing').length,
      };

      const internalCourses = (enrollmentsResult?.data || []).filter(c =>
        c.progress > 0 || c.status === 'completed' || (c.completed_lessons && c.completed_lessons.length > 0)
      );

      const internalStats = {
        total: internalCourses.length,
        completed: internalCourses.filter(c => c.status === 'completed').length,
        ongoing: internalCourses.filter(c => c.status !== 'completed').length,
      };

      setStats({
        total: externalStats.total + internalStats.total,
        completed: externalStats.completed + internalStats.completed,
        ongoing: externalStats.ongoing + internalStats.ongoing,
      });
    } catch (err) {
      logger.error('Failed to fetch training statistics', err instanceof Error ? err : new Error(String(err)), { learnerId });
      setStats({ total: 0, completed: 0, ongoing: 0 });
    }
  }, [learnerId]);

  useEffect(() => {
    fetchTrainings();
  }, [fetchTrainings]);

  return {
    trainings,
    loading,
    error,
    stats,
    refetch: useCallback(() => fetchTrainings(), [fetchTrainings]),
  };
};

export default useLearnerTrainings;
