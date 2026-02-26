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
import { supabase } from '../../lib/supabaseClient';

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
}

const CareerAIToolsGrid: React.FC<CareerAIToolsGridProps> = ({
  onAction,
  variant = 'full',
  animated = true,
  navigateOnClick = false,
}) => {
  const navigate = useNavigate();
  const [actions, setActions] = useState<CareerAIAction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGradeAppropriateActions();
  }, []);

  const fetchGradeAppropriateActions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/career/get-actions', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.actions) {
          // Map icon strings to actual icon components
          const mappedActions = data.actions.map((action: any) => ({
            ...action,
            icon: iconMap[action.icon] || Lightbulb,
          }));
          setActions(mappedActions);
        }
      }
    } catch (error) {
      console.error('Error fetching grade-appropriate actions:', error);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <Container 
      {...containerProps}
      className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${isCompact ? 'max-w-full' : 'max-w-2xl mx-auto'}`}
    >
      {actions.map((action, index) => (
        <Wrapper
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
