/**
 * 🧠 ENHANCED AI-FIRST REASONING & INTENT DETECTION
 * 
 * Advanced features:
 * - Deep contextual reasoning (understands nuance)
 * - Multi-intent detection (handles complex queries)
 * - Emotion detection (understands frustration, excitement, confusion)
 * - Proactive intent prediction (anticipates next question)
 * - Learning pattern recognition
 */

import { getOpenAIClient, DEFAULT_MODEL } from './openAIClient';
import { StudentProfile } from '../types';

export type EnhancedIntent =
  | 'find-jobs'
  | 'skill-gap-analysis'
  | 'interview-prep'
  | 'resume-review'
  | 'learning-path'
  | 'career-guidance'
  | 'technology-comparison'
  | 'salary-inquiry'
  | 'company-research'
  | 'profile-improvement'
  | 'certification-advice'
  | 'project-ideas'
  | 'code-review'           // NEW: Student wants code reviewed
  | 'debugging-help'        // NEW: Student stuck on bug
  | 'learning-struggle'     // NEW: Student struggling with concept
  | 'project-guidance'      // NEW: Help with ongoing project
  | 'career-anxiety'        // NEW: Worried about career prospects
  | 'imposter-syndrome'     // NEW: Feeling inadequate
  | 'time-management'       // NEW: Overwhelmed with learning
  | 'general';

export type EmotionalTone =
  | 'neutral'
  | 'excited'
  | 'frustrated'
  | 'confused'
  | 'anxious'
  | 'motivated'
  | 'discouraged'
  | 'confident';

export interface EnhancedDetectedIntent {
  // Primary intent
  primary: EnhancedIntent;
  primaryConfidence: number;
  
  // Multi-intent support
  secondary: Array<{
    intent: EnhancedIntent;
    confidence: number;
    reasoning: string;
  }>;
  
  // Emotional intelligence
  emotionalTone: EmotionalTone;
  emotionalIntensity: number; // 0-1
  needsEmpathy: boolean;
  
  // Deep understanding
  userGoal: string; // What they want to achieve
  underlyingProblem?: string; // Real problem behind the ask
  contextualFactors: string[]; // Things affecting their query
  
  // Extracted entities
  entities: {
    skills?: string[];
    technologies?: string[];
    domains?: string[];
    companies?: string[];
    roles?: string[];
    timeframes?: string[];
    codeLanguage?: string;
  };
  
  // Proactive intelligence
  predictedNextQuestions: string[];
  suggestedProactiveTips: string[];
  
  // Response strategy
  responseStrategy: {
    tone: 'supportive' | 'informative' | 'motivational' | 'technical';
    shouldAskFollowup: boolean;
    followupQuestion?: string;
    shouldProvideVisual: boolean; // For multi-modal learning
    shouldProvideCodeExample: boolean;
  };
  
  // Learning insights
  learningStage?: 'beginner' | 'intermediate' | 'advanced';
  strugglingWith?: string[];
  
  // AI reasoning (transparent)
  aiReasoning: string;
}

class EnhancedIntentService {
  
  /**
   * 🧠 MAIN DETECTION: Deep AI reasoning with emotional intelligence
   */
  async detectIntentWithDeepReasoning(
    message: string,
    profile?: StudentProfile,
    conversationHistory?: Array<{ role: string; content: string }>,
    recentProfileChanges?: string[]
  ): Promise<EnhancedDetectedIntent> {
    
    try {
      console.log('🧠 ENHANCED AI-FIRST: Deep reasoning with emotional intelligence...');
      
      const prompt = this.buildDeepReasoningPrompt(
        message,
        profile,
        conversationHistory,
        recentProfileChanges
      );
      
      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an exceptionally intelligent career AI with deep empathy and understanding. 
You think like a human mentor who:
- Understands emotional context (frustration, excitement, anxiety)
- Reads between the lines (what they really need vs what they ask)
- Anticipates next questions
- Provides personalized guidance
- Never dismisses struggles

Think deeply. Be empathetic. Be proactive.`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5, // Balanced creativity + consistency
        max_tokens: 1200,
        response_format: { type: 'json_object' }
      });
      
      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
      
      // Log AI's deep understanding
      console.log('🧠 AI Reasoning:', result.reasoning);
      console.log('🎯 Primary Intent:', result.primary_intent, `(${result.primary_confidence}%)`);
      console.log('💭 Emotional Tone:', result.emotional_tone, `(intensity: ${result.emotional_intensity})`);
      console.log('🎯 User Goal:', result.user_goal);
      if (result.underlying_problem) {
        console.log('⚠️ Underlying Problem:', result.underlying_problem);
      }
      
      return this.parseAIResponse(result);
      
    } catch (error) {
      console.error('Enhanced intent detection error:', error);
      return this.getFallbackIntent(message);
    }
  }
  
  /**
   * Build comprehensive prompt for deep reasoning
   */
  private buildDeepReasoningPrompt(
    message: string,
    profile?: StudentProfile,
    conversationHistory?: Array<{ role: string; content: string }>,
    recentProfileChanges?: string[]
  ): string {
    
    const profileSkills = profile?.profile?.technicalSkills?.map((s: any) => s.name).join(', ') || 'None';
    const profileLevel = profile?.profile?.technicalSkills?.length || 0;
    const department = profile?.department || 'Unknown';
    
    const historyContext = conversationHistory 
      ? conversationHistory.slice(-5).map(h => `${h.role}: ${h.content}`).join('\n')
      : 'No prior conversation';
    
    const recentChanges = recentProfileChanges && recentProfileChanges.length > 0
      ? `Recent profile changes: ${recentProfileChanges.join(', ')}`
      : '';
    
    return `You are analyzing a student's query with DEEP INTELLIGENCE and EMPATHY.

**STUDENT PROFILE:**
- Department: ${department}
- Skills: ${profileSkills}
- Skill count: ${profileLevel} skills
- Learning stage: ${profileLevel < 3 ? 'Beginner' : profileLevel < 7 ? 'Intermediate' : 'Advanced'}
${recentChanges}

**RECENT CONVERSATION:**
${historyContext}

**CURRENT QUERY:**
"${message}"

**YOUR DEEP ANALYSIS TASK:**

1️⃣ **EMOTIONAL INTELLIGENCE** - Detect the emotional state:
   - Is the student frustrated? ("stuck", "can't figure out", "not working")
   - Excited? ("awesome", "love", "amazing")
   - Confused? ("don't understand", "confused", "what does this mean")
   - Anxious? ("worried", "nervous", "scared", "not good enough")
   - Struggling? ("difficult", "hard", "challenging")
   
   Return: emotional_tone (neutral/excited/frustrated/confused/anxious/motivated/discouraged/confident)
   Return: emotional_intensity (0.0 to 1.0)
   Return: needs_empathy (true if student needs encouragement)

2️⃣ **MULTI-INTENT DETECTION** - What are ALL the intents?
   Primary + Secondary intents:
   - **code-review**: "review my code", "check my code", "is this correct"
   - **debugging-help**: "bug", "error", "not working", "stuck"
   - **learning-struggle**: "don't understand", "confused about", "hard to learn"
   - **project-guidance**: "help with my project", "working on X"
   - **career-anxiety**: "worried about jobs", "not good enough", "will I get hired"
   - **imposter-syndrome**: "everyone better than me", "don't belong", "fake"
   - **time-management**: "too much to learn", "overwhelmed", "don't have time"
   - **project-ideas**: "what should I build", "project suggestions"
   - **learning-path**: "what should I learn", "course recommendations"
   - **find-jobs**: "job opportunities", "find jobs"
   - **skill-gap-analysis**: "what skills do I need", "am I missing"
   - **technology-comparison**: "X vs Y", "which is better"
   - **career-guidance**: "career advice", "what career path"
   - **general**: Simple greeting or conversation

3️⃣ **DEEP UNDERSTANDING** - What do they REALLY want?
   - user_goal: What they want to achieve (1 sentence)
   - underlying_problem: The REAL problem behind their question (if different)
   - contextual_factors: Things affecting their query (array)
   
   Example:
   Query: "I've been trying to learn React for weeks but I'm so confused"
   - user_goal: "Learn React effectively"
   - underlying_problem: "Struggling with learning method, needs structured path"
   - contextual_factors: ["Time pressure", "Self-doubt", "Lack of clear roadmap"]

4️⃣ **ENTITY EXTRACTION** - Extract specific entities:
   - skills: [programming languages, frameworks]
   - technologies: [tools, platforms]
   - domains: [healthcare, fintech, e-commerce, etc.]
   - code_language: if code is mentioned
   - timeframes: ["2 weeks", "3 months", etc.]

5️⃣ **PROACTIVE INTELLIGENCE** - Anticipate next needs:
   - predicted_next_questions: Array of 2-3 likely follow-up questions
   - suggested_proactive_tips: Array of 2-3 helpful tips without them asking
   
   Example:
   If struggling with React:
   - predicted_next_questions: ["What resources are best?", "How long to master?", "Should I build projects?"]
   - suggested_proactive_tips: ["Start with official React docs", "Build 3 projects for solid understanding", "Join React communities"]

6️⃣ **RESPONSE STRATEGY** - How to best respond:
   - tone: supportive/informative/motivational/technical
   - should_ask_followup: true if need more info
   - followup_question: What to ask if needed
   - should_provide_visual: true if diagram/flowchart would help
   - should_provide_code_example: true if code example would help

7️⃣ **LEARNING INSIGHTS** (if relevant):
   - learning_stage: beginner/intermediate/advanced
   - struggling_with: Array of specific concepts they're finding hard

**OUTPUT FORMAT (JSON ONLY):**
{
  "reasoning": "[2-3 sentences of your deep understanding]",
  "primary_intent": "<intent>",
  "primary_confidence": 0.95,
  "secondary_intents": [
    {"intent": "learning-struggle", "confidence": 0.7, "reasoning": "Shows frustration with learning"}
  ],
  "emotional_tone": "frustrated",
  "emotional_intensity": 0.8,
  "needs_empathy": true,
  "user_goal": "Learn React effectively and build confidence",
  "underlying_problem": "Needs structured learning path and encouragement",
  "contextual_factors": ["Self-doubt", "Unclear roadmap", "Time pressure"],
  "entities": {
    "skills": ["react"],
    "technologies": [],
    "domains": [],
    "code_language": null,
    "timeframes": ["weeks"]
  },
  "predicted_next_questions": [
    "What's the best way to learn React?",
    "How long does it take to get good?",
    "Should I follow tutorials or build projects?"
  ],
  "suggested_proactive_tips": [
    "Start with React docs 'Thinking in React' guide",
    "Build 3 small projects: Todo, Weather App, Dashboard",
    "Don't compare your progress to others - everyone learns differently"
  ],
  "response_strategy": {
    "tone": "supportive",
    "should_ask_followup": false,
    "followup_question": null,
    "should_provide_visual": true,
    "should_provide_code_example": true
  },
  "learning_stage": "beginner",
  "struggling_with": ["React hooks", "Component architecture", "State management"]
}`;
  }
  
  /**
   * Parse AI response into structured format
   */
  private parseAIResponse(result: any): EnhancedDetectedIntent {
    return {
      primary: result.primary_intent || 'general',
      primaryConfidence: result.primary_confidence || 0.8,
      secondary: result.secondary_intents || [],
      emotionalTone: result.emotional_tone || 'neutral',
      emotionalIntensity: result.emotional_intensity || 0.5,
      needsEmpathy: result.needs_empathy || false,
      userGoal: result.user_goal || '',
      underlyingProblem: result.underlying_problem,
      contextualFactors: result.contextual_factors || [],
      entities: result.entities || {},
      predictedNextQuestions: result.predicted_next_questions || [],
      suggestedProactiveTips: result.suggested_proactive_tips || [],
      responseStrategy: result.response_strategy || {
        tone: 'informative',
        shouldAskFollowup: false,
        shouldProvideVisual: false,
        shouldProvideCodeExample: false
      },
      learningStage: result.learning_stage,
      strugglingWith: result.struggling_with || [],
      aiReasoning: result.reasoning || ''
    };
  }
  
  /**
   * Fallback for errors
   */
  private getFallbackIntent(message: string): EnhancedDetectedIntent {
    return {
      primary: 'general',
      primaryConfidence: 0.5,
      secondary: [],
      emotionalTone: 'neutral',
      emotionalIntensity: 0.3,
      needsEmpathy: false,
      userGoal: 'Get general assistance',
      contextualFactors: [],
      entities: {},
      predictedNextQuestions: [],
      suggestedProactiveTips: [],
      responseStrategy: {
        tone: 'informative',
        shouldAskFollowup: true,
        followupQuestion: 'How can I help you today?',
        shouldProvideVisual: false,
        shouldProvideCodeExample: false
      },
      aiReasoning: 'Fallback detection due to error'
    };
  }
}

export default new EnhancedIntentService();
