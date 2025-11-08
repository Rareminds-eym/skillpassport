import { getOpenAIClient, DEFAULT_MODEL } from './openAIClient';
import { fetchStudentProfile } from './profileService';
import { handleFindJobs } from '../handlers/findJobsHandler';
import { handleLearningPath } from '../handlers/learningPathHandler';
import { ConversationMessage, AIResponse, Intent } from '../types';

/**
 * Career AI Service (Refactored)
 * Main orchestrator for all AI-powered career guidance features
 * 
 * This is the new modular version with separated concerns:
 * - Types: ../types/index.ts
 * - Handlers: ../handlers/*.ts
 * - Prompts: ../prompts/*.ts
 * - Utils: ../utils/*.ts
 */
class CareerAIService {
  /**
   * Main chat handler - routes to specific features based on context
   */
  async chat(
    message: string, 
    studentId: string, 
    context: { selectedChips?: string[]; conversationHistory?: ConversationMessage[] } = {}
  ): Promise<AIResponse> {
    try {
      // Determine intent from message and chips
      const intent = this.detectIntent(message, context.selectedChips || []);
      console.log(`🧠 Detected intent: "${intent}" for message: "${message}"`);

      // Route to appropriate handler
      switch (intent) {
        case 'find-jobs':
          return await handleFindJobs(message, studentId);
        
        case 'learning-path':
          return await handleLearningPath(message, studentId);
        
        case 'skill-gap':
          return await this.handleSkillGap(message, studentId, context);
        
        case 'interview-prep':
          return await this.handleInterviewPrep(message, studentId, context);
        
        case 'resume-review':
          return await this.handleResumeReview(message, studentId, context);
        
        case 'career-guidance':
          return await this.handleCareerGuidance(message, studentId, context);
        
        case 'networking':
          return await this.handleNetworking(message, studentId, context);
        
        case 'general':
        default:
          return await this.handleGeneralQuery(message, studentId, context);
      }
    } catch (error: any) {
      console.error('Career AI Error:', error);
      return {
        success: false,
        error: error.message || 'An error occurred while processing your request'
      };
    }
  }

  /**
   * Detect user intent from message and context
   */
  private detectIntent(message: string, chips: string[]): Intent {
    const lowerMessage = message.toLowerCase().trim();
    
    // Check chips first (higher priority)
    const chipIntent = chips.map(chip => {
      const lowerChip = chip.toLowerCase();
      if (lowerChip.includes('job')) return 'find-jobs';
      if (lowerChip.includes('skill gap')) return 'skill-gap';
      if (lowerChip.includes('interview')) return 'interview-prep';
      if (lowerChip.includes('resume')) return 'resume-review';
      if (lowerChip.includes('learning')) return 'learning-path';
      if (lowerChip.includes('career')) return 'career-guidance';
      if (lowerChip.includes('network')) return 'networking';
      return null;
    }).filter(Boolean)[0];

    if (chipIntent) return chipIntent as Intent;

    // Short casual messages - don't trigger job search
    const casualGreetings = ['hi', 'hello', 'hey', 'hii', 'helo', 'yo', 'sup', 'hola'];
    const casualWords = ['thanks', 'thank you', 'ok', 'okay', 'cool', 'nice', 'great', 'awesome'];
    
    if (casualGreetings.includes(lowerMessage) || casualWords.includes(lowerMessage)) {
      return 'general';
    }

    // Check if message is too short or vague (< 4 words)
    const wordCount = lowerMessage.split(/\s+/).length;
    if (wordCount < 4 && !lowerMessage.includes('job') && !lowerMessage.includes('help')) {
      return 'general';
    }

    // Specific job search triggers (must be explicit)
    const jobKeywords = [
      'find job', 'search job', 'job opportunit', 'job opening', 
      'what job', 'which job', 'job match', 'job for me', 
      'career opportunit', 'position available', 'recommend job',
      'suggest job', 'show job', 'any job', 'available job',
      'looking for job', 'need job', 'want job', 'job recommendation'
    ];
    
    const hasJobWord = lowerMessage.includes('job') || lowerMessage.includes('jobs') || lowerMessage.includes('position');
    const hasActionWord = ['recommend', 'suggest', 'find', 'search', 'show', 'need', 'want', 'looking'].some(action => lowerMessage.includes(action));
    const isAskingHowTo = lowerMessage.includes('how to') || lowerMessage.includes('how can') || lowerMessage.includes('how do');
    
    if (jobKeywords.some(keyword => lowerMessage.includes(keyword)) || 
        (hasJobWord && hasActionWord && !isAskingHowTo)) {
      return 'find-jobs';
    }

    // Other specific intents
    if (lowerMessage.includes('skill gap') || lowerMessage.includes('missing skill') || lowerMessage.includes('improve skill')) {
      return 'skill-gap';
    }
    if (lowerMessage.includes('interview') && (lowerMessage.includes('prepare') || lowerMessage.includes('help') || lowerMessage.includes('practice'))) {
      return 'interview-prep';
    }
    if ((lowerMessage.includes('resume') || lowerMessage.includes('cv')) && (lowerMessage.includes('review') || lowerMessage.includes('improve') || lowerMessage.includes('help'))) {
      return 'resume-review';
    }
    if ((lowerMessage.includes('learn') || lowerMessage.includes('course') || lowerMessage.includes('roadmap')) && wordCount > 3) {
      return 'learning-path';
    }
    if (lowerMessage.includes('career path') || lowerMessage.includes('career choice') || lowerMessage.includes('career guidance')) {
      return 'career-guidance';
    }
    if ((lowerMessage.includes('network') || lowerMessage.includes('connect')) && wordCount > 3) {
      return 'networking';
    }

    // Default to general conversation
    return 'general';
  }

  /**
   * Placeholder handlers for features not yet implemented
   * TODO: Create dedicated handlers for these features
   */
  private async handleSkillGap(message: string, studentId: string, context: any): Promise<AIResponse> {
    return {
      success: true,
      message: "I'm analyzing your skill gaps... (Feature in development)"
    };
  }

  private async handleInterviewPrep(message: string, studentId: string, context: any): Promise<AIResponse> {
    return {
      success: true,
      message: "Let me help you prepare for interviews... (Feature in development)"
    };
  }

  private async handleResumeReview(message: string, studentId: string, context: any): Promise<AIResponse> {
    return {
      success: true,
      message: "I can review your resume... (Feature in development)"
    };
  }

  private async handleCareerGuidance(message: string, studentId: string, context: any): Promise<AIResponse> {
    return {
      success: true,
      message: "Let me guide you on career paths... (Feature in development)"
    };
  }

  private async handleNetworking(message: string, studentId: string, context: any): Promise<AIResponse> {
    return {
      success: true,
      message: "Here are some networking tips... (Feature in development)"
    };
  }

  /**
   * Handle general conversational queries
   */
  private async handleGeneralQuery(message: string, studentId: string, context: any): Promise<AIResponse> {
    try {
      // Fetch student profile for personalized response
      const studentProfile = await fetchStudentProfile(studentId);
      const studentName = studentProfile?.name?.split(' ')[0] || 'there';
      
      const lowerMessage = message.toLowerCase().trim();
      
      // Quick responses for common greetings
      const greetings = ['hi', 'hello', 'hey', 'hii', 'helo', 'yo', 'sup', 'hola'];
      if (greetings.includes(lowerMessage)) {
        const responses = [
          `Hey ${studentName}! 👋 How can I help you with your career today?`,
          `Hi ${studentName}! 😊 I'm here to help with job search, resume tips, interview prep, and more!`,
          `Hello ${studentName}! 🌟 What would you like to explore today?`,
          `Hey there, ${studentName}! Ready to boost your career? Let's chat!`
        ];
        return {
          success: true,
          message: responses[Math.floor(Math.random() * responses.length)]
        };
      }
      
      // Thank you responses
      if (lowerMessage.includes('thank') || lowerMessage === 'ok' || lowerMessage === 'okay') {
        return {
          success: true,
          message: `You're welcome, ${studentName}! 😊 Feel free to ask if you need anything else. I'm here to help!`
        };
      }
      
      // Use AI for other conversational messages
      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a friendly, helpful career advisor chatting with ${studentName}, a student. Be warm, concise (2-3 sentences), and helpful. If they're just chatting casually, respond naturally. If they seem to want career help, gently guide them to specific topics like job search, resume review, interview prep, or skill development. Use emojis occasionally.`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.9,
        max_tokens: 200
      });
      
      return {
        success: true,
        message: completion.choices[0]?.message?.content || 
                `I'm here to help with your career, ${studentName}! Try asking about finding jobs, skill development, interview prep, or resume tips. 😊`
      };
    } catch (error) {
      console.error('General query error:', error);
      return {
        success: true,
        message: "I'm your career AI assistant! I can help you find jobs, improve skills, prepare for interviews, and more. What would you like to explore? 🚀"
      };
    }
  }
}

// Export as singleton
export const careerAIService = new CareerAIService();
export default careerAIService;
