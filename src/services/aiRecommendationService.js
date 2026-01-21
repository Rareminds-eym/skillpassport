import { supabase } from '../lib/supabaseClient';
import careerApiService from './careerApiService';

/**
 * AI-Powered Job Recommendation Service
 * Uses Supabase Edge Functions for embeddings and vector similarity search
 */

class AIRecommendationService {
  /**
   * Get AI-powered job recommendations for a student
   */
  async getRecommendations(studentId, forceRefresh = false) {
    // Check cache first unless force refresh is requested
    if (!forceRefresh) {
      const cachedData = await this.getCachedRecommendations(studentId);
      if (cachedData) {
        return {
          success: true,
          recommendations: cachedData.recommendations,
          cached: true,
          fallback: false,
          reason: 'Cached recommendations',
        };
      }
    }

    // Generate fresh recommendations via Cloudflare Worker (falls back to edge function)
    let data, error;
    try {
      data = await careerApiService.getRecommendations(studentId, { forceRefresh: true });
    } catch (err) {
      error = err;
      console.error('Error fetching recommendations:', err);
      throw err;
    }

    // Cache the fresh recommendations
    if (data?.recommendations && data.recommendations.length > 0) {
      await this.cacheRecommendations(studentId, data.recommendations);
    }

    return {
      success: true,
      recommendations: data?.recommendations || [],
      cached: false,
      fallback: data?.fallback || false,
      reason: data?.reason,
    };
  }

  /**
   * Get cached recommendations for a student
   */
  async getCachedRecommendations(studentId) {
    // recommendation_cache table doesn't exist, return null to force fresh fetch
    return null;
  }

  /**
   * Cache recommendations for a student
   */
  async cacheRecommendations(studentId, recommendations) {
    // recommendation_cache table doesn't exist, skip caching
    return;
  }

  /**
   * Generate embedding for an opportunity
   */
  async generateOpportunityEmbedding(opportunityId) {
    try {
      // Get opportunity details
      const { data: opp, error: fetchError } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', opportunityId)
        .maybeSingle();

      if (fetchError || !opp) {
        throw new Error('Opportunity not found');
      }

      // Create text representation
      const text = [
        opp.title,
        opp.job_title,
        opp.company_name,
        opp.department,
        opp.description,
        opp.experience_level,
        opp.employment_type,
        opp.location,
        opp.mode,
        Array.isArray(opp.skills_required) ? opp.skills_required.join(' ') : '',
        Array.isArray(opp.requirements) ? opp.requirements.join(' ') : '',
        Array.isArray(opp.responsibilities) ? opp.responsibilities.join(' ') : '',
      ]
        .filter(Boolean)
        .join(' ');

      // Generate embedding via Cloudflare Worker
      let data;
      try {
        data = await careerApiService.generateEmbedding({
          text,
          table: 'opportunities',
          id: opportunityId,
          type: 'opportunity',
        });
      } catch (error) {
        throw error;
      }

      return { success: true, ...data };
    } catch (error) {
      console.error('❌ Failed to generate opportunity embedding:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate embedding for a student profile
   */
  async generateStudentEmbedding(studentId) {
    try {
      // Get student details
      const { data: student, error: fetchError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .maybeSingle();

      if (fetchError || !student) {
        throw new Error('Student not found');
      }

      // Create text representation
      const text = [
        student.name,
        student.bio,
        student.resume_text,
        student.experience_level,
        Array.isArray(student.skills) ? student.skills.join(' ') : '',
        Array.isArray(student.interests) ? student.interests.join(' ') : '',
        Array.isArray(student.preferred_departments) ? student.preferred_departments.join(' ') : '',
        Array.isArray(student.preferred_employment_types)
          ? student.preferred_employment_types.join(' ')
          : '',
      ]
        .filter(Boolean)
        .join(' ');

      // Generate embedding via Cloudflare Worker
      let data;
      try {
        data = await careerApiService.generateEmbedding({
          text,
          table: 'students',
          id: studentId,
          type: 'student',
        });
      } catch (error) {
        throw error;
      }

      return { success: true, ...data };
    } catch (error) {
      console.error('❌ Failed to generate student embedding:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Track user interaction with an opportunity
   */
  async trackInteraction(studentId, opportunityId, action) {
    try {
      const { error } = await supabase.from('opportunity_interactions').upsert(
        {
          student_id: studentId,
          opportunity_id: opportunityId,
          action,
        },
        {
          onConflict: 'student_id,opportunity_id,action',
        }
      );

      if (error) throw error;

      // Increment view count if viewing
      if (action === 'view') {
        await supabase.rpc('increment_views', { opp_id: opportunityId });
      }

      // Invalidate cache on apply/dismiss
      if (action === 'apply' || action === 'dismiss') {
        await this.invalidateCache(studentId);
      }

      return { success: true };
    } catch (error) {
      console.error('Error tracking interaction:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Dismiss an opportunity (won't show in recommendations)
   */
  async dismissOpportunity(studentId, opportunityId) {
    return this.trackInteraction(studentId, opportunityId, 'dismiss');
  }

  /**
   * Invalidate recommendation cache for a student
   */
  async invalidateCache(studentId) {
    try {
      // recommendation_cache table doesn't exist, nothing to invalidate
      return { success: true };
    } catch (error) {
      console.error('Error invalidating cache:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Batch generate embeddings for all opportunities without embeddings
   */
  async generateAllOpportunityEmbeddings() {
    try {
      const { data: opportunities, error } = await supabase
        .from('opportunities')
        .select('id')
        .is('embedding', null)
        .eq('is_active', true);

      if (error) throw error;

      const results = [];
      for (const opp of opportunities) {
        const result = await this.generateOpportunityEmbedding(opp.id);
        results.push({ id: opp.id, ...result });

        // Add small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      return {
        success: true,
        processed: results.length,
        results,
      };
    } catch (error) {
      console.error('Error generating batch embeddings:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update student profile and regenerate embedding
   */
  async updateStudentProfile(studentId, profileData) {
    try {
      // Update profile
      const { error: updateError } = await supabase.from('students').upsert({
        id: studentId,
        ...profileData,
        updated_at: new Date().toISOString(),
      });

      if (updateError) throw updateError;

      // Regenerate embedding
      await this.generateStudentEmbedding(studentId);

      // Invalidate cache
      await this.invalidateCache(studentId);

      return { success: true };
    } catch (error) {
      console.error('Error updating student profile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get match explanation for why a job was recommended
   */
  getMatchExplanation(matchReasons) {
    const reasons = [];

    if (matchReasons?.semantic_match) {
      reasons.push('Strong skill and experience match');
    }
    if (matchReasons?.employment_type_match) {
      reasons.push('Matches your preferred employment type');
    }
    if (matchReasons?.location_match) {
      reasons.push('In your preferred location');
    }
    if (matchReasons?.mode_match) {
      reasons.push('Matches your work mode preference');
    }
    if (matchReasons?.department_match) {
      reasons.push('In your field of interest');
    }
    if (matchReasons?.recent_post) {
      reasons.push('Recently posted');
    }
    if (matchReasons?.trending) {
      reasons.push('Trending opportunity');
    }

    return reasons;
  }
}

export default new AIRecommendationService();
