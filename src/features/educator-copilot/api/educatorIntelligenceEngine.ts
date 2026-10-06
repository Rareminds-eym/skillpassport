import { buildEducatorContext } from '@/features/educator-copilot';
import { EducatorAIResponse, EducatorIntent } from '@/features/learner-profile/model';
import { educatorInsights } from './educatorInsights';
import { dataFetcherService } from './dataFetcherService';
import { educatorAnalyticsService } from './educatorAnalyticsService';
import { getLogger } from '@/shared/config/logging';
import { ssoClient } from '@/shared/api/ssoClient';

const logger = getLogger('educator-intelligence-engine');

// Server-side LLM ops (Cloudflare Workers AI via authenticated Pages endpoint).
// Data-first intents keep running locally over Supabase data — unchanged.
async function getCopilotEndpoint(): Promise<string> {
  const { getApiUrl } = await import('@/shared/api/apiUtils');
  return getApiUrl('educator-copilot/chat');
}

async function postCopilotOp<T>(op: string, payload: Record<string, unknown>): Promise<T> {
  const url = await getCopilotEndpoint();
  const response = await ssoClient.fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ op, ...payload }),
  });
  if (!response.ok) {
    throw new Error(`Educator copilot request failed (${response.status})`);
  }
  const json = (await response.json()) as { success: boolean; data: T; error?: unknown };
  if (!json.success) {
    throw new Error('Educator copilot request failed');
  }
  return json.data;
}

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
      const educatorContext = await buildEducatorContext(educatorId);
      const intent = await this.classifyIntent(query);

      const history = this.getConversationHistory(conversationId || educatorId);

      // For general queries, use streaming
      if (intent === 'general' || intent === 'guidance-request' || intent === 'resource-recommendation') {
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
      logger.error('Process query stream failed', error instanceof Error ? error : new Error(String(error)), { educatorId });
      return {
        success: false,
        error: 'I encountered an error processing your request. Please try again.',
        message: 'I apologize, but I encountered an error. The AI service may be temporarily unavailable.'
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
      // Step 1: Build educator context
      const educatorContext = await buildEducatorContext(educatorId);

      // Step 2: Classify intent
      const intent = await this.classifyIntent(query);

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
      logger.error('Process query failed', error instanceof Error ? error : new Error(String(error)), { educatorId });
      return {
        success: false,
        error: 'I encountered an error processing your request. Please try again.',
        message: 'I apologize, but I encountered an error. The AI service may be temporarily unavailable.'
      };
    }
  }

  /**
   * Classify the intent of the educator's query
   */
  private async classifyIntent(query: string): Promise<EducatorIntent> {
    try {
      const data = await postCopilotOp<{ intent: EducatorIntent }>('classify', { query });
      return data.intent;
    } catch (error) {
      logger.error('Intent classification failed', error instanceof Error ? error : new Error(String(error)));
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
        const atRisk = await educatorInsights.getAtRisklearners();
        const top = atRisk.slice(0, 8);
        const message = top.length === 0
          ? 'No at-risk learners detected based on skills, projects, training, assignments, and activity.'
          : [
            'Top at-risk learners (ranked):',
            ...top.map((s: any, i: number) => `${i + 1}. ${s.name} — Flags: ${s.flags.map((f: any) => f.reason).join('; ')}`)
          ].join('\n');

        return {
          success: true,
          message,
          data: { atRisk: top },
          interactive: {
            cards: top.map((s: any) => ({
              type: 'learner-insight',
              data: {
                learnerId: s.learnerId,
                learnerName: s.name,
                insightType: 'concern',
                title: 'At-risk indicators',
                description: s.flags.map((f: any) => `• ${f.reason} (${f.severity})`).join('\n'),
                recommendation: 'Schedule a quick 1:1, set a 2-week micro-goal, assign a targeted resource.',
                priority: s.flags.some((f: any) => f.severity === 'high') ? 'high' : 'medium',
                actionItems: [
                  'Assign 1 focused practice task',
                  'Check-in on training progress next week',
                  'Review project plan and unblock'
                ]
              }
            })),
            metadata: {
              intentHandled: this.getIntentLabel(intent),
              nextSteps: this.generateNextSteps(intent),
              encouragement: this.getEncouragement(intent)
            },
            suggestions: this.generateSuggestions(intent)
          }
        };
      }

      if (intent === 'career-readiness') {
        const matches = await educatorInsights.getOpportunityMatches(undefined, 50);
        const top = matches.slice(0, 12);
        const message = top.length === 0
          ? 'No strong matches found. Consider focusing on foundational skills first.'
          : [
            'Top learner–opportunity matches:',
            ...top.slice(0, 8).map((m: any) => `• ${m.learnerName} → ${m.opportunityTitle} (${m.readinessScore}%). Missing: ${m.missingSkills.join(', ') || '—'}`)
          ].join('\n');

        return {
          success: true,
          message,
          data: { matches: top },
          interactive: {
            cards: top.map((m: any) => ({
              type: 'learner-insight',
              data: {
                learnerId: m.learnerId,
                learnerName: m.learnerName,
                insightType: 'opportunity',
                title: m.opportunityTitle,
                description: `Matched: ${m.matchedSkills.join(', ') || '—'}`,
                recommendation: m.missingSkills.length ? `Assign training: ${m.missingSkills.join(', ')}` : 'Encourage to apply now',
                priority: m.readinessScore >= 70 ? 'high' : 'medium'
              }
            })),
            metadata: {
              intentHandled: this.getIntentLabel(intent),
              nextSteps: this.generateNextSteps(intent),
              encouragement: this.getEncouragement(intent)
            },
            suggestions: this.generateSuggestions(intent)
          }
        };
      }

      if (intent === 'class-analytics') {
        const analytics = await educatorInsights.getClassAnalytics();
        const message = `Learners: ${analytics.totallearners}\nAvg skills/learner: ${analytics.avgSkillsPerLearner}\nTraining completion rate: ${analytics.trainingCompletionRate}%\nTop skills: ${analytics.topSkills.map((s: any) => `${s.name} (${s.count})`).slice(0, 5).join(', ')}`;
        return {
          success: true,
          message,
          data: analytics,
          interactive: {
            metadata: {
              intentHandled: this.getIntentLabel(intent),
              nextSteps: this.generateNextSteps(intent),
              encouragement: this.getEncouragement(intent)
            },
            suggestions: this.generateSuggestions(intent)
          }
        };
      }

      if (intent === 'learner-insights') {
        const learners = await dataFetcherService.getlearnersWithAssignments();
        const insights = educatorAnalyticsService.buildlearnerInsights(learners);

        // Sort by performance: top performers first (most skills, fewest flags)
        const sorted = [...insights].sort((a, b) => {
          const scoreA = a.skillsCount * 10 - a.flags.length * 5 + (a.assignmentStats?.avgGrade || 0);
          const scoreB = b.skillsCount * 10 - b.flags.length * 5 + (b.assignmentStats?.avgGrade || 0);
          return scoreB - scoreA;
        });

        const top = sorted.slice(0, 10);

        const message = top.length === 0
          ? 'No learners available.'
          : [
            `📊 Top ${top.length} Learners Overview:\n`,
            ...top.map((s: any, i: number) => {
              const grade = s.assignmentStats?.avgGrade || 0;
              const gradeStr = grade > 0 ? ` | Avg Grade: ${grade}%` : '';
              const status = s.flags.length ? '⚠️' : '✅';
              return `${i + 1}. ${status} ${s.name} - ${s.skillsCount} skills${gradeStr}${s.flags.length ? ` (${s.flags.length} concern${s.flags.length > 1 ? 's' : ''})` : ''}`;
            })
          ].join('\n');

        return {
          success: true,
          message,
          data: top,
          interactive: {
            cards: top.map((s: any) => ({
              type: 'learner-insight',
              data: {
                learnerId: s.learnerId,
                learnerName: s.name,
                insightType: s.flags.length ? 'concern' : 'strength',
                title: s.flags.length ? 'Needs attention' : 'On track',
                description: s.flags.length ? s.flags.map((f: any) => `• ${f.reason}`).join('\n') : `Top skills: ${s.topSkills.map((x: any) => x.name).join(', ')}`,
                recommendation: s.flags.length ? 'Prioritize 1 actionable goal this week.' : 'Offer a stretch project.',
                priority: s.flags.some((f: any) => f.severity === 'high') ? 'high' : 'low'
              }
            })),
            metadata: {
              intentHandled: this.getIntentLabel(intent),
              nextSteps: this.generateNextSteps(intent),
              encouragement: this.getEncouragement(intent)
            },
            suggestions: this.generateSuggestions(intent)
          }
        };
      }

      // Fallback to server-side LLM for other intents or when data is insufficient
      const data = await postCopilotOp<{ intent: EducatorIntent; message: string }>('respond', {
        query,
        intent,
        context: educatorContext,
        history,
      });

      const aiMessage = data.message || 'I apologize, but I could not generate a response.';
      return {
        success: true,
        message: aiMessage,
        interactive: {
          metadata: {
            intentHandled: this.getIntentLabel(intent),
            nextSteps: this.generateNextSteps(intent),
            encouragement: this.getEncouragement(intent)
          },
          suggestions: this.generateSuggestions(intent)
        }
      };
    } catch (error) {
      logger.error('Generate intelligent response failed', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Get human-readable intent label
   */
  private getIntentLabel(intent: EducatorIntent): string {
    const labels: Record<EducatorIntent, string> = {
      'learner-insights': 'Learner Insights',
      'class-analytics': 'Class Analytics',
      'intervention-needed': 'Intervention Guidance',
      'guidance-request': 'Educator Guidance',
      'skill-trends': 'Skill Trends',
      'career-readiness': 'Career Readiness',
      'resource-recommendation': 'Resource Recommendations',
      'general': 'General Assistance'
    };
    return labels[intent] || 'General';
  }

  /**
   * Generate contextual next steps
   */
  private generateNextSteps(intent: EducatorIntent): string[] {
    const steps: Record<EducatorIntent, string[]> = {
      'learner-insights': [
        'Review individual learner profiles',
        'Schedule 1-on-1 meetings with identified learners',
        'Track progress over the next 2 weeks'
      ],
      'class-analytics': [
        'Share insights with department',
        'Adjust curriculum based on trends',
        'Monitor class engagement metrics'
      ],
      'intervention-needed': [
        'Reach out to at-risk learners immediately',
        'Document interventions and outcomes',
        'Follow up within 1 week'
      ],
      'guidance-request': [
        'Implement suggested strategies',
        'Gather learner feedback',
        'Adjust approach based on results'
      ],
      'skill-trends': [
        'Update course materials with trending skills',
        'Share resources with learners',
        'Plan workshops or guest lectures'
      ],
      'career-readiness': [
        'Conduct career readiness assessments',
        'Organize industry connect sessions',
        'Help learners build portfolios'
      ],
      'resource-recommendation': [
        'Share resources with learners',
        'Create curated learning paths',
        'Track resource engagement'
      ],
      'general': [
        'Explore specific learner or class needs',
        'Ask follow-up questions for deeper insights'
      ]
    };
    return steps[intent] || [];
  }

  /**
   * Generate encouraging message
   */
  private getEncouragement(intent: EducatorIntent): string {
    const encouragements: Record<EducatorIntent, string> = {
      'learner-insights': "You're taking proactive steps to understand your learners better. This personalized attention makes a real difference.",
      'class-analytics': "Your data-driven approach to teaching is excellent. These insights will help you reach more learners effectively.",
      'intervention-needed': "Identifying learners who need support early is crucial. Your attention can change their trajectory.",
      'guidance-request': "Seeking better ways to guide learners shows your commitment to their success. Keep up the great work!",
      'skill-trends': "Staying current with industry trends ensures your learners remain competitive. Your learners are lucky to have you.",
      'career-readiness': "Preparing learners for real-world careers is one of the most valuable things you can do. Well done!",
      'resource-recommendation': "Curating quality resources saves learners time and improves outcomes. Your effort is appreciated!",
      'general': "I'm here to support you in any way I can. Feel free to ask anything about learner guidance!"
    };
    return encouragements[intent] || "Great question! Let's work through this together.";
  }

  /**
   * Generate follow-up suggestions
   */
  private generateSuggestions(intent: EducatorIntent): any[] {
    const suggestions: Record<EducatorIntent, any[]> = {
      'learner-insights': [
        { id: '1', label: 'Show me struggling learners', query: 'Which learners are struggling and need intervention?' },
        { id: '2', label: 'Identify top performers', query: 'Which learners are excelling and ready for advanced opportunities?' }
      ],
      'class-analytics': [
        { id: '1', label: 'Skill gap analysis', query: 'What are the common skill gaps in my class?' },
        { id: '2', label: 'Career interest trends', query: 'What careers are my learners most interested in?' }
      ],
      'intervention-needed': [
        { id: '1', label: 'Create action plan', query: 'Help me create an intervention action plan' },
        { id: '2', label: 'Learner engagement tips', query: 'How can I improve learner engagement?' }
      ],
      'general': [
        { id: '1', label: 'Class overview', query: 'Give me an overview of my class performance' },
        { id: '2', label: 'Learner insights', query: 'Which learners need my attention?' }
      ]
    };
    return suggestions[intent] || suggestions['general'];
  }

  /**
   * Conversation history management
   */
  private getConversationHistory(conversationId: string): any[] {
    return this.conversationHistory.get(conversationId) || [];
  }

  private updateConversationHistory(conversationId: string, userQuery: string, aiResponse: string): void {
    const history = this.getConversationHistory(conversationId);
    history.push(
      { role: 'user', content: userQuery },
      { role: 'assistant', content: aiResponse }
    );

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
      const url = await getCopilotEndpoint();
      const response = await ssoClient.fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          op: 'respond-stream',
          query,
          intent,
          context: educatorContext,
          history,
        }),
      });
      if (!response.ok || !response.body) {
        throw new Error(`Educator copilot stream failed (${response.status})`);
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullMessage = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (payload === '[DONE]') continue;
          let event: { text?: string; error?: string };
          try {
            event = JSON.parse(payload) as { text?: string; error?: string };
          } catch {
            // Malformed SSE line: skip, keep framing intact.
            continue;
          }
          if (event.error) throw new Error(event.error);
          if (event.text) {
            fullMessage += event.text;
            onChunk(event.text);
          }
        }
      }
      reader.releaseLock();

      return {
        success: true,
        message: fullMessage,
        interactive: {
          metadata: {
            intentHandled: this.getIntentLabel(intent),
            nextSteps: this.generateNextSteps(intent),
            encouragement: this.getEncouragement(intent)
          },
          suggestions: this.generateSuggestions(intent)
        }
      };
    } catch (error) {
      logger.error('Generate streaming response failed', error instanceof Error ? error : new Error(String(error)));
      // Fallback to non-streaming
      return await this.generateIntelligentResponse(query, intent, educatorContext, history);
    }
  }
}

// Export singleton instance
export const educatorIntelligenceEngine = new EducatorIntelligenceEngine();
