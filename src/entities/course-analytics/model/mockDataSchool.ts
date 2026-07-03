/**
 * Course Analytics Entity - School Admin Mock Data
 *
 * School Admin hierarchy: Grade → Section → Learners (shallower than College's
 * Department → Academic Year → Section, per the project spec). Built with the
 * same {@link buildMockCourseAnalytics} factory as College, so only the
 * directory tree and learner list differ — everything else (KPI cards,
 * enrollment chart, academic status, course performance, filters) is the
 * identical shared fixture, keeping the UI consistent across roles.
 *
 * IMPORTANT: Temporary stand-in. Replace with a role-scoped fetch when the
 * backend is ready — no UI component needs to change.
 */

import type { CourseAnalyticsData } from './types';
import { buildMockCourseAnalytics } from './mockDataFactory';

/** Rows for the Learner Directory table. Each learner belongs to a Section. */
const learnerDirectory: CourseAnalyticsData['learnerDirectory'] = [
  {
    id: 'liam-carter',
    sectionId: 'grade8-a',
    name: 'Liam Carter',
    email: 'liam.carter@brightfield.edu',
    courseCode: 'MATH-G8',
    progress: 92,
    hours: 30.5,
    status: 'completed',
    lastActive: 'Jun 25, 2026',
    lastCourseLearned: 'Grade 8 Mathematics',
  },
  {
    id: 'sofia-nguyen',
    sectionId: 'grade8-a',
    name: 'Sofia Nguyen',
    email: 'sofia.nguyen@brightfield.edu',
    courseCode: 'SCI-G8',
    progress: 78,
    hours: 24.2,
    status: 'in_progress',
    lastActive: 'Jun 24, 2026',
    lastCourseLearned: 'Grade 8 Science',
  },
  {
    id: 'noah-patel',
    sectionId: 'grade8-b',
    name: 'Noah Patel',
    email: 'noah.patel@brightfield.edu',
    courseCode: 'ENG-G8',
    progress: 0,
    hours: 0,
    status: 'not_started',
    lastActive: 'Mar 2, 2026',
    lastCourseLearned: 'Grade 8 English',
  },
  {
    id: 'ava-brooks',
    sectionId: 'grade9-a',
    name: 'Ava Brooks',
    email: 'ava.brooks@brightfield.edu',
    courseCode: 'MATH-G9',
    progress: 100,
    hours: 36.8,
    status: 'completed',
    lastActive: 'Jun 26, 2026',
    lastCourseLearned: 'Grade 9 Mathematics',
  },
  {
    id: 'mason-lee',
    sectionId: 'grade9-a',
    name: 'Mason Lee',
    email: 'mason.lee@brightfield.edu',
    courseCode: 'SCI-G9',
    progress: 61,
    hours: 19.4,
    status: 'in_progress',
    lastActive: 'Jun 20, 2026',
    lastCourseLearned: 'Grade 9 Science',
  },
  {
    id: 'isla-fischer',
    sectionId: 'grade9-b',
    name: 'Isla Fischer',
    email: 'isla.fischer@brightfield.edu',
    courseCode: 'ENG-G9',
    progress: 88,
    hours: 27.1,
    status: 'in_progress',
    lastActive: 'Jun 22, 2026',
    lastCourseLearned: 'Grade 9 English',
  },
];

/**
 * Recursive directory tree for the School hierarchy: Grade → Section.
 * Only Section nodes are `selectable`; Grades are pure navigation.
 */
const directoryTree: CourseAnalyticsData['directoryTree'] = [
  {
    id: 'grade8',
    label: 'Grade 8',
    level: 'grade',
    icon: 'graduation-cap',
    childrenLabel: 'Sections',
    children: [
      { id: 'grade8-a', label: 'Section A', level: 'section', icon: 'users', selectable: true },
      { id: 'grade8-b', label: 'Section B', level: 'section', icon: 'users', selectable: true },
    ],
  },
  {
    id: 'grade9',
    label: 'Grade 9',
    level: 'grade',
    icon: 'graduation-cap',
    childrenLabel: 'Sections',
    children: [
      { id: 'grade9-a', label: 'Section A', level: 'section', icon: 'users', selectable: true },
      { id: 'grade9-b', label: 'Section B', level: 'section', icon: 'users', selectable: true },
    ],
  },
  {
    id: 'grade10',
    label: 'Grade 10',
    level: 'grade',
    icon: 'graduation-cap',
    childrenLabel: 'Sections',
    children: [
      { id: 'grade10-a', label: 'Section A', level: 'section', icon: 'users', selectable: true },
    ],
  },
  {
    id: 'grade11',
    label: 'Grade 11',
    level: 'grade',
    icon: 'graduation-cap',
    childrenLabel: 'Sections',
    children: [
      { id: 'grade11-a', label: 'Section A', level: 'section', icon: 'users', selectable: true },
    ],
  },
  {
    id: 'grade12',
    label: 'Grade 12',
    level: 'grade',
    icon: 'graduation-cap',
    childrenLabel: 'Sections',
    children: [
      { id: 'grade12-a', label: 'Section A', level: 'section', icon: 'users', selectable: true },
    ],
  },
];

/**
 * Full mock payload for the School Admin Course Analytics Dashboard.
 * Replace with a role-scoped fetch when the backend is ready.
 */
export const mockCourseAnalyticsSchool: CourseAnalyticsData = buildMockCourseAnalytics({
  directoryTree,
  learnerDirectory,
});
