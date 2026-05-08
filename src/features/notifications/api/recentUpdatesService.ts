import { supabase } from '@/shared/api/supabaseClient';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('recent-updates-service');

/**
 * Service for managing recent updates data
 */
export const recentUpdatesService = {
  /**
   * Get recent updates for a learner by email
   */
  async getRecentUpdatesByEmail(email) {
    try {
      // First get the learner ID from email
      const { data: learnerData, error: learnerError } = await supabase
        .from('learners')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (learnerError) {
        throw new Error(`Failed to find learner: ${learnerError.message}`);
      }

      if (!learnerData) {
        return { updates: [] };
      }

      // Get recent updates for this learner
      const { data: updatesData, error: updatesError } = await supabase
        .from('recent_updates')
        .select('*')
        .eq('learner_id', learnerData.id)
        .maybeSingle();

      if (updatesError && updatesError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw new Error(`Failed to fetch recent updates: ${updatesError.message}`);
      }

      if (updatesData && updatesData.updates && updatesData.updates.updates) {
        return { updates: updatesData.updates.updates };
      }

      return { updates: [] };
    } catch (error) {
      logger.error('Failed to get recent updates by email', error as Error, { email });
      throw error;
    }
  },

  /**
   * Add a new update for a learner
   */
  async addRecentUpdate(email, newUpdate) {
    try {
      // First get the learner ID from email
      const { data: learnerData, error: learnerError } = await supabase
        .from('learners')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (learnerError) {
        throw new Error(`Failed to find learner: ${learnerError.message}`);
      }

      if (!learnerData) {
        throw new Error('Learner not found');
      }

      // Get existing updates
      const { data: existingData, error: fetchError } = await supabase
        .from('recent_updates')
        .select('updates')
        .eq('learner_id', learnerData.id)
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
      const { data, error } = await supabase
        .from('recent_updates')
        .upsert({
          learner_id: learnerData.id,
          updates: { updates: trimmedUpdates }
        }, {
          onConflict: 'learner_id'
        });

      if (error) {
        throw new Error(`Failed to save update: ${error.message}`);
      }

      return { updates: trimmedUpdates };
    } catch (error) {
      logger.error('Failed to add recent update', error as Error, { email });
      throw error;
    }
  },

  /**
   * Clear all updates for a learner
   */
  async clearRecentUpdates(email) {
    try {
      // First get the learner ID from email
      const { data: learnerData, error: learnerError } = await supabase
        .from('learners')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (learnerError) {
        throw new Error(`Failed to find learner: ${learnerError.message}`);
      }

      if (!learnerData) {
        throw new Error('Learner not found');
      }

      // Clear updates
      const { error } = await supabase
        .from('recent_updates')
        .upsert({
          learner_id: learnerData.id,
          updates: { updates: [] }
        }, {
          onConflict: 'learner_id'
        });

      if (error) {
        throw new Error(`Failed to clear updates: ${error.message}`);
      }

      return { updates: [] };
    } catch (error) {
      logger.error('Failed to clear recent updates', error as Error, { email });
      throw error;
    }
  }
};