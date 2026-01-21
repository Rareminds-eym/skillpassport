/**
 * Employability Score Calculator
 *
 * Calculates employability score based on student data from separate tables:
 * - certificates table
 * - education table
 * - training table
 * - experience table
 * - skills table (with type: 'technical'/'soft')
 * - projects table
 *
 * Falls back to individual columns and profile JSONB if separate tables are empty
 */

/**
 * Determine the focus area (lowest scoring category)
 * @param {Object} breakdown - Category scores breakdown
 * @returns {string} - Name of the focus area
 */
function determineFocusArea(breakdown) {
  const categoryNames = {
    foundational: 'Foundational Skills',
    century21: '21st Century Skills',
    digital: 'Digital Skills',
    behavior: 'Professional Attitude',
    career: 'Career Readiness',
  };

  let lowestCategory = 'foundational';
  let lowestScore = breakdown.foundational;

  Object.entries(breakdown).forEach(([key, value]) => {
    if (key !== 'bonus' && value < lowestScore) {
      lowestScore = value;
      lowestCategory = key;
    }
  });

  return categoryNames[lowestCategory] || 'All Areas';
}

/**
 * Calculate employability score from student profile data
 * @param {Object} studentData - Student profile data from Supabase
 * @returns {Object} - Score, level, and label information
 */
export function calculateEmployabilityScore(studentData) {
  if (!studentData || typeof studentData !== 'object') {
    return getDefaultEmployabilityScore();
  }

  // Category Weights
  const weights = {
    foundational: 0.3,
    century21: 0.25,
    digital: 0.15,
    behavior: 0.15,
    career: 0.15,
  };

  // Helper to calculate category average
  const calculateCategoryAverage = (skills) => {
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return 0; // No skills in this category
    }

    const scores = skills.map((skill) => {
      // Handle different skill data structures
      const rating = skill.rating || skill.proficiencyLevel || skill.level || 3; // Default to 3 if not specified
      const evidenceWeight = skill.evidenceVerified || skill.verified || skill.evidence ? 1 : 0.8;

      // Normalize rating to 5-point scale if needed
      const normalizedRating = rating > 5 ? (rating / 10) * 5 : rating;

      const score = (normalizedRating / 5) * evidenceWeight;

      return score;
    });

    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const percentage = avg * 100;
    return percentage;
  };

  // Extract skills from separate tables (your database structure)
  const skillsData = {
    foundational: [],
    century21: [],
    digital: [],
    behavior: [],
    career: [],
  };

  // 1. EDUCATION TABLE -> Foundational Skills
  if (
    studentData.education &&
    Array.isArray(studentData.education) &&
    studentData.education.length > 0
  ) {
    skillsData.foundational = studentData.education.map((edu) => ({
      name: edu.degree || edu.course || 'Academic Background',
      rating: edu.cgpa ? Math.min(5, Math.max(1, parseFloat(edu.cgpa) / 2)) : 3,
      verified: edu.verified || edu.approval_status === 'approved' || true,
      category: 'education',
    }));
  }

  // 2. SKILLS TABLE (type='technical') -> Digital Skills
  if (
    studentData.technicalSkills &&
    Array.isArray(studentData.technicalSkills) &&
    studentData.technicalSkills.length > 0
  ) {
    skillsData.digital = studentData.technicalSkills.map((skill) => ({
      name: skill.name || skill.skill_name || 'Technical Skill',
      rating: skill.level || skill.proficiency_level || skill.rating || 3,
      verified: skill.verified || skill.approval_status === 'approved' || false,
      category: 'technical',
    }));
  }

  // 3. SKILLS TABLE (type='soft') -> Behavioral Skills
  if (
    studentData.softSkills &&
    Array.isArray(studentData.softSkills) &&
    studentData.softSkills.length > 0
  ) {
    skillsData.behavior = studentData.softSkills.map((skill) => ({
      name: skill.name || skill.skill_name || 'Soft Skill',
      rating: skill.level || skill.proficiency_level || skill.rating || 3,
      verified: skill.verified || skill.approval_status === 'approved' || false,
      category: 'soft',
    }));
  }

  // 4. TRAINING TABLE -> Career Skills
  if (
    studentData.training &&
    Array.isArray(studentData.training) &&
    studentData.training.length > 0
  ) {
    skillsData.career = studentData.training.map((training) => ({
      name: training.course || training.title || 'Professional Training',
      rating: training.progress ? Math.min(5, training.progress / 20) : 3, // Convert progress % to 1-5 scale
      verified:
        training.verified ||
        training.approval_status === 'approved' ||
        training.status === 'completed',
      category: 'training',
    }));
  }

  // 5. PROJECTS TABLE -> 21st Century Skills (Innovation, Problem Solving)
  if (
    studentData.projects &&
    Array.isArray(studentData.projects) &&
    studentData.projects.length > 0
  ) {
    skillsData.century21 = studentData.projects.map((project) => ({
      name: `Project: ${project.title || 'Innovation Project'}`,
      rating: project.status === 'completed' ? 4 : 3,
      verified: project.verified || project.approval_status === 'approved' || false,
      category: 'projects',
    }));
  }

  // Check if there's ANY real data from separate tables
  const totalCategorizedSkills = Object.values(skillsData).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  // Also check for experience and certificates
  const hasExperience =
    studentData.experience &&
    Array.isArray(studentData.experience) &&
    studentData.experience.length > 0;

  const hasCertificates =
    studentData.certificates &&
    Array.isArray(studentData.certificates) &&
    studentData.certificates.length > 0;

  // If NO data at all from any table, return 0 score
  if (totalCategorizedSkills === 0 && !hasExperience && !hasCertificates) {
    // Check if there's at least basic profile info
    const hasBasicInfo = studentData.name || studentData.email || studentData.university;

    if (!hasBasicInfo) {
      return getDefaultEmployabilityScore();
    }

    // Has basic profile but no skills/experience data - return minimal score
    return {
      employabilityScore: 0,
      level: 'Not Started',
      label: 'Add Skills & Experience',
      focusArea: 'All Areas',
      breakdown: {
        foundational: 0,
        century21: 0,
        digital: 0,
        behavior: 0,
        career: 0,
        bonus: 0,
      },
    };
  }

  // Compute weighted score
  let totalScore = 0;
  const foundationalScore = calculateCategoryAverage(skillsData.foundational);
  const century21Score = calculateCategoryAverage(skillsData.century21);
  const digitalScore = calculateCategoryAverage(skillsData.digital);
  const behaviorScore = calculateCategoryAverage(skillsData.behavior);
  const careerScore = calculateCategoryAverage(skillsData.career);

  totalScore += foundationalScore * weights.foundational;
  totalScore += century21Score * weights.century21;
  totalScore += digitalScore * weights.digital;
  totalScore += behaviorScore * weights.behavior;
  totalScore += careerScore * weights.career;

  // Bonus Calculation
  let bonus = 0;

  // Check if all evidence is verified
  const allSkills = [
    ...skillsData.foundational,
    ...skillsData.century21,
    ...skillsData.digital,
    ...skillsData.behavior,
    ...skillsData.career,
  ];

  const allEvidenceVerified =
    allSkills.length > 0 &&
    allSkills.every((skill) => skill.evidenceVerified || skill.verified || skill.evidence);

  if (allEvidenceVerified) bonus += 2;

  // EXPERIENCE TABLE - Check for work experience/internships
  const hasTraining =
    studentData.training && Array.isArray(studentData.training) && studentData.training.length > 0;

  // PROJECTS TABLE - Check for project work (hackathons, etc.)
  const hasProjects =
    studentData.projects && Array.isArray(studentData.projects) && studentData.projects.length > 0;

  const participatedHackathonOrInternship = hasExperience || hasTraining || hasProjects;
  if (participatedHackathonOrInternship) bonus += 1;

  // CERTIFICATES TABLE - Check for certificates
  if (hasCertificates) bonus += 2;

  // Additional bonuses from separate tables
  if (
    hasExperience &&
    studentData.experience.some((exp) => exp.verified || exp.approval_status === 'approved')
  ) {
    bonus += 1; // Verified work experience
  }

  if (hasProjects && studentData.projects.some((proj) => proj.approval_status === 'approved')) {
    bonus += 1; // Approved projects
  }

  // Cap bonus at 5
  if (bonus > 5) bonus = 5;

  const finalScore = Math.min(totalScore + bonus, 100);

  // Create breakdown object
  const breakdown = {
    foundational: Math.round(foundationalScore),
    century21: Math.round(century21Score),
    digital: Math.round(digitalScore),
    behavior: Math.round(behaviorScore),
    career: Math.round(careerScore),
    bonus: Math.round(bonus * 10) / 10,
  };

  // Determine Focus Area (lowest scoring category)
  const focusArea = determineFocusArea(breakdown);

  // Determine Level
  let level, label;
  if (finalScore >= 85) {
    level = 'Excellent';
    label = 'Industry Ready';
  } else if (finalScore >= 70) {
    level = 'Good';
    label = 'Emerging Talent';
  } else if (finalScore >= 50) {
    level = 'Moderate';
    label = 'Developing';
  } else if (finalScore > 0) {
    level = 'Needs Support';
    label = 'Guided Path';
  } else {
    level = 'Not Started';
    label = 'Add Skills & Experience';
  }

  return {
    employabilityScore: Math.round(finalScore),
    level,
    label,
    focusArea,
    breakdown,
  };
}

/**
 * Get default employability score when no data is available
 * @returns {Object} Default score object
 */
export function getDefaultEmployabilityScore() {
  return {
    employabilityScore: 0,
    level: 'Not Started',
    label: 'Complete Your Profile',
    focusArea: 'All Areas',
    breakdown: {
      foundational: 0,
      century21: 0,
      digital: 0,
      behavior: 0,
      career: 0,
      bonus: 0,
    },
  };
}

/**
 * Calculate a minimum score based on basic profile information
 * This is only called when there's actual data but score is very low
 * @param {Object} studentData - Student profile data
 * @returns {Object} Minimum score based on available data
 */
export function calculateMinimumScore(studentData) {
  // This function is deprecated - we now return 0 for empty profiles
  // Keeping for backward compatibility but it should rarely be called
  return getDefaultEmployabilityScore();
}
