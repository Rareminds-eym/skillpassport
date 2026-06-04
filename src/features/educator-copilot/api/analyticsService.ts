import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('analytics-service');

export type FunnelRangePreset = '7d' | '30d' | '90d' | 'ytd' | 'custom';

export interface GeographicLocation {
  city: string;
  count: number;
  percentage: number;
}

export interface TopHiringCollege {
  name: string;
  count: number;
  percentage: number;
}

export interface QualityMetrics {
  totalHired: number;
  avgAiScore: number;
  avgCgpa: number;
  genderDiversity: {
    male: number;
    female: number; other: number;
    malePercent: number; femalePercent: number; otherPercent: number;
  };
  ageDemographics: { averageAge: number; ageRanges: { range: string; count: number; percentage: number }[] };
  topCourses: { name: string; count: number; percentage: number }[];
}

export const buildDateRange = (preset: FunnelRangePreset, start?: string, end?: string) => {
  if (preset === 'custom' && start && end) return { startDate: start, endDate: end };
  const now = new Date();
  const endDate = now.toISOString();
  let startDate: string;
  if (preset === 'ytd') { const ytd = new Date(now.getFullYear(), 0, 1); startDate = ytd.toISOString(); }
  else { const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90; const d = new Date(now); d.setDate(d.getDate() - days); startDate = d.toISOString(); }
  return { startDate, endDate };
};

export const getGeographicDistribution = async (
  preset: FunnelRangePreset, start?: string, end?: string, limit: number = 4
): Promise<{ data: GeographicLocation[] | null; error: any }> => {
  try {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'getGeographicDistribution',
      preset, start, end, limit,
    });
    return { data: result?.data || null, error: null };
  } catch (error) {
    logger.error('Geographic distribution fetch failed', error instanceof Error ? error : new Error(String(error)), { preset });
    return { data: null, error };
  }
};

export const getTopHiringColleges = async (
  preset: FunnelRangePreset, start?: string, end?: string, limit: number = 4
): Promise<{ data: TopHiringCollege[] | null; error: any }> => {
  try {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'getTopHiringColleges',
      preset, start, end, limit,
    });
    return { data: result?.data || null, error: null };
  } catch (error) {
    logger.error('Top hiring colleges fetch failed', error instanceof Error ? error : new Error(String(error)), { preset });
    return { data: null, error };
  }
};

export const getQualityMetrics = async (
  preset: FunnelRangePreset, start?: string, end?: string
): Promise<{ data: QualityMetrics | null; error: any }> => {
  try {
    const result: any = await apiPost('/educator-copilot/actions', {
      action: 'getQualityMetrics',
      preset, start, end,
    });
    return { data: result?.data || null, error: null };
  } catch (error) {
    logger.error('Quality metrics fetch failed', error instanceof Error ? error : new Error(String(error)), { preset });
    return { data: null, error };
  }
};
