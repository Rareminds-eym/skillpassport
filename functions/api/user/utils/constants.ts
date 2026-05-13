/**
 * Constants for User API
 */

export const roleMapping: Record<string, string> = {
  'school-learner': 'learner',
  'college-learner': 'learner',
  'university-learner': 'learner',
  'educator': 'college_educator',
  'school-admin': 'school_admin',
  'college-admin': 'college_admin',
  'university-admin': 'university_admin',
  'recruiter': 'recruiter',
};

export const roleDisplayNames: Record<string, string> = {
  'school_admin': 'School Administrator',
  'school_educator': 'School Educator',
  'educator': 'Educator',
  'college_admin': 'College Administrator',
  'college_educator': 'College Educator',
  'learner': 'Learner',
  'university_admin': 'University Administrator',
  'university_educator': 'University Educator',
  'university_learner': 'University Learner',
  'recruiter_admin': 'Recruiter Administrator',
  'recruiter': 'Recruiter',
};
