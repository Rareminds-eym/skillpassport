// Topic Selector Component

import React from 'react';
import { CounsellingTopicType } from '../../types/counselling';
import { 
  GraduationCap, 
  Briefcase, 
  TrendingUp, 
  Heart, 
  MessageSquare 
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

interface TopicOption {
  value: CounsellingTopicType;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const TOPIC_OPTIONS: TopicOption[] = [
  {
    value: 'academic',
    label: 'Academic Guidance',
    description: 'Course selection, study strategies, and academic planning',
    icon: GraduationCap,
    color: 'from-blue-500 to-blue-600',
  },
  {
    value: 'career',
    label: 'Career Counselling',
    description: 'Career exploration, job market insights, and professional development',
    icon: Briefcase,
    color: 'from-green-500 to-green-600',
  },
  {
    value: 'performance',
    label: 'Performance Analysis',
    description: 'Academic performance review, goal setting, and improvement strategies',
    icon: TrendingUp,
    color: 'from-purple-500 to-purple-600',
  },
  {
    value: 'mental-health',
    label: 'Student Wellbeing',
    description: 'Stress management, work-life balance, and emotional support',
    icon: Heart,
    color: 'from-pink-500 to-pink-600',
  },
  {
    value: 'general',
    label: 'General Guidance',
    description: 'Campus resources, student life, and general questions',
    icon: MessageSquare,
    color: 'from-gray-500 to-gray-600',
  },
];

interface TopicSelectorProps {
  selectedTopic: CounsellingTopicType;
  onSelectTopic: (topic: CounsellingTopicType) => void;
}

export const TopicSelector: React.FC<TopicSelectorProps> = ({
  selectedTopic,
  onSelectTopic,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {TOPIC_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isSelected = selectedTopic === option.value;

        return (
          <Card
            key={option.value}
            className={cn(
              'cursor-pointer transition-all hover:shadow-lg group',
              isSelected
                ? 'border-2 border-blue-500 shadow-md'
                : 'hover:border-gray-300'
            )}
            onClick={() => onSelectTopic(option.value)}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={cn(
                    'p-3 rounded-xl bg-gradient-to-br text-white shadow-sm',
                    'group-hover:scale-110 transition-transform',
                    option.color
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {option.label}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {option.description}
                  </p>
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="flex-shrink-0">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};