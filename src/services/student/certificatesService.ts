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
    const { data, error } = await supabase
      .from('certificates')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
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
      
      // Copy valid fields
      validFields.forEach(field => {
        if (record[field] !== undefined && field !== 'student_id' && field !== 'updated_at') {
          cleanRecord[field] = record[field];
        }
      });
      
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
