/**
 * Profile Completion Utilities
 * 
 * Calculates profile completion percentage and identifies missing fields
 */

import type { Student } from '../ui/types';

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
const calculateBasicCompletion = (student: Student) => {
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
    let value = student[field.key as keyof Student];
    
    // Check alternative keys
    if (!hasValue(value) && field.alt) {
      for (const altKey of field.alt) {
        value = student[altKey as keyof Student];
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
const calculateSchoolCompletion = (student: Student) => {
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
    const value = student[field.key as keyof Student];
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
const calculateCollegeCompletion = (student: Student) => {
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
    let value = student[field.key as keyof Student];
    
    // Check alternative keys
    if (!hasValue(value) && field.alt) {
      for (const altKey of field.alt) {
        value = student[altKey as keyof Student];
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
const calculateEducationCompletion = (student: Student) => {
  const education = student.profile?.education || [];
  
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
const calculateSkillsCompletion = (student: Student) => {
  const technicalSkills = student.profile?.technicalSkills || [];
  const softSkills = student.profile?.softSkills || [];
  
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
const calculatePortfolioCompletion = (student: Student) => {
  const projects = student.projects || [];
  const certificates = student.certificates || [];
  
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
const calculateSocialLinksCompletion = (student: Student) => {
  const fields = [
    { key: 'linkedin_link', label: 'LinkedIn' },
    { key: 'github_link', label: 'GitHub' },
    { key: 'portfolio_link', label: 'Portfolio' }
  ];
  
  let completed = 0;
  const missing: string[] = [];
  
  for (const field of fields) {
    const value = student[field.key as keyof Student];
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
export const calculateProfileCompletion = (student: Student): ProfileCompletionResult => {
  const sections: ProfileCompletionResult['sections'] = {};
  
  // Basic information
  sections.basic = calculateBasicCompletion(student);
  
  // Academic information (school or college)
  if (student.school_id) {
    sections.academic = calculateSchoolCompletion(student);
  } else if (student.college_id) {
    sections.academic = calculateCollegeCompletion(student);
  }
  
  // Education records (for college/university students)
  if (student.college_id || student.university) {
    sections.education = calculateEducationCompletion(student);
  }
  
  // Skills
  sections.skills = calculateSkillsCompletion(student);
  
  // Portfolio (projects and certificates)
  sections.portfolio = calculatePortfolioCompletion(student);
  
  // Social links
  sections.socialLinks = calculateSocialLinksCompletion(student);
  
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
export const getNextRecommendedFields = (student: Student, limit: number = 5): string[] => {
  const completion = calculateProfileCompletion(student);
  
  // Prioritize sections with lower completion
  const sectionPriority = Object.entries(completion.sections)
    .sort((a, b) => a[1].percentage - b[1].percentage)
    .flatMap(([_, section]) => section.missingFields);
  
  return sectionPriority.slice(0, limit);
};
