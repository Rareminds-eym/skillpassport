import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApplicationsDialog, type ApplicationRecord } from '../ApplicationsDialog';
import type { Opportunity } from '../../Requisitions';
const { apiPost } = vi.hoisted(() => ({ apiPost: vi.fn() }));
vi.mock('@/shared/api/apiClient', () => ({ apiPost }));
const job = { id: '11111111-1111-4111-8111-111111111111', job_title: 'Platform Engineer', company_name: 'Example' } as Opportunity;
const app: ApplicationRecord = { id: '22222222-2222-4222-8222-222222222222', learner_id: '33333333-3333-4333-8333-333333333333', application_status: 'applied', applied_at: '2026-10-19T09:00:00Z', updated_at: '2026-10-19T09:00:00Z', notes: 'Previous review', learners: { id: '33333333-3333-4333-8333-333333333333', email: 'jane@example.invalid', profile: { name: 'Jane Candidate', course: 'Computer Science', skill: ['SQL', 'React'] } } };
let fixture: ApplicationRecord;
let failure = '';
beforeEach(() => {
  fixture = { ...app }; failure = ''; apiPost.mockReset();
  apiPost.mockImplementation(async (_path, body) => {
    if (body.action === 'get-applications-by-opportunity') { if (failure) throw new Error(failure); return { data: [fixture] }; }
    if (body.action === 'review-application') return { data: { ...fixture, application_status: body.status, notes: body.note, updated_at: '2026-10-19T10:00:00Z' } };
    if (body.action === 'get-shortlists') return { data: { shortlists: [{ id: 'list-1', name: 'Engineering', candidate_count: 3 }] } };
    if (body.action === 'add-candidate-to-shortlist') return { data: { data: { id: 'junction-1' } } };
    return { data: [] };
  });
});
afterEach(cleanup);
async function mount(canManage = true) { const close = vi.fn(); render(<MemoryRouter><ApplicationsDialog requisition={job} canManage={canManage} onClose={close} /></MemoryRouter>); await screen.findAllByText('Jane Candidate'); return close; }
const click = (name: string) => fireEvent.click(screen.getAllByRole('button', { name })[0]);
const changeNote = (value: string) => fireEvent.change(screen.getByLabelText(/Review reason/), { target: { value } });
const mutations = () => apiPost.mock.calls.filter(([, body]) => body.action === 'review-application');

describe('Applications panel', () => {
  it('uses accurate column labels, singular counts and honest candidate data', async () => {
    await mount(); expect(screen.getByText('1 application received · Example')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Education' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Experience' })).not.toBeInTheDocument();
    expect(screen.getAllByText('jane@example.invalid')).toHaveLength(2);
  });
  it('shows failed loads as errors with a working retry', async () => {
    failure = 'Database unavailable'; render(<MemoryRouter><ApplicationsDialog requisition={job} canManage onClose={vi.fn()} /></MemoryRouter>);
    expect(await screen.findByRole('alert')).toHaveTextContent(failure);
    expect(screen.queryByText('No applications received yet.')).not.toBeInTheDocument();
    failure = ''; click('Retry loading applications'); await screen.findAllByText('Jane Candidate');
  });
  it('treats malformed responses as failures', async () => {
    apiPost.mockResolvedValue({ data: {} }); render(<MemoryRouter><ApplicationsDialog requisition={job} canManage onClose={vi.fn()} /></MemoryRouter>);
    expect(await screen.findByRole('alert')).toHaveTextContent('could not be loaded');
  });
  it('searches education and supports clear no-match states', async () => {
    await mount(); fireEvent.change(screen.getByLabelText('Search applications'), { target: { value: 'nonexistent' } });
    expect(screen.getByText('No applications match your search or status filter.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Search applications'), { target: { value: 'Computer Science' } });
    expect(screen.getAllByText('Jane Candidate')).toHaveLength(2);
  });
  it('opens candidate details and closes only the nested dialog with Escape', async () => {
    const close = await mount(); click('View Jane Candidate');
    expect(screen.getByRole('dialog', { name: 'Jane Candidate' })).toHaveTextContent('Platform Engineer');
    expect(screen.getByRole('dialog', { name: 'Jane Candidate' })).toHaveTextContent('Previous review');
    expect(screen.getByRole('link', { name: 'Compose email' })).toHaveAttribute('href', 'mailto:jane%40example.invalid');
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Jane Candidate' })).not.toBeInTheDocument());
    expect(close).not.toHaveBeenCalled(); expect(screen.getByRole('dialog', { name: 'Applications for Platform Engineer' })).toBeInTheDocument();
  });
  it('requires confirmation and a reason before rejecting', async () => {
    await mount(); click('Reject'); expect(mutations()).toHaveLength(0);
    fireEvent.submit(screen.getByRole('button', { name: 'Confirm rejection' }).closest('form')!);
    expect(await screen.findByRole('alert')).toHaveTextContent('review reason'); expect(mutations()).toHaveLength(0);
    changeNote('Required qualification missing'); click('Confirm rejection');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Reject application?' })).not.toBeInTheDocument());
    expect(mutations()[0][1]).toMatchObject({ id: app.id, opportunityId: job.id, expectedStatus: 'applied', expectedUpdatedAt: app.updated_at, status: 'rejected', note: 'Required qualification missing' });
    expect(screen.getAllByRole('button', { name: 'Rejected' })[0]).toBeDisabled();
  });
  it('lets a rejected application reopen for review with a reason', async () => {
    fixture.application_status = 'rejected'; await mount();
    expect(screen.getAllByRole('button', { name: 'Rejected' })[0]).toBeDisabled(); click('Update status');
    expect(screen.getByRole('option', { name: 'Reopen for review' })).toBeInTheDocument();
    changeNote('Additional evidence received'); click('Save status');
    await waitFor(() => expect(mutations()).toHaveLength(1));
    expect(mutations()[0][1].status).toBe('under_review');
  });
  it('retains failures and blocks duplicate saves or dismissal during a mutation', async () => {
    const base = apiPost.getMockImplementation()!;
    let reject!: (error: Error) => void;
    apiPost.mockImplementation((path, body) => body.action === 'review-application' ? new Promise((_resolve, fail) => { reject = fail; }) : base(path, body));
    const close = await mount(); click('Reject'); changeNote('Review reason');
    const form = screen.getByRole('button', { name: 'Confirm rejection' }).closest('form')!;
    fireEvent.submit(form); fireEvent.submit(form); expect(mutations()).toHaveLength(1);
    fireEvent.keyDown(document.activeElement!, { key: 'Escape' }); expect(close).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    reject(new Error('Application changed. Refresh before retrying.'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Application changed');
    expect(screen.getByLabelText(/Review reason/)).toHaveValue('Review reason');
  });
  it.each(['accepted', 'withdrawn', 'offer_received', 'interview_scheduled'])('keeps %s review status read-only here', async status => {
    fixture.application_status = status; await mount();
    expect(screen.getAllByRole('button', { name: 'Update status' })[0]).toBeDisabled();
    expect(screen.getAllByRole('button', { name: 'Reject' })[0]).toBeDisabled();
  });
  it('keeps viewer actions read-only while candidate details remain available', async () => {
    await mount(false); expect(screen.getAllByRole('button', { name: 'View Jane Candidate' })[0]).toBeEnabled();
    expect(screen.getAllByRole('button', { name: 'Update status' })[0]).toBeDisabled();
    expect(screen.getAllByRole('button', { name: 'Add to shortlist' })[0]).toBeDisabled();
  });
  it('adds the actual learner identity to a selected shortlist', async () => {
    await mount(); click('Add to shortlist'); await screen.findByRole('option', { name: 'Engineering (3)' });
    fireEvent.change(screen.getByLabelText('Shortlist'), { target: { value: 'list-1' } }); click('Add candidate');
    await waitFor(() => expect(apiPost).toHaveBeenCalledWith('/opportunities', { action: 'add-candidate-to-shortlist', shortlist_id: 'list-1', learner_id: app.learner_id }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Add to shortlist' })).not.toBeInTheDocument());
  });
  it('surfaces duplicate shortlist membership instead of reporting success', async () => {
    const base = apiPost.getMockImplementation()!;
    apiPost.mockImplementation((path, body) => body.action === 'add-candidate-to-shortlist' ? Promise.resolve({ data: { data: null, error: { message: 'Candidate is already in this shortlist' } } }) : base(path, body));
    await mount(); click('Add to shortlist'); await screen.findByRole('option', { name: 'Engineering (3)' });
    fireEvent.change(screen.getByLabelText('Shortlist'), { target: { value: 'list-1' } }); click('Add candidate');
    expect(await screen.findByRole('alert')).toHaveTextContent('already in this shortlist');
  });
  it('shows empty shortlists with a link to create one', async () => {
    const base = apiPost.getMockImplementation()!;
    apiPost.mockImplementation((path, body) => body.action === 'get-shortlists' ? Promise.resolve({ data: { shortlists: [] } }) : base(path, body));
    await mount(); click('Add to shortlist'); expect(await screen.findByRole('link', { name: 'Shortlists page' })).toHaveAttribute('href', '/recruitment/shortlists');
    expect(screen.getByRole('button', { name: 'Add candidate' })).toBeDisabled();
  });
});
