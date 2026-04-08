// API exports
export * from './api';

// Model exports
export { useAnalytics } from './model/useAnalytics';
export { useAnalyticsKPIs } from './model/useAnalyticsKPIs';
export { useSpeedAnalytics } from './model/useSpeedAnalytics';
export { useStudentAnalytics } from './model';

// UI exports
export { default as KPICard } from './ui/KPICard';

// Lib exports
export * from './lib';

export { getDashboardData } from './api/dashboardService';

export type { FunnelRangePreset } from './api/analyticsService';

export { getRecentActivity } from './api/dashboardService';

export { default as SkillsAnalyticsService } from './api/skillsAnalyticsService';

export { default as usageStatisticsService } from './api/usageStatisticsService';
