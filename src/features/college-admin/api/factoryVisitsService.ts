import { apiPost } from '@/shared/api/apiClient';

export interface FactoryVisit {
  id: string;
  company_name: string;
  location: string;
  sector: string;
  description: string;
  title: string;
  posted_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FactoryVisitFilters {
  search?: string;
  sector?: string;
  location?: string;
}

class FactoryVisitsService {
  async getAllFactoryVisits(filters?: FactoryVisitFilters): Promise<FactoryVisit[]> {
    try {
      const result = await apiPost<any>('/college-admin/events', {
        action: 'get-factory-visits',
        ...filters
      });

      if (!result.success) throw new Error(result.error || 'Failed to fetch factory visits');
      return result.data || [];
    } catch (error) {
      throw error;
    }
  }

  async getFactoryVisitById(id: string): Promise<FactoryVisit | null> {
    try {
      const result = await apiPost<any>('/college-admin/events', {
        action: 'get-factory-visit-details',
        id
      });

      if (!result.success) throw new Error(result.error || 'Failed to fetch factory visit');
      return result.data;
    } catch (error) {
      throw error;
    }
  }

  async getSectors(): Promise<string[]> {
    try {
      const result = await apiPost<any>('/college-admin/events', {
        action: 'get-factory-visit-sectors'
      });

      if (!result.success) return [];
      return result.data || [];
    } catch (error) {
      return [];
    }
  }

  async registerForVisit(learnerId: number, visitId: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await apiPost<any>('/college-admin/events', {
        action: 'register-for-factory-visit',
        learner_id: learnerId,
        visit_id: visitId
      });

      if (!result.success) {
        return { success: false, message: result.error || 'Failed to register for visit' };
      }

      return { success: true, message: 'Successfully registered for the visit!' };
    } catch (error: any) {
      return { success: false, message: error.message || 'An error occurred while registering' };
    }
  }

  async getlearnerRegistrations(learnerId: number): Promise<any[]> {
    try {
      const result = await apiPost<any>('/college-admin/events', {
        action: 'get-learner-factory-visit-registrations',
        learner_id: learnerId
      });

      if (!result.success) throw new Error(result.error || 'Failed to fetch registrations');
      return result.data || [];
    } catch (error) {
      return [];
    }
  }
}

export const factoryVisitsService = new FactoryVisitsService();
export default factoryVisitsService;
