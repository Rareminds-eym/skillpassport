import { apiPost } from '@/shared/api/apiClient';
import { useAuthStore } from '@/shared/model/authStore';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('usage-statistics');

export const getUserUsageStatistics = async () => {
  try {
    const user = useAuthStore.getState().user;
    if (!user) return { success: false, data: null, error: 'User not authenticated' };

    const response: any = await apiPost('/analytics/data', {
      action: 'get-usage-stats',
      userId: user.id,
    });

    return { success: true, data: response.data, error: null };
  } catch (error: any) {
    logger.error('Error fetching usage statistics', error);
    return { success: false, data: null, error: error.message };
  }
};

export const getSubscriptionLimits = (planData: any) => {
  const defaultLimits = { assessments: 50, profileViews: 1000, reports: 20 };
  if (!planData) return defaultLimits;
  return {
    assessments: parseInt(planData.limits?.assessments || planData.features?.find((f: string) => f.includes('assessment'))?.match(/\d+/)?.[0] || defaultLimits.assessments, 10),
    profileViews: parseInt(planData.limits?.profileViews || planData.features?.find((f: string) => f.includes('view'))?.match(/\d+/)?.[0] || defaultLimits.profileViews, 10),
    reports: parseInt(planData.limits?.reports || planData.features?.find((f: string) => f.includes('report'))?.match(/\d+/)?.[0] || defaultLimits.reports, 10),
  };
};

export const combineUsageWithLimits = (usageData: any, limits: any) => ({
  assessments: { used: usageData.assessments?.used || 0, total: limits.assessments || 50, label: usageData.assessments?.label || 'Skill Assessments' },
  profileViews: { used: usageData.profileViews?.used || 0, total: limits.profileViews || 1000, label: usageData.profileViews?.label || 'Profile Views' },
  reports: { used: usageData.reports?.used || 0, total: limits.reports || 20, label: usageData.reports?.label || 'Reports Generated' },
});

export default { getUserUsageStatistics, getSubscriptionLimits, combineUsageWithLimits };
