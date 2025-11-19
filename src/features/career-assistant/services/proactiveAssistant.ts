/**
 * Proactive Assistant Service
 * Generates intelligent follow-up questions and suggestions based on conversation context
 */

import { Intent } from './intentDetectionService';
import { IntelligenceContext } from './careerIntelligenceEngine';

export interface FollowUpSuggestion {
  text: string;
  action: 'query' | 'navigate' | 'external';
  icon?: string;
  priority: 'high' | 'medium' | 'low';
  query?: string; // If action is 'query', this is the pre-filled message
  route?: string; // If action is 'navigate'
  url?: string; // If action is 'external'
}

export interface ProactiveResponse {
  followUps: FollowUpSuggestion[];
  nextSteps: string[];
  encouragement?: string;
}

class ProactiveAssistantService {
  /**
   * Generate intelligent follow-up suggestions based on intent and context
   */
  async generateFollowUps(
    intent: Intent,
    context: IntelligenceContext,
    responseData?: any
  ): Promise<ProactiveResponse> {
    switch (intent) {
      case 'find-jobs':
        return this.generateJobSearchFollowUps(context, responseData);
      
      case 'skill-gap-analysis':
        return this.generateSkillGapFollowUps(context, responseData);
      
      case 'learning-path':
        return this.generateLearningPathFollowUps(context, responseData);
      
      case 'profile-improvement':
        return this.generateProfileFollowUps(context, responseData);
      
      case 'career-guidance':
        return this.generateCareerGuidanceFollowUps(context, responseData);
      
      case 'interview-prep':
        return this.generateInterviewPrepFollowUps(context, responseData);
      
      case 'resume-review':
        return this.generateResumeFollowUps(context, responseData);
      
      case 'certification-advice':
        return this.generateCertificationFollowUps(context, responseData);
      
      case 'salary-inquiry':
        return this.generateSalaryFollowUps(context, responseData);
      
      default:
        return this.generateGeneralFollowUps(context);
    }
  }

  /**
   * Follow-ups after job search
   */
  private generateJobSearchFollowUps(
    context: IntelligenceContext,
    responseData?: any
  ): ProactiveResponse {
    const followUps: FollowUpSuggestion[] = [];
    const nextSteps: string[] = [];

    // Check if there are skill gaps
    const hasSkillGaps = this.detectSkillGaps(context);
    if (hasSkillGaps) {
      followUps.push({
        text: "📚 Show me courses to fill my skill gaps",
        action: 'query',
        icon: '📚',
        priority: 'high',
        query: 'What courses should I take to improve my skills for these jobs?'
      });
      nextSteps.push("Learn the missing skills to improve your job match scores");
    }

    // Resume tailoring
    followUps.push({
      text: "📝 Help me tailor my resume for these jobs",
      action: 'query',
      icon: '📝',
      priority: 'high',
      query: 'How should I update my resume for these job opportunities?'
    });

    // Detailed comparison
    if (responseData?.matches && responseData.matches.length > 1) {
      followUps.push({
        text: "🎯 Compare these jobs side-by-side",
        action: 'query',
        icon: '🎯',
        priority: 'medium',
        query: 'Compare the top job opportunities and help me choose'
      });
    }

    // Application strategy
    followUps.push({
      text: "🚀 Create an application strategy",
      action: 'query',
      icon: '🚀',
      priority: 'high',
      query: 'What\'s the best strategy to apply for these jobs?'
    });

    // Interview prep
    followUps.push({
      text: "💼 Prepare for interviews",
      action: 'query',
      icon: '💼',
      priority: 'medium',
      query: 'Help me prepare for interviews for these roles'
    });

    nextSteps.push(
      "Review job requirements and note what skills they need",
      "Update your profile to highlight relevant experience",
      "Start applying to jobs with 70%+ match score"
    );

    const encouragement = this.getEncouragement(responseData?.matches?.length || 0);

    return { followUps, nextSteps, encouragement };
  }

  /**
   * Follow-ups after skill gap analysis
   */
  private generateSkillGapFollowUps(
    context: IntelligenceContext,
    responseData?: any
  ): ProactiveResponse {
    const followUps: FollowUpSuggestion[] = [
      {
        text: "🎓 Create a personalized learning roadmap",
        action: 'query',
        icon: '🎓',
        priority: 'high',
        query: 'Create a learning roadmap for these skills'
      },
      {
        text: "⏱️ How much time will this take?",
        action: 'query',
        icon: '⏱️',
        priority: 'high',
        query: 'How long will it take to learn these skills?'
      },
      {
        text: "💰 Show me free learning resources",
        action: 'query',
        icon: '💰',
        priority: 'medium',
        query: 'Suggest free courses and resources for these skills'
      },
      {
        text: "🎯 Which skill should I prioritize first?",
        action: 'query',
        icon: '🎯',
        priority: 'high',
        query: 'Which skill should I learn first and why?'
      },
      {
        text: "📊 Show me jobs after learning these skills",
        action: 'query',
        icon: '📊',
        priority: 'medium',
        query: 'What jobs will I qualify for after learning these skills?'
      }
    ];

    const nextSteps = [
      "Pick your top 3 priority skills to focus on",
      "Dedicate 10-15 hours per week to learning",
      "Build small projects while learning each skill",
      "Track your progress and update your profile"
    ];

    const encouragement = "🚀 Learning these skills will significantly improve your job prospects!";

    return { followUps, nextSteps, encouragement };
  }

  /**
   * Follow-ups after learning path
   */
  private generateLearningPathFollowUps(
    context: IntelligenceContext,
    responseData?: any
  ): ProactiveResponse {
    const followUps: FollowUpSuggestion[] = [
      {
        text: "⏰ Set weekly learning goals",
        action: 'query',
        icon: '⏰',
        priority: 'high',
        query: 'Help me set realistic weekly learning goals'
      },
      {
        text: "🎯 What projects should I build?",
        action: 'query',
        icon: '🎯',
        priority: 'high',
        query: 'Suggest projects to build while learning these skills'
      },
      {
        text: "🏆 Recommend certifications",
        action: 'query',
        icon: '🏆',
        priority: 'medium',
        query: 'What certifications should I get for these skills?'
      },
      {
        text: "📈 Track my learning progress",
        action: 'navigate',
        icon: '📈',
        priority: 'low',
        route: '/student/analytics'
      }
    ];

    const nextSteps = [
      "Start with the first course in your learning path",
      "Build a project to practice what you learn",
      "Join online communities for support and networking",
      "Update your profile as you complete each milestone"
    ];

    const encouragement = "💪 Stay consistent! Even 30 minutes daily makes a huge difference.";

    return { followUps, nextSteps, encouragement };
  }

  /**
   * Follow-ups after profile improvement
   */
  private generateProfileFollowUps(
    context: IntelligenceContext,
    responseData?: any
  ): ProactiveResponse {
    const profileScore = context.careerReadiness?.overall_score || 0;
    const needsWork = profileScore < 70;

    const followUps: FollowUpSuggestion[] = [];

    if (needsWork) {
      followUps.push({
        text: "✏️ Help me write better project descriptions",
        action: 'query',
        icon: '✏️',
        priority: 'high',
        query: 'Help me write compelling project descriptions'
      });
      
      followUps.push({
        text: "🎯 What skills should I add to my profile?",
        action: 'query',
        icon: '🎯',
        priority: 'high',
        query: 'What in-demand skills should I add to my profile?'
      });
    }

    followUps.push(
      {
        text: "📊 Analyze my profile strength",
        action: 'query',
        icon: '📊',
        priority: 'medium',
        query: 'Give me a detailed analysis of my profile strength'
      },
      {
        text: "🔍 Find jobs matching my current profile",
        action: 'query',
        icon: '🔍',
        priority: 'high',
        query: 'Show me jobs that match my current profile'
      },
      {
        text: "📝 Review my resume",
        action: 'query',
        icon: '📝',
        priority: 'medium',
        query: 'Review my resume and suggest improvements'
      }
    );

    const nextSteps = needsWork
      ? [
          "Complete high-priority improvements first (2-3 hours)",
          "Add quantifiable metrics to your achievements",
          "Update your skills with in-demand technologies",
          "Add GitHub links to your projects"
        ]
      : [
          "Keep your profile updated with new skills and projects",
          "Start applying to jobs that match your profile",
          "Network with professionals in your target roles",
          "Consider getting relevant certifications"
        ];

    const encouragement = needsWork
      ? "🎯 Focus on quick wins first - small improvements have big impact!"
      : "✨ Your profile looks strong! Time to start applying to jobs.";

    return { followUps, nextSteps, encouragement };
  }

  /**
   * Follow-ups after career guidance
   */
  private generateCareerGuidanceFollowUps(
    context: IntelligenceContext,
    responseData?: any
  ): ProactiveResponse {
    const followUps: FollowUpSuggestion[] = [
      {
        text: "🔮 Show me my career trajectory",
        action: 'query',
        icon: '🔮',
        priority: 'high',
        query: 'What will my career look like in 1, 3, and 5 years?'
      },
      {
        text: "🎯 Create an action plan to reach my goal",
        action: 'query',
        icon: '🎯',
        priority: 'high',
        query: 'Create a step-by-step action plan for my career goals'
      },
      {
        text: "💰 What salary should I expect?",
        action: 'query',
        icon: '💰',
        priority: 'medium',
        query: 'What salary can I expect in my target role?'
      },
      {
        text: "📚 What should I learn to advance faster?",
        action: 'query',
        icon: '📚',
        priority: 'high',
        query: 'What skills will accelerate my career growth?'
      }
    ];

    const nextSteps = [
      "Define your 1-year and 3-year career goals",
      "Identify the skills gap between current and target role",
      "Build a portfolio that showcases your target role skills",
      "Network with people already in your target role"
    ];

    const encouragement = "🚀 Your career journey starts with a clear vision and consistent action!";

    return { followUps, nextSteps, encouragement };
  }

  /**
   * Follow-ups after interview prep
   */
  private generateInterviewPrepFollowUps(
    context: IntelligenceContext,
    responseData?: any
  ): ProactiveResponse {
    const followUps: FollowUpSuggestion[] = [
      {
        text: "🎭 Generate more practice questions",
        action: 'query',
        icon: '🎭',
        priority: 'high',
        query: 'Give me more interview questions to practice'
      },
      {
        text: "💼 How should I answer behavioral questions?",
        action: 'query',
        icon: '💼',
        priority: 'high',
        query: 'Help me structure STAR method answers for behavioral questions'
      },
      {
        text: "🏢 Research this company",
        action: 'query',
        icon: '🏢',
        priority: 'medium',
        query: 'Tell me about the company culture and what they value'
      },
      {
        text: "💡 What questions should I ask the interviewer?",
        action: 'query',
        icon: '💡',
        priority: 'high',
        query: 'What smart questions should I ask at the end of my interview?'
      }
    ];

    const nextSteps = [
      "Practice answering questions out loud",
      "Prepare 2-3 projects to discuss in detail",
      "Research the company and role thoroughly",
      "Prepare thoughtful questions to ask the interviewer",
      "Do a mock interview with a friend or mentor"
    ];

    const encouragement = "💪 Practice makes perfect! The more you prepare, the more confident you'll be.";

    return { followUps, nextSteps, encouragement };
  }

  /**
   * Follow-ups after resume review
   */
  private generateResumeFollowUps(
    context: IntelligenceContext,
    responseData?: any
  ): ProactiveResponse {
    const followUps: FollowUpSuggestion[] = [
      {
        text: "✏️ Help me rewrite a specific section",
        action: 'query',
        icon: '✏️',
        priority: 'high',
        query: 'Help me improve my [projects/experience/skills] section'
      },
      {
        text: "🎯 Tailor resume for a specific job",
        action: 'query',
        icon: '🎯',
        priority: 'high',
        query: 'Help me customize my resume for a specific job posting'
      },
      {
        text: "🔍 Check ATS compatibility",
        action: 'query',
        icon: '🔍',
        priority: 'medium',
        query: 'Is my resume ATS-friendly? What keywords should I add?'
      },
      {
        text: "📝 Review my cover letter",
        action: 'query',
        icon: '📝',
        priority: 'medium',
        query: 'Help me write a compelling cover letter'
      }
    ];

    const nextSteps = [
      "Update resume with quantifiable achievements",
      "Add relevant keywords from target job descriptions",
      "Keep resume to 1 page (fresher) or 2 pages max",
      "Save as PDF to preserve formatting",
      "Get feedback from peers or mentors"
    ];

    const encouragement = "📄 A great resume is your ticket to interviews - make every word count!";

    return { followUps, nextSteps, encouragement };
  }

  /**
   * Follow-ups after certification advice
   */
  private generateCertificationFollowUps(
    context: IntelligenceContext,
    responseData?: any
  ): ProactiveResponse {
    const followUps: FollowUpSuggestion[] = [
      {
        text: "🎓 Create a certification preparation plan",
        action: 'query',
        icon: '🎓',
        priority: 'high',
        query: 'Create a study plan for this certification'
      },
      {
        text: "💰 Are there free alternatives?",
        action: 'query',
        icon: '💰',
        priority: 'medium',
        query: 'Show me free certifications with good ROI'
      },
      {
        text: "📊 How much will this boost my salary?",
        action: 'query',
        icon: '📊',
        priority: 'medium',
        query: 'What salary increase can I expect from these certifications?'
      },
      {
        text: "🎯 Which certification should I prioritize?",
        action: 'query',
        icon: '🎯',
        priority: 'high',
        query: 'Which certification gives the best ROI for my career goals?'
      }
    ];

    const nextSteps = [
      "Choose one certification to start with",
      "Allocate 10-15 hours per week for preparation",
      "Join study groups or online communities",
      "Take practice exams to gauge readiness",
      "Schedule your exam with a target date"
    ];

    const encouragement = "🏆 Certifications validate your skills and open doors to better opportunities!";

    return { followUps, nextSteps, encouragement };
  }

  /**
   * Follow-ups after salary inquiry
   */
  private generateSalaryFollowUps(
    context: IntelligenceContext,
    responseData?: any
  ): ProactiveResponse {
    const followUps: FollowUpSuggestion[] = [
      {
        text: "💼 How can I negotiate a higher salary?",
        action: 'query',
        icon: '💼',
        priority: 'high',
        query: 'Give me salary negotiation tips and strategies'
      },
      {
        text: "📈 What skills increase my earning potential?",
        action: 'query',
        icon: '📈',
        priority: 'high',
        query: 'What skills should I learn to earn more?'
      },
      {
        text: "🎯 Show me high-paying jobs in my field",
        action: 'query',
        icon: '🎯',
        priority: 'medium',
        query: 'Show me high-paying job opportunities'
      },
      {
        text: "🔮 Career path for salary growth",
        action: 'query',
        icon: '🔮',
        priority: 'medium',
        query: 'What career path leads to the highest salary growth?'
      }
    ];

    const nextSteps = [
      "Build skills that are in high demand",
      "Get certified in valuable technologies",
      "Build a strong portfolio to justify higher pay",
      "Practice negotiation before offers",
      "Consider switching companies for bigger jumps"
    ];

    const encouragement = "💰 Your skills are valuable - learn to negotiate what you're worth!";

    return { followUps, nextSteps, encouragement };
  }

  /**
   * General follow-ups
   */
  private generateGeneralFollowUps(context: IntelligenceContext): ProactiveResponse {
    const followUps: FollowUpSuggestion[] = [
      {
        text: "🔍 Find jobs matching my profile",
        action: 'query',
        icon: '🔍',
        priority: 'high',
        query: 'Show me job opportunities that match my skills'
      },
      {
        text: "📊 Analyze my career readiness",
        action: 'query',
        icon: '📊',
        priority: 'high',
        query: 'Analyze my profile and career readiness'
      },
      {
        text: "🎓 Create a learning roadmap",
        action: 'query',
        icon: '🎓',
        priority: 'medium',
        query: 'Create a personalized learning path for my career goals'
      },
      {
        text: "💼 Prepare for interviews",
        action: 'query',
        icon: '💼',
        priority: 'medium',
        query: 'Help me prepare for technical interviews'
      }
    ];

    const nextSteps = [
      "Add 3-5 technical skills you know to your profile (takes 5 min)",
      "Write descriptions for your top 2 projects with tech stack",
      "Identify 2-3 roles you're targeting (e.g., Frontend Dev, Full Stack)",
      "Pick 1 in-demand skill to learn this month (React, Python, etc.)"
    ];

    return { followUps, nextSteps };
  }

  /**
   * Helper: Detect if there are skill gaps
   */
  private detectSkillGaps(context: IntelligenceContext): boolean {
    const studentSkills = context.studentProfile.profile?.technicalSkills?.length || 0;
    const inDemandSkills = context.marketIntelligence.inDemandSkills.length;
    return studentSkills < 5 || inDemandSkills > studentSkills + 3;
  }

  /**
   * Helper: Get encouragement based on job matches
   */
  private getEncouragement(matchCount: number): string {
    if (matchCount === 0) {
      return "💪 Don't worry! Let's work on improving your profile to unlock more opportunities.";
    } else if (matchCount >= 1 && matchCount <= 3) {
      return "🎯 Great start! Focus on these opportunities and keep improving your skills.";
    } else if (matchCount >= 4 && matchCount <= 7) {
      return "🚀 Excellent! You have multiple strong matches. Time to start applying!";
    } else {
      return "🌟 Amazing! You're highly marketable. Apply strategically to your top choices.";
    }
  }
}

export const proactiveAssistant = new ProactiveAssistantService();
export default proactiveAssistant;

