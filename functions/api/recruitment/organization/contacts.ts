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
        // Fetch contact data
        const { data: contactsData, error: contactsError } = await supabase
            .from('company_contacts')
            .select('*')
            .eq('organization_id', orgId)
            .single();

        // If no contacts record exists, return empty structure
        if (contactsError && contactsError.code === 'PGRST116') {
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

        if (contactsError) {
            console.error('[contacts API] Error fetching contacts:', contactsError);
            return Response.json({
                error: 'Failed to fetch contact information',
                details: contactsError.message
            }, { status: 500 });
        }

        return Response.json({
            contacts: contactsData,
            exists: true,
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

        // Allowed fields for update
        const allowedFields = [
            'official_email',
            'company_phone',
            'hr_contact_phone',
            'support_email',
        ];

        const updateData: any = {
            organization_id: org_id,
        };

        for (const field of allowedFields) {
            if (field in contactsData) {
                updateData[field] = contactsData[field];
            }
        }

        updateData.updated_at = new Date().toISOString();

        console.log('[contacts API] Upserting contacts:', {
            orgId: org_id,
            fields: Object.keys(updateData),
        });

        // Upsert contact data
        const { data: updatedContacts, error: upsertError } = await supabase
            .from('company_contacts')
            .upsert(updateData, {
                onConflict: 'organization_id',
            })
            .select()
            .single();

        if (upsertError) {
            console.error('[contacts API] Upsert failed:', upsertError);
            return Response.json({
                error: 'Failed to update contact information',
                details: upsertError.message
            }, { status: 500 });
        }

        return Response.json({
            success: true,
            message: 'Contact information updated successfully',
            contacts: updatedContacts,
        });

    } catch (error: any) {
        console.error('[contacts API] Unexpected error:', error);
        return Response.json({
            error: 'Failed to update contact information',
            details: error.message
        }, { status: 500 });
    }
});
