import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MCQQuestion } from '../MCQQuestion';

afterEach(cleanup);

it('repairs displayed currency while preserving the raw saved answer and selection', () => {
  const currency = '\u251c\u00f3\u0393\u00c7\u00dc\u252c\u2563';
  const options = [`${currency}5000`, `${currency}4500`];
  const onAnswer = vi.fn();
  const props = { questionId: 'revenue', questionText: `Price ${currency}10 each`, options, onAnswer };
  const { rerender } = render(<MCQQuestion {...props} selectedAnswer={null} />);
  expect(screen.getByRole('heading')).toHaveTextContent('Price \u20b910 each');
  fireEvent.click(screen.getByRole('button', { name: 'A \u20b95000' }));
  expect(onAnswer).toHaveBeenCalledWith(options[0]);
  expect(options[0]).toBe(`${currency}5000`);
  rerender(<MCQQuestion {...props} selectedAnswer={options[0]} />);
  expect(screen.getByRole('button', { name: 'A \u20b95000' })).toHaveClass('border-indigo-500');
});
