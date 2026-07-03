/**
 * Course Analytics Entity - Domain Types
 *
 * Type definitions for the Course Analytics Dashboard, shared across School Admin,
 * College Admin, University Admin, and Educator roles. The UI is identical for
 * every role; only the data source will differ once a backend exists. These types
 * describe that (currently mock) data so a future service can be dropped in with
 * no UI changes.
 */

/** Direction of a trend indicator shown on cards and table rows. */
export type TrendDirection = 'up' | 'down' | 'neutral';

/** Lifecycle status of a learner within a course. */
export type LearnerStatus = 'completed' | 'in_progress' | 'not_started';

/** Performance trend classification for a course row. */
export type CourseTrend = 'upward' | 'stable' | 'audit_risk';

/**
 * A single KPI summary card (Total Learners, LMS Courses, etc.).
 *
 * `icon` is a string key resolved to a concrete icon component in the UI layer,
 * keeping the data layer free of React/JSX dependencies.
 */
export interface KpiMetric {
  id: string;
  title: string;
  value: string;
  /** Pre-formatted trend text, e.g. "12.4% vs last period". */
  trendLabel: string;
  trend: TrendDirection;
  /** Icon key resolved by the UI layer (see kpiIconMap). */
  icon: string;
  /** Color token for the icon chip accent. */
  accent: 'blue' | 'green' | 'amber' | 'indigo' | 'rose';
}

/** One bar in the Course Enrollment Overview chart. */
export interface EnrollmentDatum {
  /** Short axis label, e.g. "Python". */
  label: string;
  /** Total learners enrolled (light background bar). */
  totalLearners: number;
  /** Completion rate percentage 0-100 (solid foreground bar). */
  completionRate: number;
}

/** A single row in the Learner Status Distribution breakdown. */
export interface LearnerStatusSegment {
  id: string;
  label: string;
  /** Supporting description shown under the label. */
  description: string;
  count: number;
  /** Share of the active set, 0-100, pre-computed for display. */
  percentage: number;
  /** Icon key resolved by the UI layer. */
  icon: string;
  /** Semantic tone driving icon and badge colors. */
  tone: 'success' | 'info' | 'warning' | 'danger';
  /** Donut segment color (hex) for the chart series. */
  color: string;
}

/** Aggregated academic status used by the donut card. */
export interface AcademicStatusOverview {
  /** Center value of the donut (total active set). */
  activeSet: number;
  /** Combined completion + activity index, 0-100. */
  activeLearningIndex: number;
  segments: LearnerStatusSegment[];
}

/**
 * Per-course academic status overviews, keyed by the course filter's
 * {@link FilterOption.value} (the same `option.value` used in the course
 * `FilterDefinition`). The `"all"` key holds the aggregate across every course.
 *
 * Reuses {@link AcademicStatusOverview} as-is — one instance per course instead
 * of a separate type — so selecting a course is a lookup, not a reshape. A real
 * backend would return exactly this shape (or a single overview per request) and
 * the widget's lookup logic would be unchanged.
 */
export type AcademicStatusByCourse = Record<string, AcademicStatusOverview>;

/** One row in the Course Performance Overview table. */
export interface CoursePerformanceRow {
  id: string;
  rank: number;
  name: string;
  /** e.g. "Computer Science • LMS Program". */
  category: string;
  learners: number;
  activeLearners: number;
  /** Completion percentage 0-100. */
  completion: number;
  trend: CourseTrend;
}

/**
 * A node in the recursive directory tree used to navigate to a Section.
 *
 * The structure is intentionally generic (recursive children + an open `level`
 * string) so future hierarchies need only different data, not new types:
 *   College:    department → academic-year → section
 *   School:     grade → section
 *   University: faculty → department → program → academic-year → section
 *
 * Only nodes with `selectable: true` (sections) drive the Learner Directory;
 * all other levels are pure navigation.
 */
export interface DirectoryNode {
  id: string;
  label: string;
  /** Semantic level, e.g. 'department' | 'academic-year' | 'section'. */
  level: string;
  /** Icon key resolved by the UI layer (see directoryIconMap). */
  icon?: string;
  /** Group heading shown above the children, e.g. "Academic Years". */
  childrenLabel?: string;
  /** True for leaf Section nodes — selecting one filters the Learner Directory. */
  selectable?: boolean;
  /**
   * Backend-computed learner count for this node (leaf: its own learners;
   * branch: sum of descendants). Optional and currently unused by the UI —
   * `DirectoryTreePanel` still derives displayed counts from
   * `learnerDirectory` via `buildLearnerCountByNode` (see lib/directory.ts),
   * since that section's real backend doesn't exist yet. Present here so the
   * backend response is self-describing/forward-compatible without forcing
   * a UI change in this step.
   */
  count?: number;
  children?: DirectoryNode[];
}

/** One row in the Learner Directory table. */
export interface LearnerDirectoryRow {
  id: string;
  name: string;
  email: string;
  /** The Section (selectable DirectoryNode id) this learner belongs to. */
  sectionId: string;
  /** Enrolled course code chip, e.g. "PYTHON-DATA". */
  courseCode: string;
  /** Progress percentage 0-100. */
  progress: number;
  /** Hours spent, shown alongside the progress bar. */
  hours: number;
  status: LearnerStatus;
  /** Pre-formatted last-active date, e.g. "Jun 25, 2026". */
  lastActive: string;
  lastCourseLearned: string;
}

/** A selectable option for the (non-functional) filter dropdowns. */
export interface FilterOption {
  value: string;
  label: string;
}

/** Definition of a single filter control in the filter panel. */
export interface FilterDefinition {
  id: string;
  label: string;
  options: FilterOption[];
}

/**
 * Complete data payload for the Course Analytics Dashboard.
 *
 * A future backend will return this shape (per role) instead of the static mock,
 * so the widget consumes one typed prop and needs no rewrite.
 */
export interface CourseAnalyticsData {
  kpis: KpiMetric[];
  enrollment: EnrollmentDatum[];
  /**
   * Academic status overview per course (see {@link AcademicStatusByCourse}).
   * The widget looks up the entry for the currently selected course filter
   * (defaulting to `"all"`) as the single source of truth for what the
   * Academic Status card renders — this is exactly how a real API endpoint
   * scoped by `?course=<id>` would be consumed.
   */
  academicStatusByCourse: AcademicStatusByCourse;
  coursePerformance: CoursePerformanceRow[];
  learnerDirectory: LearnerDirectoryRow[];
  /**
   * Recursive navigation tree (departments → years → sections for College).
   * Selecting a Section filters `learnerDirectory` by `sectionId`.
   */
  directoryTree: DirectoryNode[];
  /** Total records matching current (future) filters, for the count label. */
  totalLearnerRecords: number;
  filters: FilterDefinition[];
}
