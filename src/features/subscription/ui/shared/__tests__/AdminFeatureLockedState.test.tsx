import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AdminFeatureLockedState } from '../AdminFeatureLockedState';

vi.mock('@/shared/model/authStore', () => ({
  useUser: () => ({
    id: 'user-123',
    name: 'College Dean',
    email: 'dean@college.edu',
    orgId: 'c2655d27-43ca-43df-93fd-e4eb33461588',
  }),
}));

describe('AdminFeatureLockedState', () => {
  const feature = {
    key: 'course_mapping',
    nav_label: 'Course Mapping',
    nav_path: '/college-admin/departments/mapping',
    nav_group: 'Academics',
  };

  it('renders locked module title and hybrid plan badge', () => {
    render(
      <BrowserRouter>
        <AdminFeatureLockedState feature={feature} role="college_admin" />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { name: 'Course Mapping' })).toBeDefined();
    expect(screen.getByText('Not Included in Plan')).toBeDefined();
    expect(screen.getByText(/Subscription Status:/i)).toBeDefined();
  });

  it('renders module specific capabilities', () => {
    render(
      <BrowserRouter>
        <AdminFeatureLockedState feature={feature} role="college_admin" />
      </BrowserRouter>
    );

    expect(
      screen.getByText(/Course-to-program allocation across semesters/i)
    ).toBeDefined();
    expect(
      screen.getByText(/Dynamic faculty workload calculation/i)
    ).toBeDefined();
  });

  it('opens activation request modal on button click', () => {
    render(
      <BrowserRouter>
        <AdminFeatureLockedState feature={feature} role="college_admin" />
      </BrowserRouter>
    );

    const activateBtn = screen.getByRole('button', { name: /Request Module Access/i });
    fireEvent.click(activateBtn);

    expect(screen.getByRole('button', { name: /Submit Request/i })).toBeDefined();
  });

  it('isolates submission state between different modules', () => {
    localStorage.clear();
    localStorage.setItem('feature_request_course_mapping', JSON.stringify({ submitted: true }));

    const { rerender } = render(
      <BrowserRouter>
        <AdminFeatureLockedState feature={feature} role="college_admin" />
      </BrowserRouter>
    );

    // Module A (course_mapping) is submitted
    expect(screen.getByText(/Request Submitted/i)).toBeDefined();

    // Switch to Module B (enrolled_learners)
    const featureB = {
      key: 'enrolled_learners',
      nav_label: 'Enrolled Learners',
      nav_path: '/college-admin/learners/enrolled',
      nav_group: 'Learners',
    };

    rerender(
      <BrowserRouter>
        <AdminFeatureLockedState feature={featureB} role="college_admin" />
      </BrowserRouter>
    );

    // Module B must show "Request Module Access", NOT "Request Submitted"
    expect(screen.getByRole('button', { name: /Request Module Access/i })).toBeDefined();
    expect(screen.queryByText(/Request Submitted/i)).toBeNull();
  });
});
