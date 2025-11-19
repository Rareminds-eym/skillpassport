import { 
  Users, 
  BarChart3, 
  AlertCircle, 
  Lightbulb,
  TrendingUp,
  BookOpen,
  Target,
  MessageCircle 
} from 'lucide-react';
import { WelcomeConfig } from '../../../shared/chat-ui/types';

/**
 * Educator AI Copilot Configuration
 * Welcome screen and quick actions tailored for educators
 */

export const educatorWelcomeConfig: WelcomeConfig = {
  title: 'Welcome to Teaching Intelligence',
  subtitle: 'Get intelligent insights about your students, class analytics, and personalized guidance recommendations. Ask me anything about student career development!',
  quickActions: [
    {
      id: 'student-insights',
      label: 'Student Insights',
      icon: Users,
      query: 'Which students need my attention right now?',
      gradient: 'bg-blue-100 hover:bg-blue-200 text-blue-700'
    },
    {
      id: 'class-analytics',
      label: 'Class Analytics',
      icon: BarChart3,
      query: 'Show me analytics for my class',
      gradient: 'bg-purple-100 hover:bg-purple-200 text-purple-700'
    },
    {
      id: 'interventions',
      label: 'Interventions',
      icon: AlertCircle,
      query: 'Which students are at risk and need intervention?',
      gradient: 'bg-red-100 hover:bg-red-200 text-red-700'
    },
    {
      id: 'guidance',
      label: 'Guidance Tips',
      icon: Lightbulb,
      query: 'How can I better guide my students in career planning?',
      gradient: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
    },
    {
      id: 'skill-trends',
      label: 'Skill Trends',
      icon: TrendingUp,
      query: 'What skills should I focus on teaching?',
      gradient: 'bg-green-100 hover:bg-green-200 text-green-700'
    },
    {
      id: 'resources',
      label: 'Resources',
      icon: BookOpen,
      query: 'Recommend learning resources for my students',
      gradient: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'
    },
    {
      id: 'career-readiness',
      label: 'Career Readiness',
      icon: Target,
      query: 'How career-ready are my students?',
      gradient: 'bg-pink-100 hover:bg-pink-200 text-pink-700'
    },
    {
      id: 'engagement',
      label: 'Engagement',
      icon: MessageCircle,
      query: 'How can I improve student engagement?',
      gradient: 'bg-teal-100 hover:bg-teal-200 text-teal-700'
    }
  ]
};

export const educatorChatConfig = {
  placeholder: 'Ask about your students, class insights, or guidance strategies...',
  enableVoice: false,
  enableAttachments: false,
  disclaimer: 'Educator AI provides guidance based on available data. Always use your professional judgment in decision-making.'
};
