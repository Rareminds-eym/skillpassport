import { getOpenAIClient, DEFAULT_MODEL } from '../services/openAIClient';
import { fetchStudentProfile, fetchOpportunities } from '../services/profileService';
import { extractInDemandSkills } from '../utils/contextBuilder';
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
import { AIResponse, StudentProfile } from '../types';

/**
 * Learning Path Handler
 * Creates personalized learning roadmaps for students
 */

export async function handleLearningPath(
  message: string,
  studentId: string
): Promise<AIResponse> {
  try {
    console.log('🎓 Learning Path - Starting analysis for student:', studentId);
    console.log('📝 User message:', message);

    // 1. Fetch student profile
    const studentProfile = await fetchStudentProfile(studentId);
    if (!studentProfile) {
      return {
        success: false,
        error: 'Unable to fetch your profile. Please try again.'
      };
    }

    console.log('✅ Student profile loaded:', {
      name: studentProfile.name,
      department: studentProfile.department,
      currentSkills: studentProfile.profile?.technicalSkills?.length || 0,
      completedTraining: studentProfile.profile?.training?.filter((t: any) => t.status === 'completed').length || 0
    });

    // 2. Analyze skill gaps and career goals from message and profile
    const learningPath = await generateLearningPath(studentProfile, message);

    return {
      success: true,
      message: learningPath
    };
  } catch (error: any) {
    console.error('❌ Learning Path Error:', error);
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
    console.log('🎯 Query type detected:', queryType);
    
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

    console.log('🤖 Calling AI with intelligent context-aware prompt...');
    
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
    console.error('Error generating learning path:', error);
    return createFallbackLearningPath(studentProfile, userMessage);
  }
}
