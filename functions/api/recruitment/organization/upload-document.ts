/**
 * Document Upload API
 * Handles file uploads for verification documents and company assets to R2 storage
 */

import { withAuth } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import { verifyOrgAccess, PERMISSIONS } from '../../../lib/permissions';
import { R2Client } from '../../storage/utils/r2-client';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import type { PagesEnv } from '../../../lib/types';

// Allowed file types and sizes
const ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * POST /api/recruitment/organization/upload-document
 * Upload a document to R2 storage
 */
export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as PagesEnv;
    const supabase = getServiceClient(env as any);

    try {
        const formData = await context.request.formData();

        const file = formData.get('file') as File;
        const orgId = formData.get('org_id') as string;
        const documentType = formData.get('document_type') as string;

        if (!file || !orgId || !documentType) {
            return Response.json({
                error: 'File, org_id, and document_type are required'
            }, { status: 400 });
        }

        const access = await verifyOrgAccess(supabase, user.sub, orgId, PERMISSIONS.MANAGE_ORG_SETTINGS);
        if (!access.allowed) {
            return access.error!;
        }

        if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
            return Response.json({
                error: `Invalid file type. Allowed types: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`
            }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE) {
            return Response.json({
                error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
            }, { status: 400 });
        }

        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop() || 'pdf';
        const filePath = `document/company/${orgId}/${documentType}_${timestamp}.${fileExtension}`;

        console.log('[upload-document API] Uploading document to R2:', {
            orgId,
            documentType,
            filePath,
            fileSize: file.size,
            fileType: file.type,
        });

        const fileBuffer = await file.arrayBuffer();

        try {
            const r2Client = new R2Client(env);
            await r2Client.upload(
                filePath,
                fileBuffer,
                file.type,
                {
                    'Content-Disposition': `inline; filename="${file.name}"`,
                    'Cache-Control': 'public, max-age=31536000',
                }
            );

            const documentUrl = r2Client.getPublicUrl(filePath);

            console.log('[upload-document API] Document uploaded successfully to R2:', filePath);

            return Response.json({
                success: true,
                message: 'Document uploaded successfully',
                file_path: filePath,
                file_url: documentUrl,
                document_type: documentType,
            });

        } catch (r2Error: any) {
            console.error('[upload-document API] R2 upload failed:', r2Error);
            return Response.json({
                error: 'Failed to upload document to R2',
                details: r2Error.message || 'Upload error'
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('[upload-document API] Unexpected error:', error);
        return Response.json({
            error: 'Failed to upload document',
            details: error.message
        }, { status: 500 });
    }
});

/**
 * DELETE /api/recruitment/organization/upload-document
 * Delete a document from R2 storage
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

    const access = await verifyOrgAccess(supabase, user.sub, orgId, PERMISSIONS.MANAGE_ORG_SETTINGS);
    if (!access.allowed) {
        return access.error!;
    }

    try {
        if (!filePath.startsWith(`document/company/${orgId}/`)) {
            return Response.json({
                error: 'Access denied: File does not belong to this organization'
            }, { status: 403 });
        }

        console.log('[upload-document API] Deleting document from R2:', {
            orgId,
            filePath,
        });

        try {
            const r2Client = new R2Client(env);
            await r2Client.delete(filePath);

            console.log('[upload-document API] Document deleted successfully from R2:', filePath);

            return Response.json({
                success: true,
                message: 'Document deleted successfully',
            });

        } catch (r2Error: any) {
            console.error('[upload-document API] R2 delete failed:', r2Error);
            return Response.json({
                error: 'Failed to delete document from R2',
                details: r2Error.message
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('[upload-document API] Unexpected error:', error);
        return Response.json({
            error: 'Failed to delete document',
            details: error.message
        }, { status: 500 });
    }
});
