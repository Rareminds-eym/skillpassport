import { supabase } from '../lib/supabaseClient';

/**
 * Service for managing opportunities data from Supabase
 */
export class OpportunitiesService {
  /**
   * Fetch all opportunities from the database
   * @returns {Promise<Array>} Array of opportunities
   */
  static async getAllOpportunities() {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in getAllOpportunities:', error);
      throw error;
    }
  }

  /**
   * Fetch opportunities with optional filters
   * @param {Object} filters - Filter criteria
   * @param {string} filters.employment_type - Type of employment (internship, full-time, etc.)
   * @param {string} filters.location - Location filter
   * @param {string} filters.mode - Work mode (onsite, remote, hybrid)
   * @param {number} filters.limit - Number of records to return
   * @returns {Promise<Array>} Filtered opportunities
   */
  static async getFilteredOpportunities(filters = {}) {
    try {
      let query = supabase
        .from('opportunities')
        .select('*')
        .order('deadline', { ascending: true })
        .order('created_at', { ascending: false });

      if (filters.employment_type) query = query.eq('employment_type', filters.employment_type);
      if (filters.location) query = query.ilike('location', `%${filters.location}%`);
      if (filters.mode) query = query.eq('mode', filters.mode);
      if (filters.limit) query = query.limit(filters.limit);

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error in getFilteredOpportunities:', error);
      throw error;
    }
  }

  /**
   * Get opportunities that match student's skills
   * @param {Array} studentSkills - Array of student's skills
   * @returns {Promise<Array>} Matching opportunities
   */
  static async getMatchingOpportunities(studentSkills = []) {
    try {
      if (!studentSkills.length) return await this.getAllOpportunities();

      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.filter(opportunity => {
        if (!opportunity.skills_required) return false;
        
        try {
          const requiredSkills = typeof opportunity.skills_required === 'string' 
            ? JSON.parse(opportunity.skills_required)
            : opportunity.skills_required;

          return requiredSkills.some(skill => 
            studentSkills.some(studentSkill => 
              studentSkill.toLowerCase().includes(skill.toLowerCase()) ||
              skill.toLowerCase().includes(studentSkill.toLowerCase())
            )
          );
        } catch {
          return false;
        }
      }) || [];
    } catch (error) {
      console.error('Error in getMatchingOpportunities:', error);
      throw error;
    }
  }

  /**
   * Get active opportunities (not past deadline)
   * @returns {Promise<Array>} Active opportunities
   */
  static async getActiveOpportunities() {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .gte('deadline', new Date().toISOString())
        .order('deadline', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in getActiveOpportunities:', error);
      throw error;
    }
  }

  /**
   * Search opportunities by job title, company name, or location
   * @param {string} searchTerm - Search term to filter opportunities
   * @returns {Promise<Array>} Matching opportunities
   */
  static async searchOpportunities(searchTerm) {
    try {
      if (!searchTerm || !searchTerm.trim()) {
        return await this.getAllOpportunities();
      }

      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .or(`job_title.ilike.%${searchTerm}%,title.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in searchOpportunities:', error);
      throw error;
    }
  }

  /**
   * Format opportunity data for display
   * @param {Object} opportunity - Raw opportunity data from database
   * @returns {Object} Formatted opportunity data
   */
  static formatOpportunityForDisplay(opportunity) {
    if (!opportunity) return null;

    // Helper function to safely parse JSONB fields
    const parseJSONBField = (field) => {
      if (!field) return [];
      if (Array.isArray(field)) return field;

      if (typeof field === 'string') {
        // If it starts with '[', it's likely a JSON array string
        if (field.trim().startsWith('[')) {
          try {
            return JSON.parse(field);
          } catch (e) {
            console.warn('Failed to parse JSON array, treating as plain string:', field);
            return [field];
          }
        }
        // Otherwise, it's a plain string - convert to array
        return [field];
      }

      return [];
    };

    try {
      return {
        ...opportunity,
        skills_required: parseJSONBField(opportunity.skills_required),
        requirements: parseJSONBField(opportunity.requirements),
        responsibilities: parseJSONBField(opportunity.responsibilities),
        deadline_formatted: opportunity.deadline
          ? new Date(opportunity.deadline).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
          : 'No deadline',
        is_active: opportunity.deadline
          ? new Date(opportunity.deadline) > new Date()
          : true
      };
    } catch (error) {
      console.error('Error formatting opportunity:', error);
      return {
        ...opportunity,
        skills_required: [],
        requirements: [],
        responsibilities: [],
        deadline_formatted: 'No deadline',
        is_active: true
      };
    }
  }
}

export default OpportunitiesService;