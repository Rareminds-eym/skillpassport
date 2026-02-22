import { supabase } from '../lib/supabaseClient';

class OfferManagementService {
  /**
   * Accept a job offer
   */
  async acceptOffer(applicationId) {
    try {
      const { data, error } = await supabase
        .from('applied_jobs')
        .update({
          offer_status: 'accepted',
          application_status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)
        .select(`
          *,
          opportunity:opportunities(
            id,
            job_title,
            company_name,
            openings_count
          )
        `)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error accepting offer:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reject a job offer
   */
  async rejectOffer(applicationId, reason = null) {
    try {
      const { data, error } = await supabase
        .from('applied_jobs')
        .update({
          offer_status: 'rejected',
          application_status: 'rejected',
          rejection_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error rejecting offer:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if opportunity has available openings
   */
  async checkOpeningsAvailable(opportunityId) {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('openings_count, status, is_active')
        .eq('id', opportunityId)
        .single();

      if (error) throw error;

      return {
        success: true,
        hasOpenings: data.openings_count > 0 && data.is_active && data.status !== 'filled'
      };
    } catch (error) {
      console.error('Error checking openings:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get opportunity with openings info
   */
  async getOpportunityWithOpenings(opportunityId) {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          *,
          accepted_count:applied_jobs(count)
        `)
        .eq('id', opportunityId)
        .eq('applied_jobs.offer_status', 'accepted')
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching opportunity:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if candidate can proceed in pipeline
   */
  async canProceedInPipeline(applicationId) {
    try {
      const { data, error } = await supabase.rpc('can_proceed_in_pipeline', {
        p_application_id: applicationId
      });

      if (error) throw error;

      return { success: true, canProceed: data };
    } catch (error) {
      console.error('Error checking pipeline eligibility:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new OfferManagementService();
