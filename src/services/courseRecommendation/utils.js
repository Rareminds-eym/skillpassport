/**
 * Course Recommendation Utilities
 * Helper functions for parsing, scoring, and matching.
 */

/**
 * Parse embedding from database format to array.
 * Handles both string format '[0.1, 0.2, ...]' and array format.
 *
 * @param {string|Array} embedding - Embedding in database format
 * @returns {number[]|null} - Parsed embedding array or null
 */
export const parseEmbedding = (embedding) => {
  if (!embedding) return null;

  // If already an array, return as-is
  if (Array.isArray(embedding)) return embedding;

  // If string, parse it
  if (typeof embedding === 'string') {
    try {
      // Handle pgvector format: '[0.1,0.2,...]'
      const parsed = JSON.parse(embedding);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Try parsing without JSON (raw pgvector format)
      try {
        const cleaned = embedding.replace(/[\[\]]/g, '');
        return cleaned.split(',').map(Number);
      } catch {
        console.warn('Failed to parse embedding:', embedding.substring(0, 50));
        return null;
      }
    }
  }

  return null;
};

/**
 * Calculate relevance score from cosine similarity.
 * Converts similarity (-1 to 1) to percentage (0 to 100).
 *
 * @param {number} similarity - Cosine similarity value
 * @returns {number} - Relevance score 0-100
 *
 * Requirements: 3.4
 */
export const calculateRelevanceScore = (similarity) => {
  // Cosine similarity ranges from -1 to 1
  // Convert to 0-100 scale where 1 = 100, 0 = 50, -1 = 0
  const score = Math.round(((similarity + 1) / 2) * 100);
  // Clamp to 0-100 range
  return Math.max(0, Math.min(100, score));
};

/**
 * Generate match reasons based on course and profile data.
 *
 * @param {Object} course - Course object
 * @param {Object} assessmentResults - Assessment results
 * @returns {string[]} - Array of match reasons
 */
export const generateMatchReasons = (course, assessmentResults) => {
  const reasons = [];

  const courseSkills = course.skills || [];
  const skillGap = assessmentResults.skillGap;

  if (skillGap) {
    // Check priority A skills
    const priorityASkills = (skillGap.priorityA || []).map((s) => s.skill?.toLowerCase());
    const matchedPriorityA = courseSkills.filter((s) =>
      priorityASkills.some((ps) => ps && s.toLowerCase().includes(ps))
    );
    if (matchedPriorityA.length > 0) {
      reasons.push(`Addresses priority skill: ${matchedPriorityA[0]}`);
    }

    // Check priority B skills
    const priorityBSkills = (skillGap.priorityB || []).map((s) => s.skill?.toLowerCase());
    const matchedPriorityB = courseSkills.filter((s) =>
      priorityBSkills.some((ps) => ps && s.toLowerCase().includes(ps))
    );
    if (matchedPriorityB.length > 0 && reasons.length < 2) {
      reasons.push(`Develops skill: ${matchedPriorityB[0]}`);
    }
  }

  // Check career cluster alignment
  const careerFit = assessmentResults.careerFit;
  if (careerFit && careerFit.clusters && careerFit.clusters.length > 0) {
    const topCluster = careerFit.clusters[0];
    if (topCluster.domains) {
      const courseDesc = (course.description || '').toLowerCase();
      const matchedDomain = topCluster.domains.find((d) => courseDesc.includes(d.toLowerCase()));
      if (matchedDomain && reasons.length < 3) {
        reasons.push(`Relevant to ${matchedDomain} domain`);
      }
    }
  }

  // Default reason based on semantic match
  if (reasons.length === 0) {
    reasons.push('Matches your career profile');
  }

  return reasons;
};

/**
 * Identify which skill gaps a course addresses.
 *
 * @param {Object} course - Course object
 * @param {Object} assessmentResults - Assessment results
 * @returns {string[]} - Array of skill gap names addressed
 */
export const identifySkillGapsAddressed = (course, assessmentResults) => {
  const addressed = [];
  const courseSkills = (course.skills || []).map((s) => s.toLowerCase());
  const courseDesc = (course.description || '').toLowerCase();
  const courseTitle = (course.title || '').toLowerCase();

  const skillGap = assessmentResults.skillGap;
  if (!skillGap) return addressed;

  // Check priority A skills
  (skillGap.priorityA || []).forEach((s) => {
    if (!s.skill) return;
    const skillLower = s.skill.toLowerCase();
    const matches =
      courseSkills.some((cs) => cs.includes(skillLower) || skillLower.includes(cs)) ||
      courseDesc.includes(skillLower) ||
      courseTitle.includes(skillLower);
    if (matches) {
      addressed.push(s.skill);
    }
  });

  // Check priority B skills
  (skillGap.priorityB || []).forEach((s) => {
    if (!s.skill) return;
    const skillLower = s.skill.toLowerCase();
    const matches =
      courseSkills.some((cs) => cs.includes(skillLower) || skillLower.includes(cs)) ||
      courseDesc.includes(skillLower) ||
      courseTitle.includes(skillLower);
    if (matches && !addressed.includes(s.skill)) {
      addressed.push(s.skill);
    }
  });

  return addressed;
};

/**
 * Generate a "Why this course" explanation based on skill overlap.
 *
 * @param {Object} course - Course object
 * @param {Object} skillGap - Skill gap object
 * @returns {string} - Explanation of why this course addresses the skill gap
 *
 * Requirements: 5.4
 */
export const generateWhyThisCourse = (course, skillGap) => {
  const skillName = skillGap.skill;
  const courseSkills = course.skills || [];
  const matchedSkill = course.matched_skill;

  // Check for direct skill match
  if (matchedSkill) {
    if (matchedSkill.toLowerCase() === skillName.toLowerCase()) {
      return `This course directly covers ${skillName}, helping you build proficiency in this area.`;
    }
    return `This course teaches ${matchedSkill}, which is closely related to ${skillName}.`;
  }

  // Check for skill overlap in course skills
  const relatedSkills = courseSkills.filter(
    (s) =>
      s.toLowerCase().includes(skillName.toLowerCase()) ||
      skillName.toLowerCase().includes(s.toLowerCase())
  );

  if (relatedSkills.length > 0) {
    return `This course covers ${relatedSkills.slice(0, 2).join(' and ')}, which will help develop your ${skillName} skills.`;
  }

  // Check course title/description for relevance
  const courseTitle = course.title || '';
  const courseDesc = course.description || '';

  if (courseTitle.toLowerCase().includes(skillName.toLowerCase())) {
    return `This course focuses on ${skillName} as indicated by its title and curriculum.`;
  }

  if (courseDesc.toLowerCase().includes(skillName.toLowerCase())) {
    return `This course content addresses ${skillName} concepts and applications.`;
  }

  // Default explanation based on semantic match
  if (course.match_type === 'semantic') {
    return `This course content is semantically aligned with ${skillName} development.`;
  }

  return `This course can help you develop skills related to ${skillName}.`;
};
