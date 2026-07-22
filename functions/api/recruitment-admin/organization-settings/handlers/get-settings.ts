/**
 * GET Organization Settings Handler
 * Recruitment Admin - Fetches company profile, contact info, and verification details
 */

import { apiSuccess, apiError } from '../../../../lib/response';
import type { PagesEnv } from '../../../../lib/types';
import { createSupabaseAdminClient } from '../../../../lib/supabase';

export async function handleGetSettings(
  organizationId: string,
  env: PagesEnv,
  userId: string,
  request: Request
): Promise<Response> {
  try {
    const supabase = createSupabaseAdminClient(env);

    // Verify user has recruitment-admin role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError || !user || user.role !== 'recruitment-admin') {
      return apiError(403, 'FORBIDDEN', 'Only recruitment admins can access this resource', request);
    }

    // Fetch settings from database
    const [orgResult, settingsResult, verificationResult] = await Promise.all([
      supabase
        .from('organizations')
        .select('legal_name, name')
        .eq('id', organizationId)
        .single(),

      supabase
        .from('organization_recruitment_settings')
        .select('official_company_email, company_phone_number, hr_contact_phone_number, hr_support_email')
        .eq('organization_id', organizationId)
        .single(),

      supabase
        .from('organization_recruitment_verification')
        .select('*')
        .eq('organization_id', organizationId)
        .single(),
    ]);

    return apiSuccess(
      {
        company_names: {
          legal_name: orgResult.data?.legal_name,
          name: orgResult.data?.name,
        },
        contact_info: {
          official_company_email: settingsResult.data?.official_company_email,
          company_phone_number: settingsResult.data?.company_phone_number,
          hr_contact_phone_number: settingsResult.data?.hr_contact_phone_number,
          hr_support_email: settingsResult.data?.hr_support_email,
        },
        verification: verificationResult.data,
      },
      request
    );
  } catch (error: any) {
    console.error('❌ Error getting organization settings:', error);
    return apiError(500, 'INTERNAL_ERROR', error.message || 'Failed to fetch settings', request);
  }
}
