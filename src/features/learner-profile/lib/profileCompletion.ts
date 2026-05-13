/**
 * Profile Completion Utilities
 * 
 * Calculates profile completion percentage and identifies missing fields
 */

import type { Learner } from '../ui/types';

export interface ProfileCompletionResult {
  percentage: number;
  completedFields: number;
  totalFields: number;
  missingFields: string[];
  sections: {
    [key: string]: {
      percentage: number;
      completedFields: number;
      totalFields: number;
      missingFields: string[];
    };
  };
}

/**
 * Checks if a field has a valid value
 */
const hasValue = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

/**
 * Calculates basic profile completion
 */
const calculateBasicCompletion = (learner: Learner) => {
  const fields = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'contact_number', label: 'Contact Number', alt: ['contactNumber', 'phone'] },
    { key: 'date_of_birth', label: 'Date of Birth' },
    { key: 'gender', label: 'Gender' },
    { key: 'address', label: 'Address' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'pincode', label: 'Pincode' },
    { key: 'bio', label: 'Bio' }
  ];
  
  let completed = 0;
  const missing: string[] = [];
  
  for (const field of fields) {
    let value = learner[field.key as keyof Learner];
    
    // Check alternative keys
    if (!hasValue(value) && field.alt) {
      for (const altKey of field.alt) {
        value = learner[altKey as keyof Learner];
        if (hasValue(value)) break;
      }
    }
    
    if (hasValue(value)) {
      completed++;
    } else {
      missing.push(field.label);
    }
  }
  
  return {
    percentage: Math.round((completed / fields.length) * 100),
    completedFields: completed,
    totalFields: fields.length,
    missingFields: missing
  };
};

/**
 * Calculates school-specific profile completion
 */
const calculateSchoolCompletion = (learner: Learner) => {
  const fields = [
    { key: 'school_id', label: 'School' },
    { key: 'grade', label: 'Grade' },
    { key: 'section', label: 'Section' },
    { key: 'roll_number', label: 'Roll Number' },
    { key: 'admission_number', label: 'Admission Number' },
    { key: 'guardianName', label: 'Guardian Name' },
    { key: 'guardianPhone', label: 'Guardian Phone' },
    { key: 'guardianEmail', label: 'Guardian Email' },
    { key: 'guardianRelation', label: 'Guardian Relation' }
  ];
  
  let completed = 0;
  const missing: string[] = [];
  
  for (const field of fields) {
    const value = learner[field.key as keyof Learner];
    if (hasValue(value)) {
      completed++;
    } else {
      missing.push(field.label);
    }
  }
  
  return {
    percentage: Math.round((completed / fields.length) * 100),
    completedFields: completed,
    totalFields: fields.length,
    missingFields: missing
  };
};

/**
 * Calculates college-specific profile completion
 */
const calculateCollegeCompletion = (learner: Learner) => {
  const fields = [
    { key: 'college_id', label: 'College' },
    { key: 'university', label: 'University' },
    { key: 'branch_field', label: 'Branch/Field', alt: ['dept'] },
    { key: 'enrollment_number', label: 'Enrollment Number' },
    { key: 'registration_number', label: 'Registration Number' },
    { key: 'current_semester', label: 'Current Semester', alt: ['semester'] },
    { key: 'currentCgpa', label: 'Current CGPA' },
    { key: 'enrollmentDate', label: 'Enrollment Date' },
    { key: 'expectedGraduationDate', label: 'Expected Graduation Date' }
  ];
  
  let completed = 0;
  const missing: string[] = [];
  
  for (const field of fields) {
    let value = learner[field.key as keyof Learner];
    
    // Check alternative keys
    if (!hasValue(value) && field.alt) {
      for (const altKey of field.alt) {
        value = learner[altKey as keyof Learner];
        if (hasValue(value)) break;
      }
    }
    
    if (hasValue(value)) {
      completed++;
    } else {
      missing.push(field.label);
    }
  }
  
  return {
    percentage: Math.round((completed / fields.length) * 100),
    completedFields: completed,
    totalFields: fields.length,
    missingFields: missing
  };
};

/**
 * Calculates education completion (from profile.education)
 */
const calculateEducationCompletion = (learner: Learner) => {
  const education = learner.profile?.education || [];
  
  if (education.length === 0) {
    return {
      percentage: 0,
      completedFields: 0,
      totalFields: 1,
      missingFields: ['Education records']
    };
  }
  
  // Check if at least one education record is complete
  const hasCompleteRecord = education.some(edu => 
    hasValue(edu.degree) && 
    hasValue(edu.university) && 
    hasValue(edu.cgpa)
  );
  
  return {
    percentage: hasCompleteRecord ? 100 : 50,
    completedFields: hasCompleteRecord ? 1 : 0,
    totalFields: 1,
    missingFields: hasCompleteRecord ? [] : ['Complete education details']
  };
};

/**
 * Calculates skills completion
 */
const calculateSkillsCompletion = (learner: Learner) => {
  const technicalSkills = learner.profile?.technicalSkills || [];
  const softSkills = learner.profile?.softSkills || [];
  
  let completed = 0;
  const missing: string[] = [];
  const totalFields = 2;
  
  if (technicalSkills.length > 0) {
    completed++;
  } else {
    missing.push('Technical Skills');
  }
  
  if (softSkills.length > 0) {
    completed++;
  } else {
    missing.push('Soft Skills');
  }
  
  return {
    percentage: Math.round((completed / totalFields) * 100),
    completedFields: completed,
    totalFields,
    missingFields: missing
  };
};

/**
 * Calculates projects and certificates completion
 */
const calculatePortfolioCompletion = (learner: Learner) => {
  const projects = learner.projects || [];
  const certificates = learner.certificates || [];
  
  let completed = 0;
  const missing: string[] = [];
  const totalFields = 2;
  
  if (projects.length > 0) {
    completed++;
  } else {
    missing.push('Projects');
  }
  
  if (certificates.length > 0) {
    completed++;
  } else {
    missing.push('Certificates');
  }
  
  return {
    percentage: Math.round((completed / totalFields) * 100),
    completedFields: completed,
    totalFields,
    missingFields: missing
  };
};

/**
 * Calculates social links completion
 */
const calculateSocialLinksCompletion = (learner: Learner) => {
  const fields = [
    { key: 'linkedin_link', label: 'LinkedIn' },
    { key: 'github_link', label: 'GitHub' },
    { key: 'portfolio_link', label: 'Portfolio' }
  ];
  
  let completed = 0;
  const missing: string[] = [];
  
  for (const field of fields) {
    const value = learner[field.key as keyof Learner];
    if (hasValue(value)) {
      completed++;
    } else {
      missing.push(field.label);
    }
  }
  
  return {
    percentage: Math.round((completed / fields.length) * 100),
    completedFields: completed,
    totalFields: fields.length,
    missingFields: missing
  };
};

/**
 * Calculates overall profile completion percentage
 */
export const calculateProfileCompletion = (learner: Learner): ProfileCompletionResult => {
  const sections: ProfileCompletionResult['sections'] = {};
  
  // Basic information
  sections.basic = calculateBasicCompletion(learner);
  
  // Academic information (school or college)
  if (learner.school_id) {
    sections.academic = calculateSchoolCompletion(learner);
  } else if (learner.college_id) {
    sections.academic = calculateCollegeCompletion(learner);
  }
  
  // Education records (for college/university learners)
  if (learner.college_id || learner.university) {
    sections.education = calculateEducationCompletion(learner);
  }
  
  // Skills
  sections.skills = calculateSkillsCompletion(learner);
  
  // Portfolio (projects and certificates)
  sections.portfolio = calculatePortfolioCompletion(learner);
  
  // Social links
  sections.socialLinks = calculateSocialLinksCompletion(learner);
  
  // Calculate overall completion
  const sectionKeys = Object.keys(sections);
  const totalCompleted = sectionKeys.reduce((sum, key) => sum + sections[key].completedFields, 0);
  const totalFields = sectionKeys.reduce((sum, key) => sum + sections[key].totalFields, 0);
  const allMissingFields = sectionKeys.reduce((arr, key) => [...arr, ...sections[key].missingFields], [] as string[]);
  
  return {
    percentage: Math.round((totalCompleted / totalFields) * 100),
    completedFields: totalCompleted,
    totalFields,
    missingFields: allMissingFields,
    sections
  };
};

/**
 * Gets profile completion status with a descriptive message
 */
export const getProfileCompletionStatus = (percentage: number): {
  status: 'incomplete' | 'partial' | 'complete' | 'excellent';
  message: string;
  color: string;
} => {
  if (percentage < 30) {
    return {
      status: 'incomplete',
      message: 'Your profile needs attention. Complete more sections to improve visibility.',
      color: 'red'
    };
  } else if (percentage < 60) {
    return {
      status: 'partial',
      message: 'Your profile is partially complete. Add more details to stand out.',
      color: 'orange'
    };
  } else if (percentage < 90) {
    return {
      status: 'complete',
      message: 'Your profile looks good! Add a few more details to make it excellent.',
      color: 'blue'
    };
  } else {
    return {
      status: 'excellent',
      message: 'Excellent! Your profile is comprehensive and complete.',
      color: 'green'
    };
  }
};

/**
 * Gets the next recommended fields to complete
 */
export const getNextRecommendedFields = (learner: Learner, limit: number = 5): string[] => {
  const completion = calculateProfileCompletion(learner);
  
  // Prioritize sections with lower completion
  const sectionPriority = Object.entries(completion.sections)
    .sort((a, b) => a[1].percentage - b[1].percentage)
    .flatMap(([_, section]) => section.missingFields);
  
  return sectionPriority.slice(0, limit);
};
