/**
 * 🧠 SMART QUERY ANALYZER
 * 
 * Uses AI to deeply understand what the user is REALLY asking for:
 * - Technical explanations ("Explain Supabase")
 * - How-to questions ("How do I deploy?")
 * - Comparisons ("React vs Vue")
 * - Conceptual understanding ("What is microservices?")
 * - Career guidance ("What should I learn?")
 * - Problem solving ("I'm stuck on...")
 * 
 * This ensures the AI responds appropriately to ANY query in ANY domain.
 */

import { getOpenAIClient, DEFAULT_MODEL } from './openAIClient';

export type QueryType =
  | 'technical-explanation'    // "Explain X", "What is X" (tech)
  | 'general-knowledge'        // "How trees grow", "What is gravity" (non-tech)
  | 'how-to-guide'             // "How do I...", "How to..."
  | 'comparison'               // "X vs Y", "Difference between"
  | 'troubleshooting'          // "Error", "Not working", "Stuck"
  | 'best-practices'           // "Best way to...", "Should I..."
  | 'learning-guidance'        // "What should I learn", "Courses for"
  | 'job-search'               // "Find jobs", "Show internships", "List openings"
  | 'career-advice'            // "Career path", "Salary info", "Career growth"
  | 'profile-improvement'      // "Improve my profile", "Better matches", "Profile tips"
  | 'code-help'                // Code review, debugging (with code)
  | 'project-ideas'            // "Project suggestions", "What to build"
  | 'general-chat';            // Casual conversation, greetings

export interface SmartQueryAnalysis {
  queryType: QueryType;
  confidence: number;
  
  // What user wants
  userIntent: {
    primaryGoal: string;
    isLookingFor: string;
    expectedResponseType: 'explanation' | 'guidance' | 'solution' | 'comparison' | 'recommendations';
  };
  
  // Topic analysis
  topic: {
    mainSubject: string;
    domain: string; // technology, career, education, etc.
    specificTechnologies: string[];
    isAboutLearning: boolean;
    isAboutCareer: boolean;
  };
  
  // Response strategy
  responseNeeds: {
    shouldExplainConcept: boolean;
    shouldProvideExample: boolean;
    shouldShowCode: boolean;
    shouldCompare: boolean;
    shouldGiveCareerAdvice: boolean;
    shouldSuggestResources: boolean;
    shouldProvideSteps: boolean;
  };
  
  // Reasoning
  aiReasoning: string;
}

class SmartQueryAnalyzer {
  
  /**
   * 🧠 Analyze Query with AI Intelligence
   * Deeply understands what user is asking for and how to respond
   */
  async analyzeQuery(
    query: string,
    studentContext?: {
      skills: string[];
      recentActivity: string;
    }
  ): Promise<SmartQueryAnalysis> {
    
    try {
      console.log('🧠 Smart Analyzer: Deep analysis of query...');
      
      const prompt = this.buildAnalysisPrompt(query, studentContext);
      
      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an intelligent query analyzer for a CAREER/STUDENT PLATFORM.

**IMPORTANT CONTEXT:**
- This is a career assistance platform for students/professionals
- Users have career profiles (skills, projects, education)
- "Profile" = career/student profile (NOT dating profile!)
- "Matches" = job matches (NOT dating matches!)
- When users say "improve my profile", they mean career profile

Your job is to determine:
1. What TYPE of query is this? (explanation, how-to, career advice, etc.)
2. What does the user ACTUALLY want as a response?
3. How should the AI respond to be most helpful?

Be smart. If someone asks "Explain Supabase", they want a technical explanation, NOT career advice.
If someone asks "improve my profile", they want career profile tips, NOT dating advice.
Understand the difference and classify accurately.`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      });
      
      const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
      
      console.log('🎯 Query Type:', result.queryType);
      console.log('💡 User Wants:', result.userIntent?.primaryGoal);
      console.log('🧠 AI Reasoning:', result.aiReasoning);
      
      return this.parseAnalysisResult(result);
      
    } catch (error) {
      console.error('Query analysis error:', error);
      return this.getFallbackAnalysis(query);
    }
  }
  
  /**
   * Build comprehensive analysis prompt
   */
  private buildAnalysisPrompt(query: string, studentContext?: any): string {
    return `Analyze this user query and determine what they REALLY want:

**USER QUERY:**
"${query}"

${studentContext ? `**USER CONTEXT:**
- Skills: ${studentContext.skills?.join(', ') || 'Unknown'}
- Recent Activity: ${studentContext.recentActivity || 'Unknown'}
` : ''}

**YOUR ANALYSIS TASK:**

1️⃣ **QUERY TYPE CLASSIFICATION** (Pick ONE):

   - **technical-explanation**: User wants to UNDERSTAND a TECHNOLOGY/TOOL
     Examples: "Explain Supabase", "What is Docker", "How does JWT work"
     Domain: technology
     
   - **general-knowledge**: User wants to understand NON-TECH topics (science, nature, history, etc.)
     Examples: "How trees grow", "What is photosynthesis", "Explain gravity"
     Domain: science, nature, general, etc. (NOT technology!)
     
   - **how-to-guide**: User wants STEP-BY-STEP instructions
     Examples: "How do I deploy", "How to setup React", "Steps to..."
     
   - **comparison**: User wants to COMPARE two or more things
     Examples: "React vs Vue", "Supabase vs Firebase", "Which is better"
     
   - **troubleshooting**: User has a PROBLEM/ERROR to fix
     Examples: "Getting error X", "Not working", "Stuck on Y"
     
   - **best-practices**: User wants RECOMMENDATIONS on approach
     Examples: "Best way to...", "Should I use X or Y", "Good practice for"
     
   - **learning-guidance**: User wants to know WHAT/HOW to learn FOR CAREER
     Examples: "What should I learn", "Courses for X", "Learning path for job"
     Domain: career, education
     
   - **job-search**: User wants to FIND/LIST actual JOBS or INTERNSHIPS
     Examples: "Find React jobs", "Show internships in Bangalore", "List developer positions"
     Keywords: find, show, list, search for (jobs/internships/positions/openings)
     Domain: career
     
   - **career-advice**: User wants GENERAL career guidance (NOT specific job listings)
     Examples: "Career path", "Salary info", "How to advance career", "Job market trends"
     Domain: career
     
   - **profile-improvement**: User wants to improve their CAREER/STUDENT PROFILE
     Examples: "How to improve my profile", "Get better matches", "Profile tips", "Boost my profile"
     Keywords: improve profile, better matches, profile score, complete profile
     Domain: career
     Context: This is a CAREER platform - "profile" = career profile, "matches" = job matches
     
   - **code-help**: User wants CODE REVIEW or debugging (usually has code blocks)
     Examples: "Review my code", "Debug this", "Is this correct"
     
   - **project-ideas**: User wants PROJECT SUGGESTIONS
     Examples: "What to build", "Project ideas", "Suggest projects"
     
   - **general-chat**: Casual conversation, greeting, thanks
     Examples: "Hi", "Thank you", "Okay"

2️⃣ **USER INTENT** - What do they ACTUALLY want?
   - primaryGoal: What's their main goal? (1 sentence)
   - isLookingFor: What specific information/help? (1 sentence)
   - expectedResponseType: explanation | guidance | solution | comparison | recommendations

3️⃣ **TOPIC ANALYSIS** - What's the query about?
   - mainSubject: The main topic (e.g., "Supabase database" or "Tree growth")
   - domain: technology | career | education | science | nature | health | general | other
   - specificTechnologies: Array of technologies mentioned (empty if not tech-related)
   - isAboutLearning: true/false (is this about learning something?)
   - isAboutCareer: true/false (is this about career/jobs?)

4️⃣ **RESPONSE NEEDS** - How should AI respond?
   - shouldExplainConcept: true if needs conceptual explanation
   - shouldProvideExample: true if example would help
   - shouldShowCode: true if code example needed
   - shouldCompare: true if comparing options
   - shouldGiveCareerAdvice: true if career-related
   - shouldSuggestResources: true if should recommend courses/articles
   - shouldProvideSteps: true if step-by-step guide needed

5️⃣ **AI REASONING** - Explain your classification
   - Why did you choose this query type?
   - What clues in the query led to this?

**CRITICAL RULES:**
- **CONTEXT MATTERS**: This is a CAREER PLATFORM
  - "profile" = career/student profile (NOT dating!)
  - "matches" = job matches (NOT dating!)
- "Explain X" → Check if X is TECH (Supabase, React) or NON-TECH (trees, gravity)
  - If TECH → technical-explanation
  - If NON-TECH → general-knowledge
- "How do I X" → how-to-guide
- "X vs Y" → comparison
- "What should I learn" → learning-guidance (only if career-focused!)
- "Find jobs", "Show internships", "List positions" → job-search (NOT career-advice!)
- "Improve my profile", "Better matches", "Profile tips" → profile-improvement (NOT how-to-guide!)
- "Career path", "Salary", "Career advice" → career-advice
- **IMPORTANT**: 
  - job-search = wants ACTUAL job listings | career-advice = wants GENERAL guidance
  - profile-improvement = wants to improve CAREER profile | how-to-guide = wants technical steps
- Be SMART. Don't return career advice for biology/science questions!
- If domain is NOT technology/career → general-knowledge
- Users in a career platform may still ask random questions → answer them correctly!

**OUTPUT FORMAT (JSON):**
{
  "queryType": "technical-explanation",
  "confidence": 0.95,
  "userIntent": {
    "primaryGoal": "Understand what Supabase database is",
    "isLookingFor": "Technical explanation of Supabase features and use cases",
    "expectedResponseType": "explanation"
  },
  "topic": {
    "mainSubject": "Supabase database",
    "domain": "technology",
    "specificTechnologies": ["Supabase", "PostgreSQL"],
    "isAboutLearning": false,
    "isAboutCareer": false
  },
  "responseNeeds": {
    "shouldExplainConcept": true,
    "shouldProvideExample": true,
    "shouldShowCode": true,
    "shouldCompare": false,
    "shouldGiveCareerAdvice": false,
    "shouldSuggestResources": false,
    "shouldProvideSteps": false
  },
  "aiReasoning": "User used 'Explain' keyword with a specific technology (Supabase). This is clearly asking for a technical explanation of what Supabase is, not career advice. They want to understand the technology itself."
}`;
  }
  
  /**
   * Parse AI analysis result
   */
  private parseAnalysisResult(result: any): SmartQueryAnalysis {
    return {
      queryType: result.queryType || 'general-chat',
      confidence: result.confidence || 0.8,
      userIntent: result.userIntent || {
        primaryGoal: 'Get assistance',
        isLookingFor: 'Help with query',
        expectedResponseType: 'explanation'
      },
      topic: result.topic || {
        mainSubject: 'Unknown',
        domain: 'general',
        specificTechnologies: [],
        isAboutLearning: false,
        isAboutCareer: false
      },
      responseNeeds: result.responseNeeds || {
        shouldExplainConcept: true,
        shouldProvideExample: false,
        shouldShowCode: false,
        shouldCompare: false,
        shouldGiveCareerAdvice: false,
        shouldSuggestResources: false,
        shouldProvideSteps: false
      },
      aiReasoning: result.aiReasoning || 'Default analysis'
    };
  }
  
  /**
   * Fallback analysis if AI fails
   */
  private getFallbackAnalysis(query: string): SmartQueryAnalysis {
    const lowerQuery = query.toLowerCase();
    
    // Quick pattern matching as fallback
    let queryType: QueryType = 'general-knowledge';
    
    // Check for tech keywords
    const techKeywords = /(react|vue|angular|node|python|java|javascript|typescript|supabase|firebase|docker|kubernetes|aws|api|database|sql)/i;
    const hasTechKeyword = techKeywords.test(lowerQuery);
    
    if (/(explain|what is|what are|tell me about)/i.test(lowerQuery)) {
      // If has tech keywords, it's technical-explanation, otherwise general-knowledge
      queryType = hasTechKeyword ? 'technical-explanation' : 'general-knowledge';
    } else if (/(how (do|to)|steps to|guide)/i.test(lowerQuery)) {
      queryType = hasTechKeyword ? 'how-to-guide' : 'general-knowledge';
    } else if (/(vs|versus|or|difference between|compare)/i.test(lowerQuery)) {
      queryType = 'comparison';
    } else if (/(error|not working|stuck|problem|issue)/i.test(lowerQuery)) {
      queryType = 'troubleshooting';
    } else if (/(should i|best way|good practice)/i.test(lowerQuery)) {
      queryType = 'best-practices';
    } else if (/(learn|course|tutorial|study)/i.test(lowerQuery)) {
      queryType = 'learning-guidance';
    } else if (/(find|show|list|search).*(job|internship|position|opening|opportunity)/i.test(lowerQuery)) {
      // User wants to FIND/LIST actual jobs
      queryType = 'job-search';
    } else if (/(career|salary|hire|job market|career path|career advice)/i.test(lowerQuery)) {
      // General career guidance
      queryType = 'career-advice';
    } else if (/(project|build|create)/i.test(lowerQuery)) {
      queryType = 'project-ideas';
    }
    
    return {
      queryType,
      confidence: 0.6,
      userIntent: {
        primaryGoal: 'Get assistance',
        isLookingFor: 'Help with query',
        expectedResponseType: 'explanation'
      },
      topic: {
        mainSubject: 'Query topic',
        domain: 'general',
        specificTechnologies: [],
        isAboutLearning: queryType === 'learning-guidance',
        isAboutCareer: queryType === 'career-advice'
      },
      responseNeeds: {
        shouldExplainConcept: true,
        shouldProvideExample: false,
        shouldShowCode: false,
        shouldCompare: queryType === 'comparison',
        shouldGiveCareerAdvice: queryType === 'career-advice',
        shouldSuggestResources: queryType === 'learning-guidance',
        shouldProvideSteps: queryType === 'how-to-guide'
      },
      aiReasoning: 'Fallback pattern matching'
    };
  }
}

export default new SmartQueryAnalyzer();
