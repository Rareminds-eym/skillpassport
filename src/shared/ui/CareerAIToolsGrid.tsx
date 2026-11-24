import { z } from 'zod';
import { ssoClient } from '@/shared/api/ssoClient';
import { useAuthStore } from '@/shared/model/authStore';
import React, { useEffect, useState } from 'react';
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
  Sparkles,
  Compass,
  Star,
  Heart,
  Wrench,
  GitBranch,
  Calendar,
  FileCheck,
  MessageSquare
} from 'lucide-react';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('career-ai-tools-grid');

export interface CareerAIAction {
  id: string;
  label: string;
  icon: React.ElementType;
  prompt: string;
  iconBg: string;
  iconColor: string;
}

// Icon mapping for dynamic icon names from backend
const iconMap: Record<string, React.ElementType> = {
  Briefcase,
  Target,
  BookOpen,
  FileText,
  GraduationCap,
  TrendingUp,
  Users,
  Lightbulb,
  Sparkles,
  Compass,
  Star,
  Heart,
  Wrench,
  GitBranch,
  Calendar,
  FileCheck,
  MessageSquare,
};

interface CareerAIToolsGridProps {
  onAction?: (prompt: string, label: string) => void;
  variant?: 'full' | 'compact';
  animated?: boolean;
  navigateOnClick?: boolean;
  disabled?: boolean;
}

const CareerAIToolsGrid: React.FC<CareerAIToolsGridProps> = ({
  onAction,
  variant = 'full',
  animated = true,
  navigateOnClick = false,
  disabled = false,
}) => {
  const navigate = useNavigate();
  const [actions, setActions] = useState<CareerAIAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGradeAppropriateActions();
  }, []);

  const fetchGradeAppropriateActions = async () => {
    setLoading(true);
    setError(null);
    try {
      const isAuthenticated = useAuthStore.getState().isAuthenticated;
      if (!isAuthenticated) {
        throw new Error('Sign in to load career tools.');
      }

      const response = await ssoClient.fetch('/api/career/get-actions');

      if (!response.ok) throw new Error('Unable to load career tools.');
      if (response.ok) {
        const data = z.object({ success: z.boolean(), data: z.object({ actions: z.array(z.object({
          id: z.string(), label: z.string(), icon: z.string(), prompt: z.string(), iconBg: z.string(), iconColor: z.string()
        })) }) }).parse(await response.json());
        if (data.success && data.data?.actions) {
          // Map icon strings to actual icon components
          const mappedActions = data.data.actions.map((action) => ({
            ...action,
            icon: iconMap[action.icon] || Lightbulb,
          }));
          setActions(mappedActions);
        } else throw new Error('Invalid career tools response.');
      }
    } catch (error) {
      logger.error('Error fetching grade-appropriate actions', error as Error);
      setError(error instanceof z.ZodError ? 'Career tools returned an invalid response. Please try again.'
        : error instanceof Error ? error.message : 'Unable to load career tools.');
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (action: CareerAIAction) => {
    if (disabled) return;
    if (onAction) {
      onAction(action.prompt, action.label);
    } else if (navigateOnClick) {
      navigate('/learner/career-ai', { state: { query: action.prompt } });
    }
  };

  const isCompact = variant === 'compact';
  const Wrapper = animated ? motion.button : 'button';
  const Container = animated ? motion.div : 'div';

  const containerProps = animated ? {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { delay: 0.3 }
  } : {};

  const getButtonProps = (index: number) => animated ? {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.05 * index },
    whileHover: { scale: 1.02, y: -2 },
    whileTap: { scale: 0.98 }
  } : {};

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isCompact ? 'max-w-full' : 'max-w-2xl mx-auto'}`}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-100 animate-pulse rounded-2xl h-16" />
        ))}
      </div>
    );
  }

  if (error) return <div role="alert" className="p-3 text-sm text-red-700">{error} <button onClick={fetchGradeAppropriateActions} className="underline">Retry career tools</button></div>;
  if (!actions.length) return <p className="text-sm text-gray-500 text-center">No career tools are available.</p>;
  return (
    <Container 
      {...containerProps}
      className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isCompact ? 'max-w-full' : 'max-w-2xl mx-auto'}`}
    >
      {actions.map((action, index) => (
        <Wrapper
          disabled={disabled}
          key={action.id}
          {...getButtonProps(index)}
          onClick={() => handleClick(action)}
          className={`flex items-center gap-4 bg-white border border-gray-200 rounded-2xl text-left transition-all duration-200 hover:shadow-md hover:border-gray-300 group ${
            isCompact ? 'px-3 py-2.5' : 'px-4 py-3'
          }`}
        >
          <div className={`${action.iconBg} ${isCompact ? 'w-10 h-10' : 'w-11 h-11'} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
            <action.icon className={`${isCompact ? 'w-5 h-5' : 'w-5 h-5'} ${action.iconColor}`} />
          </div>
          <span className={`font-medium text-gray-800 flex-1 ${isCompact ? 'text-sm' : 'text-sm'}`}>
            {action.label}
          </span>
          <div className={`${isCompact ? 'w-7 h-7' : 'w-8 h-8'} rounded-full bg-white border border-gray-300 flex items-center justify-center flex-shrink-0 group-hover:border-gray-400 transition-colors`}>
            <Plus className={`${isCompact ? 'w-3.5 h-3.5' : 'w-4 h-4'} text-gray-900`} />
          </div>
        </Wrapper>
      ))}
    </Container>
  );
};

export default CareerAIToolsGrid;
