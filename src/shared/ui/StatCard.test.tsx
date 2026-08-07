import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StatCard } from './StatCard';

describe('StatCard', () => {
    it('renders without crashing', () => {
        render(<StatCard title="Total Users" value={1234} />);
        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText('1234')).toBeInTheDocument();
    });

    it('displays subtitle when provided', () => {
        render(<StatCard title="Revenue" value="$45,231" subtitle="Last 30 days" />);
        expect(screen.getByText('Last 30 days')).toBeInTheDocument();
    });

    it('renders icon when provided', () => {
        const icon = <svg data-testid="test-icon" />;
        render(<StatCard title="Orders" value={342} icon={icon} />);
        expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('displays trend with up arrow', () => {
        render(
            <StatCard
                title="Growth"
                value="12%"
                trend={{ value: 5, direction: 'up' }}
            />
        );
        expect(screen.getByText('5%')).toBeInTheDocument();
    });

    it('displays trend with down arrow', () => {
        render(
            <StatCard
                title="Churn"
                value="2.3%"
                trend={{ value: 1.2, direction: 'down' }}
            />
        );
        expect(screen.getByText('1.2%')).toBeInTheDocument();
    });

    it('calls onClick handler when clicked', () => {
        const handleClick = vi.fn();
        render(<StatCard title="Clicks" value={789} onClick={handleClick} />);

        const card = screen.getByText('Clicks').closest('div');
        fireEvent.click(card!);

        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('is keyboard accessible when clickable', () => {
        const handleClick = vi.fn();
        render(<StatCard title="Views" value={456} onClick={handleClick} />);

        const card = screen.getByRole('button');
        expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('handles Enter key press', () => {
        const handleClick = vi.fn();
        render(<StatCard title="Saves" value={123} onClick={handleClick} />);

        const card = screen.getByText('Saves').closest('div');
        fireEvent.keyDown(card!, { key: 'Enter' });

        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('handles Space key press', () => {
        const handleClick = vi.fn();
        render(<StatCard title="Shares" value={67} onClick={handleClick} />);

        const card = screen.getByText('Shares').closest('div');
        fireEvent.keyDown(card!, { key: ' ' });

        expect(handleClick).toHaveBeenCalledTimes(1);
    });
});
