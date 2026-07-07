export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type PlanTier = 'starter' | 'pro' | 'premium' | 'enterprise';

export interface CompanyProfile {
  legal_name?: string;
  display_name?: string;
  description?: string;
  logo_url?: string;
}

export interface CompanyVerification {
  cin_business_reg_no?: string;
  gst_number?: string;
  tax_identification_number?: string;
  verification_status?: VerificationStatus;
  verified_at?: string;
}

export interface CompanyContacts {
  official_company_email?: string;
  official_company_phone?: string;
  hr_contact_name?: string;
  hr_contact_email?: string;
  hr_contact_phone?: string;
  hr_department_phone?: string;
}

export interface CompanyAdditional {
  website?: string;
  established_year?: number;
  employee_count?: number;
}

export interface OrganizationMetadata {
  company_profile?: CompanyProfile;
  verification?: CompanyVerification;
  contacts?: CompanyContacts;
  additional?: CompanyAdditional;
}

export interface RecruitmentFeatures {
  recruitment_enabled?: boolean;
  require_job_approval?: boolean;
  enable_skill_assessment?: boolean;
  enable_background_verification?: boolean;
  enable_bulk_email?: boolean;
  enable_interview_scheduling?: boolean;
  enable_offer_management?: boolean;
  max_job_openings?: number;
  storage_limit_gb?: number;
}

export interface OrganizationRecruitmentSettings {
  id: string;
  organization_id: string;
  recruitment_enabled: boolean;
  max_recruiters: number;
  current_recruiters: number;
  plan_tier: PlanTier;
  features: RecruitmentFeatures;
  metadata: OrganizationMetadata;
  created_at: string;
  updated_at: string;
}

// Helper type for form submissions
export interface OrganizationDetailsFormData {
  company_profile: CompanyProfile;
  verification: CompanyVerification;
  contacts: CompanyContacts;
  additional?: CompanyAdditional;
}
