export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  RM_ADMIN: 'rm_admin',
  RM_MANAGER: 'rm_manager',
  SCHOOL_ADMIN: 'school_admin',
  COLLEGE_ADMIN: 'college_admin',
  UNIVERSITY_ADMIN: 'university_admin',
  COMPANY_ADMIN: 'company_admin',
  SCHOOL_EDUCATOR: 'school_educator',
  COLLEGE_EDUCATOR: 'college_educator',
  RECRUITER: 'recruiter',
  SCHOOL_STUDENT: 'school_student',
  COLLEGE_STUDENT: 'college_student',
};

export const JOB_TYPES = {
  FULL_TIME: 'full-time',
  PART_TIME: 'part-time',
  CONTRACT: 'contract',
  INTERNSHIP: 'internship',
};

export const APPLICATION_STATUS = {
  PENDING: 'pending',
  REVIEWING: 'reviewing',
  SHORTLISTED: 'shortlisted',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
};

export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',

  LOGIN_STUDENT: '/login/student',
  LOGIN_RECRUITER: '/login/recruiter',
  LOGIN_ADMIN: '/login/admin',
  REGISTER: '/register',

  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_REPORTS: '/admin/reports',

  RECRUITER_DASHBOARD: '/recruitment/dashboard',
  RECRUITER_POST_JOB: '/recruitment/post-job',
  RECRUITER_APPLICANTS: '/recruitment/applicants',

  STUDENT_DASHBOARD: '/student/dashboard',
  STUDENT_PROFILE: '/student/profile',
  STUDENT_APPLIED_JOBS: '/student/applied-jobs',
  STUDENT_BROWSE_JOBS: '/student/browse-jobs',
};
