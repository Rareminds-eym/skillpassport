/**
 * MigrationService
 * 
 * Service for managing user migrations from legacy subscription plans to the new
 * add-on based system including:
 * - Mapping plan features to equivalent add-ons
 * - Migrating users with optional price protection
 * - Calculating price protection eligibility
 * - Scheduling migration notifications
 */

import { apiPost } from '@/shared/api/apiClient';

class MigrationService {
  async getMigrationMapping(planCode) {
    try {
      if (!planCode) return { success: false, error: 'Plan code is required' };
      const result = await apiPost('/payments/migration-operations', { action: 'getMigrationMapping', planCode });
      return { success: result.success ?? true, data: result.data, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async migrateUser(userId, preservePricing = false) {
    return { success: false, error: 'Migration process not supported on this endpoint yet. Please contact support.' };
  }

  async calculatePriceProtection(userId) {
    try {
      if (!userId) return { success: false, error: 'User ID is required' };
      const result = await apiPost('/payments/migration-operations', { action: 'calculatePriceProtection', userId });
      return { success: result.success ?? true, data: result.data, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async scheduleMigrationNotification(userId, migrationDate) {
    return { success: false, error: 'Migration scheduling not supported via client anymore.' };
  }

  async trackMigrationEvent(userId, eventType, metadata = {}) {
    // Moved to addon_events tracking
  }

  async getMigrationStatus(userId) {
    try {
      if (!userId) return { success: false, error: 'User ID is required' };
      const result = await apiPost('/payments/migration-operations', { action: 'getMigrationStatus', userId });
      return { success: result.success ?? true, data: result.data, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getPendingMigrations(limit = 100) {
    return { success: false, error: 'Not supported for client users' };
  }

  async optOutOfMigration(userId) {
    try {
      if (!userId) return { success: false, error: 'User ID is required' };
      const result = await apiPost('/payments/migration-operations', { action: 'optOutOfMigration', userId });
      return { success: result.success ?? true, data: result.data, error: result.error };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

const migrationService = new MigrationService();
export default migrationService;
export { MigrationService };