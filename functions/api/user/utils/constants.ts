/**
 * Constants for User API
 */

export const roleMapping: Record<string, string> = {
  'school-student': 'school_student',
  'college-student': 'college_student',
  'university-student': 'college_student',
  'educator': 'college_educator',
  'school-admin': 'school_admin',
  'college-admin': 'college_admin',
  'university-admin': 'university_admin',
  'recruiter': 'recruiter',
};

export const roleDisplayNames: Record<string, string> = {
  'school_admin': 'School Administrator',
  'school_educator': 'School Educator',
  'school_student': 'School Student',
  'educator': 'Educator',
  'college_admin': 'College Administrator',
  'college_educator': 'College Educator',
  'college_student': 'College Student',
  'university_admin': 'University Administrator',
  'university_educator': 'University Educator',
  'university_student': 'University Student',
  'recruiter_admin': 'Recruiter Administrator',
  'recruiter': 'Recruiter',
};
