// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { requireResponseScale } from '../../../functions/api/assessment/utils/response-scale';

describe('explicit middle school rating scales', () => {
  it.each([null, undefined, [], 'bad JSON', { values: [] }, [{ value: 4, label: 'Only option' }], [{ value: 1, label: '' }, { value: 4, label: 'High' }], [{ value: 1, label: 'Low' }, { value: 1, label: 'Duplicate' }]])('rejects missing or invalid scales instead of supplying defaults (%j)', value => {
    expect(() => requireResponseScale(value, 'middle_strengths_character')).toThrow('Missing or invalid response scale for section middle_strengths_character');
  });

  it.each([
    [[1, 2, 3, 4], 4, 100],
    [[1, 2, 3, 4], 3, 75],
    [[1, 2, 3, 4, 5], 4, 80],
    [[0, 1, 2, 3, 4], 0, 0],
  ])('normalizes using only configured options (%j)', (values, answer, percentage) => {
    const options = values.map(value => ({ value, label: String(value) }));
    for (const stored of [options, JSON.stringify(options), { values: options }]) {
      const scale = requireResponseScale(stored, 'section');
      expect(answer / Math.max(...scale.map(option => option.value)) * 100).toBe(percentage);
    }
  });
});
