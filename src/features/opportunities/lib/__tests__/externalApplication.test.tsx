import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getExternalApplicationUrl, openExternalApplication } from '../externalApplication';
import OpportunityPreview from '@/widgets/learner-dashboard/ui/OpportunityPreview';

const job = { id: 'job-1', job_title: 'Engineer', company_name: 'Employer', skills_required: ['TypeScript'], created_at: '2026-10-16', application_link: 'https://employer.example/apply' };
const previewProps = {
  onClose: vi.fn(), onApply: vi.fn().mockResolvedValue(false), onToggleSave: vi.fn(),
  navigate: vi.fn(), learnerData: { currentBacklogs: 0 }, onShowUpgradePrompt: vi.fn(),
};
beforeEach(() => { vi.spyOn(window, 'open').mockReturnValue(null); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('shared employer navigation', () => {
  it.each([undefined, null, 23, '', ' ', '/relative', '//employer.example', 'javascript:alert(1)', 'data:text/html,test', 'file:///tmp/job', 'mailto:jobs@example.com', 'not a URL'])('rejects non-web destination %j before opening', (value) => {
    expect(() => openExternalApplication(value)).toThrow('Invalid application destination');
    expect(window.open).not.toHaveBeenCalled();
  });
  it.each(['https://employer.example/apply?q=1', 'http://employer.example/apply'])('opens an explicit web URL with opener isolation: %s', (value) => {
    expect(getExternalApplicationUrl(` ${value} `)).toBe(value);
    expect(openExternalApplication(value)).toBeNull();
    expect(window.open).toHaveBeenCalledWith(value, '_blank', 'noopener,noreferrer');
  });
});

describe('active opportunity preview', () => {
  const details = () => fireEvent.click(screen.getByRole('button', { name: /View More Details/i }));
  it('keeps a validated employer retry link available after internal recording without claiming submission', () => {
    render(<OpportunityPreview {...previewProps} opportunity={job} isApplied />);
    details();
    expect(screen.getByRole('button', { name: 'Application Recorded' })).toBeDisabled();
    expect(screen.queryByText('Application Submitted')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open employer application page' }));
    expect(window.open).toHaveBeenCalledWith(job.application_link, '_blank', 'noopener,noreferrer');
    expect(screen.getByText(/Recorded for tracking only/)).toBeInTheDocument();
  });
  it('rejects a stored executable URL in Details and reports it without opening', () => {
    render(<OpportunityPreview {...previewProps} opportunity={{ ...job, application_link: 'javascript:alert(1)' }} />);
    details();
    fireEvent.click(screen.getByRole('button', { name: 'Open employer application page' }));
    expect(window.open).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('invalid or unavailable');
  });
  it('waits for an acknowledged application result and does not manufacture success on failure', async () => {
    let resolve!: (value: boolean) => void;
    const onApply = vi.fn(() => new Promise<boolean>(done => { resolve = done; }));
    render(<OpportunityPreview {...previewProps} opportunity={job} onApply={onApply} />);
    details();
    fireEvent.click(screen.getByRole('button', { name: 'Apply Now' }));
    fireEvent.click(screen.getByRole('button', { name: 'Record & Open Employer Site' }));
    expect(onApply).toHaveBeenCalledWith(job);
    expect(screen.queryByText('Application Recorded!')).not.toBeInTheDocument();
    await act(async () => resolve(false));
    expect(screen.getByRole('button', { name: 'Record & Open Employer Site' })).toBeEnabled();
    expect(screen.queryByText('Application Recorded!')).not.toBeInTheDocument();
  });
  it('labels acknowledged external recording honestly rather than employer submission', async () => {
    render(<OpportunityPreview {...previewProps} opportunity={job} onApply={vi.fn().mockResolvedValue(true)} />);
    details();
    fireEvent.click(screen.getByRole('button', { name: 'Apply Now' }));
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Record & Open Employer Site' })));
    expect(screen.getByText('Application Recorded!')).toBeInTheDocument();
    expect(screen.getByText(/opening a page does not confirm submission/)).toBeInTheDocument();
  });
  it('does not claim success when the action rejects', async () => {
    render(<OpportunityPreview {...previewProps} opportunity={job} onApply={vi.fn().mockRejectedValue(new Error('unavailable'))} />);
    details();
    fireEvent.click(screen.getByRole('button', { name: 'Apply Now' }));
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Record & Open Employer Site' })));
    expect(screen.getByRole('button', { name: 'Record & Open Employer Site' })).toBeEnabled();
    expect(screen.queryByText('Application Recorded!')).not.toBeInTheDocument();
  });
});
