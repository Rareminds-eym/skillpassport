/**
 * Course Analytics Dashboard Widget - Prop Types
 *
 * The widget's public contract. Kept in `model/` per the widget-layer convention
 * in this codebase (see widgets/kpi-dashboard/model/types.ts).
 */

import type { CourseAnalyticsData } from '@/entities/course-analytics';

/** Roles that share this dashboard. The UI is identical for each. */
export type DashboardRole =
  | 'school_admin'
  | 'college_admin'
  | 'university_admin'
  | 'educator';

export interface CourseAnalyticsDashboardProps {
  /** All dashboard data, already scoped to the caller's role. */
  data: CourseAnalyticsData;
  /** Logged-in role. Currently unused by the widget itself; each page passes its own already-scoped `data`. */
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
  /**
   * Controlled Recursive Directory Tree selection, for pages that fetch a
   * real `get-learner-directory` result keyed by the selected node (id +
   * level: 'department' | 'academic-year' | 'section'). When omitted, the
   * widget falls back to fully-internal uncontrolled state (filtering
   * `data.learnerDirectory` client-side by Section only via
   * filterLearnersBySection, the original mock-only behavior) — so pages
   * that haven't been migrated yet are unaffected.
   */
  selectedSectionId?: string | null;
  onSelectedSectionChange?: (node: { id: string; level: string } | null) => void;
  /**
   * Controlled Course Performance Overview pagination (1-indexed), for pages
   * that fetch a real, paginated `get-course-performance` result. Pagination
   * STATE lives at the page level (like selectedCourseId/selectedSectionId),
   * not inside this widget — the widget only renders the current page's rows
   * and the Prev/Next control, and reports clicks upward via
   * `onCoursePerformancePageChange`. When omitted, the widget falls back to
   * fully-internal uncontrolled state (page 1 only, no pagination control —
   * the original mock-only behavior) so pages that haven't been migrated yet
   * are unaffected. `coursePerformanceTotalCount` (the full, pre-pagination
   * course count) drives the page-count math; ignored when uncontrolled.
   */
  coursePerformancePage?: number;
  onCoursePerformancePageChange?: (page: number) => void;
  coursePerformanceTotalCount?: number;
  /** The page size the caller's query used — needed for page-count math since the last page may have fewer rows. */
  coursePerformancePageSize?: number;
}
