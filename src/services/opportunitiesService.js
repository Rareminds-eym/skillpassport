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
      console.log('🔍 OpportunitiesService: Fetching all opportunities...');
      
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ OpportunitiesService Error:', error);
        throw error;
      }

      console.log('✅ OpportunitiesService: Successfully fetched', data?.length || 0, 'opportunities');
      console.log('📊 Raw data:', data);

      return data || [];
    } catch (error) {
      console.error('❌ Error in getAllOpportunities:', error);
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
        .select('*');

      // Apply filters if provided
      if (filters.employment_type) {
        query = query.eq('employment_type', filters.employment_type);
      }

      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      if (filters.mode) {
        query = query.eq('mode', filters.mode);
      }

      // Apply limit if provided
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      // Order by deadline (closest first) and creation date
      query = query.order('deadline', { ascending: true })
                   .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching filtered opportunities:', error);
        throw error;
      }

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
      if (!studentSkills.length) {
        return await this.getAllOpportunities();
      }

      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching opportunities for matching:', error);
        throw error;
      }

      // Filter opportunities that match student skills
      const matchingOpportunities = data?.filter(opportunity => {
        if (!opportunity.skills_required) return false;
        
        try {
          const requiredSkills = typeof opportunity.skills_required === 'string' 
            ? JSON.parse(opportunity.skills_required)
            : opportunity.skills_required;

          // Check if any of the student's skills match the required skills
          return requiredSkills.some(skill => 
            studentSkills.some(studentSkill => 
              studentSkill.toLowerCase().includes(skill.toLowerCase()) ||
              skill.toLowerCase().includes(studentSkill.toLowerCase())
            )
          );
        } catch (parseError) {
          console.warn('Error parsing skills_required:', parseError);
          return false;
        }
      }) || [];

      return matchingOpportunities;
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
      const currentDate = new Date().toISOString();
      console.log('🔍 OpportunitiesService: Fetching active opportunities after', currentDate);
      
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .gte('deadline', currentDate)
        .order('deadline', { ascending: true });

      if (error) {
        console.error('❌ OpportunitiesService Error (active):', error);
        throw error;
      }

      console.log('✅ OpportunitiesService: Found', data?.length || 0, 'active opportunities');
      console.log('📊 Active opportunities data:', data);

      return data || [];
    } catch (error) {
      console.error('❌ Error in getActiveOpportunities:', error);
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

    try {
      const skills = typeof opportunity.skills_required === 'string' 
        ? JSON.parse(opportunity.skills_required)
        : opportunity.skills_required || [];

      return {
        ...opportunity,
        skills_required: skills,
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
        deadline_formatted: 'No deadline',
        is_active: true
      };
    }
  }
}

export default OpportunitiesService;