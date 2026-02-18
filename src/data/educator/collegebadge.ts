import { Badge, BadgeTemplate } from '../../types/badge';

// Predefined College Badge Templates
export const COLLEGE_BADGE_TEMPLATES: BadgeTemplate[] = [
  {
    name: 'Academic Excellence',
    description: 'Maintained outstanding grades in assessments',
    iconName: 'graduation-cap',
    emoji: '🎓',
    category: 'Academic',
    activity: 'Assessments',
    suggestedCriteria: 'Maintain GPA of 3.5 or higher for the semester',
    suggestedPoints: 100
  },
  {
    name: 'Internship Achiever',
    description: 'Successfully completed professional internship',
    iconName: 'briefcase',
    emoji: '💼',
    category: 'Career',
    activity: 'Internships',
    suggestedCriteria: 'Complete a verified internship of 2+ months',
    suggestedPoints: 120
  },
  {
    name: 'Skill Builder',
    description: 'Completed advanced training programs',
    iconName: 'target',
    emoji: '🎯',
    category: 'Skills',
    activity: 'Training',
    suggestedCriteria: 'Complete 3+ professional training programs',
    suggestedPoints: 80
  },
  {
    name: 'Research Pioneer',
    description: 'Contributed to academic research projects',
    iconName: 'microscope',
    emoji: '🔬',
    category: 'Academic',
    activity: 'Projects',
    suggestedCriteria: 'Participate in faculty research or publish a paper',
    suggestedPoints: 150
  },
  {
    name: 'Coding Champion',
    description: 'Mastered programming and development skills',
    iconName: 'code',
    emoji: '👨‍💻',
    category: 'Skills',
    activity: 'Technical Skills',
    suggestedCriteria: 'Complete advanced coding certifications or win hackathon',
    suggestedPoints: 100
  },
  {
    name: 'Industry Ready',
    description: 'Gained real-world work experience',
    iconName: 'rocket',
    emoji: '🚀',
    category: 'Career',
    activity: 'Experience',
    suggestedCriteria: 'Complete 6+ months of industry experience',
    suggestedPoints: 130
  },
  {
    name: 'Opportunity Seeker',
    description: 'Applied for and secured career opportunities',
    iconName: 'compass',
    emoji: '🧭',
    category: 'Career',
    activity: 'Opportunities',
    suggestedCriteria: 'Successfully secure placement or job offer',
    suggestedPoints: 140
  },
  {
    name: 'Professional Networker',
    description: 'Built strong professional connections',
    iconName: 'network',
    emoji: '🌐',
    category: 'Skills',
    activity: 'Soft Skills',
    suggestedCriteria: 'Attend 5+ networking events or build LinkedIn presence',
    suggestedPoints: 60
  },
  {
    name: 'Event Organizer',
    description: 'Led or organized college events',
    iconName: 'megaphone',
    emoji: '📢',
    category: 'Leadership',
    activity: 'Leadership',
    suggestedCriteria: 'Lead organization of a major college event',
    suggestedPoints: 90
  },
  {
    name: 'Certificate Master',
    description: 'Earned industry-recognized certifications',
    iconName: 'badge-check',
    emoji: '✅',
    category: 'Career',
    activity: 'Certificates',
    suggestedCriteria: 'Earn 3+ industry certifications (AWS, Google, etc.)',
    suggestedPoints: 110
  }
];

// Generate default College Badges with IDs
export const generateCollegeBadges = (): Badge[] => {
  return COLLEGE_BADGE_TEMPLATES.map((template, index) => ({
    id: `college-badge-${index + 1}`,
    name: template.name,
    description: template.description,
    iconName: template.iconName,
    emoji: template.emoji,
    category: template.category,
    institutionType: 'College' as const,
    activity: template.activity,
    criteria: template.suggestedCriteria,
    points: template.suggestedPoints,
    isActive: true,
    createdAt: new Date()
  }));
};

// Default college badges
export const DEFAULT_COLLEGE_BADGES: Badge[] = generateCollegeBadges();