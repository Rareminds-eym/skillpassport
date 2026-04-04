// Recruiter Feature - Constants

// Pipeline stages
export const STAGES = [
  { value: 'sourced', label: 'Sourced' },
  { value: 'screened', label: 'Screened' },
  { value: 'interview_1', label: 'Interview 1' },
  { value: 'interview_2', label: 'Interview 2' },
  { value: 'offer', label: 'Offer' },
  { value: 'hired', label: 'Hired' }
] as const;

// Skills options
export const SKILLS = [
  'React',
  'Python',
  'Node.js',
  'Java',
  'TypeScript',
  'AWS',
  'Docker',
  'SQL',
  'MongoDB',
  'Kubernetes'
] as const;

// Departments
export const DEPARTMENTS = [
  'Engineering',
  'Food Safety',
  'Manufacturing',
  'Quality Assurance',
  'IT',
  'Operations'
] as const;

// Locations
export const LOCATIONS = [
  'Chennai',
  'Bangalore',
  'Coimbatore',
  'Pune',
  'Mumbai',
  'Hyderabad',
  'Delhi'
] as const;

// Candidate sources
export const SOURCES = [
  { value: 'talent_pool', label: 'Talent Pool' },
  { value: 'direct_application', label: 'Direct Application' },
  { value: 'referral', label: 'Referral' },
  { value: 'sourced', label: 'Sourced' }
] as const;

// Next action types
export const NEXT_ACTION_TYPES = [
  { value: 'send_email', label: 'Send Email' },
  { value: 'schedule_interview', label: 'Schedule Interview' },
  { value: 'make_offer', label: 'Make Offer' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'review_application', label: 'Review Application' }
] as const;

// Date range presets
export const DATE_RANGE_PRESETS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'ytd', label: 'Year to date' },
  { value: 'custom', label: 'Custom range' }
] as const;

// Offer statuses
export const OFFER_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
  { value: 'expired', label: 'Expired' },
  { value: 'withdrawn', label: 'Withdrawn' }
] as const;

// Requisition statuses
export const REQUISITION_STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'paused', label: 'Paused' },
  { value: 'closed', label: 'Closed' },
  { value: 'draft', label: 'Draft' }
] as const;

// Work modes
export const WORK_MODES = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' }
] as const;

// Employment types
export const EMPLOYMENT_TYPES = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' }
] as const;

// Experience levels
export const EXPERIENCE_LEVELS = [
  { value: 'entry', label: 'Entry Level (0-2 years)' },
  { value: 'mid', label: 'Mid Level (3-5 years)' },
  { value: 'senior', label: 'Senior (6-10 years)' },
  { value: 'lead', label: 'Lead (10+ years)' }
] as const;

// Requisition import template columns
export const REQUISITION_IMPORT_COLUMNS = [
  'job_title',
  'company_name',
  'department',
  'location',
  'work_mode',
  'employment_type',
  'experience_required',
  'salary_range',
  'description',
  'requirements',
  'posted_date',
  'status'
] as const;
