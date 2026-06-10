import { withAuth } from '../../../../lib/auth';
import { getServiceClient } from '../../../../lib/supabase';
import { verifyOrgAccess, PERMISSIONS } from '../../../../lib/permissions';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

/**
 * PUT /api/recruitment/members/{userId}/status
 * Activate or deactivate a member
 */
export const onRequestPut = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);
    const targetUserId = context.params.userId as string;

    if (!targetUserId) {
        return Response.json({ error: 'User ID is required' }, { status: 400 });
    }

    let body: { isActive?: boolean };
    try {
        body = await context.request.json() as any;
    } catch {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (typeof body.isActive !== 'boolean') {
        return Response.json({ error: 'isActive (boolean) is required' }, { status: 400 });
    }

    const url = new URL(context.request.url);
    const orgId = url.searchParams.get('org_id') || user.org_id;

    if (!orgId) {
        return Response.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    const access = await verifyOrgAccess(supabase, user.sub, orgId, PERMISSIONS.MANAGE_TEAM);
    if (!access.allowed) return access.error!;

    if (targetUserId === user.sub && !body.isActive) {
        return Response.json({ error: 'Cannot deactivate yourself' }, { status: 400 });
    }

    try {
        const newStatus = body.isActive ? 'active' : 'inactive';

        const { data: existing, error: fetchError } = await supabase
            .from('organization_members')
            .select('id')
            .eq('organization_id', orgId)
            .eq('user_id', targetUserId)
            .maybeSingle();

        if (fetchError) {
            console.error('[update-status] Error fetching member:', fetchError);
            return Response.json({ error: fetchError.message }, { status: 500 });
        }

        if (!existing) {
            return Response.json({ error: 'Member not found' }, { status: 404 });
        }

        const { error: updateError } = await supabase
            .from('organization_members')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('organization_id', orgId)
            .eq('user_id', targetUserId);

        if (updateError) {
            console.error('[update-status] Failed to update:', updateError);
            return Response.json({ error: updateError.message }, { status: 500 });
        }

        return Response.json({ success: true, message: `Member ${body.isActive ? 'activated' : 'deactivated'} successfully` });
    } catch (error: any) {
        console.error('Error updating member status:', error);
        return Response.json(
            { error: 'Failed to update member status', details: error.message },
            { status: 500 }
        );
    }
});
