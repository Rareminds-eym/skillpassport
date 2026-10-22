import { describe, expect, it } from 'vitest';
import { createRequisitionSchema, updateRequisitionSchema, validSalaryRange } from '../requisitionValidation';
const valid = { job_title: 'Engineer', company_name: 'Example', department: 'Engineering', location: 'Remote', employment_type: 'Full-time', description: 'Build systems' };
describe('Requisition write boundaries', () => {
  it('strips identities, counters and visibility; preserves typed lists', () => {
    const result = createRequisitionSchema.parse({ ...valid, id: 'forged', organization_id: 'foreign', created_by: 'forged', applications_count: 99, is_active: true, skills_required: [' TypeScript '], recruiter_id: null });
    expect(result).toMatchObject({ skills_required: ['TypeScript'], recruiter_id: null });
    expect(result).not.toHaveProperty('id'); expect(result).not.toHaveProperty('organization_id'); expect(result).not.toHaveProperty('applications_count'); expect(result).not.toHaveProperty('is_active');
  });
  it.each([{ job_title: ' ' }, { salary_range_min: -1 }, { salary_range_max: 1.5 }, { skills_required: 'React, SQL' }, { recruiter_id: 'invalid' }, { status: 'published' }, { deadline: 'not-a-date' }, { company_logo: 'javascript:alert(1)' }])('rejects malformed writes %o', patch => {
    expect(createRequisitionSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });
  it('preserves explicit clearing without erasing omitted fields on status changes', () => {
    expect(updateRequisitionSchema.parse({ status: 'on_hold' })).toEqual({ status: 'on_hold' });
    expect(updateRequisitionSchema.parse({ deadline: null, recruiter_id: null, salary_range_min: null })).toEqual({ deadline: null, recruiter_id: null, salary_range_min: null });
  });
  it('checks salary patches against the persisted opposite bound', () => {
    expect(validSalaryRange({ salary_range_min: 100, salary_range_max: 50 })).toBe(false);
    expect(validSalaryRange({ salary_range_min: 100, salary_range_max: null })).toBe(true);
    expect(validSalaryRange({ salary_range_min: 0, salary_range_max: 0 })).toBe(true);
  });
});
