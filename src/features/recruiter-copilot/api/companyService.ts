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

class CompanyService {
  async getAllCompanies(): Promise<Company[]> {
    try {
      const response = await apiPost<any>('/recruiter-copilot', { action: 'companies-get-all' });
      // Backend returns { success, data, error, meta } format
      return Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
    } catch {
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
      const response = await apiPost<any>('/recruiter-copilot', {
        action: 'companies-get-filtered',
        search_term: filters.searchTerm,
        industry: filters.industry,
        company_size: filters.companySize,
        account_status: filters.accountStatus,
      });
      // Backend returns { success, data, error, meta } format
      return Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);
    } catch {
      return [];
    }
  }

  async addCompany(companyData: CompanyFormData): Promise<Company> {
    const response = await apiPost<any>('/recruiter-copilot', {
      action: 'companies-add',
      ...companyData,
    });
    // Backend returns { success, data, error, meta } format
    return response?.data || response;
  }

  async updateCompany(id: string, companyData: Partial<CompanyFormData>): Promise<Company> {
    const response = await apiPost<any>('/recruiter-copilot', {
      action: 'companies-update',
      id,
      ...companyData,
    });
    // Backend returns { success, data, error, meta } format
    return response?.data || response;
  }

  async updateCompanyStatus(id: string, status: string): Promise<Company> {
    const response = await apiPost<any>('/recruiter-copilot', {
      action: 'companies-update-status',
      id,
      status,
    });
    // Backend returns { success, data, error, meta } format
    return response?.data || response;
  }

  async deleteCompany(id: string): Promise<void> {
    await apiPost('/recruiter-copilot', { action: 'companies-delete', id });
  }

  async getCompanyById(id: string): Promise<Company | null> {
    try {
      const response = await apiPost<any>('/recruiter-copilot', {
        action: 'companies-get-by-id',
        id,
      });
      // Backend returns { success, data, error, meta } format
      return response?.data || response || null;
    } catch {
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
      const response = await apiPost<any>('/recruiter-copilot', { action: 'companies-stats' });
      // Backend returns { success, data, error, meta } format
      const data = Array.isArray(response?.data) ? response.data : (Array.isArray(response) ? response : []);

      const stats = {
        total: data?.length || 0,
        active: 0, pending: 0, approved: 0,
        rejected: 0, inactive: 0, suspended: 0, blacklisted: 0,
      };

      data?.forEach((company: any) => {
        if (company.accountStatus) {
          stats[company.accountStatus as keyof typeof stats]++;
        }
      });

      return stats;
    } catch {
      return {
        total: 0, active: 0, pending: 0, approved: 0,
        rejected: 0, inactive: 0, suspended: 0, blacklisted: 0,
      };
    }
  }
}

export const companyService = new CompanyService();
