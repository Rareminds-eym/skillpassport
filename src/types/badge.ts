// Badge Categories
export type BadgeCategory = 
  | 'Achievement'
  | 'Academic'
  | 'Skills'
  | 'Participation'
  | 'Leadership'
  | 'Attendance'
  | 'Career';

// Institution Type - ONLY School or College (no "Both")
export type InstitutionType = 'School' | 'College';

// Activity types for School
export type SchoolActivity =
  | 'Assessments'
  | 'Training'
  | 'Participation'
  | 'Projects'
  | 'Certificates'
  | 'Technical Skills'
  | 'Soft Skills'
  | 'Attendance'
  | 'Leadership';

// Activity types for College
export type CollegeActivity =
  | 'Assessments'
  | 'Training'
  | 'Opportunities'
  | 'Projects'
  | 'Internships'
  | 'Certificates'
  | 'Experience'
  | 'Technical Skills'
  | 'Soft Skills'
  | 'Leadership'
  | 'Participation';

// Union of all activities
export type BadgeActivity = SchoolActivity | CollegeActivity;

// Icon names available in the system
export type BadgeIconName =
  | 'trophy'
  | 'calendar-check'
  | 'zap'
  | 'users'
  | 'laptop'
  | 'shield'
  | 'sparkles'
  | 'message-circle'
  | 'award'
  | 'lightbulb'
  | 'graduation-cap'
  | 'briefcase'
  | 'target'
  | 'microscope'
  | 'code'
  | 'rocket'
  | 'compass'
  | 'network'
  | 'megaphone'
  | 'badge-check'
  | 'star'
  | 'medal'
  | 'book-open'
  | 'flask'
  | 'calculator'
  | 'heart-pulse'
  | 'building'
  | 'file-text'
  | 'cpu'
  | 'globe';

// Main Badge Interface
export interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: BadgeIconName;
  emoji: string;
  category: BadgeCategory;
  institutionType: InstitutionType;
  activity: BadgeActivity;
  criteria: string;
  points?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  // Student information (when badge is awarded)
  studentId?: string;
  studentName?: string;
  awardedDate?: Date;
}

// For creating new badges
export type CreateBadgeData = Omit<Badge, 'id' | 'createdAt' | 'updatedAt'>;

// For updating badges
export type UpdateBadgeData = Partial<Omit<Badge, 'id' | 'createdAt'>>;

// Badge template for predefined badges
export interface BadgeTemplate {
  name: string;
  description: string;
  iconName: BadgeIconName;
  emoji: string;
  category: BadgeCategory;
  activity: BadgeActivity;
  suggestedCriteria: string;
  suggestedPoints: number;
}

// Educator interface
export interface Educator {
  id: string;
  name: string;
  email: string;
  institutionType: InstitutionType;
  institutionName: string;
}

// Constants
export const BADGE_CATEGORIES: BadgeCategory[] = [
  'Achievement',
  'Academic',
  'Skills',
  'Participation',
  'Leadership',
  'Attendance',
  'Career'
];

export const INSTITUTION_TYPES: InstitutionType[] = ['School', 'College'];

export const SCHOOL_ACTIVITIES: SchoolActivity[] = [
  'Assessments',
  'Training',
  'Participation',
  'Projects',
  'Certificates',
  'Technical Skills',
  'Soft Skills',
  'Attendance',
  'Leadership'
];

export const COLLEGE_ACTIVITIES: CollegeActivity[] = [
  'Assessments',
  'Training',
  'Opportunities',
  'Projects',
  'Internships',
  'Certificates',
  'Experience',
  'Technical Skills',
  'Soft Skills',
  'Leadership',
  'Participation'
];