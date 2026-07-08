/**
 * Company Logo Upload API
 * Handles company logo uploads to Cloudflare R2 storage
 * Path structure: logo/company/{organizationId}/logo_{timestamp}.{ext}
 */

import { withAuth } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import { verifyOrgAccess, PERMISSIONS } from '../../../lib/permissions';
import { R2Client } from '../../storage/utils/r2-client';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import type { PagesEnv } from '../../../lib/types';

// Allowed image types for logos
const ALLOWED_LOGO_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
];

const MAX_LOGO_SIZE = 5 * 1024 * 1024;

/**
 * POST /api/recruitment/organization/upload-logo
 * Upload company logo to Cloudflare R2 storage
 */
export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as PagesEnv;
    const supabase = getServiceClient(env as any);

    try {
        const formData = await context.request.formData();

        const file = formData.get('file') as File;
        const orgId = formData.get('org_id') as string;

        if (!file || !orgId) {
            return Response.json({
                error: 'File and org_id are required'
            }, { status: 400 });
        }

        // Verify user has admin access
        const access = await verifyOrgAccess(supabase, user.sub, orgId, PERMISSIONS.MANAGE_ORG_SETTINGS);
        if (!access.allowed) {
            return access.error!;
        }

        // Validate file type
        if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
            return Response.json({
                error: `Invalid file type. Allowed types: ${ALLOWED_LOGO_TYPES.join(', ')}`
            }, { status: 400 });
        }

        // Validate file size
        if (file.size > MAX_LOGO_SIZE) {
            return Response.json({
                error: `File size exceeds maximum limit of ${MAX_LOGO_SIZE / (1024 * 1024)}MB`
            }, { status: 400 });
        }

        // Generate R2 path: logo/company/{orgId}/logo_{timestamp}.{ext}
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop() || 'png';
        const logoPath = `logo/company/${orgId}/logo_${timestamp}.${fileExtension}`;

        console.log('[upload-logo API] Uploading logo to R2:', {
            orgId,
            logoPath,
            fileSize: file.size,
            fileType: file.type,
        });

        // Convert File to ArrayBuffer
        const fileBuffer = await file.arrayBuffer();

        try {
            // Upload to Cloudflare R2 using R2Client
            const r2Client = new R2Client(env);
            await r2Client.upload(
                logoPath,
                fileBuffer,
                file.type,
                {
                    'Content-Disposition': `inline; filename="${file.name}"`,
                    'Cache-Control': 'public, max-age=31536000',
                }
            );

            const logoUrl = r2Client.getPublicUrl(logoPath);

            console.log('[upload-logo API] Logo uploaded successfully to R2:', logoPath);

            return Response.json({
                success: true,
                message: 'Logo uploaded successfully',
                file_path: logoPath,
                file_url: logoUrl,
                storage_type: 'r2',
            });

        } catch (r2Error: any) {
            console.error('[upload-logo API] R2 upload failed:', r2Error);
            return Response.json({
                error: 'Failed to upload logo to R2',
                details: r2Error.message || 'R2 upload error'
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('[upload-logo API] Unexpected error:', error);
        return Response.json({
            error: 'Failed to upload logo',
            details: error.message
        }, { status: 500 });
    }
});

/**
 * DELETE /api/recruitment/organization/upload-logo
 * Delete company logo from Cloudflare R2 storage
 */
export const onRequestDelete = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as PagesEnv;
    const supabase = getServiceClient(env as any);

    const url = new URL(context.request.url);
    const orgId = url.searchParams.get('org_id');
    const filePath = url.searchParams.get('file_path');

    if (!orgId || !filePath) {
        return Response.json({
            error: 'org_id and file_path are required'
        }, { status: 400 });
    }

    // Verify user has admin access
    const access = await verifyOrgAccess(supabase, user.sub, orgId, PERMISSIONS.MANAGE_ORG_SETTINGS);
    if (!access.allowed) {
        return access.error!;
    }

    try {
        // Verify file belongs to organization and is a logo
        if (!filePath.startsWith(`logo/company/${orgId}/`)) {
            return Response.json({
                error: 'Access denied: File does not belong to this organization or is not a logo'
            }, { status: 403 });
        }

        console.log('[upload-logo API] Deleting logo from R2:', {
            orgId,
            filePath,
        });

        try {
            // Delete from R2
            const r2Client = new R2Client(env);
            await r2Client.delete(filePath);

            console.log('[upload-logo API] Logo deleted successfully from R2:', filePath);

            return Response.json({
                success: true,
                message: 'Logo deleted successfully',
                storage_type: 'r2',
            });

        } catch (r2Error: any) {
            console.error('[upload-logo API] R2 delete failed:', r2Error);
            return Response.json({
                error: 'Failed to delete logo from R2',
                details: r2Error.message
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('[upload-logo API] Unexpected error:', error);
        return Response.json({
            error: 'Failed to delete logo',
            details: error.message
        }, { status: 500 });
    }
});
