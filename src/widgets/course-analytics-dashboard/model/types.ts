/**
 * Course Analytics Dashboard Widget - Prop Types
 *
 * The widget's public contract. Kept in `model/` per the widget-layer convention
 * in this codebase (see widgets/kpi-dashboard/model/types.ts).
 */

import type { CourseAnalyticsData } from '@/entities/course-analytics';

/**
 * Roles that share this dashboard. The UI is identical for each; the value is
 * accepted now so a future data source can be selected by role without changing
 * the widget's signature.
 */
export type DashboardRole =
  | 'school_admin'
  | 'college_admin'
  | 'university_admin'
  | 'educator';

export interface CourseAnalyticsDashboardProps {
  /** All dashboard data. Currently mock; later a role-scoped fetch result. */
  data: CourseAnalyticsData;
  /** Logged-in role (reserved for future per-role data selection / labels). */
  role?: DashboardRole;
  /** Shows loading skeletons instead of content. */
  loading?: boolean;
  className?: string;
  /**
   * Controlled Academic Status course selection, for pages that fetch real
   * `get-academic-status` data keyed by the selected course. When omitted,
   * the widget falls back to fully-internal uncontrolled state (looking the
   * selection up in `data.academicStatusByCourse`, the original mock-only
   * behavior) — so pages that haven't been migrated yet are unaffected.
   */
  selectedCourseId?: string;
  onSelectedCourseIdChange?: (courseId: string) => void;
  /**
   * True while the page's 'get-academic-status' query is refetching for a
   * newly-selected course (e.g. React Query's `isFetching`). Dims the
   * Academic Status card instead of swapping in stale/mock data — see
   * AcademicStatusCard's `isFetching` prop.
   */
  academicStatusFetching?: boolean;
}
