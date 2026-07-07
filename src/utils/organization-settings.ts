import { supabase } from '@/lib/supabase';
import type {
  OrganizationRecruitmentSettings,
  OrganizationDetailsFormData,
  OrganizationMetadata,
  RecruitmentFeatures,
  CompanyContactColumns,
} from '@/types/organization-settings';

export async function getOrganizationSettings(
  organizationId: string
): Promise<OrganizationRecruitmentSettings | null> {
  const { data, error } = await supabase
    .from('organization_recruitment_settings')
    .select('*')
    .eq('organization_id', organizationId)
    .single();

  if (error) {
    console.error('Error fetching organization settings:', error);
    return null;
  }

  return data as OrganizationRecruitmentSettings;
}

export async function updateOrganizationDetails(
  organizationId: string,
  details: OrganizationDetailsFormData
): Promise<OrganizationRecruitmentSettings | null> {
  const { data, error } = await supabase
    .from('organization_recruitment_settings')
    .update({
      official_company_email: details.official_company_email,
      official_company_phone: details.official_company_phone,
      hr_contact_name: details.hr_contact_name,
      hr_contact_email: details.hr_contact_email,
      hr_contact_phone: details.hr_contact_phone,
      hr_department_phone: details.hr_department_phone,
      metadata: {
        company_profile: details.company_profile,
        verification: details.verification,
        additional: details.additional,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (error) {
    console.error('Error updating organization details:', error);
    throw error;
  }

  return data as OrganizationRecruitmentSettings;
}

export async function updateCompanyProfile(
  organizationId: string,
  profile: OrganizationMetadata['company_profile']
): Promise<OrganizationRecruitmentSettings | null> {
  const settings = await getOrganizationSettings(organizationId);
  if (!settings) throw new Error('Organization settings not found');

  const updatedMetadata: OrganizationMetadata = {
    ...settings.metadata,
    company_profile: {
      ...settings.metadata?.company_profile,
      ...profile,
    },
  };

  const { data, error } = await supabase
    .from('organization_recruitment_settings')
    .update({
      metadata: updatedMetadata,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (error) throw error;
  return data as OrganizationRecruitmentSettings;
}

export async function updateVerificationDetails(
  organizationId: string,
  verification: OrganizationMetadata['verification']
): Promise<OrganizationRecruitmentSettings | null> {
  const settings = await getOrganizationSettings(organizationId);
  if (!settings) throw new Error('Organization settings not found');

  const updatedMetadata: OrganizationMetadata = {
    ...settings.metadata,
    verification: {
      ...settings.metadata?.verification,
      ...verification,
    },
  };

  const { data, error } = await supabase
    .from('organization_recruitment_settings')
    .update({
      metadata: updatedMetadata,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (error) throw error;
  return data as OrganizationRecruitmentSettings;
}

export async function updateContactDetails(
  organizationId: string,
  contacts: Partial<CompanyContactColumns>
): Promise<OrganizationRecruitmentSettings | null> {
  const { data, error } = await supabase
    .from('organization_recruitment_settings')
    .update({
      official_company_email: contacts.official_company_email,
      official_company_phone: contacts.official_company_phone,
      hr_contact_name: contacts.hr_contact_name,
      hr_contact_email: contacts.hr_contact_email,
      hr_contact_phone: contacts.hr_contact_phone,
      hr_department_phone: contacts.hr_department_phone,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (error) throw error;
  return data as OrganizationRecruitmentSettings;
}

export async function updateRecruitmentFeatures(
  organizationId: string,
  features: Partial<RecruitmentFeatures>
): Promise<OrganizationRecruitmentSettings | null> {
  const settings = await getOrganizationSettings(organizationId);
  if (!settings) throw new Error('Organization settings not found');

  const updatedFeatures: RecruitmentFeatures = {
    ...settings.features,
    ...features,
  };

  const { data, error } = await supabase
    .from('organization_recruitment_settings')
    .update({
      features: updatedFeatures,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (error) throw error;
  return data as OrganizationRecruitmentSettings;
}

export function mergeMetadata(
  existing: OrganizationMetadata | undefined,
  updates: Partial<OrganizationMetadata>
): OrganizationMetadata {
  return {
    ...existing,
    company_profile: {
      ...existing?.company_profile,
      ...updates.company_profile,
    },
    verification: {
      ...existing?.verification,
      ...updates.verification,
    },
    contacts: {
      ...existing?.contacts,
      ...updates.contacts,
    },
    additional: {
      ...existing?.additional,
      ...updates.additional,
    },
  };
}
