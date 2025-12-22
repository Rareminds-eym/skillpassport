/**
 * Hook to fetch student trainings with server-side sorting and filtering
 * Uses Supabase SQL queries instead of frontend filtering
 */

import { useState, useEffect, useCallback } from 'react';
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

      // Build the query
      let query = supabase
        .from('trainings')
        .select('*')
        .eq('student_id', studentId);

      // Apply status filter
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      // Apply approval status filter
      if (approvalStatus && approvalStatus !== 'all') {
        query = query.eq('approval_status', approvalStatus);
      }

      // Apply search filter (title or organization)
      if (searchTerm && searchTerm.trim()) {
        const term = searchTerm.trim();
        query = query.or(`title.ilike.%${term}%,organization.ilike.%${term}%`);
      }

      // Apply sorting
      const validSortFields = ['title', 'organization', 'start_date', 'end_date', 'created_at', 'status'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
      query = query.order(sortField, { ascending: sortDirection === 'asc' });

      const { data, error: queryError } = await query;

      if (queryError) {
        console.error('❌ Error fetching trainings:', queryError);
        setError(queryError.message);
        setTrainings([]);
        return;
      }

      // Transform data to match UI expectations
      const formattedTrainings = (data || []).map((train) => ({
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
        source: String(train.source || ''),
        course_id: train.course_id,
        skills: [], // Skills are fetched separately in the original implementation
        certificateUrl: '', // Certificate URL fetched separately
        createdAt: train.created_at,
        updatedAt: train.updated_at,
      }));

      setTrainings(formattedTrainings);

      // Fetch stats separately (unfiltered counts)
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
      // Get total count
      const { count: totalCount, error: e1 } = await supabase
        .from('trainings')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .neq('approval_status', 'rejected');

      // Get completed count
      const { count: completedCount, error: e2 } = await supabase
        .from('trainings')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('status', 'completed')
        .neq('approval_status', 'rejected');

      // Get ongoing count
      const { count: ongoingCount, error: e3 } = await supabase
        .from('trainings')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('status', 'ongoing')
        .neq('approval_status', 'rejected');

      // Ensure we're setting numbers, not objects
      setStats({
        total: typeof totalCount === 'number' ? totalCount : 0,
        completed: typeof completedCount === 'number' ? completedCount : 0,
        ongoing: typeof ongoingCount === 'number' ? ongoingCount : 0,
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
