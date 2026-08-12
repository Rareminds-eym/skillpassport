/**
 * AI Job Matching Algorithm
 * 
 * This module implements AI-powered job matching that compares learner skills
 * with job opportunities to provide personalized job recommendations with match scores.
 * 
 * Algorithm:
 * 1. Compare learner skills with required job skills
 * 2. Calculate skill match score (80% weight): (matchedSkills / requiredSkills) * 100 * 0.8
 * 3. Calculate proficiency bonus (20% weight): avgProficiency * 0.2
 * 4. Compute final match score, capped at 100
 * 5. Filter jobs with match score >= 40%
 * 6. Generate match reasons based on matched skills
 * 7. Identify skills gap (required but not possessed)
 * 8. Sort by match score descending
 * 9. Return top 10 results
 * 
 * **Validates Requirements**: 11.1-11.10, 7.4-7.6
 * 
 * @module shared/lib/calculations/aiMatching
 */

import type { Opportunity, AIMatchedJob } from '../../../entities/opportunity/model/types';
import type { SkillDataExtended } from '../../../entities/learner/model/types';

/**
 * Type alias for SkillData to match the task requirements
 * Uses SkillDataExtended which has proficiency property
 */
type SkillData = SkillDataExtended;

/**
 * Matches job opportunities with learner skills using AI-powered algorithm
 * 
 * **Preconditions:**
 * - `opportunities` is a valid array (may be empty)
 * - `learnerSkills` is a valid array (may be empty)
 * - Each opportunity has `requiredSkills` array property
 * - Each skill has valid `proficiency` (0-100) and `skillName` properties
 * 
 * **Postconditions:**
 * - Returns array of AIMatchedJob with match scores between 40-100
 * - Results are sorted by match score in descending order
 * - Returns maximum of 10 results
 * - Each result includes matchScore, matchReasons, skillsMatched, and skillsGap
 * - Empty opportunities or skills arrays return empty array
 * 
 * **Algorithm:**
 * 1. Filter jobs with required skills
 * 2. For each job:
 *    a. Match learner skills with required skills (case-insensitive)
 *    b. Calculate skill match score: (matchedSkills / requiredSkills) * 100 * 0.8
 *    c. Calculate proficiency bonus: avgProficiency of matched skills * 0.2
 *    d. Compute final match score = skillMatchScore + proficiencyBonus
 *    e. Cap match score at 100
 * 3. Filter results where matchScore >= 40
 * 4. Generate match reasons (e.g., "Strong match in JavaScript")
 * 5. Calculate skills gap (required skills not in learner's skill set)
 * 6. Sort by match score descending
 * 7. Return top 10
 * 
 * @param opportunities - Array of job/internship opportunities with requiredSkills
 * @param learnerSkills - Array of learner skills with proficiency levels
 * @returns Array of up to 10 AI-matched jobs sorted by match score (highest first)
 * 
 * @example
 * ```typescript
 * const opportunities: Opportunity[] = [
 *   {
 *     id: '1',
 *     title: 'Frontend Developer',
 *     company: 'TechCorp',
 *     location: 'Remote',
 *     employmentType: 'full-time',
 *     postedDate: new Date(),
 *     requiredSkills: ['JavaScript', 'React', 'TypeScript', 'CSS']
 *   }
 * ];
 * 
 * const learnerSkills: SkillData[] = [
 *   {
 *     learnerId: 'L123',
 *     skillId: 'S1',
 *     skillName: 'JavaScript',
 *     category: 'technical',
 *     proficiency: 85,
 *     verified: true,
 *     lastAssessed: new Date(),
 *     assessmentSource: 'test',
 *     healthStatus: 'healthy',
 *     trend: 'up',
 *     recommendations: [],
 *     createdAt: new Date(),
 *     updatedAt: new Date()
 *   },
 *   {
 *     learnerId: 'L123',
 *     skillId: 'S2',
 *     skillName: 'React',
 *     category: 'technical',
 *     proficiency: 78,
 *     verified: true,
 *     lastAssessed: new Date(),
 *     assessmentSource: 'project',
 *     healthStatus: 'healthy',
 *     trend: 'stable',
 *     recommendations: [],
 *     createdAt: new Date(),
 *     updatedAt: new Date()
 *   }
 * ];
 * 
 * const matched = matchOpportunitiesWithAI(opportunities, learnerSkills);
 * // Returns: [{
 * //   ...opportunity,
 * //   matchScore: 61, // (2/4 * 100 * 0.8) + ((85+78)/2 * 0.2) = 40 + 16.3 ≈ 56.3
 * //   matchReasons: ['Strong match in JavaScript', 'Experience with React'],
 * //   skillsMatched: ['JavaScript', 'React'],
 * //   skillsGap: ['TypeScript', 'CSS'],
 * //   isAIRecommended: true
 * // }]
 * ```
 */
export function matchOpportunitiesWithAI(
    opportunities: (Opportunity & { requiredSkills?: string[] })[],
    learnerSkills: SkillData[]
): AIMatchedJob[] {
    // Handle edge cases - ensure inputs are arrays
    if (!Array.isArray(opportunities) || opportunities.length === 0) {
        return [];
    }

    if (!Array.isArray(learnerSkills) || learnerSkills.length === 0) {
        return [];
    }

    // Create a map of learner skills for quick lookup (case-insensitive)
    const skillMap = new Map<string, SkillData>();
    learnerSkills.forEach(skill => {
        const normalizedName = skill.skillName.toLowerCase().trim();
        skillMap.set(normalizedName, skill);
    });

    // Process each opportunity
    const matchedJobs: AIMatchedJob[] = [];

    for (const opportunity of opportunities) {
        // Skip opportunities without required skills or if requiredSkills is not an array
        if (!Array.isArray(opportunity.requiredSkills) || opportunity.requiredSkills.length === 0) {
            continue;
        }

        const requiredSkills = opportunity.requiredSkills;
        const matchedSkills: string[] = [];
        const matchedSkillProficiencies: number[] = [];
        const skillsGap: string[] = [];

        // Match learner skills with required skills
        for (const requiredSkill of requiredSkills) {
            const normalizedRequired = requiredSkill.toLowerCase().trim();
            const learnerSkill = skillMap.get(normalizedRequired);

            if (learnerSkill) {
                matchedSkills.push(requiredSkill); // Use original casing from job
                matchedSkillProficiencies.push(learnerSkill.proficiency);
            } else {
                skillsGap.push(requiredSkill);
            }
        }

        // Calculate match score
        const skillMatchPercentage = (matchedSkills.length / requiredSkills.length) * 100;
        const skillMatchScore = skillMatchPercentage * 0.8;

        // Calculate proficiency bonus (average proficiency of matched skills)
        const avgProficiency = matchedSkillProficiencies.length > 0
            ? matchedSkillProficiencies.reduce((sum, prof) => sum + prof, 0) / matchedSkillProficiencies.length
            : 0;
        const proficiencyBonus = avgProficiency * 0.2;

        // Compute final match score, capped at 100
        const matchScore = Math.min(Math.round(skillMatchScore + proficiencyBonus), 100);

        // Filter jobs with match score >= 40%
        if (matchScore < 40) {
            continue;
        }

        // Generate match reasons
        const matchReasons = generateMatchReasons(matchedSkills, matchedSkillProficiencies, skillMatchPercentage);

        // Create AIMatchedJob object
        const matchedJob: AIMatchedJob = {
            ...opportunity,
            matchScore,
            matchReasons,
            skillsMatched: matchedSkills,
            skillsGap,
            isAIRecommended: true
        };

        matchedJobs.push(matchedJob);
    }

    // Sort by match score descending
    matchedJobs.sort((a, b) => b.matchScore - a.matchScore);

    // Return top 10 results
    return matchedJobs.slice(0, 10);
}

/**
 * Generates human-readable match reasons based on matched skills and proficiencies
 * 
 * @param matchedSkills - Array of skill names that matched
 * @param proficiencies - Array of proficiency levels for matched skills
 * @param matchPercentage - Overall skill match percentage
 * @returns Array of match reason strings
 * 
 * @internal
 */
function generateMatchReasons(
    matchedSkills: string[],
    proficiencies: number[],
    matchPercentage: number
): string[] {
    const reasons: string[] = [];

    // Overall match quality reason
    if (matchPercentage >= 75) {
        reasons.push('Excellent skills match for this position');
    } else if (matchPercentage >= 50) {
        reasons.push('Good skills alignment with job requirements');
    } else {
        reasons.push('Partial skills match with growth potential');
    }

    // Highlight top skills (proficiency > 80)
    const strongSkills = matchedSkills.filter((_, idx) => proficiencies[idx] > 80);
    if (strongSkills.length > 0) {
        if (strongSkills.length === 1) {
            reasons.push(`Strong expertise in ${strongSkills[0]}`);
        } else if (strongSkills.length === 2) {
            reasons.push(`Strong expertise in ${strongSkills[0]} and ${strongSkills[1]}`);
        } else {
            reasons.push(`Strong expertise in ${strongSkills[0]}, ${strongSkills[1]}, and ${strongSkills.length - 2} more`);
        }
    }

    // Highlight matched skills (proficiency 60-80)
    const goodSkills = matchedSkills.filter((_, idx) => proficiencies[idx] >= 60 && proficiencies[idx] <= 80);
    if (goodSkills.length > 0 && strongSkills.length < 2) {
        if (goodSkills.length === 1) {
            reasons.push(`Solid experience with ${goodSkills[0]}`);
        } else {
            reasons.push(`Solid experience with ${goodSkills.slice(0, 2).join(' and ')}`);
        }
    }

    // Limit to 3-4 reasons for readability
    return reasons.slice(0, 4);
}
