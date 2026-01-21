import { getOpenAIClient, DEFAULT_MODEL } from './openAIClient';
import { CounsellingTopic, Message, StudentContext, CounsellingResponse } from '../types';
import {
  COUNSELLING_PROMPTS,
  buildStudentContextPrompt,
  getFollowUpSuggestions,
} from '../prompts/counsellingPrompts';

/**
 * University AI Counselling Service
 * Provides streaming AI responses for student counselling
 */

class UniversityCounsellingService {
  /**
   * Process query with streaming response
   */
  async processQueryStream(
    query: string,
    topic: CounsellingTopic,
    studentContext: StudentContext | undefined,
    conversationHistory: Message[],
    onChunk: (chunk: string) => void
  ): Promise<CounsellingResponse> {
    try {
      const client = getOpenAIClient();

      // Build system prompt
      const systemPrompt = COUNSELLING_PROMPTS[topic];
      const contextPrompt = buildStudentContextPrompt(studentContext);

      // Prepare messages
      const messages = [
        {
          role: 'system' as const,
          content: systemPrompt + contextPrompt,
        },
        ...conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: 'user' as const,
          content: query,
        },
      ];

      // Stream the response
      const stream = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: true,
      });

      let fullResponse = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          onChunk(content);
        }
      }

      // Generate follow-up suggestions
      const suggestions = getFollowUpSuggestions(topic);

      return {
        content: fullResponse,
        suggestions,
        metadata: {
          topic,
          intentHandled: `${topic} counselling`,
          confidence: 0.95,
        },
      };
    } catch (error) {
      console.error('University AI Error:', error);
      throw error;
    }
  }

  /**
   * Detect counselling topic from user query
   */
  detectTopic(query: string): CounsellingTopic {
    const lowercaseQuery = query.toLowerCase();

    // Academic keywords
    if (
      lowercaseQuery.match(/course|class|study|exam|grade|assignment|homework|semester|academic/)
    ) {
      return 'academic';
    }

    // Career keywords
    if (
      lowercaseQuery.match(/career|job|internship|interview|resume|cv|professional|industry|work/)
    ) {
      return 'career';
    }

    // Performance keywords
    if (lowercaseQuery.match(/performance|improve|gpa|score|test|result|achievement|progress/)) {
      return 'performance';
    }

    // Wellbeing keywords
    if (
      lowercaseQuery.match(/stress|anxiety|mental|health|balance|wellness|tired|overwhelm|burnout/)
    ) {
      return 'wellbeing';
    }

    return 'general';
  }
}

export const universityCounsellingService = new UniversityCounsellingService();
