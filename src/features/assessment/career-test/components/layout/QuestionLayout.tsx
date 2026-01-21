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
 * Get icon image path for a section based on section ID
 */
const getSectionIconPath = (sectionId: string): string => {
  const iconMap: Record<string, string> = {
    // Career Interests (RIASEC)
    'riasec': '/assets/Assessment Icons/Career Interests.png',
    
    // Big Five Personality
    'bigfive': '/assets/Assessment Icons/Big 5 Personality.png',
    
    // Work Values & Motivators
    'values': '/assets/Assessment Icons/Work Value & Motivators.png',
    
    // Employability Skills
    'employability': '/assets/Assessment Icons/Employability Skills.png',
    
    // Multi-Aptitude
    'aptitude': '/assets/Assessment Icons/Multi-Aptitude.png',
    
    // Stream Knowledge
    'knowledge': '/assets/Assessment Icons/Stream Knowledge.png',
    
    // Middle School - Interest Explorer
    'middle_interest_explorer': '/assets/Assessment Icons/Interest Explorer.png',
    
    // Middle School - Strengths & Character
    'middle_strengths_character': '/assets/Assessment Icons/Strenghts & Character.png',
    
    // Middle School - Learning & Work Preferences
    'middle_learning_preferences': '/assets/Assessment Icons/Learning & Work Preference.png',
    
    // High School - Interest Explorer
    'hs_interest_explorer': '/assets/Assessment Icons/Interest Explorer.png',
    
    // High School - Strengths & Character
    'hs_strengths_character': '/assets/Assessment Icons/Strenghts & Character.png',
    
    // High School - Learning & Work Preferences
    'hs_learning_preferences': '/assets/Assessment Icons/Learning & Work Preference.png',
    
    // High School - Aptitude Sampling
    'hs_aptitude_sampling': '/assets/Assessment Icons/Aptitude Sampling.png',
    
    // Adaptive Aptitude Test
    'adaptive_aptitude': '/assets/Assessment Icons/Adaptive Aptitude Test.png',
  };
  
  return iconMap[sectionId] || '/assets/Assessment Icons/Career Interests.png';
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
    <div className="relative min-h-screen">
      <div className="flex flex-col lg:flex-row lg:items-start gap-0 max-w-7xl mx-auto px-4 py-6">
        {/* Left Sidebar with Gray Glass Effect - Sticky Position */}
        <div className="lg:w-72 xl:w-80 shrink-0 relative overflow-hidden rounded-l-2xl backdrop-blur-xl bg-gray-50/40 border border-gray-200/50 shadow-lg lg:sticky lg:top-20 lg:self-start z-20"
          style={{
            background: `linear-gradient(135deg, rgba(249, 250, 251, 0.6) 0%, rgba(243, 244, 246, 0.3) 100%)`,
            boxShadow: '0 8px 32px 0 rgba(107, 114, 128, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.5)',
          }}
        >
          {/* Glass shine effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-l-2xl pointer-events-none z-0" />
          
          <div className="p-6 space-y-4 relative z-10">
          {/* Section Icon with Glassmorphism - Centered */}
          <div className="flex justify-center">
            <div 
              className="w-20 h-20 rounded-3xl flex items-center justify-center p-4 relative overflow-hidden backdrop-blur-xl bg-white/30 border border-white/40 shadow-2xl"
              style={{
                background: `linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 100%)`,
                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.5)',
              }}
            >
              {/* Glass shine effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-3xl" />
              
              <img 
                src={getSectionIconPath(sectionId)} 
                alt={sectionTitle}
                className="w-full h-full object-contain relative z-10 drop-shadow-lg"
              />
            </div>
          </div>
          
          {/* Section Title */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">{sectionTitle}</h2>
            <p className="text-sm text-gray-600 mt-1">{sectionDescription}</p>
          </div>
          
          {/* Instruction Box */}
          {sectionInstruction && (
            <div className="bg-blue-50 border-blue-200 border rounded-xl p-4">
              <p className="text-sm text-blue-700 font-medium">
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
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-200">
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
            
            {/* Timer - With blink animation on time value only */}
            <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium">
              <Clock className="w-4 h-4" />
              <span>Time: <span className="animate-[pulse_2s_ease-in-out_infinite] text-indigo-800">{formatTime(elapsedTime)}</span></span>
            </div>
          </div>
          </div>
        </div>
      
      {/* Right Content Area with Blue Glass Effect */}
      <div className="flex-1 min-w-0 relative rounded-r-2xl backdrop-blur-xl bg-blue-50/40 border-t border-r border-b border-blue-200/50 shadow-lg flex flex-col z-10 min-h-[600px]"
        style={{
          background: `linear-gradient(135deg, rgba(219, 234, 254, 0.6) 0%, rgba(191, 219, 254, 0.3) 100%)`,
          boxShadow: '0 8px 32px 0 rgba(59, 130, 246, 0.1), inset 0 1px 0 0 rgba(255, 255, 255, 0.5)',
        }}
      >
        {/* Glass shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-r-2xl pointer-events-none z-0" />
        
        <div className="relative z-10 p-6 flex-1 flex flex-col">
          {children}
        </div>
      </div>
    </div>
    </div>
  );
};

export default QuestionLayout;
