import React from 'react';
import {
  Trophy,
  CalendarCheck,
  Zap,
  Users,
  Laptop,
  Shield,
  Sparkles,
  MessageCircle,
  Award,
  Lightbulb,
  GraduationCap,
  Briefcase,
  Target,
  Microscope,
  Code,
  Rocket,
  Compass,
  Network,
  Megaphone,
  BadgeCheck,
  Star,
  Medal,
  BookOpen,
  FlaskConical,
  Calculator,
  HeartPulse,
  Building2,
  FileText,
  Cpu,
  Globe,
  LucideIcon
} from 'lucide-react';
import { BadgeIconName } from '../types/badge';

// Icon mapping object
export const BADGE_ICONS: Record<BadgeIconName, LucideIcon> = {
  'trophy': Trophy,
  'calendar-check': CalendarCheck,
  'zap': Zap,
  'users': Users,
  'laptop': Laptop,
  'shield': Shield,
  'sparkles': Sparkles,
  'message-circle': MessageCircle,
  'award': Award,
  'lightbulb': Lightbulb,
  'graduation-cap': GraduationCap,
  'briefcase': Briefcase,
  'target': Target,
  'microscope': Microscope,
  'code': Code,
  'rocket': Rocket,
  'compass': Compass,
  'network': Network,
  'megaphone': Megaphone,
  'badge-check': BadgeCheck,
  'star': Star,
  'medal': Medal,
  'book-open': BookOpen,
  'flask': FlaskConical,
  'calculator': Calculator,
  'heart-pulse': HeartPulse,
  'building': Building2,
  'file-text': FileText,
  'cpu': Cpu,
  'globe': Globe
};

// Icon component wrapper
interface BadgeIconProps {
  name: BadgeIconName;
  size?: number;
  className?: string;
}

export const BadgeIcon: React.FC<BadgeIconProps> = ({ 
  name, 
  size = 24, 
  className = '' 
}) => {
  const IconComponent = BADGE_ICONS[name];
  
  if (!IconComponent) {
    return <Award size={size} className={className} />;
  }
  
  return <IconComponent size={size} className={className} />;
};

// Get all available icon names
export const getAvailableIcons = (): BadgeIconName[] => {
  return Object.keys(BADGE_ICONS) as BadgeIconName[];
};

// Icon display info for picker
export interface IconOption {
  name: BadgeIconName;
  label: string;
  emoji: string;
}

export const ICON_OPTIONS: IconOption[] = [
  { name: 'trophy', label: 'Trophy', emoji: '🏆' },
  { name: 'calendar-check', label: 'Calendar Check', emoji: '📅' },
  { name: 'zap', label: 'Lightning', emoji: '⚡' },
  { name: 'users', label: 'Users', emoji: '👥' },
  { name: 'laptop', label: 'Laptop', emoji: '💻' },
  { name: 'shield', label: 'Shield', emoji: '🛡️' },
  { name: 'sparkles', label: 'Sparkles', emoji: '✨' },
  { name: 'message-circle', label: 'Message', emoji: '💬' },
  { name: 'award', label: 'Award', emoji: '🎖️' },
  { name: 'lightbulb', label: 'Lightbulb', emoji: '💡' },
  { name: 'graduation-cap', label: 'Graduation', emoji: '🎓' },
  { name: 'briefcase', label: 'Briefcase', emoji: '💼' },
  { name: 'target', label: 'Target', emoji: '🎯' },
  { name: 'microscope', label: 'Microscope', emoji: '🔬' },
  { name: 'code', label: 'Code', emoji: '👨‍💻' },
  { name: 'rocket', label: 'Rocket', emoji: '🚀' },
  { name: 'compass', label: 'Compass', emoji: '🧭' },
  { name: 'network', label: 'Network', emoji: '🌐' },
  { name: 'megaphone', label: 'Megaphone', emoji: '📢' },
  { name: 'badge-check', label: 'Verified Badge', emoji: '✅' },
  { name: 'star', label: 'Star', emoji: '⭐' },
  { name: 'medal', label: 'Medal', emoji: '🏅' },
  { name: 'book-open', label: 'Book', emoji: '📖' },
  { name: 'flask', label: 'Flask', emoji: '🧪' },
  { name: 'calculator', label: 'Calculator', emoji: '🧮' },
  { name: 'heart-pulse', label: 'Health', emoji: '💓' },
  { name: 'building', label: 'Building', emoji: '🏢' },
  { name: 'file-text', label: 'Document', emoji: '📄' },
  { name: 'cpu', label: 'CPU', emoji: '🖥️' },
  { name: 'globe', label: 'Globe', emoji: '🌍' }
];

export default BadgeIcon;