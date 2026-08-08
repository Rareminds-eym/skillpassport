/**
 * Unit Tests for CareerAITools Component
 * 
 * Tests Requirements 4.1-4.11:
 * - Grid layout rendering
 * - Tool card display
 * - Premium indicators
 * - Access control
 * - Navigation behavior
 * - Upgrade prompts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { CareerAITools } from './CareerAITools';
import { CAREER_TOOLS } from '@/entities/opportunity/model/types';
import type { CareerAIToolsProps } from '../model/types';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>
    }
}));

describe('CareerAITools Component', () => {
    const mockOnToolSelect = vi.fn();

    const defaultProps: CareerAIToolsProps = {
        tools: CAREER_TOOLS,
        onToolSelect: mockOnToolSelect,
        userAccess: {
            hasAIAccess: true,
            remainingCredits: 10,
            planType: 'pro'
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderComponent = (props: Partial<CareerAIToolsProps> = {}) => {
        return render(
            <BrowserRouter>
                <CareerAITools {...defaultProps} {...props} />
            </BrowserRouter>
        );
    };

    describe('Requirement 4.1: Display grid of 7 AI-powered career tools', () => {
        it('should render all 7 career tools', () => {
            renderComponent();

            // Check that all 7 tools are rendered
            expect(screen.getByText('Skill Gap Analysis')).toBeInTheDocument();
            expect(screen.getByText('Resume Review')).toBeInTheDocument();
            expect(screen.getByText('Interview Prep')).toBeInTheDocument();
            expect(screen.getByText('Learning Path')).toBeInTheDocument();
            expect(screen.getByText('Networking Tips')).toBeInTheDocument();
            expect(screen.getByText('Career Guidance')).toBeInTheDocument();
            expect(screen.getByText('Career Advice')).toBeInTheDocument();
        });

        it('should display grid with proper structure', () => {
            const { container } = renderComponent();

            // Check for grid container
            const gridContainer = container.querySelector('.grid');
            expect(gridContainer).toBeInTheDocument();
            expect(gridContainer?.classList.contains('grid-cols-1')).toBe(true);
            expect(gridContainer?.classList.contains('md:grid-cols-2')).toBe(true);
            expect(gridContainer?.classList.contains('lg:grid-cols-3')).toBe(true);
        });
    });

    describe('Tool Card Display', () => {
        it('should display tool icon, name, description, and category', () => {
            renderComponent();

            const skillGapTool = CAREER_TOOLS.find(t => t.id === 'skill-gap')!;

            // Check tool name
            expect(screen.getByText(skillGapTool.name)).toBeInTheDocument();

            // Check description
            expect(screen.getByText(skillGapTool.description)).toBeInTheDocument();

            // Check category badge
            expect(screen.getByText(skillGapTool.category)).toBeInTheDocument();
        });

        it('should display estimated time when available', () => {
            renderComponent();

            // Multiple tools have estimated time (use getAllByText for multiple matches)
            const tenMinElements = screen.getAllByText('10 mins');
            expect(tenMinElements.length).toBeGreaterThan(0);

            const fifteenMinElements = screen.getAllByText('15 mins');
            expect(fifteenMinElements.length).toBeGreaterThan(0);
        });
    });

    describe('Requirement 4.10: Display premium indicator for subscription tools', () => {
        it('should show crown icon for premium tools when user has access', () => {
            const { container } = renderComponent();

            // Premium tools: resume-review, interview-prep, career-advice
            const crownIcons = container.querySelectorAll('svg[class*="lucide-crown"]');

            // Should have crown icons for premium tools with access
            expect(crownIcons.length).toBeGreaterThan(0);
        });

        it('should show lock icon for premium tools when user lacks access', () => {
            const { container } = renderComponent({
                userAccess: {
                    hasAIAccess: false,
                    planType: 'free'
                }
            });

            // Should show lock icons for premium tools without access
            const lockIcons = container.querySelectorAll('svg[class*="lucide-lock"]');

            // Premium tools count: resume-review, interview-prep, career-advice = 3
            expect(lockIcons.length).toBeGreaterThanOrEqual(3);
        });

        it('should apply opacity to locked tools', () => {
            const { container } = renderComponent({
                userAccess: {
                    hasAIAccess: false,
                    planType: 'free'
                }
            });

            // Find cards with opacity-75 class (locked state)
            const lockedCards = container.querySelectorAll('.opacity-75');
            expect(lockedCards.length).toBeGreaterThan(0);
        });
    });

    describe('Requirement 4.9: Navigate to corresponding tool page on click', () => {
        it('should navigate to tool path when non-premium tool is clicked', () => {
            renderComponent();

            const skillGapTool = screen.getByText('Skill Gap Analysis');
            fireEvent.click(skillGapTool);

            expect(mockOnToolSelect).toHaveBeenCalledWith('skill-gap');
            expect(mockNavigate).toHaveBeenCalledWith('/learner/career-ai/skill-gap');
        });

        it('should navigate to tool path when premium tool is clicked and user has access', () => {
            renderComponent();

            const resumeTool = screen.getByText('Resume Review');
            fireEvent.click(resumeTool);

            expect(mockOnToolSelect).toHaveBeenCalledWith('resume-review');
            expect(mockNavigate).toHaveBeenCalledWith('/learner/career-ai/resume');
        });

        it('should call onToolSelect callback on tool click', () => {
            renderComponent();

            const tool = screen.getByText('Career Guidance');
            fireEvent.click(tool);

            expect(mockOnToolSelect).toHaveBeenCalledWith('career-guidance');
            expect(mockOnToolSelect).toHaveBeenCalledTimes(1);
        });
    });

    describe('Requirement 4.11: Show upgrade prompt for premium tools without access', () => {
        it('should show upgrade prompt when clicking premium tool without access', async () => {
            renderComponent({
                userAccess: {
                    hasAIAccess: false,
                    planType: 'free'
                }
            });

            const resumeTool = screen.getByText('Resume Review');
            fireEvent.click(resumeTool);

            // Should NOT navigate
            expect(mockNavigate).not.toHaveBeenCalled();

            // Should show upgrade prompt
            await waitFor(() => {
                expect(screen.getByText('Premium Feature')).toBeInTheDocument();
            });
        });

        it('should display upgrade prompt with tool name and benefits', async () => {
            renderComponent({
                userAccess: {
                    hasAIAccess: false,
                    planType: 'free'
                }
            });

            const interviewTool = screen.getByText('Interview Prep');
            fireEvent.click(interviewTool);

            await waitFor(() => {
                expect(screen.getByText('Premium Feature')).toBeInTheDocument();
                expect(screen.getByText(/Interview Prep is a premium feature/)).toBeInTheDocument();
                expect(screen.getByText('Premium includes:')).toBeInTheDocument();
            });
        });

        it('should close upgrade prompt when "Maybe Later" is clicked', async () => {
            renderComponent({
                userAccess: {
                    hasAIAccess: false,
                    planType: 'free'
                }
            });

            // Open prompt
            const tool = screen.getByText('Resume Review');
            fireEvent.click(tool);

            await waitFor(() => {
                expect(screen.getByText('Premium Feature')).toBeInTheDocument();
            });

            // Close prompt
            const maybeLaterBtn = screen.getByText('Maybe Later');
            fireEvent.click(maybeLaterBtn);

            await waitFor(() => {
                expect(screen.queryByText('Premium Feature')).not.toBeInTheDocument();
            });
        });

        it('should navigate to subscription page when "Upgrade Now" is clicked', async () => {
            renderComponent({
                userAccess: {
                    hasAIAccess: false,
                    planType: 'free'
                }
            });

            // Open prompt
            const tool = screen.getByText('Career Advice');
            fireEvent.click(tool);

            await waitFor(() => {
                expect(screen.getByText('Premium Feature')).toBeInTheDocument();
            });

            // Click upgrade
            const upgradeBtn = screen.getByText('Upgrade Now');
            fireEvent.click(upgradeBtn);

            expect(mockNavigate).toHaveBeenCalledWith('/learner/subscription');
        });
    });

    describe('User Access Display', () => {
        it('should display remaining credits when user has AI access', () => {
            renderComponent({
                userAccess: {
                    hasAIAccess: true,
                    remainingCredits: 25,
                    planType: 'pro'
                }
            });

            expect(screen.getByText('25 credits')).toBeInTheDocument();
        });

        it('should not display credits when user lacks AI access', () => {
            renderComponent({
                userAccess: {
                    hasAIAccess: false,
                    planType: 'free'
                }
            });

            expect(screen.queryByText(/credits/)).not.toBeInTheDocument();
        });

        it('should not display credits when remainingCredits is undefined', () => {
            renderComponent({
                userAccess: {
                    hasAIAccess: true,
                    planType: 'pro'
                    // remainingCredits not provided
                }
            });

            expect(screen.queryByText(/credits/)).not.toBeInTheDocument();
        });
    });

    describe('Category-based Styling', () => {
        it('should apply correct colors for assessment category', () => {
            const { container } = renderComponent();

            const assessmentBadges = Array.from(container.querySelectorAll('.bg-blue-100'));
            expect(assessmentBadges.length).toBeGreaterThan(0);
        });

        it('should apply correct colors for preparation category', () => {
            const { container } = renderComponent();

            const preparationBadges = Array.from(container.querySelectorAll('.bg-purple-100'));
            expect(preparationBadges.length).toBeGreaterThan(0);
        });

        it('should apply correct colors for guidance category', () => {
            const { container } = renderComponent();

            const guidanceBadges = Array.from(container.querySelectorAll('.bg-indigo-100'));
            expect(guidanceBadges.length).toBeGreaterThan(0);
        });
    });

    describe('Analytics Tracking', () => {
        it('should track tool click analytics when gtag is available', () => {
            const mockGtag = vi.fn();
            (window as any).gtag = mockGtag;

            renderComponent();

            const tool = screen.getByText('Skill Gap Analysis');
            fireEvent.click(tool);

            expect(mockGtag).toHaveBeenCalledWith('event', 'career_tool_click', {
                tool_id: 'skill-gap',
                tool_name: 'Skill Gap Analysis',
                has_access: true
            });

            delete (window as any).gtag;
        });

        it('should not crash if gtag is not available', () => {
            renderComponent();

            const tool = screen.getByText('Networking Tips');

            // Should not throw error
            expect(() => fireEvent.click(tool)).not.toThrow();
            expect(mockNavigate).toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty tools array', () => {
            renderComponent({ tools: [] });

            // Should render without error
            expect(screen.getByText('AI Career Tools')).toBeInTheDocument();
        });

        it('should handle tools without estimated time', () => {
            const toolsWithoutTime = CAREER_TOOLS.map(t => ({
                ...t,
                estimatedTime: undefined
            }));

            renderComponent({ tools: toolsWithoutTime });

            // Should render without errors
            expect(screen.getByText('Skill Gap Analysis')).toBeInTheDocument();
        });

        it('should handle missing icon gracefully', () => {
            const toolsWithInvalidIcon = [{
                ...CAREER_TOOLS[0],
                icon: 'invalid-icon-name'
            }];

            // Should not throw error and fall back to default icon (Target)
            expect(() => renderComponent({ tools: toolsWithInvalidIcon })).not.toThrow();
        });
    });

    describe('Accessibility', () => {
        it('should have proper heading structure', () => {
            renderComponent();

            const heading = screen.getByText('AI Career Tools');
            expect(heading.tagName).toBe('H2');
        });

        it('should have clickable cards', () => {
            const { container } = renderComponent();

            const cards = container.querySelectorAll('.cursor-pointer');
            expect(cards.length).toBe(7);
        });
    });

    describe('Requirements Validation', () => {
        it('validates Requirement 4.2: Skill Gap Analysis tool navigates correctly', () => {
            renderComponent();

            const tool = screen.getByText('Skill Gap Analysis');
            fireEvent.click(tool);

            expect(mockNavigate).toHaveBeenCalledWith('/learner/career-ai/skill-gap');
        });

        it('validates Requirement 4.3: Resume Review tool navigates correctly', () => {
            renderComponent();

            const tool = screen.getByText('Resume Review');
            fireEvent.click(tool);

            expect(mockNavigate).toHaveBeenCalledWith('/learner/career-ai/resume');
        });

        it('validates Requirement 4.4: Interview Prep tool navigates correctly', () => {
            renderComponent();

            const tool = screen.getByText('Interview Prep');
            fireEvent.click(tool);

            expect(mockNavigate).toHaveBeenCalledWith('/learner/career-ai/interview');
        });

        it('validates Requirement 4.5: Learning Path tool navigates correctly', () => {
            renderComponent();

            const tool = screen.getByText('Learning Path');
            fireEvent.click(tool);

            expect(mockNavigate).toHaveBeenCalledWith('/learner/career-ai/path');
        });

        it('validates Requirement 4.6: Networking Tips tool navigates correctly', () => {
            renderComponent();

            const tool = screen.getByText('Networking Tips');
            fireEvent.click(tool);

            expect(mockNavigate).toHaveBeenCalledWith('/learner/career-ai/networking');
        });

        it('validates Requirement 4.7: Career Guidance tool navigates correctly', () => {
            renderComponent();

            const tool = screen.getByText('Career Guidance');
            fireEvent.click(tool);

            expect(mockNavigate).toHaveBeenCalledWith('/learner/career-ai/guidance');
        });

        it('validates Requirement 4.8: Career Advice tool navigates correctly', () => {
            renderComponent();

            const tool = screen.getByText('Career Advice');
            fireEvent.click(tool);

            expect(mockNavigate).toHaveBeenCalledWith('/learner/career-ai/advice');
        });
    });
});
