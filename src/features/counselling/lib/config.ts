import { GraduationCap, Briefcase, TrendingUp, Heart, MessageSquare } from 'lucide-react';
import type { CounsellingTopicType } from '../model/types';

/**
 * Configuration for Counselling Feature
 */

export const counsellingConfig = {
  welcome: {
    title: 'University AI Counselling',
    subtitle: 'Get personalized guidance and support for your academic journey. Ask me anything about academics, career, wellbeing, or student life.',
    quickActions: [
      {
        id: 'academic',
        label: 'Academic Guidance',
        icon: GraduationCap,
        gradient: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white',
        query: 'I need help with my academic planning and course selection'
      },
      {
        id: 'career',
        label: 'Career Counselling',
        icon: Briefcase,
        gradient: 'bg-gradient-to-br from-green-500 to-green-600 text-white',
        query: 'I want to explore career opportunities and get advice on my career path'
      },
      {
        id: 'performance',
        label: 'Performance Review',
        icon: TrendingUp,
        gradient: 'bg-gradient-to-br from-purple-500 to-purple-600 text-white',
        query: 'Can you help me analyze my academic performance and improve my grades?'
      },
      {
        id: 'wellbeing',
        label: 'Student Wellbeing',
        icon: Heart,
        gradient: 'bg-gradient-to-br from-pink-500 to-pink-600 text-white',
        query: 'I need advice on managing stress and maintaining work-life balance'
      },
      {
        id: 'general',
        label: 'General Guidance',
        icon: MessageSquare,
        gradient: 'bg-gradient-to-br from-gray-600 to-gray-700 text-white',
        query: 'What campus resources and opportunities are available to me?'
      }
    ]
  },
  chat: {
    placeholder: 'Ask me anything about academics, career, wellbeing, or student life...',
    disclaimer: 'AI-powered counselling assistant. For urgent matters, please contact your university counsellor.'
  },
  suggestions: {
    academic: [
      'How should I choose my electives?',
      'What study techniques work best?',
      'How can I improve my time management?'
    ],
    career: [
      'What skills should I develop?',
      'How do I prepare for interviews?',
      'What career paths match my interests?'
    ],
    performance: [
      'How can I improve my grades?',
      'What are my strengths and weaknesses?',
      'How do I set realistic goals?'
    ],
    'mental-health': [
      'How can I manage stress better?',
      'What are healthy study habits?',
      'How do I maintain work-life balance?'
    ],
    general: [
      'What extracurricular activities should I join?',
      'How can I make the most of university?',
      'What resources are available to me?'
    ]
  } as Record<CounsellingTopicType, string[]>
};
