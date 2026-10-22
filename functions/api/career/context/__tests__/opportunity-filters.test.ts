import { describe, expect, it } from 'vitest';
import { deriveOpportunityFilters } from '../opportunity-filters';

const profile = { skills: ['Python', 'SQL'], department: 'Computer Science', experienceCount: 0 };
describe('deterministic opportunity filtering', () => {
  it('preserves explicit technology, location and employment intent without a provider', () => {
    expect(deriveOpportunityFilters({ ...profile, message: 'Find full-time Python roles in Chennai' })).toMatchObject({ searchQuery: 'python', location: 'Chennai', employmentType: 'Full-time', experienceLevel: 'entry', limit: 15 });
    expect(deriveOpportunityFilters({ ...profile, message: 'Remote React internships please' })).toMatchObject({ searchQuery: 'react', location: 'Remote', employmentType: 'Internship' });
  });
  it('falls back to profile skills for generic requests and preserves unknown location/type', () => {
    const result = deriveOpportunityFilters({ ...profile, message: 'Show me jobs' });
    expect(result.searchQuery).toBe('Python SQL');
    expect(result.location).toBeUndefined();
    expect(result.employmentType).toBeUndefined();
    expect(deriveOpportunityFilters({ ...profile, skills: [], message: 'Find jobs' }).searchQuery).toBe('Computer Science');
  });
  it('does not turn alternatives or an explicitly negated remote request into restrictive filters', () => {
    const result = deriveOpportunityFilters({ ...profile, message: 'Python full-time or contract jobs, not remote' });
    expect(result.employmentType).toBeUndefined();
    expect(result.location).toBeUndefined();
  });
  it('bounds untrusted text and retains deterministic experience classification', () => {
    const result = deriveOpportunityFilters({ ...profile, message: 'x'.repeat(10000), experienceCount: 4 });
    expect(result.searchQuery).toBe('Python SQL');
    expect(result.experienceLevel).toBe('mid');
    expect(deriveOpportunityFilters({ ...profile, message: 'JavaScript roles', experienceCount: 1 }).experienceLevel).toBe('junior');
  });
});
