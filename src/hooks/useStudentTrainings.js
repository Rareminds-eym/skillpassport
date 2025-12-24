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

      // Fetch from course_enrollments table
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select('*')
        .eq('student_id', studentId);

      if (enrollmentsError) {
        console.error('❌ Error fetching enrollments:', enrollmentsError);
      }

      // Filter enrollments: show if progress > 0 OR status is completed OR recently accessed (within 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const filteredEnrollments = (enrollmentsData || []).filter(e => 
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
      const formattedEnrollments = processedEnrollments.map((enroll) => ({
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
        status: enroll.status === 'completed' ? 'completed' : 'ongoing',
        completedModules: enroll.completed_lessons?.length || 0,
        totalModules: enroll.total_lessons || 0,
        hoursSpent: Math.round((enroll.total_time_spent_seconds || 0) / 3600),
        progress: enroll.progress || 0,
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
        sessionsCount: enroll.sessions_count
      }));

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
      // Get trainings counts
      const [trainingsTotal, trainingsCompleted, trainingsOngoing] = await Promise.all([
        supabase
          .from('trainings')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', studentId)
          .neq('approval_status', 'rejected'),
        supabase
          .from('trainings')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', studentId)
          .eq('status', 'completed')
          .neq('approval_status', 'rejected'),
        supabase
          .from('trainings')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', studentId)
          .eq('status', 'ongoing')
          .neq('approval_status', 'rejected')
      ]);

      // Get course enrollments counts (only courses with actual progress)
      const [enrollmentsTotal, enrollmentsCompleted, enrollmentsOngoing] = await Promise.all([
        supabase
          .from('course_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', studentId)
          .gt('progress', 0),
        supabase
          .from('course_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', studentId)
          .eq('status', 'completed'),
        supabase
          .from('course_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', studentId)
          .gt('progress', 0)
          .neq('status', 'completed')
      ]);

      const total = (trainingsTotal.count || 0) + (enrollmentsTotal.count || 0);
      const completed = (trainingsCompleted.count || 0) + (enrollmentsCompleted.count || 0);
      const ongoing = (trainingsOngoing.count || 0) + (enrollmentsOngoing.count || 0);

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
