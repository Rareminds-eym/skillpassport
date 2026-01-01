/**
 * Student Document Service
 * Handles document upload, storage, and management for students
 */

import { supabase } from '../lib/supabaseClient';
import { uploadFile, deleteFile, getDocumentUrl } from './fileUploadService';

export interface StudentDocument {
  url: string;
  name: string;
  type: 'resume' | 'certificate' | 'transcript' | 'id_proof' | 'other';
  uploadedAt: string;
  size: number;
}

export interface DocumentUploadResult {
  success: boolean;
  document?: StudentDocument;
  error?: string;
}

/**
 * Upload a document for a student
 */
export const uploadStudentDocument = async (
  studentId: string,
  file: File,
  documentType: StudentDocument['type']
): Promise<DocumentUploadResult> => {
  try {
    // Upload file to R2 storage
    const uploadResult = await uploadFile(file, `students/${studentId}`);
    
    if (!uploadResult.success || !uploadResult.url) {
      return {
        success: false,
        error: uploadResult.error || 'Upload failed'
      };
    }

    // Create document object
    const document: StudentDocument = {
      url: uploadResult.url,
      name: file.name,
      type: documentType,
      uploadedAt: new Date().toISOString(),
      size: file.size
    };

    // Get current documents
    const { data: student, error: fetchError } = await supabase
      .from('students')
      .select('documents')
      .eq('id', studentId)
      .single();

    if (fetchError) {
      // Clean up uploaded file
      await deleteFile(uploadResult.url);
      return {
        success: false,
        error: `Failed to fetch student: ${fetchError.message}`
      };
    }

    // Add new document to existing documents
    const currentDocuments = student?.documents || [];
    const updatedDocuments = [...currentDocuments, document];

    // Update student record
    const { error: updateError } = await supabase
      .from('students')
      .update({ documents: updatedDocuments })
      .eq('id', studentId);

    if (updateError) {
      // Clean up uploaded file
      await deleteFile(uploadResult.url);
      return {
        success: false,
        error: `Failed to update student record: ${updateError.message}`
      };
    }

    return {
      success: true,
      document
    };
  } catch (error) {
    console.error('Document upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
};

/**
 * Get all documents for a student
 */
export const getStudentDocuments = async (studentId: string): Promise<StudentDocument[]> => {
  try {
    const { data: student, error } = await supabase
      .from('students')
      .select('documents')
      .eq('id', studentId)
      .single();

    if (error) {
      console.error('Failed to fetch student documents:', error);
      return [];
    }

    return student?.documents || [];
  } catch (error) {
    console.error('Error fetching student documents:', error);
    return [];
  }
};

/**
 * Delete a document for a student
 */
export const deleteStudentDocument = async (
  studentId: string,
  documentUrl: string
): Promise<boolean> => {
  try {
    // Get current documents
    const { data: student, error: fetchError } = await supabase
      .from('students')
      .select('documents')
      .eq('id', studentId)
      .single();

    if (fetchError) {
      console.error('Failed to fetch student:', fetchError);
      return false;
    }

    const currentDocuments = student?.documents || [];
    
    // Remove document from array
    const updatedDocuments = currentDocuments.filter(
      (doc: StudentDocument) => doc.url !== documentUrl
    );

    // Update student record
    const { error: updateError } = await supabase
      .from('students')
      .update({ documents: updatedDocuments })
      .eq('id', studentId);

    if (updateError) {
      console.error('Failed to update student record:', updateError);
      return false;
    }

    // Delete file from storage
    const deleteSuccess = await deleteFile(documentUrl);
    if (!deleteSuccess) {
      console.warn('Failed to delete file from storage, but removed from database');
    }

    return true;
  } catch (error) {
    console.error('Error deleting student document:', error);
    return false;
  }
};

/**
 * Get document access URL (for viewing)
 */
export const getStudentDocumentUrl = (documentUrl: string, mode: 'inline' | 'download' = 'inline'): string => {
  return getDocumentUrl(documentUrl, mode);
};

/**
 * Update document metadata
 */
export const updateStudentDocument = async (
  studentId: string,
  documentUrl: string,
  updates: Partial<Pick<StudentDocument, 'name' | 'type'>>
): Promise<boolean> => {
  try {
    // Get current documents
    const { data: student, error: fetchError } = await supabase
      .from('students')
      .select('documents')
      .eq('id', studentId)
      .single();

    if (fetchError) {
      console.error('Failed to fetch student:', fetchError);
      return false;
    }

    const currentDocuments = student?.documents || [];
    
    // Update specific document
    const updatedDocuments = currentDocuments.map((doc: StudentDocument) => {
      if (doc.url === documentUrl) {
        return { ...doc, ...updates };
      }
      return doc;
    });

    // Update student record
    const { error: updateError } = await supabase
      .from('students')
      .update({ documents: updatedDocuments })
      .eq('id', studentId);

    if (updateError) {
      console.error('Failed to update student record:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating student document:', error);
    return false;
  }
};

/**
 * Get documents by type
 */
export const getStudentDocumentsByType = async (
  studentId: string,
  documentType: StudentDocument['type']
): Promise<StudentDocument[]> => {
  const allDocuments = await getStudentDocuments(studentId);
  return allDocuments.filter(doc => doc.type === documentType);
};

/**
 * Validate document before upload
 */
export const validateStudentDocument = (
  file: File,
  documentType: StudentDocument['type']
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