import { supabase } from '@/shared/api/supabaseClient';

class OfferManagementService {
  /**
   * Accept a job offer
   */
  async acceptOffer(applicationId) {
    try {
      const { data, error } = await supabase
        .from('applied_jobs')
        .update({
          application_status: 'accepted',
          responded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)
        .select(`
          *,
          opportunity:opportunities(
            id,
            job_title,
            company_name,
            applications_count
          )
        `)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Reject a job offer
   */
  async rejectOffer(applicationId, reason = null) {
    try {
      const updateData: any = {
        
        application_status: 'rejected',
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (reason) {
        updateData.notes = reason;
      }

      const { data, error } = await supabase
        .from('applied_jobs')
        .update(updateData)
        .eq('id', applicationId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
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
        .select('applications_count, status, is_active')
        .eq('id', opportunityId)
        .single();

      if (error) throw error;

      return {
        success: true,
        hasOpenings: data.applications_count > 0 && data.is_active && data.status !== 'filled'
      };
    } catch (error) {
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
        .eq('applied_jobs.application_status', 'accepted')
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
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
      return { success: false, error: error.message };
    }
  }
}

export default new OfferManagementService();
