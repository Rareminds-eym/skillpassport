import { useState, useEffect, useMemo } from 'react';
import { apiPost } from '@/shared/api/apiClient';
import { SkillsAnalyticsService } from '../api';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('useLearnerAnalytics');

interface UselearnerAnalyticsProps {
  userEmail: string | null;
}

interface UselearnerAnalyticsReturn {
  applications: any[];
  skillsData: any[];
  loading: boolean;
  analytics: {
    totalApplications: number;
    statusCounts: Record<string, number>;
    recentApplications: any[];
    applicationsByMonth: any[];
    topCompanies: any[];
    employmentTypes: Record<string, number>;
    locations: Record<string, number>;
  };
  fetchApplicationData: () => Promise<void>;
  fetchSkillsData: () => Promise<void>;
}

export const useLearnerAnalytics = ({ userEmail }: UselearnerAnalyticsProps): UselearnerAnalyticsReturn => {
  const [applications, setApplications] = useState<any[]>([]);
  const [skillsData, setSkillsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userEmail) {
      fetchApplicationData();
      fetchSkillsData();
    }
  }, [userEmail]);

  const fetchApplicationData = async () => {
    if (!userEmail) return;
    try {
      setLoading(true);
      const response: any = await apiPost('/analytics/data', { action: 'get-learner-analytics', userEmail });
      setApplications(response.data?.applications || []);
    } catch (error) {
      logger.error('Error in fetchApplicationData', error as Error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSkillsData = async () => {
    try {
      const data = await SkillsAnalyticsService.getSkillsDemandAnalysis();
      if (data && Array.isArray(data.topSkills) && data.topSkills.length > 0) {
        setSkillsData(data.topSkills);
      }
    } catch (error) {
      logger.error('Exception in fetchSkillsData', error as Error);
    }
  };

  const analytics = useMemo(() => {
    if (!applications.length) {
      return {
        totalApplications: 0, statusCounts: {}, recentApplications: [],
        applicationsByMonth: [], topCompanies: [], employmentTypes: {}, locations: {},
      };
    }

    const statusCounts: Record<string, number> = {};
    const employmentTypes: Record<string, number> = {};
    const locations: Record<string, number> = {};
    const companyCounts: Record<string, number> = {};
    const monthCounts: Record<string, number> = {};

    applications.forEach((app: any) => {
      const status = app.status || 'pending';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      const empType = app.opportunities?.employment_type || 'Unknown';
      employmentTypes[empType] = (employmentTypes[empType] || 0) + 1;
      const location = app.opportunities?.location || 'Unknown';
      locations[location] = (locations[location] || 0) + 1;
      const company = app.opportunities?.company_name || 'Unknown';
      companyCounts[company] = (companyCounts[company] || 0) + 1;
      if (app.applied_at) {
        const month = new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      }
    });

    const topCompanies = Object.entries(companyCounts)
      .sort(([, a], [, b]) => b - a).slice(0, 5)
      .map(([company, count]) => ({ company, count }));

    const applicationsByMonth = Object.entries(monthCounts)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    return {
      totalApplications: applications.length, statusCounts,
      recentApplications: applications.slice(0, 5), applicationsByMonth,
      topCompanies, employmentTypes, locations,
    };
  }, [applications]);

  return { applications, skillsData, loading, analytics, fetchApplicationData, fetchSkillsData };
};
