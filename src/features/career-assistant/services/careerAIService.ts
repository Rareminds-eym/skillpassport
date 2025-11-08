import OpenAI from 'openai';
import { supabase } from '../../../lib/supabaseClient';

// Lazy initialization of OpenAI client to avoid SSR issues
let openai: OpenAI | null = null;

const getOpenAIClient = (): OpenAI => {
  if (!openai) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey || apiKey === '') {
      console.error('❌ VITE_OPENAI_API_KEY is not set in .env file!');
      throw new Error('OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
    }
    
    console.log('✅ OpenAI client initializing with API key:', apiKey.substring(0, 10) + '...');
    
    openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
      defaultHeaders: {
        "HTTP-Referer": typeof window !== 'undefined' ? window.location.origin : '',
        "X-Title": "SkillPassport Career AI",
      },
      dangerouslyAllowBrowser: true // Required for browser usage
    });
  }
  return openai;
};

// Types
interface StudentProfile {
  id: string;
  name: string;
  email: string;
  department: string;
  university: string;
  cgpa?: string;
  year_of_passing?: string;
  profile?: {
    technicalSkills?: any[];
    softSkills?: any[];
    education?: any[];
    training?: any[];
    experience?: any[];
    projects?: any[];
    certificates?: any[];
  };
}

interface JobMatch {
  job_id: number;
  job_title: string;
  company_name: string;
  match_score: number;
  match_reason: string;
  key_matching_skills: string[];
  skills_gap: string[];
  recommendation: string;
  opportunity?: any;
}

interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Career AI Service
 * Handles all AI-powered career guidance features
 */
class CareerAIService {
  private model = 'openai/gpt-4o-mini'; // Fast and cost-effective model
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheDuration = 5 * 60 * 1000; // 5 minutes

  /**
   * Main chat handler - routes to specific features based on context
   */
  async chat(
    message: string, 
    studentId: string, 
    context: { selectedChips?: string[]; conversationHistory?: ConversationMessage[] } = {}
  ): Promise<{ success: boolean; message?: string; data?: any; error?: string }> {
    try {
      // Determine intent from message and chips
      const intent = this.detectIntent(message, context.selectedChips || []);
      console.log(`🧠 Detected intent: "${intent}" for message: "${message}"`);

      // Route to appropriate handler
      switch (intent) {
        case 'find-jobs':
          return await this.handleFindJobs(message, studentId, context);
        case 'skill-gap':
          return await this.handleSkillGap(message, studentId, context);
        case 'interview-prep':
          return await this.handleInterviewPrep(message, studentId, context);
        case 'resume-review':
          return await this.handleResumeReview(message, studentId, context);
        case 'learning-path':
          return await this.handleLearningPath(message, studentId, context);
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
  private detectIntent(message: string, chips: string[]): string {
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

    if (chipIntent) return chipIntent;

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
    
    // Also check for combinations like "recommend + jobs", "suggest + jobs"
    const hasJobWord = lowerMessage.includes('job') || lowerMessage.includes('jobs') || lowerMessage.includes('position');
    const hasActionWord = ['recommend', 'suggest', 'find', 'search', 'show', 'need', 'want', 'looking'].some(action => lowerMessage.includes(action));
    
    // Avoid false positives: must be asking about jobs, not asking about how to get a job
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
    // Learning path - detect various course/learning related questions
    if (lowerMessage.includes('learn') || lowerMessage.includes('course') || lowerMessage.includes('roadmap') ||
        lowerMessage.includes('tutorial') || lowerMessage.includes('resource') || lowerMessage.includes('study') ||
        (lowerMessage.includes('suggest') && (lowerMessage.includes('course') || lowerMessage.includes('learn'))) ||
        (lowerMessage.includes('recommend') && (lowerMessage.includes('course') || lowerMessage.includes('learn')))) {
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
   * FIND JOBS - Main feature
   * Intelligently matches student with relevant job opportunities
   */
  private async handleFindJobs(
    message: string,
    studentId: string,
    context: any
  ): Promise<{ success: boolean; message?: string; data?: any; error?: string }> {
    try {
      console.log('🔍 Find Jobs - Starting search for student:', studentId);
      console.log('📝 User message:', message);

      // 1. Fetch student profile from database
      const studentProfile = await this.fetchStudentProfile(studentId);
      if (!studentProfile) {
        return {
          success: false,
          error: 'Unable to fetch your profile. Please try again.'
        };
      }

      console.log('✅ Student profile loaded:', {
        name: studentProfile.name,
        department: studentProfile.department,
        skillsCount: studentProfile.profile?.technicalSkills?.length || 0,
        experienceCount: studentProfile.profile?.experience?.length || 0
      });

      // 2. Fetch available opportunities
      const opportunities = await this.fetchOpportunities(studentProfile);
      console.log(`📊 Found ${opportunities.length} active opportunities`);
      
      if (!opportunities || opportunities.length === 0) {
        return {
          success: true,
          message: "I couldn't find any active job opportunities at the moment. New opportunities are added regularly, so please check back soon! In the meantime, would you like help preparing your resume or developing new skills?"
        };
      }

      // 3. Use AI to intelligently match jobs
      console.log('🤖 Starting AI matching...');
      const matches = await this.matchJobsWithAI(studentProfile, opportunities);
      console.log(`✨ AI matched ${matches.length} opportunities`);

      // 4. Generate conversational response
      console.log('💬 Generating conversational response...');
      const response = await this.generateJobMatchResponse(matches, studentProfile, message);

      return {
        success: true,
        message: response,
        data: {
          matches,
          totalOpportunities: opportunities.length
        }
      };
    } catch (error: any) {
      console.error('❌ Find Jobs Error:', error);
      return {
        success: false,
        error: 'I encountered an issue while searching for jobs. Please try again.'
      };
    }
  }

  /**
   * Fetch student profile from database
   */
  private async fetchStudentProfile(studentId: string): Promise<StudentProfile | null> {
    try {
      // Fetch student base data with JSONB profile
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (studentError || !student) {
        console.error('Error fetching student:', studentError);
        return null;
      }

      // Parse the JSONB profile column
      const profileData = student.profile || {};
      
      console.log('📦 Raw profile data:', {
        hasProfile: !!student.profile,
        education: profileData.education?.length || 0,
        training: profileData.training?.length || 0,
        projects: profileData.projects?.length || 0,
        softSkills: profileData.softSkills?.length || 0
      });

      // Extract department from education or profile
      const department = profileData.education?.[0]?.department || 
                        profileData.education?.[0]?.degree || 
                        profileData.branch_field ||
                        student.department ||
                        'General';

      // Extract technical skills from training courses
      const technicalSkills: any[] = [];
      if (profileData.training && Array.isArray(profileData.training)) {
        profileData.training.forEach((training: any) => {
          if (training.skills && Array.isArray(training.skills)) {
            training.skills.forEach((skill: string) => {
              if (!technicalSkills.find(s => s.name?.toLowerCase() === skill.toLowerCase())) {
                technicalSkills.push({
                  name: skill,
                  level: 3, // Default level
                  category: 'Technical',
                  source: 'training'
                });
              }
            });
          }
        });
      }

      // Add skills from projects
      if (profileData.projects && Array.isArray(profileData.projects)) {
        profileData.projects.forEach((project: any) => {
          const projectSkills = project.skills || project.technologies || project.techStack || [];
          projectSkills.forEach((skill: string) => {
            if (skill && !technicalSkills.find(s => s.name?.toLowerCase() === skill.toLowerCase())) {
              technicalSkills.push({
                name: skill,
                level: 4, // Projects show applied skills
                category: 'Technical',
                source: 'project'
              });
            }
          });
        });
      }

      // Build experience from profile
      const experience = [];
      if (profileData.projects && Array.isArray(profileData.projects)) {
        profileData.projects.forEach((project: any) => {
          if (project.title && project.status === 'Completed') {
            experience.push({
              role: 'Project Developer',
              company: project.title,
              duration: project.duration || '',
              type: 'project'
            });
          }
        });
      }

      return {
        id: student.id,
        name: profileData.name || student.name || 'Student',
        email: profileData.email || student.email,
        department: department,
        university: profileData.university || student.university || '',
        cgpa: profileData.education?.[0]?.cgpa || '',
        year_of_passing: profileData.education?.[0]?.yearOfPassing || '',
        profile: {
          technicalSkills: technicalSkills,
          softSkills: profileData.softSkills || [],
          education: profileData.education || [],
          training: profileData.training || [],
          experience: experience,
          projects: profileData.projects || [],
          certificates: profileData.certificates || []
        }
      };
    } catch (error) {
      console.error('Error in fetchStudentProfile:', error);
      return null;
    }
  }

  /**
   * Fetch opportunities from database
   */
  private async fetchOpportunities(studentProfile: StudentProfile): Promise<any[]> {
    try {
      console.log('📊 Fetching opportunities from database...');
      
      // Fetch ALL jobs (don't filter by is_active since many jobs may have it as false/null)
      // In production, you should update jobs to have is_active = true
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50); // Fetch up to 50 recent jobs

      if (error) {
        console.error('❌ Error fetching opportunities:', error);
        return [];
      }

      console.log(`✅ Found ${data?.length || 0} total opportunities in database`);
      
      if (data && data.length > 0) {
        // Count how many are active
        const activeCount = data.filter(j => j.is_active === true).length;
        console.log(`📊 Active jobs: ${activeCount} | Total: ${data.length}`);
        
        console.log('📋 Sample jobs:');
        data.slice(0, 3).forEach((job, i) => {
          console.log(`  ${i+1}. ${job.title || job.job_title} at ${job.company_name} | is_active: ${job.is_active} | status: ${job.status}`);
        });
      } else {
        console.warn('⚠️ No jobs found in database. Please add some opportunities!');
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error in fetchOpportunities:', error);
      return [];
    }
  }

  /**
   * Match jobs using AI with intelligent analysis
   */
  private async matchJobsWithAI(
    studentProfile: StudentProfile,
    opportunities: any[],
    topN: number = 10 // Increased to show more jobs
  ): Promise<JobMatch[]> {
    try {
      // Build student context
      const studentContext = this.buildStudentContext(studentProfile);

      // Build opportunities context
      const opportunitiesContext = opportunities.map((opp, index) => ({
        index: index + 1,
        id: opp.id,
        title: opp.title,
        company: opp.company_name,
        type: opp.employment_type,
        location: opp.location,
        mode: opp.mode,
        experience: opp.experience_required,
        skills: Array.isArray(opp.skills_required) ? opp.skills_required : 
                typeof opp.skills_required === 'string' ? JSON.parse(opp.skills_required || '[]') : [],
        description: opp.description,
        salary: opp.stipend_or_salary,
        deadline: opp.deadline
      }));

      // Create the matching prompt
      const prompt = this.createJobMatchingPrompt(studentContext, opportunitiesContext, topN);
      
      console.log('\ud83d\udce4 Sending prompt to OpenAI...');
      console.log('Student:', studentContext.name, '|', studentContext.department);
      console.log('Skills:', studentContext.technical_skills.length, 'technical,', studentContext.soft_skills.length, 'soft');
      console.log('Opportunities to analyze:', opportunities.length);

      // Call OpenAI API
      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert career counselor and job matching AI with deep knowledge of the Indian job market, student career development, and skill assessment. You provide accurate, honest, and helpful career guidance.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2500,
        response_format: { type: "json_object" } // Ensure JSON response
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error('No response from AI');
      }

      console.log('\ud83d\udce5 Received AI response, parsing...');
      console.log('Response length:', responseContent.length, 'chars');
      
      // Parse response
      const parsedResponse = JSON.parse(responseContent);
      const matches = parsedResponse.matches || [];
      
      console.log(`\u2705 Parsed ${matches.length} job matches from AI`);
      if (matches.length > 0) {
        console.log('Top match:', matches[0].job_title, '-', matches[0].match_score + '%');
        console.log('Sample match data:', JSON.stringify(matches[0], null, 2));
      }

      // Enrich matches with full opportunity data
      const enrichedMatches = matches.map((match: any) => {
        const opportunity = opportunities.find(opp => opp.id === match.job_id);
        if (!opportunity) {
          console.warn(`\u26a0\ufe0f No opportunity found for job_id: ${match.job_id}`);
        }
        return {
          ...match,
          opportunity
        };
      }).filter((match: any) => match.opportunity);
      
      console.log(`\ud83d\udd17 Enriched ${enrichedMatches.length} matches with opportunity data`);
      return enrichedMatches;

    } catch (error: any) {
      console.error('❌ AI Matching Error:', error);
      console.error('Error details:', error.message);
      console.error('Student context:', studentContext);
      console.error('Opportunities count:', opportunities.length);
      
      // Return fallback matches
      console.log('⚠️ Using fallback matching logic');
      return this.createFallbackMatches(studentProfile, opportunities, topN);
    }
  }

  /**
   * Build comprehensive student context for AI
   */
  private buildStudentContext(profile: StudentProfile): any {
    const technicalSkills = profile.profile?.technicalSkills || [];
    const softSkills = profile.profile?.softSkills || [];
    const experience = profile.profile?.experience || [];
    const training = profile.profile?.training || [];
    const education = profile.profile?.education || [];

    return {
      name: profile.name,
      department: profile.department,
      university: profile.university,
      cgpa: profile.cgpa,
      year_of_passing: profile.year_of_passing,
      technical_skills: technicalSkills.map((s: any) => ({
        name: s.name,
        level: s.level || 3,
        category: s.category
      })),
      soft_skills: softSkills.map((s: any) => s.name),
      experience_years: this.calculateExperienceYears(experience),
      experience_roles: experience.map((e: any) => e.role),
      completed_training: training.filter((t: any) => t.status === 'completed').map((t: any) => t.course),
      education_level: education[0]?.level || 'Bachelor',
      total_experience_count: experience.length,
      total_training_count: training.length
    };
  }

  /**
   * Calculate total years of experience
   */
  private calculateExperienceYears(experience: any[]): number {
    // Simple calculation - can be enhanced
    return experience.length > 0 ? experience.length * 0.5 : 0; // Rough estimate
  }

  /**
   * Create detailed job matching prompt
   */
  private createJobMatchingPrompt(studentContext: any, opportunities: any[], topN: number): string {
    return `
You are analyzing a student profile to find the BEST ${topN} job matches from ${opportunities.length} available opportunities.

**STUDENT PROFILE:**
Name: ${studentContext.name}
Department/Field: ${studentContext.department}
University: ${studentContext.university}
CGPA: ${studentContext.cgpa || 'Not specified'}
Year of Passing: ${studentContext.year_of_passing || 'Not specified'}
Experience: ${studentContext.experience_years} years

Technical Skills (${studentContext.technical_skills.length}):
${studentContext.technical_skills.map((s: any) => `- ${s.name} (Level: ${s.level}/5)${s.category ? ` [${s.category}]` : ''}`).join('\n') || '- None listed'}

Soft Skills: ${studentContext.soft_skills.join(', ') || 'None listed'}

Experience Roles: ${studentContext.experience_roles.join(', ') || 'No experience yet'}

Completed Training: ${studentContext.completed_training.join(', ') || 'None'}

---

**AVAILABLE OPPORTUNITIES (${opportunities.length} total):**

${opportunities.map(opp => `
${opp.index}. [ID: ${opp.id}] ${opp.title} at ${opp.company}
   Type: ${opp.type} | Location: ${opp.location} | Mode: ${opp.mode || 'Not specified'}
   Experience Required: ${opp.experience || 'Not specified'}
   Skills Required: ${opp.skills.join(', ') || 'Not specified'}
   Salary/Stipend: ${opp.salary || 'Not disclosed'}
   Deadline: ${opp.deadline ? new Date(opp.deadline).toLocaleDateString() : 'Open'}
   Description: ${opp.description?.substring(0, 150) || 'N/A'}...
`).join('\n---\n')}

---

**MATCHING RULES:**

1. **FIELD MATCH IS CRITICAL (50% of score)**
   - Same field (e.g., CS student → Developer role) = 40-50 points
   - Related field (e.g., CS → Data Analyst) = 25-35 points
   - Different field = MAX 15 points

2. **SKILLS MATCH (30% of score)**
   - Has 80%+ required skills = 24-30 points
   - Has 60-79% required skills = 18-23 points
   - Has 40-59% required skills = 12-17 points
   - Has <40% required skills = 0-11 points

3. **EXPERIENCE LEVEL (10% of score)**
   - Matches experience requirement = 8-10 points
   - Within 1 year of requirement = 5-7 points
   - Significant gap = 0-4 points

4. **OTHER FACTORS (10% of score)**
   - Training/certifications relevant = +5 points
   - Location preference match = +3 points
   - Deadline approaching = +2 points

**SCORING SCALE:**
- 90-100: Perfect match - Apply immediately!
- 75-89: Excellent match - Strong candidate
- 60-74: Good match - Worth applying
- 45-59: Fair match - Consider with preparation
- 30-44: Stretch opportunity - Requires skill development
- Below 30: Not recommended currently

**BE HONEST:**
- If student is CS but jobs are all in Food Science → Low scores (20-35%)
- If student is Food Science but jobs are Developer roles → Low scores (20-35%)
- NEVER inflate scores to make poor matches look good
- It's better to be honest than misleading

**YOUR TASK:**
Analyze ALL ${opportunities.length} opportunities and return the TOP ${topN} matches.

**OUTPUT FORMAT (JSON only, no markdown):**
{
  "matches": [
    {
      "job_id": <number>,
      "job_title": "<exact title>",
      "company_name": "<exact company>",
      "match_score": <number 0-100>,
      "match_reason": "<2-3 sentences explaining the match, be specific about skills>",
      "key_matching_skills": ["<skill1>", "<skill2>", "<skill3>"],
      "skills_gap": ["<missing_skill1>", "<missing_skill2>"],
      "recommendation": "<What should the student do? Apply now, learn X first, good for beginners, etc.>"
    }
  ]
}

Return ONLY valid JSON. Be accurate, honest, and helpful.`;
  }

  /**
   * Generate comprehensive job listing response with card-based format
   * Shows each job as a separate card
   */
  private async generateJobMatchResponse(
    matches: JobMatch[],
    studentProfile: StudentProfile,
    userMessage: string
  ): Promise<string> {
    console.log('📝 Generating job match response for', matches.length, 'matches');
    
    try {
      const studentName = studentProfile.name?.split(' ')[0] || 'there';
      
      // Create intro
      let response = `Great news, ${studentName}! 🎉\n\n`;
      response += `I found ${matches.length} job opportunities that match your profile:\n\n`;
      
      // Show each job as a separate card
      matches.forEach((match, idx) => {
        console.log(`📊 Processing job ${idx + 1}:`, match.job_title);
        
        // Safety check for job data
        const job = match.opportunity || {};
        const matchEmoji = match.match_score >= 75 ? '⭐' : match.match_score >= 60 ? '✅' : '💡';
        
        // Card number and title
        response += `### ${idx + 1}. ${matchEmoji} **${match.job_title}** at **${match.company_name}**\n`;
        response += `**Match Score: ${match.match_score}%** | ${job.employment_type || 'Full-time'} | ${job.location || 'Remote'} | ${job.mode || 'Hybrid'}\n\n`;
        
        // Why it's a great fit
        response += `**Why it's a great fit:**\n`;
        response += `${match.match_reason}\n\n`;
        
        // Matching skills
        if (match.key_matching_skills && match.key_matching_skills.length > 0) {
          response += `**Your matching skills:** ${match.key_matching_skills.join(', ')}\n\n`;
        }
        
        // Skills to develop
        if (match.skills_gap && match.skills_gap.length > 0) {
          response += `**Skills to develop:** ${match.skills_gap.join(', ')}\n\n`;
        }
        
        // Salary info
        if (job.stipend_or_salary) {
          response += `**💰 Salary:** ${job.stipend_or_salary}\n\n`;
        }
        
        // Deadline with days calculation
        if (job.deadline) {
          try {
            const deadline = new Date(job.deadline);
            const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
const dateStr = deadline.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
            response += `**⏰ Deadline:** ${dateStr}`;
            if (daysLeft > 0) {
              response += ` (${daysLeft} days left)`;
            }
            response += `\n\n`;
          } catch (e) {
            console.warn('Error parsing deadline:', e);
          }
        }
        
        // Action recommendation
        response += `**🎯 Action:** ${match.recommendation}\n\n`;
        
        // Card separator
        response += `---\n\n`;
      });
      
      console.log('✅ Successfully generated response with', matches.length, 'cards');
      
      // Footer with help offer
      response += `Would you like help preparing your application or learning any of the required skills?`;
      
      return response;
    } catch (error) {
      console.error('❌ Error generating job response:', error);
      console.error('Matches data:', JSON.stringify(matches, null, 2));
      return this.createFallbackResponse(matches, studentProfile);
    }
  }

  /**
   * Create fallback matches when AI fails
   */
  private createFallbackMatches(
    studentProfile: StudentProfile,
    opportunities: any[],
    topN: number
  ): JobMatch[] {
    return opportunities.slice(0, topN).map((opp, idx) => ({
      job_id: opp.id,
      job_title: opp.title,
      company_name: opp.company_name,
      match_score: Math.max(50 - (idx * 5), 30),
      match_reason: `This ${opp.employment_type} opportunity at ${opp.company_name} could be a good fit for building experience in ${opp.location}.`,
      key_matching_skills: studentProfile.profile?.technicalSkills?.slice(0, 3).map((s: any) => s.name) || [],
      skills_gap: [],
      recommendation: 'Review the job requirements and consider applying if it aligns with your career goals.',
      opportunity: opp
    }));
  }

  /**
   * Create fallback text response
   */
  private createFallbackResponse(matches: JobMatch[], studentProfile: StudentProfile): string {
    const topMatch = matches[0];
    return `Great news, ${studentProfile.name}! 🎉

I found ${matches.length} job opportunities that match your profile:

**Top Match (${topMatch.match_score}% match):**
**${topMatch.job_title}** at ${topMatch.company_name}

${topMatch.match_reason}

**Your matching skills:** ${topMatch.key_matching_skills.join(', ')}

${topMatch.skills_gap.length > 0 ? `**Skills to develop:** ${topMatch.skills_gap.join(', ')}` : ''}

**Next steps:** ${topMatch.recommendation}

Would you like help preparing your application or learning any of the required skills?`;
  }

  /**
   * Generate personalized learning path with AI
   */
  private async generateLearningPath(
    studentProfile: StudentProfile,
    userMessage: string
  ): Promise<string> {
    try {
      const studentName = studentProfile.name?.split(' ')[0] || 'there';
      const department = studentProfile.department || 'your field';
      const currentSkills = studentProfile.profile?.technicalSkills || [];
      const completedCourses = studentProfile.profile?.training?.filter((t: any) => t.status === 'completed') || [];
      const ongoingCourses = studentProfile.profile?.training?.filter((t: any) => t.status === 'ongoing') || [];
      
      // Build context for AI
      const skillsList = currentSkills.map((s: any) => `${s.name} (Level: ${s.level}/5)`).join(', ') || 'No skills listed yet';
      const completedList = completedCourses.map((c: any) => c.course).join(', ') || 'None';
      const ongoingList = ongoingCourses.map((c: any) => c.course).join(', ') || 'None';
      
      // Fetch a few job opportunities to understand market demand
      const opportunities = await this.fetchOpportunities(studentProfile);
      const inDemandSkills = this.extractInDemandSkills(opportunities);
      
      const prompt = `You are an expert career coach creating a personalized learning roadmap.

**STUDENT PROFILE:**
Name: ${studentProfile.name}
Field: ${department}
Current Skills: ${skillsList}
Completed Courses: ${completedList}
Ongoing Learning: ${ongoingList}

**MARKET DEMAND (from ${opportunities.length} job postings):**
Top In-Demand Skills: ${inDemandSkills.slice(0, 10).join(', ')}

**STUDENT'S REQUEST:**
"${userMessage}"

**YOUR TASK:**
Create a comprehensive, actionable learning roadmap that:

1. **Assesses Current State**: What skills they have, what's missing
2. **Identifies Skill Gaps**: Compare current skills vs market demand
3. **Sets Clear Goals**: Short-term (1-3 months) and Long-term (6-12 months)
4. **Recommends Specific Courses**:
   - FREE resources (YouTube, freeCodeCamp, Coursera free courses)
   - PAID premium options (Udemy, Pluralsight, etc.)
   - Include estimated time and difficulty level
5. **Suggests Hands-on Projects**: Real-world projects to build portfolio
6. **Provides Timeline**: Week-by-week or month-by-month plan
7. **Recommends Certifications**: Industry-recognized certifications to pursue

**OUTPUT FORMAT:**
Structure your response with:
- Clear sections with ### headers
- Bullet points for easy scanning
- Specific course/resource names (not generic)
- Time estimates for each learning item
- Priority levels (High/Medium/Low)
- Mix of theory and practical projects
- Realistic, achievable goals

Be specific, actionable, and encouraging. Focus on skills that will help them get jobs.`;

      console.log('🤖 Calling AI to generate learning path...');
      
      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert career coach and learning path designer. You create personalized, actionable learning roadmaps that are specific, realistic, and aligned with market demand. You always include free resources, time estimates, and hands-on projects.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 2000
      });
      
      let response = completion.choices[0]?.message?.content || '';
      
      // Add personalized header
      const header = `Hey ${studentName}! 🎓\n\nI've created a personalized learning roadmap for you based on your ${department} background and current market demands. Let's level up your skills! 🚀\n\n`;
      
      // Add footer with encouragement
      const footer = `\n\n---\n\n### 💪 Next Steps:\n\n1. **Start Today**: Pick one course from the High Priority list and begin\n2. **Set Weekly Goals**: Dedicate 5-10 hours per week to learning\n3. **Build Projects**: Apply what you learn immediately\n4. **Track Progress**: Update your profile as you complete courses\n5. **Stay Consistent**: Small daily progress beats irregular bursts\n\n**Need help choosing a specific course or technology? Just ask!** I'm here to guide you every step of the way. 🌟`;
      
      return header + response + footer;
    } catch (error) {
      console.error('Error generating learning path:', error);
      return this.createFallbackLearningPath(studentProfile, userMessage);
    }
  }

  /**
   * Extract in-demand skills from job opportunities
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
        } catch (e) {
          // Ignore parse errors
        }
      }
      
      skills.forEach(skill => {
        if (skill && typeof skill === 'string') {
          const normalized = skill.toLowerCase().trim();
          skillsMap.set(normalized, (skillsMap.get(normalized) || 0) + 1);
        }
      });
    });
    
    // Sort by frequency and return top skills
    return Array.from(skillsMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([skill]) => skill);
  }

  /**
   * Fallback learning path when AI fails
   */
  private createFallbackLearningPath(studentProfile: StudentProfile, userMessage: string): string {
    const studentName = studentProfile.name?.split(' ')[0] || 'there';
    const currentSkills = studentProfile.profile?.technicalSkills || [];
    
    return `Hey ${studentName}! 🎓

I'd love to create a personalized learning path for you. Based on your profile, here's a general roadmap:

### 🎯 Your Current Skills:
${currentSkills.length > 0 ? currentSkills.map((s: any) => `- ${s.name}`).join('\n') : '- Add your skills to your profile for better recommendations'}

### 📈 Recommended Learning Path:

**Phase 1: Foundation (Weeks 1-4)**
- Master the basics of your core technologies
- Complete beginner-friendly projects
- Build a strong GitHub portfolio

**Phase 2: Intermediate (Weeks 5-12)**
- Learn advanced concepts
- Build 2-3 substantial projects
- Contribute to open-source projects

**Phase 3: Specialization (Months 4-6)**
- Choose a specialization (Frontend, Backend, Full Stack, etc.)
- Learn in-demand frameworks and tools
- Build production-ready applications

### 📚 Recommended Platforms:
- **Free**: freeCodeCamp, YouTube, MDN Docs, The Odin Project
- **Paid**: Udemy, Coursera, Pluralsight, Frontend Masters

### 🛠️ Next Steps:
1. Tell me specifically what role you're targeting (e.g., "Full Stack Developer")
2. Share your career timeline (e.g., "Need a job in 6 months")
3. I'll create a detailed, week-by-week learning plan for you!

What would you like to focus on? 🚀`;
  }

  /**
   * Placeholder handlers for other features
   */
  private async handleSkillGap(message: string, studentId: string, context: any) {
    return {
      success: true,
      message: "I'm analyzing your skill gaps... (Feature in development)"
    };
  }

  private async handleInterviewPrep(message: string, studentId: string, context: any) {
    return {
      success: true,
      message: "Let me help you prepare for interviews... (Feature in development)"
    };
  }

  private async handleResumeReview(message: string, studentId: string, context: any) {
    return {
      success: true,
      message: "I can review your resume... (Feature in development)"
    };
  }

  private async handleLearningPath(message: string, studentId: string, context: any) {
    try {
      console.log('🎓 Learning Path - Starting analysis for student:', studentId);
      console.log('📝 User message:', message);

      // 1. Fetch student profile
      const studentProfile = await this.fetchStudentProfile(studentId);
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
      const learningPath = await this.generateLearningPath(studentProfile, message);

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

  private async handleCareerGuidance(message: string, studentId: string, context: any) {
    return {
      success: true,
      message: "Let me guide you on career paths... (Feature in development)"
    };
  }

  private async handleNetworking(message: string, studentId: string, context: any) {
    return {
      success: true,
      message: "Here are some networking tips... (Feature in development)"
    };
  }

  private async handleGeneralQuery(message: string, studentId: string, context: any) {
    try {
      // Fetch student profile for personalized response
      const studentProfile = await this.fetchStudentProfile(studentId);
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
      
      // For substantive questions, use intelligent context-aware prompts
      if (!studentProfile) {
        return {
          success: false,
          error: 'Unable to load your profile. Please try again.'
        };
      }
      
      // Import intelligent prompt utilities
      const { createIntelligentGeneralPrompt, detectQueryType, SYSTEM_PROMPTS } = await import('../prompts/intelligentPrompt');
      
      // Fetch market data for context
      const opportunities = await this.fetchOpportunities(studentProfile);
      const inDemandSkills = this.extractInDemandSkills(opportunities);
      
      // Build context
      const queryContext = {
        studentProfile,
        marketData: {
          inDemandSkills,
          totalJobs: opportunities.length,
          relevantJobs: opportunities.slice(0, 15)
        },
        userIntent: detectQueryType(message)
      };
      
      console.log('🧠 General query with full context - Intent:', queryContext.userIntent);
      
      // Create intelligent prompt
      const prompt = createIntelligentGeneralPrompt(queryContext, message);
      
      // Use AI with rich context
      const client = getOpenAIClient();
      const completion = await client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPTS.general
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: queryContext.userIntent === 'quick-answer' ? 500 : 800
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

// Export as named export for easier imports
export const careerAIService = new CareerAIService();

// Also export as default for flexibility
export default careerAIService;
