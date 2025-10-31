import { supabase } from '../lib/supabaseClient';

/**
 * AI-Powered Job Recommendation Service
 * Uses OpenRouter for embeddings and vector similarity search
 */

class AIRecommendationService {
  /**
   * Get AI-powered job recommendations for a student
   */
  async getRecommendations(studentId, forceRefresh = false) {
    try {
      console.log('🤖 Getting AI recommendations for student:', studentId);

      const { data, error } = await supabase.functions.invoke('recommend-opportunities', {
        body: { studentId, forceRefresh }
      });

      if (error) {
        console.error('Error fetching recommendations:', error);
        throw error;
      }

      console.log(`✅ Received ${data?.recommendations?.length || 0} recommendations`);
      
      return {
        success: true,
        recommendations: data?.recommendations || [],
        cached: data?.cached || false,
        fallback: data?.fallback || false,
        reason: data?.reason
      };
    } catch (error) {
      console.error('❌ Failed to get recommendations:', error);
      return {
        success: false,
        recommendations: [],
        error: error.message
      };
    }
  }

  /**
   * Generate embedding for an opportunity
   */
  async generateOpportunityEmbedding(opportunityId) {
    try {
      console.log('🔄 Generating embedding for opportunity:', opportunityId);

      // Get opportunity details
      const { data: opp, error: fetchError } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', opportunityId)
        .single();

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

      // Generate embedding
      const { data, error } = await supabase.functions.invoke('generate-embedding', {
        body: {
          text,
          table: 'opportunities',
          id: opportunityId,
          type: 'opportunity'
        }
      });

      if (error) throw error;

      console.log('✅ Opportunity embedding generated:', data);
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
      console.log('🔄 Generating embedding for student:', studentId);

      // Get student details
      const { data: student, error: fetchError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

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
        Array.isArray(student.preferred_employment_types) ? student.preferred_employment_types.join(' ') : ''
      ].filter(Boolean).join(' ');

      // Generate embedding
      const { data, error } = await supabase.functions.invoke('generate-embedding', {
        body: {
          text,
          table: 'students',
          id: studentId,
          type: 'student'
        }
      });

      if (error) throw error;

      console.log('✅ Student embedding generated:', data);
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
      const { error } = await supabase
        .from('opportunity_interactions')
        .upsert({
          student_id: studentId,
          opportunity_id: opportunityId,
          action
        }, {
          onConflict: 'student_id,opportunity_id,action'
        });

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
      await supabase
        .from('recommendation_cache')
        .delete()
        .eq('student_id', studentId);

      console.log('✅ Cache invalidated for student:', studentId);
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
      console.log('🔄 Generating embeddings for all opportunities...');

      const { data: opportunities, error } = await supabase
        .from('opportunities')
        .select('id')
        .is('embedding', null)
        .eq('is_active', true);

      if (error) throw error;

      console.log(`Found ${opportunities.length} opportunities without embeddings`);

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
      const { error: updateError } = await supabase
        .from('students')
        .upsert({
          id: studentId,
          ...profileData,
          updated_at: new Date().toISOString()
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

