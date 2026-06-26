import { create } from 'zustand';
import { fetchMaintenanceMode } from '../api/maintenanceService';
import { getWSClient, type WSEvent, type WSReconnectedEvent } from '../api/wsRealtimeClient';
import { useAuthStore } from './authStore';
import { getLogger } from '@/shared/config/logging';

const logger = getLogger('maintenance');

interface MaintenanceState {
  isMaintenanceMode: boolean;
  activeBypassToken: string | null;
  maintenanceLoading: boolean;
  checkMaintenanceMode: () => Promise<void>;
}

let _wsUnsub: (() => void) | null = null;
let _reconnectUnsub: (() => void) | null = null;
let _authUnsub: (() => void) | null = null;
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
      const client = getWSClient();

      _wsUnsub = client.subscribe(
        'app_config',
        { event: '*' },
        (event: WSEvent) => {
          if (event.type !== 'change') return;
          const payload = event.payload as { key: string; value?: string };

          if (payload.key === 'maintenance_mode') {
            logger.info('WS: maintenance_mode changed', { value: payload.value });
            set({ isMaintenanceMode: payload.value === 'true' });
          } else if (payload.key === 'maintenance_bypass_token') {
            logger.info('WS: bypass_token changed', { hasToken: !!payload.value });
            set({ activeBypassToken: payload.value || null });
          }
        }
      );

      _reconnectUnsub = client.onAny((event: WSEvent | WSReconnectedEvent) => {
        if (event.type === 'reconnected') {
          logger.info('WS reconnected — refetching maintenance state');
          fetchMaintenanceMode().then(({ isEnabled, bypassToken }) => {
            set({ isMaintenanceMode: isEnabled, activeBypassToken: bypassToken });
          });
        }
      });

      const { isEnabled, bypassToken } = await fetchMaintenanceMode();
      set({ isMaintenanceMode: isEnabled, activeBypassToken: bypassToken, maintenanceLoading: false });
    } catch (error) {
      logger.error('Failed to check maintenance mode', error as Error);
      set({ isMaintenanceMode: false, activeBypassToken: null, maintenanceLoading: false });
    }
  },
}));

export const initializeMaintenanceStore = () => {
  useMaintenanceStore.getState().checkMaintenanceMode();

  _authUnsub = useAuthStore.subscribe((state) => {
    if (state.isAuthenticated) {
      getWSClient().connect();
      if (_authUnsub) {
        _authUnsub();
        _authUnsub = null;
      }
    }
  });
  getWSClient().connect();
};

export const cleanupMaintenanceStore = () => {
  _hasChecked = false;
  if (_wsUnsub) { _wsUnsub(); _wsUnsub = null; }
  if (_reconnectUnsub) { _reconnectUnsub(); _reconnectUnsub = null; }
  if (_authUnsub) { _authUnsub(); _authUnsub = null; }
};
