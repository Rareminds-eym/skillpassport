/**
 * POST Update Contacts Handler
 * Recruitment Admin - Updates official company email, phone, and HR contact information
 */

import { apiSuccess, apiError } from '../../../../lib/response';
import type { PagesEnv } from '../../../../lib/types';
import { createSupabaseAdminClient } from '../../../../lib/supabase';

interface UpdateContactsRequest {
  official_company_email?: string;
  company_phone_number?: string;
  hr_contact_phone_number?: string;
  hr_support_email?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function handleUpdateContacts(
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

    const body: UpdateContactsRequest = await request.json();

    // Validate at least one field
    if (
      !body.official_company_email &&
      !body.company_phone_number &&
      !body.hr_contact_phone_number &&
      !body.hr_support_email
    ) {
      return apiError(400, 'INVALID_REQUEST', 'At least one contact field is required', request);
    }

    // Validate email formats
    if (body.official_company_email && !EMAIL_REGEX.test(body.official_company_email)) {
      return apiError(400, 'INVALID_REQUEST', 'Invalid official company email format', request);
    }

    if (body.hr_support_email && !EMAIL_REGEX.test(body.hr_support_email)) {
      return apiError(400, 'INVALID_REQUEST', 'Invalid HR support email format', request);
    }

    // Update settings
    const { data, error } = await supabase
      .from('organization_recruitment_settings')
      .update({
        official_company_email: body.official_company_email,
        company_phone_number: body.company_phone_number,
        hr_contact_phone_number: body.hr_contact_phone_number,
        hr_support_email: body.hr_support_email,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', organizationId)
      .select(
        'official_company_email, company_phone_number, hr_contact_phone_number, hr_support_email'
      )
      .single();

    if (error) throw error;

    return apiSuccess(
      {
        message: 'Contact information updated successfully',
        data,
      },
      request
    );
  } catch (error: any) {
    console.error('❌ Error updating contacts:', error);
    return apiError(500, 'INTERNAL_ERROR', error.message || 'Failed to update contact information', request);
  }
}
