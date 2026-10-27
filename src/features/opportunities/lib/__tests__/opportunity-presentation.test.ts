import { expect, it } from 'vitest';
import { applicationState, jobSalary, opportunityText } from '../presentation';
import { readOpportunitySearch, salaryFilterError } from '../filters';
it('repairs only proven punctuation sequences and preserves other languages', () => {
  expect(opportunityText('Hero ΓÇô Bengaluru · தமிழ் · 日本語')).toBe(
    'Hero – Bengaluru · தமிழ் · 日本語',
  );
});
it('uses honest salary fallbacks including a zero amount', () => {
  expect(jobSalary({})).toBe('Salary not specified');
  expect(jobSalary({ salary_range_min: 0 })).toBe('₹0+');
});
it('keeps recorded external applications distinct from employer submission', () => {
  expect(
    applicationState(
      { application_link: 'https://example.test' },
      { isApplied: true },
    ).label,
  ).toBe('Application Recorded');
});
it('restores durable filters and rejects invalid URL pages and salary ranges', () => {
  const state = readOpportunitySearch(
    new URLSearchParams(
      'skills=React&skills=SQL&page=-4&tab=my-applications&salaryMin=100&salaryMax=10',
    ),
  );
  expect(state.filters.skills).toEqual(['React', 'SQL']);
  expect(state.page).toBe(1);
  expect(state.tab).toBe('my-applications');
  expect(state.filters.salaryMin).toBe('');
  expect(salaryFilterError('100', '10')).toContain('Maximum salary');
});
