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
