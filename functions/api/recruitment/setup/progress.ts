/**
 * GET /api/recruitment/setup/progress
 * 
 * Returns the organization onboarding setup progress
 * Uses organization_recruitment_settings.metadata JSONB field to store progress
 */

import { createSupabaseClient } from '../../../lib/supabase';
import { verifyJWT } from '@rareminds-eym/auth-core';
import type { PagesFunction } from '../../../lib/types';

interface Env {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    JWT_PUBLIC_KEY: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
    try {
        // 1. Verify JWT from Authorization header
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const token = authHeader.substring(7);
        const decoded = await verifyJWT(token, env.JWT_PUBLIC_KEY);

        if (!decoded || !decoded.sub) {
            return new Response(JSON.stringify({ error: 'Invalid token' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const userId = decoded.sub;

        // 2. Get user's organization from organization_members
        const supabase = createSupabaseClient(env);

        const { data: membership, error: memberError } = await supabase
            .from('organization_members')
            .select('organization_id, role')
            .eq('user_id', userId)
            .single();

        if (memberError || !membership) {
            return new Response(
                JSON.stringify({
                    error: 'No organization membership found',
                    setup_progress: {
                        step1_completed: false,
                        step2_completed: false,
                        step3_completed: false,
                        step3_skipped: false,
                        step4_completed: false,
                        banner_dismissed: false,
                    },
                }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        const orgId = membership.organization_id;

        // 3. Get organization data
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', orgId)
            .single();

        if (orgError || !org) {
            return new Response(
                JSON.stringify({
                    error: 'Organization not found',
                    setup_progress: {
                        step1_completed: false,
                        step2_completed: false,
                        step3_completed: false,
                        step3_skipped: false,
                        step4_completed: false,
                        banner_dismissed: false,
                    },
                }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                }
            );
        }

        // 4. Get recruitment settings with onboarding progress in metadata
        const { data: settings, error: settingsError } = await supabase
            .from('organization_recruitment_settings')
            .select('metadata')
            .eq('organization_id', orgId)
            .single();

        // Extract onboarding progress from metadata JSONB field
        const metadata = (settings?.metadata as any) || {};
        const onboarding = metadata.onboarding || {};

        const setupProgress = {
            step1_completed: onboarding.step1_completed || false,
            step2_completed: onboarding.step2_completed || false,
            step3_completed: onboarding.step3_completed || false,
            step3_skipped: onboarding.step3_skipped || false,
            step4_completed: onboarding.step4_completed || false,
            banner_dismissed: onboarding.banner_dismissed || false,
        };

        // 5. Return progress and org data
        return new Response(
            JSON.stringify({
                success: true,
                setup_progress: setupProgress,
                orgData: {
                    id: org.id,
                    name: org.name,
                    slug: org.slug,
                    industry: metadata.industry || org.industry,
                    company_size: metadata.company_size || org.company_size,
                    website: org.website,
                    logo_url: org.logo_url,
                },
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } catch (error) {
        console.error('[setup/progress] Error:', error);
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
};
