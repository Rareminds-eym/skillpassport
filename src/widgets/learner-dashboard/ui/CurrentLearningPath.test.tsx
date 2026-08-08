import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CurrentLearningPath from './CurrentLearningPath';
import type { CurrentLearningPathProps } from '../model/types';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        h3: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
        p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
        h4: ({ children, ...props }: any) => <h4 {...props}>{children}</h4>,
    },
}));

// Mock Card components 
vi.mock('@/shared/ui/Card', () => ({
    Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardTitle: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

// Mock ProgressBar component
vi.mock('@/shared/ui/ProgressBar', () => ({
    ProgressBar: ({ value, ...props }: any) => (
        <div role="progressbar" aria-valuenow={value} aria-label={`Progress: ${value}%`} {...props}>
            Progress Bar
        </div>
    ),
}));

describe('CurrentLearningPath', () => {
    describe('Null state (no active learning path)', () => {
        it('should render null state with prompt message when path is null', () => {
            const props: CurrentLearningPathProps = {
                path: null,
                onContinue: vi.fn(),
                onChangePath: vi.fn(),
            };

            render(<CurrentLearningPath {...props} />);

            // Check for null state heading and message (Requirement 6.8)
            expect(screen.getByText('No Active Learning Path')).toBeInTheDocument();
            expect(screen.getByText(/Start your learning journey today/i)).toBeInTheDocument();
        });

        it('should render "Explore Learning Paths" button in null state', () => {
            const mockOnChangePath = vi.fn();
            const props: CurrentLearningPathProps = {
                path: null,
                onChangePath: mockOnChangePath,
            };

            render(<CurrentLearningPath {...props} />);

            // Check for explore button
            const exploreButton = screen.getByRole('button', { name: /explore learning paths/i });
            expect(exploreButton).toBeInTheDocument();

            // Click should call onChangePath callback (Requirement 6.9)
            fireEvent.click(exploreButton);
            expect(mockOnChangePath).toHaveBeenCalledTimes(1);
        });

        it('should not render explore button when onChangePath is not provided', () => {
            const props: CurrentLearningPathProps = {
                path: null,
            };

            render(<CurrentLearningPath {...props} />);

            // Button should not be rendered
            expect(screen.queryByRole('button', { name: /explore learning paths/i })).not.toBeInTheDocument();
        });
    });

    describe('Active learning path state', () => {
        const mockPath = {
            id: 'path-1',
            name: 'Full Stack Web Development',
            progress: 66,
            currentModule: 'Build & Deploy a Full Stack Project',
            totalModules: 12,
            completedModules: 8,
            estimatedCompletion: new Date('2024-03-15'),
            skills: ['React', 'Node.js', 'MongoDB', 'Express', 'TypeScript'],
        };

        it('should display learning path name (Requirement 6.1)', () => {
            const props: CurrentLearningPathProps = {
                path: mockPath,
            };

            render(<CurrentLearningPath {...props} />);

            expect(screen.getByText('Full Stack Web Development')).toBeInTheDocument();
        });

        it('should display progress percentage (Requirement 6.2)', () => {
            const props: CurrentLearningPathProps = {
                path: mockPath,
            };

            render(<CurrentLearningPath {...props} />);

            expect(screen.getByText('66%')).toBeInTheDocument();
        });

        it('should display progress bar (Requirement 6.3)', () => {
            const props: CurrentLearningPathProps = {
                path: mockPath,
            };

            render(<CurrentLearningPath {...props} />);

            // ProgressBar component should be rendered
            expect(screen.getByText('Progress')).toBeInTheDocument();
        });

        it('should display completed and total modules count (Requirement 6.4)', () => {
            const props: CurrentLearningPathProps = {
                path: mockPath,
            };

            render(<CurrentLearningPath {...props} />);

            expect(screen.getByText('8 of 12 modules completed')).toBeInTheDocument();
        });

        it('should display formatted estimated completion date (Requirement 6.5)', () => {
            const props: CurrentLearningPathProps = {
                path: mockPath,
            };

            render(<CurrentLearningPath {...props} />);

            // Date should be formatted as "Mar 15, 2024"
            expect(screen.getByText(/Mar 15, 2024/i)).toBeInTheDocument();
        });

        it('should display list of skills covered (Requirement 6.6)', () => {
            const props: CurrentLearningPathProps = {
                path: mockPath,
            };

            render(<CurrentLearningPath {...props} />);

            // Check for Skills Covered heading
            expect(screen.getByText('Skills Covered')).toBeInTheDocument();

            // Check that all skills are displayed as badges
            mockPath.skills.forEach(skill => {
                expect(screen.getByText(skill)).toBeInTheDocument();
            });
        });

        it('should display current module when available', () => {
            const props: CurrentLearningPathProps = {
                path: mockPath,
            };

            render(<CurrentLearningPath {...props} />);

            expect(screen.getByText('Build & Deploy a Full Stack Project')).toBeInTheDocument();
        });

        it('should not display current module when not available', () => {
            const pathWithoutModule = { ...mockPath, currentModule: undefined };
            const props: CurrentLearningPathProps = {
                path: pathWithoutModule,
            };

            render(<CurrentLearningPath {...props} />);

            expect(screen.queryByText(/Current module:/i)).not.toBeInTheDocument();
        });

        it('should render "Continue Learning" button and call callback (Requirement 6.7)', () => {
            const mockOnContinue = vi.fn();
            const props: CurrentLearningPathProps = {
                path: mockPath,
                onContinue: mockOnContinue,
            };

            render(<CurrentLearningPath {...props} />);

            const continueButton = screen.getByRole('button', { name: /continue learning/i });
            expect(continueButton).toBeInTheDocument();

            // Click should navigate to current module
            fireEvent.click(continueButton);
            expect(mockOnContinue).toHaveBeenCalledTimes(1);
        });

        it('should render "Change Path" button and call callback (Requirement 6.9)', () => {
            const mockOnChangePath = vi.fn();
            const props: CurrentLearningPathProps = {
                path: mockPath,
                onChangePath: mockOnChangePath,
            };

            render(<CurrentLearningPath {...props} />);

            const changeButton = screen.getByRole('button', { name: /change.*path/i });
            expect(changeButton).toBeInTheDocument();

            // Click should navigate to paths selection
            fireEvent.click(changeButton);
            expect(mockOnChangePath).toHaveBeenCalledTimes(1);
        });

        it('should not render action buttons when callbacks are not provided', () => {
            const props: CurrentLearningPathProps = {
                path: mockPath,
            };

            render(<CurrentLearningPath {...props} />);

            expect(screen.queryByRole('button', { name: /continue learning/i })).not.toBeInTheDocument();
            expect(screen.queryByRole('button', { name: /change.*path/i })).not.toBeInTheDocument();
        });

        it('should show motivational message when progress is >= 75%', () => {
            const highProgressPath = { ...mockPath, progress: 85 };
            const props: CurrentLearningPathProps = {
                path: highProgressPath,
            };

            render(<CurrentLearningPath {...props} />);

            expect(screen.getByText(/Amazing progress! You're almost there/i)).toBeInTheDocument();
        });

        it('should not show motivational message when progress is < 75%', () => {
            const lowProgressPath = { ...mockPath, progress: 50 };
            const props: CurrentLearningPathProps = {
                path: lowProgressPath,
            };

            render(<CurrentLearningPath {...props} />);

            expect(screen.queryByText(/Amazing progress/i)).not.toBeInTheDocument();
        });
    });

    describe('Edge cases', () => {
        it('should handle path with no skills', () => {
            const pathWithoutSkills = {
                id: 'path-2',
                name: 'Basic Programming',
                progress: 30,
                totalModules: 5,
                completedModules: 1,
                skills: [],
            };

            const props: CurrentLearningPathProps = {
                path: pathWithoutSkills,
            };

            render(<CurrentLearningPath {...props} />);

            // Skills section should not be rendered
            expect(screen.queryByText('Skills Covered')).not.toBeInTheDocument();
        });

        it('should handle path with 0% progress', () => {
            const zeroProgressPath = {
                id: 'path-3',
                name: 'Getting Started',
                progress: 0,
                totalModules: 10,
                completedModules: 0,
                skills: ['Basics'],
            };

            const props: CurrentLearningPathProps = {
                path: zeroProgressPath,
            };

            render(<CurrentLearningPath {...props} />);

            expect(screen.getByText('0%')).toBeInTheDocument();
            expect(screen.getByText('0 of 10 modules completed')).toBeInTheDocument();
        });

        it('should handle path with 100% progress', () => {
            const completeProgressPath = {
                id: 'path-4',
                name: 'Completed Course',
                progress: 100,
                totalModules: 8,
                completedModules: 8,
                skills: ['Complete'],
            };

            const props: CurrentLearningPathProps = {
                path: completeProgressPath,
            };

            render(<CurrentLearningPath {...props} />);

            expect(screen.getByText('100%')).toBeInTheDocument();
            expect(screen.getByText('8 of 8 modules completed')).toBeInTheDocument();
        });

        it('should format date correctly for single-digit days', () => {
            const pathWithEarlyDate = {
                id: 'path-5',
                name: 'Test Path',
                progress: 40,
                totalModules: 5,
                completedModules: 2,
                estimatedCompletion: new Date('2024-01-05'),
                skills: [],
            };

            const props: CurrentLearningPathProps = {
                path: pathWithEarlyDate,
            };

            render(<CurrentLearningPath {...props} />);

            expect(screen.getByText(/Jan 5, 2024/i)).toBeInTheDocument();
        });

        it('should display "Not available" when no estimated completion date', () => {
            const pathWithoutDate = {
                id: 'path-6',
                name: 'Flexible Path',
                progress: 50,
                totalModules: 6,
                completedModules: 3,
                skills: [],
            };

            const props: CurrentLearningPathProps = {
                path: pathWithoutDate,
            };

            render(<CurrentLearningPath {...props} />);

            // Estimated completion section should not be rendered
            expect(screen.queryByText(/Est. completion:/i)).not.toBeInTheDocument();
        });

        it('should round progress percentage to nearest integer', () => {
            const pathWithDecimalProgress = {
                id: 'path-7',
                name: 'Decimal Progress Path',
                progress: 66.7,
                totalModules: 10,
                completedModules: 7,
                skills: [],
            };

            const props: CurrentLearningPathProps = {
                path: pathWithDecimalProgress,
            };

            render(<CurrentLearningPath {...props} />);

            // Should round to 67%
            expect(screen.getByText('67%')).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have proper ARIA labels for buttons', () => {
            const mockPath = {
                id: 'path-1',
                name: 'Test Path',
                progress: 50,
                totalModules: 10,
                completedModules: 5,
                skills: [],
            };

            const props: CurrentLearningPathProps = {
                path: mockPath,
                onContinue: vi.fn(),
                onChangePath: vi.fn(),
            };

            render(<CurrentLearningPath {...props} />);

            const continueButton = screen.getByRole('button', { name: /continue learning current path/i });
            expect(continueButton).toHaveAttribute('aria-label');

            const changeButton = screen.getByRole('button', { name: /change learning path/i });
            expect(changeButton).toHaveAttribute('aria-label');
        });

        it('should have proper ARIA label for explore button in null state', () => {
            const props: CurrentLearningPathProps = {
                path: null,
                onChangePath: vi.fn(),
            };

            render(<CurrentLearningPath {...props} />);

            const exploreButton = screen.getByRole('button', { name: /explore learning paths/i });
            expect(exploreButton).toHaveAttribute('aria-label');
        });
    });
});
