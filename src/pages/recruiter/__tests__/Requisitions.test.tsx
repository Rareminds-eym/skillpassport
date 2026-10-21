import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Requisitions from '../Requisitions';

const { apiPost, user } = vi.hoisted(() => ({ apiPost: vi.fn(), user: { id: 'user-1', email: 'recruiter@example.invalid' } }));
vi.mock('@/shared/api/apiClient', () => ({ apiPost, ApiError: class ApiError extends Error {} }));
vi.mock('@/shared/model/authStore', () => ({ useUser: () => user }));
vi.mock('@/shared/config/logging', () => ({ getLogger: () => ({ info: vi.fn(), error: vi.fn() }) }));
vi.mock('@/features/recruiter', () => ({ AdvancedRequisitionFilters: () => null, RequisitionImport: () => null }));
vi.mock('@/features/recruiter-pipeline', () => ({ AddToShortlistModal: () => null }));
vi.mock('@/components/EmptyStateWithQuote', () => ({ EmptyStateWithQuote: ({ actionButton }: { actionButton: React.ReactNode }) => <div>No jobs{actionButton}</div> }));

const fixture = { id: 'job-1', title: 'Platform Engineer', job_title: 'Platform Engineer', company_name: 'Example', department: 'Engineering', location: 'Remote', employment_type: 'Full-time', experience_level: 'Mid', status: 'draft', description: 'Build systems', requirements: [], responsibilities: [], posted_date: '2026-10-19' };
let jobs = [fixture];
let count = 1;
let allow = true;
let failDelete = false;
let failUpdate = false;
beforeEach(() => {
  // Radix positions its menu/tooltip with this browser API, absent in jsdom.
  vi.stubGlobal('ResizeObserver', class { observe() {} unobserve() {} disconnect() {} });
  jobs = [{ ...fixture }]; count = 1; allow = true; failDelete = false; failUpdate = false;
  apiPost.mockReset();
  apiPost.mockImplementation(async (_path, body) => {
    switch (body.action) {
      case 'get-requisition-permissions': return { data: { create: allow, edit: allow, delete: allow } };
      case 'list-opportunities': return { data: { data: jobs.filter(job => body.statusFilter === 'all' || job.status === body.statusFilter), total: count } };
      case 'delete-requisition': if (failDelete) throw new Error('Linked hiring records'); jobs = []; count = 0; return { data: { success: true } };
      case 'update-requisition': if (failUpdate) throw new Error('Save failed'); jobs = jobs.map(job => ({ ...job, ...body.updates })); return { data: jobs[0] };
      default: return { data: [] };
    }
  });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
async function mount() { render(<MemoryRouter><Requisitions /></MemoryRouter>); await screen.findByText('Platform Engineer'); await waitFor(() => expect(apiPost).toHaveBeenCalledWith('/recruiter/actions', { action: 'get-requisition-permissions' })); }

describe('Requisition page workflows', () => {
  it('requires confirmation before deleting and refreshes rows and totals', async () => {
    await mount(); fireEvent.click(screen.getByRole('button', { name: 'Delete Platform Engineer' }));
    expect(apiPost.mock.calls.some(([, body]) => body.action === 'delete-requisition')).toBe(false);
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Delete requisition' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await screen.findByText('0 requisitions');
    expect(screen.queryByText('Platform Engineer')).not.toBeInTheDocument();
  });
  it('cancels deletion without sending a mutation', async () => {
    await mount(); fireEvent.click(screen.getByRole('button', { name: 'Delete Platform Engineer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(apiPost.mock.calls.some(([, body]) => body.action === 'delete-requisition')).toBe(false);
  });
  it('retains a failed deletion dialog and the original data', async () => {
    failDelete = true; await mount(); fireEvent.click(screen.getByRole('button', { name: 'Delete Platform Engineer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete requisition' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete requisition' })).toBeEnabled();
    expect(screen.getByText('1 requisition')).toBeInTheDocument();
  });
  it('makes every field editable from the detail view and shows save failures', async () => {
    await mount(); fireEvent.click(screen.getByRole('button', { name: 'View Platform Engineer' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Example');
    fireEvent.click(screen.getByRole('button', { name: 'Edit requisition' }));
    fireEvent.change(screen.getByLabelText('Job title', { exact: false }), { target: { value: 'Renamed Engineer' } });
    failUpdate = true;
    fireEvent.submit(screen.getByRole('button', { name: 'Save changes' }).closest('form')!);
    expect(await screen.findByRole('alert')).toHaveTextContent('Save failed');
    failUpdate = false; fireEvent.submit(screen.getByRole('button', { name: 'Save changes' }).closest('form')!);
    await screen.findByText('Renamed Engineer');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Platform Engineer')).not.toBeInTheDocument();
  });
  it('reconciles an emptied final page after deleting its last row', async () => {
    count = 9; await mount();
    fireEvent.click(screen.getAllByRole('button', { name: 'Next' })[0]);
    await waitFor(() => expect(apiPost.mock.calls.some(([, body]) => body.action === 'list-opportunities' && body.currentPage === 2)).toBe(true));
    apiPost.mockImplementation(async (_path, body) => {
      if (body.action === 'delete-requisition') { count = 8; jobs = [{ ...fixture, title: 'Remaining Engineer', job_title: 'Remaining Engineer' }]; return { data: { success: true } }; }
      if (body.action === 'list-opportunities') return { data: { data: body.currentPage === 2 ? [] : jobs, total: count } };
      return { data: [] };
    });
    await screen.findByText('Platform Engineer');
    fireEvent.click(screen.getByRole('button', { name: 'Delete Platform Engineer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete requisition' }));
    await screen.findByText('Remaining Engineer');
    expect(screen.getByText('8 requisitions')).toBeInTheDocument();
  });
  it('disables mutations for viewers in grid and list modes', async () => {
    allow = false; await mount();
    expect(screen.getByRole('button', { name: 'Create Requisition' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Edit Platform Engineer' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete Platform Engineer' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'List' }));
    expect(screen.getByRole('button', { name: 'Edit Platform Engineer' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'View Platform Engineer' })).toBeEnabled();
  });
  it('refreshes the current filter when a status request finishes after navigation', async () => {
    jobs = [{ ...fixture, status: 'open' }];
    const base = apiPost.getMockImplementation()!;
    let finish!: () => void;
    const pending = new Promise<void>(resolve => { finish = resolve; });
    apiPost.mockImplementation(async (path, body) => {
      if (body.action === 'update-requisition') await pending;
      return base(path, body);
    });
    await mount();
    await userEvent.click(screen.getByRole('button', { name: 'More actions for Platform Engineer' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Put on hold' }));
    fireEvent.change(screen.getByLabelText('Filter by status'), { target: { value: 'on_hold' } });
    await screen.findByText('No requisitions found');
    finish();
    await screen.findByText('Platform Engineer');
    const listCalls = apiPost.mock.calls.filter(([, body]) => body.action === 'list-opportunities');
    expect(listCalls[listCalls.length - 1][1].statusFilter).toBe('on_hold');
  });
  it('offers hold and resume actions appropriate to the current status', async () => {
    jobs = [{ ...fixture, status: 'open' }]; await mount();
    await userEvent.click(screen.getByRole('button', { name: 'More actions for Platform Engineer' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Put on hold' }));
    await waitFor(() => expect(apiPost.mock.calls.some(([, body]) => body.action === 'update-requisition' && body.updates.status === 'on_hold')).toBe(true));
    await screen.findByText('on hold');
    await userEvent.click(screen.getByRole('button', { name: 'More actions for Platform Engineer' }));
    expect(screen.getByRole('menuitem', { name: 'Resume opening' })).toBeEnabled();
  });
});
