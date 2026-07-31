/**
 * Course Analytics Dashboard Widget - Public API
 *
 * A reusable analytics dashboard shared by School / College / University Admin and
 * Educator roles. Consumes a typed `CourseAnalyticsData` payload (currently mock)
 * so a future per-role backend can be wired in without UI changes.
 */

export { CourseAnalyticsDashboard } from './ui/CourseAnalyticsDashboard';
export type {
  CourseAnalyticsDashboardProps,
  DashboardRole,
} from './model/types';
