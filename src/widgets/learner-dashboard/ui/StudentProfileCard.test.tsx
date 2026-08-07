import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StudentProfileCard from './StudentProfileCard';
import type { StudentProfileCardProps } from '../model/types';

// Mock the QR code utility
vi.mock('@/shared/lib/utils/qrCode', () => ({
    generateProfileQRCodeSync: vi.fn((learnerId, onSuccess) => {
        // Simulate successful QR code generation
        setTimeout(() => {
            onSuccess('data:image/png;base64,mockQRCode');
        }, 0);
    }),
}));

// Mock the calculation utility (not directly used in component, but imported)
vi.mock('@/shared/lib/calculations/enrollability', () => ({
    calculateEnrollabilityScore: vi.fn(),
}));

describe('StudentProfileCard', () => {
    const mockLearnerData: StudentProfileCardProps['learnerData'] = {
        id: 'learner-123',
        name: 'John Doe',
        email: 'john.doe@university.edu',
        avatar: 'https://example.com/avatar.jpg',
        collegeId: 'COLL-2024-001',
        collegeName: 'Stanford University',
        linkRangeId: 'LR-2024-001',
        program: 'B.Tech Computer Science',
        semester: 5,
        enrollabilityScore: 78,
        grade: 'UG',
    };

    it('should render without errors with complete learner data', () => {
        render(<StudentProfileCard learnerData={mockLearnerData} />);

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john.doe@university.edu')).toBeInTheDocument();
        expect(screen.getByText('Stanford University')).toBeInTheDocument();
    });

    it('should display college ID correctly', () => {
        render(<StudentProfileCard learnerData={mockLearnerData} />);

        expect(screen.getByText(/College ID: COLL-2024-001/)).toBeInTheDocument();
    });

    it('should display link range ID when provided', () => {
        render(<StudentProfileCard learnerData={mockLearnerData} />);

        expect(screen.getByText(/Link Range ID: LR-2024-001/)).toBeInTheDocument();
    });

    it('should not display link range ID when not provided', () => {
        const dataWithoutLinkRange = { ...mockLearnerData, linkRangeId: undefined };
        render(<StudentProfileCard learnerData={dataWithoutLinkRange} />);

        expect(screen.queryByText(/Link Range ID:/)).not.toBeInTheDocument();
    });

    it('should display program and semester badges', () => {
        render(<StudentProfileCard learnerData={mockLearnerData} />);

        expect(screen.getByText('B.Tech Computer Science')).toBeInTheDocument();
        expect(screen.getByText('Semester 5')).toBeInTheDocument();
        expect(screen.getByText('UG')).toBeInTheDocument();
    });

    it('should display enrollability score with correct percentage', () => {
        render(<StudentProfileCard learnerData={mockLearnerData} />);

        // Score appears twice (in header and in circular progress)
        const scoreElements = screen.getAllByText('78%');
        expect(scoreElements.length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Enrollability Score')).toBeInTheDocument();
    });

    it('should display "Good" status for score 78', () => {
        render(<StudentProfileCard learnerData={mockLearnerData} />);

        expect(screen.getByText('Good')).toBeInTheDocument();
    });

    it('should display "Excellent" status for score >= 85', () => {
        const excellentScoreData = { ...mockLearnerData, enrollabilityScore: 90 };
        render(<StudentProfileCard learnerData={excellentScoreData} />);

        expect(screen.getByText('Excellent')).toBeInTheDocument();
    });

    it('should display "Average" status for score between 50-69', () => {
        const averageScoreData = { ...mockLearnerData, enrollabilityScore: 60 };
        render(<StudentProfileCard learnerData={averageScoreData} />);

        expect(screen.getByText('Average')).toBeInTheDocument();
    });

    it('should display "Needs Improvement" status for score < 50', () => {
        const lowScoreData = { ...mockLearnerData, enrollabilityScore: 40 };
        render(<StudentProfileCard learnerData={lowScoreData} />);

        expect(screen.getByText('Needs Improvement')).toBeInTheDocument();
    });

    it('should call onViewProfile when "View Full Profile" button is clicked', async () => {
        const user = userEvent.setup();
        const mockOnViewProfile = vi.fn();

        render(
            <StudentProfileCard
                learnerData={mockLearnerData}
                onViewProfile={mockOnViewProfile}
            />
        );

        const viewProfileButton = screen.getByRole('button', { name: /View Full Profile/i });
        await user.click(viewProfileButton);

        expect(mockOnViewProfile).toHaveBeenCalledTimes(1);
    });

    it('should not render "View Full Profile" button when onViewProfile is not provided', () => {
        render(<StudentProfileCard learnerData={mockLearnerData} />);

        expect(screen.queryByRole('button', { name: /View Full Profile/i })).not.toBeInTheDocument();
    });

    it('should render default avatar icon when avatar URL is not provided', () => {
        const dataWithoutAvatar = { ...mockLearnerData, avatar: undefined };
        render(<StudentProfileCard learnerData={dataWithoutAvatar} />);

        // The component should render, just without the img tag
        expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should generate and display QR code', async () => {
        render(<StudentProfileCard learnerData={mockLearnerData} />);

        // Wait for QR code to be generated
        await waitFor(() => {
            const qrImage = screen.getByAltText('Profile QR Code');
            expect(qrImage).toBeInTheDocument();
            expect(qrImage).toHaveAttribute('src', 'data:image/png;base64,mockQRCode');
        });
    });

    it('should display passport ID below QR code', () => {
        render(<StudentProfileCard learnerData={mockLearnerData} />);

        expect(screen.getByText(/PASSPORT-ID: COLL-2024-001/)).toBeInTheDocument();
    });

    describe('Score Color Coding', () => {
        it('should apply green color for excellent score (>=85)', () => {
            const { container } = render(
                <StudentProfileCard learnerData={{ ...mockLearnerData, enrollabilityScore: 90 }} />
            );

            // Check for green-related classes in the DOM
            expect(container.querySelector('.text-green-600')).toBeInTheDocument();
        });

        it('should apply blue color for good score (70-84)', () => {
            const { container } = render(
                <StudentProfileCard learnerData={{ ...mockLearnerData, enrollabilityScore: 75 }} />
            );

            // Check for blue-related classes in the DOM
            expect(container.querySelector('.text-blue-600')).toBeInTheDocument();
        });

        it('should apply amber/yellow color for average score (50-69)', () => {
            const { container } = render(
                <StudentProfileCard learnerData={{ ...mockLearnerData, enrollabilityScore: 55 }} />
            );

            // Check for amber-related classes in the DOM
            expect(container.querySelector('.text-amber-600')).toBeInTheDocument();
        });

        it('should apply red color for needs improvement score (<50)', () => {
            const { container } = render(
                <StudentProfileCard learnerData={{ ...mockLearnerData, enrollabilityScore: 35 }} />
            );

            // Check for red-related classes in the DOM
            expect(container.querySelector('.text-red-600')).toBeInTheDocument();
        });
    });
});
