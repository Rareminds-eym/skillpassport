/**
 * Employability Score Calculator
 * 
 * Calculates employability score based on student skills data from Supabase
 * Expects data structure with categorized skills arrays
 */

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
    foundational: 0.30,
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


    const scores = skills.map(skill => {
      // Handle different skill data structures
      const rating = skill.rating || skill.proficiencyLevel || skill.level || 3; // Default to 3 if not specified
      const evidenceWeight = skill.evidenceVerified || skill.verified || skill.evidence ? 1 : 0.8;
      
      // Normalize rating to 5-point scale if needed
      const normalizedRating = rating > 5 ? rating / 10 * 5 : rating;
      
      const score = (normalizedRating / 5) * evidenceWeight;
      
      return score;
    });
    
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const percentage = avg * 100;
    return percentage;
  };

  // Extract skills from different possible structures
  let skillsData = {
    foundational: studentData.foundational || studentData.foundationalSkills || [],
    century21: studentData.century21 || studentData.century21Skills || [],
    digital: studentData.digital || studentData.digitalSkills || studentData.technicalSkills || [],
    behavior: studentData.behavior || studentData.behaviorSkills || studentData.softSkills || [],
    career: studentData.career || studentData.careerSkills || []
  };

  // CRITICAL: Check if all skill arrays are empty and create synthetic skills
  const totalCategorizedSkills = Object.values(skillsData).reduce((sum, arr) => sum + arr.length, 0);
  
  
  if (totalCategorizedSkills === 0) {
    
    // Use basic profile information to create skills
    const profile = studentData.profile || studentData;
    
    // Create foundational skills from education/department
    if (profile.department || profile.branch_field || profile.degree) {
      skillsData.foundational = [{
        name: profile.department || profile.branch_field || profile.degree || 'Academic Background',
        rating: 3,
        verified: true
      }];
    }
    
    // Create digital skills from course/skill data
    if (profile.course || profile.skill) {
      skillsData.digital = [{
        name: profile.course || profile.skill || 'Technical Skills',
        rating: 3,
        verified: true
      }];
    }
    
    // Create behavioral skills (basic set)
    skillsData.behavior = [
      { name: 'Communication', rating: 3, verified: false },
      { name: 'Teamwork', rating: 3, verified: false }
    ];
    
    // Create 21st century skills
    skillsData.century21 = [
      { name: 'Problem Solving', rating: 3, verified: false }
    ];
    
    // Create career skills from training/experience
    if (studentData.training && studentData.training.length > 0) {
      skillsData.career = studentData.training.slice(0, 2).map(training => ({
        name: training.course || 'Professional Training',
        rating: 3,
        verified: true
      }));
    } else {
      skillsData.career = [
        { name: 'Professional Development', rating: 2, verified: false }
      ];
    }
    
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
    ...skillsData.career
  ];
  
  const allEvidenceVerified = allSkills.length > 0 && 
    allSkills.every(skill => skill.evidenceVerified || skill.verified || skill.evidence);
  
  if (allEvidenceVerified) bonus += 2;
  
  // Check for hackathon/internship participation
  const hasExperience = studentData.experience && 
    Array.isArray(studentData.experience) && 
    studentData.experience.length > 0;
  
  const hasTraining = studentData.training &&
    Array.isArray(studentData.training) &&
    studentData.training.length > 0;
  
  const participatedHackathonOrInternship = hasExperience ||
    hasTraining ||
    studentData.participatedHackathonOrInternship ||
    studentData.hackathons ||
    studentData.internships;
    
  if (participatedHackathonOrInternship) bonus += 1;
  
  // Check for skill passport certificate
  if (studentData.hasSkillPassportCertificate || studentData.certified) bonus += 2;
  
  // Additional bonuses for high skill counts
  const totalSkillCount = allSkills.length;
  if (totalSkillCount >= 20) bonus += 1; // Many skills documented
  if (totalSkillCount >= 30) bonus += 1; // Extensive skill portfolio
  
  // Education bonus
  const hasEducation = studentData.education && 
    Array.isArray(studentData.education) && 
    studentData.education.length > 0;
  if (hasEducation) bonus += 0.5;
  
  // Cap bonus at 5
  if (bonus > 5) bonus = 5;

  const finalScore = Math.min(totalScore + bonus, 100);

  // If the final score is very low
  if (finalScore < 20) {
    return calculateMinimumScore(studentData);
  }

  // Determine Level
  let level, label;
  if (finalScore >= 85) {
    level = "Excellent";
    label = "🌟 Industry Ready";
  } else if (finalScore >= 70) {
    level = "Good";
    label = "🚀 Emerging Talent";
  } else if (finalScore >= 50) {
    level = "Moderate";
    label = "🌱 Developing";
  } else {
    level = "Needs Support";
    label = "🔧 Guided Path";
  }

  return {
    employabilityScore: Math.round(finalScore),
    level,
    label,
    breakdown: {
      foundational: Math.round(foundationalScore),
      century21: Math.round(century21Score),
      digital: Math.round(digitalScore),
      behavior: Math.round(behaviorScore),
      career: Math.round(careerScore),
      bonus: Math.round(bonus * 10) / 10 // Round to 1 decimal
    }
  };
}

/**
 * Get default employability score when no data is available
 * @returns {Object} Default score object
 */
export function getDefaultEmployabilityScore() {
  return {
    employabilityScore: 45,
    level: "Needs Support",
    label: "🔧 Guided Path",
    breakdown: {
      foundational: 40,
      century21: 35,
      digital: 50,
      behavior: 45,
      career: 30,
      bonus: 0
    }
  };
}

/**
 * Calculate a minimum score based on basic profile information
 * @param {Object} studentData - Student profile data
 * @returns {Object} Minimum score based on available data
 */
export function calculateMinimumScore(studentData) {
  let baseScore = 30; // Minimum base score for being a student
  
  const profile = studentData.profile || studentData;
  
  // Basic information bonuses
  if (profile.name) baseScore += 5;
  if (profile.university) baseScore += 10;
  if (profile.department || profile.branch_field) baseScore += 10;
  if (profile.course) baseScore += 8;
  if (profile.email) baseScore += 5;
  
  // Education bonus
  if (studentData.education && studentData.education.length > 0) baseScore += 15;
  
  // Training bonus
  if (studentData.training && studentData.training.length > 0) baseScore += 10;
  
  // Experience bonus
  if (studentData.experience && studentData.experience.length > 0) baseScore += 12;
  
  const finalScore = Math.min(baseScore, 75); // Cap at 75 for minimum score
  
  let level, label;
  if (finalScore >= 70) {
    level = "Good";
    label = "🚀 Emerging Talent";
  } else if (finalScore >= 50) {
    level = "Moderate";
    label = "🌱 Developing";
  } else {
    level = "Needs Support";
    label = "🔧 Guided Path";
  }
  
  return {
    employabilityScore: finalScore,
    level,
    label,
    breakdown: {
      foundational: Math.round(finalScore * 0.3),
      century21: Math.round(finalScore * 0.25),
      digital: Math.round(finalScore * 0.2),
      behavior: Math.round(finalScore * 0.15),
      career: Math.round(finalScore * 0.1),
      bonus: 0
    }
  };
}