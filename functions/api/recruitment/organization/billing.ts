/**
 * Company Billing API
 * Manages billing information and subscription details (Admin-only)
 */

import { withAuth } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import { verifyOrgAccess, PERMISSIONS } from '../../../lib/permissions';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

/**
 * GET /api/recruitment/organization/billing
 * Fetch company billing information (Admin-only)
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

    // Verify user has admin access (only admins can view billing)
    const access = await verifyOrgAccess(supabase, user.sub, orgId, PERMISSIONS.MANAGE_ORG_SETTINGS);
    if (!access.allowed) {
        console.error('[billing API] Admin access required');
        return access.error!;
    }

    try {
        // Fetch billing data
        const { data: billingData, error: billingError } = await supabase
            .from('company_subscription_details')
            .select('*')
            .eq('organization_id', orgId)
            .single();

        // If no billing record exists, return empty structure
        if (billingError && billingError.code === 'PGRST116') {
            return Response.json({
                billing: {
                    organization_id: orgId,
                    billing_contact_name: '',
                    billing_contact_email: '',
                    billing_contact_phone: '',
                    invoice_company_name: '',
                    invoice_address_line1: '',
                    invoice_address_line2: '',
                    invoice_city: '',
                    invoice_state: '',
                    invoice_country: '',
                    invoice_postal_code: '',
                    gst_number: '',
                    payment_method: '',
                    payment_terms: 'net_30',
                },
                exists: false,
            });
        }

        if (billingError) {
            console.error('[billing API] Error fetching billing:', billingError);
            return Response.json({
                error: 'Failed to fetch billing information',
                details: billingError.message
            }, { status: 500 });
        }

        console.log('[billing API] Billing data fetched:', orgId);

        return Response.json({
            billing: billingData,
            exists: true,
        });

    } catch (error: any) {
        console.error('[billing API] Unexpected error:', error);
        return Response.json({
            error: 'Failed to fetch billing information',
            details: error.message
        }, { status: 500 });
    }
});

/**
 * PUT /api/recruitment/organization/billing
 * Update company billing information (Admin-only)
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

    const { org_id, ...billingData } = body;

    if (!org_id) {
        return Response.json({
            error: 'Organization ID is required'
        }, { status: 400 });
    }

    // Verify user has admin access
    const access = await verifyOrgAccess(supabase, user.sub, org_id, PERMISSIONS.MANAGE_ORG_SETTINGS);
    if (!access.allowed) {
        console.error('[billing API] Admin access required');
        return access.error!;
    }

    try {
        // Validate email format if provided
        if (billingData.billing_contact_email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(billingData.billing_contact_email)) {
                return Response.json({
                    error: 'Invalid billing contact email format',
                }, { status: 400 });
            }
        }

        // Validate payment terms if provided
        const validPaymentTerms = ['net_15', 'net_30', 'net_60', 'immediate'];
        if (billingData.payment_terms && !validPaymentTerms.includes(billingData.payment_terms)) {
            return Response.json({
                error: 'Invalid payment terms. Must be one of: net_15, net_30, net_60, immediate',
            }, { status: 400 });
        }

        // Allowed fields for update
        const allowedFields = [
            'billing_contact_name',
            'billing_contact_email',
            'billing_contact_phone',
            'invoice_company_name',
            'invoice_address_line1',
            'invoice_address_line2',
            'invoice_city',
            'invoice_state',
            'invoice_country',
            'invoice_postal_code',
            'gst_number',
            'payment_method',
            'payment_terms',
            'billing_notes',
        ];

        const updateData: any = {
            organization_id: org_id,
        };

        for (const field of allowedFields) {
            if (field in billingData) {
                updateData[field] = billingData[field];
            }
        }

        updateData.updated_at = new Date().toISOString();

        console.log('[billing API] Upserting billing data:', {
            orgId: org_id,
            fields: Object.keys(updateData),
        });

        // Upsert billing data
        const { data: updatedBilling, error: upsertError } = await supabase
            .from('company_subscription_details')
            .upsert(updateData, {
                onConflict: 'organization_id',
            })
            .select()
            .single();

        if (upsertError) {
            console.error('[billing API] Upsert failed:', upsertError);
            return Response.json({
                error: 'Failed to update billing information',
                details: upsertError.message
            }, { status: 500 });
        }

        console.log('[billing API] Billing data updated:', org_id);

        return Response.json({
            success: true,
            message: 'Billing information updated successfully',
            billing: updatedBilling,
        });

    } catch (error: any) {
        console.error('[billing API] Unexpected error:', error);
        return Response.json({
            error: 'Failed to update billing information',
            details: error.message
        }, { status: 500 });
    }
});

/**
 * POST /api/recruitment/organization/billing/generate-invoice
 * Generate an invoice for the organization (Admin-only)
 * This is a placeholder for future invoice generation functionality
 */
export const onRequest_generateInvoice = withAuth(async (context: AuthenticatedContext) => {
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

    const { org_id, period_start, period_end } = body;

    if (!org_id || !period_start || !period_end) {
        return Response.json({
            error: 'Organization ID, period_start, and period_end are required'
        }, { status: 400 });
    }

    // Verify user has admin access
    const access = await verifyOrgAccess(supabase, user.sub, org_id, PERMISSIONS.MANAGE_ORG_SETTINGS);
    if (!access.allowed) {
        return access.error!;
    }

    try {
        // TODO: Implement invoice generation logic
        // - Fetch subscription details
        // - Calculate charges for the period
        // - Generate PDF invoice
        // - Store invoice in database
        // - Send invoice email

        console.log('[billing API] Invoice generation requested:', {
            orgId: org_id,
            periodStart: period_start,
            periodEnd: period_end,
        });

        return Response.json({
            success: true,
            message: 'Invoice generation feature coming soon',
            note: 'This endpoint is a placeholder for future implementation',
        });

    } catch (error: any) {
        console.error('[billing API] Invoice generation error:', error);
        return Response.json({
            error: 'Failed to generate invoice',
            details: error.message
        }, { status: 500 });
    }
});
