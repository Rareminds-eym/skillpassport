/**
 * Learner Dashboard Hook
 * 
 * Fetches all dashboard data from backend API using user_id from JWT
 * No email parameter needed - backend uses authenticated user's ID
 */

import { useState, useEffect, useCallback } from 'react';
import { getLearnerDashboardData, type DashboardData } from '../api/learnerDashboardService';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('use-learner-dashboard');

export interface UseLearnerDashboardOptions {
  enabled?: boolean;
}

export const useLearnerDashboard = ({ enabled = true }: UseLearnerDashboardOptions = {}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await getLearnerDashboardData();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch dashboard data');
      }
    } catch (err: any) {
      logger.error('Error fetching dashboard data', err);
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, [enabled]); // Removed 'email' from dependencies since it's not used

  // Trigger refresh
  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Load data on mount and when dependencies change
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, refreshKey]);

  return {
    // Profile data
    profile: data?.profile || null,
    
    // Related data
    education: data?.education || [],
    experience: data?.experience || [],
    skills: data?.skills || { technical: [], soft: [], all: [] },
    technicalSkills: data?.skills?.technical || [],
    softSkills: data?.skills?.soft || [],
    projects: data?.projects || [],
    certificates: data?.certificates || [],
    training: data?.training || [],
    opportunities: data?.opportunities || [],
    
    // State
    loading,
    error,
    
    // Actions
    refresh,
    
    // Raw data
    data
  };
};
