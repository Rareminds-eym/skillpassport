import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CircularProgress } from './CircularProgress';

describe('CircularProgress', () => {
    it('renders without crashing', () => {
        render(<CircularProgress value={50} />);
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('displays the correct percentage', () => {
        render(<CircularProgress value={75} />);
        expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('clamps value between 0 and 100', () => {
        const { rerender } = render(<CircularProgress value={150} />);
        expect(screen.getByText('100%')).toBeInTheDocument();

        rerender(<CircularProgress value={-10} />);
        expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('applies correct color based on prop', () => {
        const { container } = render(<CircularProgress value={80} color="green" />);
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
    });

    it('displays custom label when provided', () => {
        render(<CircularProgress value={60} label="Score" />);
        expect(screen.getByText('Score')).toBeInTheDocument();
    });

    it('hides percentage when showPercentage is false', () => {
        render(<CircularProgress value={45} showPercentage={false} />);
        expect(screen.queryByText('45%')).not.toBeInTheDocument();
    });

    it('has proper ARIA attributes', () => {
        render(<CircularProgress value={85} label="Completion" />);
        const progress = screen.getByRole('progressbar');
        expect(progress).toHaveAttribute('aria-valuenow', '85');
        expect(progress).toHaveAttribute('aria-valuemin', '0');
        expect(progress).toHaveAttribute('aria-valuemax', '100');
    });

    it('accepts custom size prop', () => {
        const { container } = render(<CircularProgress value={50} size={200} />);
        const svg = container.querySelector('svg');
        expect(svg).toHaveAttribute('width', '200');
        expect(svg).toHaveAttribute('height', '200');
    });
});
