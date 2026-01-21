import { supabase } from '../lib/supabaseClient';

/**
 * Service for managing recent updates data
 */
export const recentUpdatesService = {
  /**
   * Get recent updates for a student by email
   */
  async getRecentUpdatesByEmail(email) {
    try {
      // First get the student ID from email
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (studentError) {
        throw new Error(`Failed to find student: ${studentError.message}`);
      }

      if (!studentData) {
        return { updates: [] };
      }

      // Get recent updates for this student
      const { data: updatesData, error: updatesError } = await supabase
        .from('recent_updates')
        .select('*')
        .eq('student_id', studentData.id)
        .maybeSingle();

      if (updatesError && updatesError.code !== 'PGRST116') {
        // PGRST116 = no rows found
        throw new Error(`Failed to fetch recent updates: ${updatesError.message}`);
      }

      if (updatesData && updatesData.updates && updatesData.updates.updates) {
        return { updates: updatesData.updates.updates };
      }

      return { updates: [] };
    } catch (error) {
      console.error('Error in getRecentUpdatesByEmail:', error);
      throw error;
    }
  },

  /**
   * Add a new update for a student
   */
  async addRecentUpdate(email, newUpdate) {
    try {
      // First get the student ID from email
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (studentError) {
        throw new Error(`Failed to find student: ${studentError.message}`);
      }

      if (!studentData) {
        throw new Error('Student not found');
      }

      // Get existing updates
      const { data: existingData, error: fetchError } = await supabase
        .from('recent_updates')
        .select('updates')
        .eq('student_id', studentData.id)
        .maybeSingle();

      let currentUpdates = [];
      if (existingData && existingData.updates && existingData.updates.updates) {
        currentUpdates = existingData.updates.updates;
      }

      // Add new update to the beginning of the array
      const updatedUpdates = [newUpdate, ...currentUpdates];

      // Keep only the latest 10 updates
      const trimmedUpdates = updatedUpdates.slice(0, 10);

      // Update or insert the updates
      const { data, error } = await supabase.from('recent_updates').upsert(
        {
          student_id: studentData.id,
          updates: { updates: trimmedUpdates },
        },
        {
          onConflict: 'student_id',
        }
      );

      if (error) {
        throw new Error(`Failed to save update: ${error.message}`);
      }

      return { updates: trimmedUpdates };
    } catch (error) {
      console.error('Error in addRecentUpdate:', error);
      throw error;
    }
  },

  /**
   * Clear all updates for a student
   */
  async clearRecentUpdates(email) {
    try {
      // First get the student ID from email
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (studentError) {
        throw new Error(`Failed to find student: ${studentError.message}`);
      }

      if (!studentData) {
        throw new Error('Student not found');
      }

      // Clear updates
      const { error } = await supabase.from('recent_updates').upsert(
        {
          student_id: studentData.id,
          updates: { updates: [] },
        },
        {
          onConflict: 'student_id',
        }
      );

      if (error) {
        throw new Error(`Failed to clear updates: ${error.message}`);
      }

      return { updates: [] };
    } catch (error) {
      console.error('Error in clearRecentUpdates:', error);
      throw error;
    }
  },
};
