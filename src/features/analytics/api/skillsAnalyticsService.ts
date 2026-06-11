import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('skills-analytics-service');

export class SkillsAnalyticsService {
  static DEBUG = false;

  static log(message: string, data: any = null) {
    if (this.DEBUG) logger.warn(message, data || undefined);
  }

  static error(message: string, error: any = null) {
    logger.error(message, error instanceof Error ? error : new Error(String(error || message)));
  }

  static async debugOpportunitiesTable() {
    try {
      this.log('=== DEBUGGING OPPORTUNITIES TABLE ===');
      const response: any = await apiPost('/analytics/data', { action: 'debug-opportunities' });
      this.log('Debug result:', response.data);
    } catch (error) {
      this.error('Error in debugOpportunitiesTable:', error);
    }
  }

  static parseSkills(skillsData: any): string[] {
    if (!skillsData) return [];
    let skills: string[] = [];
    try {
      if (Array.isArray(skillsData)) {
        skills = skillsData.filter((s: any) => s && typeof s === 'string');
      } else if (typeof skillsData === 'string') {
        const separators = [',', ';', '|', '\n', '•', '-'];
        let bestSplit = [skillsData];
        for (const sep of separators) {
          if (skillsData.includes(sep)) {
            const split = skillsData.split(sep);
            if (split.length > bestSplit.length) bestSplit = split;
          }
        }
        skills = bestSplit.map((s: string) => s.trim()).filter(Boolean);
      } else if (typeof skillsData === 'object') {
        if (skillsData.skills) return this.parseSkills(skillsData.skills);
        else if (skillsData.name) skills = [skillsData.name];
        else skills = Object.values(skillsData).filter((v: any) => typeof v === 'string').map((v: string) => v.trim()).filter(Boolean);
      }
    } catch (error) {
      this.error('Error parsing skills:', error);
      return [];
    }
    return skills.map((s: string) => s.trim().replace(/^[-•\s]+/, '').replace(/[.,:;]+$/, '').replace(/\s+/g, ' ').trim())
      .filter((s: string) => s.length > 1 && s.length < 100 && !/^\d+$/.test(s) && /[a-zA-Z]/.test(s));
  }

  static async getTopSkillsInDemand(limit = 5) {
    try {
      this.log(`Starting getTopSkillsInDemand with limit: ${limit}`);
      const response: any = await apiPost('/analytics/data', { action: 'get-top-skills-demand', limit });
      return response.data || [];
    } catch (error) {
      this.error('Error in getTopSkillsInDemand:', error);
      return [];
    }
  }

  static async getSkillsDemandAnalysis(limit = 5) {
    try {
      const response: any = await apiPost('/analytics/data', { action: 'get-skills-demand', limit });
      return response.data || {
        topSkills: [], totalOpportunities: 0, lastUpdated: new Date().toISOString(),
        analysis: { mostDemandedSkill: null, averageDemand: 0 }
      };
    } catch (error) {
      logger.error('Error in getSkillsDemandAnalysis', error instanceof Error ? error : new Error(String(error)));
      return { topSkills: [], totalOpportunities: 0, lastUpdated: new Date().toISOString(), analysis: { mostDemandedSkill: null, averageDemand: 0 } };
    }
  }
}

export default SkillsAnalyticsService;
