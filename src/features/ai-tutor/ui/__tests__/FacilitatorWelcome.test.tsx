import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FacilitatorWelcome from '../FacilitatorWelcome';
afterEach(cleanup);
describe('orb welcome screen', () => {
  it('tracks over the entire chat panel and resets only when leaving it', () => {
    const { container, unmount } = render(<div data-orb-pointer-area data-testid="chat-panel">
      <header>Chat header</header>
      <FacilitatorWelcome onSelectRole={vi.fn()} />
      <input aria-label="Chat input" />
    </div>);
    const orb = container.querySelector<HTMLDivElement>('.facilitator-orb')!;
    vi.spyOn(orb, 'getBoundingClientRect').mockReturnValue({ left: 100, top: 200, width: 400, height: 300 } as DOMRect);
    const move = (target: Element, clientX: number, clientY: number, pointerType = 'mouse') => {
      const event = new Event('pointermove', { bubbles: true });
      Object.assign(event, { clientX, clientY, pointerType });
      fireEvent(target, event);
    };
    move(screen.getByText('Chat header'), 300, 50);
    expect(orb.style.getPropertyValue('--orb-eye-y')).toBe('-6px');
    expect(orb.style.getPropertyValue('--orb-tilt-x')).toBe('8deg');
    expect(orb.style.getPropertyValue('--orb-tilt-y')).toBe('0deg');
    fireEvent.pointerLeave(orb);
    expect(orb.style.getPropertyValue('--orb-eye-y')).toBe('-6px');
    move(screen.getByRole('textbox'), 600, 700);
    expect(orb.style.getPropertyValue('--orb-eye-x')).toBe('9px');
    expect(orb.style.getPropertyValue('--orb-eye-y')).toBe('6px');
    expect(orb.style.getPropertyValue('--orb-tilt-x')).toBe('-8deg');
    expect(orb.style.getPropertyValue('--orb-tilt-y')).toBe('6deg');
    move(screen.getByRole('textbox'), 0, 0, 'touch');
    expect(orb.style.getPropertyValue('--orb-eye-x')).toBe('9px');
    fireEvent.pointerLeave(screen.getByTestId('chat-panel'));
    expect(orb.style.getPropertyValue('--orb-eye-x')).toBe('');
    expect(orb.style.getPropertyValue('--orb-eye-y')).toBe('');
    expect(orb.style.getPropertyValue('--orb-tilt-x')).toBe('');
    expect(orb.style.getPropertyValue('--orb-tilt-y')).toBe('');
    move(screen.getByRole('textbox'), 600, 700);
    unmount();
    expect(orb.style.getPropertyValue('--orb-eye-x')).toBe('');
  });
  it('follows the pointer within bounds and returns eyes to center on exit', () => {
    const select = vi.fn();
    const { container } = render(<FacilitatorWelcome onSelectRole={select} />);
    const orb = container.querySelector<HTMLDivElement>('.facilitator-orb')!;
    vi.spyOn(orb, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 400, height: 300 } as DOMRect);
    const move = new Event('pointermove', { bubbles: true });
    Object.assign(move, { clientX: 400, clientY: 300, pointerType: 'mouse' });
    fireEvent(orb, move);
    expect(orb.style.getPropertyValue('--orb-eye-x')).toBe('9px');
    expect(orb.style.getPropertyValue('--orb-eye-y')).toBe('6px');
    const reverse = new Event('pointermove', { bubbles: true });
    Object.assign(reverse, { clientX: 0, clientY: 0, pointerType: 'mouse' });
    fireEvent(orb, reverse);
    expect(orb.style.getPropertyValue('--orb-eye-x')).toBe('-9px');
    expect(orb.style.getPropertyValue('--orb-eye-y')).toBe('-6px');
    fireEvent.pointerLeave(orb);
    expect(orb.style.getPropertyValue('--orb-eye-x')).toBe('');
    expect(orb.style.getPropertyValue('--orb-eye-y')).toBe('');
    expect(select).not.toHaveBeenCalled();
  });
  it('shows the reference welcome text with four actionable orbit labels', () => {
    render(<FacilitatorWelcome onSelectRole={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'What would you like to do?' })).toBeInTheDocument();
    expect(screen.getByText('Choose a facilitator or just ask a question.')).toBeInTheDocument();
    for (const name of ['Plan', 'Create', 'Guide', 'Solve']) expect(screen.getByRole('button', { name })).toBeEnabled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it.each([['Plan', 'organizer'], ['Create', 'resource-provider'], ['Guide', 'mentor-and-guide'], ['Solve', 'problem-solver']])('routes %s to its existing facilitator', (name, id) => {
    const select = vi.fn();
    render(<FacilitatorWelcome onSelectRole={select} />);
    expect(select).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name }));
    expect(select).toHaveBeenCalledWith(id);
  });
  it('disables every action when interactions are unavailable', () => {
    const select = vi.fn();
    render(<FacilitatorWelcome disabled onSelectRole={select} />);
    for (const name of ['Plan', 'Create', 'Guide', 'Solve']) expect(screen.getByRole('button', { name })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(select).not.toHaveBeenCalled();
  });
});
