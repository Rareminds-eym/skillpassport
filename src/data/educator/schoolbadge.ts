import { Badge, BadgeTemplate } from '../../types/badge';

// Predefined School Badge Templates
export const SCHOOL_BADGE_TEMPLATES: BadgeTemplate[] = [
  {
    name: 'Exam Champion',
    description: 'Achieved top scores in school exams',
    iconName: 'trophy',
    emoji: '🏆',
    category: 'Academic',
    activity: 'Assessments',
    suggestedCriteria: 'Score 90% or above in final exams',
    suggestedPoints: 100
  },
  {
    name: 'Perfect Attendance Star',
    description: 'Attended all classes without absence',
    iconName: 'calendar-check',
    emoji: '📅',
    category: 'Attendance',
    activity: 'Attendance',
    suggestedCriteria: 'Maintain 100% attendance for one complete term',
    suggestedPoints: 80
  },
  {
    name: 'Quick Learner',
    description: 'Completed training courses ahead of schedule',
    iconName: 'zap',
    emoji: '⚡',
    category: 'Academic',
    activity: 'Training',
    suggestedCriteria: 'Complete assigned courses before deadline',
    suggestedPoints: 60
  },
  {
    name: 'Team Player',
    description: 'Outstanding collaboration in group projects',
    iconName: 'users',
    emoji: '👥',
    category: 'Participation',
    activity: 'Projects',
    suggestedCriteria: 'Receive positive peer reviews in 3+ group projects',
    suggestedPoints: 70
  },
  {
    name: 'Tech Wizard',
    description: 'Demonstrated excellent technical skills',
    iconName: 'laptop',
    emoji: '💻',
    category: 'Skills',
    activity: 'Technical Skills',
    suggestedCriteria: 'Complete advanced computer skills assessment',
    suggestedPoints: 75
  },
  {
    name: 'Class Leader',
    description: 'Took leadership role in class activities',
    iconName: 'shield',
    emoji: '🛡️',
    category: 'Leadership',
    activity: 'Leadership',
    suggestedCriteria: 'Serve as class monitor or team lead for one term',
    suggestedPoints: 85
  },
  {
    name: 'Activity Enthusiast',
    description: 'Actively participated in school events',
    iconName: 'sparkles',
    emoji: '✨',
    category: 'Participation',
    activity: 'Participation',
    suggestedCriteria: 'Participate in 5+ school events or activities',
    suggestedPoints: 50
  },
  {
    name: 'Communication Pro',
    description: 'Excelled in presentations and communication',
    iconName: 'message-circle',
    emoji: '💬',
    category: 'Skills',
    activity: 'Soft Skills',
    suggestedCriteria: 'Deliver 3+ successful class presentations',
    suggestedPoints: 65
  },
  {
    name: 'Certificate Collector',
    description: 'Earned multiple course completion certificates',
    iconName: 'award',
    emoji: '🎖️',
    category: 'Academic',
    activity: 'Certificates',
    suggestedCriteria: 'Earn 5+ course completion certificates',
    suggestedPoints: 90
  },
  {
    name: 'Creative Thinker',
    description: 'Showcased innovative ideas in projects',
    iconName: 'lightbulb',
    emoji: '💡',
    category: 'Skills',
    activity: 'Projects',
    suggestedCriteria: 'Submit a project with innovative or creative solutions',
    suggestedPoints: 70
  }
];

// Generate default School Badges with IDs
export const generateSchoolBadges = (): Badge[] => {
  return SCHOOL_BADGE_TEMPLATES.map((template, index) => ({
    id: `school-badge-${index + 1}`,
    name: template.name,
    description: template.description,
    iconName: template.iconName,
    emoji: template.emoji,
    category: template.category,
    institutionType: 'School' as const,
    activity: template.activity,
    criteria: template.suggestedCriteria,
    points: template.suggestedPoints,
    isActive: true,
    createdAt: new Date()
  }));
};

// Default school badges
export const DEFAULT_SCHOOL_BADGES: Badge[] = generateSchoolBadges();