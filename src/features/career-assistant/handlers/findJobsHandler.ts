import { getOpenAIClient, DEFAULT_MODEL } from '../services/openAIClient';
import { fetchStudentProfile, fetchOpportunities } from '../services/profileService';
import { buildStudentContext, buildOpportunitiesContext } from '../utils/contextBuilder';
import { createJobMatchingPrompt, JOB_MATCHING_SYSTEM_PROMPT } from '../prompts/jobMatchingPrompt';
import { AIResponse, JobMatch, StudentProfile, StudentContext } from '../types';
import { buildJobMatchResponse } from '../utils/responseBuilder';
import { EnhancedAIResponse } from '../types/interactive';

/**
 * Find Jobs Handler
 * Intelligently matches student with relevant job opportunities
 */

export async function handleFindJobs(
  message: string,
  studentId: string
): Promise<EnhancedAIResponse> {
  try {
    console.log('🔍 Find Jobs - Starting search for student:', studentId);
    console.log('📝 User message:', message);

    // 1. Fetch student profile from database
    const studentProfile = await fetchStudentProfile(studentId);
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
    const opportunities = await fetchOpportunities();
    console.log(`📊 Found ${opportunities.length} active opportunities`);
    
    if (!opportunities || opportunities.length === 0) {
      return {
        success: true,
        message: "I couldn't find any active job opportunities at the moment. New opportunities are added regularly, so please check back soon! In the meantime, would you like help preparing your resume or developing new skills?"
      };
    }

    // 3. Use AI to intelligently match jobs
    console.log('🤖 Starting AI matching...');
    const matches = await matchJobsWithAI(studentProfile, opportunities, message);
    console.log(`✨ AI matched ${matches.length} opportunities`);

    // 4. Generate interactive response with cards
    console.log('💬 Generating interactive response...');
    const response = await generateJobMatchResponse(matches, studentProfile, message);
    const interactiveResponse = buildJobMatchResponse(
      {
        matches,
        totalOpportunities: opportunities.length
      },
      response
    );

    return interactiveResponse;
  } catch (error: any) {
    console.error('❌ Find Jobs Error:', error);
    return {
      success: false,
      error: 'I encountered an issue while searching for jobs. Please try again.'
    };
  }
}

/**
 * Match jobs using AI with intelligent analysis
 */
async function matchJobsWithAI(
  studentProfile: StudentProfile,
  opportunities: any[],
  userQuery?: string,
  topN: number = 10
): Promise<JobMatch[]> {
  try {
    // Build student context
    const studentContext = buildStudentContext(studentProfile);

    // Build opportunities context
    const opportunitiesContext = buildOpportunitiesContext(opportunities);

    // Create the matching prompt with user query context
    const prompt = createJobMatchingPrompt(studentContext, opportunitiesContext, topN, userQuery);
    
    console.log('📤 Sending prompt to OpenAI...');
    console.log('Student:', studentContext.name, '|', studentContext.department);
    console.log('Skills:', studentContext.technical_skills.length, 'technical,', studentContext.soft_skills.length, 'soft');
    console.log('Opportunities to analyze:', opportunities.length);

    // Call OpenAI API
    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: JOB_MATCHING_SYSTEM_PROMPT
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

    console.log('📥 Received AI response, parsing...');
    
    // Parse response
    const parsedResponse = JSON.parse(responseContent);
    const matches = parsedResponse.matches || [];
    
    console.log(`✅ Parsed ${matches.length} job matches from AI`);
    if (matches.length > 0) {
      console.log('Top match:', matches[0].job_title, '-', matches[0].match_score + '%');
    }

    // Enrich matches with full opportunity data
    return matches.map((match: any) => ({
      ...match,
      opportunity: opportunities.find(opp => opp.id === match.job_id)
    })).filter((match: any) => match.opportunity);

  } catch (error: any) {
    console.error('❌ AI Matching Error:', error);
    console.error('Error details:', error.message);
    
    // Return fallback matches
    console.log('⚠️ Using fallback matching logic');
    return createFallbackMatches(studentProfile, opportunities, topN);
  }
}

/**
 * Generate comprehensive job listing response with card-based format
 * Shows each job as a separate card
 */
async function generateJobMatchResponse(
  matches: JobMatch[],
  studentProfile: StudentProfile,
  userMessage: string
): Promise<string> {
  try {
    const studentName = studentProfile.name?.split(' ')[0] || 'there';
    
    // Create intro
    let response = `Great news, ${studentName}! 🎉\n\n`;
    response += `I found ${matches.length} job opportunities that match your profile:\n\n`;
    
    // Show each job as a separate card
    matches.forEach((match, idx) => {
      const job = match.opportunity;
      const matchEmoji = match.match_score >= 75 ? '⭐' : match.match_score >= 60 ? '✅' : '💡';
      
      // Card number and title
      response += `### ${idx + 1}. ${matchEmoji} **${match.job_title}** at **${match.company_name}**\n`;
      response += `**Match Score: ${match.match_score}%** | ${job.employment_type} | ${job.location} | ${job.mode || 'Hybrid'}\n\n`;
      
      // Why it's a great fit
      response += `**Why it's a great fit:**\n`;
      response += `${match.match_reason}\n\n`;
      
      // Matching skills
      if (match.key_matching_skills.length > 0) {
        response += `**Your matching skills:** ${match.key_matching_skills.join(', ')}\n\n`;
      }
      
      // Skills to develop
      if (match.skills_gap.length > 0) {
        response += `**Skills to develop:** ${match.skills_gap.join(', ')}\n\n`;
      }
      
      // Salary info
      if (job.stipend_or_salary) {
        response += `**💰 Salary:** ${job.stipend_or_salary}\n\n`;
      }
      
      // Deadline with days calculation
      if (job.deadline) {
        const deadline = new Date(job.deadline);
        const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
const dateStr = deadline.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        response += `**⏰ Deadline:** ${dateStr}`;
        if (daysLeft > 0) {
          response += ` (${daysLeft} days left)`;
        }
        response += `\n\n`;
      }
      
      // Action recommendation
      response += `**🎯 Action:** ${match.recommendation}\n\n`;
      
      // Card separator
      response += `---\n\n`;
    });
    
    // Footer with help offer
    response += `Would you like help preparing your application or learning any of the required skills?`;
    
    return response;
  } catch (error) {
    console.error('Error generating response:', error);
    return createFallbackResponse(matches, studentProfile);
  }
}

/**
 * Create fallback matches when AI fails
 */
function createFallbackMatches(
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
function createFallbackResponse(matches: JobMatch[], studentProfile: StudentProfile): string {
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
