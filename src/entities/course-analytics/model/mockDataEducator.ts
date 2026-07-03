/**
 * Course Analytics Entity - Educator Mock Data
 *
 * Educator hierarchy: Assigned Course → Assigned Section → Learners — the
 * shallowest of the four role hierarchies, and scoped to only the courses and
 * sections this educator teaches (not the whole institution). Built with the
 * same {@link buildMockCourseAnalytics} factory as the other roles, so only
 * the directory tree and learner list differ.
 *
 * IMPORTANT: Temporary stand-in. Replace with a role-scoped fetch (filtered to
 * the logged-in educator's assignments) when the backend is ready — no UI
 * component needs to change.
 */

import type { CourseAnalyticsData } from './types';
import { buildMockCourseAnalytics } from './mockDataFactory';

/** Rows for the Learner Directory table. Each learner belongs to a Section. */
const learnerDirectory: CourseAnalyticsData['learnerDirectory'] = [
  {
    id: 'ken-adeyemi',
    sectionId: 'python-a',
    name: 'Ken Adeyemi',
    email: 'ken.adeyemi@skillpassport.io',
    courseCode: 'PYTHON-101',
    progress: 84,
    hours: 22.5,
    status: 'in_progress',
    lastActive: 'Jun 25, 2026',
    lastCourseLearned: 'Python Fundamentals',
  },
  {
    id: 'maya-lindqvist',
    sectionId: 'python-a',
    name: 'Maya Lindqvist',
    email: 'maya.lindqvist@skillpassport.io',
    courseCode: 'PYTHON-101',
    progress: 100,
    hours: 28.1,
    status: 'completed',
    lastActive: 'Jun 26, 2026',
    lastCourseLearned: 'Python Fundamentals',
  },
  {
    id: 'oscar-torres',
    sectionId: 'python-b',
    name: 'Oscar Torres',
    email: 'oscar.torres@skillpassport.io',
    courseCode: 'PYTHON-101',
    progress: 0,
    hours: 0,
    status: 'not_started',
    lastActive: 'Apr 1, 2026',
    lastCourseLearned: 'Python Fundamentals',
  },
  {
    id: 'nina-park',
    sectionId: 'webdev-a',
    name: 'Nina Park',
    email: 'nina.park@skillpassport.io',
    courseCode: 'WEBDEV-201',
    progress: 66,
    hours: 19.7,
    status: 'in_progress',
    lastActive: 'Jun 20, 2026',
    lastCourseLearned: 'Web Development Basics',
  },
];

/**
 * Recursive directory tree for the Educator hierarchy: Assigned Course →
 * Assigned Section. Only Section nodes are `selectable`; Courses are pure
 * navigation. Scoped to just this educator's own assignments.
 */
const directoryTree: CourseAnalyticsData['directoryTree'] = [
  {
    id: 'course-python',
    label: 'Python',
    level: 'assigned-course',
    icon: 'cpu',
    childrenLabel: 'Assigned Sections',
    children: [
      { id: 'python-a', label: 'Section A', level: 'section', icon: 'users', selectable: true },
      { id: 'python-b', label: 'Section B', level: 'section', icon: 'users', selectable: true },
    ],
  },
  {
    id: 'course-webdev',
    label: 'Web Development',
    level: 'assigned-course',
    icon: 'cpu',
    childrenLabel: 'Assigned Sections',
    children: [
      { id: 'webdev-a', label: 'Section A', level: 'section', icon: 'users', selectable: true },
    ],
  },
];

/**
 * Full mock payload for the Educator Course Analytics Dashboard.
 * Replace with a role-scoped fetch when the backend is ready.
 */
export const mockCourseAnalyticsEducator: CourseAnalyticsData = buildMockCourseAnalytics({
  directoryTree,
  learnerDirectory,
});
