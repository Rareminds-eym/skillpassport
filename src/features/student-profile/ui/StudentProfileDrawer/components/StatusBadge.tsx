import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const statusConfig = {
    verified: { color: 'bg-green-100 text-green-800 border-green-300', label: 'Verified', icon: '✓' },
    approved: { color: 'bg-green-100 text-green-800 border-green-300', label: 'Approved', icon: '✓' },
    pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Pending', icon: '⏳' },
    rejected: { color: 'bg-red-100 text-red-800 border-red-300', label: 'Rejected', icon: '✕' },
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm'
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <span className={`inline-flex items-center rounded-full font-medium border ${config.color} ${sizeClasses[size]}`}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
};

export default StatusBadge;