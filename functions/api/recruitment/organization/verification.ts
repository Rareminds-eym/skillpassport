/**
 * Company Verification API
 * Manages company verification documents and status
 */

import { withAuth } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import { verifyOrgAccess, PERMISSIONS } from '../../../lib/permissions';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

/**
 * GET /api/recruitment/organization/verification
 * Fetch company verification details
 */
export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);

    const url = new URL(context.request.url);
    const orgId = url.searchParams.get('org_id');

    if (!orgId) {
        return Response.json({
            error: 'Organization ID is required'
        }, { status: 400 });
    }

    // Verify user has access
    const access = await verifyOrgAccess(supabase, user.sub, orgId, undefined);
    if (!access.allowed) {
        return access.error!;
    }

    try {
        // Fetch verification data
        const { data: verificationData, error: verificationError } = await supabase
            .from('company_verification')
            .select('*')
            .eq('organization_id', orgId)
            .single();

        // If no verification record exists, return empty structure
        if (verificationError && verificationError.code === 'PGRST116') {
            return Response.json({
                verification: {
                    organization_id: orgId,
                    verification_status: 'pending',
                    domain_verification_status: 'pending',
                },
                exists: false,
            });
        }

        if (verificationError) {
            console.error('[verification API] Error fetching verification:', verificationError);
            return Response.json({
                error: 'Failed to fetch verification data',
                details: verificationError.message
            }, { status: 500 });
        }

        return Response.json({
            verification: verificationData,
            exists: true,
        });

    } catch (error: any) {
        console.error('[verification API] Unexpected error:', error);
        return Response.json({
            error: 'Failed to fetch verification data',
            details: error.message
        }, { status: 500 });
    }
});

/**
 * PUT /api/recruitment/organization/verification
 * Update company verification details
 */
export const onRequestPut = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);

    let body: any;
    try {
        body = await context.request.json();
    } catch (error) {
        return Response.json({
            error: 'Invalid JSON body'
        }, { status: 400 });
    }

    const { org_id, ...verificationData } = body;

    if (!org_id) {
        return Response.json({
            error: 'Organization ID is required'
        }, { status: 400 });
    }

    // Verify user has admin access
    const access = await verifyOrgAccess(supabase, user.sub, org_id, PERMISSIONS.MANAGE_ORG_SETTINGS);
    if (!access.allowed) {
        return access.error!;
    }

    try {
        // Allowed fields for update
        const allowedFields = [
            'registration_number',
            'gst_number',
            'tax_identification_number',
            'incorporation_date',
            'registration_certificate_url',
            'gst_certificate_url',
            'business_license_url',
            'verification_notes',
        ];

        const updateData: any = {
            organization_id: org_id,
        };

        for (const field of allowedFields) {
            if (field in verificationData) {
                updateData[field] = verificationData[field];
            }
        }

        updateData.updated_at = new Date().toISOString();

        console.log('[verification API] Upserting verification data:', {
            orgId: org_id,
            fields: Object.keys(updateData),
        });

        // Upsert verification data
        const { data: updatedVerification, error: upsertError } = await supabase
            .from('company_verification')
            .upsert(updateData, {
                onConflict: 'organization_id',
            })
            .select()
            .single();

        if (upsertError) {
            console.error('[verification API] Upsert failed:', upsertError);
            return Response.json({
                error: 'Failed to update verification data',
                details: upsertError.message
            }, { status: 500 });
        }

        return Response.json({
            success: true,
            message: 'Verification data updated successfully',
            verification: updatedVerification,
        });

    } catch (error: any) {
        console.error('[verification API] Unexpected error:', error);
        return Response.json({
            error: 'Failed to update verification data',
            details: error.message
        }, { status: 500 });
    }
});

/**
 * POST /api/recruitment/organization/verification/submit
 * Submit verification for review
 */
export const onRequest_submit = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);

    let body: any;
    try {
        body = await context.request.json();
    } catch (error) {
        return Response.json({
            error: 'Invalid JSON body'
        }, { status: 400 });
    }

    const { org_id } = body;

    if (!org_id) {
        return Response.json({
            error: 'Organization ID is required'
        }, { status: 400 });
    }

    // Verify user has admin access
    const access = await verifyOrgAccess(supabase, user.sub, org_id, PERMISSIONS.MANAGE_ORG_SETTINGS);
    if (!access.allowed) {
        return access.error!;
    }

    try {
        // Validate required documents are uploaded
        const { data: verificationData, error: fetchError } = await supabase
            .from('company_verification')
            .select('registration_number, registration_certificate_url')
            .eq('organization_id', org_id)
            .single();

        if (fetchError || !verificationData) {
            return Response.json({
                error: 'Verification data not found. Please fill in verification details first.',
            }, { status: 400 });
        }

        if (!verificationData.registration_number || !verificationData.registration_certificate_url) {
            return Response.json({
                error: 'Registration number and certificate are required for verification',
            }, { status: 400 });
        }

        // Update status to 'in_review'
        const { error: updateError } = await supabase
            .from('company_verification')
            .update({
                verification_status: 'in_review',
                updated_at: new Date().toISOString(),
            })
            .eq('organization_id', org_id);

        if (updateError) {
            console.error('[verification API] Failed to submit:', updateError);
            return Response.json({
                error: 'Failed to submit verification',
                details: updateError.message
            }, { status: 500 });
        }

        console.log('[verification API] Verification submitted:', org_id);

        // TODO: Send notification to admin team for review
        // TODO: Create audit log entry

        return Response.json({
            success: true,
            message: 'Verification submitted successfully. Our team will review within 2-3 business days.',
        });

    } catch (error: any) {
        console.error('[verification API] Unexpected error:', error);
        return Response.json({
            error: 'Failed to submit verification',
            details: error.message
        }, { status: 500 });
    }
});

/**
 * POST /api/recruitment/organization/verification/verify-domain
 * Verify domain ownership
 */
export const onRequest_verifyDomain = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);

    let body: any;
    try {
        body = await context.request.json();
    } catch (error) {
        return Response.json({
            error: 'Invalid JSON body'
        }, { status: 400 });
    }

    const { org_id, domain } = body;

    if (!org_id || !domain) {
        return Response.json({
            error: 'Organization ID and domain are required'
        }, { status: 400 });
    }

    // Verify user has admin access
    const access = await verifyOrgAccess(supabase, user.sub, org_id, PERMISSIONS.MANAGE_ORG_SETTINGS);
    if (!access.allowed) {
        return access.error!;
    }

    try {
        // Generate verification token
        const verificationToken = `skillpassport-verify-${org_id.substring(0, 8)}-${Date.now()}`;

        // TODO: Check DNS TXT record for verification token
        // For now, we'll do a simple domain format validation
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
        if (!domainRegex.test(domain)) {
            return Response.json({
                error: 'Invalid domain format',
            }, { status: 400 });
        }

        // Update verification data with domain and token
        const { error: updateError } = await supabase
            .from('company_verification')
            .upsert({
                organization_id: org_id,
                verified_domain: domain,
                domain_verification_token: verificationToken,
                domain_verification_status: 'pending',
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'organization_id',
            });

        if (updateError) {
            console.error('[verification API] Failed to update domain:', updateError);
            return Response.json({
                error: 'Failed to initiate domain verification',
                details: updateError.message
            }, { status: 500 });
        }

        return Response.json({
            success: true,
            message: 'Domain verification initiated',
            verification_token: verificationToken,
            instructions: {
                step1: 'Add the following TXT record to your domain DNS:',
                record_name: '_skillpassport-verification',
                record_value: verificationToken,
                step2: 'Wait for DNS propagation (can take up to 48 hours)',
                step3: 'Click "Verify Domain" button again to complete verification',
            },
        });

    } catch (error: any) {
        console.error('[verification API] Unexpected error:', error);
        return Response.json({
            error: 'Failed to verify domain',
            details: error.message
        }, { status: 500 });
    }
});
