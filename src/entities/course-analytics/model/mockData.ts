/**
 * Course Analytics Entity - College Admin Mock Data (reference implementation)
 *
 * College Admin hierarchy: Department → Academic Year → Section → Learners.
 * This is the base reference other roles (School, University, Educator) copy
 * the pattern from — see mockDataSchool.ts / mockDataUniversity.ts /
 * mockDataEducator.ts, all built with the same {@link buildMockCourseAnalytics}
 * factory so KPI/enrollment/academic-status/course-performance/filter fixtures
 * are defined once, not duplicated per role.
 *
 * IMPORTANT: Temporary stand-in. When the backend exists, a service will produce
 * the same {@link CourseAnalyticsData} shape (varying by role) and this file can be
 * removed without touching any UI component.
 */

import type { CourseAnalyticsData } from './types';
import { buildMockCourseAnalytics } from './mockDataFactory';

/** Rows for the Learner Directory table (mock; ~1 page of the 22 records). */
const learnerDirectory: CourseAnalyticsData['learnerDirectory'] = [
  {
    id: 'ayesha-rahman',
    sectionId: 'cs-y1-a',
    name: 'Ayesha Rahman',
    email: 'ayesha.rahman@gtu.edu',
    courseCode: 'PYTHON-DATA',
    progress: 100,
    hours: 48.5,
    status: 'completed',
    lastActive: 'Jun 25, 2026',
    lastCourseLearned: 'Introduction to Python & Data Science',
  },
  {
    id: 'chloe-laurent',
    sectionId: 'cs-y2-a',
    name: 'Chloe Laurent',
    email: 'chloe.laurent@ata.org',
    courseCode: 'UIUX-DESIGN',
    progress: 100,
    hours: 42.1,
    status: 'completed',
    lastActive: 'Jun 26, 2026',
    lastCourseLearned: 'UI/UX Design Systems & Product Design',
  },
  {
    id: 'daniel-smith',
    sectionId: 'mech-y1-a',
    name: 'Daniel Smith',
    email: 'dsmith@summit.edu',
    courseCode: 'FULLSTACK-BOOTCAMP',
    progress: 0,
    hours: 0,
    status: 'not_started',
    lastActive: 'Mar 10, 2026',
    lastCourseLearned: 'Full-Stack Web Development',
  },
  {
    id: 'elena-rostova',
    sectionId: 'cs-y2-a',
    name: 'Elena Rostova',
    email: 'e.rostova@svi.org',
    courseCode: 'UIUX-DESIGN',
    progress: 94,
    hours: 39.5,
    status: 'in_progress',
    lastActive: 'Jun 25, 2026',
    lastCourseLearned: 'UI/UX Design Systems & Product Design',
  },
  {
    id: 'faisal-mahmoud',
    sectionId: 'cs-y1-b',
    name: 'Faisal Mahmoud',
    email: 'faisal.m@msb.edu',
    courseCode: 'PYTHON-DATA',
    progress: 100,
    hours: 51,
    status: 'completed',
    lastActive: 'May 28, 2026',
    lastCourseLearned: 'Introduction to Python & Data Science',
  },
  {
    id: 'gabriela-silva',
    sectionId: 'mech-y1-b',
    name: 'Gabriela Silva',
    email: 'g.silva@ata.org',
    courseCode: 'FULLSTACK-BOOTCAMP',
    progress: 88,
    hours: 72.4,
    status: 'in_progress',
    lastActive: 'Jun 26, 2026',
    lastCourseLearned: 'Full-Stack Web Development',
  },
  {
    id: 'hiroshi-tanaka',
    sectionId: 'civil-y1-a',
    name: 'Hiroshi Tanaka',
    email: 'tanaka.h@gtu.edu',
    courseCode: 'DATA-SCIENCE',
    progress: 45,
    hours: 18.2,
    status: 'in_progress',
    lastActive: 'Apr 10, 2026',
    lastCourseLearned: 'Data Science & Applied Machine Learning',
  },
  {
    id: 'ingrid-meyer',
    sectionId: 'commerce-y1-a',
    name: 'Ingrid Meyer',
    email: 'i.meyer@summit.edu',
    courseCode: 'KUBERNETES',
    progress: 54,
    hours: 28.6,
    status: 'in_progress',
    lastActive: 'Jun 24, 2026',
    lastCourseLearned: 'Cloud Native Infrastructure & DevOps',
  },
];

/**
 * Recursive directory tree for the College hierarchy:
 * Department → Academic Year → Section.
 *
 * Only Section nodes are `selectable`; Departments and Years are pure
 * navigation. Learner counts are NOT stored here — they are derived from
 * `learnerDirectory` via `buildLearnerCountByNode`, so badges can never drift
 * from the actual rows. Section ids match `LearnerDirectoryRow.sectionId`.
 */
const directoryTree: CourseAnalyticsData['directoryTree'] = [
  {
    id: 'computer-science',
    label: 'Computer Science',
    level: 'department',
    icon: 'cpu',
    childrenLabel: 'Academic Years',
    children: [
      {
        id: 'cs-y1',
        label: '1st Year',
        level: 'academic-year',
        icon: 'graduation-cap',
        childrenLabel: 'Sections',
        children: [
          { id: 'cs-y1-a', label: 'Section A', level: 'section', icon: 'users', selectable: true },
          { id: 'cs-y1-b', label: 'Section B', level: 'section', icon: 'users', selectable: true },
          { id: 'cs-y1-c', label: 'Section C', level: 'section', icon: 'users', selectable: true },
        ],
      },
      {
        id: 'cs-y2',
        label: '2nd Year',
        level: 'academic-year',
        icon: 'graduation-cap',
        childrenLabel: 'Sections',
        children: [
          { id: 'cs-y2-a', label: 'Section A', level: 'section', icon: 'users', selectable: true },
          { id: 'cs-y2-b', label: 'Section B', level: 'section', icon: 'users', selectable: true },
        ],
      },
      {
        id: 'cs-y3',
        label: '3rd Year',
        level: 'academic-year',
        icon: 'graduation-cap',
        childrenLabel: 'Sections',
        children: [
          { id: 'cs-y3-a', label: 'Section A', level: 'section', icon: 'users', selectable: true },
        ],
      },
      {
        id: 'cs-y4',
        label: '4th Year',
        level: 'academic-year',
        icon: 'graduation-cap',
        childrenLabel: 'Sections',
        children: [
          { id: 'cs-y4-a', label: 'Section A', level: 'section', icon: 'users', selectable: true },
        ],
      },
    ],
  },
  {
    id: 'mechanical-engineering',
    label: 'Mechanical Engineering',
    level: 'department',
    icon: 'wrench',
    childrenLabel: 'Academic Years',
    children: [
      {
        id: 'mech-y1',
        label: '1st Year',
        level: 'academic-year',
        icon: 'graduation-cap',
        childrenLabel: 'Sections',
        children: [
          { id: 'mech-y1-a', label: 'Section A', level: 'section', icon: 'users', selectable: true },
          { id: 'mech-y1-b', label: 'Section B', level: 'section', icon: 'users', selectable: true },
        ],
      },
      {
        id: 'mech-y2',
        label: '2nd Year',
        level: 'academic-year',
        icon: 'graduation-cap',
        childrenLabel: 'Sections',
        children: [
          { id: 'mech-y2-a', label: 'Section A', level: 'section', icon: 'users', selectable: true },
        ],
      },
    ],
  },
  {
    id: 'civil-engineering',
    label: 'Civil Engineering',
    level: 'department',
    icon: 'building',
    childrenLabel: 'Academic Years',
    children: [
      {
        id: 'civil-y1',
        label: '1st Year',
        level: 'academic-year',
        icon: 'graduation-cap',
        childrenLabel: 'Sections',
        children: [
          { id: 'civil-y1-a', label: 'Section A', level: 'section', icon: 'users', selectable: true },
          { id: 'civil-y1-b', label: 'Section B', level: 'section', icon: 'users', selectable: true },
        ],
      },
    ],
  },
  {
    id: 'commerce',
    label: 'Commerce',
    level: 'department',
    icon: 'coins',
    childrenLabel: 'Academic Years',
    children: [
      {
        id: 'commerce-y1',
        label: '1st Year',
        level: 'academic-year',
        icon: 'graduation-cap',
        childrenLabel: 'Sections',
        children: [
          { id: 'commerce-y1-a', label: 'Section A', level: 'section', icon: 'users', selectable: true },
          { id: 'commerce-y1-b', label: 'Section B', level: 'section', icon: 'users', selectable: true },
        ],
      },
    ],
  },
];

/**
 * Full mock payload for the College Admin Course Analytics Dashboard.
 * Replace with a role-scoped fetch when the backend is ready.
 */
export const mockCourseAnalytics: CourseAnalyticsData = buildMockCourseAnalytics({
  directoryTree,
  learnerDirectory,
});
