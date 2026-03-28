/**
 * Property-Based Test: Profile Text Completeness
 * 
 * **Feature: rag-course-recommendations, Property 3: Profile Text Completeness**
 * **Validates: Requirements 2.1, 2.2**
 * 
 * Property: For any valid assessment result containing skill gaps and career clusters,
 * the generated profile text SHALL contain all priority skill gap names and at least
 * the top career cluster title.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { buildProfileText } from '../courseRecommendationService';

/**
 * Generator for a single skill gap item with a skill name
 */
const skillGapItemArbitrary = fc.record({
  skill: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  currentLevel: fc.integer({ min: 1, max: 10 }),
  targetLevel: fc.integer({ min: 1, max: 10 })
});

/**
 * Generator for a career cluster with title and optional domains
 */
const careerClusterArbitrary = fc.record({
  title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  fit: fc.constantFrom('High', 'Medium', 'Low'),
  domains: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 5 }),
  roles: fc.record({
    entry: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 3 })
  })
});

/**
 * Generator for valid assessment results with skill gaps and career clusters
 * This represents the minimum valid input for buildProfileText
 */
const validAssessmentResultsArbitrary = fc.record({
  skillGap: fc.record({
    priorityA: fc.array(skillGapItemArbitrary, { minLength: 1, maxLength: 5 }),
    priorityB: fc.array(skillGapItemArbitrary, { minLength: 0, maxLength: 5 }),
    currentStrengths: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 5 }),
    recommendedTrack: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined })
  }),
  careerFit: fc.record({
    clusters: fc.array(careerClusterArbitrary, { minLength: 1, maxLength: 5 })
  }),
  employability: fc.option(fc.record({
    improvementAreas: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 5 }),
    strengthAreas: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 5 })
  }), { nil: undefined }),
  riasec: fc.option(fc.record({
    code: fc.string({ minLength: 3, maxLength: 6 })
  }), { nil: undefined }),
  stream: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined })
});

/**
 * Generator for assessment results with only skill gaps (no career clusters)
 */
const skillGapOnlyAssessmentArbitrary = fc.record({
  skillGap: fc.record({
    priorityA: fc.array(skillGapItemArbitrary, { minLength: 1, maxLength: 5 }),
    priorityB: fc.array(skillGapItemArbitrary, { minLength: 0, maxLength: 5 }),
    currentStrengths: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 5 }),
    recommendedTrack: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined })
  })
});

/**
 * Generator for assessment results with only career clusters (no skill gaps)
 */
const careerClusterOnlyAssessmentArbitrary = fc.record({
  careerFit: fc.record({
    clusters: fc.array(careerClusterArbitrary, { minLength: 1, maxLength: 5 })
  })
});

describe('Property 3: Profile Text Completeness', () => {
  
  it('should contain all priority A skill gap names in the profile text', async () => {
    await fc.assert(
      fc.property(
        validAssessmentResultsArbitrary,
        (assessmentResults) => {
          const profileText = buildProfileText(assessmentResults);
          
          // Property: All priority A skill names must appear in the profile text
          const priorityASkills = assessmentResults.skillGap.priorityA;
          
          for (const skillItem of priorityASkills) {
            const skillName = skillItem.skill.trim();
            if (skillName.length > 0) {
              expect(profileText).toContain(skillName);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should contain the top career cluster title in the profile text', async () => {
    await fc.assert(
      fc.property(
        validAssessmentResultsArbitrary,
        (assessmentResults) => {
          const profileText = buildProfileText(assessmentResults);
          
          // Property: The top career cluster title must appear in the profile text
          const topCluster = assessmentResults.careerFit.clusters[0];
          const clusterTitle = topCluster.title.trim();
          
          if (clusterTitle.length > 0) {
            expect(profileText).toContain(clusterTitle);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should contain all priority B skill gap names when present', async () => {
    await fc.assert(
      fc.property(
        validAssessmentResultsArbitrary.filter(ar => 
          ar.skillGap.priorityB && ar.skillGap.priorityB.length > 0
        ),
        (assessmentResults) => {
          const profileText = buildProfileText(assessmentResults);
          
          // Property: All priority B skill names must appear in the profile text
          const priorityBSkills = assessmentResults.skillGap.priorityB;
          
          for (const skillItem of priorityBSkills) {
            const skillName = skillItem.skill.trim();
            if (skillName.length > 0) {
              expect(profileText).toContain(skillName);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce valid profile text with only skill gaps (no career clusters)', async () => {
    await fc.assert(
      fc.property(
        skillGapOnlyAssessmentArbitrary,
        (assessmentResults) => {
          const profileText = buildProfileText(assessmentResults);
          
          // Property: Profile text should be non-empty and contain skill gap info
          expect(profileText.length).toBeGreaterThan(0);
          
          // Should contain at least one priority A skill
          const priorityASkills = assessmentResults.skillGap.priorityA;
          const hasAtLeastOneSkill = priorityASkills.some(s => 
            s.skill.trim().length > 0 && profileText.includes(s.skill.trim())
          );
          expect(hasAtLeastOneSkill).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce valid profile text with only career clusters (no skill gaps)', async () => {
    await fc.assert(
      fc.property(
        careerClusterOnlyAssessmentArbitrary,
        (assessmentResults) => {
          const profileText = buildProfileText(assessmentResults);
          
          // Property: Profile text should be non-empty and contain career cluster info
          expect(profileText.length).toBeGreaterThan(0);
          
          // Should contain the top career cluster title
          const topCluster = assessmentResults.careerFit.clusters[0];
          if (topCluster.title.trim().length > 0) {
            expect(profileText).toContain(topCluster.title.trim());
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include employability improvement areas when present', async () => {
    const assessmentWithEmployability = validAssessmentResultsArbitrary.filter(ar =>
      ar.employability && 
      ar.employability.improvementAreas && 
      ar.employability.improvementAreas.length > 0 &&
      ar.employability.improvementAreas.some(a => a.trim().length > 0)
    );

    await fc.assert(
      fc.property(
        assessmentWithEmployability,
        (assessmentResults) => {
          const profileText = buildProfileText(assessmentResults);
          
          // Property: Employability improvement areas should appear in profile text
          const improvementAreas = assessmentResults.employability!.improvementAreas;
          
          for (const area of improvementAreas) {
            const trimmedArea = area.trim();
            if (trimmedArea.length > 0) {
              expect(profileText).toContain(trimmedArea);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should weight skill gaps and career clusters as primary factors (appear first)', async () => {
    await fc.assert(
      fc.property(
        validAssessmentResultsArbitrary,
        (assessmentResults) => {
          const profileText = buildProfileText(assessmentResults);
          
          // Property: Skill gaps section should appear before employability section (Requirement 2.2)
          // We check for section headers rather than individual values to avoid false positives
          // from single characters appearing in other parts of the text
          
          const skillSectionIndex = profileText.indexOf('Priority Skills to Develop:');
          const careerSectionIndex = profileText.indexOf('Career Interests:');
          const employabilitySectionIndex = profileText.indexOf('Areas to Improve:');
          
          // Skill gaps section should exist and appear first (if present)
          if (skillSectionIndex >= 0) {
            // If employability section exists, skill gaps should appear before it
            if (employabilitySectionIndex >= 0) {
              expect(skillSectionIndex).toBeLessThan(employabilitySectionIndex);
            }
          }
          
          // Career section should appear before employability section (if both present)
          if (careerSectionIndex >= 0 && employabilitySectionIndex >= 0) {
            expect(careerSectionIndex).toBeLessThan(employabilitySectionIndex);
          }
          
          // Verify that priority A skills are actually in the profile text
          const priorityASkill = assessmentResults.skillGap.priorityA[0]?.skill?.trim();
          if (priorityASkill && priorityASkill.length > 0) {
            expect(profileText).toContain(priorityASkill);
          }
          
          // Verify that top career cluster is in the profile text
          const topClusterTitle = assessmentResults.careerFit.clusters[0]?.title?.trim();
          if (topClusterTitle && topClusterTitle.length > 0) {
            expect(profileText).toContain(topClusterTitle);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should throw error for null or undefined assessment results', () => {
    // Property: buildProfileText should throw for invalid input
    expect(() => buildProfileText(null as any)).toThrow('Assessment results are required');
    expect(() => buildProfileText(undefined as any)).toThrow('Assessment results are required');
  });

  it('should throw error for assessment results with no skill gaps or career clusters', () => {
    // Property: buildProfileText should throw when no meaningful data exists
    expect(() => buildProfileText({})).toThrow('Assessment results must contain skill gaps or career clusters');
    expect(() => buildProfileText({ skillGap: {}, careerFit: {} })).toThrow('Assessment results must contain skill gaps or career clusters');
  });
});
