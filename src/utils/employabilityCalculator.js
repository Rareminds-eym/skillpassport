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

  // Extract skills from separate tables (your database structure)
  let skillsData = {
    foundational: [],
    century21: [],
    digital: [],
    behavior: [],
    career: []
  };

  // 1. EDUCATION TABLE -> Foundational Skills
  if (studentData.education && Array.isArray(studentData.education)) {
    skillsData.foundational = studentData.education.map(edu => ({
      name: edu.degree || edu.course || 'Academic Background',
      rating: edu.cgpa ? Math.min(5, Math.max(1, parseFloat(edu.cgpa) / 2)) : 3,
      verified: edu.verified || edu.approval_status === 'approved' || true,
      category: 'education'
    }));
  }

  // 2. SKILLS TABLE (type='technical') -> Digital Skills  
  if (studentData.technicalSkills && Array.isArray(studentData.technicalSkills)) {
    skillsData.digital = studentData.technicalSkills.map(skill => ({
      name: skill.name || skill.skill_name || 'Technical Skill',
      rating: skill.level || skill.proficiency_level || skill.rating || 3,
      verified: skill.verified || skill.approval_status === 'approved' || false,
      category: 'technical'
    }));
  }

  // 3. SKILLS TABLE (type='soft') -> Behavioral Skills
  if (studentData.softSkills && Array.isArray(studentData.softSkills)) {
    skillsData.behavior = studentData.softSkills.map(skill => ({
      name: skill.name || skill.skill_name || 'Soft Skill',
      rating: skill.level || skill.proficiency_level || skill.rating || 3,
      verified: skill.verified || skill.approval_status === 'approved' || false,
      category: 'soft'
    }));
  }

  // 4. TRAINING TABLE -> Career Skills
  if (studentData.training && Array.isArray(studentData.training)) {
    skillsData.career = studentData.training.map(training => ({
      name: training.course || training.title || 'Professional Training',
      rating: training.progress ? Math.min(5, training.progress / 20) : 3, // Convert progress % to 1-5 scale
      verified: training.verified || training.approval_status === 'approved' || training.status === 'completed',
      category: 'training'
    }));
  }

  // 5. PROJECTS TABLE -> 21st Century Skills (Innovation, Problem Solving)
  if (studentData.projects && Array.isArray(studentData.projects)) {
    skillsData.century21 = studentData.projects.map(project => ({
      name: `Project: ${project.title || 'Innovation Project'}`,
      rating: project.status === 'completed' ? 4 : 3,
      verified: project.verified || project.approval_status === 'approved' || false,
      category: 'projects'
    }));
  }

  // FALLBACK: If separate tables are empty, use profile/individual columns
  const totalCategorizedSkills = Object.values(skillsData).reduce((sum, arr) => sum + arr.length, 0);
  
  if (totalCategorizedSkills === 0) {
    console.log('📊 No data from separate tables, using fallback from individual columns...');
    
    // Create foundational skills from individual columns
    if (studentData.branch_field || studentData.university) {
      skillsData.foundational = [{
        name: studentData.branch_field || 'Academic Background',
        rating: 3,
        verified: true,
        category: 'education'
      }];
    }
    
    // Create digital skills from course data
    if (studentData.course_name) {
      skillsData.digital = [{
        name: studentData.course_name,
        rating: 3,
        verified: true,
        category: 'course'
      }];
    }
    
    // Create behavioral skills (default set)
    skillsData.behavior = [
      { name: 'Communication', rating: 3, verified: false, category: 'default' },
      { name: 'Teamwork', rating: 3, verified: false, category: 'default' }
    ];
    
    // Create 21st century skills
    skillsData.century21 = [
      { name: 'Problem Solving', rating: 3, verified: false, category: 'default' }
    ];
    
    // Create career skills from trainer info
    if (studentData.trainer_name) {
      skillsData.career = [{
        name: 'Professional Training',
        rating: 3,
        verified: true,
        category: 'training'
      }];
    } else {
      skillsData.career = [
        { name: 'Professional Development', rating: 2, verified: false, category: 'default' }
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
  
  // EXPERIENCE TABLE - Check for work experience/internships
  const hasExperience = studentData.experience && 
    Array.isArray(studentData.experience) && 
    studentData.experience.length > 0;
  
  // TRAINING TABLE - Check for training courses
  const hasTraining = studentData.training &&
    Array.isArray(studentData.training) &&
    studentData.training.length > 0;
  
  // PROJECTS TABLE - Check for project work (hackathons, etc.)
  const hasProjects = studentData.projects &&
    Array.isArray(studentData.projects) &&
    studentData.projects.length > 0;
  
  const participatedHackathonOrInternship = hasExperience || hasTraining || hasProjects;
  if (participatedHackathonOrInternship) bonus += 1;
  
  // CERTIFICATES TABLE - Check for certificates
  const hasCertificates = studentData.certificates &&
    Array.isArray(studentData.certificates) &&
    studentData.certificates.length > 0;
  
  if (hasCertificates) bonus += 2;
  
  // Additional bonuses from separate tables
  if (hasExperience && studentData.experience.some(exp => exp.verified || exp.approval_status === 'approved')) {
    bonus += 1; // Verified work experience
  }
  
  if (hasProjects && studentData.projects.some(proj => proj.approval_status === 'approved')) {
    bonus += 1; // Approved projects
  }
  
  // Additional bonuses for high skill counts from separate tables
  const totalSkillCount = allSkills.length;
  const totalTechnicalSkills = studentData.technicalSkills?.length || 0;
  const totalSoftSkills = studentData.softSkills?.length || 0;
  
  if (totalSkillCount >= 10) bonus += 0.5; // Good skill documentation
  if (totalSkillCount >= 20) bonus += 1; // Many skills documented
  if (totalTechnicalSkills >= 5) bonus += 0.5; // Strong technical skills
  if (totalSoftSkills >= 5) bonus += 0.5; // Strong soft skills
  
  // EDUCATION TABLE - Education bonus
  const hasEducation = studentData.education && 
    Array.isArray(studentData.education) && 
    studentData.education.length > 0;
  if (hasEducation) bonus += 0.5;
  
  // Multiple education records bonus
  if (hasEducation && studentData.education.length > 1) bonus += 0.5;
  
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
  
  // Use individual columns instead of profile JSONB
  // Basic information bonuses from individual columns
  if (studentData.name) baseScore += 5;
  if (studentData.university) baseScore += 10;
  if (studentData.branch_field) baseScore += 10;
  if (studentData.course_name) baseScore += 8;
  if (studentData.email) baseScore += 5;
  if (studentData.contact_number) baseScore += 3;
  if (studentData.registration_number) baseScore += 5;
  
  // Separate tables bonuses
  // EDUCATION TABLE bonus
  if (studentData.education && Array.isArray(studentData.education) && studentData.education.length > 0) {
    baseScore += 15;
    // Additional bonus for verified education
    if (studentData.education.some(edu => edu.verified || edu.approval_status === 'approved')) {
      baseScore += 5;
    }
  }
  
  // TRAINING TABLE bonus
  if (studentData.training && Array.isArray(studentData.training) && studentData.training.length > 0) {
    baseScore += 10;
    // Additional bonus for completed training
    if (studentData.training.some(training => training.status === 'completed')) {
      baseScore += 5;
    }
  }
  
  // EXPERIENCE TABLE bonus
  if (studentData.experience && Array.isArray(studentData.experience) && studentData.experience.length > 0) {
    baseScore += 12;
    // Additional bonus for verified experience
    if (studentData.experience.some(exp => exp.verified || exp.approval_status === 'approved')) {
      baseScore += 5;
    }
  }
  
  // SKILLS TABLE bonuses
  if (studentData.technicalSkills && Array.isArray(studentData.technicalSkills) && studentData.technicalSkills.length > 0) {
    baseScore += 8;
  }
  
  if (studentData.softSkills && Array.isArray(studentData.softSkills) && studentData.softSkills.length > 0) {
    baseScore += 6;
  }
  
  // PROJECTS TABLE bonus
  if (studentData.projects && Array.isArray(studentData.projects) && studentData.projects.length > 0) {
    baseScore += 10;
    // Additional bonus for approved projects
    if (studentData.projects.some(proj => proj.approval_status === 'approved')) {
      baseScore += 5;
    }
  }
  
  // CERTIFICATES TABLE bonus
  if (studentData.certificates && Array.isArray(studentData.certificates) && studentData.certificates.length > 0) {
    baseScore += 8;
    // Additional bonus for verified certificates
    if (studentData.certificates.some(cert => cert.verified || cert.approval_status === 'approved')) {
      baseScore += 7;
    }
  }
  
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