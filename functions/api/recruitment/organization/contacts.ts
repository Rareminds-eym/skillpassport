/**
 * Company Contacts API
 * Manages company contact information
 */

import { withAuth } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import { verifyOrgAccess, PERMISSIONS } from '../../../lib/permissions';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

/**
 * GET /api/recruitment/organization/contacts
 * Fetch company contact information
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
        // Fetch contact data from organization_recruitment_settings
        const { data: settingsData, error: settingsError } = await supabase
            .from('organization_recruitment_settings')
            .select('official_company_email, company_phone_number, hr_contact_phone_number, hr_support_email')
            .eq('organization_id', orgId)
            .single();

        // If no record exists, return empty structure
        if (settingsError && settingsError.code === 'PGRST116') {
            return Response.json({
                contacts: {
                    organization_id: orgId,
                    official_email: '',
                    company_phone: '',
                    hr_contact_phone: '',
                    support_email: '',
                },
                exists: false,
            });
        }

        if (settingsError) {
            console.error('[contacts API] Error fetching contacts:', settingsError);
            return Response.json({
                error: 'Failed to fetch contact information',
                details: settingsError.message
            }, { status: 500 });
        }

        // Map database fields to API response fields
        const contactsData = {
            organization_id: orgId,
            official_email: settingsData?.official_company_email || '',
            company_phone: settingsData?.company_phone_number || '',
            hr_contact_phone: settingsData?.hr_contact_phone_number || '',
            support_email: settingsData?.hr_support_email || '',
        };

        return Response.json({
            contacts: contactsData,
            exists: !!settingsData,
        });

    } catch (error: any) {
        console.error('[contacts API] Unexpected error:', error);
        return Response.json({
            error: 'Failed to fetch contact information',
            details: error.message
        }, { status: 500 });
    }
});

/**
 * PUT /api/recruitment/organization/contacts
 * Update company contact information
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

    const { org_id, ...contactsData } = body;

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
        // Validate email formats
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (contactsData.official_email && !emailRegex.test(contactsData.official_email)) {
            return Response.json({
                error: 'Invalid official email format',
            }, { status: 400 });
        }

        if (contactsData.support_email && !emailRegex.test(contactsData.support_email)) {
            return Response.json({
                error: 'Invalid support email format',
            }, { status: 400 });
        }

        // Map request fields to database fields
        const fieldMapping: Record<string, string> = {
            'official_email': 'official_company_email',
            'company_phone': 'company_phone_number',
            'hr_contact_phone': 'hr_contact_phone_number',
            'support_email': 'hr_support_email',
        };

        const updateData: any = {
            organization_id: org_id,
        };

        for (const [requestField, dbField] of Object.entries(fieldMapping)) {
            if (requestField in contactsData) {
                updateData[dbField] = contactsData[requestField];
            }
        }

        updateData.updated_at = new Date().toISOString();

        console.log('[contacts API] Upserting contacts:', {
            orgId: org_id,
            fields: Object.keys(updateData),
        });

        // Upsert contact data in organization_recruitment_settings
        const { data: updatedSettings, error: upsertError } = await supabase
            .from('organization_recruitment_settings')
            .upsert(updateData, {
                onConflict: 'organization_id',
            })
            .select('official_company_email, company_phone_number, hr_contact_phone_number, hr_support_email')
            .single();

        if (upsertError) {
            console.error('[contacts API] Upsert failed:', upsertError);
            return Response.json({
                error: 'Failed to update contact information',
                details: upsertError.message
            }, { status: 500 });
        }

        // Map response back to API format
        const responseContacts = {
            organization_id: org_id,
            official_email: updatedSettings?.official_company_email || '',
            company_phone: updatedSettings?.company_phone_number || '',
            hr_contact_phone: updatedSettings?.hr_contact_phone_number || '',
            support_email: updatedSettings?.hr_support_email || '',
        };

        return Response.json({
            success: true,
            message: 'Contact information updated successfully',
            contacts: responseContacts,
        });

    } catch (error: any) {
        console.error('[contacts API] Unexpected error:', error);
        return Response.json({
            error: 'Failed to update contact information',
            details: error.message
        }, { status: 500 });
    }
});
