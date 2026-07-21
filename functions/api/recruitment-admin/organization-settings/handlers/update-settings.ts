/**
 * PUT Organization Settings Handler
 * Recruitment Admin - Updates all settings at once
 */

import { apiSuccess, apiError } from '../../../../lib/response';
import type { PagesEnv } from '../../../../lib/types';
import { createSupabaseAdminClient } from '../../../../lib/supabase';

interface UpdateSettingsRequest {
  company_names?: { legal_name?: string; name?: string };
  contact_info?: {
    official_company_email?: string;
    company_phone_number?: string;
    hr_contact_phone_number?: string;
    hr_support_email?: string;
  };
  verification?: Record<string, any>;
}

export async function handleUpdateSettings(
  request: Request,
  organizationId: string,
  env: PagesEnv,
  userId: string
): Promise<Response> {
  try {
    const supabase = createSupabaseAdminClient(env);

    // Verify recruitment-admin role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError || !user || user.role !== 'recruitment-admin') {
      return apiError(403, 'FORBIDDEN', 'Only recruitment admins can update organization settings', request);
    }

    const body: UpdateSettingsRequest = await request.json();

    // Validate at least one section is provided
    if (!body.company_names && !body.contact_info && !body.verification) {
      return apiError(400, 'INVALID_REQUEST', 'At least one settings section is required', request);
    }

    // Update company names if provided
    if (body.company_names) {
      await supabase
        .from('organizations')
        .update({
          legal_name: body.company_names.legal_name,
          name: body.company_names.name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organizationId);
    }

    // Update contact info if provided
    if (body.contact_info) {
      await supabase
        .from('organization_recruitment_settings')
        .update({
          official_company_email: body.contact_info.official_company_email,
          company_phone_number: body.contact_info.company_phone_number,
          hr_contact_phone_number: body.contact_info.hr_contact_phone_number,
          hr_support_email: body.contact_info.hr_support_email,
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', organizationId);
    }

    // Update verification if provided
    if (body.verification) {
      await supabase
        .from('organization_recruitment_verification')
        .update({
          ...body.verification,
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', organizationId);
    }

    return apiSuccess(
      {
        message: 'Organization settings updated successfully',
        data: body,
      },
      request
    );
  } catch (error: any) {
    console.error('❌ Error updating organization settings:', error);
    return apiError(500, 'INTERNAL_ERROR', error.message || 'Failed to update settings', request);
  }
}
