import { apiPost } from '@/shared/api/apiClient';

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
  accountStatus?: string;
  approvalStatus?: string;
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

// API Response wrapper type
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: any;
  meta: {
    requestId: string;
    timestamp: string;
    durationMs?: number;
  };
}

class CompanyService {
  async getAllCompanies(): Promise<Company[]> {
    try {
      const response = await apiPost<ApiResponse<Company[]>>('/recruiter-copilot', { action: 'companies-get-all' });
      return response.data || [];
    } catch (error) {
      console.error('Error in getAllCompanies:', error);
      return [];
    }
  }

  async getFilteredCompanies(filters: {
    searchTerm?: string;
    industry?: string;
    companySize?: string;
    accountStatus?: string;
  }): Promise<Company[]> {
    try {
      const response = await apiPost<ApiResponse<Company[]>>('/recruiter-copilot', {
        action: 'companies-get-filtered',
        search_term: filters.searchTerm,
        industry: filters.industry,
        company_size: filters.companySize,
        account_status: filters.accountStatus,
      });
      return response.data || [];
    } catch (error) {
      console.error('Error in getFilteredCompanies:', error);
      return [];
    }
  }

  async addCompany(companyData: CompanyFormData): Promise<Company> {
    const response = await apiPost<ApiResponse<Company>>('/recruiter-copilot', {
      action: 'companies-add',
      ...companyData,
    });
    return response.data;
  }

  async updateCompany(id: string, companyData: Partial<CompanyFormData>): Promise<Company> {
    const response = await apiPost<ApiResponse<Company>>('/recruiter-copilot', {
      action: 'companies-update',
      id,
      ...companyData,
    });
    return response.data;
  }

  async updateCompanyStatus(id: string, status: string): Promise<Company> {
    const response = await apiPost<ApiResponse<Company>>('/recruiter-copilot', {
      action: 'companies-update-status',
      id,
      status,
    });
    return response.data;
  }

  async deleteCompany(id: string): Promise<void> {
    await apiPost<ApiResponse<{ deleted: boolean }>>('/recruiter-copilot', { action: 'companies-delete', id });
  }

  async getCompanyById(id: string): Promise<Company | null> {
    try {
      const response = await apiPost<ApiResponse<Company>>('/recruiter-copilot', {
        action: 'companies-get-by-id',
        id,
      });
      return response.data || null;
    } catch (error) {
      console.error('Error in getCompanyById:', error);
      return null;
    }
  }

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
      const response = await apiPost<ApiResponse<any[]>>('/recruiter-copilot', { action: 'companies-stats' });
      const data = response.data || [];

      const stats = {
        total: data.length,
        active: 0, pending: 0, approved: 0,
        rejected: 0, inactive: 0, suspended: 0, blacklisted: 0,
      };

      data.forEach((company: any) => {
        if (company.accountStatus) {
          stats[company.accountStatus as keyof typeof stats]++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error in getCompaniesStats:', error);
      return {
        total: 0, active: 0, pending: 0, approved: 0,
        rejected: 0, inactive: 0, suspended: 0, blacklisted: 0,
      };
    }
  }
}

export const companyService = new CompanyService();
