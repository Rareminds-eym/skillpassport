import OpenAI from 'openai';
import { RecruiterIntent } from '../types';

/**
 * Advanced Intent Classification System
 * 
 * Multi-layered intelligence:
 * 1. Pattern-based instant classification (no API call)
 * 2. Context-aware intent detection
 * 3. LLM-powered semantic understanding
 * 4. Confidence scoring and fallback logic
 */

export interface ClassifiedIntent {
  primary: RecruiterIntent;
  confidence: number;
  secondaryIntents: Array<{ intent: RecruiterIntent; confidence: number }>;
  detectedEntities: {
    skills?: string[];
    locations?: string[];
    experience?: string;
    urgency?: 'high' | 'medium' | 'low';
    roleType?: string;
    company?: string;
    count?: number;
  };
  suggestedActions: string[];
  needsClarification: boolean;
  clarificationQuestions?: string[];
}

class AdvancedIntentClassifier {
  private openaiClient: OpenAI | null = null;

  private getClient(): OpenAI {
    if (!this.openaiClient) {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OpenAI API key not configured');
      }
      
      this.openaiClient = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: apiKey,
        defaultHeaders: {
          "HTTP-Referer": typeof window !== 'undefined' ? window.location.origin : '',
          "X-Title": "SkillPassport Intent Classifier",
        },
        dangerouslyAllowBrowser: true
      });
    }
    return this.openaiClient;
  }

  /**
   * Classify intent with advanced understanding
   */
  async classifyIntent(
    query: string,
    conversationHistory: any[] = [],
    recruiterContext: any = {}
  ): Promise<ClassifiedIntent> {
    const queryLower = query.toLowerCase().trim();

    // Layer 1: Instant pattern-based classification (fastest)
    const patternResult = this.patternBasedClassification(queryLower);
    
    // Use AI for better understanding - only skip AI if confidence is VERY high
    if (patternResult.confidence > 0.95) {
      console.log('🎯 Pattern-based classification (instant, very confident):', patternResult.primary);
      return this.enrichClassification(patternResult, query, conversationHistory);
    }

    // Layer 2: Context-aware classification
    const contextResult = this.contextAwareClassification(
      queryLower, 
      conversationHistory, 
      recruiterContext
    );
    
    // Lower threshold - prefer AI for ambiguous queries
    if (contextResult.confidence > 0.90) {
      console.log('🧠 Context-aware classification:', contextResult.primary);
      return this.enrichClassification(contextResult, query, conversationHistory);
    }

    // Layer 3: LLM-powered semantic understanding (most accurate)
    // Use AI for most queries to ensure better understanding
    try {
      console.log('🤖 Using AI for semantic understanding...');
      const llmResult = await this.llmBasedClassification(query, conversationHistory);
      console.log('✅ LLM-based classification:', llmResult.primary, `(confidence: ${(llmResult.confidence || 0.95) * 100}%)`);
      return this.enrichClassification(llmResult, query, conversationHistory);
    } catch (error) {
      console.error('LLM classification failed, using fallback:', error);
      // Use context result if available, otherwise pattern result
      return this.enrichClassification(
        contextResult.confidence > patternResult.confidence ? contextResult : patternResult, 
        query, 
        conversationHistory
      );
    }
  }

  /**
   * Layer 1: Fast pattern-based classification
   */
  private patternBasedClassification(queryLower: string): Partial<ClassifiedIntent> {
    const patterns = {
      'hiring-decision': [
        /suggest|recommend|who should|which candidate|hire|best|top/,
        /applied|applicants?|current|opportunities?/
      ],
      'opportunity-applications': [
        /who|show|list|applied|applications?/,
        /my opportunities?|my jobs?|my openings?|my positions?/
      ],
      'candidate-search': [
        /find|search|show|looking for|need|get me|list/,
        /candidates?|students?|developers?|engineers?|programmers?/
      ],
      'talent-pool-analytics': [
        /how many|total|count|statistics|stats|overview|dashboard/,
        /candidates?|talent pool|skills?/
      ],
      'job-matching': [
        /match|fit|suitable|best for|candidates for/,
        /role|position|job|opening|opportunity/
      ],
      'hiring-recommendations': [
        /ready to hire|hire now|ready for hire|which.*hire|who.*hire/,
        /candidates?|students?/
      ],
      'skill-insights': [
        /what skills|which skills|skill distribution|common skills/,
        /popular|trending|emerging|available/
      ],
      'market-trends': [
        /market|industry|competitive|demand|trending/,
        /salary|compensation|hiring velocity/
      ],
      'pipeline-review': [
        /pipeline|funnel|stages|bottleneck|stuck/,
        /conversion|progress|status|review/
      ],
      'interview-guidance': [
        /how to|should i ask|interview|assess|evaluate/,
        /questions|screening|technical/
      ],
      'candidate-assessment': [
        /compare|difference|versus|vs|evaluate/,
        /candidate|assessment|review/
      ]
    };

    for (const [intent, patternPair] of Object.entries(patterns)) {
      const [firstPattern, secondPattern] = patternPair;
      if (firstPattern.test(queryLower) && secondPattern.test(queryLower)) {
        return {
          primary: intent as RecruiterIntent,
          confidence: 0.9,
          secondaryIntents: []
        };
      }
    }

    // Fallback to single pattern match with lower confidence
    for (const [intent, patternPair] of Object.entries(patterns)) {
      if (patternPair.some(p => p.test(queryLower))) {
        return {
          primary: intent as RecruiterIntent,
          confidence: 0.6,
          secondaryIntents: []
        };
      }
    }

    return {
      primary: 'general',
      confidence: 0.4,
      secondaryIntents: []
    };
  }

  /**
   * Layer 2: Context-aware classification
   */
  private contextAwareClassification(
    queryLower: string,
    conversationHistory: any[],
    recruiterContext: any
  ): Partial<ClassifiedIntent> {
    // Check if this is a follow-up question
    if (conversationHistory.length > 0) {
      const lastQuery = conversationHistory[conversationHistory.length - 1];
      
      // Follow-up patterns
      if (/more|another|also|additionally|what about|how about/.test(queryLower)) {
        return {
          primary: lastQuery.intent || 'general',
          confidence: 0.8,
          secondaryIntents: []
        };
      }
      
      // Refinement patterns
      if (/filter|narrow|refine|specific|only|exclude/.test(queryLower)) {
        return {
          primary: 'candidate-search',
          confidence: 0.85,
          secondaryIntents: []
        };
      }
    }

    // Context from recruiter's recent activity
    if (recruiterContext.recent_activities?.length > 0) {
      const recentActivity = recruiterContext.recent_activities[0];
      
      if (/posted|created/.test(recentActivity) && /candidates? for/i.test(queryLower)) {
        return {
          primary: 'job-matching',
          confidence: 0.85,
          secondaryIntents: []
        };
      }
    }

    return this.patternBasedClassification(queryLower);
  }

  /**
   * Layer 3: LLM-powered semantic classification
   */
  private async llmBasedClassification(
    query: string,
    conversationHistory: any[]
  ): Promise<Partial<ClassifiedIntent>> {
    const client = this.getClient();

    const historyContext = conversationHistory.length > 0
      ? `\n\nPrevious conversation:\n${conversationHistory.slice(-3).map(h => 
          `User: ${h.query}\nIntent: ${h.intent}`
        ).join('\n')}`
      : '';

    const prompt = `Classify this recruiter query into the most appropriate intent.

Available intents:
- hiring-decision: Getting AI recommendation on which applicant to hire from current applications
- opportunity-applications: Viewing candidates who applied to recruiter's job opportunities/openings
- hiring-recommendations: Getting AI analysis on which candidates are READY TO HIRE NOW (based on profile quality, skills)
- candidate-search: Finding or searching for NEW candidates
- talent-pool-analytics: Analytics about the overall talent pool
- job-matching: Matching candidates to specific job positions
- skill-insights: Understanding skill distribution and gaps
- market-trends: Market intelligence and competitive landscape
- interview-guidance: Interview tips and assessment strategies
- candidate-assessment: Evaluating or comparing specific candidates
- pipeline-review: Reviewing recruitment pipeline status
- general: General questions or unclear queries

Important:
- If query asks "ready to hire", "hire now", "which candidates to hire", "who is hire-ready", use "hiring-recommendations"
- If query asks "suggest who to hire", "recommend", "which applicant", "best from applied", use "hiring-decision"
- If query asks about "my opportunities", "my jobs", "applications", "who applied", use "opportunity-applications"
- If query asks to "find" or "search for" NEW candidates, use "candidate-search"
- "candidate-search" is for FINDING new people, NOT evaluating existing ones

Query: "${query}"${historyContext}

Respond with ONLY a JSON object in this exact format:
{
  "primary": "intent-name",
  "confidence": 0.95,
  "reasoning": "brief explanation"
}`;

    const response = await client.chat.completions.create({
      model: 'openrouter/polaris-alpha',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at understanding recruiter intent. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 150
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('Empty response from LLM');
    }

    const parsed = JSON.parse(content);
    
    return {
      primary: parsed.primary as RecruiterIntent,
      confidence: parsed.confidence || 0.7,
      secondaryIntents: []
    };
  }

  /**
   * Enrich classification with entity detection and suggestions
   */
  private enrichClassification(
    baseClassification: Partial<ClassifiedIntent>,
    originalQuery: string,
    conversationHistory: any[]
  ): ClassifiedIntent {
    const detectedEntities = this.extractEntities(originalQuery);
    const suggestedActions = this.generateSuggestedActions(
      baseClassification.primary || 'general',
      detectedEntities
    );
    
    const needsClarification = this.checkIfClarificationNeeded(
      baseClassification,
      detectedEntities
    );
    
    const clarificationQuestions = needsClarification
      ? this.generateClarificationQuestions(baseClassification, detectedEntities)
      : undefined;

    return {
      primary: baseClassification.primary || 'general',
      confidence: baseClassification.confidence || 0.5,
      secondaryIntents: baseClassification.secondaryIntents || [],
      detectedEntities,
      suggestedActions,
      needsClarification,
      clarificationQuestions
    };
  }

  /**
   * Extract entities from query (skills, locations, etc.)
   */
  private extractEntities(query: string): ClassifiedIntent['detectedEntities'] {
    const entities: ClassifiedIntent['detectedEntities'] = {};
    const queryLower = query.toLowerCase();

    // Detect urgency
    if (/urgent|asap|immediate|critical|priority/.test(queryLower)) {
      entities.urgency = 'high';
    } else if (/soon|quick|fast/.test(queryLower)) {
      entities.urgency = 'medium';
    }

    // Detect count/limit
    const countMatch = queryLower.match(/(\d+)\s*(candidates?|students?|people)/);
    if (countMatch) {
      entities.count = parseInt(countMatch[1]);
    }

    // Detect role types
    const roleTypes = ['developer', 'engineer', 'designer', 'manager', 'analyst', 'scientist'];
    for (const role of roleTypes) {
      if (queryLower.includes(role)) {
        entities.roleType = role;
        break;
      }
    }

    return entities;
  }

  /**
   * Generate suggested actions based on intent
   */
  private generateSuggestedActions(
    intent: RecruiterIntent,
    entities: ClassifiedIntent['detectedEntities']
  ): string[] {
    const actionMap: Record<RecruiterIntent, string[]> = {
      'hiring-decision': [
        'Review AI recommendation reasoning',
        'Compare top candidates',
        'Schedule interviews with recommended candidates'
      ],
      'opportunity-applications': [
        'Review applicant profiles',
        'Move candidates to next stage',
        'Schedule interviews with top applicants'
      ],
      'candidate-search': [
        'Review candidate profiles',
        'Schedule screening calls',
        'Check skill matches'
      ],
      'talent-pool-analytics': [
        'Review skill distribution',
        'Identify hiring gaps',
        'Plan recruitment strategy'
      ],
      'job-matching': [
        'Review top matches',
        'Schedule interviews',
        'Send job descriptions'
      ],
      'hiring-recommendations': [
        'Contact top candidates',
        'Prepare interview questions',
        'Check candidate availability'
      ],
      'skill-insights': [
        'Match skills to job requirements',
        'Identify skill gaps',
        'Plan training programs'
      ],
      'market-trends': [
        'Adjust job descriptions',
        'Review compensation packages',
        'Speed up hiring process'
      ],
      'interview-guidance': [
        'Prepare interview questions',
        'Schedule interviews',
        'Brief hiring team'
      ],
      'candidate-assessment': [
        'Compare candidates',
        'Check references',
        'Make hiring decision'
      ],
      'pipeline-review': [
        'Follow up with candidates',
        'Update pipeline status',
        'Address bottlenecks'
      ],
      'general': [
        'Explore candidate profiles',
        'Review talent analytics',
        'Plan hiring steps'
      ]
    };

    const baseActions = actionMap[intent] || actionMap['general'];
    
    // Add urgency-based actions
    if (entities.urgency === 'high') {
      return ['🚨 Take immediate action', ...baseActions];
    }
    
    return baseActions;
  }

  /**
   * Check if clarification is needed
   */
  private checkIfClarificationNeeded(
    classification: Partial<ClassifiedIntent>,
    entities: ClassifiedIntent['detectedEntities']
  ): boolean {
    // Low confidence requires clarification
    if ((classification.confidence || 0) < 0.6) {
      return true;
    }

    // Vague queries need clarification
    if (classification.primary === 'general') {
      return true;
    }

    return false;
  }

  /**
   * Generate clarification questions
   */
  private generateClarificationQuestions(
    classification: Partial<ClassifiedIntent>,
    entities: ClassifiedIntent['detectedEntities']
  ): string[] {
    const questions: string[] = [];

    if (classification.primary === 'candidate-search' && !entities.roleType) {
      questions.push('What specific role or skills are you looking for?');
    }

    if (classification.primary === 'job-matching' && !entities.roleType) {
      questions.push('Which job position do you want to match candidates to?');
    }

    if (classification.primary === 'general') {
      questions.push(
        'Would you like to:',
        '• Search for candidates',
        '• View talent pool analytics',
        '• Match candidates to a job',
        '• Get hiring recommendations'
      );
    }

    return questions;
  }
}

export const advancedIntentClassifier = new AdvancedIntentClassifier();
