/**
 * Course Analytics Entity - Mock Data Factory
 *
 * Builds a full {@link CourseAnalyticsData} payload from a role-specific
 * directory tree + learner list, reusing one shared set of KPI/enrollment/
 * academic-status/course-performance/filter fixtures. Per the shared-UI
 * requirement ("the UI should remain identical across all roles — only the
 * hierarchy and mock data change"), only `directoryTree` and
 * `learnerDirectory` genuinely differ per role; everything else is shared so
 * there is exactly one definition of each analytics fixture, not four copies.
 *
 * IMPORTANT: Temporary stand-in. When the backend exists, a role-scoped fetch
 * will return this same shape per role and this factory (and its callers in
 * mockData.ts / mockDataSchool.ts / etc.) can be deleted without touching any
 * UI component.
 */

import type { CourseAnalyticsData, DirectoryNode, LearnerDirectoryRow } from './types';

/** KPI summary cards across the top of the dashboard (shared fixture). */
const kpis: CourseAnalyticsData['kpis'] = [
  {
    id: 'total-learners',
    title: 'Total Learners',
    value: '3,750',
    trendLabel: '12.4% vs last period',
    trend: 'up',
    icon: 'users',
    accent: 'blue',
  },
  {
    id: 'lms-courses',
    title: 'LMS Courses',
    value: '6',
    trendLabel: '4 new this quarter',
    trend: 'up',
    icon: 'book',
    accent: 'green',
  },
  {
    id: 'active-learners',
    title: 'Active Learners',
    value: '3,308',
    trendLabel: '88% of total learners active',
    trend: 'neutral',
    icon: 'activity',
    accent: 'amber',
  },
  {
    id: 'enrollment-growth',
    title: 'Enrollment Growth',
    value: '+12.4%',
    trendLabel: '4.3% vs last month',
    trend: 'up',
    icon: 'trending-up',
    accent: 'indigo',
  },
  {
    id: 'completion-rate',
    title: 'Completion Rate',
    value: '67%',
    trendLabel: '1.5% vs last period',
    trend: 'up',
    icon: 'award',
    accent: 'rose',
  },
];

/** Bars for the Course Enrollment Overview chart (shared fixture). */
// Total Learners is always >= Completion Rate (completion can't exceed
// enrollment), so the dark Completion column nests inside the light Total column.
const enrollment: CourseAnalyticsData['enrollment'] = [
  { label: 'Python', totalLearners: 52, completionRate: 45 },
  { label: 'Data Sci', totalLearners: 46, completionRate: 34 },
  { label: 'UI/UX', totalLearners: 44, completionRate: 34 },
  { label: 'Cloud K8s', totalLearners: 42, completionRate: 28 },
  { label: 'Fullstack', totalLearners: 40, completionRate: 33 },
  { label: 'Exec Lead', totalLearners: 40, completionRate: 33 },
];

/**
 * Donut + status breakdown for the Learner Status Distribution card, one entry
 * per course filter option plus `"all"` for the aggregate (shared fixture —
 * course filtering is not wired to role, so this stays constant across roles).
 */
const academicStatusByCourse: CourseAnalyticsData['academicStatusByCourse'] = {
  all: {
    activeSet: 3750,
    activeLearningIndex: 84,
    segments: [
      { id: 'completed-curriculum', label: 'Completed Curriculum', description: 'Awarded certificates', count: 12, percentage: 32, icon: 'check-circle', tone: 'success', color: '#22c55e' },
      { id: 'actively-learning', label: 'Actively Learning', description: 'Engaged in modules', count: 19, percentage: 51, icon: 'play-circle', tone: 'info', color: '#3b82f6' },
      { id: 'registered-not-started', label: 'Registered / Not Started', description: 'Awaiting onboarding', count: 3, percentage: 8, icon: 'help-circle', tone: 'warning', color: '#f59e0b' },
      { id: 'inactive-at-risk', label: 'Inactive / At Risk', description: 'No login in 30 days', count: 3, percentage: 8, icon: 'alert-triangle', tone: 'danger', color: '#ef4444' },
    ],
  },
  'python-data': {
    activeSet: 4,
    activeLearningIndex: 88,
    segments: [
      { id: 'completed-curriculum', label: 'Completed Curriculum', description: 'Awarded certificates', count: 2, percentage: 50, icon: 'check-circle', tone: 'success', color: '#22c55e' },
      { id: 'actively-learning', label: 'Actively Learning', description: 'Engaged in modules', count: 0, percentage: 0, icon: 'play-circle', tone: 'info', color: '#3b82f6' },
      { id: 'registered-not-started', label: 'Registered / Not Started', description: 'Awaiting onboarding', count: 1, percentage: 25, icon: 'help-circle', tone: 'warning', color: '#f59e0b' },
      { id: 'inactive-at-risk', label: 'Inactive / At Risk', description: 'No login in 30 days', count: 1, percentage: 25, icon: 'alert-triangle', tone: 'danger', color: '#ef4444' },
    ],
  },
  'uiux-design': {
    activeSet: 4,
    activeLearningIndex: 81,
    segments: [
      { id: 'completed-curriculum', label: 'Completed Curriculum', description: 'Awarded certificates', count: 1, percentage: 25, icon: 'check-circle', tone: 'success', color: '#22c55e' },
      { id: 'actively-learning', label: 'Actively Learning', description: 'Engaged in modules', count: 2, percentage: 50, icon: 'play-circle', tone: 'info', color: '#3b82f6' },
      { id: 'registered-not-started', label: 'Registered / Not Started', description: 'Awaiting onboarding', count: 1, percentage: 25, icon: 'help-circle', tone: 'warning', color: '#f59e0b' },
      { id: 'inactive-at-risk', label: 'Inactive / At Risk', description: 'No login in 30 days', count: 0, percentage: 0, icon: 'alert-triangle', tone: 'danger', color: '#ef4444' },
    ],
  },
  'cloud-native': {
    activeSet: 4,
    activeLearningIndex: 67,
    segments: [
      { id: 'completed-curriculum', label: 'Completed Curriculum', description: 'Awarded certificates', count: 1, percentage: 25, icon: 'check-circle', tone: 'success', color: '#22c55e' },
      { id: 'actively-learning', label: 'Actively Learning', description: 'Engaged in modules', count: 2, percentage: 50, icon: 'play-circle', tone: 'info', color: '#3b82f6' },
      { id: 'registered-not-started', label: 'Registered / Not Started', description: 'Awaiting onboarding', count: 0, percentage: 0, icon: 'help-circle', tone: 'warning', color: '#f59e0b' },
      { id: 'inactive-at-risk', label: 'Inactive / At Risk', description: 'No login in 30 days', count: 1, percentage: 25, icon: 'alert-triangle', tone: 'danger', color: '#ef4444' },
    ],
  },
  fullstack: {
    activeSet: 4,
    activeLearningIndex: 50,
    segments: [
      { id: 'completed-curriculum', label: 'Completed Curriculum', description: 'Awarded certificates', count: 1, percentage: 25, icon: 'check-circle', tone: 'success', color: '#22c55e' },
      { id: 'actively-learning', label: 'Actively Learning', description: 'Engaged in modules', count: 2, percentage: 50, icon: 'play-circle', tone: 'info', color: '#3b82f6' },
      { id: 'registered-not-started', label: 'Registered / Not Started', description: 'Awaiting onboarding', count: 1, percentage: 25, icon: 'help-circle', tone: 'warning', color: '#f59e0b' },
      { id: 'inactive-at-risk', label: 'Inactive / At Risk', description: 'No login in 30 days', count: 0, percentage: 0, icon: 'alert-triangle', tone: 'danger', color: '#ef4444' },
    ],
  },
  'data-science-ml': {
    activeSet: 3,
    activeLearningIndex: 74,
    segments: [
      { id: 'completed-curriculum', label: 'Completed Curriculum', description: 'Awarded certificates', count: 1, percentage: 33, icon: 'check-circle', tone: 'success', color: '#22c55e' },
      { id: 'actively-learning', label: 'Actively Learning', description: 'Engaged in modules', count: 2, percentage: 67, icon: 'play-circle', tone: 'info', color: '#3b82f6' },
      { id: 'registered-not-started', label: 'Registered / Not Started', description: 'Awaiting onboarding', count: 0, percentage: 0, icon: 'help-circle', tone: 'warning', color: '#f59e0b' },
      { id: 'inactive-at-risk', label: 'Inactive / At Risk', description: 'No login in 30 days', count: 0, percentage: 0, icon: 'alert-triangle', tone: 'danger', color: '#ef4444' },
    ],
  },
  'exec-leadership': {
    activeSet: 3,
    activeLearningIndex: 95,
    segments: [
      { id: 'completed-curriculum', label: 'Completed Curriculum', description: 'Awarded certificates', count: 2, percentage: 67, icon: 'check-circle', tone: 'success', color: '#22c55e' },
      { id: 'actively-learning', label: 'Actively Learning', description: 'Engaged in modules', count: 1, percentage: 33, icon: 'play-circle', tone: 'info', color: '#3b82f6' },
      { id: 'registered-not-started', label: 'Registered / Not Started', description: 'Awaiting onboarding', count: 0, percentage: 0, icon: 'help-circle', tone: 'warning', color: '#f59e0b' },
      { id: 'inactive-at-risk', label: 'Inactive / At Risk', description: 'No login in 30 days', count: 0, percentage: 0, icon: 'alert-triangle', tone: 'danger', color: '#ef4444' },
    ],
  },
};

/** Rows for the Course Performance Overview table (shared fixture). */
const coursePerformance: CourseAnalyticsData['coursePerformance'] = [
  { id: 'intro-python-data', rank: 1, name: 'Introduction to Python & Data Science', category: 'Computer Science • LMS Program', learners: 4, activeLearners: 0, completion: 88, trend: 'upward' },
  { id: 'uiux-design-systems', rank: 2, name: 'UI/UX Design Systems & Product Design', category: 'Product Design • LMS Program', learners: 4, activeLearners: 2, completion: 81, trend: 'upward' },
  { id: 'cloud-native-infra', rank: 3, name: 'Cloud Native Infrastructure & DevOps', category: 'Cloud & DevOps • LTE Program', learners: 4, activeLearners: 2, completion: 67, trend: 'audit_risk' },
  { id: 'fullstack-web-dev', rank: 4, name: 'Full-Stack Web Development', category: 'Software Engineering • LTE Program', learners: 4, activeLearners: 2, completion: 91, trend: 'upward' },
  { id: 'data-science-ml', rank: 5, name: 'Data Science & Applied Machine Learning', category: 'Data & Analytics • LMS Program', learners: 3, activeLearners: 2, completion: 74, trend: 'stable' },
  { id: 'exec-leadership', rank: 6, name: 'Executive Leadership & Team Management', category: 'Management • LMS Program', learners: 3, activeLearners: 1, completion: 95, trend: 'upward' },
];

/** Filter definitions for the (non-functional, UI-only) filter panel (shared fixture). */
const filters: CourseAnalyticsData['filters'] = [
  {
    id: 'course',
    label: 'Course',
    options: [
      { value: 'all', label: 'All Courses' },
      { value: 'python-data', label: 'Introduction to Python & Data Science' },
      { value: 'uiux-design', label: 'UI/UX Design Systems & Product Design' },
      { value: 'cloud-native', label: 'Cloud Native Infrastructure & DevOps' },
      { value: 'fullstack', label: 'Full-Stack Web Development' },
      { value: 'data-science-ml', label: 'Data Science & Applied Machine Learning' },
      { value: 'exec-leadership', label: 'Executive Leadership & Team Management' },
    ],
  },
  {
    id: 'status',
    label: 'Learner Status',
    options: [
      { value: 'all', label: 'All Statuses' },
      { value: 'completed', label: 'Completed' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'not_started', label: 'Not Started' },
    ],
  },
  {
    id: 'period',
    label: 'Time Period',
    options: [
      { value: 'current-month', label: 'Current Month' },
      { value: 'last-month', label: 'Last Month' },
      { value: 'current-quarter', label: 'Current Quarter' },
      { value: 'current-year', label: 'Current Year' },
    ],
  },
];

/**
 * Build a full mock {@link CourseAnalyticsData} payload for one role.
 *
 * Only `directoryTree` and `learnerDirectory` are role-specific; every other
 * field reuses the shared fixtures above so the UI renders identically across
 * roles (KPI cards, Enrollment Analytics, Learner Status Distribution, and
 * Course Performance are intentionally NOT connected to the directory filter
 * yet — see project notes on scoping that to a later phase).
 */
export function buildMockCourseAnalytics(params: {
  directoryTree: DirectoryNode[];
  learnerDirectory: LearnerDirectoryRow[];
}): CourseAnalyticsData {
  return {
    kpis,
    enrollment,
    academicStatusByCourse,
    coursePerformance,
    learnerDirectory: params.learnerDirectory,
    directoryTree: params.directoryTree,
    totalLearnerRecords: params.learnerDirectory.length,
    filters,
  };
}
