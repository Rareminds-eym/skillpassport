import {
  Users,
  Briefcase,
  Target,
  TrendingUp,
  Search,
  BarChart3,
  MessageSquare,
  Award,
  Filter,
  UserCheck,
} from 'lucide-react';
import { WelcomeConfig } from '../../../shared/chat-ui/types';

/**
 * Recruiter AI Copilot Configuration
 * Welcome screen and quick actions tailored for recruiters
 */

export const recruiterWelcomeConfig: WelcomeConfig = {
  title: 'Welcome to Talent Scout',
  subtitle:
    'Discover top talent, get intelligent candidate insights, and streamline your hiring process. Ask me anything about candidates, job matches, or talent analytics!',
  quickActions: [
    {
      id: 'candidate-search',
      label: 'Find Candidates',
      // @ts-expect-error - Auto-suppressed for migration
      icon: Search,
      query: 'Show me top candidates for my open positions',
      gradient: 'bg-blue-100 hover:bg-blue-200 text-blue-700',
    },
    {
      id: 'job-matching',
      label: 'Job Matching',
      // @ts-expect-error - Auto-suppressed for migration
      icon: Target,
      query: 'Match candidates to my Software Engineer role',
      gradient: 'bg-purple-100 hover:bg-purple-200 text-purple-700',
    },
    {
      id: 'talent-analytics',
      label: 'Talent Pool',
      // @ts-expect-error - Auto-suppressed for migration
      icon: BarChart3,
      query: 'Analyze my talent pool and show key insights',
      gradient: 'bg-green-100 hover:bg-green-200 text-green-700',
    },
    {
      id: 'hiring-recommendations',
      label: 'Hiring Ready',
      // @ts-expect-error - Auto-suppressed for migration
      icon: UserCheck,
      query: 'Which candidates are ready to hire now?',
      gradient: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700',
    },
    {
      id: 'skill-insights',
      label: 'Skill Insights',
      // @ts-expect-error - Auto-suppressed for migration
      icon: Award,
      query: 'What are the most common skills in my candidate pool?',
      gradient: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700',
    },
    {
      id: 'pipeline-review',
      label: 'Pipeline Review',
      // @ts-expect-error - Auto-suppressed for migration
      icon: Briefcase,
      query: 'Review my recruitment pipeline status',
      gradient: 'bg-pink-100 hover:bg-pink-200 text-pink-700',
    },
    {
      id: 'market-trends',
      label: 'Market Trends',
      // @ts-expect-error - Auto-suppressed for migration
      icon: TrendingUp,
      query: 'What are the current hiring trends?',
      gradient: 'bg-teal-100 hover:bg-teal-200 text-teal-700',
    },
    {
      id: 'interview-tips',
      label: 'Interview Guide',
      // @ts-expect-error - Auto-suppressed for migration
      icon: MessageSquare,
      query: 'Give me interview tips for technical candidates',
      gradient: 'bg-orange-100 hover:bg-orange-200 text-orange-700',
    },
    {
      id: 'filter-candidates',
      label: 'Filter by Skills',
      // @ts-expect-error - Auto-suppressed for migration
      icon: Filter,
      query: 'Find candidates with React and Node.js skills',
      gradient: 'bg-red-100 hover:bg-red-200 text-red-700',
    },
    {
      id: 'emerging-talent',
      label: 'Rising Stars',
      // @ts-expect-error - Auto-suppressed for migration
      icon: Users,
      query: 'Show me emerging talent with high potential',
      gradient: 'bg-cyan-100 hover:bg-cyan-200 text-cyan-700',
    },
  ],
};

export const recruiterChatConfig = {
  placeholder: 'Ask about candidates, job matches, talent analytics, or hiring insights...',
  enableVoice: false,
  enableAttachments: false,
  disclaimer:
    'Recruiter AI provides recommendations based on available data. Final hiring decisions should consider comprehensive evaluation and interviews.',
};
