import { getOpenAIClient, DEFAULT_MODEL } from '@/features/career-assistant';
import { fetchStudentProfile, fetchOpportunities } from '@/features/career-assistant';
import { extractInDemandSkills } from '@/features/career-assistant';
import {
  createLearningPathPrompt,
  LEARNING_PATH_SYSTEM_PROMPT,
  createFallbackLearningPath
} from '../prompts/learningPathPrompt';
import {
  createIntelligentLearningPrompt,
  detectQueryType,
  SYSTEM_PROMPTS,
  QueryContext
} from '../prompts/intelligentPrompt';
import { AIResponse, StudentProfile } from '@/features/student-profile/model';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('learning-path-handler');

/**
 * Learning Path Handler
 * Creates personalized learning roadmaps for students
 */

export async function handleLearningPath(
  message: string,
  studentId: string
): Promise<AIResponse> {
  try {
    // 1. Fetch student profile
    const studentProfile = await fetchStudentProfile(studentId);
    if (!studentProfile) {
      return {
        success: false,
        error: 'Unable to fetch your profile. Please try again.'
      };
    }

    // 2. Analyze skill gaps and career goals from message and profile
    const learningPath = await generateLearningPath(studentProfile, message);

    return {
      success: true,
      message: learningPath
    };
  } catch (error: any) {
    logger.error('Failed to generate learning path for student', error instanceof Error ? error : new Error(String(error)), {
      studentId,
      messageLength: message?.length
    });
    return {
      success: false,
      error: 'I encountered an issue while creating your learning path. Please try again.'
    };
  }
}

/**
 * Generate personalized learning path with AI
 */
async function generateLearningPath(
  studentProfile: StudentProfile,
  userMessage: string
): Promise<string> {
  try {
    const studentName = studentProfile.name?.split(' ')[0] || 'there';

    // Fetch job opportunities to understand market demand
    const opportunities = await fetchOpportunities();
    const inDemandSkills = extractInDemandSkills(opportunities);

    // Detect query intent (quick answer vs comprehensive plan)
    const queryType = detectQueryType(userMessage);

    // Build context for intelligent prompt
    const context: QueryContext = {
      studentProfile,
      marketData: {
        inDemandSkills,
        totalJobs: opportunities.length,
        relevantJobs: opportunities.slice(0, 20) // Include sample jobs for context
      },
      userIntent: queryType
    };

    // Create intelligent, context-aware prompt
    const prompt = createIntelligentLearningPrompt(context, userMessage);

    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPTS.learning
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: queryType === 'quick-answer' ? 800 : queryType === 'detailed-guidance' ? 1500 : 2500
    });

    let response = completion.choices[0]?.message?.content || '';

    // Add personalized header only for comprehensive plans
    if (queryType === 'comprehensive-plan') {
      const header = `Hey ${studentName}! 🎓\n\nI've created a personalized learning roadmap for you based on your ${studentProfile.department} background and current market demands. Let's level up your skills! 🚀\n\n`;
      response = header + response;
    } else if (queryType === 'quick-answer') {
      // Simple greeting for quick answers
      response = `Hey ${studentName}! 👋\n\n` + response;
    }

    return response;
  } catch (error) {
    logger.error('Failed to generate learning path', error instanceof Error ? error : new Error(String(error)), {
      studentId: studentProfile.id,
      messageLengthAndQueryAnalysis: userMessage?.length
    });
    return createFallbackLearningPath(studentProfile, userMessage);
  }
}
