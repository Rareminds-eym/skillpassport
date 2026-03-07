import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// Types
export interface OnlineUser {
  userId: string;
  userName: string;
  userType: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen: string;
}

interface GlobalPresenceState {
  // Data
  onlineUsers: OnlineUser[];
  isConnected: boolean;
  
  // User info
  currentUserId: string | null;
  currentUserName: string;
  currentUserType: 'student' | 'recruiter' | 'educator' | null;
  
  // Computed
  getOnlineCount: () => number;
  
  // Actions
  setOnlineUsers: (users: OnlineUser[]) => void;
  addOnlineUser: (user: OnlineUser) => void;
  removeOnlineUser: (userId: string) => void;
  updateUserStatus: (userId: string, status: OnlineUser['status']) => void;
  setIsConnected: (connected: boolean) => void;
  setCurrentUser: (userId: string | null, userName: string, userType: 'student' | 'recruiter' | 'educator') => void;
  
  // Checkers
  isUserOnline: (userId: string) => boolean;
  getUserStatus: (userId: string) => 'online' | 'away' | 'busy' | 'offline';
  updateStatus: (status: 'online' | 'away' | 'busy') => void;
}

export const useGlobalPresenceStore = create<GlobalPresenceState>()(
  immer((set, get) => ({
    // Initial state
    onlineUsers: [],
    isConnected: false,
    currentUserId: null,
    currentUserName: 'User',
    currentUserType: null,
    
    // Computed
    getOnlineCount: () => {
      return get().onlineUsers.length;
    },

    // Set all online users
    setOnlineUsers: (users) => {
      set((state) => {
        state.onlineUsers = users;
      });
    },

    // Add a single online user
    addOnlineUser: (user) => {
      set((state) => {
        const exists = state.onlineUsers.some((u) => u.userId === user.userId);
        if (!exists) {
          state.onlineUsers.push(user);
        }
      });
    },

    // Remove an online user
    removeOnlineUser: (userId) => {
      set((state) => {
        state.onlineUsers = state.onlineUsers.filter((u) => u.userId !== userId);
      });
    },

    // Update user status
    updateUserStatus: (userId, status) => {
      set((state) => {
        const user = state.onlineUsers.find((u) => u.userId === userId);
        if (user) {
          user.status = status;
          user.lastSeen = new Date().toISOString();
        }
      });
    },

    // Set connection status
    setIsConnected: (connected) => {
      set((state) => {
        state.isConnected = connected;
      });
    },

    // Set current user info
    setCurrentUser: (userId, userName, userType) => {
      set((state) => {
        state.currentUserId = userId;
        state.currentUserName = userName;
        state.currentUserType = userType;
      });
    },

    // Check if user is online
    isUserOnline: (userId) => {
      return get().onlineUsers.some((u) => u.userId === userId && u.status === 'online');
    },

    // Get user status
    getUserStatus: (userId) => {
      const user = get().onlineUsers.find((u) => u.userId === userId);
      return user ? user.status : 'offline';
    },

    // Update current user's status
    updateStatus: (status) => {
      const { currentUserId } = get();
      if (currentUserId) {
        get().updateUserStatus(currentUserId, status);
      }
    },
  }))
);

// Convenience hooks
export const useOnlineUsers = () => useGlobalPresenceStore((state) => state.onlineUsers);
export const useIsConnected = () => useGlobalPresenceStore((state) => state.isConnected);
export const useOnlineCount = () => useGlobalPresenceStore((state) => state.getOnlineCount());
export const useCurrentPresence = () =>
  useGlobalPresenceStore((state) => ({
    userId: state.currentUserId,
    userName: state.currentUserName,
    userType: state.currentUserType,
  }));

export const useUserOnlineStatus = (userId: string) =>
  useGlobalPresenceStore((state) => state.isUserOnline(userId));

export const usePresenceActions = () =>
  useGlobalPresenceStore((state) => ({
    setOnlineUsers: state.setOnlineUsers,
    addOnlineUser: state.addOnlineUser,
    removeOnlineUser: state.removeOnlineUser,
    updateUserStatus: state.updateUserStatus,
    setIsConnected: state.setIsConnected,
    setCurrentUser: state.setCurrentUser,
    updateStatus: state.updateStatus,
  }));
