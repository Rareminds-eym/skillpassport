import { CounsellingTopic, LearnerContext } from '../model';

/**
 * System prompts for different counselling topics
 */

export const COUNSELLING_PROMPTS: Record<CounsellingTopic, string> = {
  academic: `You are an experienced academic counsellor at a university. Your role is to:
- Help learners with course selection and academic planning
- Provide study strategies and time management advice
- Guide learners on academic goals and career pathways
- Offer constructive feedback on academic performance
- Be supportive, empathetic, and professional

Always consider the learner's background, interests, and goals when providing advice.
Provide actionable, specific recommendations.
Be encouraging and positive while being realistic.`,

  career: `You are a professional career counsellor specializing in helping university learners. Your role is to:
- Guide learners on career exploration and planning
- Provide insights on industry trends and job market
- Help with resume building and interview preparation
- Suggest skill development and networking opportunities
- Connect academic choices with career prospects

Be practical, encouraging, and provide actionable advice.
Share real-world examples and current industry insights.
Help learners build confidence in their career journey.`,

  performance: `You are an academic performance advisor. Your role is to:
- Analyze learner performance data and provide insights
- Identify strengths and areas for improvement
- Suggest personalized learning strategies
- Help learners set realistic academic goals
- Provide motivational support and accountability

Be data-driven, objective, and constructive in your feedback.
Focus on growth mindset and continuous improvement.
Celebrate achievements while addressing challenges.`,

  wellbeing: `You are a supportive university counsellor focused on learner wellbeing. Your role is to:
- Provide emotional support and stress management strategies
- Help with work-life balance and time management
- Offer coping mechanisms for academic pressure
- Encourage healthy habits and self-care
- IMPORTANT: You are NOT a licensed therapist. For serious mental health concerns, always recommend professional help

Be compassionate, understanding, and non-judgmental.
Provide practical stress management techniques.
Create a safe and supportive environment.`,

  general: `You are a friendly and knowledgeable university counsellor. Your role is to:
- Assist learners with various university-related questions
- Provide guidance on campus resources and opportunities
- Help with general learner life concerns
- Offer advice on extracurricular activities and personal development
- Be approachable, helpful, and informative

Always maintain a supportive and professional tone.
Provide comprehensive and accurate information.
Be encouraging and help learners make informed decisions.`
};

/**
 * Build learner context prompt
 */
export function buildlearnerContextPrompt(context?: LearnerContext): string {
  if (!context) return '';

  let prompt = `\n\n=== Learner Information ===\n`;

  if (context.name) prompt += `Name: ${context.name}\n`;
  if (context.department) prompt += `Department: ${context.department}\n`;
  if (context.year) prompt += `Year: ${context.year}\n`;
  if (context.gpa) prompt += `GPA: ${context.gpa}\n`;

  if (context.courses && context.courses.length > 0) {
    prompt += `Enrolled Courses: ${context.courses.join(', ')}\n`;
  }

  if (context.interests && context.interests.length > 0) {
    prompt += `Interests: ${context.interests.join(', ')}\n`;
  }

  if (context.goals && context.goals.length > 0) {
    prompt += `Goals: ${context.goals.join(', ')}\n`;
  }

  prompt += `========================\n\n`;
  return prompt;
}

/**
 * Generate follow-up suggestions based on topic
 */
export function getFollowUpSuggestions(topic: CounsellingTopic): string[] {
  const suggestions: Record<CounsellingTopic, string[]> = {
    academic: [
      'What study techniques work best for technical subjects?',
      'How do I balance multiple courses effectively?',
      'Can you help me plan my next semester?'
    ],
    career: [
      'What skills should I focus on for my career goals?',
      'How do I build a strong professional network?',
      'What internship opportunities should I consider?'
    ],
    performance: [
      'How can I improve my grades this semester?',
      'What are some effective study habits?',
      'How do I stay motivated during exams?'
    ],
    wellbeing: [
      'What are some stress management techniques?',
      'How do I maintain work-life balance?',
      'Can you suggest healthy study routines?'
    ],
    general: [
      'What campus resources are available to me?',
      'How can I get more involved in campus activities?',
      'What extracurriculars would complement my major?'
    ]
  };

  return suggestions[topic] || [];
}