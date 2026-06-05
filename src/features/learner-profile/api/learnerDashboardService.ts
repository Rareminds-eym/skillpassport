/**
 * Learner Dashboard Service
 * 
 * Fetches dashboard data from backend API instead of direct Supabase calls
 */

import { ssoClient } from '@/shared/api/ssoClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('learner-dashboard-service');

// API base URL — same origin (Cloudflare Pages serves frontend + API)
const API_BASE_ORIGIN = typeof window !== 'undefined' ? window.location.origin : '';

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
    if (!API_BASE_ORIGIN) {
      logger.error('API base URL not available');
      return {
        success: false,
        error: 'API configuration error: Base URL not set'
      };
    }

    const url = new URL(`/api/learners/dashboard`, API_BASE_ORIGIN);

    logger.info('Fetching dashboard data', { url: url.toString() });

    // Use ssoClient.fetch to automatically include the Authorization header
    const response = await ssoClient.fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
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
