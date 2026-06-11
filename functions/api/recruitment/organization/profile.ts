/**
 * Organization Profile API
 * Manages company profile information
 */

import { withAuth } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import { verifyOrgAccess, PERMISSIONS } from '../../../lib/permissions';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

/**
 * GET /api/recruitment/organization/profile
 * Fetch complete organization profile
 */
export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);

    const url = new URL(context.request.url);
    const orgId = url.searchParams.get('org_id');

    console.log('[profile API] GET request:', {
        userId: user.sub,
        orgId,
    });

    if (!orgId) {
        return Response.json({
            error: 'Organization ID is required'
        }, { status: 400 });
    }

    // Verify user has access to this organization
    const access = await verifyOrgAccess(supabase, user.sub, orgId, undefined);
    if (!access.allowed) {
        console.error('[profile API] Access denied');
        return access.error!;
    }

    try {
        // Fetch organization profile
        const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select(`
                id,
                name,
                legal_name,
                display_name,
                description,
                industry,
                company_size,
                founded_year,
                website_url,
                logo_url,
                headquarters_address,
                headquarters_country,
                headquarters_state,
                headquarters_city,
                created_at,
                updated_at
            `)
            .eq('id', orgId)
            .single();

        if (orgError) {
            console.error('[profile API] Error fetching profile:', orgError);
            return Response.json({
                error: 'Failed to fetch organization profile',
                details: orgError.message
            }, { status: 500 });
        }

        // Get verification status summary
        const { data: verificationData } = await supabase
            .from('company_verification')
            .select('verification_status, domain_verification_status')
            .eq('organization_id', orgId)
            .single();

        // Calculate profile completion percentage
        const requiredFields = [
            'legal_name', 'display_name', 'description', 'industry',
            'company_size', 'website_url', 'headquarters_country',
            'headquarters_state', 'headquarters_city'
        ];

        const completedFields = requiredFields.filter(field =>
            orgData[field] && orgData[field] !== ''
        ).length;

        const completionPercentage = Math.round((completedFields / requiredFields.length) * 100);

        console.log('[profile API] Profile fetched successfully:', {
            orgId,
            completionPercentage,
        });

        return Response.json({
            profile: orgData,
            verification_status: verificationData?.verification_status || 'pending',
            domain_verification_status: verificationData?.domain_verification_status || 'pending',
            completion_percentage: completionPercentage,
        });

    } catch (error: any) {
        console.error('[profile API] Unexpected error:', error);
        return Response.json({
            error: 'Failed to fetch organization profile',
            details: error.message
        }, { status: 500 });
    }
});

/**
 * PUT /api/recruitment/organization/profile
 * Update organization profile
 */
export const onRequestPut = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);

    console.log('[profile API] PUT request:', {
        userId: user.sub,
    });

    let body: any;
    try {
        body = await context.request.json();
    } catch (error) {
        return Response.json({
            error: 'Invalid JSON body'
        }, { status: 400 });
    }

    const { org_id, ...profileData } = body;

    if (!org_id) {
        return Response.json({
            error: 'Organization ID is required'
        }, { status: 400 });
    }

    // Verify user has admin access
    const access = await verifyOrgAccess(supabase, user.sub, org_id, PERMISSIONS.MANAGE_ORG_SETTINGS);
    if (!access.allowed) {
        console.error('[profile API] Admin access required');
        return access.error!;
    }

    try {
        // Validate and sanitize input
        const allowedFields = [
            'name',
            'legal_name',
            'display_name',
            'description',
            'industry',
            'company_size',
            'founded_year',
            'website_url',
            'logo_url',
            'headquarters_address',
            'headquarters_country',
            'headquarters_state',
            'headquarters_city',
        ];

        const updateData: any = {};
        for (const field of allowedFields) {
            if (field in profileData) {
                updateData[field] = profileData[field];
            }
        }

        // Add updated timestamp
        updateData.updated_at = new Date().toISOString();

        console.log('[profile API] Updating profile with fields:', Object.keys(updateData));

        // Update organization profile
        const { data: updatedOrg, error: updateError } = await supabase
            .from('organizations')
            .update(updateData)
            .eq('id', org_id)
            .select()
            .single();

        if (updateError) {
            console.error('[profile API] Update failed:', updateError);
            return Response.json({
                error: 'Failed to update organization profile',
                details: updateError.message
            }, { status: 500 });
        }

        console.log('[profile API] Profile updated successfully:', org_id);

        return Response.json({
            success: true,
            message: 'Organization profile updated successfully',
            profile: updatedOrg,
        });

    } catch (error: any) {
        console.error('[profile API] Unexpected error:', error);
        return Response.json({
            error: 'Failed to update organization profile',
            details: error.message
        }, { status: 500 });
    }
});
