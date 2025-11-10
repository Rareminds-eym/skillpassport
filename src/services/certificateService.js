/**
 * Certificate Service
 * Handles CRUD operations for the public.certificates table
 */

import { supabase } from '../utils/api';

/**
 * Get all certificates for a student
 * @param {string} studentId - Student's user ID (UUID)
 * @returns {Promise<Object>} Result with certificates data
 */
export const getCertificatesByStudentId = async (studentId) => {
  try {
    if (!studentId) {
      return { success: true, data: [] };
    }

    const { data, error } = await supabase
      .from('certificates')
      .select(`
        id,
        title,
        issuer,
        level,
        credential_id,
        link,
        issued_on,
        description,
        status,
        approval_status,
        upload,
        created_at,
        updated_at
      `)
      .eq('student_id', studentId)
      .neq('status', 'deleted')  // Exclude deleted certificates
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching certificates:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (err) {
    console.error('❌ Exception in getCertificatesByStudentId:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Create a new certificate
 * @param {Object} certificateData - Certificate details
 * @returns {Promise<Object>} Result with created certificate
 */
export const createCertificate = async (certificateData) => {
  try {
    // Parse date - try to convert to valid date format, otherwise set to null
    let issuedOnDate = null;
    if (certificateData.issuedOn || certificateData.issued_on) {
      const dateStr = certificateData.issuedOn || certificateData.issued_on;
      // Try to parse common date formats
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        // Valid date - format as YYYY-MM-DD
        issuedOnDate = date.toISOString().split('T')[0];
      }
    }

    const { data, error } = await supabase
      .from('certificates')
      .insert([{
        student_id: certificateData.student_id,
        title: certificateData.title,
        issuer: certificateData.issuer,
        level: certificateData.level,
        credential_id: certificateData.credentialId || certificateData.credential_id,
        link: certificateData.link,
        issued_on: issuedOnDate,
        description: certificateData.description,
        status: certificateData.status || 'active',
        approval_status: certificateData.approval_status || 'pending',
        upload: certificateData.upload,
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating certificate:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to create certificate'
      };
    }

    return { success: true, data };
  } catch (err) {
    console.error('❌ Exception in createCertificate:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Update an existing certificate
 * @param {string} certificateId - Certificate ID (UUID)
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Result with updated certificate
 */
export const updateCertificate = async (certificateId, updates) => {
  try {
    // Parse date - try to convert to valid date format, otherwise set to null
    let issuedOnDate = null;
    if (updates.issuedOn || updates.issued_on) {
      const dateStr = updates.issuedOn || updates.issued_on;
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        issuedOnDate = date.toISOString().split('T')[0];
      }
    }

    const updateData = {
      title: updates.title,
      issuer: updates.issuer,
      level: updates.level,
      credential_id: updates.credentialId || updates.credential_id,
      link: updates.link,
      issued_on: issuedOnDate,
      description: updates.description,
      status: updates.status,
      approval_status: updates.approval_status,
      upload: updates.upload,
      updated_at: new Date().toISOString(),
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const { data, error } = await supabase
      .from('certificates')
      .update(updateData)
      .eq('id', certificateId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating certificate:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update certificate'
      };
    }

    return { success: true, data };
  } catch (err) {
    console.error('❌ Exception in updateCertificate:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Delete a certificate
 * @param {string} certificateId - Certificate ID (UUID)
 * @returns {Promise<Object>} Result of deletion
 */
export const deleteCertificate = async (certificateId) => {
  try {
    const { error } = await supabase
      .from('certificates')
      .delete()
      .eq('id', certificateId);

    if (error) {
      console.error('❌ Error deleting certificate:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to delete certificate'
      };
    }

    return { success: true };
  } catch (err) {
    console.error('❌ Exception in deleteCertificate:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Upload certificate file to Supabase Storage
 * @param {File} file - Certificate file (PDF, image, etc.)
 * @param {string} studentId - Student's user ID
 * @returns {Promise<Object>} Result with file URL
 */
export const uploadCertificateFile = async (file, studentId) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${studentId}/${Date.now()}.${fileExt}`;
    const filePath = `certificates/${fileName}`;

    const { data, error } = await supabase.storage
      .from('student-uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Error uploading file:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('student-uploads')
      .getPublicUrl(filePath);

    return { success: true, url: publicUrl, path: filePath };
  } catch (err) {
    console.error('❌ Exception in uploadCertificateFile:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Update certificate approval status
 * @param {string} certificateId - Certificate ID (UUID)
 * @param {string} status - New approval status ('pending', 'approved', 'rejected')
 * @returns {Promise<Object>} Result of update
 */
export const updateCertificateApprovalStatus = async (certificateId, status) => {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .update({ 
        approval_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', certificateId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating approval status:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('❌ Exception in updateCertificateApprovalStatus:', err);
    return { success: false, error: err.message };
  }
};
