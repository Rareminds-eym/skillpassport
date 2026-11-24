import { describe, expect, it } from 'vitest';
import { questionDisplayText } from '../questionDisplayText';

describe('legacy assessment currency display', () => {
  it.each([
    '\u251c\u00f3\u0393\u00c7\u00dc\u252c\u2563',
    '\u0393\u00e9\u2563',
    '\u00e2\u201a\u00b9',
  ])('repairs a known currency encoding sequence', currency => {
    expect(questionDisplayText(`Price ${currency}10, total ${currency}5000`)).toBe('Price \u20b910, total \u20b95000');
  });
  it('preserves valid Unicode, equations, and currency symbols', () => {
    const text = '\u20b95000; \u20ac10; \u00a35; \u03b1 + \u03b2; \u0ba4\u0bae\u0bbf\u0bb4\u0bcd';
    expect(questionDisplayText(text)).toBe(text);
    expect(questionDisplayText('')).toBe('');
  });
});
