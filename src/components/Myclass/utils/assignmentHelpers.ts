import React from 'react';
import { ClipboardList, Zap, CheckSquare, Star } from 'lucide-react';
import { parseAsLocalDate, isOverdue } from './dateHelpers';

export { parseAsLocalDate, isOverdue };

export const getStatusBadge = (status: string): React.ReactElement => {
  const configs: Record<string, { bg: string; text: string; label: string; icon: React.ComponentType<{ className?: string }> }> = {
    'todo': { bg: 'bg-gray-100 border-gray-200', text: 'text-gray-700', label: 'To Do', icon: ClipboardList },
    'in-progress': { bg: 'bg-blue-100 border-blue-200', text: 'text-blue-700', label: 'In Progress', icon: Zap },
    'submitted': { bg: 'bg-purple-100 border-purple-200', text: 'text-purple-700', label: 'Submitted', icon: CheckSquare },
    'graded': { bg: 'bg-green-100 border-green-200', text: 'text-green-700', label: 'Graded', icon: Star }
  };
  const config = configs[status] || configs.todo;
  const IconComponent = config.icon;
  
  return React.createElement(
    'span',
    { className: `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} shadow-sm` },
    React.createElement(IconComponent, { className: 'w-3 h-3' }),
    config.label
  );
};
