import { create } from 'zustand';
import { fetchMaintenanceMode } from '../api/maintenanceService';
import RealtimeService from '../api/realtimeService';

interface MaintenanceState {
  isMaintenanceMode: boolean;
  activeBypassToken: string | null;
  maintenanceLoading: boolean;
  checkMaintenanceMode: () => Promise<void>;
}

let _broadcastUnsubscribe: (() => void) | null = null;
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

      // Subscribe to maintenance config updates via custom WebSocket
      if (_broadcastUnsubscribe) {
        _broadcastUnsubscribe();
      }

      const { unsubscribe } = await RealtimeService.createBroadcastChannel(
        'maintenance-config-updates',
        (payload) => {
          if (payload.type === 'update') {
            const { key, value } = payload.payload;
            if (key === 'maintenance_mode') {
              set({ isMaintenanceMode: value === 'true' });
            } else if (key === 'maintenance_bypass_token') {
              set({ activeBypassToken: value || null });
            }
          }
        }
      );

      _broadcastUnsubscribe = unsubscribe;
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
  if (_broadcastUnsubscribe) {
    _broadcastUnsubscribe();
    _broadcastUnsubscribe = null;
  }
  _hasChecked = false;
};
