import React from 'react';
import { Clock, CheckCircle, BadgeCheck, XCircle, PauseCircle } from 'lucide-react';

interface BadgeProps {
  type: string;
  size?: 'sm' | 'md' | 'lg';
}

const Badge: React.FC<BadgeProps> = ({ type, size = 'md' }) => {
  const badgeConfig = {
    pending: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      label: 'Pending',
      icon: Clock,
    },
    approved: {
      color: 'bg-green-100 text-green-800 border-green-300',
      label: 'Approved',
      icon: CheckCircle,
    },
    verified: {
      color: 'bg-green-100 text-green-800 border-green-300',
      label: 'Verified',
      icon: BadgeCheck,
    },
    rejected: {
      color: 'bg-red-100 text-red-800 border-red-300',
      label: 'Rejected',
      icon: XCircle,
    },
    waitlisted: {
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      label: 'Waitlisted',
      icon: PauseCircle,
    },
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1.5 text-xs',
    lg: 'px-4 py-2 text-sm',
  };

  const config = badgeConfig[type as keyof typeof badgeConfig] || badgeConfig.pending;
  const IconComponent = config.icon;
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium border ${config.color} ${sizeClasses[size]}`}
    >
      <IconComponent className={`mr-1 ${iconSizes[size]}`} />
      {config.label}
    </span>
  );
};

export default Badge;
