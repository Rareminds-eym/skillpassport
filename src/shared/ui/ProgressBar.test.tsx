import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
    it('renders without crashing', () => {
        render(<ProgressBar value={50} />);
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('displays label when provided', () => {
        render(<ProgressBar value={75} label="Progress" />);
        expect(screen.getByText('Progress')).toBeInTheDocument();
    });

    it('shows percentage when showPercentage is true', () => {
        render(<ProgressBar value={65} showPercentage />);
        expect(screen.getByText('65%')).toBeInTheDocument();
    });

    it('clamps value between 0 and 100', () => {
        const { rerender } = render(<ProgressBar value={120} showPercentage />);
        expect(screen.getByText('100%')).toBeInTheDocument();

        rerender(<ProgressBar value={-20} showPercentage />);
        expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('auto-colors based on value ranges', () => {
        const { container, rerender } = render(<ProgressBar value={85} color="auto" />);
        let progressBar = container.querySelector('.bg-green-500');
        expect(progressBar).toBeInTheDocument();

        rerender(<ProgressBar value={70} color="auto" />);
        progressBar = container.querySelector('.bg-yellow-500');
        expect(progressBar).toBeInTheDocument();

        rerender(<ProgressBar value={40} color="auto" />);
        progressBar = container.querySelector('.bg-red-500');
        expect(progressBar).toBeInTheDocument();
    });

    it('applies explicit color when specified', () => {
        const { container } = render(<ProgressBar value={50} color="blue" />);
        const progressBar = container.querySelector('.bg-blue-500');
        expect(progressBar).toBeInTheDocument();
    });

    it('has proper ARIA attributes', () => {
        render(<ProgressBar value={55} label="Loading" />);
        const progress = screen.getByRole('progressbar');
        expect(progress).toHaveAttribute('aria-valuenow', '55');
        expect(progress).toHaveAttribute('aria-valuemin', '0');
        expect(progress).toHaveAttribute('aria-valuemax', '100');
    });
});
