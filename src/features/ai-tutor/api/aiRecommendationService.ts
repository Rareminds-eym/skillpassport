import { supabase } from '@/shared/api/supabaseClient';
import { careerApiService } from '@/features/counselling';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('ai-recommendation-service');

/**
 * AI-Powered Job Recommendation Service
 * Uses Supabase Edge Functions for embeddings and vector similarity search
 */

class AIRecommendationService {
  /**
   * Get AI-powered job recommendations for a learner
   */
  async getRecommendations(learnerId, forceRefresh = false) {
    try {
      // Check cache first unless force refresh is requested
      if (!forceRefresh) {
        const cachedData = await this.getCachedRecommendations(learnerId);
        if (cachedData) {
          return {
            success: true,
            recommendations: cachedData.recommendations,
            cached: true,
            fallback: false,
            reason: 'Cached recommendations'
          };
        }
      }

      // Generate fresh recommendations via Cloudflare Worker (falls back to edge function)
      let data, error;
      try {
        data = await careerApiService.getRecommendations(learnerId, { forceRefresh: true });
      } catch (err: unknown) {
        logger.error('Error fetching recommendations', err instanceof Error ? err : new Error(String(err)));
        throw err;
      }

      // Cache the fresh recommendations
      if (data?.recommendations && data.recommendations.length > 0) {
        await this.cacheRecommendations(learnerId, data.recommendations);
      }

      return {
        success: true,
        recommendations: data?.recommendations || [],
        cached: false,
        fallback: data?.fallback || false,
        reason: data?.reason
      };
    } catch (error) {
      logger.error('Failed to get recommendations', error instanceof Error ? error : new Error(String(error)));
      return {
        success: false,
        recommendations: [],
        error: error.message
      };
    }
  }

  /**
   * Get cached recommendations for a learner
   */
  async getCachedRecommendations(learnerId) {
    try {
      // recommendation_cache table doesn't exist, return null to force fresh fetch
      return null;
    } catch (error) {
      logger.error('Error fetching cached recommendations', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  /**
   * Cache recommendations for a learner
   */
  async cacheRecommendations(learnerId, recommendations) {
    try {
      // recommendation_cache table doesn't exist, skip caching
      return;
    } catch (error) {
      logger.error('Error caching recommendations', error instanceof Error ? error : new Error(String(error)));
    }
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
        Array.isArray(opp.responsibilities) ? opp.responsibilities.join(' ') : ''
      ].filter(Boolean).join(' ');

      // Generate embedding via Cloudflare Worker
      let data;
      try {
        data = await careerApiService.generateEmbedding({
          text,
          table: 'opportunities',
          id: opportunityId,
          type: 'opportunity'
        });
      } catch (error) {
        throw error;
      }

      return { success: true, ...data };
    } catch (error) {
      logger.error('Failed to generate opportunity embedding', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate embedding for a learner profile
   */
  async generatelearnerEmbedding(learnerId) {
    try {

      // Get learner details
      const { data: learner, error: fetchError } = await supabase
        .from('learners')
        .select('*')
        .eq('id', learnerId)
        .maybeSingle();

      if (fetchError || !learner) {
        throw new Error('Learner not found');
      }

      // Create text representation
      const text = [
        learner.name,
        learner.bio,
        learner.resume_text,
        learner.experience_level,
        Array.isArray(learner.skills) ? learner.skills.join(' ') : '',
        Array.isArray(learner.interests) ? learner.interests.join(' ') : '',
        Array.isArray(learner.preferred_departments) ? learner.preferred_departments.join(' ') : '',
        Array.isArray(learner.preferred_employment_types) ? learner.preferred_employment_types.join(' ') : ''
      ].filter(Boolean).join(' ');

      // Generate embedding via Cloudflare Worker
      let data;
      try {
        data = await careerApiService.generateEmbedding({
          text,
          table: 'learners',
          id: learnerId,
          type: 'learner'
        });
      } catch (error) {
        throw error;
      }

      return { success: true, ...data };
    } catch (error) {
      logger.error('Failed to generate learner embedding', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: error.message };
    }
  }

  /**
   * Track user interaction with an opportunity
   */
  async trackInteraction(learnerId, opportunityId, action) {
    try {
      const { error } = await supabase
        .from('opportunity_interactions')
        .upsert({
          learner_id: learnerId,
          opportunity_id: opportunityId,
          action
        }, {
          onConflict: 'learner_id,opportunity_id,action'
        });

      if (error) throw error;

      // Increment view count if viewing
      if (action === 'view') {
        await supabase.rpc('increment_views', { opp_id: opportunityId });
      }

      // Invalidate cache on apply/dismiss
      if (action === 'apply' || action === 'dismiss') {
        await this.invalidateCache(learnerId);
      }

      return { success: true };
    } catch (error) {
      logger.error('Error tracking interaction', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: error.message };
    }
  }

  /**
   * Dismiss an opportunity (won't show in recommendations)
   */
  async dismissOpportunity(learnerId, opportunityId) {
    return this.trackInteraction(learnerId, opportunityId, 'dismiss');
  }

  /**
   * Invalidate recommendation cache for a learner
   */
  async invalidateCache(learnerId) {
    try {
      // recommendation_cache table doesn't exist, nothing to invalidate
      return { success: true };
    } catch (error) {
      logger.error('Error invalidating cache', error instanceof Error ? error : new Error(String(error)));
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
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      return {
        success: true,
        processed: results.length,
        results
      };
    } catch (error) {
      logger.error('Error generating batch embeddings', error instanceof Error ? error : new Error(String(error)));
      return { success: false, error: error.message };
    }
  }

  /**
   * Update learner profile and regenerate embedding
   */
  async updateLearnerProfile(learnerId, profileData) {
    try {
      // Update profile
      const { error: updateError } = await supabase
        .from('learners')
        .upsert({
          id: learnerId,
          ...profileData,
          updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      // Regenerate embedding
      await this.generatelearnerEmbedding(learnerId);

      // Invalidate cache
      await this.invalidateCache(learnerId);

      return { success: true };
    } catch (error) {
      logger.error('Error updating learner profile', error instanceof Error ? error : new Error(String(error)));
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

