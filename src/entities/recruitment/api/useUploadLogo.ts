/**
 * Hook for uploading company logo to R2 storage
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ssoClient } from '@/shared/api/ssoClient';
import { getLogger } from '@/shared/config/logging';
import { useOrgContext } from '../model/useOrgContext';

const logger = getLogger('useUploadLogo');

interface UploadLogoParams {
    file: File;
}

interface UploadLogoResponse {
    success: boolean;
    message: string;
    file_path: string;
    file_url: string;
    storage_type: string;
}

/**
 * Upload company logo to R2 storage
 */
export const useUploadLogo = () => {
    const queryClient = useQueryClient();
    const { orgContext } = useOrgContext();

    return useMutation({
        mutationFn: async ({ file }: UploadLogoParams): Promise<UploadLogoResponse> => {
            const orgId = orgContext?.organization.id;
            
            if (!orgId) {
                throw new Error('Organization ID not found');
            }

            logger.info('Uploading logo to R2', {
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                orgId,
            });

            const formData = new FormData();
            formData.append('file', file);
            formData.append('org_id', orgId);

            // Use ssoClient.fetch() for authenticated requests
            // This automatically includes JWT token and handles token refresh
            const response = await ssoClient.fetch('/api/recruitment/organization/upload-logo', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                logger.error('Logo upload failed', {
                    error: errorData.error,
                    status: response.status,
                });
                throw new Error(errorData.error || 'Logo upload failed');
            }

            const result: UploadLogoResponse = await response.json();

            logger.info('Logo uploaded successfully', {
                filePath: result.file_path,
                storageType: result.storage_type,
            });

            return result;
        },
        onSuccess: () => {
            // Invalidate organization profile query to refetch with new logo
            queryClient.invalidateQueries({ queryKey: ['organization-profile'] });
        },
        onError: (error: Error) => {
            logger.error('Logo upload mutation failed', { error: error.message });
        },
    });
};
