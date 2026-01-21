import { supabase } from '../lib/supabaseClient';

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

      // Check table structure by fetching sample records
      const { data: samples, error: sampleError } = await supabase
        .from('opportunities')
        .select('*')
        .limit(5);

      if (sampleError) {
        this.error('Error fetching sample opportunities:', sampleError);
        return;
      }

      if (samples && samples.length > 0) {
        this.log('Sample opportunity structure:', Object.keys(samples[0]));

        // Analyze different skill formats in the samples
        this.log('=== SKILL FORMAT ANALYSIS ===');
        samples.forEach((sample, index) => {
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

      // Count total opportunities
      const { count: totalCount } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true });

      this.log(`Total opportunities in table: ${totalCount}`);

      // Count active opportunities
      const { count: activeCount } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      this.log(`Active opportunities: ${activeCount}`);

      // Count opportunities with skills
      const { count: skillsCount } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .not('skills_required', 'is', null);

      this.log(`Active opportunities with skills: ${skillsCount}`);

      // Analyze skill format distribution
      const { data: allSkillsData } = await supabase
        .from('opportunities')
        .select('skills_required')
        .eq('is_active', true)
        .not('skills_required', 'is', null)
        .limit(100); // Sample first 100

      if (allSkillsData) {
        const formatCounts = {
          array: 0,
          string: 0,
          object: 0,
          other: 0,
        };

        allSkillsData.forEach((item) => {
          const skills = item.skills_required;
          if (Array.isArray(skills)) {
            formatCounts.array++;
          } else if (typeof skills === 'string') {
            formatCounts.string++;
          } else if (typeof skills === 'object') {
            formatCounts.object++;
          } else {
            formatCounts.other++;
          }
        });

        this.log('Skill format distribution (sample of 100):', formatCounts);
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
        skills = skillsData.filter((skill) => skill && typeof skill === 'string');
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

        skills = bestSplit.map((skill) => skill.trim()).filter((skill) => skill.length > 0);
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
            .filter((value) => typeof value === 'string')
            .map((value) => value.trim())
            .filter((value) => value.length > 0);
        }
      }
    } catch (error) {
      this.error('Error parsing skills:', error);
      return [];
    }

    // Normalize and clean skills
    return skills
      .map((skill) => {
        // Remove common prefixes/suffixes and normalize
        return skill
          .trim()
          .replace(/^[-•\s]+/, '') // Remove leading bullets/dashes
          .replace(/[.,:;]+$/, '') // Remove trailing punctuation
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
      })
      .filter((skill) => {
        // Filter out invalid skills
        return (
          skill.length > 1 &&
          skill.length < 100 &&
          !/^\d+$/.test(skill) && // Not just numbers
          !/^[^a-zA-Z]*$/.test(skill)
        ); // Contains at least one letter
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

      // Fetch all active opportunities with their skills_required field
      this.log('Fetching opportunities from database...');
      const { data: opportunities, error } = await supabase
        .from('opportunities')
        .select('skills_required, job_title, id')
        .eq('is_active', true)
        .not('skills_required', 'is', null);

      if (error) {
        this.error('Error fetching opportunities:', error);
        return [];
      }

      this.log(`Fetched ${opportunities?.length || 0} opportunities`);

      if (!opportunities || opportunities.length === 0) {
        this.log('No opportunities found with skills_required');
        return [];
      }

      // Debug: Show sample opportunities with different formats
      this.log('Sample opportunities with skill formats:');
      opportunities.slice(0, 5).forEach((opp, index) => {
        this.log(`  ${index + 1}. ID: ${opp.id}, Title: ${opp.job_title}`);
        this.log(
          `     Skills Type: ${typeof opp.skills_required}, IsArray: ${Array.isArray(opp.skills_required)}`
        );
        this.log(`     Raw Skills:`, opp.skills_required);
        this.log(`     Parsed Skills:`, this.parseSkills(opp.skills_required));
      });

      // Count skill occurrences with enhanced parsing
      this.log('Starting enhanced skill analysis...');
      const skillCounts = {};
      let processedOpportunities = 0;
      let totalSkillsFound = 0;
      const formatStats = {
        array: 0,
        string: 0,
        object: 0,
        other: 0,
        empty: 0,
      };

      opportunities.forEach((opportunity) => {
        const skillsData = opportunity.skills_required;

        // Track format statistics
        if (!skillsData) {
          formatStats.empty++;
          return;
        } else if (Array.isArray(skillsData)) {
          formatStats.array++;
        } else if (typeof skillsData === 'string') {
          formatStats.string++;
        } else if (typeof skillsData === 'object') {
          formatStats.object++;
        } else {
          formatStats.other++;
        }

        // Parse skills using the enhanced parser
        const parsedSkills = this.parseSkills(skillsData);

        if (parsedSkills.length > 0) {
          processedOpportunities++;

          parsedSkills.forEach((skill) => {
            const normalizedSkill = skill.trim();
            if (normalizedSkill) {
              skillCounts[normalizedSkill] = (skillCounts[normalizedSkill] || 0) + 1;
              totalSkillsFound++;
            }
          });
        }
      });

      this.log('Format Statistics:', formatStats);
      this.log(`Processed ${processedOpportunities} opportunities with skills`);
      this.log(`Found ${totalSkillsFound} total skill entries`);
      this.log(`Unique skills count: ${Object.keys(skillCounts).length}`);

      // Show top 10 skills for debugging
      const topSkillsDebug = Object.entries(skillCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      this.log('Top 10 skills found:', topSkillsDebug);

      // Convert to array and sort by count
      const sortedSkills = Object.entries(skillCounts)
        .map(([skill, count]) => ({
          skill,
          count,
          percentage: Math.round((count / opportunities.length) * 100),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      this.log(`Top ${limit} skills for display:`, sortedSkills);

      return sortedSkills;
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

      // Get total opportunities count for context
      const { count: totalOpportunities } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      return {
        topSkills,
        totalOpportunities: totalOpportunities || 0,
        lastUpdated: new Date().toISOString(),
        analysis: {
          mostDemandedSkill: topSkills[0]?.skill || null,
          averageDemand:
            topSkills.length > 0
              ? Math.round(
                  topSkills.reduce((sum, skill) => sum + skill.count, 0) / topSkills.length
                )
              : 0,
        },
      };
    } catch (error) {
      console.error('Error in getSkillsDemandAnalysis:', error);
      return {
        topSkills: [],
        totalOpportunities: 0,
        lastUpdated: new Date().toISOString(),
        analysis: {
          mostDemandedSkill: null,
          averageDemand: 0,
        },
      };
    }
  }
}

export default SkillsAnalyticsService;
