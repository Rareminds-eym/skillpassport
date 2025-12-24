// Opportunities Fetcher - Cloudflare Workers Version

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Opportunity } from '../types/career-ai';

export async function fetchOpportunities(
  supabase: SupabaseClient, 
  limit: number = 100
): Promise<Opportunity[]> {
  try {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('is_active', true)
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
