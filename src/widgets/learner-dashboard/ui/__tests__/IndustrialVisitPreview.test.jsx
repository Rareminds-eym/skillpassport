import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import IndustrialVisitPreview, { IndustrialVisitRegistration } from '../IndustrialVisitPreview';

const visit = { id: 'visit', company_name: 'Example employer', sector: 'Manufacturing', location: 'Bengaluru', description: 'Organizer-provided visit details.', posted_date: '2026-03-03' };
afterEach(cleanup);

it('uses a section heading, a keyboard-scrollable region, and a full posting date', () => {
  render(<IndustrialVisitPreview visit={visit} onRegister={vi.fn()} />);
  expect(screen.getByRole('heading', { name: 'Example employer', level: 2 })).toBeVisible();
  expect(screen.getByRole('region', { name: 'Visit information' })).toHaveAttribute('tabindex', '0');
  expect(screen.getByText('3 Mar 2026')).toBeVisible();
  expect(screen.queryByText(/days ago|NaN/)).not.toBeInTheDocument();
});

it('keeps the modal body free of a duplicate company heading, nested scrolling, and duplicate registration action', () => {
  render(<IndustrialVisitPreview visit={visit} inDialog />);
  expect(screen.queryByRole('heading', { name: 'Example employer' })).not.toBeInTheDocument();
  expect(screen.getByText('Organizer-provided visit details.')).toBeVisible();
  expect(screen.getByRole('region', { name: 'Visit information' })).not.toHaveAttribute('tabindex');
  expect(screen.queryByRole('button', { name: /Register for Visit/i })).not.toBeInTheDocument();
});

it.each([undefined, '', 'invalid-date'])('shows an honest date fallback for %s', posted_date => {
  render(<IndustrialVisitPreview visit={{ ...visit, posted_date }} />);
  expect(screen.getByText('Posting date unavailable')).toBeVisible();
  expect(screen.queryByText(/Invalid Date|NaN/)).not.toBeInTheDocument();
});

it('disables registration while pending and shows the recorded state after success', () => {
  const register = vi.fn();
  const view = render(<IndustrialVisitRegistration visit={visit} onRegister={register} isRegistering />);
  const pending = screen.getByRole('button', { name: 'Registering…' });
  expect(pending).toBeDisabled();
  fireEvent.click(pending);
  expect(register).not.toHaveBeenCalled();
  view.rerender(<IndustrialVisitRegistration visit={visit} onRegister={register} isRegistered />);
  expect(screen.getByRole('button', { name: 'Registered' })).toBeDisabled();
  expect(screen.getByRole('status')).toHaveTextContent('Your registration is recorded');
});

it('shows actionable registration errors without automatically navigating away', () => {
  const profile = vi.fn();
  render(<IndustrialVisitRegistration visit={visit} onRegister={vi.fn()} error="Please complete your profile" onCompleteProfile={profile} />);
  expect(screen.getByRole('alert')).toHaveTextContent('Please complete your profile');
  expect(profile).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Complete your profile' }));
  expect(profile).toHaveBeenCalledOnce();
});

it('disables an action without a registration handler', () => {
  render(<IndustrialVisitRegistration visit={visit} />);
  expect(screen.getByRole('button', { name: 'Register for Visit' })).toBeDisabled();
});
