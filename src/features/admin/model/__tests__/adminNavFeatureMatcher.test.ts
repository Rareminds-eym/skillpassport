import { describe, it, expect } from 'vitest';
import { matchAdminNavFeature } from '../adminNavFeatureMatcher';
import type { AdminNavFeature } from '../useAdminNavFeatures';

describe('matchAdminNavFeature', () => {
  const sampleCatalog: AdminNavFeature[] = [
    {
      key: 'examination_scheduling',
      role: 'university_admin',
      nav_group: 'Examinations',
      nav_label: 'Examination Scheduling',
      nav_path: '/university-admin/examinations',
      display_order: 10,
    },
    {
      key: 'grade_calculation',
      role: 'university_admin',
      nav_group: 'Examinations',
      nav_label: 'Grade Calculation',
      nav_path: '/university-admin/examinations/grades',
      display_order: 20,
    },
    {
      key: 'results_publishing',
      role: 'university_admin',
      nav_group: 'Examinations',
      nav_label: 'Results Publishing',
      nav_path: '/university-admin/examinations/results',
      display_order: 30,
    },
    {
      key: 'fee_structures',
      role: 'university_admin',
      nav_group: 'Finance',
      nav_label: 'Fee Structures',
      nav_path: '/university-admin/finance',
      display_order: 40,
    },
    {
      key: 'payment_tracking',
      role: 'university_admin',
      nav_group: 'Finance',
      nav_label: 'Payment Tracking',
      nav_path: '/university-admin/finance/payments',
      display_order: 50,
    },
    {
      key: 'course_mapping',
      role: 'college_admin',
      nav_group: 'Academics',
      nav_label: 'Course Mapping',
      nav_path: '/college-admin/departments/mapping',
      display_order: 60,
    },
  ];

  it('matches exact path correctly', () => {
    const match = matchAdminNavFeature('/university-admin/examinations', sampleCatalog);
    expect(match).toBeDefined();
    expect(match?.key).toBe('examination_scheduling');
  });

  it('PREVENTS FALSE POSITIVE: exact sub-path matches child feature, NOT parent prefix', () => {
    // Under linear find, /university-admin/examinations matched first because it's a prefix of /grades.
    // Two-phase matching ensures /university-admin/examinations/grades maps to grade_calculation.
    const match = matchAdminNavFeature('/university-admin/examinations/grades', sampleCatalog);
    expect(match).toBeDefined();
    expect(match?.key).toBe('grade_calculation');
  });

  it('PREVENTS FALSE POSITIVE: nested sub-route matches longest prefix child feature', () => {
    // Deep path /university-admin/examinations/grades/edit/101 must match grade_calculation, not examination_scheduling
    const match = matchAdminNavFeature('/university-admin/examinations/grades/edit/101', sampleCatalog);
    expect(match).toBeDefined();
    expect(match?.key).toBe('grade_calculation');
  });

  it('PREVENTS FALSE POSITIVE: finance payments sub-path matches payment_tracking, not fee_structures', () => {
    const match = matchAdminNavFeature('/university-admin/finance/payments', sampleCatalog);
    expect(match).toBeDefined();
    expect(match?.key).toBe('payment_tracking');
  });

  it('falls back to prefix match when child sub-route has no exact catalog entry', () => {
    const match = matchAdminNavFeature('/college-admin/departments/mapping/new-entry', sampleCatalog);
    expect(match).toBeDefined();
    expect(match?.key).toBe('course_mapping');
  });

  it('returns null for ungated routes or routes outside catalog', () => {
    expect(matchAdminNavFeature('/college-admin/dashboard', sampleCatalog)).toBeNull();
    expect(matchAdminNavFeature('/university-admin/audit', sampleCatalog)).toBeNull();
    expect(matchAdminNavFeature('/settings', sampleCatalog)).toBeNull();
  });

  it('handles trailing slashes gracefully', () => {
    const match = matchAdminNavFeature('/university-admin/examinations/grades/', sampleCatalog);
    expect(match).toBeDefined();
    expect(match?.key).toBe('grade_calculation');
  });

  it('handles empty inputs safely', () => {
    expect(matchAdminNavFeature('', sampleCatalog)).toBeNull();
    expect(matchAdminNavFeature('/some/path', [])).toBeNull();
  });
});
