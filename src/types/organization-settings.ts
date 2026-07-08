export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'under_review';
export type PlanTier = 'starter' | 'pro' | 'premium' | 'enterprise';

// Stored in organizations table (legal_name), 'name' field is used for display/brand name
export interface CompanyNames {
  legal_name?: string;
  name?: string; // display/brand name (existing field)
}

// Stored in organization_recruitment_settings table
export interface CompanyContactInfo {
  official_company_email?: string;
  company_phone_number?: string;
  hr_contact_phone_number?: string;
  hr_support_email?: string;
}

// Stored in organization_recruitment_verification table
export interface OrganizationRecruitmentVerification {
  id?: string;
  organization_id?: string;
  cin_business_reg_no?: string;
  gst_number?: string;
  tax_identification_number?: string;
  incorporation_date?: string;
  verification_status?: VerificationStatus;
  verified_at?: string;
  notes?: string;
  registration_certificate_url?: string;
  gst_certificate_url?: string;
  business_license_url?: string;
  created_at?: string;
  updated_at?: string;
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
  official_company_email?: string;
  company_phone_number?: string;
  hr_contact_phone_number?: string;
  hr_support_email?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Form submission type combining all details
export interface OrganizationDetailsFormData {
  company_names: CompanyNames;
  contact_info: CompanyContactInfo;
  verification: OrganizationRecruitmentVerification;
}
