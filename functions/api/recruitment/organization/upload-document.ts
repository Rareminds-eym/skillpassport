/**
 * Document Upload API
 * Handles file uploads for verification documents and company assets
 */

import { withAuth } from '../../../lib/auth';
import { getServiceClient } from '../../../lib/supabase';
import { verifyOrgAccess, PERMISSIONS } from '../../../lib/permissions';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

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
 * Upload a document to Supabase Storage
 */
export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);

    try {
        const formData = await context.request.formData();

        const file = formData.get('file') as File;
        const orgId = formData.get('org_id') as string;
        const documentType = formData.get('document_type') as string; // e.g., 'registration_certificate', 'gst_certificate', 'logo'
        const bucket = formData.get('bucket') as string || 'company-documents';

        if (!file || !orgId || !documentType) {
            return Response.json({
                error: 'File, org_id, and document_type are required'
            }, { status: 400 });
        }

        // Verify user has admin access
        const access = await verifyOrgAccess(supabase, user.sub, orgId, PERMISSIONS.MANAGE_ORG_SETTINGS);
        if (!access.allowed) {
            return access.error!;
        }

        // Validate file type
        if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
            return Response.json({
                error: `Invalid file type. Allowed types: ${ALLOWED_DOCUMENT_TYPES.join(', ')}`
            }, { status: 400 });
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return Response.json({
                error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
            }, { status: 400 });
        }

        // Generate unique file name
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const fileName = `${orgId}/${documentType}_${timestamp}.${fileExtension}`;

        console.log('[upload-document API] Uploading file:', {
            orgId,
            documentType,
            fileName,
            fileSize: file.size,
            fileType: file.type,
        });

        // Convert File to ArrayBuffer
        const fileBuffer = await file.arrayBuffer();

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(fileName, fileBuffer, {
                contentType: file.type,
                upsert: true, // Overwrite if exists
            });

        if (uploadError) {
            console.error('[upload-document API] Upload failed:', uploadError);
            return Response.json({
                error: 'Failed to upload document',
                details: uploadError.message
            }, { status: 500 });
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

        console.log('[upload-document API] Upload successful:', fileName);

        return Response.json({
            success: true,
            message: 'Document uploaded successfully',
            file_path: fileName,
            file_url: urlData.publicUrl,
            document_type: documentType,
        });

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
 * Delete a document from Supabase Storage
 */
export const onRequestDelete = withAuth(async (context: AuthenticatedContext) => {
    const user = context.data.user;
    const env = context.env as Record<string, string>;
    const supabase = getServiceClient(env as any);

    const url = new URL(context.request.url);
    const orgId = url.searchParams.get('org_id');
    const filePath = url.searchParams.get('file_path');
    const bucket = url.searchParams.get('bucket') || 'company-documents';

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
        // Verify file belongs to organization
        if (!filePath.startsWith(orgId + '/')) {
            return Response.json({
                error: 'Access denied: File does not belong to this organization'
            }, { status: 403 });
        }

        console.log('[upload-document API] Deleting file:', {
            orgId,
            filePath,
            bucket,
        });

        // Delete from Supabase Storage
        const { error: deleteError } = await supabase.storage
            .from(bucket)
            .remove([filePath]);

        if (deleteError) {
            console.error('[upload-document API] Delete failed:', deleteError);
            return Response.json({
                error: 'Failed to delete document',
                details: deleteError.message
            }, { status: 500 });
        }

        console.log('[upload-document API] Delete successful:', filePath);

        return Response.json({
            success: true,
            message: 'Document deleted successfully',
        });

    } catch (error: any) {
        console.error('[upload-document API] Unexpected error:', error);
        return Response.json({
            error: 'Failed to delete document',
            details: error.message
        }, { status: 500 });
    }
});
