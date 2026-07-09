/**
 * POST Company Profile Handler
 * Recruitment Admin - Updates legal name and display name
 */

import { apiSuccess, apiError } from '../../../../lib/response';
import type { PagesEnv } from '../../../../lib/types';
import { createSupabaseAdminClient } from '../../../../lib/supabase';

interface UpdateProfileRequest {
  legal_name?: string;
  name?: string;
}

export async function handleUpdateProfile(
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

    const body: UpdateProfileRequest = await request.json();

    // Validate request
    if (!body.legal_name && !body.name) {
      return apiError(
        400,
        'INVALID_REQUEST',
        'At least one field (legal_name or name) is required',
        request
      );
    }

    // Validate field lengths
    if (body.legal_name && body.legal_name.length > 255) {
      return apiError(400, 'INVALID_REQUEST', 'Legal name must not exceed 255 characters', request);
    }

    if (body.name && body.name.length > 255) {
      return apiError(400, 'INVALID_REQUEST', 'Display name must not exceed 255 characters', request);
    }

    // Update organization
    const { data, error } = await supabase
      .from('organizations')
      .update({
        legal_name: body.legal_name,
        name: body.name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', organizationId)
      .select('legal_name, name')
      .single();

    if (error) throw error;

    return apiSuccess(
      {
        message: 'Company profile updated successfully',
        data,
      },
      request
    );
  } catch (error: any) {
    console.error('❌ Error updating company profile:', error);
    return apiError(500, 'INTERNAL_ERROR', error.message || 'Failed to update company profile', request);
  }
}
