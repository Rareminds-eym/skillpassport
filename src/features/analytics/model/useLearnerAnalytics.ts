import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/shared/api';
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
      
      // Get learner ID from email
      const { data: learner, error: learnerError } = await supabase
        .from('learners')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();

      if (learnerError) {
        logger.error('Error fetching learner', learnerError);
        return;
      }

      if (!learner) {
        logger.error('Learner not found');
        return;
      }

      // Fetch applied jobs with opportunity details
      const { data: appliedJobs, error: jobsError } = await supabase
        .from('applied_jobs')
        .select(`
          *,
          opportunities!fk_applied_jobs_opportunity (
            id,
            job_title,
            title,
            company_name,
            employment_type,
            location,
            salary_range_min,
            salary_range_max,
            mode
          )
        `)
        .eq('learner_id', learner.id)
        .order('applied_at', { ascending: false });

      if (jobsError) {
        logger.error('Error fetching applications', jobsError);
        return;
      }

      setApplications(appliedJobs || []);
    } catch (error) {
      logger.error('Error in fetchApplicationData', error as Error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSkillsData = async () => {
    try {
      const data = await SkillsAnalyticsService.analyzeSkillsDemand();
      
      if (data && Array.isArray(data) && data.length > 0) {
        setSkillsData(data);
      }
    } catch (error) {
      logger.error('Exception in fetchSkillsData', error as Error);
    }
  };

  // Calculate analytics data
  const analytics = useMemo(() => {
    if (!applications.length) {
      return {
        totalApplications: 0,
        statusCounts: {},
        recentApplications: [],
        applicationsByMonth: [],
        topCompanies: [],
        employmentTypes: {},
        locations: {},
      };
    }

    const statusCounts: Record<string, number> = {};
    const employmentTypes: Record<string, number> = {};
    const locations: Record<string, number> = {};
    const companyCounts: Record<string, number> = {};
    const monthCounts: Record<string, number> = {};

    applications.forEach(app => {
      // Status counts
      const status = app.status || 'pending';
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      // Employment types
      const empType = app.opportunities?.employment_type || 'Unknown';
      employmentTypes[empType] = (employmentTypes[empType] || 0) + 1;

      // Locations
      const location = app.opportunities?.location || 'Unknown';
      locations[location] = (locations[location] || 0) + 1;

      // Company counts
      const company = app.opportunities?.company_name || 'Unknown';
      companyCounts[company] = (companyCounts[company] || 0) + 1;

      // Month counts
      if (app.applied_at) {
        const month = new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      }
    });

    // Top companies
    const topCompanies = Object.entries(companyCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([company, count]) => ({ company, count }));

    // Applications by month
    const applicationsByMonth = Object.entries(monthCounts)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    return {
      totalApplications: applications.length,
      statusCounts,
      recentApplications: applications.slice(0, 5),
      applicationsByMonth,
      topCompanies,
      employmentTypes,
      locations,
    };
  }, [applications]);

  return {
    applications,
    skillsData,
    loading,
    analytics,
    fetchApplicationData,
    fetchSkillsData,
  };
};
