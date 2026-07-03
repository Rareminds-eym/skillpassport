/**
 * Course Analytics Dashboard — shared calculation logic.
 *
 * Shared by:
 *   - functions/api/college-admin/reports.ts ('skill-analytics' action)
 *   - functions/api/college-admin/course-analytics.ts ('get-kpis',
 *     'get-course-performance', and 'get-enrollment-overview' actions)
 * so every endpoint computes these values identically instead of maintaining
 * duplicate copies of the same business rules.
 *
 * KPI card business rules (confirmed):
 *   Total Learners     = count of learners belonging to the current organization.
 *   LMS Courses        = GLOBAL total count of all courses in the `courses`
 *                         table — platform-wide, NOT filtered by organization,
 *                         learner, or enrollment.
 *   Active Learners    = learners in the current organization with an
 *                         'active' or 'in_progress' enrollment (existing
 *                         course_enrollments.status).
 *   Completion Rate    = completed enrollments / total enrollments, for the
 *                         current organization's learners.
 *   Enrollment Growth  = % change between enrollments created this calendar
 *                         month vs last calendar month, for the current
 *                         organization's learners, via created_at.
 *
 * Course Performance Overview business rules (confirmed):
 *   Same grouped-by-course rows as Course Enrollment Overview below, plus
 *   rank/activeLearners/trend for the table. `activeLearners` reuses the same
 *   active/in_progress rule as the Active Learners KPI. `trend` has no
 *   historical data source (same constraint as Enrollment Growth), so it is
 *   a placeholder 'stable' for every course until real trend tracking exists.
 *
 * Course Enrollment Overview business rules (confirmed):
 *   Organization -> Learners -> Enrollments -> group by course_id -> lookup
 *   course name from the global `courses` table -> count enrollments per
 *   course -> completion rate per course -> sort by enrollment count ->
 *   top 6 courses. Organization-scoped (unlike the global LMS Courses KPI) —
 *   only the org's highest-enrollment courses are returned, never the whole
 *   catalog.
 *
 * Academic Status & Retention business rules (confirmed):
 *   Organization -> Learners -> Enrollments -> optional single-course filter
 *   -> every enrollment placed into exactly one of 4 mutually-exclusive
 *   buckets (Inactive/At Risk checked first, then Completed, then
 *   Registered/Not Started, else Actively Learning — see
 *   buildAcademicStatusOverview's doc comment for the full ordering and why).
 *   activeSet = sum of the 4 buckets = total enrollments in the current
 *   filter (never the mock's old hardcoded learner count). The course
 *   dropdown backing this card (buildCourseFilterOptions) is built from the
 *   same Organization -> Learners -> Enrollments -> DISTINCT course_id flow,
 *   never the whole `courses` catalog.
 *
 * No new tables, views, or migrations — derived entirely from learner,
 * enrollment, and course rows the caller has already fetched.
 */

export interface KpiSourceLearner {
  id: string;
}

export interface KpiSourceEnrollment {
  id: string;
  status: string | null;
  progress: number | null;
  course_id: string | null;
  learner_id: string | null;
  created_at: string | null;
  /** Optional: only required by buildAcademicStatusOverview's Inactive/At Risk bucket. */
  last_accessed?: string | null;
}

/** Matches the frontend's KpiMetric (entities/course-analytics/model/types.ts). */
export interface KpiMetric {
  id: string;
  title: string;
  value: string;
  trendLabel: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
  accent: 'blue' | 'green' | 'amber' | 'indigo' | 'rose';
}

/** Statuses counted as "active" for the Active Learners KPI. */
const ACTIVE_ENROLLMENT_STATUSES = new Set(['active', 'in_progress']);

/** Safe percentage change, avoiding division by zero. */
function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function formatSignedPercent(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded >= 0 ? '+' : ''}${rounded}%`;
}

function trendFromValue(value: number): KpiMetric['trend'] {
  if (value > 0) return 'up';
  if (value < 0) return 'down';
  return 'neutral';
}

export function buildCourseAnalyticsKpis(
  learners: KpiSourceLearner[],
  enrollments: KpiSourceEnrollment[],
  /**
   * Global count of all rows in `courses` — platform-wide, unfiltered by
   * organization/learner/enrollment. The `courses` table has no
   * college_id/school_id/university_id column, and per the confirmed
   * business rule this KPI is explicitly NOT organization-scoped, so the
   * caller passes a single unfiltered `count(*)` result here.
   */
  totalCoursesGlobal: number,
): KpiMetric[] {
  const totalLearners = learners.length;
  const totalEnrollments = enrollments.length;

  const activeLearnerIds = new Set(
    enrollments
      .filter((e) => e.status && ACTIVE_ENROLLMENT_STATUSES.has(e.status))
      .map((e) => e.learner_id)
      .filter((id): id is string => Boolean(id)),
  );
  const activeLearnersCount = activeLearnerIds.size;
  const activeLearnersPct = totalLearners > 0
    ? Math.round((activeLearnersCount / totalLearners) * 100)
    : 0;

  const completedCount = enrollments.filter((e) => e.status === 'completed').length;
  const completionRate = totalEnrollments > 0
    ? Math.round((completedCount / totalEnrollments) * 100)
    : 0;

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  let currentMonthCount = 0;
  let previousMonthCount = 0;
  for (const e of enrollments) {
    if (!e.created_at) continue;
    const createdAt = new Date(e.created_at);
    if (createdAt >= currentMonthStart) {
      currentMonthCount += 1;
    } else if (createdAt >= previousMonthStart && createdAt < currentMonthStart) {
      previousMonthCount += 1;
    }
  }
  const enrollmentGrowth = percentChange(currentMonthCount, previousMonthCount);

  return [
    {
      id: 'total-learners',
      title: 'Total Learners',
      value: totalLearners.toLocaleString('en-US'),
      trendLabel: 'Total enrolled learners',
      trend: 'neutral',
      icon: 'users',
      accent: 'blue',
    },
    {
      id: 'lms-courses',
      title: 'LMS Courses',
      value: totalCoursesGlobal.toLocaleString('en-US'),
      trendLabel: 'Total courses on the platform',
      trend: 'neutral',
      icon: 'book',
      accent: 'green',
    },
    {
      id: 'active-learners',
      title: 'Active Learners',
      value: activeLearnersCount.toLocaleString('en-US'),
      trendLabel: `${activeLearnersPct}% of total learners active`,
      trend: 'neutral',
      icon: 'activity',
      accent: 'amber',
    },
    {
      id: 'enrollment-growth',
      title: 'Enrollment Growth',
      value: formatSignedPercent(enrollmentGrowth),
      trendLabel: `${currentMonthCount} enrollments this month vs ${previousMonthCount} last month`,
      trend: trendFromValue(enrollmentGrowth),
      icon: 'trending-up',
      accent: 'indigo',
    },
    {
      id: 'completion-rate',
      title: 'Completion Rate',
      value: `${completionRate}%`,
      trendLabel: `${completedCount} of ${totalEnrollments} enrollments completed`,
      trend: 'neutral',
      icon: 'award',
      accent: 'rose',
    },
  ];
}

export interface KpiSourceCourse {
  course_id: string;
  title: string | null;
  category: string | null;
}

/** Matches the frontend's CoursePerformanceRow (entities/course-analytics/model/types.ts). */
export interface CoursePerformanceRow {
  id: string;
  rank: number;
  name: string;
  category: string;
  learners: number;
  activeLearners: number;
  completion: number;
  trend: 'upward' | 'stable' | 'audit_risk';
}

interface CourseGroup {
  learnerIds: Set<string>;
  activeLearnerIds: Set<string>;
  completed: number;
  total: number;
}

interface GroupedCourseRow {
  courseId: string;
  name: string;
  category: string;
  learners: number;
  activeLearners: number;
  completion: number;
  enrollmentCount: number;
}

/**
 * Shared grouping step used by both the Course Performance Overview table and
 * the Course Enrollment Overview chart: Organization -> Learners ->
 * Enrollments -> group by course_id -> count learners -> completion rate ->
 * sort by enrollment count -> top N. Extracted so neither caller duplicates
 * this loop.
 */
function groupEnrollmentsByCourse(
  enrollments: KpiSourceEnrollment[],
  courses: KpiSourceCourse[],
  topN: number,
): GroupedCourseRow[] {
  const courseById = new Map(courses.map((c) => [c.course_id, c]));

  const byCourse = new Map<string, CourseGroup>();

  for (const e of enrollments) {
    if (!e.course_id) continue;
    let group = byCourse.get(e.course_id);
    if (!group) {
      group = { learnerIds: new Set(), activeLearnerIds: new Set(), completed: 0, total: 0 };
      byCourse.set(e.course_id, group);
    }
    group.total += 1;
    if (e.learner_id) group.learnerIds.add(e.learner_id);
    if (e.status === 'completed') group.completed += 1;
    if (e.learner_id && e.status && ACTIVE_ENROLLMENT_STATUSES.has(e.status)) {
      group.activeLearnerIds.add(e.learner_id);
    }
  }

  return Array.from(byCourse.entries())
    .map(([courseId, group]) => {
      const course = courseById.get(courseId);
      return {
        courseId,
        name: course?.title || 'Untitled Course',
        category: course?.category || 'General',
        learners: group.learnerIds.size,
        activeLearners: group.activeLearnerIds.size,
        completion: group.total > 0 ? Math.round((group.completed / group.total) * 100) : 0,
        enrollmentCount: group.total,
      };
    })
    // Sort by enrollment count (descending), then take the top N.
    .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
    .slice(0, topN);
}

/**
 * Course Performance Overview rows: top N courses by enrollment count (see
 * groupEnrollmentsByCourse above for the shared flow).
 *
 * `activeLearners` reuses the same active/in_progress rule as the Active
 * Learners KPI (ACTIVE_ENROLLMENT_STATUSES above). `trend` has no historical
 * data source (same constraint as Enrollment Growth) so every row is
 * 'stable' until real trend tracking exists.
 */
export function buildCoursePerformanceRows(
  enrollments: KpiSourceEnrollment[],
  courses: KpiSourceCourse[],
  topN = 6,
): CoursePerformanceRow[] {
  const rows = groupEnrollmentsByCourse(enrollments, courses, topN);

  return rows.map((row, index) => ({
    id: row.courseId,
    rank: index + 1,
    name: row.name,
    category: row.category,
    learners: row.learners,
    activeLearners: row.activeLearners,
    completion: row.completion,
    trend: 'stable',
  }));
}

/** Matches the frontend's EnrollmentDatum (entities/course-analytics/model/types.ts). */
export interface EnrollmentDatum {
  label: string;
  totalLearners: number;
  completionRate: number;
}

/**
 * Course Enrollment Overview chart data: top N courses by enrollment count
 * for the current organization (see groupEnrollmentsByCourse above for the
 * shared flow). `totalLearners` = organization learners enrolled in that
 * course; `completionRate` = % completed for that course. Course names are
 * resolved from the global `courses` table, but only the organization's
 * top-enrolled courses are included — the global catalog is never returned
 * wholesale.
 */
export function buildEnrollmentOverview(
  enrollments: KpiSourceEnrollment[],
  courses: KpiSourceCourse[],
  topN = 6,
): EnrollmentDatum[] {
  const rows = groupEnrollmentsByCourse(enrollments, courses, topN);

  return rows.map((row) => ({
    label: row.name,
    totalLearners: row.learners,
    completionRate: row.completion,
  }));
}

/** Matches the frontend's LearnerStatusSegment (entities/course-analytics/model/types.ts). */
export interface LearnerStatusSegment {
  id: string;
  label: string;
  description: string;
  count: number;
  percentage: number;
  icon: string;
  tone: 'success' | 'info' | 'warning' | 'danger';
  color: string;
}

/** Matches the frontend's AcademicStatusOverview (entities/course-analytics/model/types.ts). */
export interface AcademicStatusOverview {
  activeSet: number;
  activeLearningIndex: number;
  segments: LearnerStatusSegment[];
}

const INACTIVE_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Academic Status & Retention business rules (confirmed):
 *
 * Every enrollment belongs to EXACTLY one of the 4 buckets below, evaluated
 * in this order (first match wins) so the buckets always partition the
 * filtered enrollment set — activeSet (the donut center) is simply their sum:
 *
 *   1. Inactive / At Risk    — last_accessed is missing or older than 30
 *                               days. Checked FIRST: a stalled 'in_progress'
 *                               enrollment is exactly what this bucket exists
 *                               to surface, so inactivity overrides status.
 *   2. Completed Curriculum  — status === 'completed' (same rule as the
 *                               Completion Rate KPI / Course Performance).
 *   3. Registered/Not Started— progress is 0 or null (enrolled, untouched).
 *   4. Actively Learning     — everything else (status active/in_progress
 *                               with real progress, accessed within 30 days).
 *
 * Active Learning Index = (Completed + Actively Learning) / activeSet * 100
 * — the simplest formula matching the UI's existing "Combined complete &
 * current activities" copy; no other formula exists anywhere in this codebase.
 */
export function buildAcademicStatusOverview(
  enrollments: KpiSourceEnrollment[],
): AcademicStatusOverview {
  const now = Date.now();

  let completed = 0;
  let activelyLearning = 0;
  let registeredNotStarted = 0;
  let inactiveAtRisk = 0;

  for (const e of enrollments) {
    const lastAccessedMs = e.last_accessed ? new Date(e.last_accessed).getTime() : NaN;
    const isStale = !e.last_accessed || Number.isNaN(lastAccessedMs) || (now - lastAccessedMs) > INACTIVE_THRESHOLD_MS;

    if (isStale) {
      inactiveAtRisk += 1;
    } else if (e.status === 'completed') {
      completed += 1;
    } else if (!e.progress || e.progress <= 0) {
      registeredNotStarted += 1;
    } else {
      activelyLearning += 1;
    }
  }

  const activeSet = completed + activelyLearning + registeredNotStarted + inactiveAtRisk;
  const pct = (count: number) => (activeSet > 0 ? Math.round((count / activeSet) * 100) : 0);
  const activeLearningIndex = activeSet > 0
    ? Math.round(((completed + activelyLearning) / activeSet) * 100)
    : 0;

  const segments: LearnerStatusSegment[] = [
    {
      id: 'completed-curriculum',
      label: 'Completed Curriculum',
      description: 'Awarded certificates',
      count: completed,
      percentage: pct(completed),
      icon: 'check-circle',
      tone: 'success',
      color: '#22c55e',
    },
    {
      id: 'actively-learning',
      label: 'Actively Learning',
      description: 'Engaged in modules',
      count: activelyLearning,
      percentage: pct(activelyLearning),
      icon: 'play-circle',
      tone: 'info',
      color: '#3b82f6',
    },
    {
      id: 'registered-not-started',
      label: 'Registered / Not Started',
      description: 'Awaiting onboarding',
      count: registeredNotStarted,
      percentage: pct(registeredNotStarted),
      icon: 'help-circle',
      tone: 'warning',
      color: '#f59e0b',
    },
    {
      id: 'inactive-at-risk',
      label: 'Inactive / At Risk',
      description: 'No login in 30 days',
      count: inactiveAtRisk,
      percentage: pct(inactiveAtRisk),
      icon: 'alert-triangle',
      tone: 'danger',
      color: '#ef4444',
    },
  ];

  return { activeSet, activeLearningIndex, segments };
}

/** Matches the frontend's FilterOption (entities/course-analytics/model/types.ts). */
export interface CourseFilterOption {
  value: string;
  label: string;
}

/**
 * Course dropdown options for the Academic Status card: DISTINCT courses the
 * organization's (scoped) learners are actually enrolled in, never the whole
 * `courses` catalog. "All Courses" is prepended by the caller's UI layer, not
 * here, since it's a UI convention rather than a derived data point.
 */
export function buildCourseFilterOptions(courses: KpiSourceCourse[]): CourseFilterOption[] {
  return courses
    .map((c) => ({ value: c.course_id, label: c.title || 'Untitled Course' }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
