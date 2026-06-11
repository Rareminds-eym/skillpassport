/**
 * Recruitment Configuration API
 * Manages recruitment workflows, interview stages, and preferences
 */

import { withAuth } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import { verifyOrgAccess, PERMISSIONS } from '../../../lib/permissions';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

// Default configuration templates
const DEFAULT_WORKFLOW = [
    { stage: 'application', name: 'Application Received', order: 1 },
    { stage: 'screening', name: 'Initial Screening', order: 2 },
    { stage: 'interview', name: 'Interview', order: 3 },
    { stage: 'offer', name: 'Offer', order: 4 },
    { stage: 'hired', name: 'Hired', order: 5 },
];

const DEFAULT_INTERVIEW_STAGES = [
    { id: 'phone_screen', name: 'Phone Screening', duration: 30, order: 1 },
    { id: 'technical', name: 'Technical Interview', duration: 60, order: 2 },
    { id: 'culture_fit', name: 'Culture Fit Interview', duration: 45, order: 3 },
    { id: 'final', name: 'Final Round', duration: 60, order: 4 },
];

const DEFAULT_JOB_POSTING_PREFERENCES = {
    auto_post_to_career_page: true,
    require_cover_letter: false,
    application_questions_enabled: true,
    allow_external_applications: true,
};

/**
 * GET /api/recruitment/organization/config
 * Fetch recruitment configuration
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
        // Fetch recruitment configuration
        const { data: configData, error: configError } = await supabase
            .from('recruitment_configuration')
            .select('*')
            .eq('organization_id', orgId)
            .single();

        // If no config exists, return default structure
        if (configError && configError.code === 'PGRST116') {
            return Response.json({
                config: {
                    organization_id: orgId,
                    default_hiring_workflow: DEFAULT_WORKFLOW,
                    interview_stages: DEFAULT_INTERVIEW_STAGES,
                    offer_letter_template_id: null,
                    default_email_template_id: null,
                    career_page_url: '',
                    career_page_enabled: false,
                    job_posting_preferences: DEFAULT_JOB_POSTING_PREFERENCES,
                },
                exists: false,
                is_default: true,
            });
        }

        if (configError) {
            console.error('[config API] Error fetching config:', configError);
            return Response.json({
                error: 'Failed to fetch recruitment configuration',
                details: configError.message
            }, { status: 500 });
        }

        return Response.json({
            config: configData,
            exists: true,
            is_default: false,
        });

    } catch (error: any) {
        console.error('[config API] Unexpected error:', error);
        return Response.json({
            error: 'Failed to fetch recruitment configuration',
            details: error.message
        }, { status: 500 });
    }
});

/**
 * PUT /api/recruitment/organization/config
 * Update recruitment configuration
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

    const { org_id, ...configData } = body;

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
        // Validate workflow structure if provided
        if (configData.default_hiring_workflow) {
            if (!Array.isArray(configData.default_hiring_workflow)) {
                return Response.json({
                    error: 'default_hiring_workflow must be an array',
                }, { status: 400 });
            }

            // Validate each stage has required fields
            for (const stage of configData.default_hiring_workflow) {
                if (!stage.stage || !stage.name || typeof stage.order !== 'number') {
                    return Response.json({
                        error: 'Each workflow stage must have: stage, name, and order',
                    }, { status: 400 });
                }
            }
        }

        // Validate interview stages if provided
        if (configData.interview_stages) {
            if (!Array.isArray(configData.interview_stages)) {
                return Response.json({
                    error: 'interview_stages must be an array',
                }, { status: 400 });
            }

            for (const stage of configData.interview_stages) {
                if (!stage.id || !stage.name || typeof stage.duration !== 'number') {
                    return Response.json({
                        error: 'Each interview stage must have: id, name, and duration',
                    }, { status: 400 });
                }
            }
        }

        // Allowed fields for update
        const allowedFields = [
            'default_hiring_workflow',
            'interview_stages',
            'offer_letter_template_id',
            'default_email_template_id',
            'career_page_url',
            'career_page_enabled',
            'job_posting_preferences',
        ];

        const updateData: any = {
            organization_id: org_id,
        };

        for (const field of allowedFields) {
            if (field in configData) {
                updateData[field] = configData[field];
            }
        }

        updateData.updated_at = new Date().toISOString();

        console.log('[config API] Upserting config:', {
            orgId: org_id,
            fields: Object.keys(updateData),
        });

        // Upsert configuration
        const { data: updatedConfig, error: upsertError } = await supabase
            .from('recruitment_configuration')
            .upsert(updateData, {
                onConflict: 'organization_id',
            })
            .select()
            .single();

        if (upsertError) {
            console.error('[config API] Upsert failed:', upsertError);
            return Response.json({
                error: 'Failed to update recruitment configuration',
                details: upsertError.message
            }, { status: 500 });
        }

        return Response.json({
            success: true,
            message: 'Recruitment configuration updated successfully',
            config: updatedConfig,
        });

    } catch (error: any) {
        console.error('[config API] Unexpected error:', error);
        return Response.json({
            error: 'Failed to update recruitment configuration',
            details: error.message
        }, { status: 500 });
    }
});
