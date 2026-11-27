import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({
  subscription: null as Record<string, unknown> | null, hasAccess: true,
  organization: null as Record<string, unknown> | null,
}));
vi.mock('@/shared/model/authStore', () => ({ useUser: () => ({ id: 'owner', orgId: 'org' }) }));
vi.mock('@/features/subscription/model/useSubscriptionQuery', () => ({ useSubscriptionQuery: () => ({ subscriptionData: state.subscription, hasAccess: state.hasAccess }) }));
vi.mock('@/entities/organization/model/useOrganizationCheck', () => ({ useOrganizationCheck: () => ({ organization: state.organization, hasOrganization: Boolean(state.organization), loading: false, error: null }) }));
import OrganizationGuard from '../OrganizationGuard';
afterEach(cleanup);
beforeEach(() => { state.subscription = null; state.organization = { id: 'org', name: 'Signup name' }; state.hasAccess = true; });
function open(type: 'school' | 'college') {
  render(<MemoryRouter><Routes>
    <Route path="/" element={<OrganizationGuard organizationType={type}><p>Institution dashboard</p></OrganizationGuard>} />
    <Route path="/organization-setup" element={<p>Institution registration</p>} />
  </Routes></MemoryRouter>);
}
for (const type of ['school', 'college'] as const) {
  it(`skips repeat ${type} registration for verified Hybrid organization coverage`, () => {
    state.subscription = { isHybrid: true, isOrganizationSubscription: true, organizationId: 'org', organizationType: type };
    open(type);
    expect(screen.getByText('Institution dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Institution registration')).toBeNull();
  });
  it.each([
    { isHybrid: false }, { organizationId: 'other' }, { organizationType: 'other' }, { isOrganizationSubscription: false },
  ])(`keeps ${type} registration when Hybrid scope does not match: %j`, overrides => {
    state.subscription = { isHybrid: true, isOrganizationSubscription: true, organizationId: 'org', organizationType: type, ...overrides };
    open(type);
    expect(screen.getByText('Institution registration')).toBeInTheDocument();
  });
  it(`retains registration for a self-signup ${type} account`, () => {
    open(type); expect(screen.getByText('Institution registration')).toBeInTheDocument();
  });
  it(`does not use a Hybrid label as subscription access for ${type}`, () => {
    state.hasAccess = false;
    state.subscription = { isHybrid: true, isOrganizationSubscription: true, organizationId: 'org', organizationType: type };
    open(type); expect(screen.queryByText('Institution dashboard')).toBeNull();
  });
  it(`keeps completed self-registration ${type} on the dashboard`, () => {
    state.organization = { id: 'org', name: 'Institution', city: 'Chennai', state: 'Tamil Nadu' };
    open(type); expect(screen.getByText('Institution dashboard')).toBeInTheDocument();
  });
}
