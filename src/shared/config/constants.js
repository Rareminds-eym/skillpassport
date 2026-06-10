export const USER_ROLES = {
  SCHOOL_ADMIN: 'school_admin',
  COLLEGE_ADMIN: 'college_admin',
  UNIVERSITY_ADMIN: 'university_admin',
  COMPANY_ADMIN: 'company_admin',
  SCHOOL_EDUCATOR: 'school_educator',
  COLLEGE_EDUCATOR: 'college_educator',
  RECRUITER: 'recruiter',
  SCHOOL_LEARNER: 'learner',
  COLLEGE_LEARNER: 'learner',
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

  LOGIN_LEARNER: '/login/learner',
  LOGIN_RECRUITER: '/login/recruiter',
  LOGIN_ADMIN: '/login/admin',
  REGISTER: '/signup',

  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_REPORTS: '/admin/reports',

  RECRUITER_DASHBOARD: '/recruitment/dashboard',
  RECRUITER_POST_JOB: '/recruitment/post-job',
  RECRUITER_APPLICANTS: '/recruitment/applicants',

  LEARNER_DASHBOARD: '/learner/dashboard',
  LEARNER_PROFILE: '/learner/profile',
  LEARNER_APPLIED_JOBS: '/learner/applied-jobs',
  LEARNER_BROWSE_JOBS: '/learner/browse-jobs',
};
