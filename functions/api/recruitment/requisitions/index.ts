/**
 * Recruitment Requisitions API
 * Manage job requisitions (org-scoped)
 */

import { withAuth } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import { verifyOrgAccess, PERMISSIONS } from '../../../lib/permissions';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

/**
 * GET /api/recruitment/requisitions
 * List all requisitions for user's organization
 */
export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);

    const url = new URL(context.request.url);
    const orgId = url.searchParams.get('org_id') || user.org_id;
    const status = url.searchParams.get('status');
    const department = url.searchParams.get('department');
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    if (!orgId) {
        return Response.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Verify user has access to view candidates
    const access = await verifyOrgAccess(supabase, user.sub, orgId, PERMISSIONS.VIEW_CANDIDATES);
    if (!access.allowed) {
        return access.error!;
    }

    try {
        let query = supabase
            .from('requisitions')
            .select('*', { count: 'exact' })
            .eq('organization_id', orgId) // ORG SCOPING
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // Apply filters
        if (status) query = query.eq('status', status);
        if (department) query = query.eq('department', department);

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching requisitions:', error);
            return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json({
            requisitions: data || [],
            total: count || 0,
            hasMore: (count || 0) > offset + limit,
        });
    } catch (error: any) {
        console.error('Error fetching requisitions:', error);
        return Response.json(
            { error: 'Failed to fetch requisitions', details: error.message },
            { status: 500 }
        );
    }
});

/**
 * POST /api/recruitment/requisitions
 * Create a new requisition
 */
export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);

    let body: any;
    try {
        body = await context.request.json();
    } catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const orgId = body.organization_id || user.org_id;

    if (!orgId) {
        return Response.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Verify user has permission to create jobs
    const access = await verifyOrgAccess(supabase, user.sub, orgId, PERMISSIONS.CREATE_JOBS);
    if (!access.allowed) {
        return access.error!;
    }

    try {
        // Set org-scoped fields
        body.organization_id = orgId;
        body.created_by_uuid = user.sub;
        body.approval_status = body.approval_status || 'pending';

        const { data, error } = await supabase
            .from('requisitions')
            .insert(body)
            .select()
            .single();

        if (error) {
            console.error('Error creating requisition:', error);
            return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json({
            requisition: data,
            message: 'Requisition created successfully',
        });
    } catch (error: any) {
        console.error('Error creating requisition:', error);
        return Response.json(
            { error: 'Failed to create requisition', details: error.message },
            { status: 500 }
        );
    }
});

/**
 * PUT /api/recruitment/requisitions/[id]
 * Update a requisition
 */
export const onRequestPut = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);

    // Extract requisition ID from URL path
    const url = new URL(context.request.url);
    const pathParts = url.pathname.split('/');
    const requisitionId = pathParts[pathParts.length - 1];

    if (!requisitionId) {
        return Response.json({ error: 'Requisition ID is required' }, { status: 400 });
    }

    let body: any;
    try {
        body = await context.request.json();
    } catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    try {
        // First, get the requisition to verify org ownership
        const { data: existing, error: fetchError } = await supabase
            .from('requisitions')
            .select('organization_id')
            .eq('id', requisitionId)
            .single();

        if (fetchError || !existing) {
            return Response.json({ error: 'Requisition not found' }, { status: 404 });
        }

        // Verify user has access and permission to edit
        const access = await verifyOrgAccess(
            supabase,
            user.sub,
            existing.organization_id,
            PERMISSIONS.EDIT_JOBS
        );
        if (!access.allowed) {
            return access.error!;
        }

        // Remove fields that shouldn't be updated
        delete body.id;
        delete body.organization_id;
        delete body.created_by_uuid;
        delete body.created_at;

        // Update requisition
        const { data, error } = await supabase
            .from('requisitions')
            .update(body)
            .eq('id', requisitionId)
            .eq('organization_id', existing.organization_id) // Double-check org ownership
            .select()
            .single();

        if (error) {
            console.error('Error updating requisition:', error);
            return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json({
            requisition: data,
            message: 'Requisition updated successfully',
        });
    } catch (error: any) {
        console.error('Error updating requisition:', error);
        return Response.json(
            { error: 'Failed to update requisition', details: error.message },
            { status: 500 }
        );
    }
});

/**
 * DELETE /api/recruitment/requisitions/[id]
 * Delete a requisition (admin only)
 */
export const onRequestDelete = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);

    // Extract requisition ID from URL path
    const url = new URL(context.request.url);
    const pathParts = url.pathname.split('/');
    const requisitionId = pathParts[pathParts.length - 1];

    if (!requisitionId) {
        return Response.json({ error: 'Requisition ID is required' }, { status: 400 });
    }

    try {
        // First, get the requisition to verify org ownership
        const { data: existing, error: fetchError } = await supabase
            .from('requisitions')
            .select('organization_id')
            .eq('id', requisitionId)
            .single();

        if (fetchError || !existing) {
            return Response.json({ error: 'Requisition not found' }, { status: 404 });
        }

        // Verify user has permission to delete (admin only)
        const access = await verifyOrgAccess(
            supabase,
            user.sub,
            existing.organization_id,
            PERMISSIONS.DELETE_JOBS
        );
        if (!access.allowed) {
            return access.error!;
        }

        // Delete requisition
        const { error } = await supabase
            .from('requisitions')
            .delete()
            .eq('id', requisitionId)
            .eq('organization_id', existing.organization_id); // Double-check org ownership

        if (error) {
            console.error('Error deleting requisition:', error);
            return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json({
            message: 'Requisition deleted successfully',
        });
    } catch (error: any) {
        console.error('Error deleting requisition:', error);
        return Response.json(
            { error: 'Failed to delete requisition', details: error.message },
            { status: 500 }
        );
    }
});
