/**
 * Property-Based Test: Course Card Data Completeness
 *
 * **Feature: rag-course-recommendations, Property 8: Course Card Data Completeness**
 * **Validates: Requirements 4.2**
 *
 * Property: For any recommended course displayed, the rendered output SHALL contain
 * the course title, duration, at least one skill, and a numeric match percentage.
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CourseRecommendationCard from '../CourseRecommendationCard';

// Mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

/**
 * Generator for a valid recommended course with all required fields
 */
const recommendedCourseArbitrary = fc.record({
  course_id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
  code: fc.string({ minLength: 2, maxLength: 20 }),
  description: fc.string({ minLength: 0, maxLength: 500 }),
  duration: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
  category: fc.string({ minLength: 1, maxLength: 50 }),
  skills: fc.array(
    fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
    { minLength: 1, maxLength: 10 }
  ),
  target_outcomes: fc.array(fc.string({ minLength: 1, maxLength: 100 }), {
    minLength: 0,
    maxLength: 5,
  }),
  relevance_score: fc.integer({ min: 0, max: 100 }),
  match_reasons: fc.array(fc.string({ minLength: 1, maxLength: 200 }), {
    minLength: 0,
    maxLength: 3,
  }),
  skill_gaps_addressed: fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
    minLength: 0,
    maxLength: 5,
  }),
});

/**
 * Wrapper component to provide router context
 */
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Property 8: Course Card Data Completeness', () => {
  it('should display course title for any valid course', () => {
    fc.assert(
      fc.property(recommendedCourseArbitrary, (course) => {
        // @ts-expect-error - Auto-suppressed for migration
        const { container } = renderWithRouter(<CourseRecommendationCard course={course} />);

        // Property: The rendered output SHALL contain the course title
        expect(container.textContent).toContain(course.title);
      }),
      { numRuns: 100 }
    );
  });

  it('should display duration for any valid course', () => {
    fc.assert(
      fc.property(recommendedCourseArbitrary, (course) => {
        // @ts-expect-error - Auto-suppressed for migration
        const { container } = renderWithRouter(<CourseRecommendationCard course={course} />);

        // Property: The rendered output SHALL contain the duration
        expect(container.textContent).toContain(course.duration);
      }),
      { numRuns: 100 }
    );
  });

  it('should display at least one skill for any course with skills', () => {
    fc.assert(
      fc.property(recommendedCourseArbitrary, (course) => {
        // @ts-expect-error - Auto-suppressed for migration
        const { container } = renderWithRouter(<CourseRecommendationCard course={course} />);

        // Property: The rendered output SHALL contain at least one skill
        // The component displays up to 3 skills
        const displayedSkills = course.skills.slice(0, 3);
        const hasAtLeastOneSkill = displayedSkills.some((skill) =>
          container.textContent?.includes(skill)
        );

        expect(hasAtLeastOneSkill).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should display numeric match percentage for any valid course', () => {
    fc.assert(
      fc.property(recommendedCourseArbitrary, (course) => {
        // @ts-expect-error - Auto-suppressed for migration
        const { container } = renderWithRouter(<CourseRecommendationCard course={course} />);

        // Property: The rendered output SHALL contain a numeric match percentage
        // The component displays relevance_score as "{score}%"
        const expectedPercentage = `${Math.round(course.relevance_score)}%`;
        expect(container.textContent).toContain(expectedPercentage);
      }),
      { numRuns: 100 }
    );
  });

  it('should contain all required data elements for any valid course', () => {
    fc.assert(
      fc.property(recommendedCourseArbitrary, (course) => {
        // @ts-expect-error - Auto-suppressed for migration
        const { container } = renderWithRouter(<CourseRecommendationCard course={course} />);

        const content = container.textContent || '';

        // Property: ALL required elements must be present
        // 1. Title
        expect(content).toContain(course.title);

        // 2. Duration
        expect(content).toContain(course.duration);

        // 3. At least one skill
        const displayedSkills = course.skills.slice(0, 3);
        const hasAtLeastOneSkill = displayedSkills.some((skill) => content.includes(skill));
        expect(hasAtLeastOneSkill).toBe(true);

        // 4. Numeric match percentage
        const expectedPercentage = `${Math.round(course.relevance_score)}%`;
        expect(content).toContain(expectedPercentage);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle edge case of 0% match percentage', () => {
    const course = {
      course_id: 'test-course-1',
      title: 'Test Course',
      code: 'TC001',
      description: 'A test course',
      duration: '4 weeks',
      category: 'Technology',
      skills: ['JavaScript'],
      target_outcomes: ['Build web apps'],
      relevance_score: 0,
      match_reasons: [],
      skill_gaps_addressed: [],
    };

    // @ts-expect-error - Auto-suppressed for migration
    const { container } = renderWithRouter(<CourseRecommendationCard course={course} />);

    // Property: 0% should be displayed correctly
    expect(container.textContent).toContain('0%');
    expect(container.textContent).toContain(course.title);
    expect(container.textContent).toContain(course.duration);
    expect(container.textContent).toContain('JavaScript');
  });

  it('should handle edge case of 100% match percentage', () => {
    const course = {
      course_id: 'test-course-2',
      title: 'Perfect Match Course',
      code: 'PMC001',
      description: 'A perfectly matching course',
      duration: '8 weeks',
      category: 'Technology',
      skills: ['React', 'TypeScript'],
      target_outcomes: ['Master frontend'],
      relevance_score: 100,
      match_reasons: ['Perfect skill match'],
      skill_gaps_addressed: ['Frontend Development'],
    };

    // @ts-expect-error - Auto-suppressed for migration
    const { container } = renderWithRouter(<CourseRecommendationCard course={course} />);

    // Property: 100% should be displayed correctly
    expect(container.textContent).toContain('100%');
    expect(container.textContent).toContain(course.title);
    expect(container.textContent).toContain(course.duration);
    expect(container.textContent).toContain('React');
  });

  it('should display remaining skills count when more than 3 skills exist', () => {
    fc.assert(
      fc.property(
        fc.record({
          course_id: fc.uuid(),
          title: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
          code: fc.string({ minLength: 2, maxLength: 20 }),
          description: fc.string({ minLength: 0, maxLength: 500 }),
          duration: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
          category: fc.string({ minLength: 1, maxLength: 50 }),
          // Generate courses with more than 3 skills
          skills: fc.array(
            fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
            { minLength: 4, maxLength: 10 }
          ),
          target_outcomes: fc.array(fc.string({ minLength: 1, maxLength: 100 }), {
            minLength: 0,
            maxLength: 5,
          }),
          relevance_score: fc.integer({ min: 0, max: 100 }),
          match_reasons: fc.array(fc.string({ minLength: 1, maxLength: 200 }), {
            minLength: 0,
            maxLength: 3,
          }),
          skill_gaps_addressed: fc.array(fc.string({ minLength: 1, maxLength: 50 }), {
            minLength: 0,
            maxLength: 5,
          }),
        }),
        (course) => {
          // @ts-expect-error - Auto-suppressed for migration
          const { container } = renderWithRouter(<CourseRecommendationCard course={course} />);

          const content = container.textContent || '';

          // Property: When more than 3 skills exist, show "+X more" indicator
          const remainingCount = course.skills.length - 3;
          expect(content).toContain(`+${remainingCount} more`);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should render match percentage as an integer', () => {
    fc.assert(
      fc.property(recommendedCourseArbitrary, (course) => {
        // @ts-expect-error - Auto-suppressed for migration
        const { container } = renderWithRouter(<CourseRecommendationCard course={course} />);

        const content = container.textContent || '';

        // Property: Match percentage should be displayed as an integer
        // The component displays the relevance_score rounded to an integer with % suffix
        const expectedPercentage = Math.round(course.relevance_score);

        // Verify the expected percentage is present in the content
        expect(content).toContain(`${expectedPercentage}%`);

        // Verify the percentage is a valid integer between 0 and 100
        expect(Number.isInteger(expectedPercentage)).toBe(true);
        expect(expectedPercentage).toBeGreaterThanOrEqual(0);
        expect(expectedPercentage).toBeLessThanOrEqual(100);
      }),
      { numRuns: 100 }
    );
  });
});
