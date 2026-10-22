import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RequisitionForm, RequisitionDetails, DeleteRequisitionDialog, textList, formatSalary } from '../RequisitionDialogs';
import type { Opportunity } from '../../Requisitions';

afterEach(cleanup);
const job = {
  id: 'job-1', job_title: 'Platform Engineer', title: 'Platform Engineer', company_name: 'Example', department: 'Engineering',
  location: 'Chennai', mode: 'Hybrid', employment_type: 'Full-time', experience_level: 'Mid', experience_required: '3 years',
  salary_range_min: 1000000, salary_range_max: 2000000, status: 'draft', description: 'Build reliable systems.',
  skills_required: ['TypeScript'], requirements: ['Distributed systems'], responsibilities: ['Build services'], benefits: ['Insurance'],
  deadline: '2027-12-31T23:59:59.000Z', recruiter_id: null, applications_count: 2, views_count: 5,
} as unknown as Opportunity;
const props = { recruiters: [], onClose: vi.fn(), onSuccess: vi.fn() };
const openEdit = (onSuccess = vi.fn()) => { render(<RequisitionForm {...props} requisition={job} onSuccess={onSuccess} />); return onSuccess; };
const change = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label, { exact: false }), { target: { value } });

describe('Requisition form', () => {
  it('exposes every create field in edit and round-trips dates, modes and arrays', async () => {
    const save = openEdit();
    expect(screen.getByLabelText('Company name', { exact: false })).toHaveValue('Example');
    expect(screen.getByLabelText('Work mode')).toHaveValue('hybrid');
    expect(screen.getByLabelText('Application deadline')).toHaveValue('2027-12-31');
    change('Company name', 'Updated Company');
    change('Required skills', 'TypeScript, SQL, TypeScript');
    change('Benefits', 'Insurance\n Learning budget ');
    change('Maximum salary', '');
    fireEvent.submit(screen.getByRole('button', { name: 'Save changes' }).closest('form')!);
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0][0]).toMatchObject({ company_name: 'Updated Company', mode: 'hybrid', skills_required: ['TypeScript', 'SQL'], benefits: ['Insurance', 'Learning budget'], salary_range_max: null, recruiter_id: null });
  });
  it('creates without forcing an unavailable recruiter and normalizes blank salaries', async () => {
    const save = vi.fn();
    render(<RequisitionForm {...props} onSuccess={save} />);
    change('Job title', ' Engineer '); change('Company name', 'Example'); change('Department', 'Engineering'); change('Location', 'Remote'); change('Job description', 'Build software.');
    fireEvent.submit(screen.getByRole('button', { name: 'Create Requisition' }).closest('form')!);
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0][0]).toMatchObject({ job_title: 'Engineer', recruiter_id: null, salary_range_min: null, skills_required: [], benefits: [], status: 'draft' });
  });
  it.each([
    ['Job title', '   ', 'Blank spaces'],
    ['Maximum salary', '100', 'Maximum salary'],
    ['Minimum salary', '-1', 'non-negative'],
    ['Application deadline', '2020-01-01', 'future application deadline'],
  ])('blocks invalid %s', async (label, value, message) => {
    const save = openEdit(); change(label, value);
    fireEvent.submit(screen.getByRole('button', { name: 'Save changes' }).closest('form')!);
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(save).not.toHaveBeenCalled();
  });
  it('keeps user input and shows server failures inline', async () => {
    openEdit(vi.fn().mockRejectedValue(new Error('Plan quota exceeded')));
    change('Job title', 'Updated title');
    fireEvent.submit(screen.getByRole('button', { name: 'Save changes' }).closest('form')!);
    expect(await screen.findByRole('alert')).toHaveTextContent('Plan quota exceeded');
    expect(screen.getByLabelText('Job title', { exact: false })).toHaveValue('Updated title');
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
  });
  it('allows one request and prevents dismissal while a save is pending', async () => {
    let resolve!: () => void;
    const save = openEdit(vi.fn(() => new Promise<void>(done => { resolve = done; })));
    const form = screen.getByRole('button', { name: 'Save changes' }).closest('form')!;
    fireEvent.submit(form); fireEvent.submit(form);
    expect(save).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeDisabled();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(props.onClose).not.toHaveBeenCalled();
    resolve();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled());
  });
  it('traps keyboard focus inside the dialog and closes with Escape', async () => {
    const close = vi.fn();
    render(<RequisitionForm {...props} onClose={close} />);
    const user = userEvent.setup();
    await user.tab({ shift: true });
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);
    await user.keyboard('{Escape}');
    expect(close).toHaveBeenCalledOnce();
  });
});

describe('Details and deletion', () => {
  it('renders imported text lists and every job field without crashing', () => {
    render(<RequisitionDetails requisition={{ ...job, learning_requirements:[{levelId:'10000000-0000-4000-8000-000000000001',fingerprint:'a'.repeat(32),capabilityName:'Fixture capability',title:'Published assessed outcomes',levelNumber:2,version:1,mandatory:true}], requirements: 'SQL\nReact' as unknown as string[], benefits: '["Insurance"]' as unknown as string[] }} recruiters={[]} canEdit canDelete onClose={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} onViewApplications={vi.fn()} />);
    expect(screen.getByText('SQL')).toBeInTheDocument(); expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Published assessed outcomes')).toBeInTheDocument(); expect(screen.getByText('Required')).toBeInTheDocument();
    expect(screen.getByText('Insurance')).toBeInTheDocument(); expect(screen.getByText('3 years')).toBeInTheDocument();
    expect(screen.getByText('Chennai')).toBeInTheDocument(); expect(screen.getByRole('button', { name: 'View applications (2)' })).toBeEnabled();
  });
  it('disables mutations for viewers', () => {
    render(<RequisitionDetails requisition={job} recruiters={[]} canEdit={false} canDelete={false} onClose={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} onViewApplications={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled(); expect(screen.getByRole('button', { name: 'Edit requisition' })).toBeDisabled();
  });
  it('names the deletion target, surfaces errors and blocks repeated clicks', () => {
    render(<DeleteRequisitionDialog requisition={job} busy error="Close this opening to preserve applications" onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByText('Platform Engineer')).toBeInTheDocument(); expect(screen.getByRole('alert')).toHaveTextContent('preserve applications');
    expect(screen.getByRole('button', { name: 'Deleting…' })).toBeDisabled();
  });
  it('shows one-sided and zero salaries without invented bounds', () => {
    expect(formatSalary({ salary_range_min: 0, salary_range_max: undefined })).toBe('From ₹0');
    expect(formatSalary({ salary_range_min: undefined, salary_range_max: 2000000 })).toBe('Up to ₹20,00,000');
    expect(formatSalary({})).toBe('Salary not specified');
    expect(textList(null)).toEqual([]);
  });
});
