import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CurrentLearningPath from './CurrentLearningPath';
import type { CurrentLearningPathProps } from '../model/types';

describe('CurrentLearningPath', () => {
    const mockOnContinue = vi.fn();
    const mockOnChangePath = vi.fn();

    const defaultProps: CurrentLearningPathProps = {
        path: {
            id: 'path-1',
            name: 'Full Stack Web Development',
            progress: 66,
            currentModule: 'Build & Deploy a Full Stack Project',
            totalModules: 12,
            completedModules: 8,
            estimatedCompletion: new Date('2024-06-15'),
            skills: ['React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'],
        },
        onContinue: mockOnContinue,
        onChangePath: mockOnChangePath,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render without errors with valid path data', () => {
            render(<CurrentLearningPath {...defaultProps} />);
            expect(screen.getByText('Current Learning Path')).toBeInTheDocument();
        });

        it('should display the component title and subtitle', () => {
            render(<CurrentLearningPath {...defaultProps} />);
            expect(screen.getByText('Current Learning Path')).toBeInTheDocument();
            expect(screen.getByText('Track your progress')).toBeInTheDocument();
        });
    });

    describe('Learning Path Name Display (Requirement 6.1)', () => {
        it('should display learning path name', () => {
            render(<CurrentLearningPath {...defaultProps} />);
            expect(screen.getByText('Full Stack Web Development')).toBeInTheDocument();
        });

        it('should display current module name if available', () => {
            render(<CurrentLearningPath {...defaultProps} />);
            expect(screen.getByText(/Current: Build & Deploy a Full Stack Project/)).toBeInTheDocument();
        });

        it('should not display current module text when currentModule is undefined', () => {
            const props: CurrentLearningPathProps = {
                ...defaultProps,
                path: {
                    ...defaultProps.path!,
                    currentModule: undefined,
                },
            };
            render(<CurrentLearningPath {...props} />);
            expect(screen.queryByText(/Current:/)).not.toBeInTheDocument();
        });
    });

    describe('Progress Display (Requirement 6.2, 6.3)', () => {
        it('should display progress percentage (0-100)', () => {
            render(<CurrentLearningPath {...defaultProps} />);
            expect(screen.getByText('66% Complete')).toBeInTheDocument();
        });

        it('should display progress bar visualizing completion', () => {
            const { container } = render(<CurrentLearningPath {...defaultProps} />);
            // Check for progress bar element
            const progressBar = container.querySelector('[role="progressbar"]');
            expect(progressBar).toBeInTheDocument();
            expect(progressBar).toHaveAttribute('aria-valuenow', '66');
        });

        it('should round progress percentage correctly', () => {
            const props: CurrentLearningPathProps = {
                ...defaultProps,
                path: {
                    ...defaultProps.path!,
                    progress: 66.7,
                },
            };
            render(<CurrentLearningPath {...props} />);
            expect(screen.getByText('67% Complete')).toBeInTheDocument();
        });

        it('should handle 0% progress', () => {
            const props: CurrentLearningPathProps = {
                ...defaultProps,
                path: {
                    ...defaultProps.path!,
                    progress: 0,
                    completedModules: 0,
                },
            };
            render(<CurrentLearningPath {...props} />);
            expect(screen.getByText('0% Complete')).toBeInTheDocument();
        });

        it('should handle 100% progress', () => {
            const props: CurrentLearningPathProps = {
                ...defaultProps,
                path: {
                    ...defaultProps.path!,
                    progress: 100,
                    completedModules: 12,
                },
            };
            render(<CurrentLearningPath {...props} />);
            expect(screen.getByText('100% Complete')).toBeInTheDocument();
        });
    });

    describe('Modules Count Display (Requirement 6.4)', () => {
        it('should display completed modules and total modules count', () => {
            render(<CurrentLearningPath {...defaultProps} />);
            expect(screen.getByText('8 of 12 modules completed')).toBeInTheDocument();
        });

        it('should display remaining modules count', () => {
            render(<CurrentLearningPath {...defaultProps} />);
            expect(screen.getByText('4 remaining')).toBeInTheDocument();
        });

        it('should not display remaining count when all modules completed', () => {
            const props: CurrentLearningPathProps = {
                ...defaultProps,
                path: {
                    ...defaultProps.path!,
                    progress: 100,
                    completedModules: 12,
                },
            };
            render(<CurrentLearningPath {...props} />);
            expect(screen.queryByText(/remaining/)).not.toBeInTheDocument();
        });

        it('should handle zero completed modules', () => {
            const props: CurrentLearningPathProps = {
                ...defaultProps,
                path: {
                    ...defaultProps.path!,
                    progress: 0,
                    completedModules: 0,
                },
            };
            render(<CurrentLearningPath {...props} />);
            expect(screen.getByText('0 of 12 modules completed')).toBeInTheDocument();
        });
    });

    describe('Estimated Completion Date Display (Requirement 6.5)', () => {
        it('should show estimated completion date formatted', () => {
            render(<CurrentLearningPath {...defaultProps} />);
            expect(screen.getByText(/Jun 15, 2024/)).toBeInTheDocument();
        });

        it('should display "Est. Completion" label', () => {
            render(<CurrentLearningPath {...defaultProps} />);
            expect(screen.getByText('Est. Completion')).toBeInTheDocument();
        });

        it('should not display completion date when not available', () => {
            const props: CurrentLearningPathProps = {
                ...defaultProps,
                path: {
                    ...defaultProps.path!,
                    estimatedCompletion: undefined,
                },
            };
            render(<CurrentLearningPath {...props} />);
            expect(screen.queryByText('Est. Completion')).not.toBeInTheDocument();
        });

        it('should format date correctly for different months', () => {
            const props: CurrentLearningPathProps = {
                ...defaultProps,
                path: {
                    ...defaultProps.path!,
                    estimatedCompletion: new Date('2024-12-25'),
                },
            };
            render(<CurrentLearningPath {...props} />);
            expect(screen.getByText(/Dec 25, 2024/)).toBeInTheDocument();
        });
    });

    describe('Skills Display (Requirement 6.6)', () => {
        it('should display list of skills covered in the path', () => {
            render(<CurrentLearningPath {...defaultProps} />);
            expect(screen.getByText('Skills You'll Learn')).toBeInTheDocument();
            expect(screen.getByText('React')).toBeInTheDocument();
            expect(screen.getByText('Node.js')).toBeInTheDocument();
            expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
            expect(screen.getByText('Docker')).toBeInTheDocument();
            expect(screen.getByText('AWS')).toBeInTheDocument();
        });

        it('should not display skills section when skills array is empty', () => {
            const props: CurrentLearningPathProps = {
                ...defaultProps,
                path: {
                    ...defaultProps.path!,
                    skills: [],
                },
            };
            render(<CurrentLearningPath {...props} />);
            expect(screen.queryByText('Skills You'll Learn')).not.toBeInTheDocument();
        });

        it('should handle single skill', () => {
            const props: CurrentLearningPathProps = {
                ...defaultProps,
                path: {
                    ...defaultProps.path!,
                    skills: ['Python'],
                },
            };
            render(<CurrentLearningPath {...props} />);
            expect(screen.getByText('Python')).toBeInTheDocument();
        });

        it('should display all skills when many are provided', () => {
            const skills = ['Skill1', 'Skill2', 'Skill3', 'Skill4', 'Skill5', 'Skill6', 'Skill7'];
            const props: CurrentLearningPathProps = {
                ...defaultProps,
                path: {
                    ...defaultProps.path!,
                    skills,
                },
            };
            render(<CurrentLearningPath {...props} />);
            skills.forEach(skill => {
                expect(screen.getByText(skill)).toBeInTheDocument();
            });
        });
    });

    describe('Continue Learning Button (Requirement 6.7)', () => {
        it('should add "Continue Learning" button with onContinue callback', () => {
            render(<CurrentLearningPath {...defaultProps} />);
            expect(screen.getByText('Continue Learning')).toBeInTheDocument();
        });

        it('should call onContinue callback when button clicked', () => {
            render(<CurrentLearningPath {...defaultProps} />);
            const button = screen.getByText('Continue Learning');
            fireEvent.click(button);
            expect(mockOnContinue).toHaveBeenCalledTimes(1);
        });

        it('should not render Continue Learning button when callback not provided', () => {
            const props: CurrentLearningPathProps = {
                ...defaultProps,
                onContinue: undefined,
            };
            render(<CurrentLearningPath {...props} />);
            expect(screen.queryByText('Continue Learning')).not.toBeInTheDocument();
        });
    });

    describe('Change Path Button (Requirement 6.9)', () => {
        it('should add "Change Path" button with onChangePath callback', () => {
            render(<CurrentLearningPath {...defaultProps} />);
            expect(screen.getByText('Change Path')).toBeInTheDocument();
        });

        it('should call onChangePath callback when button clicked', () => {
            render(<CurrentLearningPath {...defaultProps} />);
            const button = screen.getByText('Change Path');
            fireEvent.click(button);
            expect(mockOnChangePath).toHaveBeenCalledTimes(1);
        });

        it('should not render Change Path button when callback not provided', () => {
            const props: CurrentLearningPathProps = {
                ...defaultProps,
                onChangePath: undefined,
            };
            render(<CurrentLearningPath {...props} />);
            expect(screen.queryByText('Change Path')).not.toBeInTheDocument();
        });
    });

    describe('Null Path Handling (Requirement 6.8)', () => {
        it('should display prompt to explore paths when path is null', () => {
            const props: CurrentLearningPathProps = {
                path: null,
                onChangePath: mockOnChangePath,
            };
            render(<CurrentLearningPath {...props} />);
            expect(screen.getByText('Start Your Learning Journey')).toBeInTheDocument();
            expect(screen.getByText(/Explore personalized learning paths/)).toBeInTheDocument();
        });

        it('should display "Explore Learning Paths" button when path is null', () => {
            const props: CurrentLearningPathProps = {
                path: null,
                onChangePath: mockOnChangePath,
            };
            render(<CurrentLearningPath {...props} />);
            expect(screen.getByText('Explore Learning Paths')).toBeInTheDocument();
        });

        it('should call onChangePath when Explore button clicked in null state', () => {
            const props: CurrentLearningPathProps = {
                path: null,
                onChangePath: mockOnChangePath,
            };
            render(<CurrentLearningPath {...props} />);
            const button = screen.getByText('Explore Learning Paths');
            fireEvent.click(button);
            expect(mockOnChangePath).toHaveBeenCalledTimes(1);
        });

        it('should not display active path content when path is null', () => {
            const props: CurrentLearningPathProps = {
                path: null,
            };
            render(<CurrentLearningPath {...props} />);
            expect(screen.queryByText('Current Learning Path')).not.toBeInTheDocument();
            expect(screen.queryByText(/modules completed/)).not.toBeInTheDocument();
        });

        it('should not render Explore button when onChangePath is not provided and path is null', () => {
            const props: CurrentLearningPathProps = {
                path: null,
                onChangePath: undefined,
            };
            render(<CurrentLearningPath {...props} />);
            expect(screen.queryByText('Explore Learning Paths')).not.toBeInTheDocument();
        });
    });

    describe('Motivational Messages', () => {
        it('should display motivational message when progress >= 80% and < 100%', () => {
            const props: CurrentLearningPathProps = {
                ...defaultProps,
                path: {
                    ...defaultProps.path!,
                    progress: 85,
                },
            };
            render(<CurrentLearningPath {...props} />);
            expect(screen.getByText(/You're almost there! Just 15% to go!/)).toBeInTheDocument();
        });

        it('should not display motivational message when progress < 80%', () => {
            const props: CurrentLearningPathProps = {
                ...defaultProps,
                path: {
                    ...defaultProps.path!,
                    progress: 75,
                },
            };
            render(<CurrentLearningPath {...props} />);
            expect(screen.queryByText(/You're almost there!/)).not.toBeInTheDocument();
        });

        it('should display completion celebration when progress = 100%', () => {
            const props: CurrentLearningPathProps = {
                ...defaultProps,
                path: {
                    ...defaultProps.path!,
                    progress: 100,
                    completedModules: 12,
                },
            };
            render(<CurrentLearningPath {...props} />);
            expect(screen.getByText(/Congratulations! You've completed this learning path!/)).toBeInTheDocument();
        });

        it('should not display motivational message when progress = 100%', () => {
            const props: CurrentLearningPathProps = {
                ...defaultProps,
                path: {
                    ...defaultProps.path!,
                    progress: 100,
                },
            };
            render(<CurrentLearningPath {...props} />);
            expect(screen.queryByText(/You're almost there!/)).not.toBeInTheDocument();
        });
    });

    describe('Progress Badge Color Coding', () => {
        it('should display success badge for progress >= 75%', () => {
            const props: CurrentLearningPathProps = {
                ...defaultProps,
                path: {
                    ...defaultProps.path!,
                    progress: 80,
                },
            };
            const { container } = render(<CurrentLearningPath {...props} />);
            const badge = container.querySelector('.bg-green-500');
            expect(badge).toBeInTheDocument();
        });

        it('should display info badge for progress >= 50% and < 75%', () => {
            const props: CurrentLearningPathProps = {
                ...defaultProps,
                path: {
                    ...defaultProps.path!,
                    progress: 60,
                },
            };
            const { container } = render(<CurrentLearningPath {...props} />);
            const badge = container.querySelector('.bg-blue-500');
            expect(badge).toBeInTheDocument();
        });

        it('should display warning badge for progress < 50%', () => {
            const props: CurrentLearningPathProps = {
                ...defaultProps,
                path: {
                    ...defaultProps.path!,
                    progress: 30,
                },
            };
            const { container } = render(<CurrentLearningPath {...props} />);
            const badge = container.querySelector('.bg-yellow-500');
            expect(badge).toBeInTheDocument();
        });
    });

    describe('Card Layout and Styling (Requirements)', () => {
        it('should render in card layout', () => {
            const { container } = render(<CurrentLearningPath {...defaultProps} />);
            const card = container.querySelector('.rounded-xl.border');
            expect(card).toBeInTheDocument();
        });

        it('should have gradient background', () => {
            const { container } = render(<CurrentLearningPath {...defaultProps} />);
            const card = container.querySelector('.bg-gradient-to-br');
            expect(card).toBeInTheDocument();
        });

        it('should have decorative top border', () => {
            const { container } = render(<CurrentLearningPath {...defaultProps} />);
            const border = container.querySelector('.bg-gradient-to-r.from-indigo-400');
            expect(border).toBeInTheDocument();
        });

        it('should have visual progress bar', () => {
            const { container } = render(<CurrentLearningPath {...defaultProps} />);
            const progressBar = container.querySelector('[role="progressbar"]');
            expect(progressBar).toBeInTheDocument();
        });
    });

    describe('Responsive Design', () => {
        it('should render stats in grid layout', () => {
            const { container } = render(<CurrentLearningPath {...defaultProps} />);
            const grid = container.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2');
            expect(grid).toBeInTheDocument();
        });

        it('should render action buttons in responsive grid', () => {
            const { container } = render(<CurrentLearningPath {...defaultProps} />);
            // Look for button container grid
            const buttonGrid = Array.from(container.querySelectorAll('.grid')).find(
                el => el.querySelector('button')
            );
            expect(buttonGrid).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have proper heading structure', () => {
            render(<CurrentLearningPath {...defaultProps} />);
            expect(screen.getByText('Current Learning Path')).toBeInTheDocument();
        });

        it('should have clickable buttons when callbacks provided', () => {
            render(<CurrentLearningPath {...defaultProps} />);
            const continueButton = screen.getByRole('button', { name: /Continue Learning/i });
            const changeButton = screen.getByRole('button', { name: /Change Path/i });
            expect(continueButton).toBeInTheDocument();
            expect(changeButton).toBeInTheDocument();
        });

        it('should have progress bar with proper ARIA attributes', () => {
            const { container } = render(<CurrentLearningPath {...defaultProps} />);
            const progressBar = container.querySelector('[role="progressbar"]');
            expect(progressBar).toHaveAttribute('aria-valuenow', '66');
            expect(progressBar).toHaveAttribute('aria-valuemin', '0');
            expect(progressBar).toHaveAttribute('aria-valuemax', '100');
        });
    });

    describe('Edge Cases', () => {
        it('should handle path with minimal data', () => {
            const props: CurrentLearningPathProps = {
                path: {
                    id: 'path-1',
                    name: 'Basic Path',
                    progress: 0,
                    totalModules: 5,
                    completedModules: 0,
                    skills: [],
                },
            };
            render(<CurrentLearningPath {...props} />);
            expect(screen.getByText('Basic Path')).toBeInTheDocument();
            expect(screen.getByText('0% Complete')).toBeInTheDocument();
        });

        it('should handle large module counts', () => {
            const props: CurrentLearningPathProps = {
                ...defaultProps,
                path: {
                    ...defaultProps.path!,
                    totalModules: 100,
                    completedModules: 50,
                    progress: 50,
                },
            };
            render(<CurrentLearningPath {...props} />);
            expect(screen.getByText('50 of 100 modules completed')).toBeInTheDocument();
        });

        it('should handle very long path names', () => {
            const props: CurrentLearningPathProps = {
                ...defaultProps,
                path: {
                    ...defaultProps.path!,
                    name: 'Advanced Full Stack Development with Modern Technologies and Cloud Infrastructure',
                },
            };
            render(<CurrentLearningPath {...props} />);
            expect(screen.getByText(/Advanced Full Stack Development/)).toBeInTheDocument();
        });
    });
});
