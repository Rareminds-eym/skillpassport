import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { StrictMode } from 'react';
import { act } from '@testing-library/react';
import AdvancedFilters from '@/widgets/learner-dashboard/ui/AdvancedFilters';
import OpportunityCard from '@/widgets/learner-dashboard/ui/OpportunityCard';
import OpportunityPreview from '@/widgets/learner-dashboard/ui/OpportunityPreview';
import { emptyOpportunityFilters } from '../../lib/filters';

afterEach(cleanup);
const job = {
  id: 'job',
  title: 'Engineer',
  company_name: 'Example',
  description:
    'A complete description that must remain available in the details dialog.',
};

describe('opportunities workflow regressions', () => {
  it('keeps a requested confirmation open under StrictMode effect replay', async () => {
    render(<StrictMode><OpportunityPreview opportunity={job} onApply={vi.fn()} showSummary={false} applicationRequest={{jobId: job.id}} /></StrictMode>);
    expect(await screen.findByRole('dialog', {name: 'Confirm Application'})).toBeVisible();
  });
  it('does not show an earlier job submission result in a different job confirmation', async () => {
    let resolve!: (value: boolean) => void;
    const apply = vi.fn(() => new Promise<boolean>(done => {resolve = done;}));
    const {rerender} = render(<OpportunityPreview opportunity={job} onApply={apply} showSummary={false} applicationRequest={{jobId: job.id}} />);
    await userEvent.click(await screen.findByRole('button', {name: 'Confirm & Apply'}));
    const other = {...job, id: 'other-job', title: 'Another engineer'};
    rerender(<OpportunityPreview opportunity={other} onApply={apply} showSummary={false} applicationRequest={{jobId: other.id}} />);
    await act(async () => resolve(true));
    expect(screen.queryByRole('dialog', {name: 'Application Submitted!'})).not.toBeInTheDocument();
    expect(screen.getByRole('dialog', {name: 'Confirm Application'})).toHaveTextContent('Another engineer');
  });
  it.each(['profile', 'access', 'eligibility', 'access-loading', 'access-error'])('blocks confirmation if %s changes after the dialog opens', async changed => {
    const apply = vi.fn();
    const request = {jobId: job.id};
    const {rerender} = render(<OpportunityPreview opportunity={job} onApply={apply} showSummary={false} applicationRequest={request} />);
    expect(await screen.findByRole('button', {name: 'Confirm & Apply'})).toBeEnabled();
    rerender(<OpportunityPreview opportunity={changed === 'eligibility' ? {...job, learning_eligibility: {canApply: false}} : job}
      onApply={apply} showSummary={false} applicationRequest={request}
      profileCheckError={changed === 'profile' ? 'Network error' : null} canAccessOpportunities={changed !== 'access'}
      accessCheckLoading={changed === 'access-loading'} accessCheckError={changed === 'access-error' ? 'Network error' : null} />);
    expect(screen.getByRole('button', {name: 'Confirm & Apply'})).toBeDisabled();
    expect(apply).not.toHaveBeenCalled();
  });
  it('waits for subscription access before showing an upgrade prompt or confirmation', async () => {
    const upgrade = vi.fn();
    const request = {jobId: job.id};
    const {rerender} = render(<OpportunityPreview opportunity={job} onApply={vi.fn()} showSummary={false}
      applicationRequest={request} accessCheckLoading canAccessOpportunities={false} onShowUpgradePrompt={upgrade} />);
    expect(upgrade).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    rerender(<OpportunityPreview opportunity={job} onApply={vi.fn()} showSummary={false}
      applicationRequest={request} canAccessOpportunities onShowUpgradePrompt={upgrade} />);
    expect(await screen.findByRole('dialog', {name: 'Confirm Application'})).toBeVisible();
    expect(upgrade).not.toHaveBeenCalled();
  });
  it('offers access-check retry without offering an upgrade after a lookup failure', async () => {
    const retry = vi.fn(), upgrade = vi.fn();
    render(<OpportunityPreview opportunity={job} onApply={vi.fn()} showSummary={false}
      applicationRequest={{jobId: job.id}} accessCheckError="Network error" canAccessOpportunities={false}
      onRetryAccess={retry} onShowUpgradePrompt={upgrade} />);
    await userEvent.click(await screen.findByRole('button', {name: 'Retry access check'}));
    expect(retry).toHaveBeenCalledOnce();
    expect(upgrade).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog', {name: 'Confirm Application'})).not.toBeInTheDocument();
  });
  it('disables a job which closes while its confirmation is open', async () => {
    const apply = vi.fn();
    const request = {jobId: job.id};
    const {rerender} = render(<OpportunityPreview opportunity={job} onApply={apply} showSummary={false} applicationRequest={request} />);
    expect(await screen.findByRole('button', {name: 'Confirm & Apply'})).toBeEnabled();
    rerender(<OpportunityPreview opportunity={{...job, status: 'closed'}} onApply={apply} showSummary={false} applicationRequest={request} />);
    expect(screen.getByRole('button', {name: 'Confirm & Apply'})).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('Applications closed');
    expect(apply).not.toHaveBeenCalled();
  });
  it('waits for the profile check before opening a requested application and does not reopen after cancellation', async () => {
    const apply = vi.fn();
    const request = {jobId: job.id};
    const {rerender} = render(<OpportunityPreview opportunity={null} onApply={apply} showSummary={false} />);
    rerender(<OpportunityPreview opportunity={job} onApply={apply} showSummary={false} applicationRequest={request} profileCheckLoading />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    rerender(<OpportunityPreview opportunity={job} onApply={apply} showSummary={false} applicationRequest={request} />);
    expect(await screen.findByRole('dialog', {name: 'Confirm Application'})).toBeVisible();
    await userEvent.click(screen.getByRole('button', {name: 'Cancel'}));
    rerender(<OpportunityPreview opportunity={{...job}} onApply={apply} showSummary={false} applicationRequest={request} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(apply).not.toHaveBeenCalled();
  });
  it('keeps profile completion checks when Apply is requested directly from a card', async () => {
    const apply = vi.fn();
    render(<OpportunityPreview opportunity={job} onApply={apply} showSummary={false} applicationRequest={{jobId: job.id}}
      needsProfileCompletion completionPercentage={50} missingFields={['Phone']} />);
    expect(await screen.findByRole('dialog', {name: 'Complete Your Profile'})).toHaveTextContent('Phone');
    expect(screen.queryByRole('dialog', {name: 'Confirm Application'})).not.toBeInTheDocument();
    expect(apply).not.toHaveBeenCalled();
  });
  it('does not apply canceled filters or count them as active', async () => {
    const apply = vi.fn();
    render(
      <AdvancedFilters
        initialFilters={emptyOpportunityFilters()}
        onApplyFilters={apply}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Advanced Filters' }),
    );
    await userEvent.click(screen.getByLabelText('Remote'));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(apply).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Advanced Filters' }),
    ).toHaveTextContent(/^Advanced Filters$/);
    await userEvent.click(
      screen.getByRole('button', { name: 'Advanced Filters' }),
    );
    expect(screen.getByLabelText('Remote')).not.toBeChecked();
  });
  it('rejects reversed salaries and preserves the draft for correction', async () => {
    const apply = vi.fn();
    render(
      <AdvancedFilters
        initialFilters={emptyOpportunityFilters()}
        onApplyFilters={apply}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Advanced Filters' }),
    );
    fireEvent.change(screen.getByLabelText('Minimum'), {
      target: { value: '90000' },
    });
    fireEvent.change(screen.getByLabelText('Maximum'), {
      target: { value: '10000' },
    });
    await userEvent.click(
      screen.getByRole('button', { name: 'Apply Filters' }),
    );
    expect(apply).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Maximum salary');
    fireEvent.change(screen.getByLabelText('Maximum'), {
      target: { value: '100000' },
    });
    await userEvent.click(
      screen.getByRole('button', { name: 'Apply Filters' }),
    );
    expect(apply).toHaveBeenCalledWith(
      expect.objectContaining({ salaryMin: '90000', salaryMax: '100000' }),
    );
  });
  it('closes filters with Escape and restores focus to its trigger', async () => {
    render(
      <AdvancedFilters
        initialFilters={emptyOpportunityFilters()}
        onApplyFilters={vi.fn()}
      />,
    );
    const trigger = screen.getByRole('button', { name: 'Advanced Filters' });
    await userEvent.click(trigger);
    expect(
      screen.getByRole('dialog', { name: 'Advanced Filters' }),
    ).toContainElement(document.activeElement as HTMLElement);
    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
    expect(trigger).toHaveFocus();
  });
  it('offers a keyboard-operable title and blocks a learning-ineligible card action', async () => {
    const select = vi.fn(),
      apply = vi.fn();
    render(
      <MemoryRouter>
        <OpportunityCard
          opportunity={{
            ...job,
            learning_eligibility: {
              canApply: false,
              state: 'not_yet_eligible',
            },
          }}
          onClick={select}
          onApply={apply}
          isSelected
        />
      </MemoryRouter>,
    );
    const title = screen.getByRole('button', {
      name: 'View details for Engineer',
    });
    title.focus();
    await userEvent.keyboard('{Enter}');
    expect(select).toHaveBeenCalledOnce();
    expect(
      screen.getByRole('button', { name: 'Requirements not met' }),
    ).toBeDisabled();
    expect(apply).not.toHaveBeenCalled();
  });
  it('shows the complete description and exact profile completion details', async () => {
    render(
      <OpportunityPreview
        opportunity={job}
        onApply={vi.fn()}
        needsProfileCompletion
        completionPercentage={50}
        missingFields={['Phone', 'City', 'State']}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'View More Details' }),
    );
    expect(screen.getByRole('dialog')).toHaveTextContent(job.description);
    await userEvent.click(
      screen.getByRole('button', { name: 'Complete Profile Info' }),
    );
    expect(
      screen.getByRole('dialog', { name: 'Complete Your Profile' }),
    ).toHaveTextContent('50% complete');
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.queryByText('Some required fields')).not.toBeInTheDocument();
  });
});
