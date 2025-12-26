/**
 * Constants for User API Worker
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

export const API_VERSION = '2.0.0';
