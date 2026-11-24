import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import MathMarkdown, { normalizeMathDelimiters } from '../MathMarkdown';

afterEach(cleanup);

it('renders the reported pump equation with a fraction and subscripts', () => {
  const { container } = render(<MathMarkdown>{String.raw`Formula: \(P_e = \frac{P_h}{\eta_{pump} \times \eta_{motor}}\).`}</MathMarkdown>);
  expect(container.querySelector('.katex')).not.toBeNull();
  expect(container.querySelector('mfrac')).not.toBeNull();
  expect(container.querySelector('msub')).not.toBeNull();
  expect(container.querySelector('.katex-html')?.textContent).not.toContain('\\frac');
});

it('supports block equations and double-escaped delimiters in saved questions', () => {
  const { container } = render(<MathMarkdown>{String.raw`\[Q = 0.010\,m^3/s\] and \\(P_h = 1962\,W\\)`}</MathMarkdown>);
  expect(container.querySelectorAll('.katex')).toHaveLength(2);
  expect(container.querySelector('.katex-display')).not.toBeNull();
  expect(container.querySelector('msup')).not.toBeNull();
});

it('preserves code examples and incomplete streaming delimiters', () => {
  const code = '```tex\n\\(Q = A \\times v\\)\n```\n`\\(Q\\)`';
  expect(normalizeMathDelimiters(code)).toBe(code);
  expect(normalizeMathDelimiters(String.raw`Partial \(\frac{P_h}`)).toBe(String.raw`Partial \(\frac{P_h}`);
});

it('handles invalid formulas and disables trusted HTML commands', () => {
  const { container } = render(<MathMarkdown>{String.raw`\(\frac{x}\) \(\href{javascript:alert(1)}{click}\)`}</MathMarkdown>);
  expect(container.querySelector('.katex-error')).not.toBeNull();
  expect(container.querySelector('a[href^="javascript:"]')).toBeNull();
});
