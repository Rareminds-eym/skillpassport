/**
 * Learner Dashboard Service
 * 
 * Fetches dashboard data from backend API instead of direct Supabase calls
 */

import { getLogger } from '@/shared/config/logging';

const logger = getLogger('learner-dashboard-service');

// Get API base URL from environment, fallback to current origin
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl;
  }
  // Fallback to current origin (same domain)
  return typeof window !== 'undefined' ? window.location.origin : '';
};

export interface DashboardData {
  profile: any;
  education: any[];
  experience: any[];
  skills: {
    technical: any[];
    soft: any[];
    all: any[];
  };
  projects: any[];
  certificates: any[];
  training: any[];
  opportunities: any[];
}

/**
 * Fetch complete dashboard data for a learner
 * Uses user_id from JWT token (no email parameter needed)
 * @returns Dashboard data including profile, education, experience, skills, etc.
 */
export async function getLearnerDashboardData(): Promise<{
  success: boolean;
  data?: DashboardData;
  error?: string;
}> {
  try {
    const apiBaseUrl = getApiBaseUrl();
    
    if (!apiBaseUrl) {
      logger.error('API_BASE_URL is not configured');
      return {
        success: false,
        error: 'API configuration error: Base URL not set'
      };
    }

    // Build URL - no email parameter needed, backend uses user_id from JWT
    const url = new URL(`/api/learners/dashboard`, apiBaseUrl);

    logger.info('Fetching dashboard data', { url: url.toString() });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for SSO authentication
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error('Dashboard API error', {
        status: response.status,
        error: errorData
      });
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const result = await response.json();
    logger.info('Dashboard data fetched successfully');

    return {
      success: true,
      data: result.data || result
    };
  } catch (error) {
    logger.error('Failed to fetch dashboard data', error as Error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
