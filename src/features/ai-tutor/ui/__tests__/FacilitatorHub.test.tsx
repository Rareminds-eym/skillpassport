import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FacilitatorHub from '../FacilitatorHub';
import { FACILITATORS } from '../../config/facilitators';
afterEach(cleanup);
describe('six facilitator explorer', () => {
  it('makes every role visible with a course-specific introduction', () => {
    render(<FacilitatorHub courseName="Time Management" onAction={vi.fn()} />);
    expect(screen.getByText('Time Management')).toBeInTheDocument();
    for (const role of FACILITATORS) expect(screen.getByRole('button', { name: new RegExp(role.name) })).toBeEnabled();
  });
  it.each(FACILITATORS)('opens a real, clearly labelled example for $name', role => {
    const action = vi.fn();
    render(<FacilitatorHub courseName="Science" onAction={action} />);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(role.name) }));
    expect(screen.getByRole('heading', { name: role.name })).toHaveFocus();
    expect(screen.getByText('Example · Grade 7 Science')).toBeInTheDocument();
    expect(screen.getByText(role.example.title)).toBeInTheDocument();
    expect(screen.getByText(role.example.items[0])).toBeInTheDocument();
    if (role.planned) expect(screen.getByText(/Next on the roadmap/)).toBeInTheDocument();
    expect(action).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: role.actionLabel }));
    expect(action).toHaveBeenCalledWith(role);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('returns to the role grid and disables role changes while generating', () => {
    const view = render(<FacilitatorHub courseName="Science" onAction={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Organizer/ }));
    fireEvent.click(screen.getByRole('button', { name: 'All six facilitators' }));
    expect(screen.getByRole('button', { name: /Resource Provider/ })).toBeInTheDocument();
    view.rerender(<FacilitatorHub courseName="Science" disabled onAction={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Organizer/ })).toBeDisabled();
  });
});
