/**
 * QuestionLayout Component
 * 
 * Two-column layout for assessment questions with a left sidebar
 * showing section info, progress, and timer.
 * 
 * @module features/assessment/career-test/components/layout/QuestionLayout
 */

import React from 'react';
import { 
  Heart, 
  Brain, 
  BookOpen, 
  Target, 
  Briefcase, 
  Lightbulb,
  Clock,
  Layers,
  HelpCircle,
  CheckCircle
} from 'lucide-react';

interface QuestionLayoutProps {
  children: React.ReactNode;
  sectionTitle: string;
  sectionDescription: string;
  sectionInstruction?: string;
  sectionId: string;
  sectionColor?: string;
  currentSectionIndex: number;
  totalSections: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  elapsedTime: number;
  showNoWrongAnswers?: boolean;
  perQuestionTimer?: number | null; // Per-question timer (for aptitude/knowledge)
  showPerQuestionTimer?: boolean; // Whether to show per-question timer instead of elapsed time
}

/**
 * Get section icon based on section ID
 */
const getSectionIcon = (sectionId: string, color: string) => {
  const iconClass = `w-6 h-6 text-${color}-500`;
  
  const iconMap: Record<string, React.ReactNode> = {
    // Interest/RIASEC sections
    'hs_interest_explorer': <Heart className={iconClass} />,
    'middle_interest_explorer': <Heart className={iconClass} />,
    'riasec': <Heart className={iconClass} />,
    
    // Strengths/Character sections
    'hs_strengths_character': <Brain className={iconClass} />,
    'middle_strengths_character': <Brain className={iconClass} />,
    'bigfive': <Brain className={iconClass} />,
    
    // Learning/Preferences sections
    'hs_learning_preferences': <BookOpen className={iconClass} />,
    'middle_learning_preferences': <BookOpen className={iconClass} />,
    
    // Aptitude sections
    'hs_aptitude_sampling': <Target className={iconClass} />,
    'aptitude': <Target className={iconClass} />,
    'adaptive_aptitude': <Lightbulb className={iconClass} />,
    
    // Values/Employability
    'values': <Briefcase className={iconClass} />,
    'employability': <Briefcase className={iconClass} />,
    
    // Knowledge
    'knowledge': <BookOpen className={iconClass} />,
  };
  
  return iconMap[sectionId] || <HelpCircle className={iconClass} />;
};

/**
 * Get color classes based on section color
 */
const getColorClasses = (color: string) => {
  const colorMap: Record<string, { bg: string; border: string; text: string; iconBg: string }> = {
    rose: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', iconBg: 'bg-rose-100' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', iconBg: 'bg-amber-100' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', iconBg: 'bg-blue-100' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', iconBg: 'bg-purple-100' },
    indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', iconBg: 'bg-indigo-100' },
    green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', iconBg: 'bg-green-100' },
  };
  
  return colorMap[color] || colorMap.indigo;
};

/**
 * Format time as MM:SS
 */
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Question Layout with sidebar
 */
export const QuestionLayout: React.FC<QuestionLayoutProps> = ({
  children,
  sectionTitle,
  sectionDescription,
  sectionInstruction,
  sectionId,
  sectionColor = 'indigo',
  currentSectionIndex,
  totalSections,
  currentQuestionIndex,
  totalQuestions,
  elapsedTime,
  showNoWrongAnswers = true,
  perQuestionTimer = null,
  showPerQuestionTimer = false,
}) => {
  const colors = getColorClasses(sectionColor);
  
  // Determine timer color based on remaining time
  const getTimerColor = () => {
    if (!showPerQuestionTimer || perQuestionTimer === null) return 'text-indigo-600';
    if (perQuestionTimer <= 10) return 'text-red-600';
    return 'text-orange-600';
  };
  
  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      {/* Left Sidebar */}
      <div className="lg:w-72 xl:w-80 shrink-0">
        <div className="lg:sticky lg:top-24 space-y-4">
          {/* Section Icon */}
          <div className={`w-14 h-14 ${colors.iconBg} rounded-2xl flex items-center justify-center`}>
            {getSectionIcon(sectionId, sectionColor)}
          </div>
          
          {/* Section Title */}
          <div>
            <h2 className="text-xl font-bold text-gray-900">{sectionTitle}</h2>
            <p className="text-sm text-gray-600 mt-1">{sectionDescription}</p>
          </div>
          
          {/* Instruction Box */}
          {sectionInstruction && (
            <div className={`${colors.bg} ${colors.border} border rounded-xl p-4`}>
              <p className={`text-sm ${colors.text}`}>
                {sectionInstruction}
              </p>
            </div>
          )}
          
          {/* No Wrong Answers Note */}
          {showNoWrongAnswers && (
            <div className="flex items-start gap-2 text-gray-500">
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-sm">There are no right or wrong answers.</p>
            </div>
          )}
          
          {/* Progress Info */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            {/* Section Progress */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Layers className="w-4 h-4" />
              <span>Section {currentSectionIndex + 1} of {totalSections}</span>
            </div>
            
            {/* Question Progress */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <HelpCircle className="w-4 h-4" />
              <span>Question {currentQuestionIndex + 1} / {totalQuestions}</span>
            </div>
            
            {/* Timer - Always show section elapsed time in sidebar */}
            <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium">
              <Clock className="w-4 h-4" />
              <span>Time: {formatTime(elapsedTime)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Content Area */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
};

export default QuestionLayout;
