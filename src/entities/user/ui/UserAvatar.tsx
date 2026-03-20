/**
 * User Entity - UserAvatar Component
 * Displays user avatar with initials fallback
 */

import React from 'react';
import type { User } from '../model/types';
import { getUserInitials, getUserDisplayName } from '../model/utils';

interface UserAvatarProps {
  user: User | null | undefined;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  size = 'md',
  className = '' 
}) => {
  const initials = getUserInitials(user);
  const displayName = getUserDisplayName(user);

  return (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-full
        bg-gradient-to-br from-blue-500 to-purple-600
        flex items-center justify-center
        text-white font-semibold
        ${className}
      `}
      title={displayName}
    >
      {initials}
    </div>
  );
};
