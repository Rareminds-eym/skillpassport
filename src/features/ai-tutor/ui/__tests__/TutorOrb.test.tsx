import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../caretPosition', () => ({ caretPosition: (input: HTMLTextAreaElement) => ({ x: 100 + input.selectionStart * 20, y: 600 }) }));
import TutorOrb from '../TutorOrb';

afterEach(cleanup);

describe('learner tutor orb', () => {
  it('follows the typing caret and selections, then resets on blur', () => {
    const { container } = render(<div data-orb-pointer-area><TutorOrb /><textarea data-orb-caret aria-label="Composer" /></div>);
    const orb = container.querySelector<HTMLDivElement>('.facilitator-orb')!;
    vi.spyOn(orb, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 400, height: 300 } as DOMRect);
    const input = screen.getByRole('textbox') as HTMLTextAreaElement;
    input.focus();
    fireEvent.input(input, { target: { value: 'abcdefghij' } });
    expect(orb.style.getPropertyValue('--orb-eye-x')).toBe('4.5px');
    expect(orb.style.getPropertyValue('--orb-eye-y')).toBe('6px');
    input.setSelectionRange(0, 0);
    fireEvent.select(input);
    expect(orb.style.getPropertyValue('--orb-eye-x')).toBe('-4.5px');
    input.blur();
    expect(orb.style.getPropertyValue('--orb-eye-x')).toBe('');
    fireEvent.input(input, { target: { value: 'other text' } });
    expect(orb.style.getPropertyValue('--orb-eye-x')).toBe('');
  });
  it('renders the shared animated illustration without educator actions', () => {
    const { container } = render(<TutorOrb />);
    expect(container.querySelector('.facilitator-orb svg')).toBeInTheDocument();
    expect(container.querySelector('.animate-facilitator-blink')).toBeInTheDocument();
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });
});
