/**
 * Learner Document Service
 * Handles document upload, storage, and management for learners
 */

import { supabase } from '@/shared/api/supabaseClient';
import { uploadFile, deleteFile, getDocumentUrl } from '@/shared/api/fileUploadService';

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

/**
 * Upload a document for a learner
 */
export const uploadlearnerDocument = async (
  learnerId: string,
  file: File,
  documentType: LearnerDocument['type']
): Promise<DocumentUploadResult> => {
  try {
    // Upload file to R2 storage
    const uploadResult = await uploadFile(file, `learners/${learnerId}`);
    
    if (!uploadResult.success || !uploadResult.url) {
      return {
        success: false,
        error: uploadResult.error || 'Upload failed'
      };
    }

    // Create document object
    const document: LearnerDocument = {
      url: uploadResult.url,
      name: file.name,
      type: documentType,
      uploadedAt: new Date().toISOString(),
      size: file.size
    };

    // Get current documents
    const { data: learner, error: fetchError } = await supabase
      .from('learners')
      .select('documents')
      .eq('id', learnerId)
      .single();

    if (fetchError) {
      // Clean up uploaded file
      await deleteFile(uploadResult.url);
      return {
        success: false,
        error: `Failed to fetch learner: ${fetchError.message}`
      };
    }

    // Add new document to existing documents
    const currentDocuments = learner?.documents || [];
    const updatedDocuments = [...currentDocuments, document];

    // Update learner record
    const { error: updateError } = await supabase
      .from('learners')
      .update({ documents: updatedDocuments })
      .eq('id', learnerId);

    if (updateError) {
      // Clean up uploaded file
      await deleteFile(uploadResult.url);
      return {
        success: false,
        error: `Failed to update learner record: ${updateError.message}`
      };
    }

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

/**
 * Get all documents for a learner
 */
export const getlearnerDocuments = async (learnerId: string): Promise<LearnerDocument[]> => {
  try {
    const { data: learner, error } = await supabase
      .from('learners')
      .select('documents')
      .eq('id', learnerId)
      .single();

    if (error) {
      return [];
    }

    return learner?.documents || [];
  } catch (error) {
    return [];
  }
};

/**
 * Delete a document for a learner
 */
export const deletelearnerDocument = async (
  learnerId: string,
  documentUrl: string
): Promise<boolean> => {
  try {
    // Get current documents
    const { data: learner, error: fetchError } = await supabase
      .from('learners')
      .select('documents')
      .eq('id', learnerId)
      .single();

    if (fetchError) {
      return false;
    }

    const currentDocuments = learner?.documents || [];
    
    // Remove document from array
    const updatedDocuments = currentDocuments.filter(
      (doc: LearnerDocument) => doc.url !== documentUrl
    );

    // Update learner record
    const { error: updateError } = await supabase
      .from('learners')
      .update({ documents: updatedDocuments })
      .eq('id', learnerId);

    if (updateError) {
      return false;
    }

    // Delete file from storage
    await deleteFile(documentUrl);

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get document access URL (for viewing)
 */
export const getlearnerDocumentUrl = (documentUrl: string, mode: 'inline' | 'download' = 'inline'): string => {
  return getDocumentUrl(documentUrl, mode);
};

/**
 * Update document metadata
 */
export const updatelearnerDocument = async (
  learnerId: string,
  documentUrl: string,
  updates: Partial<Pick<LearnerDocument, 'name' | 'type'>>
): Promise<boolean> => {
  try {
    // Get current documents
    const { data: learner, error: fetchError } = await supabase
      .from('learners')
      .select('documents')
      .eq('id', learnerId)
      .single();

    if (fetchError) {
      return false;
    }

    const currentDocuments = learner?.documents || [];
    
    // Update specific document
    const updatedDocuments = currentDocuments.map((doc: LearnerDocument) => {
      if (doc.url === documentUrl) {
        return { ...doc, ...updates };
      }
      return doc;
    });

    // Update learner record
    const { error: updateError } = await supabase
      .from('learners')
      .update({ documents: updatedDocuments })
      .eq('id', learnerId);

    if (updateError) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get documents by type
 */
export const getlearnerDocumentsByType = async (
  learnerId: string,
  documentType: LearnerDocument['type']
): Promise<LearnerDocument[]> => {
  const allDocuments = await getlearnerDocuments(learnerId);
  return allDocuments.filter(doc => doc.type === documentType);
};

/**
 * Validate document before upload
 */
export const validatelearnerDocument = (
  file: File,
  documentType: LearnerDocument['type']
): { valid: boolean; error?: string } => {
  const maxSize = 10; // 10MB
  const allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
  
  // Check file size
  if (file.size > maxSize * 1024 * 1024) {
    return {
      valid: false,
      error: `File size must be less than ${maxSize}MB`
    };
  }
  
  // Check file type
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension || !allowedTypes.includes(fileExtension)) {
    return {
      valid: false,
      error: `File type must be one of: ${allowedTypes.join(', ')}`
    };
  }
  
  // Type-specific validations
  if (documentType === 'resume' && !['pdf', 'doc', 'docx'].includes(fileExtension)) {
    return {
      valid: false,
      error: 'Resume must be in PDF or Word format'
    };
  }
  
  if (documentType === 'id_proof' && !['pdf', 'jpg', 'jpeg', 'png'].includes(fileExtension)) {
    return {
      valid: false,
      error: 'ID proof must be in PDF or image format'
    };
  }
  
  return { valid: true };
};