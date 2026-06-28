import { create } from 'zustand';
import { fetchMaintenanceMode } from '../api/maintenanceService';
import { supabase } from '../api/supabaseClient';

interface MaintenanceState {
  isMaintenanceMode: boolean;
  activeBypassToken: string | null;
  maintenanceLoading: boolean;
  checkMaintenanceMode: () => Promise<void>;
}

let _realtimeChannel: ReturnType<typeof supabase.channel> | null = null;
let _hasChecked = false;

export const useMaintenanceStore = create<MaintenanceState>((set) => ({
  isMaintenanceMode: false,
  activeBypassToken: null,
  maintenanceLoading: true,
  checkMaintenanceMode: async () => {
    if (_hasChecked) return;
    _hasChecked = true;

    set({ maintenanceLoading: true });
    try {
      const { isEnabled, bypassToken } = await fetchMaintenanceMode();
      set({ isMaintenanceMode: isEnabled, activeBypassToken: bypassToken, maintenanceLoading: false });

      if (_realtimeChannel) {
        _realtimeChannel.unsubscribe();
      }

      _realtimeChannel = supabase
        .channel('maintenance-config-updates')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'app_config', filter: 'key=eq.maintenance_mode' },
          (payload) => {
            const newValue = payload.new?.value === 'true';
            set({ isMaintenanceMode: newValue });
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'app_config', filter: 'key=eq.maintenance_bypass_token' },
          (payload) => {
            const newToken = payload.new?.value || null;
            set({ activeBypassToken: newToken });
          }
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'app_config', filter: 'key=eq.maintenance_bypass_token' },
          () => {
            set({ activeBypassToken: null });
          }
        )
        .subscribe();
    } catch (error) {
      console.error('Failed to check maintenance mode', error);
      set({ isMaintenanceMode: false, activeBypassToken: null, maintenanceLoading: false });
    }
  },
}));

export const initializeMaintenanceStore = () => {
  useMaintenanceStore.getState().checkMaintenanceMode();
};

export const cleanupMaintenanceStore = () => {
  if (_realtimeChannel) {
    _realtimeChannel.unsubscribe();
    _realtimeChannel = null;
  }
  _hasChecked = false;
};
