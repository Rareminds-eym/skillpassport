import { apiPost } from '@/shared/api/apiClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('learnerDocumentService');

export interface LearnerDocument {
  url: string;
  name: string;
  type: 'resume' | 'certificate' | 'transcript' | 'id_proof' | 'other';
  uploadedAt: string;
  size: number;
}

export interface DocumentUploadResult {
  success: boolean;
  document?: LearnerDocument;
  error?: string;
}

export const uploadlearnerDocument = async (
  learnerId: string,
  file: File,
  documentType: LearnerDocument['type']
): Promise<DocumentUploadResult> => {
  try {
    const { uploadFile, deleteFile } = await import('@/shared/api/fileUploadService');
    const uploadResult = await uploadFile(file, `learners/${learnerId}`);

    if (!uploadResult.success || !uploadResult.url) {
      return { success: false, error: uploadResult.error || 'Upload failed' };
    }

    const document: LearnerDocument = {
      url: uploadResult.url,
      name: file.name,
      type: documentType,
      uploadedAt: new Date().toISOString(),
      size: file.size
    };

    const docResult = await apiPost<LearnerDocument[]>('/learner-profile/actions', {
      action: 'fetch-learner-documents',
      learnerId,
    });
    const currentDocuments = docResult?.data || [];

    const updatedDocuments = [...currentDocuments, document];

    const updateResult = await apiPost<LearnerDocument[]>('/learner-profile/actions', {
      action: 'update-learner-documents',
      learnerId,
      documents: updatedDocuments,
    });

    return {
      success: true,
      document
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
};

export const getlearnerDocuments = async (learnerId: string): Promise<LearnerDocument[]> => {
  try {
    const result = await apiPost<LearnerDocument[]>('/learner-profile/actions', {
      action: 'fetch-learner-documents',
      learnerId,
    });
    return result?.data || [];
  } catch (error) {
    return [];
  }
};

export const deletelearnerDocument = async (
  learnerId: string,
  documentUrl: string
): Promise<boolean> => {
  try {
    const docResult = await apiPost<LearnerDocument[]>('/learner-profile/actions', {
      action: 'fetch-learner-documents',
      learnerId,
    });
    const currentDocuments = docResult?.data || [];

    const updatedDocuments = currentDocuments.filter(
      (doc: LearnerDocument) => doc.url !== documentUrl
    );

    await apiPost<LearnerDocument[]>('/learner-profile/actions', {
      action: 'update-learner-documents',
      learnerId,
      documents: updatedDocuments,
    });

    const { deleteFile } = await import('@/shared/api/fileUploadService');
    await deleteFile(documentUrl);

    return true;
  } catch (error) {
    return false;
  }
};

export const getlearnerDocumentUrl = (documentUrl: string, mode: 'inline' | 'download' = 'inline'): string => {
  const { getDocumentUrl } = require('@/shared/api/fileUploadService');
  return getDocumentUrl(documentUrl, mode);
};

export const updatelearnerDocument = async (
  learnerId: string,
  documentUrl: string,
  updates: Partial<Pick<LearnerDocument, 'name' | 'type'>>
): Promise<boolean> => {
  try {
    const docResult = await apiPost<LearnerDocument[]>('/learner-profile/actions', {
      action: 'fetch-learner-documents',
      learnerId,
    });
    const currentDocuments = docResult?.data || [];

    const updatedDocuments = currentDocuments.map((doc: LearnerDocument) => {
      if (doc.url === documentUrl) {
        return { ...doc, ...updates };
      }
      return doc;
    });

    await apiPost<LearnerDocument[]>('/learner-profile/actions', {
      action: 'update-learner-documents',
      learnerId,
      documents: updatedDocuments,
    });

    return true;
  } catch (error) {
    return false;
  }
};

export const getlearnerDocumentsByType = async (
  learnerId: string,
  documentType: LearnerDocument['type']
): Promise<LearnerDocument[]> => {
  const allDocuments = await getlearnerDocuments(learnerId);
  return allDocuments.filter(doc => doc.type === documentType);
};

export const validatelearnerDocument = (
  file: File,
  documentType: LearnerDocument['type']
): { valid: boolean; error?: string } => {
  const maxSize = 10;
  const allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];

  if (file.size > maxSize * 1024 * 1024) {
    return { valid: false, error: `File size must be less than ${maxSize}MB` };
  }

  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension || !allowedTypes.includes(fileExtension)) {
    return { valid: false, error: `File type must be one of: ${allowedTypes.join(', ')}` };
  }

  if (documentType === 'resume' && !['pdf', 'doc', 'docx'].includes(fileExtension)) {
    return { valid: false, error: 'Resume must be in PDF or Word format' };
  }

  if (documentType === 'id_proof' && !['pdf', 'jpg', 'jpeg', 'png'].includes(fileExtension)) {
    return { valid: false, error: 'ID proof must be in PDF or image format' };
  }

  return { valid: true };
};
