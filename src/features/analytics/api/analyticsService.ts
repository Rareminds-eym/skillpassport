import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('analytics-service');

export type FunnelRangePreset = '7d' | '30d' | '90d' | 'ytd' | 'custom';

export interface FunnelRange {
  startDate: string;
  endDate: string;
}

export interface RecruitmentFunnelStats {
  sourced: number;
  screened: number;
  interviewed: number;
  offered: number;
  hired: number;
  trendLabels: string[];
  hiresTrend: number[];
}

export interface AnalyticsKPIMetrics {
  totalCandidates: number;
  successfulHires: number;
  timeToHire: number;
  qualityScore: number;
  totalCandidatesTrend: number;
  successfulHiresTrend: number;
  timeToHireTrend: number;
  qualityScoreTrend: number;
}

export const buildDateRange = (preset: FunnelRangePreset, start?: string, end?: string): FunnelRange => {
  if (preset === 'custom' && start && end) return { startDate: start, endDate: end };
  const now = new Date();
  const endDate = now.toISOString();
  let startDate: string;
  if (preset === 'ytd') {
    startDate = new Date(now.getFullYear(), 0, 1).toISOString();
  } else {
    const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    startDate = d.toISOString();
  }
  return { startDate, endDate };
};

export const getRecruitmentFunnelStats = async (
  preset: FunnelRangePreset,
  start?: string,
  end?: string
): Promise<{ data: RecruitmentFunnelStats | null; error: any }> => {
  try {
    const response: any = await apiPost('/analytics/data', {
      action: 'get-funnel-stats',
      preset,
      startDate: start,
      endDate: end,
    });
    return { data: response.data, error: null };
  } catch (error) {
    logger.error('Error fetching recruitment funnel stats', error instanceof Error ? error : new Error(String(error)), { preset });
    return { data: null, error };
  }
};

export const getAnalyticsKPIMetrics = async (
  preset: FunnelRangePreset,
  start?: string,
  end?: string
): Promise<{ data: AnalyticsKPIMetrics | null; error: any }> => {
  try {
    const response: any = await apiPost('/analytics/data', {
      action: 'get-kpi-metrics',
      preset,
      startDate: start,
      endDate: end,
    });
    return { data: response.data, error: null };
  } catch (error) {
    logger.error('Error fetching analytics KPI metrics', error instanceof Error ? error : new Error(String(error)), { preset });
    return { data: null, error };
  }
};
