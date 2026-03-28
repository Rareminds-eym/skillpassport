import { supabase } from '@/shared/api';

export interface SkillDemandData {
  skill: string;
  total_mentions: number;
}

class AnalyticsService {
  /**
   * Analyze skills demand across job opportunities
   * @returns Array of skills with their demand count
   */
  async analyzeSkillsDemand(): Promise<SkillDemandData[]> {
    const { data, error } = await supabase.rpc('analyze_skills_demand');
    
    if (error) {
      console.error('Error analyzing skills demand:', error);
      throw error;
    }
    
    return data || [];
  }
}

export const analyticsService = new AnalyticsService();
