import { useState, useEffect } from 'react';
import {
  getCertificatesByStudentId,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  uploadCertificateFile
} from '../services/certificateService';

/**
 * Custom hook for managing student certificates
 * @param {string} studentId - Student's user ID (UUID)
 * @returns {Object} Certificates data and CRUD functions
 */
export const useStudentCertificates = (studentId) => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch certificates
  const fetchCertificates = async () => {
    // Don't fetch if no studentId yet
    if (!studentId) {
      setLoading(false);
      setCertificates([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    const result = await getCertificatesByStudentId(studentId);
    
    if (result.success) {
      setCertificates(result.data || []);
      setError(null);
    } else {
      setError(result.error);
      setCertificates([]);
    }
    
    setLoading(false);
  };

  // Load certificates when studentId becomes available
  useEffect(() => {
    fetchCertificates();
  }, [studentId]);

  // Add new certificate
  const addCertificate = async (certificateData, file = null) => {
    if (!studentId) {
      return { success: false, error: 'Student ID is required' };
    }

    try {
      let uploadUrl = null;

      // Upload file if provided
      if (file) {
        const uploadResult = await uploadCertificateFile(file, studentId);
        if (uploadResult.success) {
          uploadUrl = uploadResult.url;
        } else {
          return { success: false, error: uploadResult.error };
        }
      }

      // Create certificate record
      const result = await createCertificate({
        ...certificateData,
        student_id: studentId,
        upload: uploadUrl,
      });

      if (result.success) {
        await fetchCertificates(); // Refresh list
      }

      return result;
    } catch (err) {
      console.error('Error in addCertificate:', err);
      return { success: false, error: err.message || 'Failed to add certificate' };
    }
  };

  // Update existing certificate
  const updateExistingCertificate = async (certificateId, updates, file = null) => {
    if (!studentId) {
      return { success: false, error: 'Student ID is required' };
    }

    try {
      let uploadUrl = updates.upload;

      // Upload new file if provided
      if (file) {
        const uploadResult = await uploadCertificateFile(file, studentId);
        if (uploadResult.success) {
          uploadUrl = uploadResult.url;
        } else {
          return { success: false, error: uploadResult.error };
        }
      }

      // Update certificate record
      const result = await updateCertificate(certificateId, {
        ...updates,
        upload: uploadUrl,
      });

      if (result.success) {
        await fetchCertificates(); // Refresh list
      }

      return result;
    } catch (err) {
      console.error('Error in updateExistingCertificate:', err);
      return { success: false, error: err.message || 'Failed to update certificate' };
    }
  };

  // Delete certificate
  const removeCertificate = async (certificateId) => {
    const result = await deleteCertificate(certificateId);
    
    if (result.success) {
      await fetchCertificates(); // Refresh list
    }

    return result;
  };

  return {
    certificates,
    loading,
    error,
    refresh: fetchCertificates,
    addCertificate,
    updateCertificate: updateExistingCertificate,
    removeCertificate,
  };
};
