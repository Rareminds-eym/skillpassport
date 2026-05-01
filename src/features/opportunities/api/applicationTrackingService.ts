import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('applicationTrackingService');

export interface ApplicationTrackingData {
  id: number;
  student_id: string;
  opportunity_id: number;
  application_status: 'applied' | 'viewed' | 'under_review' | 'interview_scheduled' | 'interviewed' | 'offer_received' | 'accepted' | 'rejected' | 'withdrawn';
  applied_at: string;
  updated_at: string;
  viewed_at?: string;
  interview_scheduled_at?: string;
  notes?: string;
  
  // Joined data
  student?: {
    id: string;
    user_id: string;
    name: string;
    email: string;
    contact_number?: string;
    university?: string;
    branch_field?: string;
    course_name?: string;
    college_school_name?: string;
    district_name?: string;
    currentCgpa?: number;
    expectedGraduationDate?: string;
    approval_status?: string;
    profile?: any;
  };
  
  opportunity?: {
    id: number;
    title: string;
    job_title: string;
    company_name: string;
    department: string;
    employment_type: string;
    location: string;
    mode?: string;
    salary_range_min?: number;
    salary_range_max?: number;
    stipend_or_salary?: string;
    experience_required?: string;
    skills_required?: string[] | string;
    description?: string;
    deadline?: string;
    is_active: boolean;
    created_at: string;
  };
  
  company?: {
    id: string;
    name: string;
    industry?: string;
    companySize?: string;
    hqCity?: string;
    hqState?: string;
    website?: string;
    accountStatus?: string;
  };
}

export interface ApplicationFilters {
  search?: string;
  status?: string;
  company_name?: string;
  department?: string;
  employment_type?: string;
  date_from?: string;
  date_to?: string;
  college_id?: string;
}

export interface ApplicationStats {
  total: number;
  applied: number;
  viewed: number;
  under_review: number;
  interview_scheduled: number;
  interviewed: number;
  offer_received: number;
  accepted: number;
  rejected: number;
  withdrawn: number;
}

class ApplicationTrackingService {
  /**
   * Get all applications with student, opportunity, and company details
   */
  async getAllApplications(filters: ApplicationFilters = {}): Promise<ApplicationTrackingData[]> {
    try {
      // First get applied jobs
      let appliedJobsQuery = supabase
        .from('applied_jobs')
        .select('*')
        .order('applied_at', { ascending: false });

      // Apply filters to applied_jobs
      if (filters.status) {
        appliedJobsQuery = appliedJobsQuery.eq('application_status', filters.status);
      }

      if (filters.date_from) {
        appliedJobsQuery = appliedJobsQuery.gte('applied_at', filters.date_from);
      }

      if (filters.date_to) {
        appliedJobsQuery = appliedJobsQuery.lte('applied_at', filters.date_to);
      }

      const { data: appliedJobs, error: appliedJobsError } = await appliedJobsQuery;

      if (appliedJobsError) {
        throw appliedJobsError;
      }

      if (!appliedJobs || appliedJobs.length === 0) {
        return [];
      }

      // Get unique student IDs and opportunity IDs
      const studentIds = [...new Set(appliedJobs.map(job => job.student_id))];
      const opportunityIds = [...new Set(appliedJobs.map(job => job.opportunity_id))];

      // Fetch students data with university name from organizations table
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select(`
          id, 
          user_id, 
          name, 
          email, 
          contact_number, 
          university, 
          universityId,
          branch_field, 
          course_name, 
          college_school_name, 
          district_name, 
          currentCgpa, 
          expectedGraduationDate, 
          approval_status, 
          college_id,
          organizations:universityId (
            id,
            name
          )
        `)
        .in('id', studentIds);


      // Fetch opportunities data
      const { data: opportunities, error: opportunitiesError } = await supabase
        .from('opportunities')
        .select('*')
        .in('id', opportunityIds);


      // Get unique company names from opportunities for company lookup
      const companyNames = [...new Set((opportunities || []).map(opp => opp.company_name).filter(Boolean))];
      
      // Fetch companies data
      let companies: any[] = [];
      if (companyNames.length > 0) {
        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('id, name, industry, companySize, hqCity, hqState, website, accountStatus')
          .in('name', companyNames);

        if (companiesError) {
          // Handle error silently
          logger.error('Failed to fetch companies', companiesError as Error);
        } else {
          companies = companiesData || [];
        }
      }

      // Create lookup maps - applied_jobs.student_id references students.id
      const studentMap = (students || []).reduce((acc, student) => {
        acc[student.id] = student;
        return acc;
      }, {} as Record<string, any>);
      const opportunityMap = (opportunities || []).reduce((acc, opp) => {
        acc[opp.id] = opp;
        return acc;
      }, {} as Record<number, any>);

      const companyMap = companies.reduce((acc, company) => {
        acc[company.name] = company;
        return acc;
      }, {} as Record<string, any>);

      // Combine all data
      let result = appliedJobs.map(job => {
        const student = studentMap[job.student_id];
        const opportunity = opportunityMap[job.opportunity_id];
        const company = opportunity ? companyMap[opportunity.company_name] : null;


        return {
          ...job,
          student: student ? {
            id: student.id,
            user_id: student.user_id,
            name: student.name || 'Unknown Student',
            email: student.email || 'No email',
            contact_number: student.contact_number || student.contactNumber || '',
            university: student.organizations?.name || student.university || 'N/A',
            branch_field: student.branch_field || '',
            course_name: student.course_name || '',
            college_school_name: student.college_school_name || '',
            district_name: student.district_name || '',
            currentCgpa: student.currentCgpa || null,
            expectedGraduationDate: student.expectedGraduationDate || '',
            approval_status: student.approval_status,
            college_id: student.college_id
          } : {
            id: job.student_id,
            user_id: '',
            name: 'Unknown Student',
            email: 'No email',
            contact_number: '',
            university: 'N/A',
            branch_field: '',
            course_name: '',
            college_school_name: '',
            district_name: '',
            currentCgpa: null,
            expectedGraduationDate: '',
            approval_status: '',
            college_id: ''
          },
          opportunity,
          company
        };
      });

      // Apply additional filters
      if (filters.search) {
        const search = filters.search.toLowerCase();
        result = result.filter(app => 
          app.student?.name?.toLowerCase().includes(search) ||
          app.student?.email?.toLowerCase().includes(search) ||
          app.opportunity?.title?.toLowerCase().includes(search) ||
          app.opportunity?.job_title?.toLowerCase().includes(search) ||
          app.opportunity?.company_name?.toLowerCase().includes(search) ||
          app.company?.name?.toLowerCase().includes(search)
        );
      }

      if (filters.company_name) {
        result = result.filter(app => app.opportunity?.company_name === filters.company_name);
      }

      if (filters.department) {
        result = result.filter(app => 
          app.student?.branch_field === filters.department ||
          app.student?.course_name === filters.department ||
          app.opportunity?.department === filters.department
        );
      }

      if (filters.employment_type) {
        result = result.filter(app => app.opportunity?.employment_type === filters.employment_type);
      }

      if (filters.college_id) {
        result = result.filter(app => app.student?.college_id === filters.college_id);
      }

      return result;
    } catch (error) {
      logger.error('Failed to fetch all applications', error as Error);
      throw error;
    }
  }

  /**
   * Get application statistics
   */
  async getApplicationStats(filters: ApplicationFilters = {}): Promise<ApplicationStats> {
    try {
      // If college_id filter is provided, we need to filter by students from that college
      if (filters.college_id) {
        // First get student IDs from the college
        const { data: students, error: studentsError } = await supabase
          .from('students')
          .select('id')
          .eq('college_id', filters.college_id);

        if (studentsError) {
          logger.error('Failed to fetch students for stats', studentsError as Error);
          throw studentsError;
        }

        const studentIds = (students || []).map(s => s.id);

        if (studentIds.length === 0) {
          return {
            total: 0,
            applied: 0,
            viewed: 0,
            under_review: 0,
            interview_scheduled: 0,
            interviewed: 0,
            offer_received: 0,
            accepted: 0,
            rejected: 0,
            withdrawn: 0
          };
        }

        // Now query applied_jobs for these students
        let query = supabase
          .from('applied_jobs')
          .select('application_status')
          .in('student_id', studentIds);

        // Apply other filters
        if (filters.status) {
          query = query.eq('application_status', filters.status);
        }

        if (filters.date_from) {
          query = query.gte('applied_at', filters.date_from);
        }

        if (filters.date_to) {
          query = query.lte('applied_at', filters.date_to);
        }

        const { data, error } = await query;

        if (error) {
          logger.error('Failed to fetch application stats', error as Error);
          throw error;
        }

        const stats: ApplicationStats = {
          total: data?.length || 0,
          applied: 0,
          viewed: 0,
          under_review: 0,
          interview_scheduled: 0,
          interviewed: 0,
          offer_received: 0,
          accepted: 0,
          rejected: 0,
          withdrawn: 0
        };

        data?.forEach(app => {
          if (app.application_status && stats.hasOwnProperty(app.application_status)) {
            stats[app.application_status as keyof ApplicationStats]++;
          }
        });

        return stats;
      }

      // Original logic for when no college_id filter
      let query = supabase
        .from('applied_jobs')
        .select('application_status');

      // Apply filters
      if (filters.status) {
        query = query.eq('application_status', filters.status);
      }

      if (filters.date_from) {
        query = query.gte('applied_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('applied_at', filters.date_to);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to fetch application stats', error as Error);
        throw error;
      }

      const stats: ApplicationStats = {
        total: data?.length || 0,
        applied: 0,
        viewed: 0,
        under_review: 0,
        interview_scheduled: 0,
        interviewed: 0,
        offer_received: 0,
        accepted: 0,
        rejected: 0,
        withdrawn: 0
      };

      data?.forEach(app => {
        if (app.application_status && stats.hasOwnProperty(app.application_status)) {
          stats[app.application_status as keyof ApplicationStats]++;
        }
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get application stats', error as Error);
      throw error;
    }
  }

  /**
   * Update application status
   */
  async updateApplicationStatus(
    applicationId: number, 
    status: string, 
    notes?: string
  ): Promise<ApplicationTrackingData> {
    try {
      const updateData: any = {
        application_status: status,
        updated_at: new Date().toISOString()
      };

      if (notes) {
        updateData.notes = notes;
      }

      // Add timestamp for specific statuses
      if (status === 'viewed') {
        updateData.viewed_at = new Date().toISOString();
      } else if (status === 'interview_scheduled') {
        updateData.interview_scheduled_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('applied_jobs')
        .update(updateData)
        .eq('id', applicationId)
        .select()
        .single();

      if (error) {
        logger.error('Failed to update application status', error as Error);
        throw error;
      }

      // Return the updated application with joined data
      const applications = await this.getAllApplications();
      const updatedApplication = applications.find(app => app.id === applicationId);
      
      return updatedApplication || data;
    } catch (error) {
      logger.error('Failed to update application status', error as Error);
      throw error;
    }
  }

  /**
   * Bulk update application statuses
   */
  async bulkUpdateApplications(
    applicationIds: number[], 
    status: string, 
    notes?: string
  ): Promise<ApplicationTrackingData[]> {
    try {
      const updateData: any = {
        application_status: status,
        updated_at: new Date().toISOString()
      };

      if (notes) {
        updateData.notes = notes;
      }

      // Add timestamp for specific statuses
      if (status === 'viewed') {
        updateData.viewed_at = new Date().toISOString();
      } else if (status === 'interview_scheduled') {
        updateData.interview_scheduled_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('applied_jobs')
        .update(updateData)
        .in('id', applicationIds)
        .select();

      if (error) {
        logger.error('Failed to bulk update applications', error as Error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to bulk update applications', error as Error);
      throw error;
    }
  }

  /**
   * Get unique companies from applications
   */
  async getCompaniesWithApplications(): Promise<Array<{id: string, name: string}>> {
    try {
      // Get all opportunities that have applications
      const { data: appliedJobs, error: appliedJobsError } = await supabase
        .from('applied_jobs')
        .select('opportunity_id');

      if (appliedJobsError) {
        logger.error('Failed to fetch applied jobs for companies', appliedJobsError as Error);
        throw appliedJobsError;
      }

      if (!appliedJobs || appliedJobs.length === 0) {
        return [];
      }

      const opportunityIds = [...new Set(appliedJobs.map(job => job.opportunity_id))];

      const { data: opportunities, error: opportunitiesError } = await supabase
        .from('opportunities')
        .select('company_name')
        .in('id', opportunityIds);

      if (opportunitiesError) {
        logger.error('Failed to fetch opportunities for companies', opportunitiesError as Error);
        throw opportunitiesError;
      }

      // Get unique company names
      const uniqueCompanyNames = [...new Set((opportunities || []).map(opp => opp.company_name).filter(Boolean))];

      // Fetch company details
      if (uniqueCompanyNames.length === 0) {
        return [];
      }

      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, name')
        .in('name', uniqueCompanyNames);

      if (companiesError) {
        logger.error('Failed to fetch companies', companiesError as Error);
        // Return company names even if companies table lookup fails
        return uniqueCompanyNames.map((name, index) => ({ id: `temp_${index}`, name }));
      }

      return companies || [];
    } catch (error) {
      logger.error('Failed to get companies with applications', error as Error);
      throw error;
    }
  }

  /**
   * Get unique departments from applications
   */
  async getDepartmentsWithApplications(): Promise<string[]> {
    try {
      const applications = await this.getAllApplications();
      
      const departments = new Set<string>();
      
      applications.forEach(app => {
        if (app.student?.branch_field) departments.add(app.student.branch_field);
        if (app.student?.course_name) departments.add(app.student.course_name);
        if (app.opportunity?.department) departments.add(app.opportunity.department);
      });

      return Array.from(departments).filter(dept => dept && dept.trim().length > 0);
    } catch (error) {
      logger.error('Failed to get departments with applications', error as Error);
      throw error;
    }
  }

  /**
   * Get pipeline data for a specific application
   */
  async getPipelineDataForApplication(studentId: string, opportunityId: number): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('pipeline_candidates')
        .select('*')
        .eq('student_id', studentId)
        .eq('opportunity_id', opportunityId)
        .maybeSingle();

      if (error) {
        logger.error('Failed to fetch pipeline data', error as Error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Failed to get pipeline data for application', error as Error);
      return null;
    }
  }

  /**
   * Get application by ID with full details
   */
  async getApplicationById(id: number): Promise<ApplicationTrackingData | null> {
    try {
      const applications = await this.getAllApplications();
      return applications.find(app => app.id === id) || null;
    } catch (error) {
      logger.error('Failed to get application by ID', error as Error);
      throw error;
    }
  }
}

export const applicationTrackingService = new ApplicationTrackingService();
export default applicationTrackingService;