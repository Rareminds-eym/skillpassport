/**
 * Example: How admins can approve/reject trainings
 * This shows the workflow for both School Admin and Rareminds Admin
 */

// Example 1: School Admin approves a Rareminds training
const approveTraining = async (trainingId, adminUserId, notes = '') => {
  try {
    const { data, error } = await supabase.rpc('approve_training', {
      p_training_id: trainingId,
      p_admin_user_id: adminUserId,
      p_notes: notes
    });
    
    if (error) throw error;
    
    console.log('✅ Training approved:', data);
    return data;
  } catch (error) {
    console.error('❌ Error approving training:', error);
    throw error;
  }
};

// Example 2: Rareminds Admin rejects an external training
const rejectTraining = async (trainingId, adminUserId, reason) => {
  try {
    const { data, error } = await supabase.rpc('reject_training', {
      p_training_id: trainingId,
      p_admin_user_id: adminUserId,
      p_reason: reason
    });
    
    if (error) throw error;
    
    console.log('❌ Training rejected:', data);
    return data;
  } catch (error) {
    console.error('❌ Error rejecting training:', error);
    throw error;
  }
};

// Example 3: Get pending trainings for School Admin
const getPendingSchoolTrainings = async (schoolId) => {
  try {
    const { data, error } = await supabase.rpc('get_pending_school_trainings', {
      school_id: schoolId
    });
    
    if (error) throw error;
    
    console.log('📋 Pending Rareminds trainings for school:', data);
    return data;
  } catch (error) {
    console.error('❌ Error fetching school trainings:', error);
    throw error;
  }
};

// Example 4: Get pending trainings for Rareminds Admin
const getPendingRaremindsTrainings = async () => {
  try {
    const { data, error } = await supabase.rpc('get_pending_rareminds_trainings');
    
    if (error) throw error;
    
    console.log('📋 Pending external trainings for Rareminds admin:', data);
    return data;
  } catch (error) {
    console.error('❌ Error fetching Rareminds trainings:', error);
    throw error;
  }
};

// Example 5: Get training details with approver info
const getTrainingDetails = async (trainingId) => {
  try {
    const { data, error } = await supabase.rpc('get_training_with_approver_details', {
      training_id: trainingId
    });
    
    if (error) throw error;
    
    console.log('📄 Training details with approver:', data);
    return data;
  } catch (error) {
    console.error('❌ Error fetching training details:', error);
    throw error;
  }
};

// Example usage:
/*
// School Admin workflow
const schoolAdminId = 'school-admin-user-id';
const schoolId = 'school-uuid';

// 1. Get pending Rareminds trainings for this school
const pendingTrainings = await getPendingSchoolTrainings(schoolId);

// 2. Approve a training
await approveTraining(
  pendingTrainings[0].id, 
  schoolAdminId, 
  'Training content verified and meets school standards'
);

// Rareminds Admin workflow
const raremindsAdminId = 'rareminds-admin-user-id';

// 1. Get pending external trainings
const pendingExternal = await getPendingRaremindsTrainings();

// 2. Reject a training
await rejectTraining(
  pendingExternal[0].id,
  raremindsAdminId,
  'Certificate not from verified provider'
);
*/

export {
  approveTraining,
  rejectTraining,
  getPendingSchoolTrainings,
  getPendingRaremindsTrainings,
  getTrainingDetails
};