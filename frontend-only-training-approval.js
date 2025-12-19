// Frontend-Only Training Approval Logic
// Uses existing table structure - NO database changes needed

/**
 * Determine approval authority based on provider and student info
 * Uses existing columns: organization, approval_authority (if exists)
 */
export function determineTrainingApprovalAuthority(provider, studentData) {
  const providerName = (provider || '').toLowerCase().trim();
  
  // Rule 1: Rareminds trainings
  if (providerName === 'rareminds') {
    // Check if student is college student
    if (studentData.student_type === 'college_student' && studentData.university_college_id) {
      return 'college_admin';
    }
    // Check if student is school student  
    else if (studentData.school_id) {
      return 'school_admin';
    }
    // Fallback for Rareminds
    else {
      return 'rareminds_admin';
    }
  }
  
  // Rule 2: External providers (Coursera, Udemy, etc.)
  else {
    return 'rareminds_admin';
  }
}

/**
 * Filter trainings for specific admin type
 * Uses existing approval_authority column or determines from organization
 */
export function filterTrainingsForAdmin(trainings, adminType, adminSchoolId = null, adminCollegeId = null) {
  return trainings.filter(training => {
    // Use existing approval_authority if available
    if (training.approval_authority) {
      return training.approval_authority === adminType;
    }
    
    // Fallback: determine from organization and student data
    const provider = training.organization || '';
    
    if (adminType === 'school_admin') {
      // Show Rareminds trainings from students in this school
      return provider.toLowerCase() === 'rareminds' && 
             training.student_school_id === adminSchoolId;
    }
    
    if (adminType === 'college_admin') {
      // Show Rareminds trainings from students in this college
      return provider.toLowerCase() === 'rareminds' && 
             training.student_college_id === adminCollegeId;
    }
    
    if (adminType === 'rareminds_admin') {
      // Show external provider trainings OR Rareminds trainings without school/college
      return provider.toLowerCase() !== 'rareminds' || 
             (!training.student_school_id && !training.student_college_id);
    }
    
    return false;
  });
}

/**
 * Get appropriate admin notification message
 */
export function getTrainingNotificationMessage(training, adminType) {
  const studentName = training.student_name || 'Unknown Student';
  const trainingTitle = training.title || 'Untitled Training';
  const provider = training.organization || 'Unknown Provider';
  
  switch (adminType) {
    case 'school_admin':
      return `New Rareminds training "${trainingTitle}" submitted by ${studentName} requires your approval.`;
    
    case 'college_admin':
      return `New Rareminds training "${trainingTitle}" submitted by ${studentName} requires your approval.`;
    
    case 'rareminds_admin':
      return `New ${provider} training "${trainingTitle}" submitted by ${studentName} requires your approval.`;
    
    default:
      return `New training "${trainingTitle}" submitted by ${studentName} requires approval.`;
  }
}

/**
 * Check if current admin should see this training
 */
export function shouldAdminSeeTraining(training, currentAdmin) {
  const provider = (training.organization || '').toLowerCase();
  
  // Use existing approval_authority if available
  if (training.approval_authority) {
    return training.approval_authority === currentAdmin.type;
  }
  
  // Determine based on provider and admin context
  if (currentAdmin.type === 'school_admin') {
    return provider === 'rareminds' && 
           training.student_school_id === currentAdmin.school_id;
  }
  
  if (currentAdmin.type === 'college_admin') {
    return provider === 'rareminds' && 
           training.student_college_id === currentAdmin.college_id;
  }
  
  if (currentAdmin.type === 'rareminds_admin') {
    return provider !== 'rareminds';
  }
  
  return false;
}

// ========================================
// EXPERIENCE APPROVAL LOGIC
// ========================================

/**
 * Determine experience approval authority based on student institution
 * Simple logic: Student's institution approves their experiences
 */
export function determineExperienceApprovalAuthority(studentData) {
  // Rule 1: College students → College Admin
  if (studentData.student_type === 'college_student' && studentData.university_college_id) {
    return 'college_admin';
  }
  
  // Rule 2: School students → School Admin  
  else if (studentData.school_id) {
    return 'school_admin';
  }
  
  // Rule 3: Fallback → Rareminds Admin
  else {
    return 'rareminds_admin';
  }
}

/**
 * Filter experiences for specific admin type
 * Based on student-institution relationship (not organization)
 */
export function filterExperiencesForAdmin(experiences, adminType, adminSchoolId = null, adminCollegeId = null) {
  return experiences.filter(experience => {
    // Use existing approval_authority if available
    if (experience.approval_authority) {
      return experience.approval_authority === adminType;
    }
    
    // Determine based on student institution
    if (adminType === 'school_admin') {
      // Show experiences from students in this school
      return experience.student_school_id === adminSchoolId;
    }
    
    if (adminType === 'college_admin') {
      // Show experiences from college students in this college
      return experience.student_type === 'college_student' && 
             experience.student_college_id === adminCollegeId;
    }
    
    if (adminType === 'rareminds_admin') {
      // Show experiences from students without school/college
      return !experience.student_school_id && !experience.student_college_id;
    }
    
    return false;
  });
}

/**
 * Get appropriate admin notification message for experience
 */
export function getExperienceNotificationMessage(experience, adminType) {
  const studentName = experience.student_name || 'Unknown Student';
  const role = experience.role || 'Untitled Role';
  const organization = experience.organization || 'Unknown Organization';
  
  switch (adminType) {
    case 'school_admin':
      return `New work experience "${role}" at ${organization} submitted by ${studentName} requires your approval.`;
    
    case 'college_admin':
      return `New work experience "${role}" at ${organization} submitted by ${studentName} requires your approval.`;
    
    case 'rareminds_admin':
      return `New work experience "${role}" at ${organization} submitted by ${studentName} requires your approval.`;
    
    default:
      return `New work experience "${role}" at ${organization} submitted by ${studentName} requires approval.`;
  }
}

/**
 * Check if current admin should see this experience
 */
export function shouldAdminSeeExperience(experience, currentAdmin) {
  // Use existing approval_authority if available
  if (experience.approval_authority) {
    return experience.approval_authority === currentAdmin.type;
  }
  
  // Determine based on student institution
  if (currentAdmin.type === 'school_admin') {
    return experience.student_school_id === currentAdmin.school_id;
  }
  
  if (currentAdmin.type === 'college_admin') {
    return experience.student_type === 'college_student' && 
           experience.student_college_id === currentAdmin.college_id;
  }
  
  if (currentAdmin.type === 'rareminds_admin') {
    return !experience.student_school_id && !experience.student_college_id;
  }
  
  return false;
}