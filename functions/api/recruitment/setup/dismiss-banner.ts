/**
 * POST /api/recruitment/setup/dismiss-banner
 * 
 * Marks the onboarding setup banner as dismissed
 * Stores in organization_recruitment_settings.metadata JSONB field
 */

import { createSupabaseClient } from '../../../lib/supabase';
import { withAuth, getContextUser } from '../../../lib/auth';

export const onRequestPost = withAuth(async (context: any) => {
    try {
        const user = getContextUser(context);
        const userId = user.id || user.sub;
        const env = context.env;

        // 2. Get user's organization from organization_members
        const supabase = createSupabaseClient(env);

        const { data: membership, error: memberError } = await supabase
            .from('organization_members')
            .select('organization_id, role')
            .eq('user_id', userId)
            .single();

        if (memberError || !membership) {
            return new Response(
                JSON.stringify({ error: 'No organization membership found' }),
                {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        const orgId = membership.organization_id;

        // 3. Get current metadata from recruitment settings
        const { data: settings, error: fetchError } = await supabase
            .from('organization_recruitment_settings')
            .select('metadata')
            .eq('organization_id', orgId)
            .single();

        if (fetchError) {
            console.error('[dismiss-banner] Fetch error:', fetchError);
            return new Response(
                JSON.stringify({ error: 'Failed to fetch settings', details: fetchError.message }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // 4. Update metadata with banner_dismissed flag
        const metadata = (settings?.metadata as any) || {};
        const onboarding = metadata.onboarding || {};

        const updatedMetadata = {
            ...metadata,
            onboarding: {
                ...onboarding,
                banner_dismissed: true,
            },
        };

        // 5. Update the settings record
        const { error: updateError } = await supabase
            .from('organization_recruitment_settings')
            .update({
                metadata: updatedMetadata,
                updated_at: new Date().toISOString(),
            })
            .eq('organization_id', orgId);

        if (updateError) {
            console.error('[dismiss-banner] Update error:', updateError);
            return new Response(
                JSON.stringify({ error: 'Failed to dismiss banner', details: updateError.message }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        return new Response(
            JSON.stringify({ success: true, message: 'Banner dismissed' }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error('[dismiss-banner] Error:', error);
        return new Response(
            JSON.stringify({
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error',
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }
});
