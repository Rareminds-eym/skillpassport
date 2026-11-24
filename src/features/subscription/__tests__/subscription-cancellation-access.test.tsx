import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../api/subscriptionService', () => ({ getActiveSubscription: vi.fn() }));
import { computeAccessState, formatSubscriptionData } from '../model/useSubscriptionQuery';
import SubscriptionBanner from '../ui/shared/SubscriptionBanner';
afterEach(cleanup);

describe('authoritative dashboard access after cancellation', () => {
  const cancelled = { status: 'cancelled', endDate: null, billingCycle: 'free' };
  it('preserves owner access separately from cancellation state without inventing renewal', () => {
    const formatted = formatSubscriptionData({ status: 'cancelled', lifecycle_access: 'read_only', auto_renew: false, subscription_end_date: null });
    expect(formatted).toMatchObject({ status: 'cancelled', lifecycleAccess: 'read_only', autoRenew: false, endDate: null });
    expect(computeAccessState(formatted)).toMatchObject({ hasAccess: true, accessReason: 'read_only', warningType: 'read_only', showWarning: true });
  });
  it.each(['full', 'restricted', 'read_only'])('uses owner %s access rather than rejecting the cancelled null end date', lifecycleAccess => {
    expect(computeAccessState({ ...cancelled, lifecycleAccess }).hasAccess).toBe(true);
  });
  it.each(['suspended', 'invalid'])('does not admit %s access', lifecycleAccess => {
    expect(computeAccessState({ ...cancelled, lifecycleAccess }).hasAccess).toBe(false);
  });
  it('does not infer read-only access from cancellation, cached policy or a missing owner decision', () => {
    expect(computeAccessState(cancelled).hasAccess).toBe(false);
    expect(computeAccessState({ ...cancelled, lifecyclePolicy: { cancellationAccess: 'read_only' } }).hasAccess).toBe(false);
  });
  it('does not extend an expired assigned seat or a future start using owner contract access', () => {
    expect(computeAccessState({ ...cancelled, lifecycleAccess: 'read_only', licenseAssignmentId: 'synthetic-seat', endDate: '2000-01-01' }).hasAccess).toBe(false);
    expect(computeAccessState({ ...cancelled, lifecycleAccess: 'full', startDate: '2099-01-01' }).hasAccess).toBe(false);
  });
  it('explains read-only access without suggesting renewal or resume', () => {
    const state = computeAccessState({ ...cancelled, lifecycleAccess: 'read_only' });
    render(<MemoryRouter><SubscriptionBanner type={state.warningType} message={state.warningMessage} /></MemoryRouter>);
    expect(screen.getByRole('status')).toHaveTextContent('Your subscription is cancelled.');
    expect(screen.getByRole('link', { name: 'Manage subscription' })).toHaveAttribute('href', '/subscription/manage');
    expect(screen.queryByRole('link', { name: /Renew|Resume/ })).toBeNull();
  });
});
