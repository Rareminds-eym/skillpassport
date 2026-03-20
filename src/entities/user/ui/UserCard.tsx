/**
 * User Entity - UserCard Component
 * Displays user information in a card format
 */

import React from 'react';
import type { User } from '../model/types';
import { getUserDisplayName, getRoleDisplayName } from '../model/utils';
import { UserAvatar } from './UserAvatar';

interface UserCardProps {
  user: User;
  onClick?: () => void;
  className?: string;
  showRole?: boolean;
  showEmail?: boolean;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onClick,
  className = '',
  showRole = true,
  showEmail = true,
}) => {
  const displayName = getUserDisplayName(user);
  const roleDisplay = getRoleDisplayName(user.role);

  return (
    <div
      className={`
        p-4 rounded-lg border border-gray-200 bg-white
        hover:shadow-md transition-shadow
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <UserAvatar user={user} size="md" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            {displayName}
          </h3>
          {showEmail && user.email && (
            <p className="text-sm text-gray-600 truncate">
              {user.email}
            </p>
          )}
          {showRole && user.role && (
            <p className="text-xs text-gray-500 mt-1">
              {roleDisplay}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
