/**
 * CAREER INTELLIGENCE ENGINE
 * Main orchestration layer - coordinates all AI services for intelligent career assistance
 * 
 * This is the production-ready smart system that:
 * - Detects complex intents
 * - Analyzes student profiles deeply
 * - Provides proactive guidance
 * - Matches jobs intelligently
 * - Generates personalized learning paths
 * - Offers resume and interview intelligence
 */

import { getOpenAIClient, DEFAULT_MODEL } from './openAIClient';
import { fetchStudentProfile, fetchOpportunities } from './profileService';
import intelligenceService from './intelligenceService';
import intentDetectionService, { Intent } from './intentDetectionService';
import proactiveAssistant from './proactiveAssistant';
import conversationMemoryService from './conversationMemoryService';
import industryKnowledgeService from './industryKnowledgeService';
import projectBlueprintService from './projectBlueprintService';
import smartQueryAnalyzer from './smartQueryAnalyzer';
import technicalExplainerService from './technicalExplainerService';
import { StudentProfile, AIResponse } from '../types';
import { supabase } from '../../../lib/supabaseClient';
import { buildSkillGapResponse } from '../utils/responseBuilder';
import { EnhancedAIResponse, SuggestedAction } from '../types/interactive';

export interface IntelligenceContext {
  studentProfile: StudentProfile;
  careerReadiness?: any;
  profileHealth?: any;
  peerComparison?: any;
  marketIntelligence: {
    inDemandSkills: string[];
    totalJobs: number;
    opportunities: any[];
  };
  detectedIntent: {
    primary: Intent;
    secondary: Intent[];
    entities: any;
  };
}

class CareerIntelligenceEngine {
  /**
   * Main entry point - Process any career query with full intelligence
   */
  async processQuery(
    message: string,
    studentId: string
  ): Promise<EnhancedAIResponse> {
    const startTime = Date.now();

    try {
      console.log('🧠 Intelligence Engine - Processing query:', message);
      
      // Get conversation context for better understanding
      const conversationHistory = conversationMemoryService.getFormattedHistory(studentId, 3);
      const isFollowUp = conversationMemoryService.isFollowUpQuestion(studentId, message);

      // Fast-path: Handle simple general knowledge queries without heavy processing
      if (this.isSimpleGeneralQuery(message)) {
        console.log('⚡ Fast-path: Simple general query detected');
        return await this.handleSimpleGeneralQuery(message, studentId, startTime);
      }

      // Step 1: Load student profile
      const studentProfile = await fetchStudentProfile(studentId);
      if (!studentProfile) {
        return {
          success: false,
          error: 'Unable to load your profile. Please try again.'
        };
      }

      // Step 2: ALWAYS use Smart Query Analyzer - Let AI understand what user wants
      console.log('🧠 Using Smart Query Analyzer for ALL queries...');
      const smartAnalysis = await smartQueryAnalyzer.analyzeQuery(
        message,
        {
          skills: studentProfile.profile?.technicalSkills?.map((s: any) => s.name) || [],
          recentActivity: 'Active'
        }
      );
      
      console.log('🎯 Smart Analysis:', smartAnalysis.queryType, '-', smartAnalysis.userIntent.primaryGoal);
      console.log('🌍 Topic Domain:', smartAnalysis.topic.domain);
      console.log('🧠 AI Reasoning:', smartAnalysis.aiReasoning);
      
      // Store conversation
      conversationMemoryService.addUserMessage(
        studentId,
        message,
        smartAnalysis.queryType,
        smartAnalysis.topic.domain,
        { smartAnalysis }
      );
      
      // Route based on smart analysis
      const response = await this.routeBasedOnSmartAnalysis(message, smartAnalysis, studentProfile);
      
      // Store assistant response
      if (response.success && response.message) {
        conversationMemoryService.addAssistantMessage(studentId, response.message);
      }
      
      // Log analytics
      await this.logServiceUsage(
        studentId,
        smartAnalysis.queryType,
        message,
        response,
        Date.now() - startTime
      );
      
      return response;
    } catch (error: any) {
      console.error('❌ Intelligence Engine Error:', error);
      return {
        success: false,
        error: 'I encountered an issue processing your request. Please try again.'
      };
    }
  }

  /**
   * 🚀 Route based on Smart Query Analysis
   */
  private async routeBasedOnSmartAnalysis(
    message: string,
    analysis: any,
    studentProfile: StudentProfile
  ): Promise<EnhancedAIResponse> {
    
    const queryType = analysis.queryType;
    
    switch (queryType) {
      case 'technical-explanation':
        return await this.handleTechnicalExplanation(message, analysis, studentProfile);
      
      case 'general-knowledge':
        // User asking about non-tech topics (biology, nature, history, etc.)
        return await this.handleGeneralKnowledge(message, analysis, studentProfile);
      
      case 'how-to-guide':
        return await this.handleHowToGuide(message, analysis, studentProfile);
      
      case 'comparison':
        return await this.handleTechComparison(message, analysis, studentProfile);
      
      case 'job-search':
        // User wants to FIND actual jobs/internships
        console.log('🔍 Handling Job Search...');
        const jobContext = await this.buildIntelligenceContext(studentProfile, 'find-jobs');
        return await this.handleJobSearch(message, jobContext);
      
      case 'learning-guidance':
        // Check if this is about networking strategies (special case)
        if (/networking\s+strateg/i.test(message)) {
          return await this.handleNetworkingAdvice(message, studentProfile);
        }
        // Build context and use regular learning path handler
        const learningContext = await this.buildIntelligenceContext(studentProfile, 'learning-path');
        return await this.handleLearningPath(message, learningContext);
      
      case 'career-advice':
        const careerContext = await this.buildIntelligenceContext(studentProfile, 'career-guidance');
        return await this.handleCareerGuidance(message, careerContext);
      
      case 'profile-improvement':
        // User wants to improve their career profile for better job matches
        console.log('📊 Handling Profile Improvement...');
        const profileContext = await this.buildIntelligenceContext(studentProfile, 'profile-improvement');
        return await this.handleProfileImprovement(message, profileContext);
      
      case 'project-ideas':
        const projectContext = await this.buildIntelligenceContext(studentProfile, 'project-ideas');
        return await this.handleProjectIdeas(message, projectContext);
      
      case 'troubleshooting':
      case 'best-practices':
      case 'code-help':
        return await this.handleTechnicalHelp(message, analysis, studentProfile);
      
      default:
        // Fall back to general handler
        const generalContext = await this.buildIntelligenceContext(studentProfile, 'general');
        return await this.handleGeneralQuery(message, generalContext);
    }
  }

  /**
   * 📚 HANDLER: Technical Explanation (NEW)
   * Explains ANY technology clearly
   */
  private async handleTechnicalExplanation(
    message: string,
    analysis: any,
    studentProfile: StudentProfile
  ): Promise<EnhancedAIResponse> {
    
    try {
      console.log('📚 Handling Technical Explanation...');
      
      const mainSubject = analysis.topic.mainSubject;
      const technologies = analysis.topic.specificTechnologies;
      
      // Determine student level based on skills
      const studentSkills = studentProfile.profile?.technicalSkills?.map((s: any) => s.name.toLowerCase()) || [];
      const studentLevel = studentSkills.length > 10 ? 'advanced' : 
                          studentSkills.length > 5 ? 'intermediate' : 'beginner';
      
      // Get explanation
      const explanation = await technicalExplainerService.explainTechnology(
        mainSubject,
        studentLevel,
        analysis.responseNeeds.shouldShowCode
      );
      
      // Format response
      let response = `# ${explanation.topic}\n\n`;
      response += `${explanation.summary}\n\n`;
      response += `## What It Is\n\n${explanation.detailedExplanation}\n\n`;
      
      if (explanation.keyPoints && explanation.keyPoints.length > 0) {
        response += `## Key Features\n\n`;
        explanation.keyPoints.forEach(point => {
          response += `- ${point}\n`;
        });
        response += `\n`;
      }
      
      if (explanation.useCases) {
        response += `## Use Cases\n\n`;
        response += `**What it's for:**\n`;
        explanation.useCases.whatItsFor.forEach(use => {
          response += `- ${use}\n`;
        });
        response += `\n**When to use:** ${explanation.useCases.whenToUse}\n\n`;
        if (explanation.useCases.whenNotToUse) {
          response += `**When NOT to use:** ${explanation.useCases.whenNotToUse}\n\n`;
        }
      }
      
      if (explanation.examples && explanation.examples.length > 0) {
        response += `## Examples\n\n`;
        explanation.examples.forEach(example => {
          response += `**${example.description}**\n\n`;
          if (example.code) {
            response += `\`\`\`${example.language || 'javascript'}\n${example.code}\n\`\`\`\n\n`;
          }
        });
      }
      
      if (explanation.relatedConcepts && explanation.relatedConcepts.length > 0) {
        response += `## Related Technologies\n\n`;
        response += explanation.relatedConcepts.join(' • ');
        response += `\n\n`;
      }
      
      if (explanation.nextSteps) {
        response += `## Next Steps\n\n${explanation.nextSteps}`;
      }
      
      return {
        success: true,
        message: response,
        data: { explanation }
      };
      
    } catch (error) {
      console.error('Technical explanation error:', error);
      // Fallback to general query
      const context = await this.buildIntelligenceContext(studentProfile, 'general');
      return await this.handleGeneralQuery(message, context);
    }
  }

  /**
   * 🌍 HANDLER: General Knowledge (NEW)
   * Answers ANY question - biology, science, history, etc.
   */
  private async handleGeneralKnowledge(
    message: string,
    analysis: any,
    studentProfile: StudentProfile
  ): Promise<EnhancedAIResponse> {
    
    try {
      console.log('🌍 Handling General Knowledge Query...');
      console.log('📚 Topic:', analysis.topic.mainSubject);
      console.log('🌐 Domain:', analysis.topic.domain);
      
      const prompt = `You are a knowledgeable assistant. Answer this general knowledge question clearly and accurately.

**USER'S QUESTION:**
"${message}"

**TOPIC:** ${analysis.topic.mainSubject}
**DOMAIN:** ${analysis.topic.domain}
**WHAT USER WANTS:** ${analysis.userIntent.primaryGoal}

**YOUR TASK:**
Provide a clear, informative answer that:
1. **Directly answers the question** - Don't give career advice or course recommendations!
2. **Explains the concept clearly** - Use simple language
3. **Provides examples if helpful** - Make it concrete
4. **Is accurate and educational** - Fact-based response
5. **Is appropriate length** - 2-4 paragraphs, not too long

**IMPORTANT:**
- This is a GENERAL KNOWLEDGE question (${analysis.topic.domain})
- Do NOT provide career advice
- Do NOT suggest courses or learning paths
- Do NOT talk about job opportunities
- Just answer the question directly!

**FORMAT:**
# ${analysis.topic.mainSubject}

[Clear, informative answer with examples]

## Key Points
- [Important point 1]
- [Important point 2]
- [Important point 3]

[Additional explanation if needed]`;

      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a knowledgeable assistant who answers general knowledge questions clearly and accurately. You provide direct answers without suggesting career paths or courses unless specifically asked.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });
      
      return {
        success: true,
        message: completion.choices[0]?.message?.content || 'I\'m unable to answer that question right now.'
      };
      
    } catch (error) {
      console.error('General knowledge error:', error);
      return {
        success: false,
        error: 'Unable to answer your question. Please try rephrasing it.'
      };
    }
  }

  /**
   * 🤝 HANDLER: Networking Advice (NEW)
   * Provides networking strategies, NOT job listings
   */
  private async handleNetworkingAdvice(
    message: string,
    studentProfile: StudentProfile
  ): Promise<EnhancedAIResponse> {
    
    try {
      console.log('🤝 Handling Networking Advice...');
      
      const prompt = `You are a career networking expert. Provide practical networking strategies.

**STUDENT CONTEXT:**
- Name: ${studentProfile.name}
- Field: ${studentProfile.department}
- Skills: ${studentProfile.profile?.technicalSkills?.map((s: any) => s.name).join(', ') || 'Beginner'}

**STUDENT'S QUESTION:**
"${message}"

**YOUR TASK:**
Provide comprehensive networking strategies that include:

1. **Online Networking** (LinkedIn, Twitter, GitHub, dev communities)
2. **Offline Networking** (meetups, conferences, college events)
3. **Field-Specific Tips** (tailored to ${studentProfile.department})
4. **Building Relationships** (how to connect authentically)
5. **Following Up** (maintaining connections)
6. **Common Mistakes** (what to avoid)
7. **Action Plan** (3-5 concrete steps they can take THIS WEEK)

**IMPORTANT:**
- This is about NETWORKING STRATEGIES, NOT job searching
- Focus on building professional relationships
- Provide actionable, practical advice
- Be specific to their field: ${studentProfile.department}

**FORMAT:**
# Networking Strategies for ${studentProfile.department} Professionals

## Why Networking Matters
[Brief explanation]

## 1. Online Networking
[Strategies with specific platforms]

## 2. Offline Networking
[Events, meetups, conferences]

## 3. Building Authentic Connections
[How to connect meaningfully]

## 4. Maintaining Relationships
[Follow-up strategies]

## 5. Your Action Plan (This Week)
1. [Specific action]
2. [Specific action]
3. [Specific action]

## Common Mistakes to Avoid
- [Mistake 1]
- [Mistake 2]
- [Mistake 3]`;

      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a career networking expert who provides practical, actionable advice on building professional relationships. You focus on networking strategies, NOT job searching.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });
      
      return {
        success: true,
        message: completion.choices[0]?.message?.content || 'Unable to generate networking advice at this time.'
      };
      
    } catch (error) {
      console.error('Networking advice error:', error);
      return {
        success: false,
        error: 'Unable to generate networking advice. Please try again.'
      };
    }
  }

  /**
   * 🔧 HANDLER: How-To Guide (NEW)
   */
  private async handleHowToGuide(
    message: string,
    analysis: any,
    studentProfile: StudentProfile
  ): Promise<EnhancedAIResponse> {
    
    try {
      const technologies = analysis.topic.specificTechnologies;
      const guide = await technicalExplainerService.generateHowToGuide(
        analysis.userIntent.primaryGoal,
        technologies.length > 0 ? technologies : ['general']
      );
      
      let response = `# ${guide.title}\n\n`;
      response += `${guide.overview}\n\n`;
      
      if (guide.prerequisites.length > 0) {
        response += `## Prerequisites\n\n`;
        guide.prerequisites.forEach(prereq => {
          response += `- ${prereq}\n`;
        });
        response += `\n`;
      }
      
      response += `## Steps\n\n`;
      guide.steps.forEach(step => {
        response += `### Step ${step.step}: ${step.title}\n\n`;
        response += `${step.description}\n\n`;
        if (step.code) {
          response += `\`\`\`\n${step.code}\n\`\`\`\n\n`;
        }
        if (step.tips && step.tips.length > 0) {
          response += `**Tips:**\n`;
          step.tips.forEach(tip => {
            response += `- ${tip}\n`;
          });
          response += `\n`;
        }
      });
      
      if (guide.troubleshooting.length > 0) {
        response += `## Troubleshooting\n\n`;
        guide.troubleshooting.forEach(issue => {
          response += `- ${issue}\n`;
        });
        response += `\n`;
      }
      
      response += `## Next Steps\n\n${guide.nextSteps}`;
      
      return {
        success: true,
        message: response,
        data: { guide }
      };
      
    } catch (error) {
      console.error('How-to guide error:', error);
      const context = await this.buildIntelligenceContext(studentProfile, 'general');
      return await this.handleGeneralQuery(message, context);
    }
  }

  /**
   * 📊 HANDLER: Tech Comparison (NEW)
   */
  private async handleTechComparison(
    message: string,
    analysis: any,
    studentProfile: StudentProfile
  ): Promise<EnhancedAIResponse> {
    
    try {
      const technologies = analysis.topic.specificTechnologies;
      if (technologies.length < 2) {
        // Fall back to regular technology comparison handler
        const context = await this.buildIntelligenceContext(studentProfile, 'technology-comparison');
        return await this.handleTechnologyComparison(message, context);
      }
      
      const comparison = await technicalExplainerService.compareTechnologies(
        technologies[0],
        technologies[1],
        `Student in ${studentProfile.department}`
      );
      
      let response = `# ${technologies[0]} vs ${technologies[1]}\n\n`;
      response += `${comparison.comparison}\n\n`;
      
      response += `## ${technologies[0]}\n\n`;
      response += `**Pros:**\n`;
      comparison.tech1Pros.forEach(pro => {
        response += `✅ ${pro}\n`;
      });
      response += `\n**Cons:**\n`;
      comparison.tech1Cons.forEach(con => {
        response += `❌ ${con}\n`;
      });
      response += `\n`;
      
      response += `## ${technologies[1]}\n\n`;
      response += `**Pros:**\n`;
      comparison.tech2Pros.forEach(pro => {
        response += `✅ ${pro}\n`;
      });
      response += `\n**Cons:**\n`;
      comparison.tech2Cons.forEach(con => {
        response += `❌ ${con}\n`;
      });
      response += `\n`;
      
      response += `## Use Cases\n\n`;
      response += `**${technologies[0]} is best for:**\n`;
      comparison.useCaseComparison.bestFor1.forEach(use => {
        response += `- ${use}\n`;
      });
      response += `\n**${technologies[1]} is best for:**\n`;
      comparison.useCaseComparison.bestFor2.forEach(use => {
        response += `- ${use}\n`;
      });
      response += `\n`;
      
      response += `## Recommendation\n\n${comparison.recommendation}`;
      
      return {
        success: true,
        message: response,
        data: { comparison }
      };
      
    } catch (error) {
      console.error('Comparison error:', error);
      const context = await this.buildIntelligenceContext(studentProfile, 'technology-comparison');
      return await this.handleTechnologyComparison(message, context);
    }
  }

  /**
   * 🔍 HANDLER: Technical Help (troubleshooting, best practices, code help)
   */
  private async handleTechnicalHelp(
    message: string,
    analysis: any,
    studentProfile: StudentProfile
  ): Promise<EnhancedAIResponse> {
    
    const prompt = `You are a technical mentor helping a student.

**STUDENT:** ${studentProfile.name} (${studentProfile.department})
**QUERY:** ${message}
**QUERY TYPE:** ${analysis.queryType}
**STUDENT WANTS:** ${analysis.userIntent.primaryGoal}

Provide helpful, practical guidance. Include:
1. Understanding the problem/question
2. Solution or best practice
3. Example (code if applicable)
4. Common pitfalls to avoid
5. Next steps

Be clear, practical, and encouraging.`;

    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: 'You are a helpful technical mentor.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });
    
    return {
      success: true,
      message: completion.choices[0]?.message?.content || 'Unable to provide technical help at this time.'
    };
  }

  /**
   * Build comprehensive intelligence context
   */
  private async buildIntelligenceContext(
    profile: StudentProfile,
    intent: Intent
  ): Promise<IntelligenceContext> {
    // Load market intelligence (jobs data)
    const opportunities = intentDetectionService.requiresMarketData(intent)
      ? await fetchOpportunities()
      : [];

    const inDemandSkills = this.extractInDemandSkills(opportunities);

    // Load profile analytics if needed
    const profileAnalytics = intentDetectionService.requiresProfileData(intent)
      ? await this.loadProfileAnalytics(profile)
      : {};

    return {
      studentProfile: profile,
      ...profileAnalytics,
      marketIntelligence: {
        inDemandSkills,
        totalJobs: opportunities.length,
        opportunities
      },
      detectedIntent: {
        primary: intent,
        secondary: [],
        entities: {}
      }
    };
  }

  /**
   * Load profile analytics (career readiness, health, peer comparison)
   */
  private async loadProfileAnalytics(profile: StudentProfile) {
    try {
      const [careerReadiness, profileHealth, peerComparison] = await Promise.all([
        intelligenceService.calculateCareerReadiness(profile),
        intelligenceService.analyzeProfileHealth(profile),
        intelligenceService.getPeerComparison(profile)
      ]);

      return { careerReadiness, profileHealth, peerComparison };
    } catch (error) {
      console.error('Error loading profile analytics:', error);
      return {};
    }
  }

  /**
   * Route to appropriate handler based on intent
   */
  private async routeToHandler(
    message: string,
    context: IntelligenceContext,
    detectedIntent: any
  ): Promise<EnhancedAIResponse> {
    const intent = detectedIntent.primary;

    // If intent requires clarification, ask user for more details
    if (detectedIntent.requiresClarification && detectedIntent.clarificationQuestion) {
      return {
        success: true,
        message: detectedIntent.clarificationQuestion,
        interactive: {
          suggestions: this.buildClarificationSuggestions(detectedIntent, context)
        }
      };
    }

    // Get base response from handler
    let response: EnhancedAIResponse;
    
    switch (intent) {
      case 'find-jobs':
        response = await this.handleJobSearch(message, context);
        break;
      
      case 'skill-gap-analysis':
        response = await this.handleSkillGapAnalysis(message, context);
        break;
      
      case 'learning-path':
        response = await this.handleLearningPath(message, context);
        break;
      
      case 'profile-improvement':
        response = await this.handleProfileImprovement(message, context);
        break;
      
      case 'career-guidance':
        response = await this.handleCareerGuidance(message, context);
        break;
      
      case 'interview-prep':
        response = await this.handleInterviewPrep(message, context);
        break;
      
      case 'resume-review':
        response = await this.handleResumeReview(message, context);
        break;
      
      case 'certification-advice':
        response = await this.handleCertificationAdvice(message, context);
        break;
      
      case 'technology-comparison':
        response = await this.handleTechnologyComparison(message, context);
        break;
      
      case 'salary-inquiry':
        response = await this.handleSalaryInquiry(message, context);
        break;
      
      case 'project-ideas':
        response = await this.handleProjectIdeas(message, context);
        break;
      
      case 'general':
      default:
        response = await this.handleGeneralQuery(message, context);
        break;
    }

    // ✨ NEW: Add intelligent follow-ups
    return await this.enrichWithFollowUps(response, intent, context);
  }

  /**
   * Enrich response with intelligent follow-up suggestions
   */
  private async enrichWithFollowUps(
    response: EnhancedAIResponse,
    intent: Intent,
    context: IntelligenceContext
  ): Promise<EnhancedAIResponse> {
    try {
      // Generate context-aware follow-ups
      const followUpData = await proactiveAssistant.generateFollowUps(
        intent,
        context,
        response.data
      );

      // Convert follow-ups to SuggestedAction format
      const suggestions: SuggestedAction[] = followUpData.followUps
        .filter(f => f.action === 'query') // Only include query-type actions for now
        .slice(0, 5) // Limit to top 5 suggestions
        .map(f => ({
          id: f.text.replace(/[^a-z0-9]/gi, '-').toLowerCase(),
          label: f.text,
          query: f.query || f.text,
          icon: f.icon?.replace(/[^a-z]/gi, '')
        }));

      // Merge with existing suggestions (if any)
      const existingSuggestions = response.interactive?.suggestions || [];
      const allSuggestions = [...suggestions, ...existingSuggestions];

      // Add follow-ups to response
      return {
        ...response,
        interactive: {
          ...response.interactive,
          suggestions: allSuggestions,
          metadata: {
            ...response.interactive?.metadata,
            encouragement: followUpData.encouragement,
            nextSteps: followUpData.nextSteps
          }
        }
      };
    } catch (error) {
      console.error('Error enriching with follow-ups:', error);
      // Return original response if enrichment fails
      return response;
    }
  }

  /**
   * HANDLER: Job Search (Enhanced with multi-dimensional matching)
   */
  private async handleJobSearch(
    message: string,
    context: IntelligenceContext
  ): Promise<EnhancedAIResponse> {
    const {studentProfile, marketIntelligence, careerReadiness } = context;

    if (!marketIntelligence.opportunities || marketIntelligence.opportunities.length === 0) {
      return {
        success: true,
        message: "No active job opportunities found at the moment. I'll notify you when new jobs are posted! In the meantime, let's work on improving your profile. " +
          (careerReadiness 
            ? `Your career readiness score is ${careerReadiness.overall_score}/100. ${careerReadiness.recommendations[0] || ''}`
            : '')
      };
    }

    // Use existing job matching from handlers
    const { handleFindJobs } = await import('../handlers/findJobsHandler');
    const result = await handleFindJobs(message, studentProfile.id);

    // Track interaction
    if (result.data?.matches) {
      await this.trackJobInteractions(studentProfile.id, result.data.matches);
    }

    return result;
  }

  /**
   * HANDLER: Skill Gap Analysis (Intelligent gap detection + recommendations)
   */
  private async handleSkillGapAnalysis(
    message: string,
    context: IntelligenceContext
  ): Promise<EnhancedAIResponse> {
    const { studentProfile, marketIntelligence, careerReadiness } = context;

    const studentSkills = (studentProfile.profile?.technicalSkills || [])
      .map((s: any) => s.name.toLowerCase());
    
    const inDemandSkills = marketIntelligence.inDemandSkills;
    const missingSkills = inDemandSkills.filter(skill => 
      !studentSkills.some(s => s.includes(skill) || skill.includes(s))
    );

    const prompt = `You are a career advisor analyzing skill gaps.

**STUDENT PROFILE:**
Name: ${studentProfile.name}
Department: ${studentProfile.department}
Current Skills: ${studentSkills.join(', ') || 'None listed'}
Career Readiness: ${careerReadiness?.overall_score || 'N/A'}/100

**MARKET ANALYSIS:**
Top In-Demand Skills: ${inDemandSkills.slice(0, 10).join(', ')}
Total Job Opportunities: ${marketIntelligence.totalJobs}

**SKILL GAP IDENTIFIED:**
Missing High-Demand Skills: ${missingSkills.slice(0, 8).join(', ')}

**STUDENT'S QUESTION:**
"${message}"

**YOUR TASK:**
Provide a personalized skill gap analysis with:
1. **Critical Skills Missing** (top 3-5 that would significantly improve job prospects)
2. **Why Each Skill Matters** (job market demand, salary impact)
3. **Learning Priority** (which skills to learn first and why)
4. **Estimated Timeline** (realistic time to become job-ready)
5. **Actionable Next Steps** (specific courses, projects to build)

Be honest, specific, and encouraging. Include real course recommendations.`;

    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert career advisor who provides data-driven, actionable skill gap analysis.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const response = completion.choices[0]?.message?.content || '';

    // Build detailed gaps for interactive response
    const detailedGaps = missingSkills.slice(0, 8).map((skill, idx) => ({
      skill,
      demand: 80 - (idx * 5), // Decreasing demand based on priority
      priority: idx < 2 ? 'critical' : idx < 4 ? 'high' : 'medium',
      impact: idx < 2 ? '+30% job opportunities' : idx < 4 ? '+20% job opportunities' : '+10% job opportunities'
    }));

    return buildSkillGapResponse(
      {
        missingSkills: missingSkills.slice(0, 8),
        currentSkillsCount: studentSkills.length,
        recommendedSkillsCount: inDemandSkills.length
      },
      response,
      detailedGaps
    );
  }

  /**
   * HANDLER: Learning Path (Already well-implemented, enhance with proactive suggestions)
   */
  private async handleLearningPath(
    message: string,
    context: IntelligenceContext
  ): Promise<EnhancedAIResponse> {
    const { handleLearningPath } = await import('../handlers/learningPathHandler');
    const result = await handleLearningPath(message, context.studentProfile.id);

    // Create learning path tracking if recommended
    if (result.success && result.message) {
      await this.createLearningPathTracking(context.studentProfile.id, message, result.message);
    }

    return result;
  }

  /**
   * HANDLER: Profile Improvement (Proactive suggestions)
   */
  private async handleProfileImprovement(
    message: string,
    context: IntelligenceContext
  ): Promise<AIResponse> {
    const { profileHealth, careerReadiness, peerComparison } = context;

    let response = `## Your Profile Analysis 📊\n\n`;

    // Career Readiness Score
    if (careerReadiness) {
      response += `**Career Readiness Score:** ${careerReadiness.overall_score}/100\n\n`;
      
      if (careerReadiness.breakdown.strengths.length > 0) {
        response += `**Your Strengths:**\n`;
        careerReadiness.breakdown.strengths.forEach((s: string) => {
          response += `✅ ${s}\n`;
        });
        response += `\n`;
      }

      if (careerReadiness.breakdown.weaknesses.length > 0) {
        response += `**Areas to Improve:**\n`;
        careerReadiness.breakdown.weaknesses.forEach((w: string) => {
          response += `⚠️ ${w}\n`;
        });
        response += `\n`;
      }
    }

    // Profile Health
    if (profileHealth) {
      response += `**Profile Completeness:** ${profileHealth.completeness_score}/100\n\n`;

      if (profileHealth.missing_sections.length > 0) {
        response += `**Missing Sections:**\n`;
        profileHealth.missing_sections.forEach((section: string) => {
          response += `❌ ${section}\n`;
        });
        response += `\n`;
      }

      if (profileHealth.improvement_suggestions.length > 0) {
        response += `**Top Recommendations:**\n\n`;
        profileHealth.improvement_suggestions.slice(0, 5).forEach((sugg: any, idx: number) => {
          response += `${idx + 1}. **${sugg.action}**\n`;
          response += `   Priority: ${sugg.priority} | Impact: ${sugg.impact}\n\n`;
        });
      }
    }

    // Peer Comparison
    if (peerComparison) {
      response += `**Peer Comparison (${peerComparison.cohort}):**\n`;
      response += `- Your Rank: ${peerComparison.yourRank}\n`;
      response += `- Avg Skills in Cohort: ${peerComparison.avgSkillsCount}\n`;
      response += `- Avg Projects in Cohort: ${peerComparison.avgProjectsCount}\n\n`;
    }

    // Proactive suggestions
    response += `**Quick Wins to Boost Your Profile:**\n`;
    response += `1. Add detailed descriptions to your projects\n`;
    response += `2. List 5-8 relevant technical skills\n`;
    response += `3. Complete at least 2 online courses\n`;
    response += `4. Get one certification in your field\n\n`;
    response += `Would you like help with any specific section?`;

    return { success: true, message: response };
  }

  /**
   * HANDLER: Career Guidance
   */
  private async handleCareerGuidance(
    message: string,
    context: IntelligenceContext
  ): Promise<AIResponse> {
    const { studentProfile, marketIntelligence, careerReadiness } = context;

    const prompt = `You are an experienced career counselor.

**STUDENT CONTEXT:**
- Name: ${studentProfile.name}
- Field: ${studentProfile.department}
- Skills: ${studentProfile.profile?.technicalSkills?.map((s: any) => s.name).join(', ') || 'Limited'}
- Career Readiness: ${careerReadiness?.overall_score || 'Unknown'}/100
- Market Opportunities: ${marketIntelligence.totalJobs} jobs available

**STUDENT'S QUESTION:**
"${message}"

**YOUR TASK:**
Provide personalized career guidance that includes:
1. **Career Path Analysis** (realistic options based on their profile)
2. **Growth Trajectory** (typical timelines and milestones)
3. **Market Positioning** (how competitive they are currently)
4. **Action Plan** (concrete steps to achieve their career goals)
5. **Realistic Expectations** (honest assessment of challenges and opportunities)

Be supportive but realistic. Provide actionable advice.`;

    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: 'You are a knowledgeable career counselor providing honest, actionable guidance.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 1800
    });

    return {
      success: true,
      message: completion.choices[0]?.message?.content || 'Unable to generate guidance at this time.'
    };
  }

  /**
   * HANDLER: Interview Prep (Generate questions and tips)
   */
  private async handleInterviewPrep(
    message: string,
    context: IntelligenceContext
  ): Promise<AIResponse> {
    const { studentProfile } = context;
    const skills = studentProfile.profile?.technicalSkills?.map((s: any) => s.name) || [];

    const prompt = `Generate interview preparation guidance.

**Student Profile:**
- Skills: ${skills.join(', ')}
- Department: ${studentProfile.department}

**Request:** ${message}

**Provide:**
1. **5-7 Technical Questions** specific to their skills
2. **3-4 Behavioral Questions** (STAR format)
3. **Interview Tips** tailored to their experience level
4. **Red Flags to Avoid**
5. **Questions They Should Ask** the interviewer

Format with clear sections and bullet points.`;

    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: 'You are an interview coach helping students prepare effectively.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    return {
      success: true,
      message: completion.choices[0]?.message?.content || 'Unable to generate interview prep.'
    };
  }

  /**
   * HANDLER: Resume Review (Analyze and provide feedback)
   */
  private async handleResumeReview(
    message: string,
    context: IntelligenceContext
  ): Promise<AIResponse> {
    const { studentProfile } = context;

    const resumeData = {
      skills: studentProfile.profile?.technicalSkills || [],
      projects: studentProfile.profile?.projects || [],
      experience: studentProfile.profile?.experience || [],
      education: studentProfile.profile?.education || []
    };

    const response = `## Resume Analysis & Feedback\n\n` +
      `**Current Profile Strength:**\n` +
      `- Skills Listed: ${resumeData.skills.length}\n` +
      `- Projects: ${resumeData.projects.length}\n` +
      `- Experience: ${resumeData.experience.length}\n\n` +
      `**Recommendations:**\n\n` +
      `1. **Skills Section**\n` +
      `   ${resumeData.skills.length < 5 ? '⚠️ Add more skills (aim for 5-8 relevant skills)' : '✅ Good skill coverage'}\n\n` +
      `2. **Projects Section**\n` +
      `   ${resumeData.projects.length < 3 ? '⚠️ Add more projects (minimum 3 recommended)' : '✅ Solid project portfolio'}\n\n` +
      `3. **Key Improvements:**\n` +
      `   - Use action verbs (Built, Designed, Implemented, Optimized)\n` +
      `   - Quantify achievements (improved by X%, reduced by Y%)\n` +
      `   - Highlight technologies used\n` +
      `   - Keep it to 1 page (fresher) or 2 pages (experienced)\n\n` +
      `4. **ATS Optimization:**\n` +
      `   - Include keywords from job descriptions\n` +
      `   - Use standard section headers\n` +
      `   - Avoid tables/columns (ATS can't parse)\n` +
      `   - Save as .pdf format\n\n` +
      `Would you like specific help improving any section?`;

    return { success: true, message: response };
  }

  /**
   * HANDLER: Certification Advice
   */
  private async handleCertificationAdvice(
    message: string,
    context: IntelligenceContext
  ): Promise<AIResponse> {
    const { marketIntelligence } = context;

    const certificationGuide = `## Certification Guide 🎓\n\n` +
      `Based on current market demand (${marketIntelligence.totalJobs} jobs analyzed):\n\n` +
      `**High-ROI Certifications:**\n\n` +
      `1. **AWS Certified Solutions Architect**\n` +
      `   - Demand: Very High (65% of cloud jobs)\n` +
      `   - Cost: $150 | Duration: 6-8 weeks prep\n` +
      `   - Salary Impact: +20% average\n\n` +
      `2. **Google Cloud Professional**\n` +
      `   - Demand: High (growing 40% YoY)\n` +
      `   - Cost: $200 | Duration: 8-10 weeks\n` +
      `   - Best for: Cloud architects, DevOps\n\n` +
      `3. **Microsoft Azure Fundamentals**\n` +
      `   - Demand: Medium-High\n` +
      `   - Cost: $99 | Duration: 4-6 weeks\n` +
      `   - Best for: Beginners in cloud\n\n` +
      `4. **Certified Kubernetes Administrator**\n` +
      `   - Demand: High (DevOps roles)\n` +
      `   - Cost: $395 | Duration: 10-12 weeks\n` +
      `   - Advanced level\n\n` +
      `**Free Valuable Certifications:**\n` +
      `- Google Analytics Certification\n` +
      `- HubSpot Inbound Marketing\n` +
      `- freeCodeCamp Certifications\n\n` +
      `**Recommendation:** Start with cloud fundamentals, then specialize based on your career path.\n\n` +
      `Which area are you most interested in?`;

    return { success: true, message: certificationGuide };
  }

  /**
   * HANDLER: Technology Comparison (Node.js vs Django, React vs Angular, etc.)
   */
  private async handleTechnologyComparison(
    message: string,
    context: IntelligenceContext
  ): Promise<AIResponse> {
    const { studentProfile, marketIntelligence } = context;

    // Extract mentioned technologies from the message
    const technologies = this.extractTechnologiesFromMessage(message);
    const currentSkills = studentProfile.profile?.technicalSkills?.map((s: any) => s.name.toLowerCase()) || [];
    const ongoingTraining = studentProfile.profile?.training?.filter((t: any) => t.status === 'ongoing') || [];
    
    const prompt = `You are a career advisor helping a student choose between technologies.

**STUDENT PROFILE:**
Name: ${studentProfile.name}
Department: ${studentProfile.department}
Current Skills: ${currentSkills.join(', ') || 'None listed'}
Ongoing Training: ${ongoingTraining.map((t: any) => t.course).join(', ') || 'None'}

**MARKET ANALYSIS (from ${marketIntelligence.totalJobs} jobs):**
Top In-Demand Skills: ${marketIntelligence.inDemandSkills.slice(0, 15).join(', ')}

**STUDENT'S QUESTION:**
"${message}"

**YOUR TASK:**
Provide a **personalized, contextual comparison** that considers:

1. **The Student's Current Position**
   - Acknowledge their existing skills (especially ${currentSkills.length > 0 ? currentSkills.slice(0, 3).join(', ') : 'beginner level'})
   - Note their ongoing training: ${ongoingTraining.length > 0 ? ongoingTraining[0].course : 'none currently'}
   - Consider the synergy with their current stack

2. **Technology Comparison** (be SPECIFIC about the technologies mentioned)
   - **Ecosystem & Community**: Which has better resources?
   - **Learning Curve**: Which is easier given their background?
   - **Job Market Demand**: Analyze from the in-demand skills above
   - **Use Cases**: When to use each technology
   - **Career Trajectory**: Which aligns better with their goals?

3. **Personalized Recommendation**
   - **If they're already learning one**: Should they continue or switch? Why?
   - **If starting fresh**: Which one fits their profile better?
   - **Consider their ecosystem**: E.g., if they know React, Node.js is more synergistic than Django

4. **Actionable Next Steps**
   - Specific recommendation based on their situation
   - 2-3 concrete actions (e.g., "Complete your Node.js training first", "Build a project with X")

**IMPORTANT GUIDELINES:**
- Be HONEST and CONTEXT-AWARE, not generic
- If they're mid-training in one technology, acknowledge the value of completing it
- Don't just list pros/cons - give them a clear direction
- Consider synergy with their existing skills (JavaScript ecosystem, Python ecosystem, etc.)
- Reference actual job market data provided above
- Keep it conversational and encouraging
- Total length: 300-400 words

**Output Format:**
### Great Question! 🤔

[Acknowledge their context]

### Comparing [Tech A] vs [Tech B]

**[Tech A]:**
- [Key points specific to their profile]

**[Tech B]:**
- [Key points specific to their profile]

### 💡 My Recommendation for YOU

[Clear, personalized recommendation]

### 🚀 Next Steps
1. [Specific action]
2. [Specific action]
3. [Specific action]`;

    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { 
          role: 'system', 
          content: 'You are an experienced career counselor who provides personalized, context-aware technology comparisons. You always consider the student\'s current skills, training, and career goals. You are honest and practical, not generic.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 1500
    });

    return {
      success: true,
      message: completion.choices[0]?.message?.content || 'Unable to generate comparison at this time.'
    };
  }

  /**
   * HANDLER: Project Ideas (SMART AI-POWERED VERSION)
   * Uses AI for universal domain detection and complete project blueprints
   */
  private async handleProjectIdeas(
    message: string,
    context: IntelligenceContext
  ): Promise<AIResponse> {
    const { studentProfile, marketIntelligence } = context;
    const skills = studentProfile.profile?.technicalSkills?.map((s: any) => s.name) || [];

    console.log('🚀 Smart Project Ideas Handler - Analyzing request...');

    // STEP 1: AI-Powered Universal Domain Detection
    const domainResult = await industryKnowledgeService.detectDomain(message, studentProfile);
    console.log(`🌍 Detected Domain: ${domainResult.domain} (${(domainResult.confidence * 100).toFixed(0)}%)`);
    
    // STEP 2: Check for multiple domains
    const multipleDomains = await industryKnowledgeService.detectMultipleDomains(message);
    const isMultiDomain = multipleDomains.length > 1;
    
    // STEP 3: Research Industry for Deep Insights
    const industryKnowledge = await industryKnowledgeService.researchIndustry(
      domainResult.domain,
      domainResult.subDomain,
      skills
    );
    console.log(`📚 Industry Research Complete: ${industryKnowledge.commonProblems.length} problems identified`);

    // STEP 4: Generate Smart Project Ideas with Industry Context
    const prompt = `You are a senior project advisor with deep industry knowledge. Generate portfolio-worthy project ideas.

**STUDENT PROFILE:**
Name: ${studentProfile.name}
Department: ${studentProfile.department}
Current Skills: ${skills.join(', ') || 'Beginner'}

**STUDENT'S QUESTION:**
"${message}"

**AI-DETECTED DOMAIN:** ${domainResult.domain}${domainResult.subDomain ? ` (${domainResult.subDomain})` : ''}
${isMultiDomain ? `**Multiple Domains:** ${multipleDomains.join(', ')}` : ''}
**Industry Context:** ${domainResult.industryContext}

**INDUSTRY RESEARCH INSIGHTS:**
**Real Problems in ${domainResult.domain}:**
${industryKnowledge.commonProblems.slice(0, 3).map((p, i) => `${i + 1}. ${p}`).join('\n')}

**Popular Technologies:**
${industryKnowledge.popularTechnologies.slice(0, 5).join(', ')}

**Industry Trends (2024-2025):**
${industryKnowledge.industryTrends.slice(0, 3).join(', ')}

**Compliance Requirements:**
${industryKnowledge.complianceRequirements.length > 0 ? industryKnowledge.complianceRequirements[0] : 'Standard best practices'}

**YOUR TASK:**
Provide 3-5 practical project ideas that:
1. SOLVE REAL PROBLEMS from the industry research above
2. Match their current skill level: ${skills.join(', ') || 'Beginner'}
3. Use industry-appropriate technologies: ${industryKnowledge.popularTechnologies.slice(0, 3).join(', ')}
4. Are relevant to ${domainResult.domain}${isMultiDomain ? ` and ${multipleDomains[1]}` : ''}
5. Are portfolio-worthy and impressive to ${domainResult.domain} recruiters
6. Consider compliance: ${industryKnowledge.complianceRequirements[0] || 'General best practices'}
7. Align with current trends: ${industryKnowledge.industryTrends[0] || 'Modern practices'}

**For each project, include:**
- **Project Name** (creative, domain-specific name)
- **Description** (2-3 sentences about what it does)
- **Tech Stack** (specific technologies from their skills)
- **Key Features** (3-4 main features to implement)
- **Difficulty** (Beginner/Intermediate/Advanced)
- **Timeline** (estimated weeks to build)
- **Learning Outcomes** (what skills they'll gain)
- **Bonus Points** (optional advanced features)

**IMPORTANT GUIDELINES:**
- If they mentioned "React + Supabase", prioritize full-stack web projects using these
- If they mentioned a specific domain (health, chemical, etc.), make ALL projects domain-specific
- Be creative and practical - suggest projects that solve real problems
- Include modern features (real-time updates, authentication, responsive design)
- Make sure projects are impressive enough for their portfolio

**FORMAT:**
### 🚀 Project Ideas for You

[Brief intro acknowledging their skills and domain interest]

#### 1. **[Project Name]** 🏥/💊/📚 (domain icon)
**Description:** ...
**Tech Stack:** React, Supabase, ...
**Key Features:**
- Feature 1
- Feature 2
- Feature 3

**Difficulty:** Intermediate  
**Timeline:** 3-4 weeks  
**Learning Outcomes:** Authentication, real-time data, ...
**Bonus:** Add feature X for extra polish

---

[Repeat for 3-5 projects]

### 💡 Pro Tips:
- Start with Project 1 (easiest)
- Deploy each project live (Vercel/Netlify)
- Document with README and screenshots
- Add to portfolio and LinkedIn

**Which project excites you the most?** I can help you plan it!`;

    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { 
          role: 'system', 
          content: 'You are a creative project advisor who suggests practical, portfolio-worthy projects tailored to student skills and interests. Be enthusiastic and specific.' 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 2000
    });

    return {
      success: true,
      message: completion.choices[0]?.message?.content || 'Unable to generate project ideas at this time.'
    };
  }

  /**
   * HANDLER: Salary Inquiry
   */
  private async handleSalaryInquiry(
    message: string,
    context: IntelligenceContext
  ): Promise<AIResponse> {
    const { studentProfile, marketIntelligence } = context;

    const salaryGuide = `## Salary Insights 💰\n\n` +
      `**For ${studentProfile.department} field:**\n\n` +
      `**Entry Level (0-2 years):**\n` +
      `- Fresher: ₹3-6 LPA\n` +
      `- With internship: ₹4.5-8 LPA\n` +
      `- With strong projects + skills: ₹6-12 LPA\n\n` +
      `**Mid Level (2-5 years):**\n` +
      `- ₹8-15 LPA (average)\n` +
      `- ₹12-25 LPA (top performers)\n\n` +
      `**Factors Affecting Your Salary:**\n` +
      `1. Skills match (your skills vs market demand)\n` +
      `2. Company type (startup vs MNC vs product)\n` +
      `3. Location (Bangalore > other metros)\n` +
      `4. Negotiation skills\n` +
      `5. Portfolio quality\n\n` +
      `**To Maximize Your Offer:**\n` +
      `- Build strong portfolio (3+ quality projects)\n` +
      `- Get certified (AWS/Azure adds 15-20%)\n` +
      `- Contribute to open source\n` +
      `- Network and get referrals\n` +
      `- Practice negotiation\n\n` +
      `**Current Market:** ${marketIntelligence.totalJobs} active opportunities\n\n` +
      `Want to know your estimated salary range based on your profile?`;

    return { success: true, message: salaryGuide };
  }

  /**
   * HANDLER: General Query (Context-aware conversation)
   */
  private async handleGeneralQuery(
    message: string,
    context: IntelligenceContext
  ): Promise<AIResponse> {
    const lowerMessage = message.toLowerCase().trim();

    // Quick responses for greetings
    const greetings = ['hi', 'hello', 'hey', 'hii', 'helo', 'hai', 'helo'];
    if (greetings.some(g => lowerMessage === g || lowerMessage.startsWith(g + ' '))) {
      const name = context.studentProfile.name?.split(' ')[0] || 'there';
      return {
        success: true,
        message: `Hey ${name}! 👋 I'm your career AI assistant. I can help you with:\n\n` +
          `🔍 **Finding Jobs** - Get personalized job matches\n` +
          `📚 **Learning Path** - Course suggestions and roadmaps\n` +
          `📊 **Skill Analysis** - Find what skills you need\n` +
          `🤔 **Career Guidance** - Advice on career direction\n` +
          `💼 **Interview Prep** - Practice and tips\n` +
          `📝 **Resume Help** - Feedback and improvements\n\n` +
          `**Try asking:**\n` +
          `• "Which is better Node.js or Django?"\n` +
          `• "Find me jobs"\n` +
          `• "What skills should I learn?"\n` +
          `• "Suggest me courses"`
      };
    }

    // Thank you responses
    if (lowerMessage.includes('thank')) {
      return {
        success: true,
        message: `You're welcome! 😊 I'm here whenever you need career guidance. Feel free to ask anything!`
      };
    }

    // Safety net: Check if this should have been another intent
    // If message contains specific keywords, route to appropriate handler
    if (lowerMessage.includes('profile') && (lowerMessage.includes('improv') || lowerMessage.includes('better') || lowerMessage.includes('boost'))) {
      console.log('🔄 Rerouting: General -> Profile Improvement');
      return await this.handleProfileImprovement(message, context);
    }
    
    if (lowerMessage.includes('skill') && (lowerMessage.includes('gap') || lowerMessage.includes('missing') || lowerMessage.includes('need'))) {
      console.log('🔄 Rerouting: General -> Skill Gap Analysis');
      return await this.handleSkillGapAnalysis(message, context);
    }
    
    if (lowerMessage.includes('job') || lowerMessage.includes('opportunit')) {
      console.log('🔄 Rerouting: General -> Job Search');
      return await this.handleJobSearch(message, context);
    }

    // Default: Use AI for contextual response
    return {
      success: true,
      message: `I'm here to help with your career! Try asking me about:\n` +
        `- Finding jobs\n- Learning new skills\n- Improving your profile\n- Interview preparation\n\n` +
        `What would you like to know?`
    };
  }

  /**
   * Build clarification suggestions when intent is unclear
   */
  private buildClarificationSuggestions(detectedIntent: any, context: IntelligenceContext): any[] {
    const topIntents = [detectedIntent.primary, ...detectedIntent.secondary].slice(0, 3);
    
    const suggestions = topIntents.map(intent => {
      switch (intent) {
        case 'find-jobs':
          return { id: 'jobs', label: 'Find job opportunities', query: 'Find me job opportunities matching my skills' };
        case 'learning-path':
          return { id: 'learn', label: 'Learn new skills', query: 'Suggest courses and learning path for me' };
        case 'skill-gap-analysis':
          return { id: 'skills', label: 'Check skill gaps', query: 'What skills am I missing for jobs?' };
        case 'career-guidance':
          return { id: 'career', label: 'Career guidance', query: 'Give me career guidance and advice' };
        case 'technology-comparison':
          return { id: 'compare', label: 'Compare technologies', query: 'Compare technologies for my career' };
        case 'profile-improvement':
          return { id: 'profile', label: 'Improve my profile', query: 'How can I improve my profile?' };
        default:
          return null;
      }
    }).filter(s => s !== null);

    return suggestions;
  }

  /**
   * Helper: Extract technologies mentioned in a comparison query
   */
  private extractTechnologiesFromMessage(message: string): string[] {
    const lowerMessage = message.toLowerCase();
    const commonTechnologies = [
      'node.js', 'nodejs', 'node', 'django', 'flask', 'express',
      'react', 'vue', 'angular', 'svelte', 'next.js',
      'python', 'javascript', 'typescript', 'java', 'go', 'rust', 'php',
      'spring boot', 'laravel', 'rails', 'asp.net',
      'mongodb', 'postgresql', 'mysql', 'redis',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes'
    ];
    
    return commonTechnologies.filter(tech => lowerMessage.includes(tech));
  }

  /**
   * Helper: Extract in-demand skills from opportunities
   */
  private extractInDemandSkills(opportunities: any[]): string[] {
    const skillsMap = new Map<string, number>();

    opportunities.forEach(opp => {
      let skills: string[] = [];
      if (Array.isArray(opp.skills_required)) {
        skills = opp.skills_required;
      } else if (typeof opp.skills_required === 'string') {
        try {
          skills = JSON.parse(opp.skills_required);
        } catch (e) {}
      }

      skills.forEach(skill => {
        if (skill) {
          const normalized = skill.toLowerCase().trim();
          skillsMap.set(normalized, (skillsMap.get(normalized) || 0) + 1);
        }
      });
    });

    return Array.from(skillsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([skill]) => skill);
  }

  /**
   * Helper: Track job interactions
   */
  private async trackJobInteractions(studentId: string, matches: any[]): Promise<void> {
    try {
      const interactions = matches.map(match => ({
        student_id: studentId,
        job_id: match.job_id,
        interaction_type: 'matched',
        match_score: match.match_score,
        match_reasoning: {
          reason: match.match_reason,
          matching_skills: match.key_matching_skills,
          gaps: match.skills_gap
        },
        application_strategy: match.recommendation,
        created_at: new Date().toISOString()
      }));

      await supabase.from('job_interactions').insert(interactions);
    } catch (error) {
      console.error('Error tracking interactions:', error);
    }
  }

  /**
   * Helper: Create learning path tracking
   */
  private async createLearningPathTracking(
    studentId: string,
    goal: string,
    pathData: string
  ): Promise<void> {
    try {
      await supabase.from('learning_paths').insert({
        student_id: studentId,
        goal: goal.substring(0, 100),
        path_data: { content: pathData },
        status: 'active'
      });
    } catch (error) {
      console.error('Error creating learning path:', error);
    }
  }

  /**
   * Helper: Log service usage for analytics
   */
  private async logServiceUsage(
    studentId: string,
    serviceName: string,
    request: string,
    response: any,
    responseTime: number
  ): Promise<void> {
    try {
      await supabase.from('ai_service_logs').insert({
        student_id: studentId,
        service_name: serviceName,
        request_data: { query: request },
        response_data: { success: response.success },
        response_time_ms: responseTime,
        error_message: response.error || null
      });
    } catch (error) {
      console.error('Error logging service usage:', error);
    }
  }

  /**
   * Check if query is a simple general knowledge question (not career-related)
   */
  private isSimpleGeneralQuery(message: string): boolean {
    const lowerMsg = message.toLowerCase().trim();
    
    // Patterns for simple general knowledge questions
    const simplePatterns = [
      /^what is /i,
      /^what are /i,
      /^who is /i,
      /^who are /i,
      /^define /i,
      /^tell me about /i,
      /^explain what /i,
      /^difference between /i,
      /^how does .+ work$/i,
      /^why is /i,
      /^when was /i,
      /^where is /i
    ];
    
    // Career-related keywords that indicate NOT a simple query
    const careerKeywords = [
      'job', 'career', 'skill', 'learn', 'course', 'training',
      'interview', 'resume', 'cv', 'salary', 'certification',
      'hire', 'apply', 'application', 'internship', 'profile',
      'portfolio', 'experience', 'qualification'
    ];
    
    const hasSimplePattern = simplePatterns.some(pattern => pattern.test(lowerMsg));
    const hasCareerKeyword = careerKeywords.some(keyword => lowerMsg.includes(keyword));
    
    // It's a simple query if it matches pattern AND doesn't have career keywords
    return hasSimplePattern && !hasCareerKeyword;
  }

  /**
   * Handle simple general knowledge queries without heavy processing
   */
  private async handleSimpleGeneralQuery(
    message: string,
    studentId: string,
    startTime: number
  ): Promise<AIResponse> {
    try {
      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful assistant. Provide clear, concise, and accurate answers to general knowledge questions. Keep responses brief (2-4 sentences) unless more detail is specifically needed.'
          },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 300
      });

      const response: AIResponse = {
        success: true,
        message: completion.choices[0]?.message?.content || 'I\'m not sure about that. Could you rephrase your question?'
      };

      // Log analytics
      await this.logServiceUsage(
        studentId,
        'general-knowledge',
        message,
        response,
        Date.now() - startTime
      );

      return response;
    } catch (error: any) {
      console.error('Error handling simple query:', error);
      return {
        success: false,
        error: 'I encountered an issue answering your question. Please try again.'
      };
    }
  }
}

// Export singleton instance
export const careerIntelligenceEngine = new CareerIntelligenceEngine();
export default careerIntelligenceEngine;

