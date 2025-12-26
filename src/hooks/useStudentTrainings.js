/**
 * Hook to fetch student trainings with server-side sorting and filtering
 * Uses Supabase SQL queries instead of frontend filtering
 * Also fetches course enrollments to show courses the student has started
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../utils/api';

/**
 * @param {string} studentId - Student UUID
 * @param {Object} options - Sort and filter options
 * @param {string} options.sortBy - Field to sort by (title, organization, start_date, created_at, status)
 * @param {string} options.sortDirection - 'asc' or 'desc'
 * @param {string} options.status - Filter by status (all, ongoing, completed)
 * @param {string} options.approvalStatus - Filter by approval_status (all, pending, approved, rejected)
 * @param {string} options.searchTerm - Search in title and organization
 */
export const useStudentTrainings = (studentId, options = {}) => {
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
    if (!studentId) {
      setLoading(false);
      setTrainings([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch from trainings table
      let trainingsQuery = supabase
        .from('trainings')
        .select('*')
        .eq('student_id', studentId);

      // Apply status filter for trainings
      if (status && status !== 'all') {
        trainingsQuery = trainingsQuery.eq('status', status);
      }

      // Apply approval status filter
      if (approvalStatus && approvalStatus !== 'all') {
        trainingsQuery = trainingsQuery.eq('approval_status', approvalStatus);
      }

      // Apply search filter (title or organization)
      if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.trim();
        trainingsQuery = trainingsQuery.or(`title.ilike.%${term}%,organization.ilike.%${term}%`);
      }

      // Apply sorting
      const validSortFields = ['title', 'organization', 'start_date', 'end_date', 'created_at', 'status'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
      trainingsQuery = trainingsQuery.order(sortField, { ascending: sortDirection === 'asc' });

      // Execute trainings query
      const { data: trainingsData, error: trainingsError } = await trainingsQuery;

      if (trainingsError) {
        console.error('❌ Error fetching trainings:', trainingsError);
      }

      // Fetch from course_enrollments table with optimized query
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('student_id', studentId);

      if (enrollmentsError) {
        console.error('❌ Error fetching enrollments:', enrollmentsError);
      }

      // Optimize: Get all course lesson counts in a single query instead of N+1 queries
      let courseLessonCounts = {};
      if (enrollmentsData && enrollmentsData.length > 0) {
        const courseIds = enrollmentsData.map(e => e.course_id).filter(Boolean);
        
        if (courseIds.length > 0) {
          const { data: allCourseLessons, error: lessonsError } = await supabase
            .from('course_modules')
            .select(`
              course_id,
              lessons:lessons(lesson_id)
            `)
            .in('course_id', courseIds);

          if (lessonsError) {
            console.error('❌ Error fetching course lessons:', lessonsError);
          } else if (allCourseLessons) {
            // Build lesson counts map
            courseLessonCounts = allCourseLessons.reduce((acc, module) => {
              if (!acc[module.course_id]) {
                acc[module.course_id] = 0;
              }
              acc[module.course_id] += module.lessons?.length || 0;
              return acc;
            }, {});
          }
        }
      }

      // Add calculated totals to enrollments (more memory efficient)
      const enrollmentsWithCorrectTotals = enrollmentsData?.map(enrollment => ({
        ...enrollment,
        calculated_total_lessons: courseLessonCounts[enrollment.course_id] || 0
      })) || [];

      // Filter enrollments: show if progress > 0 OR status is completed OR recently accessed (within 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const filteredEnrollments = enrollmentsWithCorrectTotals.filter(e => 
        e.progress > 0 || 
        e.status === 'completed' || 
        (e.last_accessed && new Date(e.last_accessed) > sevenDaysAgo)
      );

      // Apply additional filters to enrollments
      let processedEnrollments = filteredEnrollments;
      
      if (status && status !== 'all') {
        if (status === 'completed') {
          processedEnrollments = processedEnrollments.filter(e => e.status === 'completed');
        } else if (status === 'ongoing') {
          processedEnrollments = processedEnrollments.filter(e => e.status !== 'completed');
        }
      }

      if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        processedEnrollments = processedEnrollments.filter(e => 
          (e.course_title || '').toLowerCase().includes(term) ||
          (e.educator_name || '').toLowerCase().includes(term)
        );
      }

      // Transform trainings data
      const formattedTrainings = (trainingsData || []).map((train) => ({
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
        skills: [],
        certificateUrl: '',
        createdAt: train.created_at,
        updatedAt: train.updated_at,
        type: 'training'
      }));

      // Transform course enrollments to match training format
      const formattedEnrollments = processedEnrollments.map((enroll) => {
        const completedLessonsCount = enroll.completed_lessons?.length || 0;
        const totalLessonsCount = enroll.calculated_total_lessons || 0;
        
        // Calculate correct progress percentage
        let calculatedProgress = 0;
        if (totalLessonsCount > 0) {
          calculatedProgress = Math.round((completedLessonsCount / totalLessonsCount) * 100);
        }
        
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
          progress: calculatedProgress, // Use calculated progress instead of stored progress
          approval_status: 'approved',
          verified: true,
          processing: false,
          enabled: true,
          source: 'course_enrollment',
          course_id: enroll.course_id,
          skills: [],
          certificateUrl: enroll.certificate_url || '', // Include certificate URL from enrollment
          createdAt: enroll.enrolled_at,
          updatedAt: enroll.last_accessed,
          type: 'course_enrollment',
          lastAccessed: enroll.last_accessed,
          lastModuleIndex: enroll.last_module_index,
          lastLessonIndex: enroll.last_lesson_index,
          sessionsCount: enroll.sessions_count
        };
      });

      // Merge and deduplicate
      const enrollmentCourseIds = new Set(formattedEnrollments.map(e => e.course_id).filter(Boolean));
      const filteredTrainings = formattedTrainings.filter(t => !t.course_id || !enrollmentCourseIds.has(t.course_id));
      
      // Combine both lists
      let allItems = [...filteredTrainings, ...formattedEnrollments];

      // Sort combined list
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

        if (sortDirection === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });

      setTrainings(allItems);
      await fetchStats();

    } catch (err) {
      console.error('❌ useStudentTrainings exception:', err);
      setError(err.message);
      setTrainings([]);
    } finally {
      setLoading(false);
    }
  }, [studentId, sortBy, sortDirection, status, approvalStatus, searchTerm]);

  const fetchStats = useCallback(async () => {
    if (!studentId) return;

    try {
      // Instead of querying raw tables, calculate stats from the deduplicated trainings array
      // This ensures we don't double-count courses that exist in both tables
      
      // Get trainings that don't have course_id (external/manual trainings)
      const { data: externalTrainings, error: externalError } = await supabase
        .from('trainings')
        .select('status')
        .eq('student_id', studentId)
        .neq('approval_status', 'rejected')
        .is('course_id', null);

      if (externalError) {
        console.error('❌ Error fetching external trainings:', externalError);
      }

      // Get course enrollments with progress > 0 (internal courses)
      const { data: internalCourses, error: internalError } = await supabase
        .from('course_enrollments')
        .select('status, progress, completed_lessons')
        .eq('student_id', studentId);

      if (internalError) {
        console.error('❌ Error fetching internal courses:', internalError);
      }

      // Calculate stats for external trainings
      const externalStats = {
        total: externalTrainings?.length || 0,
        completed: externalTrainings?.filter(t => t.status === 'completed').length || 0,
        ongoing: externalTrainings?.filter(t => t.status === 'ongoing').length || 0
      };

      // Calculate stats for internal courses (with corrected completion logic)
      const internalCoursesWithProgress = (internalCourses || []).filter(c => 
        c.progress > 0 || 
        c.status === 'completed' || 
        (c.completed_lessons && c.completed_lessons.length > 0)
      );

      const internalStats = {
        total: internalCoursesWithProgress.length,
        completed: internalCoursesWithProgress.filter(c => c.status === 'completed').length,
        ongoing: internalCoursesWithProgress.filter(c => c.status !== 'completed').length
      };

      // Combine stats (no double counting)
      const total = externalStats.total + internalStats.total;
      const completed = externalStats.completed + internalStats.completed;
      const ongoing = externalStats.ongoing + internalStats.ongoing;

      setStats({
        total: typeof total === 'number' ? total : 0,
        completed: typeof completed === 'number' ? completed : 0,
        ongoing: typeof ongoing === 'number' ? ongoing : 0,
      });
    } catch (err) {
      console.error('❌ Error fetching stats:', err);
      setStats({ total: 0, completed: 0, ongoing: 0 });
    }
  }, [studentId]);

  useEffect(() => {
    fetchTrainings();
  }, [fetchTrainings]);

  const refetch = useCallback(() => {
    fetchTrainings();
  }, [fetchTrainings]);

  return {
    trainings,
    loading,
    error,
    stats,
    refetch,
  };
};

export default useStudentTrainings;
