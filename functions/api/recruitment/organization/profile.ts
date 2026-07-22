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
        // Fetch organization profile - only columns that exist
        const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select(`
                id,
                name,
                legal_name,
                description,
                website,
                logo_url,
                address,
                city,
                state,
                country,
                established_year,
                metadata,
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

        // Extract metadata if it exists
        const metadata = orgData.metadata || {};

        // Normalize company_size - strip " employees" suffix if present
        let companySize = metadata.company_size || null;
        if (companySize && typeof companySize === 'string') {
            companySize = companySize.replace(/\s+employees$/i, '');
        }

        // Map database fields to API response fields
        const mappedProfile = {
            id: orgData.id,
            name: orgData.name,
            legal_name: orgData.legal_name || null,
            display_name: orgData.name || null, // Map 'name' to 'display_name'
            description: orgData.description,
            industry: metadata.industry || null,
            company_size: companySize,
            founded_year: metadata.founded_year || orgData.established_year || null,
            website_url: orgData.website || null,
            logo_url: orgData.logo_url,
            headquarters_address: orgData.address || null,
            headquarters_city: orgData.city || null,
            headquarters_state: orgData.state || null,
            headquarters_country: orgData.country || null,
            created_at: orgData.created_at,
            updated_at: orgData.updated_at,
        };

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
            mappedProfile[field as keyof typeof mappedProfile] &&
            mappedProfile[field as keyof typeof mappedProfile] !== ''
        ).length;

        const completionPercentage = Math.round((completedFields / requiredFields.length) * 100);

        console.log('[profile API] Profile fetched successfully:', {
            orgId,
            completionPercentage,
        });

        return Response.json({
            profile: mappedProfile,
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
        // Fetch current organization to preserve metadata
        const { data: currentOrg } = await supabase
            .from('organizations')
            .select('metadata')
            .eq('id', org_id)
            .single();

        const currentMetadata = currentOrg?.metadata || {};

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

        // Prepare column updates
        const columnData: any = {};
        const newMetadata = { ...currentMetadata };

        for (const field of allowedFields) {
            if (field in profileData) {
                const value = profileData[field];

                // Map to correct database columns
                if (field === 'display_name') {
                    columnData['name'] = value; // Map display_name to name column
                } else if (field === 'website_url') {
                    columnData['website'] = value;
                } else if (field === 'headquarters_address') {
                    columnData['address'] = value;
                } else if (field === 'headquarters_city') {
                    columnData['city'] = value;
                } else if (field === 'headquarters_state') {
                    columnData['state'] = value;
                } else if (field === 'headquarters_country') {
                    columnData['country'] = value;
                } else if (field === 'founded_year') {
                    newMetadata['founded_year'] = value; // Store in metadata
                } else if (field === 'industry') {
                    newMetadata['industry'] = value; // Store in metadata
                } else if (field === 'company_size') {
                    newMetadata['company_size'] = value; // Store in metadata
                } else {
                    // Direct column mapping: legal_name, description, logo_url, name
                    columnData[field] = value;
                }
            }
        }

        // Add updated timestamp and metadata
        columnData.updated_at = new Date().toISOString();
        columnData.metadata = newMetadata;

        console.log('[profile API] Updating profile with fields:', Object.keys(columnData));

        // Update organization profile
        const { data: updatedOrg, error: updateError } = await supabase
            .from('organizations')
            .update(columnData)
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

        // Extract metadata
        const respMetadata = updatedOrg.metadata || {};

        // Normalize company_size - strip " employees" suffix if present
        let respCompanySize = respMetadata.company_size || null;
        if (respCompanySize && typeof respCompanySize === 'string') {
            respCompanySize = respCompanySize.replace(/\s+employees$/i, '');
        }

        // Map response fields back to API format
        const mappedResponse = {
            id: updatedOrg.id,
            name: updatedOrg.name,
            legal_name: updatedOrg.legal_name || null,
            display_name: updatedOrg.name || null, // Map name back to display_name
            description: updatedOrg.description,
            industry: respMetadata.industry || null,
            company_size: respCompanySize,
            founded_year: respMetadata.founded_year || updatedOrg.established_year || null,
            website_url: updatedOrg.website || null,
            logo_url: updatedOrg.logo_url,
            headquarters_address: updatedOrg.address || null,
            headquarters_city: updatedOrg.city || null,
            headquarters_state: updatedOrg.state || null,
            headquarters_country: updatedOrg.country || null,
            created_at: updatedOrg.created_at,
            updated_at: updatedOrg.updated_at,
        };

        console.log('[profile API] Profile updated successfully:', org_id);

        return Response.json({
            success: true,
            message: 'Organization profile updated successfully',
            profile: mappedResponse,
        });

    } catch (error: any) {
        console.error('[profile API] Unexpected error:', error);
        return Response.json({
            error: 'Failed to update organization profile',
            details: error.message
        }, { status: 500 });
    }
});
