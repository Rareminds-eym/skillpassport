import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Target,
  BookOpen,
  FileText,
  GraduationCap,
  TrendingUp,
  Users,
  Lightbulb,
  Plus,
} from 'lucide-react';

export interface CareerAIAction {
  id: string;
  label: string;
  icon: React.ElementType;
  prompt: string;
  iconBg: string;
  iconColor: string;
}

export const careerAIActions: CareerAIAction[] = [
  {
    id: 'jobs',
    label: 'Find Jobs',
    icon: Briefcase,
    prompt: 'What jobs match my skills and experience?',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 'skills',
    label: 'Skill Gap Analysis',
    icon: Target,
    prompt: 'Analyze my skill gaps for my target career',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 'interview',
    label: 'Interview Prep',
    icon: BookOpen,
    prompt: 'Help me prepare for upcoming interviews',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 'resume',
    label: 'Resume Review',
    icon: FileText,
    prompt: 'Review my resume and suggest improvements',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 'learning',
    label: 'Learning Path',
    icon: GraduationCap,
    prompt: 'Create a learning roadmap for my career goals',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 'career',
    label: 'Career Guidance',
    icon: TrendingUp,
    prompt: 'What career paths are best suited for me?',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 'network',
    label: 'Networking Tips',
    icon: Users,
    prompt: 'Give me networking strategies for my field',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    id: 'advice',
    label: 'Career Advice',
    icon: Lightbulb,
    prompt: 'I need career advice and guidance',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
];

interface CareerAIToolsGridProps {
  onAction?: (prompt: string, label: string) => void;
  variant?: 'full' | 'compact';
  animated?: boolean;
  navigateOnClick?: boolean;
}

const CareerAIToolsGrid: React.FC<CareerAIToolsGridProps> = ({
  onAction,
  variant = 'full',
  animated = true,
  navigateOnClick = false,
}) => {
  const navigate = useNavigate();

  const handleClick = (action: CareerAIAction) => {
    if (onAction) {
      onAction(action.prompt, action.label);
    } else if (navigateOnClick) {
      navigate('/student/career-ai', { state: { query: action.prompt } });
    }
  };

  const isCompact = variant === 'compact';
  const Wrapper = animated ? motion.button : 'button';
  const Container = animated ? motion.div : 'div';

  const containerProps = animated
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { delay: 0.3 },
      }
    : {};

  const getButtonProps = (index: number) =>
    animated
      ? {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: 0.05 * index },
          whileHover: { scale: 1.02, y: -2 },
          whileTap: { scale: 0.98 },
        }
      : {};

  return (
    <Container
      {...containerProps}
      className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isCompact ? 'max-w-full' : 'max-w-2xl mx-auto'}`}
    >
      {careerAIActions.map((action, index) => (
        <Wrapper
          key={action.id}
          {...getButtonProps(index)}
          onClick={() => handleClick(action)}
          className={`flex items-center gap-4 bg-white border border-gray-200 rounded-2xl text-left transition-all duration-200 hover:shadow-md hover:border-gray-300 group ${
            isCompact ? 'px-3 py-2.5' : 'px-4 py-3'
          }`}
        >
          <div
            className={`${action.iconBg} ${isCompact ? 'w-10 h-10' : 'w-11 h-11'} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
          >
            <action.icon className={`${isCompact ? 'w-5 h-5' : 'w-5 h-5'} ${action.iconColor}`} />
          </div>
          <span className={`font-medium text-gray-800 flex-1 ${isCompact ? 'text-sm' : 'text-sm'}`}>
            {action.label}
          </span>
          <div
            className={`${isCompact ? 'w-7 h-7' : 'w-8 h-8'} rounded-full bg-white border border-gray-300 flex items-center justify-center flex-shrink-0 group-hover:border-gray-400 transition-colors`}
          >
            <Plus className={`${isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-gray-900`} />
          </div>
        </Wrapper>
      ))}
    </Container>
  );
};

export default CareerAIToolsGrid;
