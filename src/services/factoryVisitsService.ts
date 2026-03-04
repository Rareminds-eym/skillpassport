import { supabase } from '../lib/supabaseClient';

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
        console.error('FactoryVisitsService: Error fetching factory visits:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('FactoryVisitsService: Error in getAllFactoryVisits:', error);
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
        console.error('FactoryVisitsService: Error fetching factory visit:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('FactoryVisitsService: Error in getFactoryVisitById:', error);
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
      console.error('FactoryVisitsService: Error fetching sectors:', error);
      return [];
    }
  }

  async registerForVisit(studentId: number, visitId: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Registering for visit:', { studentId, visitId });
      
      // Check if student profile is complete (has name and contactNumber)
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('name, contactNumber')
        .eq('id', studentId)
        .single();

      console.log('Student data fetch result:', { studentData, studentError });

      if (studentError) {
        console.error('Error fetching student data:', studentError);
        return { success: false, message: `Failed to verify student profile: ${studentError.message}` };
      }

      if (!studentData) {
        return { success: false, message: 'Student profile not found' };
      }

      if (!studentData.name || !studentData.contactNumber) {
        const missingFields = [];
        if (!studentData.name) missingFields.push('Full Name');
        if (!studentData.contactNumber) missingFields.push('Phone Number');
        
        return { 
          success: false, 
          message: `Please complete your profile (${missingFields.join(', ')}) in Settings before registering` 
        };
      }

      // Check if already registered
      const { data: existingRegistration } = await supabase
        .from('applied_jobs')
        .select('id')
        .eq('student_id', studentId)
        .eq('opportunity_id', visitId)
        .single();

      if (existingRegistration) {
        return { success: false, message: 'You have already registered for this visit' };
      }

      // Register for the visit
      const { error: insertError } = await supabase
        .from('applied_jobs')
        .insert({
          student_id: studentId,
          opportunity_id: visitId,
          application_status: 'applied',
          applied_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error registering for visit:', insertError);
        return { success: false, message: `Failed to register for visit: ${insertError.message}` };
      }

      return { success: true, message: 'Successfully registered for the visit!' };
    } catch (error) {
      console.error('FactoryVisitsService: Error in registerForVisit:', error);
      return { success: false, message: 'An error occurred while registering' };
    }
  }

  async getStudentRegistrations(studentId: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('applied_jobs')
        .select(`
          id,
          student_id,
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
        .eq('student_id', studentId)
        .eq('opportunities.employment_type', 'factory_visit')
        .order('applied_at', { ascending: false });

      if (error) {
        console.error('Error fetching student registrations:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('FactoryVisitsService: Error in getStudentRegistrations:', error);
      return [];
    }
  }
}

export const factoryVisitsService = new FactoryVisitsService();
export default factoryVisitsService;
