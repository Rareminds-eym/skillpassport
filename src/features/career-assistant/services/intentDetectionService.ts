/**
 * Sophisticated Intent Detection Service
 * Multi-intent classifier with contextual understanding and ambiguity resolution
 */

import { getOpenAIClient, DEFAULT_MODEL } from './openAIClient';
import { StudentProfile } from '../types';

export type Intent =
  | 'find-jobs'
  | 'skill-gap-analysis'
  | 'interview-prep'
  | 'resume-review'
  | 'learning-path'
  | 'career-guidance'
  | 'technology-comparison'
  | 'salary-inquiry'
  | 'company-research'
  | 'networking-advice'
  | 'profile-improvement'
  | 'certification-advice'
  | 'project-ideas' // NEW: Project suggestions based on skills
  | 'general';

export interface DetectedIntent {
  primary: Intent;
  secondary: Intent[];
  confidence: Record<Intent, number>;
  requiresClarification: boolean;
  clarificationQuestion?: string;
  extractedEntities: {
    skills?: string[];
    companies?: string[];
    roles?: string[];
    locations?: string[];
    timeframes?: string[];
  };
}

class IntentDetectionService {
  // Expanded keywords with synonyms and variations for better matching
  private intentKeywords: Record<Intent, string[]> = {
    'find-jobs': [
      'find job',
      'search job',
      'job opportunit',
      'job opening',
      'job match',
      'recommend job',
      'suggest job',
      'show job',
      'available job',
      'job for me',
      'looking for job',
      'need job',
      'want job',
      'apply',
      'position',
      'vacancy',
      'what jobs',
      'which jobs',
      'jobs require',
      'jobs need',
      'jobs for',
      'get job',
      'job search',
      'hire',
      'hiring',
      'placement',
      'work opportunit',
      'employ',
      'career opportun',
      'opening for',
      'job availab',
    ],
    'skill-gap-analysis': [
      'skill gap',
      'missing skill',
      'what skill',
      'should i learn',
      'need to learn',
      'improve skill',
      'skill required',
      'lack skill',
      'which skill',
      'what missing',
      'skill need',
      'skill develop',
      'skill requir',
      'must learn',
      'have to learn',
      'weak skill',
      'dont have skill',
      'not have skill',
      'what i missing',
      'skill i need',
      'upskill',
      'reskill',
    ],
    'interview-prep': [
      'interview',
      'prepare interview',
      'interview question',
      'interview tip',
      'mock interview',
      'practice interview',
      'interview help',
    ],
    'resume-review': [
      'resume',
      'cv',
      'resume review',
      'improve resume',
      'resume help',
      'resume tip',
      'optimize resume',
      'resume feedback',
    ],
    'learning-path': [
      'learn',
      'course',
      'roadmap',
      'tutorial',
      'study',
      'training',
      'recommend course',
      'suggest course',
      'learning path',
      'how to learn',
      'guide',
      'resource',
      'certification path',
      'want learn',
      'wanna learn',
      'how learn',
      'teach me',
      'learning',
      'study path',
      'what study',
      'where learn',
      'best course',
      'good course',
      'free course',
      'paid course',
      'online course',
      'tutorial for',
      'how master',
      'beginner guide',
    ],
    'career-guidance': [
      'career',
      'career path',
      'career choice',
      'career guidance',
      'career advice',
      'switch career',
      'career change',
      'become',
      'transition to',
      'career option',
      'what career',
      'which career',
      'future career',
      'job role',
      'profession',
      'what should i do',
      'confused about career',
      'career suggestion',
      'what field',
      'which field',
      'change field',
    ],
    'technology-comparison': [
      'vs',
      'versus',
      'or',
      'better',
      'which is',
      'which one',
      'difference between',
      'compare',
      'comparison',
      'should i choose',
      'should i use',
      'nodejs vs',
      'react vs',
      'angular vs',
      'django vs',
      'python or',
      'java or',
      'node.js or',
      'which framework',
      'which language',
      'which technology',
      'which stack',
    ],
    'salary-inquiry': [
      'salary',
      'pay',
      'compensation',
      'package',
      'earning',
      'how much',
      'salary range',
      'expected salary',
    ],
    'company-research': [
      'company',
      'about company',
      'company culture',
      'working at',
      'company review',
      'company info',
    ],
    'networking-advice': [
      'network',
      'linkedin',
      'connect',
      'reach out',
      'referral',
      'networking tip',
      'build network',
    ],
    'profile-improvement': [
      'improve profile',
      'improving profile',
      'profile tip',
      'profile help',
      'profile score',
      'complete profile',
      'profile missing',
      'profile gap',
      'profile improv',
      'better profile',
      'enhance profile',
      'boost profile',
      'optimize profile',
      'update profile',
      'upgrade profile',
    ],
    'certification-advice': [
      'certification',
      'certified',
      'cert',
      'certificate',
      'aws certified',
      'google cloud',
      'microsoft azure',
      'worth certification',
    ],
    'project-ideas': [
      'project',
      'build',
      'create',
      'make',
      'develop',
      'ideas',
      'what can i build',
      'project idea',
      'project suggestion',
      'project using',
      'build using',
      'build with',
      'create with',
      'make with',
      'develop with',
      'what project',
      'which project',
      'suggest project',
      'recommend project',
      'portfolio project',
      'practice project',
      'real world project',
      'health sector',
      'medical',
      'healthcare',
      'hospital',
      'patient',
      'chemical',
      'pharmacy',
      'education sector',
      'e-commerce',
      'fintech',
      'social media',
      'food delivery',
      'travel',
      'logistics',
      'agriculture',
      'real estate',
      'hr management',
      'inventory',
      'booking system',
    ],
    general: ['hi', 'hello', 'hey', 'thanks', 'thank you', 'ok', 'okay'],
  };

  /**
   * Detect intents from user message with context
   * NEW: AI-First Approach - Let AI think and reason about the query
   */
  async detectIntents(
    message: string,
    profile?: StudentProfile,
    conversationHistory?: string[]
  ): Promise<DetectedIntent> {
    // NEW: For meaningful queries (>2 words), use AI-first approach
    const wordCount = message.trim().split(/\s+/).length;
    const isSimpleGreeting = /^(hi|hello|hey|thanks|thank you|ok|okay)$/i.test(message.trim());

    if (wordCount > 2 && !isSimpleGreeting) {
      console.log('🧠 AI-FIRST: Letting AI think and reason about the query...');
      return await this.aiFirstDetection(message, profile, conversationHistory);
    }

    // For very simple queries, use quick detection
    const normalizedMessage = this.normalizeMessage(message);
    const quickIntent = this.quickIntentDetection(normalizedMessage);

    console.log('⚡ Quick detection for simple query:', quickIntent.primary);
    return quickIntent;
  }

  /**
   * Normalize message for better matching (handle typos, variations)
   */
  private normalizeMessage(message: string): string {
    let normalized = message.toLowerCase().trim();

    // Common typos and variations
    const replacements: Record<string, string> = {
      nodejs: 'node.js',
      reactjs: 'react',
      vuejs: 'vue',
      ml: 'machine learning',
      ai: 'artificial intelligence',
      devops: 'dev ops',
      fullstack: 'full stack',
      backend: 'back end',
      frontend: 'front end',
      'i want': 'i want to',
      wanna: 'want to',
      gonna: 'going to',
      gotta: 'got to',
      dont: 'do not',
      cant: 'can not',
      wont: 'will not',
      shouldnt: 'should not',
      whats: 'what is',
      hows: 'how is',
      im: 'i am',
      ive: 'i have',
      id: 'i would',
      ill: 'i will',
    };

    // Apply replacements
    Object.entries(replacements).forEach(([from, to]) => {
      const regex = new RegExp(`\\b${from}\\b`, 'gi');
      normalized = normalized.replace(regex, to);
    });

    // Remove extra spaces
    normalized = normalized.replace(/\s+/g, ' ');

    return normalized;
  }

  /**
   * Fast keyword-based intent detection
   */
  private quickIntentDetection(message: string): DetectedIntent {
    const confidence: Record<Intent, number> = {} as any;
    const detectedIntents: Intent[] = [];

    // Special boost for technology comparison queries (e.g., "Node.js vs Django")
    const hasComparisonPattern =
      /\b(\w+)\s+(vs|versus|or)\s+(\w+)\b/i.test(message) ||
      /(which is better|which one|should i (use|choose|learn)).*\b(or|vs)\b/i.test(message);

    // Special boost for skill + job queries (e.g., "What jobs require SQL?")
    const hasJobKeyword = message.includes('job');
    const hasSkillEntity =
      this.extractEntities(message).skills && this.extractEntities(message).skills!.length > 0;
    const isJobWithSkillQuery = hasJobKeyword && hasSkillEntity;

    // Calculate confidence for each intent using fuzzy matching
    Object.entries(this.intentKeywords).forEach(([intent, keywords]) => {
      let score = 0;
      keywords.forEach((keyword) => {
        // Use more flexible matching - check if keyword parts are in message
        // This handles "improving your profile" matching "improve profile"
        const keywordParts = keyword.split(' ');
        const matchesAll = keywordParts.every((part) => message.includes(part));

        if (message.includes(keyword)) {
          score += 1.0;
        } else if (matchesAll && keywordParts.length > 1) {
          // Partial match (all words present but not consecutive)
          score += 0.7;
        } else {
          // Fuzzy match - check for similar words
          const similarity = this.calculateSimilarity(keyword, message);
          if (similarity > 0.6) {
            score += similarity * 0.5;
          }
        }
      });

      // Boost job search if asking about jobs + specific skill
      if (intent === 'find-jobs' && isJobWithSkillQuery) {
        score += 2;
      }

      // Boost technology comparison if has comparison pattern
      if (intent === 'technology-comparison' && hasComparisonPattern) {
        score += 3;
      }

      // Normalize score to 0-1
      const normalizedScore = Math.min(1, score / 3);
      confidence[intent as Intent] = normalizedScore;

      if (normalizedScore > 0.3) {
        detectedIntents.push(intent as Intent);
      }
    });

    // Sort by confidence
    detectedIntents.sort((a, b) => confidence[b] - confidence[a]);

    // Primary intent is the highest confidence
    const primary = detectedIntents[0] || 'general';
    const secondary = detectedIntents.slice(1, 3);

    // Extract entities
    const entities = this.extractEntities(message);

    // Check if clarification needed (LOWERED THRESHOLD - be more confident)
    const requiresClarification =
      confidence[primary] < 0.4 || // Lowered from 0.6 to 0.4
      (detectedIntents.length > 1 && confidence[detectedIntents[1]] > confidence[primary] * 0.9); // Increased from 0.8 to 0.9

    return {
      primary,
      secondary,
      confidence,
      requiresClarification,
      clarificationQuestion: requiresClarification
        ? this.generateClarificationQuestion(detectedIntents)
        : undefined,
      extractedEntities: entities,
    };
  }

  /**
   * AI-FIRST DETECTION: Let AI think, reason, and understand like ChatGPT
   * This is the NEW smart approach - AI analyzes the query deeply
   */
  private async aiFirstDetection(
    message: string,
    profile?: StudentProfile,
    conversationHistory?: string[]
  ): Promise<DetectedIntent> {
    try {
      const context = conversationHistory ? conversationHistory.slice(-3).join('\n') : '';
      const profileSkills =
        profile?.profile?.technicalSkills?.map((s: any) => s.name).join(', ') || 'None';
      const department = profile?.department || 'Unknown';

      const prompt = `You are an intelligent career advisor AI. Think deeply about what the user is asking for and provide the best solution.

**USER'S PROFILE:**
- Department: ${department}
- Skills: ${profileSkills}
${context ? `\n**RECENT CONVERSATION:**\n${context}\n` : ''}
**USER'S QUERY:**
"${message}"

**YOUR TASK:**
Analyze the query deeply and determine:

1. **What is the user really asking for?** (Think beyond keywords)
   - Are they asking for project ideas?
   - Do they want job opportunities?
   - Need skill guidance?
   - Want to learn something?
   - Comparing technologies?
   - Need career advice?

2. **What domain/sector are they interested in?** (if mentioned)
   - Health/Medical/Healthcare?
   - Chemical/Pharmacy?
   - Education/E-learning?
   - E-commerce/Shopping?
   - Fintech/Banking?
   - Social Media/Networking?
   - Food/Restaurant/Delivery?
   - Travel/Hotel/Tourism?
   - Agriculture/Farming?
   - Or general/multiple domains?

3. **What technologies are mentioned?** (if any)
   - Extract: React, Vue, Node.js, Supabase, Firebase, etc.

4. **What's the best intent classification?**
   Available intents:
   - **project-ideas**: User wants project suggestions to build
   - **find-jobs**: Looking for job opportunities
   - **learning-path**: Wants courses/learning recommendations
   - **skill-gap-analysis**: Wants to know what skills to improve
   - **technology-comparison**: Comparing tech choices (X vs Y)
   - **career-guidance**: Career advice and direction
   - **interview-prep**: Interview preparation
   - **resume-review**: Resume feedback
   - **profile-improvement**: Profile enhancement
   - **certification-advice**: Certification recommendations
   - **salary-inquiry**: Salary information
   - **general**: Simple conversation

**THINK STEP BY STEP:**
- Consider the user's profile and skills
- Understand their intent (what do they really want?)
- Extract key entities (skills, domains, technologies)
- Classify with high confidence

**OUTPUT FORMAT (JSON only):**
{
  "reasoning": "[1-2 sentences explaining your understanding of the query]",
  "primary_intent": "<intent>",
  "confidence": 0.95,
  "domain_detected": "health" or null,
  "technologies_mentioned": ["react", "supabase"] or [],
  "user_goal": "[What the user wants to achieve]",
  "best_response_approach": "[How to best help them]"
}`;

      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are an intelligent reasoning AI that deeply understands user queries. Think step-by-step like a human would. Output only valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4, // Lower for more consistent reasoning
        max_tokens: 600,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

      console.log('🧠 AI Reasoning:', result.reasoning);
      console.log('🎯 Detected Intent:', result.primary_intent, `(${result.confidence * 100}%)`);
      console.log('🌍 Domain:', result.domain_detected || 'None');
      console.log('💡 User Goal:', result.user_goal);

      // Build entities from AI's understanding
      const entities: any = {};
      if (result.technologies_mentioned && result.technologies_mentioned.length > 0) {
        entities.skills = result.technologies_mentioned;
      }
      if (result.domain_detected) {
        entities.domain = result.domain_detected;
      }

      return {
        primary: result.primary_intent || 'general',
        secondary: [],
        confidence: { [result.primary_intent]: result.confidence || 0.85 } as any,
        requiresClarification: (result.confidence || 0.85) < 0.6,
        extractedEntities: entities,
        clarificationQuestion: undefined,
      };
    } catch (error) {
      console.error('AI-first detection error:', error);
      // Fallback to quick detection
      return this.quickIntentDetection(this.normalizeMessage(message));
    }
  }

  /**
   * AI-enhanced intent detection for complex queries (LEGACY - kept as fallback)
   */
  private async aiEnhancedDetection(
    message: string,
    profile?: StudentProfile,
    conversationHistory?: string[]
  ): Promise<DetectedIntent> {
    try {
      const context = conversationHistory ? conversationHistory.slice(-3).join('\n') : '';
      const profileContext = profile
        ? `Student: ${profile.department}, ${profile.profile?.technicalSkills?.length || 0} skills`
        : '';

      const prompt = `You are an advanced intent classifier for a career assistant AI. You excel at understanding student queries even when English is imperfect or phrasing is unclear.

**Context:**
${profileContext}
${context ? `Recent conversation:\n${context}` : ''}

**User Message:**
"${message}"

**Important Guidelines:**
- Understand the CORE INTENT even if grammar is poor
- Look for keywords about learning, jobs, skills, career, courses
- Consider context from student profile and conversation history
- If asking about technologies (Node.js, Django, React, etc.) → technology-comparison
- If asking "what to learn" or "suggest courses" → learning-path
- If asking "what skills needed" or "skill gaps" → skill-gap-analysis
- If asking "find jobs" or "job opportunities" → find-jobs
- If asking about career direction or "what should I do" → career-guidance

**Task:**
Classify the user's intent. Available intents:
- find-jobs: Looking for job opportunities
- skill-gap-analysis: Wants to know what skills to improve
- interview-prep: Needs interview preparation help
- resume-review: Wants resume feedback
- learning-path: Wants course/learning recommendations
- career-guidance: Seeks career advice or path guidance
- technology-comparison: Comparing technologies/frameworks (e.g., Node.js vs Django, React vs Angular)
- salary-inquiry: Asking about compensation
- company-research: Wants info about companies
- networking-advice: Seeks networking tips
- profile-improvement: Wants to improve their profile
- certification-advice: Asking about certifications
- project-ideas: Wants project suggestions to build (e.g., "what can I build with React", "project ideas for health sector", "create using Supabase")
- general: Casual conversation or simple acknowledgment

**Output Format (JSON only):**
{
  "primary": "<intent>",
  "secondary": ["<intent2>", "<intent3>"],
  "confidence": { "primary": 0.85, "secondary1": 0.5 },
  "entities": {
    "skills": ["skill1", "skill2"],
    "companies": [],
    "roles": [],
    "locations": []
  },
  "reasoning": "Brief explanation"
}`;

      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a precise intent classifier. Output only valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

      return {
        primary: result.primary || 'general',
        secondary: result.secondary || [],
        confidence: result.confidence || {},
        requiresClarification: (result.confidence?.primary || 1) < 0.6,
        extractedEntities: result.entities || {},
      };
    } catch (error) {
      console.error('AI intent detection error:', error);
      return this.quickIntentDetection(message);
    }
  }

  /**
   * Extract entities from message (skills, companies, roles, etc)
   * Enhanced to deeply understand learning goals and career aspirations
   */
  private extractEntities(message: string): {
    skills?: string[];
    companies?: string[];
    roles?: string[];
    locations?: string[];
    timeframes?: string[];
    learningGoals?: string[];
    careerGoals?: string[];
  } {
    const entities: any = {};

    // Common skills and technologies (expanded with databases and specific tools)
    const skillPatterns = [
      'react',
      'vue',
      'angular',
      'svelte',
      'node',
      'node.js',
      'nodejs',
      'django',
      'flask',
      'express',
      'fastapi',
      'python',
      'java',
      'javascript',
      'typescript',
      'go',
      'golang',
      'rust',
      'php',
      'c++',
      'c#',
      'ruby',
      'kotlin',
      'swift',
      'aws',
      'azure',
      'gcp',
      'cloud',
      'docker',
      'kubernetes',
      'sql',
      'mongodb',
      'redis',
      'postgresql',
      'mysql',
      'git',
      'ci/cd',
      'devops',
      'machine learning',
      'ml',
      'ai',
      'artificial intelligence',
      'data science',
      'deep learning',
      'spring boot',
      'laravel',
      'rails',
      'asp.net',
      'next.js',
      'nuxt',
      'gatsby',
      'vue.js',
      'react native',
      'html',
      'css',
      'sass',
      'tailwind',
      'bootstrap',
      'webpack',
      'vite',
      'graphql',
      'rest api',
      'api',
      'testing',
      'jest',
      'cypress',
      'selenium',
      'junit',
      'pytest',
      'supabase',
      'firebase',
      'prisma',
      'sequelize',
      'typeorm',
      'mongoose',
      'stripe',
      'razorpay',
      'socket.io',
      'webrtc',
      'three.js',
      'd3.js',
    ];

    const foundSkills = skillPatterns.filter((skill) => message.toLowerCase().includes(skill));
    if (foundSkills.length > 0) entities.skills = foundSkills;

    // Extract learning goals (what they want to learn)
    const learningGoalPatterns = [
      /(?:want to learn|wanna learn|learning|study|master|become expert in)\s+([\w\s.+#-]+?)(?:\s+(?:and|or|,|\.|\?|$))/gi,
      /(?:how to learn|how learn|teach me)\s+([\w\s.+#-]+?)(?:\s+(?:and|or|,|\.|\?|$))/gi,
      /(?:course for|courses on|tutorial for|guide to)\s+([\w\s.+#-]+?)(?:\s+(?:and|or|,|\.|\?|$))/gi,
    ];

    const learningGoals: string[] = [];
    learningGoalPatterns.forEach((pattern) => {
      const matches = [...message.matchAll(pattern)];
      matches.forEach((match) => {
        if (match[1]) {
          learningGoals.push(match[1].trim());
        }
      });
    });
    if (learningGoals.length > 0) entities.learningGoals = learningGoals;

    // Extract career goals
    const careerGoalPatterns = [
      /(?:become|want to be|wanna be|aspiring|aim to be)\s+(?:a\s+)?([\w\s]+?)(?:developer|engineer|analyst|designer|scientist)/gi,
      /(?:career in|job in|work in|working in)\s+([\w\s]+?)(?:\s+(?:and|or|,|\.|\?|$))/gi,
      /(?:switch to|transition to|move to)\s+([\w\s]+?)(?:\s+(?:and|or|,|\.|\?|$))/gi,
    ];

    const careerGoals: string[] = [];
    careerGoalPatterns.forEach((pattern) => {
      const matches = [...message.matchAll(pattern)];
      matches.forEach((match) => {
        if (match[1]) {
          careerGoals.push(match[1].trim());
        }
      });
    });
    if (careerGoals.length > 0) entities.careerGoals = careerGoals;

    // Common roles
    const rolePatterns = [
      'developer',
      'engineer',
      'programmer',
      'analyst',
      'designer',
      'full stack',
      'frontend',
      'backend',
      'devops',
      'data scientist',
      'ml engineer',
      'sre',
      'qa',
      'tester',
    ];

    const foundRoles = rolePatterns.filter((role) => message.toLowerCase().includes(role));
    if (foundRoles.length > 0) entities.roles = foundRoles;

    // Locations
    const locationPatterns = [
      'bangalore',
      'mumbai',
      'delhi',
      'hyderabad',
      'pune',
      'chennai',
      'remote',
    ];
    const foundLocations = locationPatterns.filter((loc) => message.toLowerCase().includes(loc));
    if (foundLocations.length > 0) entities.locations = foundLocations;

    // Timeframes
    const timePatterns = [
      /in (\d+) months?/i,
      /within (\d+) weeks?/i,
      /(\d+) days?/i,
      /next (month|week|year)/i,
    ];
    const timeframes: string[] = [];
    timePatterns.forEach((pattern) => {
      const match = message.match(pattern);
      if (match) timeframes.push(match[0]);
    });
    if (timeframes.length > 0) entities.timeframes = timeframes;

    return entities;
  }

  /**
   * Calculate similarity between keyword and message (fuzzy matching)
   */
  private calculateSimilarity(keyword: string, message: string): number {
    // Check if message contains parts of the keyword
    const keywordWords = keyword.split(' ');
    const messageWords = message.split(' ');

    let matchCount = 0;
    keywordWords.forEach((kw) => {
      if (messageWords.some((mw) => mw.includes(kw) || kw.includes(mw))) {
        matchCount++;
      }
    });

    return matchCount / keywordWords.length;
  }

  /**
   * Check if message is ambiguous (requires clarification)
   * REDUCED THRESHOLD: Only truly vague queries need clarification
   */
  private isAmbiguous(message: string): boolean {
    const msg = message.toLowerCase();

    // Very vague queries that genuinely need clarification
    const veryVague = [
      /^help$/i,
      /^help me$/i,
      /^i need help$/i,
      /^confused$/i,
      /^not sure$/i,
      /^any suggestions?$/i,
      /^what should i do?$/i,
    ];

    // If message is very short and vague
    if (veryVague.some((pattern) => pattern.test(message.trim()))) {
      return true;
    }

    // If message has meaningful content (skills, domains, actions), it's NOT ambiguous
    const hasMeaningfulContent =
      msg.includes('project') ||
      msg.includes('build') ||
      msg.includes('job') ||
      msg.includes('skill') ||
      msg.includes('learn') ||
      msg.includes('course') ||
      msg.includes('career') ||
      msg.includes('interview') ||
      msg.includes('resume') ||
      msg.includes('salary') ||
      msg.includes('certification');

    // NOT ambiguous if it has meaningful content
    return !hasMeaningfulContent && message.split(' ').length < 5;
  }

  /**
   * Generate clarification question for ambiguous intents
   */
  private generateClarificationQuestion(possibleIntents: Intent[]): string {
    if (possibleIntents.length === 0) {
      return "I'm not sure what you're looking for. Could you be more specific?";
    }

    const intentDescriptions: Record<Intent, string> = {
      'find-jobs': 'find job opportunities that match your skills',
      'skill-gap-analysis': 'analyze what skills you need to develop',
      'interview-prep': 'prepare for upcoming interviews',
      'resume-review': 'get feedback on your resume',
      'learning-path': 'get course recommendations and learning paths',
      'career-guidance': 'get career advice and guidance',
      'technology-comparison': 'compare technologies, frameworks, or languages',
      'salary-inquiry': 'learn about salary expectations',
      'company-research': "research companies you're interested in",
      'networking-advice': 'get networking tips and strategies',
      'profile-improvement': 'improve your profile',
      'certification-advice': 'get advice on certifications',
      'project-ideas': 'get project ideas to build using your skills',
      general: 'have a general conversation',
    };

    const options = possibleIntents
      .slice(0, 3)
      .map((intent, idx) => `${idx + 1}. ${intentDescriptions[intent]}`)
      .join('\n');

    return `I can help you with multiple things. Did you want to:\n\n${options}\n\nOr something else?`;
  }

  /**
   * Determine if intent requires immediate profile data
   */
  requiresProfileData(intent: Intent): boolean {
    return [
      'find-jobs',
      'skill-gap-analysis',
      'learning-path',
      'career-guidance',
      'profile-improvement',
    ].includes(intent);
  }

  /**
   * Determine if intent requires market data
   */
  requiresMarketData(intent: Intent): boolean {
    return ['find-jobs', 'skill-gap-analysis', 'salary-inquiry', 'learning-path'].includes(intent);
  }

  /**
   * Get suggested follow-up questions based on intent
   */
  getSuggestedFollowUps(intent: Intent, context?: any): string[] {
    // @ts-expect-error - Auto-suppressed for migration
    const followUps: Record<Intent, string[]> = {
      'find-jobs': [
        'Show me jobs in [specific location]',
        'What skills do I need for these jobs?',
        'How can I improve my job match score?',
      ],
      'skill-gap-analysis': [
        'What courses should I take?',
        'How long will it take to learn these skills?',
        'Show me jobs after I learn these skills',
      ],
      'learning-path': [
        'Suggest free courses',
        'Create a 3-month learning roadmap',
        'What skills are most in-demand?',
      ],
      'career-guidance': [
        'What career paths are available to me?',
        'How do I switch to [specific field]?',
        "What's the average timeline for career growth?",
      ],
      'interview-prep': [
        'Generate technical interview questions',
        'Help me prepare for behavioral interviews',
        'What should I know about [company]?',
      ],
      'resume-review': [
        'How can I improve my resume?',
        'Tailor my resume for [specific job]',
        'What keywords should I add?',
      ],
      'technology-comparison': [
        'Compare [tech1] and [tech2] for my career goals',
        'What are the job prospects for each?',
        'Which technology should I focus on?',
      ],
      'salary-inquiry': [
        'What salary can I expect as a fresher?',
        'How can I maximize my salary offer?',
        "What's the salary range for [specific role]?",
      ],
      'company-research': [
        'Tell me about [company name]',
        "What's the interview process at [company]?",
        'Company culture at [company]',
      ],
      'networking-advice': [
        'How do I build my professional network?',
        'LinkedIn profile optimization tips',
        'How to get referrals?',
      ],
      'profile-improvement': [
        "What's missing from my profile?",
        'How can I boost my profile score?',
        'Analyze my career readiness',
      ],
      'certification-advice': [
        'Which certifications are most valuable?',
        'AWS vs Azure certification',
        'Is [certification] worth it?',
      ],
      general: ['Find me job opportunities', 'Suggest courses to learn', 'Analyze my profile'],
    };

    return followUps[intent] || followUps['general'];
  }
}

export const intentDetectionService = new IntentDetectionService();
export default intentDetectionService;
