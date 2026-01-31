/**
 * Versioning Helper for Profile Data
 * 
 * This utility manages the versioning system where verified data is preserved
 * while edits are pending approval.
 */

/**
 * Prepare data for update with versioning logic
 * 
 * @param {Object} currentData - The current data from database
 * @param {Object} newData - The new data from user edit
 * @returns {Object} - Prepared data with versioning fields
 */
export const prepareVersionedUpdate = (currentData, newData) => {
  const isCurrentlyVerified = 
    currentData.approval_status === 'verified' || 
    currentData.approval_status === 'approved';

  // If currently verified and being edited, preserve the verified version
  if (isCurrentlyVerified) {
    // Store current verified data
    const verifiedData = { ...currentData };
    delete verifiedData.pending_edit_data;
    delete verifiedData.has_pending_edit;
    delete verifiedData.verified_data;
    delete verifiedData.updated_at;
    delete verifiedData.created_at;

    return {
      ...newData,
      verified_data: verifiedData,
      pending_edit_data: newData,
      has_pending_edit: true,
      approval_status: 'pending',
    };
  }

  // If not verified, just update normally
  return {
    ...newData,
    verified_data: null,
    pending_edit_data: null,
    has_pending_edit: false,
  };
};

/**
 * Get the data to display (verified or current)
 * 
 * @param {Object} record - The database record
 * @returns {Object} - The data to display
 */
export const getDisplayData = (record) => {
  // If there's a pending edit and verified data exists, show verified data
  if (record.has_pending_edit && record.verified_data) {
    return {
      ...record.verified_data,
      id: record.id,
      student_id: record.student_id,
      has_pending_edit: true,
      pending_edit_data: record.pending_edit_data,
      approval_status: 'verified', // Show as verified since this is the verified version
    };
  }

  // Otherwise show current data
  return record;
};

/**
 * Get the pending edit data for display in settings
 * 
 * @param {Object} record - The database record
 * @returns {Object|null} - The pending edit data or null
 */
export const getPendingEditData = (record) => {
  if (record.has_pending_edit && record.pending_edit_data) {
    return {
      ...record.pending_edit_data,
      id: record.id,
      student_id: record.student_id,
      approval_status: 'pending',
      is_pending_edit: true,
    };
  }

  return null;
};

/**
 * Approve a pending edit
 * 
 * @param {Object} record - The database record with pending edit
 * @returns {Object} - Updated record with approved data
 */
export const approvePendingEdit = (record) => {
  if (!record.has_pending_edit || !record.pending_edit_data) {
    return record;
  }

  // Move pending data to current data
  return {
    ...record,
    ...record.pending_edit_data,
    verified_data: null,
    pending_edit_data: null,
    has_pending_edit: false,
    approval_status: 'verified',
  };
};

/**
 * Reject a pending edit
 * 
 * @param {Object} record - The database record with pending edit
 * @returns {Object} - Updated record with pending edit removed
 */
export const rejectPendingEdit = (record) => {
  if (!record.has_pending_edit) {
    return record;
  }

  // Keep verified data, remove pending edit
  return {
    ...record,
    pending_edit_data: null,
    has_pending_edit: false,
    // Keep current approval_status (should be verified)
  };
};

/**
 * Check if a record has changes pending approval
 * 
 * @param {Object} record - The database record
 * @returns {boolean} - True if has pending edit
 */
export const hasPendingEdit = (record) => {
  return record?.has_pending_edit === true && record?.pending_edit_data !== null;
};

/**
 * Merge verified and pending data for display in settings
 * Shows both versions so user can see what's pending
 * 
 * @param {Array} records - Array of database records
 * @returns {Array} - Array with both verified and pending versions
 */
export const mergeVerifiedAndPending = (records) => {
  const result = [];

  records.forEach(record => {
    if (hasPendingEdit(record)) {
      // Add verified version
      result.push(getDisplayData(record));
      
      // Add pending version
      const pendingData = getPendingEditData(record);
      if (pendingData) {
        result.push(pendingData);
      }
    } else {
      // Just add the record as-is
      result.push(record);
    }
  });

  return result;
};
