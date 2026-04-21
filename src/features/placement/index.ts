// Public API for placement feature
export { 
  PlacementManagement,
  CompanyRegistration,
  JobPostings,
  ApplicationTracking,
  PlacementAnalytics
} from './ui';

export { 
  placementAnalyticsService,
  type PlacementRecord,
  type DepartmentAnalytics,
  type PlacementStats
} from './api';

// API & Data Access
export * from './api';
