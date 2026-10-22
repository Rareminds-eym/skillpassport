// Smart Opportunities Fetcher - Deterministic Context-Aware Job Matching

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Opportunity, LearnerProfile, StoredMessage } from '../types';
import { deriveOpportunityFilters, type OpportunityFilters } from './opportunity-filters';

interface FetchContext {
  userMessage: string;
  conversationHistory: StoredMessage[];
  learnerProfile: LearnerProfile;
  intent: string;
  /** Pages env (request-scoped) — retained for caller compatibility; never used for inference. */
  env: unknown;
}

/**
 * Build dynamic Supabase query based on filters
 * Uses intelligent query construction for optimal results
 */
export function buildQuery(
  supabase: SupabaseClient,
  filters: OpportunityFilters,
  columns = '*'
) {
  let query = supabase
    .from('opportunities')
    .select(columns)
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
 * Matches learner skills against job requirements
 */
export function calculateMatchScore(
  opportunity: any,
  learnerSkills: string[],
  searchTerms: string[]
): number {
  if (learnerSkills.length === 0) return 0;
  
  let score = 0;
  const requiredSkills = Array.isArray(opportunity.skills_required)
    ? opportunity.skills_required
    : [];
  
  const learnerSkillsLower = learnerSkills.map(s => s.toLowerCase());
  const searchTermsLower = searchTerms.map(s => s.toLowerCase());
  
  // Score based on required skills match
  if (requiredSkills.length > 0) {
    const matchingSkills = requiredSkills.filter((skill: string) =>
      learnerSkillsLower.some(s => skill.toLowerCase().includes(s) || s.includes(skill.toLowerCase()))
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
export function matchesSearchTerms(opportunity: any, searchQuery: string): boolean {
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
  
  return matches;
}

/**
 * Smart fetch with deterministic filtering and existing ranking
 */
export async function fetchSmartOpportunities(
  supabase: SupabaseClient,
  context: FetchContext
): Promise<Opportunity[]> {
  try {
    const filters = deriveOpportunityFilters({
      message: context.userMessage,
      skills: context.learnerProfile.technicalSkills.map(skill => skill.name),
      department: context.learnerProfile.department,
      experienceCount: context.learnerProfile.experience?.length ?? 0,
    });

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
      const learnerSkills = context.learnerProfile.technicalSkills.map(s => s.name);
      return opportunities
        .map(opp => ({
          ...opp,
          matchScore: calculateMatchScore(opp, learnerSkills, searchTerms)
        }))
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, filters.limit || 15);
    }
    
    // Calculate match scores and sort by relevance
    const learnerSkills = context.learnerProfile.technicalSkills.map(s => s.name);
    const rankedOpportunities = filteredOpportunities
      .map(opp => ({
        ...opp,
        matchScore: calculateMatchScore(opp, learnerSkills, searchTerms)
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
