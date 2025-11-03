import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useRealtimePresence } from '../hooks/useRealtimePresence';
import { OnlineUser } from '../services/realtimeService';

/**
 * Global Presence Context
 * Provides a single source of truth for online/offline user presence across the entire app.
 * This prevents duplicate subscriptions to the 'global-presence' channel.
 */

interface GlobalPresenceContextType {
  onlineUsers: OnlineUser[];
  isUserOnline: (userId: string) => boolean;
  getUserStatus: (userId: string) => 'online' | 'away' | 'busy' | 'offline';
  updateStatus: (status: 'online' | 'away' | 'busy') => Promise<void>;
  isConnected: boolean;
  onlineCount: number;
}

const GlobalPresenceContext = createContext<GlobalPresenceContextType | undefined>(undefined);

interface GlobalPresenceProviderProps {
  children: ReactNode;
  userType: 'student' | 'recruiter';
}

export const GlobalPresenceProvider: React.FC<GlobalPresenceProviderProps> = ({ children, userType }) => {
  const { user } = useAuth();
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('User');

  // Update user info when auth changes
  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
      setUserName(user.name || (userType === 'student' ? 'Student' : 'Recruiter'));
    }
  }, [user, userType]);

  // Single global presence subscription for the entire app
  const presenceData = useRealtimePresence({
    channelName: 'global-presence',
    userPresence: {
      userId: userId || '',
      userName: userName,
      userType: userType,
      status: 'online',
      lastSeen: new Date().toISOString()
    },
    enabled: !!userId
  });

  // Debug logging
  useEffect(() => {
    if (userId) {
      console.log('🌐 [GlobalPresence] Context initialized:', {
        userId,
        userName,
        userType,
        onlineCount: presenceData.onlineUsers.length,
        onlineUsers: presenceData.onlineUsers.map(u => ({
          id: u.userId,
          name: u.userName,
          type: u.userType
        }))
      });
    }
  }, [userId, userName, userType, presenceData.onlineUsers]);

  return (
    <GlobalPresenceContext.Provider value={presenceData}>
      {children}
    </GlobalPresenceContext.Provider>
  );
};

/**
 * Hook to access global presence data
 */
export const useGlobalPresence = (): GlobalPresenceContextType => {
  const context = useContext(GlobalPresenceContext);
  
  if (!context) {
    console.warn('⚠️ useGlobalPresence must be used within GlobalPresenceProvider');
    // Return safe defaults
    return {
      onlineUsers: [],
      isUserOnline: () => false,
      getUserStatus: () => 'offline',
      updateStatus: async () => {},
      isConnected: false,
      onlineCount: 0
    };
  }
  
  return context;
};

export default GlobalPresenceContext;
