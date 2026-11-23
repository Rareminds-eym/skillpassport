import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CurriculumNotificationLink } from './CurriculumNotificationLink';

afterEach(cleanup);
describe('curriculum notification navigation', () => {
  it('opens the exact admin submission and marks it read', () => {
    const markRead = vi.fn().mockResolvedValue(undefined), onClose = vi.fn();
    render(<MemoryRouter><CurriculumNotificationLink notification={{ id: 'alert', type: 'curriculum_change_submitted', read: false, action_url: '/college-admin/academics/curriculum?reviewChange=request' }} markRead={markRead} onClose={onClose} /></MemoryRouter>);
    const link = screen.getByRole('link', { name: 'Review change' });
    expect(link).toHaveAttribute('href', '/college-admin/academics/curriculum?reviewChange=request');
    fireEvent.click(link);
    expect(markRead).toHaveBeenCalledWith('alert');
    expect(onClose).toHaveBeenCalledOnce();
  });
  it('links a read decision to its course without another mark-read request', () => {
    const markRead = vi.fn();
    render(<MemoryRouter><CurriculumNotificationLink notification={{ id: 'alert', type: 'curriculum_change_rejected', read: true, action_url: '/educator/browse-courses?courseId=course&programId=program&reviewChange=request' }} markRead={markRead} onClose={vi.fn()} /></MemoryRouter>);
    fireEvent.click(screen.getByRole('link', { name: 'View review decision' }));
    expect(markRead).not.toHaveBeenCalled();
  });
  it('does not navigate to an external or unrelated destination', () => {
    render(<MemoryRouter><CurriculumNotificationLink notification={{ id: 'alert', type: 'curriculum_change_submitted', read: false, action_url: 'https://example.test' }} markRead={vi.fn()} onClose={vi.fn()} /></MemoryRouter>);
    expect(screen.queryByRole('link')).toBeNull();
  });
});
