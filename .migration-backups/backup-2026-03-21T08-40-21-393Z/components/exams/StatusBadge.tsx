import React from 'react';
import { ExamStatus, mapDatabaseStatus, EXAM_STATUSES } from './types';

interface StatusBadgeProps {
  status: ExamStatus | string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const mappedStatus = typeof status === 'string' ? mapDatabaseStatus(status) : status;
  const statusConfig = EXAM_STATUSES.find(s => s.value === mappedStatus);
  const colorClasses: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    orange: "bg-orange-100 text-orange-700 border-orange-200",
    purple: "bg-purple-100 text-purple-700 border-purple-200",
    green: "bg-green-100 text-green-700 border-green-200",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${colorClasses[statusConfig?.color || "gray"]}`}>
      {statusConfig?.label || mappedStatus}
    </span>
  );
};

export default StatusBadge;