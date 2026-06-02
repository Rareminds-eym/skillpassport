import { apiPost } from '@/shared/api/apiClient';

class OfferManagementService {
  async acceptOffer(applicationId) {
    try {
      const response: any = await apiPost('/opportunities', { action: 'accept-offer', id: applicationId });
      if (response?.error) return { success: false, error: eMsg(response.error) };
      return { success: true, data: response?.data?.data };
    } catch (error) {
      return { success: false, error: eMsg(error) };
    }
  }

  async rejectOffer(applicationId, reason = null) {
    try {
      const response: any = await apiPost('/opportunities', { action: 'reject-offer', id: applicationId, reason });
      if (response?.error) return { success: false, error: eMsg(response.error) };
      return { success: true, data: response?.data?.data };
    } catch (error) {
      return { success: false, error: eMsg(error) };
    }
  }

  async checkOpeningsAvailable(opportunityId) {
    try {
      const response: any = await apiPost('/opportunities', { action: 'check-openings-available', opportunity_id: opportunityId });
      if (response?.error) return { success: false, error: eMsg(response.error) };
      return { success: true, hasOpenings: response?.data?.hasOpenings };
    } catch (error) {
      return { success: false, error: eMsg(error) };
    }
  }

  async getOpportunityWithOpenings(opportunityId) {
    try {
      const response: any = await apiPost('/opportunities', { action: 'get-opportunity-with-openings', opportunity_id: opportunityId });
      if (response?.error) return { success: false, error: eMsg(response.error) };
      return { success: true, data: response?.data?.data };
    } catch (error) {
      return { success: false, error: eMsg(error) };
    }
  }

  async canProceedInPipeline(applicationId) {
    try {
      const response: any = await apiPost('/opportunities', { action: 'can-proceed-pipeline', application_id: applicationId });
      return { success: true, canProceed: response?.data?.canProceed };
    } catch (error: any) {
      return { success: false, error: eMsg(error) };
    }
  }
}

function eMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export default new OfferManagementService();
