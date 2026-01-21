import OpenAI from 'openai';
import {
  buildEducatorSystemPrompt,
  buildIntentClassificationPrompt,
} from '../prompts/intelligentPrompt';
import { buildEducatorContext } from '../utils/contextBuilder';
import { EducatorAIResponse, EducatorIntent } from '../types';
import { educatorInsights } from './educatorInsights';
import { dataFetcherService } from './dataFetcherService';
import { educatorAnalyticsService } from './educatorAnalyticsService';

// Initialize OpenRouter client (same as student AI)
let openai: OpenAI | null = null;

const getOpenAIClient = (): OpenAI => {
  if (!openai) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey || apiKey === '') {
      console.error('❌ VITE_OPENAI_API_KEY is not set in .env file!');
      throw new Error(
        'OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env file.'
      );
    }

    console.log(
      '✅ Educator AI client initializing with OpenRouter:',
      apiKey.substring(0, 10) + '...'
    );

    openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
      defaultHeaders: {
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
        'X-Title': 'SkillPassport Educator AI',
      },
      dangerouslyAllowBrowser: true,
    });
  }
  return openai;
};

const DEFAULT_MODEL = 'nvidia/nemotron-nano-12b-v2-vl:free'; // Fast and cost-effective model

/**
 * Educator Intelligence Engine
 * Central AI service for processing educator queries and providing insights
 */
class EducatorIntelligenceEngine {
  private conversationHistory: Map<string, any[]> = new Map();

  /**
   * Main entry point with STREAMING - Process query with real-time LLM response
   */
  async processQueryStream(
    query: string,
    educatorId: string,
    onChunk: (chunk: string) => void,
    conversationId?: string
  ): Promise<EducatorAIResponse> {
    try {
      console.log('🎯 Educator AI processing (STREAMING):', query);

      const educatorContext = await buildEducatorContext(educatorId);
      const intent = await this.classifyIntent(query);
      console.log('📊 Detected intent:', intent);

      const history = this.getConversationHistory(conversationId || educatorId);

      // For general queries, use streaming
      if (
        intent === 'general' ||
        intent === 'guidance-request' ||
        intent === 'resource-recommendation'
      ) {
        const response = await this.generateStreamingResponse(
          query,
          intent,
          educatorContext,
          history,
          onChunk
        );

        this.updateConversationHistory(conversationId || educatorId, query, response.message || '');
        return response;
      }

      // For data-heavy queries, use non-streaming
      const response = await this.generateIntelligentResponse(
        query,
        intent,
        educatorContext,
        history
      );

      this.updateConversationHistory(conversationId || educatorId, query, response.message || '');
      return response;
    } catch (error) {
      console.error('❌ Educator AI Error:', error);
      return {
        success: false,
        error: 'I encountered an error processing your request. Please try again.',
        message:
          'I apologize, but I encountered an error. Please make sure your OpenAI API key is configured correctly.',
      };
    }
  }

  /**
   * Main entry point - Process educator query with full intelligence
   */
  async processQuery(
    query: string,
    educatorId: string,
    conversationId?: string
  ): Promise<EducatorAIResponse> {
    try {
      console.log('🎓 Educator AI processing:', query);

      // Step 1: Build educator context
      const educatorContext = await buildEducatorContext(educatorId);

      // Step 2: Classify intent
      const intent = await this.classifyIntent(query);
      console.log('📊 Detected intent:', intent);

      // Step 3: Get conversation history
      const history = this.getConversationHistory(conversationId || educatorId);

      // Step 4: Generate response based on intent
      const response = await this.generateIntelligentResponse(
        query,
        intent,
        educatorContext,
        history
      );

      // Step 5: Store in conversation history
      this.updateConversationHistory(conversationId || educatorId, query, response.message || '');

      return response;
    } catch (error) {
      console.error('❌ Educator AI Error:', error);
      return {
        success: false,
        error: 'I encountered an error processing your request. Please try again.',
        message:
          'I apologize, but I encountered an error. Please make sure your OpenAI API key is configured correctly.',
      };
    }
  }

  /**
   * Classify the intent of the educator's query
   */
  private async classifyIntent(query: string): Promise<EducatorIntent> {
    try {
      const prompt = buildIntentClassificationPrompt(query);
      const client = getOpenAIClient();

      const response = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 20,
      });

      const intent = response.choices[0]?.message?.content?.trim().toLowerCase() as EducatorIntent;

      // Validate intent
      const validIntents: EducatorIntent[] = [
        'student-insights',
        'class-analytics',
        'intervention-needed',
        'guidance-request',
        'skill-trends',
        'career-readiness',
        'resource-recommendation',
        'general',
      ];

      return validIntents.includes(intent) ? intent : 'general';
    } catch (error) {
      console.error('Intent classification error:', error);
      return 'general';
    }
  }

  /**
   * Generate intelligent response with appropriate format
   */
  private async generateIntelligentResponse(
    query: string,
    intent: EducatorIntent,
    educatorContext: any,
    history: any[]
  ): Promise<EducatorAIResponse> {
    try {
      // Data-first handling for core intents using real DB
      if (intent === 'intervention-needed') {
        const atRisk = await educatorInsights.getAtRiskStudents();
        const top = atRisk.slice(0, 8);
        const message =
          top.length === 0
            ? 'No at-risk students detected based on skills, projects, training, assignments, and activity.'
            : [
                'Top at-risk students (ranked):',
                ...top.map(
                  (s: any, i: number) =>
                    `${i + 1}. ${s.name} — Flags: ${s.flags.map((f: any) => f.reason).join('; ')}`
                ),
              ].join('\n');

        return {
          success: true,
          message,
          data: { atRisk: top },
          interactive: {
            cards: top.map((s: any) => ({
              type: 'student-insight',
              data: {
                studentId: s.studentId,
                studentName: s.name,
                insightType: 'concern',
                title: 'At-risk indicators',
                description: s.flags.map((f: any) => `• ${f.reason} (${f.severity})`).join('\n'),
                recommendation:
                  'Schedule a quick 1:1, set a 2-week micro-goal, assign a targeted resource.',
                priority: s.flags.some((f: any) => f.severity === 'high') ? 'high' : 'medium',
                actionItems: [
                  'Assign 1 focused practice task',
                  'Check-in on training progress next week',
                  'Review project plan and unblock',
                ],
              },
            })),
            metadata: {
              intentHandled: this.getIntentLabel(intent),
              nextSteps: this.generateNextSteps(intent),
              encouragement: this.getEncouragement(intent),
            },
            suggestions: this.generateSuggestions(intent),
          },
        };
      }

      if (intent === 'career-readiness') {
        const matches = await educatorInsights.getOpportunityMatches(undefined, 50);
        const top = matches.slice(0, 12);
        const message =
          top.length === 0
            ? 'No strong matches found. Consider focusing on foundational skills first.'
            : [
                'Top student–opportunity matches:',
                ...top
                  .slice(0, 8)
                  .map(
                    (m: any) =>
                      `• ${m.studentName} → ${m.opportunityTitle} (${m.readinessScore}%). Missing: ${m.missingSkills.join(', ') || '—'}`
                  ),
              ].join('\n');

        return {
          success: true,
          message,
          data: { matches: top },
          interactive: {
            cards: top.map((m: any) => ({
              type: 'student-insight',
              data: {
                studentId: m.studentId,
                studentName: m.studentName,
                insightType: 'opportunity',
                title: m.opportunityTitle,
                description: `Matched: ${m.matchedSkills.join(', ') || '—'}`,
                recommendation: m.missingSkills.length
                  ? `Assign training: ${m.missingSkills.join(', ')}`
                  : 'Encourage to apply now',
                priority: m.readinessScore >= 70 ? 'high' : 'medium',
              },
            })),
            metadata: {
              intentHandled: this.getIntentLabel(intent),
              nextSteps: this.generateNextSteps(intent),
              encouragement: this.getEncouragement(intent),
            },
            suggestions: this.generateSuggestions(intent),
          },
        };
      }

      if (intent === 'class-analytics') {
        const analytics = await educatorInsights.getClassAnalytics();
        const message = `Students: ${analytics.totalStudents}\nAvg skills/student: ${analytics.avgSkillsPerStudent}\nTraining completion rate: ${analytics.trainingCompletionRate}%\nTop skills: ${analytics.topSkills
          .map((s: any) => `${s.name} (${s.count})`)
          .slice(0, 5)
          .join(', ')}`;
        return {
          success: true,
          message,
          data: analytics,
          interactive: {
            metadata: {
              intentHandled: this.getIntentLabel(intent),
              nextSteps: this.generateNextSteps(intent),
              encouragement: this.getEncouragement(intent),
            },
            suggestions: this.generateSuggestions(intent),
          },
        };
      }

      if (intent === 'student-insights') {
        const students = await dataFetcherService.getStudentsWithAssignments();
        const insights = educatorAnalyticsService.buildStudentInsights(students);

        // Sort by performance: top performers first (most skills, fewest flags)
        const sorted = [...insights].sort((a, b) => {
          const scoreA =
            a.skillsCount * 10 - a.flags.length * 5 + (a.assignmentStats?.avgGrade || 0);
          const scoreB =
            b.skillsCount * 10 - b.flags.length * 5 + (b.assignmentStats?.avgGrade || 0);
          return scoreB - scoreA;
        });

        const top = sorted.slice(0, 10);

        const message =
          top.length === 0
            ? 'No students available.'
            : [
                `📊 Top ${top.length} Students Overview:\n`,
                ...top.map((s: any, i: number) => {
                  const grade = s.assignmentStats?.avgGrade || 0;
                  const gradeStr = grade > 0 ? ` | Avg Grade: ${grade}%` : '';
                  const status = s.flags.length ? '⚠️' : '✅';
                  return `${i + 1}. ${status} ${s.name} - ${s.skillsCount} skills${gradeStr}${s.flags.length ? ` (${s.flags.length} concern${s.flags.length > 1 ? 's' : ''})` : ''}`;
                }),
              ].join('\n');

        return {
          success: true,
          message,
          data: top,
          interactive: {
            cards: top.map((s: any) => ({
              type: 'student-insight',
              data: {
                studentId: s.studentId,
                studentName: s.name,
                insightType: s.flags.length ? 'concern' : 'strength',
                title: s.flags.length ? 'Needs attention' : 'On track',
                description: s.flags.length
                  ? s.flags.map((f: any) => `• ${f.reason}`).join('\n')
                  : `Top skills: ${s.topSkills.map((x: any) => x.name).join(', ')}`,
                recommendation: s.flags.length
                  ? 'Prioritize 1 actionable goal this week.'
                  : 'Offer a stretch project.',
                priority: s.flags.some((f: any) => f.severity === 'high') ? 'high' : 'low',
              },
            })),
            metadata: {
              intentHandled: this.getIntentLabel(intent),
              nextSteps: this.generateNextSteps(intent),
              encouragement: this.getEncouragement(intent),
            },
            suggestions: this.generateSuggestions(intent),
          },
        };
      }

      // Fallback to LLM for other intents or when data is insufficient
      const systemPrompt = buildEducatorSystemPrompt(educatorContext);
      const messages: any[] = [{ role: 'system', content: systemPrompt }];
      const recentHistory = history.slice(-5);
      recentHistory.forEach((msg) => {
        messages.push({ role: msg.role, content: msg.content });
      });
      messages.push({ role: 'user', content: `[Intent: ${intent}]\n\n${query}` });

      const client = getOpenAIClient();
      const response = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      const aiMessage =
        response.choices[0]?.message?.content ||
        'I apologize, but I could not generate a response.';
      return {
        success: true,
        message: aiMessage,
        interactive: {
          metadata: {
            intentHandled: this.getIntentLabel(intent),
            nextSteps: this.generateNextSteps(intent),
            encouragement: this.getEncouragement(intent),
          },
          suggestions: this.generateSuggestions(intent),
        },
      };
    } catch (error) {
      console.error('Response generation error:', error);
      throw error;
    }
  }

  /**
   * Get human-readable intent label
   */
  private getIntentLabel(intent: EducatorIntent): string {
    const labels: Record<EducatorIntent, string> = {
      'student-insights': 'Student Insights',
      'class-analytics': 'Class Analytics',
      'intervention-needed': 'Intervention Guidance',
      'guidance-request': 'Educator Guidance',
      'skill-trends': 'Skill Trends',
      'career-readiness': 'Career Readiness',
      'resource-recommendation': 'Resource Recommendations',
      general: 'General Assistance',
    };
    return labels[intent] || 'General';
  }

  /**
   * Generate contextual next steps
   */
  private generateNextSteps(intent: EducatorIntent): string[] {
    const steps: Record<EducatorIntent, string[]> = {
      'student-insights': [
        'Review individual student profiles',
        'Schedule 1-on-1 meetings with identified students',
        'Track progress over the next 2 weeks',
      ],
      'class-analytics': [
        'Share insights with department',
        'Adjust curriculum based on trends',
        'Monitor class engagement metrics',
      ],
      'intervention-needed': [
        'Reach out to at-risk students immediately',
        'Document interventions and outcomes',
        'Follow up within 1 week',
      ],
      'guidance-request': [
        'Implement suggested strategies',
        'Gather student feedback',
        'Adjust approach based on results',
      ],
      'skill-trends': [
        'Update course materials with trending skills',
        'Share resources with students',
        'Plan workshops or guest lectures',
      ],
      'career-readiness': [
        'Conduct career readiness assessments',
        'Organize industry connect sessions',
        'Help students build portfolios',
      ],
      'resource-recommendation': [
        'Share resources with students',
        'Create curated learning paths',
        'Track resource engagement',
      ],
      general: [
        'Explore specific student or class needs',
        'Ask follow-up questions for deeper insights',
      ],
    };
    return steps[intent] || [];
  }

  /**
   * Generate encouraging message
   */
  private getEncouragement(intent: EducatorIntent): string {
    const encouragements: Record<EducatorIntent, string> = {
      'student-insights':
        "You're taking proactive steps to understand your students better. This personalized attention makes a real difference.",
      'class-analytics':
        'Your data-driven approach to teaching is excellent. These insights will help you reach more students effectively.',
      'intervention-needed':
        'Identifying students who need support early is crucial. Your attention can change their trajectory.',
      'guidance-request':
        'Seeking better ways to guide students shows your commitment to their success. Keep up the great work!',
      'skill-trends':
        'Staying current with industry trends ensures your students remain competitive. Your students are lucky to have you.',
      'career-readiness':
        'Preparing students for real-world careers is one of the most valuable things you can do. Well done!',
      'resource-recommendation':
        'Curating quality resources saves students time and improves outcomes. Your effort is appreciated!',
      general:
        "I'm here to support you in any way I can. Feel free to ask anything about student guidance!",
    };
    return encouragements[intent] || "Great question! Let's work through this together.";
  }

  /**
   * Generate follow-up suggestions
   */
  private generateSuggestions(intent: EducatorIntent): any[] {
    // @ts-expect-error - Auto-suppressed for migration
    const suggestions: Record<EducatorIntent, any[]> = {
      'student-insights': [
        {
          id: '1',
          label: 'Show me struggling students',
          query: 'Which students are struggling and need intervention?',
        },
        {
          id: '2',
          label: 'Identify top performers',
          query: 'Which students are excelling and ready for advanced opportunities?',
        },
      ],
      'class-analytics': [
        {
          id: '1',
          label: 'Skill gap analysis',
          query: 'What are the common skill gaps in my class?',
        },
        {
          id: '2',
          label: 'Career interest trends',
          query: 'What careers are my students most interested in?',
        },
      ],
      'intervention-needed': [
        {
          id: '1',
          label: 'Create action plan',
          query: 'Help me create an intervention action plan',
        },
        {
          id: '2',
          label: 'Student engagement tips',
          query: 'How can I improve student engagement?',
        },
      ],
      general: [
        { id: '1', label: 'Class overview', query: 'Give me an overview of my class performance' },
        { id: '2', label: 'Student insights', query: 'Which students need my attention?' },
      ],
    };
    return suggestions[intent] || suggestions['general'];
  }

  /**
   * Conversation history management
   */
  private getConversationHistory(conversationId: string): any[] {
    return this.conversationHistory.get(conversationId) || [];
  }

  private updateConversationHistory(
    conversationId: string,
    userQuery: string,
    aiResponse: string
  ): void {
    const history = this.getConversationHistory(conversationId);
    history.push({ role: 'user', content: userQuery }, { role: 'assistant', content: aiResponse });

    // Keep only last 10 exchanges (20 messages)
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    this.conversationHistory.set(conversationId, history);
  }

  /**
   * Clear conversation history
   */
  clearHistory(conversationId: string): void {
    this.conversationHistory.delete(conversationId);
  }

  /**
   * Generate streaming AI response (real-time as LLM generates)
   */
  private async generateStreamingResponse(
    query: string,
    intent: EducatorIntent,
    educatorContext: any,
    history: any[],
    onChunk: (chunk: string) => void
  ): Promise<EducatorAIResponse> {
    try {
      const systemPrompt = buildEducatorSystemPrompt(educatorContext);
      const client = getOpenAIClient();

      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-6), // Include last 3 exchanges
        { role: 'user', content: query },
      ];

      const stream = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: messages as any,
        temperature: 0.7,
        max_tokens: 800,
        stream: true,
      });

      let fullMessage = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullMessage += content;
          onChunk(content);
        }
      }

      return {
        success: true,
        message: fullMessage,
        interactive: {
          metadata: {
            intentHandled: this.getIntentLabel(intent),
            nextSteps: this.generateNextSteps(intent),
            encouragement: this.getEncouragement(intent),
          },
          suggestions: this.generateSuggestions(intent),
        },
      };
    } catch (error) {
      console.error('Streaming error:', error);
      // Fallback to non-streaming
      return await this.generateIntelligentResponse(query, intent, educatorContext, history);
    }
  }
}

// Export singleton instance
export const educatorIntelligenceEngine = new EducatorIntelligenceEngine();
