// Opportunities Fetcher - Basic fetcher (use smart-opportunities.ts for context-aware fetching)

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Opportunity } from '../types';

/**
 * Basic opportunity fetcher - fetches all active opportunities
 * For context-aware fetching, use fetchSmartOpportunities from smart-opportunities.ts
 */
export async function fetchOpportunities(
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
      console.error('Error fetching opportunities:', error);
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
    console.error('Error in fetchOpportunities:', error);
    return [];
  }
}
