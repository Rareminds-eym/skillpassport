import { supabase } from '../lib/supabaseClient';

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
        console.error('Error fetching applied jobs:', appliedJobsError);
        throw appliedJobsError;
      }

      if (!appliedJobs || appliedJobs.length === 0) {
        return [];
      }

      // Get unique student IDs and opportunity IDs
      const studentIds = [...new Set(appliedJobs.map(job => job.student_id))];
      const opportunityIds = [...new Set(appliedJobs.map(job => job.opportunity_id))];

      // Fetch students data - applied_jobs.student_id references students.id
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, user_id, name, email, contact_number, university, branch_field, course_name, college_school_name, district_name, currentCgpa, expectedGraduationDate, approval_status, college_id')
        .in('id', studentIds);

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
      }

      console.log('Students fetch result:', {
        requested: studentIds.length,
        received: students?.length || 0,
        error: studentsError,
        sampleStudent: students?.[0]
      });

      // Fetch opportunities data
      const { data: opportunities, error: opportunitiesError } = await supabase
        .from('opportunities')
        .select('*')
        .in('id', opportunityIds);

      if (opportunitiesError) {
        console.error('Error fetching opportunities:', opportunitiesError);
      }

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
          console.error('Error fetching companies:', companiesError);
        } else {
          companies = companiesData || [];
        }
      }

      // Create lookup maps - applied_jobs.student_id references students.id
      const studentMap = (students || []).reduce((acc, student) => {
        acc[student.id] = student;
        return acc;
      }, {} as Record<string, any>);

      console.log('ApplicationTracking Debug:', {
        totalApplications: appliedJobs.length,
        totalStudents: students?.length || 0,
        studentMapSize: Object.keys(studentMap).length,
        sampleStudent: students?.[0],
        sampleApplication: appliedJobs[0]
      });

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

        // Debug log for first few records
        if (appliedJobs.indexOf(job) < 3) {
          console.log('Mapping application:', {
            applicationId: job.id,
            studentId: job.student_id,
            foundStudent: !!student,
            studentName: student?.name,
            studentEmail: student?.email
          });
        }

        return {
          ...job,
          student: student ? {
            id: student.id,
            user_id: student.user_id,
            name: student.name || 'Unknown Student',
            email: student.email || 'No email',
            contact_number: student.contact_number || student.contactNumber || '',
            university: student.university || '',
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
            university: '',
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
      console.error('Error in getAllApplications:', error);
      throw error;
    }
  }

  /**
   * Get application statistics
   */
  async getApplicationStats(filters: ApplicationFilters = {}): Promise<ApplicationStats> {
    try {
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
        console.error('Error fetching application stats:', error);
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
      console.error('Error in getApplicationStats:', error);
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
        console.error('Error updating application status:', error);
        throw error;
      }

      // Return the updated application with joined data
      const applications = await this.getAllApplications();
      const updatedApplication = applications.find(app => app.id === applicationId);
      
      return updatedApplication || data;
    } catch (error) {
      console.error('Error in updateApplicationStatus:', error);
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
        console.error('Error bulk updating applications:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in bulkUpdateApplications:', error);
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
        console.error('Error fetching applied jobs for companies:', appliedJobsError);
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
        console.error('Error fetching opportunities for companies:', opportunitiesError);
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
        console.error('Error fetching companies:', companiesError);
        // Return company names even if companies table lookup fails
        return uniqueCompanyNames.map((name, index) => ({ id: `temp_${index}`, name }));
      }

      return companies || [];
    } catch (error) {
      console.error('Error in getCompaniesWithApplications:', error);
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
      console.error('Error in getDepartmentsWithApplications:', error);
      throw error;
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
      console.error('Error in getApplicationById:', error);
      throw error;
    }
  }
}

export const applicationTrackingService = new ApplicationTrackingService();
export default applicationTrackingService;