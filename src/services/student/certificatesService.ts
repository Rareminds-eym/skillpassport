/**
 * Certificates Service - CRUD for student certificates
 */

import { supabase } from '../../lib/supabaseClient';
import { getLogger } from '../../config/logging';
import type { Certificate, ServiceResponse, CreateCertificateInput } from './types';

const logger = getLogger('certificates-service');

export async function getCertificatesByStudentId(studentId: string): Promise<ServiceResponse<Certificate[]>> {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('student_id', studentId)
      .order('issued_on', { ascending: false });

    if (error) {
      logger.error('Failed to fetch certificates', error, { studentId });
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: data || [], error: null };
  } catch (err: any) {
    logger.error('Exception in getCertificatesByStudentId', err, { studentId });
    return { success: false, data: null, error: err.message };
  }
}

export async function createCertificate(input: CreateCertificateInput): Promise<ServiceResponse<Certificate>> {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .insert([{
        ...input,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      logger.error('Failed to create certificate', error, { studentId: input.student_id });
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data, error: null };
  } catch (err: any) {
    logger.error('Exception in createCertificate', err, { studentId: input.student_id });
    return { success: false, data: null, error: err.message };
  }
}

export async function updateCertificate(
  certificateId: string,
  updates: Partial<CreateCertificateInput>
): Promise<ServiceResponse<Certificate>> {
  try {
    // First, get the current certificate to check if it's verified
    const { data: currentCertificate, error: fetchError } = await supabase
      .from('certificates')
      .select('*')
      .eq('id', certificateId)
      .single();

    if (fetchError) {
      logger.error('Failed to fetch current certificate', fetchError, { certificateId });
      return { success: false, data: null, error: fetchError.message };
    }

    // Check if certificate is verified/approved
    const isVerified = currentCertificate.approval_status === 'verified' || currentCertificate.approval_status === 'approved';

    let updateData: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (isVerified) {
      // If verified, store changes as pending edit
      updateData = {
        has_pending_edit: true,
        pending_edit_data: updates,
        updated_at: new Date().toISOString(),
      };
      
      // Store current verified data if not already stored
      if (!currentCertificate.verified_data) {
        updateData.verified_data = {
          title: currentCertificate.title,
          issuer: currentCertificate.issuer,
          issued_on: currentCertificate.issued_on,
          level: currentCertificate.level,
          description: currentCertificate.description,
          credential_id: currentCertificate.credential_id,
          link: currentCertificate.link,
        };
      }
    }

    const { data, error } = await supabase
      .from('certificates')
      .update(updateData)
      .eq('id', certificateId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update certificate', error, { certificateId });
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data, error: null };
  } catch (err: any) {
    logger.error('Exception in updateCertificate', err, { certificateId });
    return { success: false, data: null, error: err.message };
  }
}

export async function deleteCertificate(certificateId: string): Promise<ServiceResponse<void>> {
  try {
    const { error } = await supabase
      .from('certificates')
      .delete()
      .eq('id', certificateId);

    if (error) {
      logger.error('Failed to delete certificate', error, { certificateId });
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: null, error: null };
  } catch (err: any) {
    logger.error('Exception in deleteCertificate', err, { certificateId });
    return { success: false, data: null, error: err.message };
  }
}

export async function bulkUpsertCertificates(
  studentId: string,
  certificateRecords: any[]
): Promise<ServiceResponse<Certificate[]>> {
  try {
    const validFields = [
      'id', 'student_id', 'title', 'issuer', 'level', 'credential_id',
      'link', 'issued_on', 'expiry_date', 'description', 'status',
      'approval_status', 'upload', 'document_url', 'enabled', 'training_id',
      'platform', 'instructor', 'category', 'has_pending_edit',
      'pending_edit_data', 'verified_data', 'created_at', 'updated_at'
    ];
    
    // Get existing certificates to check verification status
    const existingIds = certificateRecords.filter(r => r.id).map(r => r.id);
    let existingCertificates: any[] = [];
    
    if (existingIds.length > 0) {
      const { data } = await supabase
        .from('certificates')
        .select('*')
        .in('id', existingIds);
      existingCertificates = data || [];
    }
    
    const records = certificateRecords.map(record => {
      const cleanRecord: any = {
        student_id: studentId,
        updated_at: new Date().toISOString(),
      };
      
      // Map common UI field names
      if (record.issuingOrganization) cleanRecord.issuer = record.issuingOrganization;
      if (record.issueDate) cleanRecord.issued_on = record.issueDate;
      if (record.credentialId) cleanRecord.credential_id = record.credentialId;
      if (record.credentialUrl) cleanRecord.link = record.credentialUrl;
      if (record.expiryDate) cleanRecord.expiry_date = record.expiryDate;
      
      // Find existing certificate if updating
      const existingCert = existingCertificates.find(c => c.id === record.id);
      const isVerified = existingCert && (existingCert.approval_status === 'verified' || existingCert.approval_status === 'approved');
      
      if (isVerified) {
        // For verified certificates, check if anything actually changed
        // CRITICAL: Keep all existing fields to avoid NOT NULL violations
        cleanRecord.id = record.id;
        
        // Copy all existing fields from the database
        Object.keys(existingCert).forEach(key => {
          if (key !== 'updated_at' && existingCert[key] !== undefined) {
            cleanRecord[key] = existingCert[key];
          }
        });
        
        // Check if any field actually changed
        let hasChanges = false;
        const pendingChanges = {};
        
        validFields.forEach(field => {
          if (record[field] !== undefined && field !== 'student_id' && field !== 'updated_at' && field !== 'id' && 
              field !== 'has_pending_edit' && field !== 'pending_edit_data' && field !== 'verified_data' &&
              field !== 'created_at' && field !== 'enabled' && field !== 'approval_status') {
            // Compare with existing value
            if (JSON.stringify(record[field]) !== JSON.stringify(existingCert[field])) {
              hasChanges = true;
              pendingChanges[field] = record[field];
            }
          }
        });
        
        // Check mapped fields
        if (record.issuingOrganization && record.issuingOrganization !== existingCert.issuer) {
          hasChanges = true;
          pendingChanges.issuer = record.issuingOrganization;
        }
        if (record.issueDate && record.issueDate !== existingCert.issued_on) {
          hasChanges = true;
          pendingChanges.issued_on = record.issueDate;
        }
        if (record.credentialId && record.credentialId !== existingCert.credential_id) {
          hasChanges = true;
          pendingChanges.credential_id = record.credentialId;
        }
        if (record.credentialUrl && record.credentialUrl !== existingCert.link) {
          hasChanges = true;
          pendingChanges.link = record.credentialUrl;
        }
        if (record.expiryDate && record.expiryDate !== existingCert.expiry_date) {
          hasChanges = true;
          pendingChanges.expiry_date = record.expiryDate;
        }
        
        // Only set has_pending_edit if there are actual changes
        if (hasChanges) {
          cleanRecord.has_pending_edit = true;
          cleanRecord.pending_edit_data = pendingChanges;
          
          // Store current verified data if not already stored
          if (!existingCert.verified_data) {
            cleanRecord.verified_data = {
              title: existingCert.title,
              issuer: existingCert.issuer,
              issued_on: existingCert.issued_on,
              level: existingCert.level,
              description: existingCert.description,
              credential_id: existingCert.credential_id,
              link: existingCert.link,
            };
          } else {
            cleanRecord.verified_data = existingCert.verified_data;
          }
        }
        // If no changes, keep existing has_pending_edit status
      } else {
        // For new or unverified certificates, update normally
        validFields.forEach(field => {
          if (record[field] !== undefined && field !== 'student_id' && field !== 'updated_at') {
            cleanRecord[field] = record[field];
          }
        });
      }
      
      return cleanRecord;
    });

    const { data, error } = await supabase
      .from('certificates')
      .upsert(records, { onConflict: 'id' })
      .select();

    if (error) {
      logger.error('Failed to bulk upsert certificates', error, { studentId });
      return { success: false, data: null, error: error.message };
    }

    return { success: true, data: data || [], error: null };
  } catch (err: any) {
    logger.error('Exception in bulkUpsertCertificates', err, { studentId });
    return { success: false, data: null, error: err.message };
  }
}
