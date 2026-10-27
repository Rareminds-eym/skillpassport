import { describe, expect, it } from 'vitest';
import { getQueryRange, parseAnalyticsParams, toCSV, validCustomRange, validDate } from '../analytics/model';

describe('Analytics URL and export model', () => {
  it.each(['range=unknown&chart=pie', 'range=constructor', 'range=custom&start=2025-02-31&end=2025-03-01', 'range=custom&start=2025-03-05&end=2025-03-01'])('handles malformed bookmarks safely: %s', query => {
    expect(parseAnalyticsParams(new URLSearchParams(query))).toEqual({ range: '30d', chart: 'line', start: '', end: '' });
  });
  it('does not send stale custom dates with a preset', () => {
    const state = parseAnalyticsParams(new URLSearchParams('range=7d&start=2025-01-01&end=2025-01-31'));
    expect(getQueryRange(state)).toEqual({ preset: '7d', startDate: undefined, endDate: undefined });
  });
  it('validates actual calendar dates and rejects future or reversed ranges', () => {
    expect(validDate('2024-02-29')).toBe(true);
    expect(validDate('2025-02-29')).toBe(false);
    expect(validCustomRange('2025-01-01', '2099-01-01')).toBe(false);
    expect(validCustomRange('2025-01-02', '2025-01-01')).toBe(false);
    expect(validCustomRange('2025-01-01', '2025-01-01')).toBe(true);
  });
  it('escapes CSV names, newlines, and spreadsheet formulas while retaining numeric values', () => {
    const csv = toCSV([{ Section: 'Courses', Metric: '=SUM(1,2)\n"Course"', Value: 0, Unit: 'hires', Period: 'Last 30 days' }]);
    expect(csv).toContain('"\'=SUM(1,2)\n""Course"""');
    expect(csv).toContain('"0"');
    expect(csv).not.toContain('undefined');
  });
});
