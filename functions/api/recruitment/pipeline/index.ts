/**
 * Recruitment Pipeline API
 * Manage pipeline candidates (org-scoped)
 */

import { withAuth } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import { verifyOrgAccess, PERMISSIONS } from '../../../lib/permissions';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

/**
 * GET /api/recruitment/pipeline
 * List all pipeline candidates for user's organization
 */
export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);

    const url = new URL(context.request.url);
    const orgId = url.searchParams.get('org_id') || user.org_id;
    const stage = url.searchParams.get('stage');
    const status = url.searchParams.get('status');
    const requisitionId = url.searchParams.get('requisition_id');
    const opportunityId = url.searchParams.get('opportunity_id');
    const assignedTo = url.searchParams.get('assigned_to');
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
            .from('pipeline_candidates')
            .select('*', { count: 'exact' })
            .eq('organization_id', orgId) // ORG SCOPING
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // Apply filters
        if (stage) query = query.eq('stage', stage);
        if (status) query = query.eq('status', status);
        if (requisitionId) query = query.eq('requisition_id', requisitionId);
        if (opportunityId) query = query.eq('opportunity_id', opportunityId);
        if (assignedTo) query = query.eq('assigned_to_uuid', assignedTo);

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching pipeline candidates:', error);
            return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json({
            candidates: data || [],
            total: count || 0,
            hasMore: (count || 0) > offset + limit,
        });
    } catch (error: any) {
        console.error('Error fetching pipeline candidates:', error);
        return Response.json(
            { error: 'Failed to fetch pipeline candidates', details: error.message },
            { status: 500 }
        );
    }
});

/**
 * POST /api/recruitment/pipeline
 * Add a candidate to the pipeline
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

    // Verify user has permission to manage candidates
    const access = await verifyOrgAccess(supabase, user.sub, orgId, PERMISSIONS.MANAGE_CANDIDATES);
    if (!access.allowed) {
        return access.error!;
    }

    try {
        // Set org-scoped fields
        body.organization_id = orgId;
        body.added_by_uuid = user.sub;
        body.stage = body.stage || 'sourced';
        body.status = body.status || 'active';

        const { data, error } = await supabase
            .from('pipeline_candidates')
            .insert(body)
            .select()
            .single();

        if (error) {
            console.error('Error adding candidate to pipeline:', error);
            return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json({
            candidate: data,
            message: 'Candidate added to pipeline successfully',
        });
    } catch (error: any) {
        console.error('Error adding candidate to pipeline:', error);
        return Response.json(
            { error: 'Failed to add candidate to pipeline', details: error.message },
            { status: 500 }
        );
    }
});

/**
 * PUT /api/recruitment/pipeline/[id]
 * Update a pipeline candidate
 */
export const onRequestPut = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);

    // Extract candidate ID from URL path
    const url = new URL(context.request.url);
    const pathParts = url.pathname.split('/');
    const candidateId = pathParts[pathParts.length - 1];

    if (!candidateId) {
        return Response.json({ error: 'Candidate ID is required' }, { status: 400 });
    }

    let body: any;
    try {
        body = await context.request.json();
    } catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    try {
        // First, get the candidate to verify org ownership
        const { data: existing, error: fetchError } = await supabase
            .from('pipeline_candidates')
            .select('organization_id, stage')
            .eq('id', candidateId)
            .single();

        if (fetchError || !existing) {
            return Response.json({ error: 'Candidate not found' }, { status: 404 });
        }

        // Verify user has access and permission to manage candidates
        const access = await verifyOrgAccess(
            supabase,
            user.sub,
            existing.organization_id,
            PERMISSIONS.MANAGE_CANDIDATES
        );
        if (!access.allowed) {
            return access.error!;
        }

        // Track stage changes
        if (body.stage && body.stage !== existing.stage) {
            body.previous_stage = existing.stage;
            body.stage_changed_at = new Date().toISOString();
        }

        // Remove fields that shouldn't be updated
        delete body.id;
        delete body.organization_id;
        delete body.added_by_uuid;
        delete body.created_at;

        // Update candidate
        const { data, error } = await supabase
            .from('pipeline_candidates')
            .update(body)
            .eq('id', candidateId)
            .eq('organization_id', existing.organization_id) // Double-check org ownership
            .select()
            .single();

        if (error) {
            console.error('Error updating candidate:', error);
            return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json({
            candidate: data,
            message: 'Candidate updated successfully',
        });
    } catch (error: any) {
        console.error('Error updating candidate:', error);
        return Response.json(
            { error: 'Failed to update candidate', details: error.message },
            { status: 500 }
        );
    }
});

/**
 * PATCH /api/recruitment/pipeline/[id]/stage
 * Move candidate to a different stage
 */
export const onRequestPatch = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);

    // Extract candidate ID from URL path
    const url = new URL(context.request.url);
    const pathParts = url.pathname.split('/');
    const candidateId = pathParts[pathParts.indexOf('pipeline') + 1];

    if (!candidateId) {
        return Response.json({ error: 'Candidate ID is required' }, { status: 400 });
    }

    let body: any;
    try {
        body = await context.request.json();
    } catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { stage } = body;

    if (!stage) {
        return Response.json({ error: 'Stage is required' }, { status: 400 });
    }

    try {
        // First, get the candidate to verify org ownership
        const { data: existing, error: fetchError } = await supabase
            .from('pipeline_candidates')
            .select('organization_id, stage')
            .eq('id', candidateId)
            .single();

        if (fetchError || !existing) {
            return Response.json({ error: 'Candidate not found' }, { status: 404 });
        }

        // Verify user has access and permission
        const access = await verifyOrgAccess(
            supabase,
            user.sub,
            existing.organization_id,
            PERMISSIONS.MANAGE_CANDIDATES
        );
        if (!access.allowed) {
            return access.error!;
        }

        // Update stage
        const { data, error } = await supabase
            .from('pipeline_candidates')
            .update({
                stage,
                previous_stage: existing.stage,
                stage_changed_at: new Date().toISOString(),
            })
            .eq('id', candidateId)
            .eq('organization_id', existing.organization_id)
            .select()
            .single();

        if (error) {
            console.error('Error moving candidate stage:', error);
            return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json({
            candidate: data,
            message: `Candidate moved to ${stage} stage`,
        });
    } catch (error: any) {
        console.error('Error moving candidate stage:', error);
        return Response.json(
            { error: 'Failed to move candidate stage', details: error.message },
            { status: 500 }
        );
    }
});

/**
 * PATCH /api/recruitment/pipeline/[id]/assign
 * Assign candidate to a recruiter
 */
export const onRequestPatch_assign = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);

    // Extract candidate ID from URL path
    const url = new URL(context.request.url);
    const pathParts = url.pathname.split('/');
    const candidateId = pathParts[pathParts.indexOf('pipeline') + 1];

    if (!candidateId) {
        return Response.json({ error: 'Candidate ID is required' }, { status: 400 });
    }

    let body: any;
    try {
        body = await context.request.json();
    } catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { assigned_to_uuid } = body;

    if (!assigned_to_uuid) {
        return Response.json({ error: 'Assigned user ID is required' }, { status: 400 });
    }

    try {
        // First, get the candidate to verify org ownership
        const { data: existing, error: fetchError } = await supabase
            .from('pipeline_candidates')
            .select('organization_id')
            .eq('id', candidateId)
            .single();

        if (fetchError || !existing) {
            return Response.json({ error: 'Candidate not found' }, { status: 404 });
        }

        // Verify user has access and permission
        const access = await verifyOrgAccess(
            supabase,
            user.sub,
            existing.organization_id,
            PERMISSIONS.MANAGE_CANDIDATES
        );
        if (!access.allowed) {
            return access.error!;
        }

        // Update assignment
        const { data, error } = await supabase
            .from('pipeline_candidates')
            .update({
                assigned_to_uuid,
            })
            .eq('id', candidateId)
            .eq('organization_id', existing.organization_id)
            .select()
            .single();

        if (error) {
            console.error('Error assigning candidate:', error);
            return Response.json({ error: error.message }, { status: 500 });
        }

        return Response.json({
            candidate: data,
            message: 'Candidate assigned successfully',
        });
    } catch (error: any) {
        console.error('Error assigning candidate:', error);
        return Response.json(
            { error: 'Failed to assign candidate', details: error.message },
            { status: 500 }
        );
    }
});
