/**
 * Course Analytics Entity - University Admin Mock Data
 *
 * University Admin hierarchy: Faculty → Department → Program → Academic Year
 * → Section → Learners (the deepest of the four role hierarchies, per the
 * project spec). Built with the same {@link buildMockCourseAnalytics} factory
 * as College/School, so only the directory tree and learner list differ; the
 * `DirectoryNode` type's arbitrary recursion depth needed no changes to
 * support this extra level.
 *
 * IMPORTANT: Temporary stand-in. Replace with a role-scoped fetch when the
 * backend is ready — no UI component needs to change.
 */

import type { CourseAnalyticsData } from './types';
import { buildMockCourseAnalytics } from './mockDataFactory';

/** Rows for the Learner Directory table. Each learner belongs to a Section. */
const learnerDirectory: CourseAnalyticsData['learnerDirectory'] = [
  {
    id: 'zara-khan',
    sectionId: 'eng-cs-btech-y1-a',
    name: 'Zara Khan',
    email: 'zara.khan@nu.edu',
    courseCode: 'BTECH-CS-Y1',
    progress: 95,
    hours: 44.3,
    status: 'completed',
    lastActive: 'Jun 25, 2026',
    lastCourseLearned: 'B.Tech Computer Science — Year 1',
  },
  {
    id: 'ravi-menon',
    sectionId: 'eng-cs-btech-y1-a',
    name: 'Ravi Menon',
    email: 'ravi.menon@nu.edu',
    courseCode: 'BTECH-CS-Y1',
    progress: 70,
    hours: 31.6,
    status: 'in_progress',
    lastActive: 'Jun 21, 2026',
    lastCourseLearned: 'B.Tech Computer Science — Year 1',
  },
  {
    id: 'emily-clarke',
    sectionId: 'eng-cs-btech-y2-a',
    name: 'Emily Clarke',
    email: 'emily.clarke@nu.edu',
    courseCode: 'BTECH-CS-Y2',
    progress: 0,
    hours: 0,
    status: 'not_started',
    lastActive: 'Feb 14, 2026',
    lastCourseLearned: 'B.Tech Computer Science — Year 2',
  },
  {
    id: 'daniel-okafor',
    sectionId: 'eng-mech-btech-y1-a',
    name: 'Daniel Okafor',
    email: 'daniel.okafor@nu.edu',
    courseCode: 'BTECH-MECH-Y1',
    progress: 82,
    hours: 29.8,
    status: 'in_progress',
    lastActive: 'Jun 23, 2026',
    lastCourseLearned: 'B.Tech Mechanical Engineering — Year 1',
  },
  {
    id: 'priya-sharma',
    sectionId: 'biz-mgmt-bba-y1-a',
    name: 'Priya Sharma',
    email: 'priya.sharma@nu.edu',
    courseCode: 'BBA-Y1',
    progress: 100,
    hours: 40.2,
    status: 'completed',
    lastActive: 'Jun 26, 2026',
    lastCourseLearned: 'BBA — Year 1',
  },
];

/**
 * Recursive directory tree for the University hierarchy:
 * Faculty → Department → Program → Academic Year → Section.
 * Only Section nodes are `selectable`; every other level is pure navigation.
 */
const directoryTree: CourseAnalyticsData['directoryTree'] = [
  {
    id: 'faculty-engineering',
    label: 'Engineering',
    level: 'faculty',
    icon: 'building',
    childrenLabel: 'Departments',
    children: [
      {
        id: 'eng-cs',
        label: 'Computer Science',
        level: 'department',
        icon: 'cpu',
        childrenLabel: 'Programs',
        children: [
          {
            id: 'eng-cs-btech',
            label: 'B.Tech',
            level: 'program',
            icon: 'graduation-cap',
            childrenLabel: 'Academic Years',
            children: [
              {
                id: 'eng-cs-btech-y1',
                label: '1st Year',
                level: 'academic-year',
                icon: 'graduation-cap',
                childrenLabel: 'Sections',
                children: [
                  { id: 'eng-cs-btech-y1-a', label: 'Section A', level: 'section', icon: 'users', selectable: true },
                  { id: 'eng-cs-btech-y1-b', label: 'Section B', level: 'section', icon: 'users', selectable: true },
                ],
              },
              {
                id: 'eng-cs-btech-y2',
                label: '2nd Year',
                level: 'academic-year',
                icon: 'graduation-cap',
                childrenLabel: 'Sections',
                children: [
                  { id: 'eng-cs-btech-y2-a', label: 'Section A', level: 'section', icon: 'users', selectable: true },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'eng-mech',
        label: 'Mechanical Engineering',
        level: 'department',
        icon: 'wrench',
        childrenLabel: 'Programs',
        children: [
          {
            id: 'eng-mech-btech',
            label: 'B.Tech',
            level: 'program',
            icon: 'graduation-cap',
            childrenLabel: 'Academic Years',
            children: [
              {
                id: 'eng-mech-btech-y1',
                label: '1st Year',
                level: 'academic-year',
                icon: 'graduation-cap',
                childrenLabel: 'Sections',
                children: [
                  { id: 'eng-mech-btech-y1-a', label: 'Section A', level: 'section', icon: 'users', selectable: true },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'faculty-business',
    label: 'Business',
    level: 'faculty',
    icon: 'coins',
    childrenLabel: 'Departments',
    children: [
      {
        id: 'biz-mgmt',
        label: 'Management Studies',
        level: 'department',
        icon: 'building',
        childrenLabel: 'Programs',
        children: [
          {
            id: 'biz-mgmt-bba',
            label: 'BBA',
            level: 'program',
            icon: 'graduation-cap',
            childrenLabel: 'Academic Years',
            children: [
              {
                id: 'biz-mgmt-bba-y1',
                label: '1st Year',
                level: 'academic-year',
                icon: 'graduation-cap',
                childrenLabel: 'Sections',
                children: [
                  { id: 'biz-mgmt-bba-y1-a', label: 'Section A', level: 'section', icon: 'users', selectable: true },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

/**
 * Full mock payload for the University Admin Course Analytics Dashboard.
 * Replace with a role-scoped fetch when the backend is ready.
 */
export const mockCourseAnalyticsUniversity: CourseAnalyticsData = buildMockCourseAnalytics({
  directoryTree,
  learnerDirectory,
});
