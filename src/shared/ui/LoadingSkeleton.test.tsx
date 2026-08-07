import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoadingSkeleton, SkeletonCard, SkeletonAvatar, SkeletonText } from './LoadingSkeleton';

describe('LoadingSkeleton', () => {
    it('renders without crashing', () => {
        render(<LoadingSkeleton />);
        expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has proper ARIA attributes', () => {
        render(<LoadingSkeleton />);
        const skeleton = screen.getByRole('status');
        expect(skeleton).toHaveAttribute('aria-label', 'Loading...');
        expect(skeleton).toHaveAttribute('aria-busy', 'true');
    });

    it('renders text variant by default', () => {
        const { container } = render(<LoadingSkeleton />);
        const skeleton = container.querySelector('.rounded');
        expect(skeleton).toBeInTheDocument();
    });

    it('renders circular variant', () => {
        const { container } = render(<LoadingSkeleton variant="circular" />);
        const skeleton = container.querySelector('.rounded-full');
        expect(skeleton).toBeInTheDocument();
    });

    it('renders rectangular variant', () => {
        const { container } = render(<LoadingSkeleton variant="rectangular" />);
        const skeleton = container.querySelector('.rounded-md');
        expect(skeleton).toBeInTheDocument();
    });

    it('renders multiple skeletons when count > 1', () => {
        render(<LoadingSkeleton count={3} />);
        const skeletons = screen.getAllByRole('status');
        expect(skeletons).toHaveLength(3);
    });

    it('applies custom width and height', () => {
        const { container } = render(<LoadingSkeleton width={200} height={50} />);
        const skeleton = container.querySelector('[role="status"]');
        expect(skeleton).toHaveStyle({ width: '200px', height: '50px' });
    });

    it('uses pulse animation by default', () => {
        const { container } = render(<LoadingSkeleton />);
        const skeleton = container.querySelector('.animate-pulse');
        expect(skeleton).toBeInTheDocument();
    });

    it('uses wave animation when specified', () => {
        const { container } = render(<LoadingSkeleton animation="wave" />);
        const skeleton = container.querySelector('.animate-shimmer');
        expect(skeleton).toBeInTheDocument();
    });
});

describe('SkeletonCard', () => {
    it('renders card skeleton', () => {
        const { container } = render(<SkeletonCard />);
        const card = container.querySelector('.rounded-lg');
        expect(card).toBeInTheDocument();
    });
});

describe('SkeletonAvatar', () => {
    it('renders circular avatar skeleton', () => {
        const { container } = render(<SkeletonAvatar />);
        const avatar = container.querySelector('.rounded-full');
        expect(avatar).toBeInTheDocument();
    });

    it('applies custom size', () => {
        const { container } = render(<SkeletonAvatar size={60} />);
        const avatar = container.querySelector('[role="status"]');
        expect(avatar).toHaveStyle({ width: '60px', height: '60px' });
    });
});

describe('SkeletonText', () => {
    it('renders text skeleton lines', () => {
        render(<SkeletonText lines={4} />);
        const skeletons = screen.getAllByRole('status');
        expect(skeletons).toHaveLength(4);
    });

    it('renders 3 lines by default', () => {
        render(<SkeletonText />);
        const skeletons = screen.getAllByRole('status');
        expect(skeletons).toHaveLength(3);
    });
});
