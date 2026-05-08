import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('factory-visits-service');

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
      let query = supabase
        .from('opportunities')
        .select('id, company_name, location, sector, description, title, posted_date, is_active, created_at, updated_at')
        .eq('employment_type', 'factory_visit')
        .eq('is_active', true)
        .order('posted_date', { ascending: false });

      if (filters?.search) {
        query = query.or(`company_name.ilike.%${filters.search}%,sector.ilike.%${filters.search}%,location.ilike.%${filters.search}%`);
      }

      if (filters?.sector) {
        query = query.eq('sector', filters.sector);
      }

      if (filters?.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching factory visits', error as Error, { filters });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getAllFactoryVisits', error as Error, { filters });
      throw error;
    }
  }

  async getFactoryVisitById(id: string): Promise<FactoryVisit | null> {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('id, company_name, location, sector, description, title, posted_date, is_active, created_at, updated_at')
        .eq('id', id)
        .eq('employment_type', 'factory_visit')
        .single();

      if (error) {
        logger.error('Error fetching factory visit by ID', error as Error, { visitId: id });
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error in getFactoryVisitById', error as Error, { visitId: id });
      throw error;
    }
  }

  async getSectors(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('sector')
        .eq('employment_type', 'factory_visit')
        .not('sector', 'is', null);

      if (error) throw error;

      const uniqueSectors = [...new Set(data?.map(item => item.sector).filter(Boolean))];
      return uniqueSectors;
    } catch (error) {
      logger.error('Error fetching sectors', error as Error);
      return [];
    }
  }

  async registerForVisit(learnerId: number, visitId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Check if learner profile is complete (has name and contactNumber)
      const { data: learnerData, error: learnerError } = await supabase
        .from('learners')
        .select('name, contactNumber')
        .eq('id', learnerId)
        .single();

      if (learnerError) {
        logger.error('Error fetching learner data during visit registration', learnerError as Error, { learnerId, visitId });
        return { success: false, message: `Failed to verify learner profile: ${learnerError.message}` };
      }

      if (!learnerData) {
        return { success: false, message: 'Learner profile not found' };
      }

      if (!learnerData.name || !learnerData.contactNumber) {
        const missingFields = [];
        if (!learnerData.name) missingFields.push('Full Name');
        if (!learnerData.contactNumber) missingFields.push('Phone Number');

        return {
          success: false,
          message: `Please complete your profile (${missingFields.join(', ')}) in Settings before registering`
        };
      }

      // Check if already registered
      const { data: existingRegistration } = await supabase
        .from('applied_jobs')
        .select('id')
        .eq('learner_id', learnerId)
        .eq('opportunity_id', visitId)
        .single();

      if (existingRegistration) {
        return { success: false, message: 'You have already registered for this visit' };
      }

      // Register for the visit
      const { error: insertError } = await supabase
        .from('applied_jobs')
        .insert({
          learner_id: learnerId,
          opportunity_id: visitId,
          application_status: 'applied',
          applied_at: new Date().toISOString()
        });

      if (insertError) {
        logger.error('Error registering learner for visit', insertError as Error, { learnerId, visitId });
        return { success: false, message: `Failed to register for visit: ${insertError.message}` };
      }

      return { success: true, message: 'Successfully registered for the visit!' };
    } catch (error) {
      logger.error('Error in registerForVisit', error as Error, { learnerId, visitId });
      return { success: false, message: 'An error occurred while registering' };
    }
  }

  async getlearnerRegistrations(learnerId: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('applied_jobs')
        .select(`
          id,
          learner_id,
          opportunity_id,
          application_status,
          applied_at,
          updated_at,
          opportunities:opportunity_id (
            id,
            company_name,
            location,
            sector,
            description,
            title,
            employment_type
          )
        `)
        .eq('learner_id', learnerId)
        .eq('opportunities.employment_type', 'factory_visit')
        .order('applied_at', { ascending: false });

      if (error) {
        logger.error('Error fetching learner registrations', error as Error, { learnerId });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getlearnerRegistrations', error as Error, { learnerId });
      return [];
    }
  }
}

export const factoryVisitsService = new FactoryVisitsService();
export default factoryVisitsService;
