// Smart Opportunities Fetcher - AI-Driven Context-Aware Job Matching

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Opportunity, StudentProfile, StoredMessage } from '../types';

interface FetchContext {
  userMessage: string;
  conversationHistory: StoredMessage[];
  studentProfile: StudentProfile;
  intent: string;
  openRouterKey: string;
}

interface OpportunityFilters {
  location?: string;
  employmentType?: string;
  experienceLevel?: string;
  skills?: string[];
  searchQuery?: string;
  limit?: number;
}

interface AIFilterResponse {
  searchTerms: string[];
  location?: string;
  employmentType?: string;
  reasoning: string;
}

/**
 * Use AI to intelligently extract search filters from conversation
 * Uses chain-of-thought reasoning for accurate filter extraction
 */
async function extractFiltersWithAI(context: FetchContext): Promise<OpportunityFilters> {
  const { userMessage, conversationHistory, studentProfile, openRouterKey } = context;
  
  const recentContext = conversationHistory
    .slice(-5)
    .map(m => `${m.role}: ${m.content}`)
    .join('\n');

  const studentSkills = studentProfile.technicalSkills.map(s => s.name).join(', ') || 'None listed';
  const studentExperience = studentProfile.experience?.map(e => e.title || e.role).join(', ') || 'No experience';
  const studentField = studentProfile.department || 'Not specified';

  const prompt = `You are an expert job search analyst. Extract precise search filters from the user's message.

<student_profile>
Field: ${studentField}
Skills: ${studentSkills}
Experience: ${studentExperience}
</student_profile>

<conversation_history>
${recentContext || 'No previous conversation'}
</conversation_history>

<current_message>
${userMessage}
</current_message>

<instructions>
Analyze the message and extract:

1. searchTerms: Extract ALL relevant keywords from the user's message
   - Include exact phrases if they mention job titles
   - Include individual words that are meaningful
   - Include technologies/skills mentioned
   - If message is vague, use student's top skills
   - Return 2-5 terms

2. location: Extract ONLY if explicitly mentioned
   - City names, "remote", "hybrid", etc.
   - Return null if not mentioned

3. employmentType: Extract ONLY if explicitly stated
   - Must be one of: "Internship", "Full-time", "Part-time", "Contract"
   - Return null if not mentioned

4. reasoning: Brief explanation of what you extracted and why
</instructions>

<output>
Return ONLY valid JSON:
{
  "searchTerms": ["term1", "term2"],
  "location": "value or null",
  "employmentType": "value or null",
  "reasoning": "explanation"
}
</output>

JSON:`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://skillpassport.co',
        'X-Title': 'SkillPassport Career AI'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3-haiku', // Faster, cheaper model for extraction
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1, // Lower for faster, more deterministic responses
        max_tokens: 400 // Reduced from 600
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ AI filter extraction failed (${response.status}):`, errorText);
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    
    // Extract JSON from response (handle markdown code blocks and extra text)
    let jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // Try to find JSON after "JSON:" marker
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        jsonMatch = [content.substring(jsonStart, jsonEnd + 1)];
      }
    }
    
    const aiResponse: AIFilterResponse = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    console.log('🤖 AI Filter Reasoning:', aiResponse.reasoning);
    console.log('🔍 Extracted Terms:', aiResponse.searchTerms);

    // Build filters from AI response
    const filters: OpportunityFilters = { limit: 15 };
    
    // Search terms
    if (aiResponse.searchTerms && Array.isArray(aiResponse.searchTerms) && aiResponse.searchTerms.length > 0) {
      filters.searchQuery = aiResponse.searchTerms
        .filter(term => term && typeof term === 'string')
        .slice(0, 5)
        .join(' ');
    }
    
    // Location (only if explicitly provided)
    if (aiResponse.location && aiResponse.location !== 'null' && aiResponse.location.trim() !== '') {
      filters.location = aiResponse.location;
    }
    
    // Employment type (only if explicitly provided and valid)
    const validTypes = ['Internship', 'Full-time', 'Part-time', 'Contract'];
    if (aiResponse.employmentType && validTypes.includes(aiResponse.employmentType)) {
      filters.employmentType = aiResponse.employmentType;
    }

    // Experience level from profile
    const experienceCount = studentProfile.experience?.length || 0;
    if (experienceCount === 0) {
      filters.experienceLevel = 'entry';
    } else if (experienceCount <= 2) {
      filters.experienceLevel = 'junior';
    } else {
      filters.experienceLevel = 'mid';
    }

    return filters;

  } catch (error) {
    console.error('❌ AI filter extraction failed, using intelligent fallback:', error);
    
    // Intelligent fallback: Use student's profile intelligently
    const topSkills = studentProfile.technicalSkills
      .slice(0, 3)
      .map(s => s.name)
      .filter(name => name && name.trim() !== '');

    return {
      searchQuery: topSkills.length > 0 ? topSkills.join(' ') : studentProfile.department || '',
      experienceLevel: studentProfile.experience?.length === 0 ? 'entry' : 'junior',
      limit: 15
    };
  }
}

/**
 * Build dynamic Supabase query based on filters
 * Uses intelligent query construction for optimal results
 */
function buildQuery(
  supabase: SupabaseClient,
  filters: OpportunityFilters
) {
  let query = supabase
    .from('opportunities')
    .select('*')
    .eq('is_active', true)
    .eq('status', 'open');
  
  // Location filter - flexible matching
  if (filters.location) {
    // Handle "Remote" specially - match various remote patterns
    if (filters.location.toLowerCase() === 'remote') {
      query = query.or('location.ilike.%remote%,location.ilike.%work from home%,location.ilike.%wfh%');
    } else {
      // For cities, match the city name anywhere in location field
      query = query.ilike('location', `%${filters.location}%`);
    }
  }
  
  // Employment type filter - exact match
  if (filters.employmentType) {
    // Handle case-insensitive matching for employment type
    query = query.ilike('employment_type', filters.employmentType);
  }
  
  // Search query - intelligent multi-field search
  // Don't apply search filter at DB level - do it in-memory for more flexibility
  // This allows us to match any of the search terms, not all of them
  
  // Order by relevance: newest first
  return query
    .order('created_at', { ascending: false })
    .limit(100); // Fetch more to ensure we have enough after filtering
}

/**
 * Calculate skill match score for ranking
 * Matches student skills against job requirements
 */
function calculateMatchScore(
  opportunity: any,
  studentSkills: string[],
  searchTerms: string[]
): number {
  if (studentSkills.length === 0) return 0;
  
  let score = 0;
  const requiredSkills = Array.isArray(opportunity.skills_required)
    ? opportunity.skills_required
    : [];
  
  const studentSkillsLower = studentSkills.map(s => s.toLowerCase());
  const searchTermsLower = searchTerms.map(s => s.toLowerCase());
  
  // Score based on required skills match
  if (requiredSkills.length > 0) {
    const matchingSkills = requiredSkills.filter((skill: string) =>
      studentSkillsLower.some(s => skill.toLowerCase().includes(s) || s.includes(skill.toLowerCase()))
    );
    score += Math.round((matchingSkills.length / requiredSkills.length) * 60);
  }
  
  // Bonus score for search term matches in skills
  if (searchTermsLower.length > 0 && requiredSkills.length > 0) {
    const searchMatches = requiredSkills.filter((skill: string) =>
      searchTermsLower.some(term => skill.toLowerCase().includes(term) || term.includes(skill.toLowerCase()))
    );
    score += Math.min(searchMatches.length * 10, 40);
  }
  
  return Math.min(score, 100);
}

/**
 * Check if opportunity matches search terms
 */
function matchesSearchTerms(opportunity: any, searchQuery: string): boolean {
  if (!searchQuery) return true;
  
  const searchTerms = searchQuery.toLowerCase().split(' ').filter(t => t.length > 2);
  if (searchTerms.length === 0) return true;
  
  const title = (opportunity.title || '').toLowerCase();
  const description = (opportunity.description || '').toLowerCase();
  const company = (opportunity.company_name || '').toLowerCase();
  const location = (opportunity.location || '').toLowerCase();
  
  // Properly handle skills array
  const skills = Array.isArray(opportunity.skills_required) 
    ? opportunity.skills_required.map((s: string) => s.toLowerCase()).join(' ')
    : '';
  
  const combinedText = `${title} ${description} ${company} ${location} ${skills}`;
  
  // Match if ANY search term is found (more lenient)
  const matches = searchTerms.some(term => combinedText.includes(term));
  
  if (!matches) {
    console.log(`❌ No match for "${opportunity.title}": searched for [${searchTerms.join(', ')}] in "${combinedText.substring(0, 100)}..."`);
  } else {
    console.log(`✅ Match found for "${opportunity.title}": [${searchTerms.join(', ')}]`);
  }
  
  return matches;
}

/**
 * Smart fetch with AI-driven context-aware filtering and ranking
 */
export async function fetchSmartOpportunities(
  supabase: SupabaseClient,
  context: FetchContext
): Promise<Opportunity[]> {
  try {
    // Quick path: If user message is generic, skip AI extraction
    const isGenericQuery = /^(what|show|find|get|list).*(job|position|role|opportunit)/i.test(context.userMessage);
    
    let filters: OpportunityFilters;
    
    if (isGenericQuery && context.userMessage.length < 50) {
      // Fast path: Use student skills directly without AI call
      console.log('⚡ Fast path: Using student skills directly');
      filters = {
        searchQuery: context.studentProfile.technicalSkills
          .slice(0, 3)
          .map(s => s.name)
          .join(' '),
        experienceLevel: context.studentProfile.experience?.length === 0 ? 'entry' : 'junior',
        limit: 15
      };
    } else {
      // AI path: Extract filters intelligently
      filters = await extractFiltersWithAI(context);
    }
    
    console.log('🎯 Smart Opportunity Filters:', filters);
    
    // Build and execute query
    const query = buildQuery(supabase, filters);
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error fetching opportunities:', error);
      return [];
    }
    
    if (!data || data.length === 0) {
      console.log('📭 No opportunities in database (is_active=true, status=open)');
      return [];
    }
    
    console.log(`📦 Fetched ${data.length} opportunities from database`);
    
    // Log unique employment types to understand database values
    const employmentTypes = [...new Set(data.map((opp: any) => opp.employment_type))];
    console.log(`📊 Employment types in DB:`, employmentTypes);
    
    // Parse and enrich opportunities
    const opportunities = data.map((opp: any) => {
      let skills: string[] = [];
      
      // Handle different formats of skills_required
      if (Array.isArray(opp.skills_required)) {
        skills = opp.skills_required;
      } else if (typeof opp.skills_required === 'string') {
        const skillsStr = opp.skills_required.trim();
        
        // Try parsing as JSON first
        if (skillsStr.startsWith('[') || skillsStr.startsWith('{')) {
          try {
            skills = JSON.parse(skillsStr);
          } catch {
            // If JSON parse fails, treat as comma-separated string
            skills = skillsStr.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
          }
        } else {
          // Plain comma-separated string
          skills = skillsStr.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
        }
      }
      
      return {
        ...opp,
        skills_required: skills
      };
    });
    
    console.log(`📋 Sample opportunity:`, {
      title: opportunities[0]?.title,
      company: opportunities[0]?.company_name,
      location: opportunities[0]?.location,
      skills: opportunities[0]?.skills_required
    });
    
    // Filter by search terms in-memory (more flexible than SQL)
    const searchTerms = filters.searchQuery ? filters.searchQuery.split(' ').filter(t => t.length > 2) : [];
    
    let filteredOpportunities = opportunities;
    
    // Only apply search filter if we have search terms
    if (searchTerms.length > 0) {
      filteredOpportunities = opportunities.filter(opp => 
        matchesSearchTerms(opp, filters.searchQuery || '')
      );
      
      console.log(`🔍 After search filter: ${filteredOpportunities.length} opportunities`);
      
      // If search is too restrictive, return all opportunities ranked by match
      if (filteredOpportunities.length === 0) {
        console.log('⚠️ Search too restrictive, returning all opportunities ranked by relevance');
        filteredOpportunities = opportunities;
      }
    } else {
      console.log('📋 No search terms, showing all opportunities');
    }
    
    if (filteredOpportunities.length === 0) {
      console.log('📭 No opportunities matched search criteria, returning all fetched');
      // Return all opportunities if search is too restrictive
      const studentSkills = context.studentProfile.technicalSkills.map(s => s.name);
      return opportunities
        .map(opp => ({
          ...opp,
          matchScore: calculateMatchScore(opp, studentSkills, searchTerms)
        }))
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, filters.limit || 15);
    }
    
    // Calculate match scores and sort by relevance
    const studentSkills = context.studentProfile.technicalSkills.map(s => s.name);
    const rankedOpportunities = filteredOpportunities
      .map(opp => ({
        ...opp,
        matchScore: calculateMatchScore(opp, studentSkills, searchTerms)
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, filters.limit || 15); // Limit final results
    
    console.log(`✅ Returning ${rankedOpportunities.length} opportunities (top match: ${rankedOpportunities[0]?.matchScore}%)`);
    
    return rankedOpportunities;
    
  } catch (error) {
    console.error('❌ Error in fetchSmartOpportunities:', error);
    return [];
  }
}

/**
 * Fallback: Fetch all active opportunities (for non-job-related queries)
 */
export async function fetchAllOpportunities(
  supabase: SupabaseClient,
  limit: number = 100
): Promise<Opportunity[]> {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('is_active', true)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error fetching all opportunities:', error);
      return [];
    }
    
    return (data || []).map((opp: any) => ({
      ...opp,
      skills_required: Array.isArray(opp.skills_required)
        ? opp.skills_required
        : typeof opp.skills_required === 'string'
          ? JSON.parse(opp.skills_required || '[]')
          : []
    }));
  } catch (error) {
    console.error('Error in fetchAllOpportunities:', error);
    return [];
  }
}
