/**
 * Profile Builder
 * Builds composite text representation of student profile from assessment results.
 */

import { getDomainKeywordsWithCache } from './fieldDomainService.js';

/**
 * Build a composite text representation of the student's profile
 * from assessment results for embedding generation.
 *
 * Includes skill gaps, career clusters, and employability areas
 * with skill gaps and career clusters weighted as primary factors.
 *
 * @param {Object} assessmentResults - Assessment results from AI analysis
 * @returns {Promise<string>} - Composite profile text for embedding
 *
 * Requirements: 2.1, 2.2
 */
export const buildProfileText = async (assessmentResults) => {
  if (!assessmentResults) {
    throw new Error('Assessment results are required');
  }

  const parts = [];

  // Priority 0: Field of Study (Highest Priority for domain-specific matching)
  // Add field-specific context at the beginning to strongly influence embedding
  const stream = assessmentResults.stream || assessmentResults.branch_field;
  if (stream) {
    parts.push(`Student Field of Study: ${stream}`);

    // Generate domain-specific keywords using AI service
    // This works for ALL fields, not just hardcoded ones
    try {
      console.log(`[Profile Builder] Fetching domain keywords for: "${stream}"`);
      const domainKeywords = await getDomainKeywordsWithCache(stream);
      if (domainKeywords) {
        parts.push(`Domain Focus: ${domainKeywords}`);
        console.log(`[Profile Builder] ✅ Domain keywords added to profile`);
      } else {
        console.warn(`[Profile Builder] ⚠️ No domain keywords returned for "${stream}"`);
        console.log(`[Profile Builder] → Continuing with LAYER 4 (Other Profile Factors)`);
      }
    } catch (error) {
      console.error(
        `[Profile Builder] ❌ LAYER 4 (Graceful Degradation) - Failed to generate domain keywords:`,
        error.message
      );
      console.log(
        `[Profile Builder] → Continuing without domain keywords, using career clusters and skill gaps`
      );
      // Continue without domain keywords rather than failing
    }
  }

  // Priority 1: Skill Gaps (Primary Factor - Requirement 2.2)
  const skillGap = assessmentResults.skillGap;
  if (skillGap) {
    // Priority A skills (most important)
    if (skillGap.priorityA && Array.isArray(skillGap.priorityA) && skillGap.priorityA.length > 0) {
      const priorityASkills = skillGap.priorityA
        .map((s) => s.skill)
        .filter(Boolean)
        .join(', ');
      if (priorityASkills) {
        parts.push(`Priority Skills to Develop: ${priorityASkills}`);
      }
    }

    // Priority B skills (secondary)
    if (skillGap.priorityB && Array.isArray(skillGap.priorityB) && skillGap.priorityB.length > 0) {
      const priorityBSkills = skillGap.priorityB
        .map((s) => s.skill)
        .filter(Boolean)
        .join(', ');
      if (priorityBSkills) {
        parts.push(`Secondary Skills to Develop: ${priorityBSkills}`);
      }
    }

    // Current strengths
    if (
      skillGap.currentStrengths &&
      Array.isArray(skillGap.currentStrengths) &&
      skillGap.currentStrengths.length > 0
    ) {
      parts.push(`Current Strengths: ${skillGap.currentStrengths.join(', ')}`);
    }

    // Recommended learning track
    if (skillGap.recommendedTrack) {
      parts.push(`Recommended Learning Track: ${skillGap.recommendedTrack}`);
    }
  }

  // Priority 2: Career Clusters (Primary Factor - Requirement 2.2)
  const careerFit = assessmentResults.careerFit;
  if (careerFit && careerFit.clusters && Array.isArray(careerFit.clusters)) {
    // Get top career cluster (highest fit)
    const topClusters = careerFit.clusters.filter((c) => c && c.title).slice(0, 3); // Top 3 clusters

    if (topClusters.length > 0) {
      const clusterTitles = topClusters.map((c) => c.title).join(', ');
      parts.push(`Career Interests: ${clusterTitles}`);

      // Add domains from top cluster
      const topCluster = topClusters[0];
      if (
        topCluster.domains &&
        Array.isArray(topCluster.domains) &&
        topCluster.domains.length > 0
      ) {
        parts.push(`Target Domains: ${topCluster.domains.join(', ')}`);
      }

      // Add entry-level roles from top cluster
      if (topCluster.roles && topCluster.roles.entry && Array.isArray(topCluster.roles.entry)) {
        parts.push(`Target Roles: ${topCluster.roles.entry.join(', ')}`);
      }
    }
  }

  // Priority 3: Employability Areas
  const employability = assessmentResults.employability;
  if (employability) {
    // Improvement areas
    if (
      employability.improvementAreas &&
      Array.isArray(employability.improvementAreas) &&
      employability.improvementAreas.length > 0
    ) {
      parts.push(`Areas to Improve: ${employability.improvementAreas.join(', ')}`);
    }

    // Strength areas
    if (
      employability.strengthAreas &&
      Array.isArray(employability.strengthAreas) &&
      employability.strengthAreas.length > 0
    ) {
      parts.push(`Employability Strengths: ${employability.strengthAreas.join(', ')}`);
    }
  }

  // Additional context: RIASEC code
  const riasec = assessmentResults.riasec;
  if (riasec && riasec.code) {
    parts.push(`RIASEC Profile: ${riasec.code}`);
  }

  // Additional context: Aptitude strengths
  const aptitude = assessmentResults.aptitude;
  if (aptitude && aptitude.topStrengths && Array.isArray(aptitude.topStrengths)) {
    parts.push(`Aptitude Strengths: ${aptitude.topStrengths.join(', ')}`);
  }

  if (parts.length === 0) {
    throw new Error('Assessment results must contain skill gaps or career clusters');
  }

  return parts.join('\n\n');
};
