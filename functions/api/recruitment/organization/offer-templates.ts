/**
 * Offer Letter Templates API
 * Manages customizable offer letter templates
 */

import { withAuth } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import { verifyOrgAccess, PERMISSIONS } from '../../../lib/permissions';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

/**
 * GET /api/recruitment/organization/offer-templates
 * Fetch all offer letter templates for an organization
 */
export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);

    const url = new URL(context.request.url);
    const orgId = url.searchParams.get('org_id');
    const templateId = url.searchParams.get('template_id');

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
        // If specific template ID provided, fetch single template
        if (templateId) {
            const { data: template, error: templateError } = await supabase
                .from('offer_letter_templates')
                .select('*')
                .eq('id', templateId)
                .eq('organization_id', orgId)
                .single();

            if (templateError) {
                console.error('[offer-templates API] Error fetching template:', templateError);
                return Response.json({
                    error: 'Failed to fetch template',
                    details: templateError.message
                }, { status: 500 });
            }

            return Response.json({
                template,
            });
        }

        // Fetch all templates for organization
        const { data: templates, error: templatesError } = await supabase
            .from('offer_letter_templates')
            .select('*')
            .eq('organization_id', orgId)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false });

        if (templatesError) {
            console.error('[offer-templates API] Error fetching templates:', templatesError);
            return Response.json({
                error: 'Failed to fetch templates',
                details: templatesError.message
            }, { status: 500 });
        }

        console.log('[offer-templates API] Templates fetched:', {
            orgId,
            count: templates?.length || 0,
        });

        return Response.json({
            templates: templates || [],
            count: templates?.length || 0,
        });

    } catch (error: any) {
        console.error('[offer-templates API] Unexpected error:', error);
        return Response.json({
            error: 'Failed to fetch templates',
            details: error.message
        }, { status: 500 });
    }
});

/**
 * POST /api/recruitment/organization/offer-templates
 * Create a new offer letter template
 */
export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
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

    const { org_id, template_name, template_content, is_default } = body;

    if (!org_id) {
        return Response.json({
            error: 'Organization ID is required'
        }, { status: 400 });
    }

    if (!template_name || !template_content) {
        return Response.json({
            error: 'Template name and content are required'
        }, { status: 400 });
    }

    // Verify user has admin access
    const access = await verifyOrgAccess(supabase, user.sub, org_id, PERMISSIONS.MANAGE_ORG_SETTINGS);
    if (!access.allowed) {
        return access.error!;
    }

    try {
        // If marking as default, unmark other defaults first
        if (is_default) {
            await supabase
                .from('offer_letter_templates')
                .update({ is_default: false })
                .eq('organization_id', org_id)
                .eq('is_default', true);
        }

        // Create new template
        const { data: newTemplate, error: createError } = await supabase
            .from('offer_letter_templates')
            .insert({
                organization_id: org_id,
                template_name,
                template_content,
                is_default: is_default || false,
                created_by: user.sub,
            })
            .select()
            .single();

        if (createError) {
            console.error('[offer-templates API] Create failed:', createError);
            return Response.json({
                error: 'Failed to create template',
                details: createError.message
            }, { status: 500 });
        }

        console.log('[offer-templates API] Template created:', newTemplate.id);

        return Response.json({
            success: true,
            message: 'Template created successfully',
            template: newTemplate,
        }, { status: 201 });

    } catch (error: any) {
        console.error('[offer-templates API] Unexpected error:', error);
        return Response.json({
            error: 'Failed to create template',
            details: error.message
        }, { status: 500 });
    }
});

/**
 * PUT /api/recruitment/organization/offer-templates
 * Update an existing offer letter template
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

    const { org_id, template_id, template_name, template_content, is_default } = body;

    if (!org_id || !template_id) {
        return Response.json({
            error: 'Organization ID and Template ID are required'
        }, { status: 400 });
    }

    // Verify user has admin access
    const access = await verifyOrgAccess(supabase, user.sub, org_id, PERMISSIONS.MANAGE_ORG_SETTINGS);
    if (!access.allowed) {
        return access.error!;
    }

    try {
        // Verify template belongs to organization
        const { data: existingTemplate, error: fetchError } = await supabase
            .from('offer_letter_templates')
            .select('id')
            .eq('id', template_id)
            .eq('organization_id', org_id)
            .single();

        if (fetchError || !existingTemplate) {
            return Response.json({
                error: 'Template not found or access denied'
            }, { status: 404 });
        }

        // If marking as default, unmark other defaults first
        if (is_default) {
            await supabase
                .from('offer_letter_templates')
                .update({ is_default: false })
                .eq('organization_id', org_id)
                .eq('is_default', true)
                .neq('id', template_id);
        }

        // Build update object
        const updateData: any = {
            updated_at: new Date().toISOString(),
        };

        if (template_name !== undefined) updateData.template_name = template_name;
        if (template_content !== undefined) updateData.template_content = template_content;
        if (is_default !== undefined) updateData.is_default = is_default;

        // Update template
        const { data: updatedTemplate, error: updateError } = await supabase
            .from('offer_letter_templates')
            .update(updateData)
            .eq('id', template_id)
            .eq('organization_id', org_id)
            .select()
            .single();

        if (updateError) {
            console.error('[offer-templates API] Update failed:', updateError);
            return Response.json({
                error: 'Failed to update template',
                details: updateError.message
            }, { status: 500 });
        }

        console.log('[offer-templates API] Template updated:', template_id);

        return Response.json({
            success: true,
            message: 'Template updated successfully',
            template: updatedTemplate,
        });

    } catch (error: any) {
        console.error('[offer-templates API] Unexpected error:', error);
        return Response.json({
            error: 'Failed to update template',
            details: error.message
        }, { status: 500 });
    }
});

/**
 * DELETE /api/recruitment/organization/offer-templates
 * Delete an offer letter template
 */
export const onRequestDelete = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);

    const url = new URL(context.request.url);
    const orgId = url.searchParams.get('org_id');
    const templateId = url.searchParams.get('template_id');

    if (!orgId || !templateId) {
        return Response.json({
            error: 'Organization ID and Template ID are required'
        }, { status: 400 });
    }

    // Verify user has admin access
    const access = await verifyOrgAccess(supabase, user.sub, orgId, PERMISSIONS.MANAGE_ORG_SETTINGS);
    if (!access.allowed) {
        return access.error!;
    }

    try {
        // Check if template is default
        const { data: template, error: fetchError } = await supabase
            .from('offer_letter_templates')
            .select('is_default')
            .eq('id', templateId)
            .eq('organization_id', orgId)
            .single();

        if (fetchError || !template) {
            return Response.json({
                error: 'Template not found or access denied'
            }, { status: 404 });
        }

        if (template.is_default) {
            return Response.json({
                error: 'Cannot delete default template. Please set another template as default first.'
            }, { status: 400 });
        }

        // Delete template
        const { error: deleteError } = await supabase
            .from('offer_letter_templates')
            .delete()
            .eq('id', templateId)
            .eq('organization_id', orgId);

        if (deleteError) {
            console.error('[offer-templates API] Delete failed:', deleteError);
            return Response.json({
                error: 'Failed to delete template',
                details: deleteError.message
            }, { status: 500 });
        }

        console.log('[offer-templates API] Template deleted:', templateId);

        return Response.json({
            success: true,
            message: 'Template deleted successfully',
        });

    } catch (error: any) {
        console.error('[offer-templates API] Unexpected error:', error);
        return Response.json({
            error: 'Failed to delete template',
            details: error.message
        }, { status: 500 });
    }
});
