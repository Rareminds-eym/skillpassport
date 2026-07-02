import { create } from 'zustand';
import { getWSClient } from '../api/wsRealtimeClient';
import { ssoClient } from '../api/ssoClient';

const BYPASS_STORAGE_KEY = 'sp_maintenance_bypass';

interface MaintenanceState {
  isMaintenanceMode: boolean;
  activeBypassToken: string | null;
  localBypassToken: string | null;
  maintenanceLoading: boolean;
  checkMaintenanceMode: () => Promise<void>;
  refetchMaintenanceState: () => Promise<void>;
  setLocalBypassToken: (token: string | null) => void;
  submitBypassToken: (token: string) => Promise<boolean>;
}

let _unsubBroadcast: (() => void) | null = null;
let _unsubAuth: (() => void) | null = null;
let _pollTimer: ReturnType<typeof setInterval> | null = null;
let _visibilityHandler: (() => void) | null = null;
let _hasChecked = false;

const POLL_INTERVAL_MS = 30_000;

async function fetchMaintenanceStateFromApi() {
  const res = await fetch('/api/maintenance/state');
  if (!res.ok) return null;
  return await res.json() as { maintenance_mode: string; maintenance_bypass_token: string | null };
}

function stopPolling() {
  if (_pollTimer) {
    clearInterval(_pollTimer);
    _pollTimer = null;
  }
  if (_visibilityHandler) {
    document.removeEventListener('visibilitychange', _visibilityHandler);
    _visibilityHandler = null;
  }
}

function startPolling(set: (partial: Partial<MaintenanceState>) => void) {
  stopPolling();

  _pollTimer = setInterval(async () => {
    const data = await fetchMaintenanceStateFromApi();
    if (data) {
      set({
        isMaintenanceMode: data.maintenance_mode === 'true',
        activeBypassToken: data.maintenance_bypass_token ?? null,
        maintenanceLoading: false,
      });
    }
  }, POLL_INTERVAL_MS);

  _visibilityHandler = () => {
    if (document.visibilityState === 'visible') {
      fetchMaintenanceStateFromApi().then(data => {
        if (data) {
          set({
            isMaintenanceMode: data.maintenance_mode === 'true',
            activeBypassToken: data.maintenance_bypass_token ?? null,
            maintenanceLoading: false,
          });
        }
      });
    }
  };
  document.addEventListener('visibilitychange', _visibilityHandler);
}

export const useMaintenanceStore = create<MaintenanceState>((set) => ({
  isMaintenanceMode: false,
  activeBypassToken: null,
  localBypassToken: localStorage.getItem(BYPASS_STORAGE_KEY),
  maintenanceLoading: true,
  checkMaintenanceMode: async () => {
    if (_hasChecked) return;
    _hasChecked = true;

    set({ maintenanceLoading: true });
    try {
      const res = await fetch('/api/maintenance/state');
      if (!res.ok) {
        throw new Error(`Failed to fetch maintenance state: ${res.status}`);
      }
      const data = await res.json();
      set({
        isMaintenanceMode: data.maintenance_mode === 'true',
        activeBypassToken: data.maintenance_bypass_token ?? null,
        maintenanceLoading: false,
      });

      const broadcastHandler = (event: Record<string, unknown>) => {
        if (event.type !== 'broadcast') return;
        const payload = event.payload as Record<string, unknown> | undefined;
        if (!payload?.key) return;
        if (payload.key === 'maintenance_mode') {
          set({ isMaintenanceMode: payload.value === 'true' });
        } else if (payload.key === 'maintenance_bypass_token') {
          set({ activeBypassToken: (payload.value as string) ?? null });
        }
      };

      const token = ssoClient.getAccessToken();
      if (token) {
        if (_unsubBroadcast) {
          _unsubBroadcast();
        }
        const ws = getWSClient();
        _unsubBroadcast = ws.subscribeToBroadcast('maintenance-config-updates', broadcastHandler);
      } else {
        startPolling(set);
      }

      if (_unsubAuth) {
        _unsubAuth();
      }
      _unsubAuth = ssoClient.onAuthStateChange(() => {
        if (ssoClient.getAccessToken()) {
          stopPolling();
          if (!_unsubBroadcast) {
            const ws = getWSClient();
            _unsubBroadcast = ws.subscribeToBroadcast('maintenance-config-updates', broadcastHandler);
          }
          getWSClient().connect();
          if (_unsubAuth) {
            _unsubAuth();
            _unsubAuth = null;
          }
        }
      });
    } catch (error) {
      console.error('Failed to check maintenance mode', error);
      set({ isMaintenanceMode: false, activeBypassToken: null, maintenanceLoading: false });
    }
  },
  refetchMaintenanceState: async () => {
    const data = await fetchMaintenanceStateFromApi();
    if (data) {
      set({
        isMaintenanceMode: data.maintenance_mode === 'true',
        activeBypassToken: data.maintenance_bypass_token ?? null,
        maintenanceLoading: false,
      });
    }
  },
  setLocalBypassToken: (token: string | null) => {
    if (token) {
      localStorage.setItem(BYPASS_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(BYPASS_STORAGE_KEY);
    }
    set({ localBypassToken: token });
  },
  submitBypassToken: async (token: string) => {
    // Fast path: check against current store value
    const current = useMaintenanceStore.getState().activeBypassToken;
    if (token === current) {
      localStorage.setItem(BYPASS_STORAGE_KEY, token);
      set({ localBypassToken: token });
      return true;
    }
    // Re-fetch in case token was generated after our last fetch
    try {
      const data = await fetchMaintenanceStateFromApi();
      if (data) {
        const freshToken = data.maintenance_bypass_token ?? null;
        set({
          isMaintenanceMode: data.maintenance_mode === 'true',
          activeBypassToken: freshToken,
        });
        if (token === freshToken) {
          localStorage.setItem(BYPASS_STORAGE_KEY, token);
          set({ localBypassToken: token });
          return true;
        }
      }
    } catch {}
    return false;
  },
}));

export const initializeMaintenanceStore = () => {
  useMaintenanceStore.getState().checkMaintenanceMode();
};

export const cleanupMaintenanceStore = () => {
  if (_unsubBroadcast) {
    _unsubBroadcast();
    _unsubBroadcast = null;
  }
  if (_unsubAuth) {
    _unsubAuth();
    _unsubAuth = null;
  }
  stopPolling();
  _hasChecked = false;
};
