import { getOpenAIClient, DEFAULT_MODEL } from '@/features/career-assistant';
import { fetchlearnerProfile, fetchOpportunities } from '@/features/career-assistant';
import { buildlearnerContext, buildOpportunitiesContext } from '@/features/career-assistant';
import { createJobMatchingPrompt, JOB_MATCHING_SYSTEM_PROMPT } from '../prompts/jobMatchingPrompt';
import { AIResponse, JobMatch, LearnerProfile, LearnerContext } from '@/features/learner-profile/model';
import { buildJobMatchResponse } from "@/shared/lib/responseBuilder";
import { EnhancedAIResponse } from '@/shared/types/interactive';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('find-jobs-handler');

/**
 * Find Jobs Handler
 * Intelligently matches learner with relevant job opportunities
 */

export async function handleFindJobs(
  message: string,
  learnerId: string
): Promise<EnhancedAIResponse> {
  try {
    // 1. Fetch learner profile from database
    const learnerProfile = await fetchlearnerProfile(learnerId);
    if (!learnerProfile) {
      return {
        success: false,
        error: 'Unable to fetch your profile. Please try again.'
      };
    }

    // 2. Fetch available opportunities
    const opportunities = await fetchOpportunities();

    if (!opportunities || opportunities.length === 0) {
      return {
        success: true,
        message: "I couldn't find any active job opportunities at the moment. New opportunities are added regularly, so please check back soon! In the meantime, would you like help preparing your resume or developing new skills?"
      };
    }

    // 3. Use AI to intelligently match jobs
    const matches = await matchJobsWithAI(learnerProfile, opportunities, message);

    // 4. Generate interactive response with cards
    const response = await generateJobMatchResponse(matches, learnerProfile, message);
    const interactiveResponse = buildJobMatchResponse(
      {
        matches,
        totalOpportunities: opportunities.length
      },
      response
    );

    return interactiveResponse;
  } catch (error: any) {
    logger.error('Failed to find jobs for learner', error instanceof Error ? error : new Error(String(error)), {
      learnerId,
      messageLength: message?.length
    });
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
  learnerProfile: LearnerProfile,
  opportunities: any[],
  userQuery?: string,
  topN: number = 10
): Promise<JobMatch[]> {
  try {
    // Build learner context
    const learnerContext = buildlearnerContext(learnerProfile);

    // Build opportunities context
    const opportunitiesContext = buildOpportunitiesContext(opportunities);

    // Create the matching prompt with user query context
    const prompt = createJobMatchingPrompt(learnerContext, opportunitiesContext, topN, userQuery);

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

    // Parse response
    const parsedResponse = JSON.parse(responseContent);
    const matches = parsedResponse.matches || [];

    // Enrich matches with full opportunity data
    return matches.map((match: any) => ({
      ...match,
      opportunity: opportunities.find(opp => opp.id === match.job_id)
    })).filter((match: any) => match.opportunity);

  } catch (error) {
    logger.error('Failed to match jobs with AI', error instanceof Error ? error : new Error(String(error)), {
      learnerId: learnerProfile.id,
      opportunitiesCount: opportunities.length,
      topN
    });

    // Return fallback matches
    return createFallbackMatches(learnerProfile, opportunities, topN);
  }
}

/**
 * Generate comprehensive job listing response with card-based format
 * Shows each job as a separate card
 */
async function generateJobMatchResponse(
  matches: JobMatch[],
  learnerProfile: LearnerProfile,
  userMessage: string
): Promise<string> {
  try {
    const learnerName = learnerProfile.name?.split(' ')[0] || 'there';

    // Create intro
    let response = `Great news, ${learnerName}! 🎉\n\n`;
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
    logger.error('Failed to generate job match response', error instanceof Error ? error : new Error(String(error)), {
      learnerId: learnerProfile.id,
      matchesCount: matches.length
    });
    return createFallbackResponse(matches, learnerProfile);
  }
}

/**
 * Create fallback matches when AI fails
 */
function createFallbackMatches(
  learnerProfile: LearnerProfile,
  opportunities: any[],
  topN: number
): JobMatch[] {
  return opportunities.slice(0, topN).map((opp, idx) => ({
    job_id: opp.id,
    job_title: opp.title,
    company_name: opp.company_name,
    match_score: Math.max(50 - (idx * 5), 30),
    match_reason: `This ${opp.employment_type} opportunity at ${opp.company_name} could be a good fit for building experience in ${opp.location}.`,
    key_matching_skills: learnerProfile.profile?.technicalSkills?.slice(0, 3).map((s: any) => s.name) || [],
    skills_gap: [],
    recommendation: 'Review the job requirements and consider applying if it aligns with your career goals.',
    opportunity: opp
  }));
}

/**
 * Create fallback text response
 */
function createFallbackResponse(matches: JobMatch[], learnerProfile: LearnerProfile): string {
  const topMatch = matches[0];
  return `Great news, ${learnerProfile.name}! 🎉

I found ${matches.length} job opportunities that match your profile:

**Top Match (${topMatch.match_score}% match):**
**${topMatch.job_title}** at ${topMatch.company_name}

${topMatch.match_reason}

**Your matching skills:** ${topMatch.key_matching_skills.join(', ')}

${topMatch.skills_gap.length > 0 ? `**Skills to develop:** ${topMatch.skills_gap.join(', ')}` : ''}

**Next steps:** ${topMatch.recommendation}

Would you like help preparing your application or learning any of the required skills?`;
}
