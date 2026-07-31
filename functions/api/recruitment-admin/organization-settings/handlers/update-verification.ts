/**
 * POST Update Verification Handler
 * Recruitment Admin - Updates verification details or status
 */

import { apiSuccess, apiError } from '../../../../lib/response';
import type { PagesEnv } from '../../../../lib/types';
import { createSupabaseAdminClient } from '../../../../lib/supabase';

interface UpdateVerificationRequest {
  cin_business_reg_no?: string;
  gst_number?: string;
  tax_identification_number?: string;
  incorporation_date?: string;
  verification_status?: string;
  notes?: string;
}

const VALID_STATUSES = ['pending', 'approved', 'rejected', 'under_review'];

export async function handleUpdateVerification(
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

    const body: UpdateVerificationRequest = await request.json();

    // Check if this is a status-only update
    const isStatusUpdate =
      body.verification_status && !body.cin_business_reg_no && !body.gst_number;

    if (isStatusUpdate) {
      // Validate status
      if (!VALID_STATUSES.includes(body.verification_status!)) {
        return apiError(
          400,
          'INVALID_REQUEST',
          `Invalid verification status. Must be one of: ${VALID_STATUSES.join(', ')}`,
          request
        );
      }

      // Update status
      const { data, error } = await supabase
        .from('organization_recruitment_verification')
        .update({
          verification_status: body.verification_status,
          notes: body.notes,
          verified_at: body.verification_status === 'approved' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw error;

      return apiSuccess(
        {
          message: `Verification status updated to ${body.verification_status}`,
          data,
        },
        request
      );
    } else {
      // Regular verification details update
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (body.cin_business_reg_no !== undefined) {
        updateData.cin_business_reg_no = body.cin_business_reg_no;
      }
      if (body.gst_number !== undefined) {
        updateData.gst_number = body.gst_number;
      }
      if (body.tax_identification_number !== undefined) {
        updateData.tax_identification_number = body.tax_identification_number;
      }
      if (body.incorporation_date !== undefined) {
        updateData.incorporation_date = body.incorporation_date;
      }

      if (Object.keys(updateData).length === 1) {
        return apiError(400, 'INVALID_REQUEST', 'At least one verification field is required', request);
      }

      const { data, error } = await supabase
        .from('organization_recruitment_verification')
        .update(updateData)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) throw error;

      return apiSuccess(
        {
          message: 'Verification details updated successfully',
          data,
        },
        request
      );
    }
  } catch (error: any) {
    console.error('❌ Error updating verification:', error);
    return apiError(500, 'INTERNAL_ERROR', error.message || 'Failed to update verification', request);
  }
}
