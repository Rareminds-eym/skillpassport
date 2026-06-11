import { apiPost } from '@/shared/api/apiClient';

/**
 * Service for analyzing skills demand from opportunities
 */
export class SkillsAnalyticsService {
  static DEBUG = true; // Enable debugging

  static log(message, data = null) {
    if (this.DEBUG) {
      console.log(`[SkillsAnalytics] ${message}`, data || '');
    }
  }

  static error(message, error = null) {
    console.error(`[SkillsAnalytics ERROR] ${message}`, error || '');
  }

  /**
   * Debug method to check opportunities table structure and data
   */
  static async debugOpportunitiesTable() {
    try {
      this.log('=== DEBUGGING OPPORTUNITIES TABLE ===');

      const response = await apiPost('/recruiter-pipeline', { action: 'debug-opportunities-table' });

      if (!response) {
        this.error('Error fetching debug data: no response');
        return;
      }

      const data = response.data || response;

      this.log('Sample opportunity structure:', Object.keys(data.samples?.[0] || {}));

      if (data.samples?.length > 0) {
        this.log('=== SKILL FORMAT ANALYSIS ===');
        data.samples.forEach((sample, index) => {
          this.log(`Sample ${index + 1}:`);
          this.log(`  ID: ${sample.id}, Title: ${sample.job_title}`);
          this.log(`  Skills Type: ${typeof sample.skills_required}`);
          this.log(`  Is Array: ${Array.isArray(sample.skills_required)}`);
          this.log(`  Raw Skills:`, sample.skills_required);

          if (sample.skills_required) {
            const parsed = this.parseSkills(sample.skills_required);
            this.log(`  Parsed Skills (${parsed.length}):`, parsed);
          }
          this.log('  ---');
        });
      }

      this.log(`Total opportunities in table: ${data.totalCount}`);
      this.log(`Active opportunities: ${data.activeCount}`);
      this.log(`Active opportunities with skills: ${data.skillsCount}`);

      if (data.formatDistribution) {
        this.log('Skill format distribution (sample of 100):', data.formatDistribution);
      }

      this.log('=== DEBUG COMPLETE ===');
    } catch (error) {
      this.error('Error in debugOpportunitiesTable:', error);
    }
  }
  /**
   * Parse skills from various formats (array, string, comma-separated, etc.)
   * @param {any} skillsData - Skills data in any format
   * @returns {Array<string>} Array of normalized skill strings
   */
  static parseSkills(skillsData) {
    if (!skillsData) return [];

    let skills = [];

    try {
      // Handle array format
      if (Array.isArray(skillsData)) {
        skills = skillsData.filter(skill => skill && typeof skill === 'string');
      }
      // Handle string format (comma-separated, semicolon-separated, etc.)
      else if (typeof skillsData === 'string') {
        // Try different separators
        const separators = [',', ';', '|', '\n', '•', '-'];
        let bestSplit = [skillsData]; // Default to single skill
        
        for (const separator of separators) {
          if (skillsData.includes(separator)) {
            const split = skillsData.split(separator);
            if (split.length > bestSplit.length) {
              bestSplit = split;
            }
          }
        }
        
        skills = bestSplit
          .map(skill => skill.trim())
          .filter(skill => skill.length > 0);
      }
      // Handle object format (in case skills are stored as objects)
      else if (typeof skillsData === 'object') {
        // Try to extract skills from object properties
        if (skillsData.skills) {
          return this.parseSkills(skillsData.skills);
        } else if (skillsData.name) {
          skills = [skillsData.name];
        } else {
          // Convert object values to skills
          skills = Object.values(skillsData)
            .filter(value => typeof value === 'string')
            .map(value => value.trim())
            .filter(value => value.length > 0);
        }
      }
    } catch (error) {
      this.error('Error parsing skills:', error);
      return [];
    }

    // Normalize and clean skills
    return skills
      .map(skill => {
        // Remove common prefixes/suffixes and normalize
        return skill
          .trim()
          .replace(/^[-•\s]+/, '') // Remove leading bullets/dashes
          .replace(/[.,:;]+$/, '') // Remove trailing punctuation
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
      })
      .filter(skill => {
        // Filter out invalid skills
        return skill.length > 1 && 
               skill.length < 100 && 
               !/^\d+$/.test(skill) && // Not just numbers
               !/^[^a-zA-Z]*$/.test(skill); // Contains at least one letter
      });
  }

  /**
   * Fetch and analyze top skills in demand from opportunities
   * @param {number} limit - Number of top skills to return (default: 5)
   * @returns {Promise<Array>} Array of skills with their demand count
   */
  static async getTopSkillsInDemand(limit = 5) {
    try {
      this.log(`Starting getTopSkillsInDemand with limit: ${limit}`);

      const response = await apiPost('/recruiter-pipeline', { action: 'get-top-skills-in-demand', limit });

      if (!response) {
        this.error('Error fetching skills: no response');
        return [];
      }

      const data = response?.data?.skills || [];

      this.log(`Fetched skills data from backend`);

      if (data.length === 0) {
        this.log('No opportunities found with skills_required');
        return [];
      }

      this.log(`Top ${limit} skills for display:`, data);

      return data;
    } catch (error) {
      this.error('Error in getTopSkillsInDemand:', error);
      return [];
    }
  }

  /**
   * Get skills demand with additional metadata
   * @param {number} limit - Number of top skills to return
   * @returns {Promise<Object>} Object with skills data and metadata
   */
  static async getSkillsDemandAnalysis(limit = 5) {
    try {
      const topSkills = await this.getTopSkillsInDemand(limit);

      const response = await apiPost('/recruiter-pipeline', { action: 'get-skills-demand-analysis', limit });

      const analysisData = response?.data || response || {};
      const totalOpportunities = analysisData.totalOpportunities || 0;

      return {
        topSkills,
        totalOpportunities,
        lastUpdated: new Date().toISOString(),
        analysis: {
          mostDemandedSkill: topSkills[0]?.skill || null,
          averageDemand: topSkills.length > 0
            ? Math.round(topSkills.reduce((sum, skill) => sum + skill.count, 0) / topSkills.length)
            : 0
        }
      };
    } catch (error) {
      console.error('Error in getSkillsDemandAnalysis:', error);
      return {
        topSkills: [],
        totalOpportunities: 0,
        lastUpdated: new Date().toISOString(),
        analysis: {
          mostDemandedSkill: null,
          averageDemand: 0
        }
      };
    }
  }
}

export default SkillsAnalyticsService;