import { supabase } from '../lib/supabaseClient';

export interface Company {
  id: string;
  name: string;
  code: string;
  industry?: string;
  companySize?: string;
  hqAddress?: string;
  hqCity?: string;
  hqState?: string;
  hqCountry?: string;
  hqPincode?: string;
  phone?: string;
  email?: string;
  website?: string;
  establishedYear?: number;
  contactPersonName?: string;
  contactPersonDesignation?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
  accountStatus?:
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'active'
    | 'inactive'
    | 'suspended'
    | 'blacklisted';
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
  metadata?: any;
  approvedBy?: string;
  approvedAt?: string;
  totalBranches?: number;
  totalRecruiters?: number;
  hqRecruiters?: number;
  branchRecruiters?: number;
  created_by?: string;
  updated_by?: string;
}

export interface CompanyFormData {
  name: string;
  code: string;
  industry: string;
  companySize: string;
  establishedYear: string;
  hqAddress: string;
  hqCity: string;
  hqState: string;
  hqCountry: string;
  hqPincode: string;
  phone: string;
  email: string;
  website: string;
  contactPersonName: string;
  contactPersonDesignation: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
  companyDescription?: string;
  specialRequirements?: string;
}

class CompanyService {
  // Fetch all companies
  async getAllCompanies(): Promise<Company[]> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) {
        console.error('Error fetching companies:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllCompanies:', error);
      throw error;
    }
  }

  // Fetch companies with filters
  async getFilteredCompanies(filters: {
    searchTerm?: string;
    industry?: string;
    companySize?: string;
    accountStatus?: string;
  }): Promise<Company[]> {
    try {
      let query = supabase.from('companies').select('*');

      // Apply search filter
      if (filters.searchTerm) {
        query = query.or(
          `name.ilike.%${filters.searchTerm}%,code.ilike.%${filters.searchTerm}%,industry.ilike.%${filters.searchTerm}%`
        );
      }

      // Apply industry filter
      if (filters.industry) {
        query = query.eq('industry', filters.industry);
      }

      // Apply company size filter
      if (filters.companySize) {
        query = query.eq('companySize', filters.companySize);
      }

      // Apply status filter
      if (filters.accountStatus) {
        query = query.eq('accountStatus', filters.accountStatus);
      }

      query = query.order('createdAt', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching filtered companies:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getFilteredCompanies:', error);
      throw error;
    }
  }

  // Add new company
  async addCompany(companyData: CompanyFormData): Promise<Company> {
    try {
      const newCompany = {
        name: companyData.name,
        code: companyData.code,
        industry: companyData.industry,
        companySize: companyData.companySize,
        establishedYear: companyData.establishedYear ? parseInt(companyData.establishedYear) : null,
        hqAddress: companyData.hqAddress,
        hqCity: companyData.hqCity,
        hqState: companyData.hqState,
        hqCountry: companyData.hqCountry,
        hqPincode: companyData.hqPincode,
        phone: companyData.phone,
        email: companyData.email,
        website: companyData.website,
        contactPersonName: companyData.contactPersonName,
        contactPersonDesignation: companyData.contactPersonDesignation,
        contactPersonEmail: companyData.contactPersonEmail,
        contactPersonPhone: companyData.contactPersonPhone,
        accountStatus: 'pending' as const,
        approvalStatus: 'pending' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalBranches: 0,
        totalRecruiters: 0,
        hqRecruiters: 0,
        branchRecruiters: 0,
        metadata: {
          companyDescription: companyData.companyDescription || '',
          specialRequirements: companyData.specialRequirements || '',
          registrationDate: new Date().toISOString(),
        },
      };

      const { data, error } = await supabase
        .from('companies')
        .insert([newCompany])
        .select()
        .single();

      if (error) {
        console.error('Error adding company:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in addCompany:', error);
      throw error;
    }
  }

  // Update company
  async updateCompany(id: string, companyData: Partial<CompanyFormData>): Promise<Company> {
    try {
      // Separate metadata fields from regular fields
      const { companyDescription, specialRequirements, ...regularFields } = companyData;

      const updateData: any = {
        ...regularFields,
        updatedAt: new Date().toISOString(),
      };

      // Convert establishedYear to number if provided
      if (companyData.establishedYear) {
        updateData.establishedYear = parseInt(companyData.establishedYear);
      }

      // Handle metadata fields properly
      if (companyDescription !== undefined || specialRequirements !== undefined) {
        // First get the current metadata
        const { data: currentCompany } = await supabase
          .from('companies')
          .select('metadata')
          .eq('id', id)
          .single();

        const currentMetadata = currentCompany?.metadata || {};

        updateData.metadata = {
          ...currentMetadata,
          ...(companyDescription !== undefined && { companyDescription }),
          ...(specialRequirements !== undefined && { specialRequirements }),
        };
      }

      const { data, error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating company:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateCompany:', error);
      throw error;
    }
  }

  // Update company status
  async updateCompanyStatus(id: string, status: string): Promise<Company> {
    try {
      const { data, error } = await supabase
        .from('companies')
        .update({
          accountStatus: status,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating company status:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateCompanyStatus:', error);
      throw error;
    }
  }

  // Delete company
  async deleteCompany(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('companies').delete().eq('id', id);

      if (error) {
        console.error('Error deleting company:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteCompany:', error);
      throw error;
    }
  }

  // Get company by ID
  async getCompanyById(id: string): Promise<Company | null> {
    try {
      const { data, error } = await supabase.from('companies').select('*').eq('id', id).single();

      if (error) {
        console.error('Error fetching company by ID:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getCompanyById:', error);
      throw error;
    }
  }

  // Get companies statistics
  async getCompaniesStats(): Promise<{
    total: number;
    active: number;
    pending: number;
    approved: number;
    rejected: number;
    inactive: number;
    suspended: number;
    blacklisted: number;
  }> {
    try {
      const { data, error } = await supabase.from('companies').select('accountStatus');

      if (error) {
        console.error('Error fetching companies stats:', error);
        throw error;
      }

      const stats = {
        total: data?.length || 0,
        active: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        inactive: 0,
        suspended: 0,
        blacklisted: 0,
      };

      data?.forEach((company) => {
        if (company.accountStatus) {
          stats[company.accountStatus as keyof typeof stats]++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error in getCompaniesStats:', error);
      throw error;
    }
  }
}

export const companyService = new CompanyService();
