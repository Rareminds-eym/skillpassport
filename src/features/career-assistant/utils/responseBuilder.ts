/**
 * Response Builder Utility
 * Transforms raw data into interactive AI responses with cards, buttons, and visualizations
 */

import {
  EnhancedAIResponse,
  InteractiveElements,
  JobCard,
  SkillCard,
  CourseCard,
  InsightCard,
  ActionButton,
  SuggestedAction,
  VisualizationData,
  JobMatchResponseData,
  SkillGapResponseData,
  ProfileAnalysisData
} from '../types/interactive';

/**
 * Build job match response with interactive job cards
 */
export function buildJobMatchResponse(
  data: JobMatchResponseData,
  message: string
): EnhancedAIResponse {
  const jobCards: JobCard[] = data.matches.slice(0, 5).map((match, idx) => ({
    id: `job-${match.job_id}-${idx}`,
    type: 'job',
    priority: match.match_score >= 80 ? 'high' : match.match_score >= 60 ? 'medium' : 'low',
    data: {
      title: match.job_title,
      company: match.company_name,
      location: match.opportunity.location || 'Remote',
      salary: match.opportunity.stipend || 'Not specified',
      employmentType: match.opportunity.opportunity_type || 'Full-time',
      matchScore: match.match_score,
      matchReason: match.match_reason,
      tags: match.key_matching_skills.slice(0, 5),
      deadline: match.opportunity.deadline
    },
    actions: [
      {
        id: `view-${match.job_id}`,
        label: 'View Details',
        icon: 'ExternalLink',
        variant: 'primary',
        action: {
          type: 'navigate',
          value: `/opportunities/${match.job_id}`
        }
      },
      {
        id: `apply-${match.job_id}`,
        label: 'Apply Now',
        icon: 'Send',
        variant: 'success',
        action: {
          type: 'external',
          value: match.opportunity.apply_link || '#'
        }
      },
      {
        id: `skills-${match.job_id}`,
        label: `Gap: ${match.skills_gap.length} skills`,
        icon: 'Target',
        variant: 'outline',
        action: {
          type: 'query',
          value: `What skills do I need to learn for ${match.job_title}?`
        },
        disabled: match.skills_gap.length === 0
      }
    ]
  }));

  const suggestions: SuggestedAction[] = [
    {
      id: 'refine-search',
      label: 'Refine my search',
      query: 'Show me jobs with better skill match',
      icon: 'Filter'
    },
    {
      id: 'skill-gap',
      label: 'Analyze skill gaps',
      query: 'What skills am I missing for these jobs?',
      icon: 'Target'
    },
    {
      id: 'improve-profile',
      label: 'Improve my profile',
      query: 'How can I improve my profile to get better matches?',
      icon: 'User'
    }
  ];

  return {
    success: true,
    message,
    data,
    interactive: {
      cards: jobCards,
      suggestions,
      metadata: {
        intentHandled: 'find-jobs',
        dataSource: 'opportunities_database'
      }
    }
  };
}

/**
 * Build skill gap response with interactive skill cards
 */
export function buildSkillGapResponse(
  data: SkillGapResponseData,
  message: string,
  detailedGaps?: Array<{ skill: string; demand: number; priority: string; impact: string }>
): EnhancedAIResponse {
  const gaps = detailedGaps || data.missingSkills.map(skill => ({
    skill,
    demand: 75, // Default demand
    priority: 'high',
    impact: '+20% job opportunities'
  }));

  const skillCards: SkillCard[] = gaps.slice(0, 6).map((gap, idx) => {
    const priorityMap: { [key: string]: 'critical' | 'high' | 'medium' | 'low' } = {
      critical: 'critical',
      high: 'high',
      medium: 'medium',
      low: 'low'
    };
    
    return {
      id: `skill-${idx}`,
      type: 'skill',
      priority: gap.priority === 'critical' ? 'high' : 'medium',
      data: {
        name: gap.skill,
        demand: gap.demand,
        impact: gap.impact,
        status: 'missing',
        priority: priorityMap[gap.priority] || 'medium',
        timeToLearn: gap.demand > 80 ? '6-8 weeks' : '4-6 weeks'
      },
      actions: [
        {
          id: `learn-${idx}`,
          label: 'Find Courses',
          icon: 'BookOpen',
          variant: 'primary',
          action: {
            type: 'query',
            value: `Show me courses to learn ${gap.skill}`
          }
        },
        {
          id: `jobs-${idx}`,
          label: 'See Jobs',
          icon: 'Briefcase',
          variant: 'secondary',
          action: {
            type: 'query',
            value: `What jobs require ${gap.skill}?`
          }
        }
      ]
    };
  });

  const progressBars = [
    {
      label: 'Skills Completeness',
      value: Math.round((data.currentSkillsCount / data.recommendedSkillsCount) * 100),
      color: 'blue' as const,
      showPercentage: true
    }
  ];

  const suggestions: SuggestedAction[] = [
    {
      id: 'learning-path',
      label: 'Create learning roadmap',
      query: 'Create a learning path for these skills',
      icon: 'Map'
    },
    {
      id: 'prioritize',
      label: 'Which skill to learn first?',
      query: 'Which skill should I learn first?',
      icon: 'Target'
    },
    {
      id: 'certifications',
      label: 'Recommended certifications',
      query: 'What certifications should I get?',
      icon: 'Award'
    }
  ];

  return {
    success: true,
    message,
    data,
    interactive: {
      cards: skillCards,
      suggestions,
      visualData: { progressBars },
      metadata: {
        intentHandled: 'skill-gap-analysis',
        dataSource: 'market_intelligence'
      }
    }
  };
}

/**
 * Build profile analysis response with insight cards
 */
export function buildProfileAnalysisResponse(
  data: ProfileAnalysisData,
  message: string
): EnhancedAIResponse {
  const { careerReadiness, profileHealth } = data;

  // Create insight cards for improvements
  const insightCards: InsightCard[] = profileHealth.improvement_suggestions
    .slice(0, 4)
    .map((suggestion, idx) => ({
      id: `insight-${idx}`,
      type: 'insight',
      priority: suggestion.priority === 'critical' || suggestion.priority === 'high' ? 'high' : 'medium',
      data: {
        title: suggestion.action,
        description: `Priority: ${suggestion.priority} • Impact: ${suggestion.impact}`,
        category: 'profile',
        severity: suggestion.priority === 'critical' ? 'error' : 'warning'
      },
      actions: [
        {
          id: `fix-${idx}`,
          label: 'Fix Now',
          icon: 'CheckCircle',
          variant: 'primary',
          action: {
            type: 'navigate',
            value: '/profile/edit'
          }
        }
      ]
    }));

  const scores = [
    {
      score: careerReadiness.overall_score,
      maxScore: 100,
      label: 'Career Readiness Score',
      breakdown: [
        { label: 'Profile', value: profileHealth.completeness_score, color: '#3b82f6' },
        { label: 'Skills', value: 75, color: '#10b981' },
        { label: 'Experience', value: 60, color: '#f59e0b' }
      ]
    }
  ];

  const progressBars = [
    {
      label: 'Profile Completeness',
      value: profileHealth.completeness_score,
      color: profileHealth.completeness_score >= 80 ? 'green' : 'yellow' as const,
      showPercentage: true
    }
  ];

  const suggestions: SuggestedAction[] = [
    {
      id: 'improve',
      label: 'How to improve?',
      query: 'What should I do to improve my profile?',
      icon: 'TrendingUp'
    },
    {
      id: 'compare',
      label: 'Compare with peers',
      query: 'How do I compare to other students?',
      icon: 'Users'
    }
  ];

  return {
    success: true,
    message,
    data,
    interactive: {
      cards: insightCards,
      suggestions,
      visualData: { scores, progressBars },
      metadata: {
        intentHandled: 'profile-improvement',
        dataSource: 'profile_analytics'
      }
    }
  };
}

/**
 * Build learning path response with course cards
 */
export function buildLearningPathResponse(
  message: string,
  courses: Array<{
    title: string;
    platform: string;
    cost: string;
    duration: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    skills: string[];
    url?: string;
    rating?: number;
  }>
): EnhancedAIResponse {
  const courseCards: CourseCard[] = courses.slice(0, 6).map((course, idx) => ({
    id: `course-${idx}`,
    type: 'course',
    priority: course.level === 'Beginner' ? 'high' : 'medium',
    data: course,
    actions: [
      {
        id: `enroll-${idx}`,
        label: 'Enroll Now',
        icon: 'ExternalLink',
        variant: 'primary',
        action: {
          type: 'external',
          value: course.url || '#'
        },
        disabled: !course.url
      },
      {
        id: `save-${idx}`,
        label: 'Save Course',
        icon: 'Bookmark',
        variant: 'outline',
        action: {
          type: 'function',
          value: 'save_course',
          data: { courseId: idx, title: course.title }
        }
      }
    ]
  }));

  const suggestions: SuggestedAction[] = [
    {
      id: 'schedule',
      label: 'Create study schedule',
      query: 'Help me create a study schedule',
      icon: 'Calendar'
    },
    {
      id: 'more-courses',
      label: 'Show more courses',
      query: 'Show me more courses',
      icon: 'BookOpen'
    }
  ];

  return {
    success: true,
    message,
    data: { courses },
    interactive: {
      cards: courseCards,
      suggestions,
      metadata: {
        intentHandled: 'learning-path',
        dataSource: 'course_recommendations'
      }
    }
  };
}

/**
 * Build simple response with suggestions (for general queries)
 */
export function buildSimpleResponse(
  message: string,
  suggestions?: SuggestedAction[]
): EnhancedAIResponse {
  return {
    success: true,
    message,
    interactive: suggestions ? { suggestions } : undefined
  };
}

/**
 * Add quick action buttons to any response
 */
export function addQuickActions(
  response: EnhancedAIResponse,
  actions: ActionButton[]
): EnhancedAIResponse {
  return {
    ...response,
    interactive: {
      ...response.interactive,
      quickActions: actions
    }
  };
}

/**
 * Add suggested follow-up queries to any response
 */
export function addSuggestions(
  response: EnhancedAIResponse,
  suggestions: SuggestedAction[]
): EnhancedAIResponse {
  return {
    ...response,
    interactive: {
      ...response.interactive,
      suggestions
    }
  };
}

