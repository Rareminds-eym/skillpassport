import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DateRangePicker from '@/features/recruiter-pipeline/ui/DateRangePicker';

afterEach(cleanup);
describe('Analytics reporting period picker', () => {
  it('opens with an accessible label, applies presets, and restores focus with Escape', async () => {
    const user = userEvent.setup();
    const onRangeChange = vi.fn();
    render(<DateRangePicker preset="30d" startDate="" endDate="" onRangeChange={onRangeChange} />);
    const trigger = screen.getByRole('button', { name: 'Reporting period: Last 30 days' });
    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Reporting period' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Last 7 days' }));
    expect(onRangeChange).toHaveBeenCalledWith('7d', expect.any(String), expect.any(String));
    await user.click(trigger);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('prevents reversed and future custom dates and applies a valid interval', async () => {
    const user = userEvent.setup();
    const onRangeChange = vi.fn();
    render(<DateRangePicker preset="30d" startDate="" endDate="" onRangeChange={onRangeChange} />);
    await user.click(screen.getByRole('button', { name: /Reporting period:/ }));
    const start = screen.getByLabelText('Start date');
    const end = screen.getByLabelText('End date');
    const apply = screen.getByRole('button', { name: 'Apply range' });
    expect(apply).toBeDisabled();
    fireEvent.change(start, { target: { value: '2025-09-10' } });
    fireEvent.change(end, { target: { value: '2025-09-01' } });
    expect(apply).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('End date must be on or after');
    fireEvent.change(end, { target: { value: '2099-01-01' } });
    expect(apply).toBeDisabled();
    fireEvent.change(end, { target: { value: '2025-09-15' } });
    expect(apply).toBeEnabled();
    await user.click(apply);
    expect(onRangeChange).toHaveBeenCalledWith('custom', '2025-09-10', '2025-09-15');
  });

  it('loads updated bookmarked dates when reopened', async () => {
    const user = userEvent.setup();
    const view = render(<DateRangePicker preset="custom" startDate="2025-09-01" endDate="2025-09-15" onRangeChange={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /Reporting period:/ }));
    expect(screen.getByLabelText('Start date')).toHaveValue('2025-09-01');
    await user.keyboard('{Escape}');
    view.rerender(<DateRangePicker preset="custom" startDate="2025-10-01" endDate="2025-10-10" onRangeChange={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /Reporting period:/ }));
    expect(screen.getByLabelText('Start date')).toHaveValue('2025-10-01');
    expect(screen.getByLabelText('End date')).toHaveValue('2025-10-10');
  });
});
