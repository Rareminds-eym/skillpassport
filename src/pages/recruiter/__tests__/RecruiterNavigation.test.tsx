import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Sidebar from '@/features/recruiter-pipeline/ui/Sidebar';
import MobileTabBar from '@/features/recruiter-pipeline/ui/MobileTabBar';

vi.mock('@/entities/recruitment/model/useOrgContext', () => ({ useOrgContext: () => ({ orgContext: { isAdmin: false } }) }));
afterEach(cleanup);

describe('Recruiter navigation', () => {
  it('uses the route for the active mobile shortcut and opens More', () => {
    const onMoreMenuToggle = vi.fn();
    render(<MemoryRouter initialEntries={['/recruitment/interviews']}><MobileTabBar activeTab="overview" setActiveTab={vi.fn()} onMoreMenuToggle={onMoreMenuToggle} /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Interviews' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Overview' })).not.toHaveAttribute('aria-current');
    fireEvent.click(screen.getByRole('button', { name: 'More' }));
    expect(onMoreMenuToggle).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Jobs' })).toBeInTheDocument();
  });

  it('keeps focus in the mobile drawer and supports Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const view = render(<MemoryRouter><Sidebar activeTab="overview" setActiveTab={vi.fn()} showMobileMenu onClose={onClose} /></MemoryRouter>);
    const drawer = screen.getByRole('dialog', { name: 'Recruitment menu' });
    const close = within(drawer).getByRole('button', { name: 'Close navigation menu' });
    expect(close).toHaveFocus();
    expect(document.body.style.overflow).toBe('hidden');
    await user.tab({ shift: true });
    expect(within(drawer).getByRole('link', { name: 'Settings' })).toHaveFocus();
    await user.tab();
    expect(close).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
    view.unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('closes the drawer when selecting its current route', () => {
    const onClose = vi.fn();
    render(<MemoryRouter initialEntries={['/recruitment/overview']}><Sidebar activeTab="overview" setActiveTab={vi.fn()} showMobileMenu onClose={onClose} /></MemoryRouter>);
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('link', { name: 'Overview' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('exposes the active requisition child on direct navigation', () => {
    render(<MemoryRouter initialEntries={['/recruitment/talent-pool']}><Sidebar activeTab="overview" setActiveTab={vi.fn()} showMobileMenu={false} onClose={vi.fn()} /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Requisition' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Talent Pool' })).toHaveAttribute('aria-current', 'page');
  });
});
