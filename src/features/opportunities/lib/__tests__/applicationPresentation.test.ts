import { expect, it } from 'vitest';
import {
  applicationDate,
  applicationStatus,
  applicationType,
  applicationUpdated,
} from '../applicationPresentation';
it('preserves the local application date across UTC midnight', () => {
  expect(applicationDate('2026-10-25T20:00:00Z', 'en-GB', 'Asia/Kolkata')).toBe(
    '26 Oct 2026',
  );
  expect(applicationDate(null)).toBe('Date unavailable');
});
it('uses calendar days for Yesterday even when the update was less than 24 hours ago', () => {
  expect(
    applicationUpdated(
      new Date(2026, 9, 25, 23).toISOString(),
      new Date(2026, 9, 26, 1),
    ),
  ).toBe('Yesterday');
  expect(
    applicationUpdated(
      new Date(2026, 9, 26, 0).toISOString(),
      new Date(2026, 9, 26, 1),
    ),
  ).toBe('Today');
});
it('uses visit terminology without raw database enums or misleading defaults', () => {
  expect(applicationStatus('applied', true)).toBe('Registered');
  expect(applicationStatus('accepted', true)).toBe('Confirmed');
  expect(applicationStatus('invalid')).toBe('Status unavailable');
  expect(applicationType('factory_visit')).toBe('Industrial visit');
  expect(applicationType('N/A')).toBe('');
});
