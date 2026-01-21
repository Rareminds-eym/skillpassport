import React, { useMemo } from 'react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  subtitle?: string;
}

const colorClasses: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-600 border-blue-200',
  green: 'bg-green-50 text-green-600 border-green-200',
  purple: 'bg-purple-50 text-purple-600 border-purple-200',
  amber: 'bg-amber-50 text-amber-600 border-amber-200',
  red: 'bg-red-50 text-red-600 border-red-200',
  gray: 'bg-gray-50 text-gray-600 border-gray-200',
  orange: 'bg-orange-50 text-orange-600 border-orange-200',
};

const StatsCard: React.FC<StatsCardProps> = React.memo(
  ({ label, value, icon: Icon, color = 'blue', subtitle }) => {
    const iconColorClass = useMemo(() => colorClasses[color] || colorClasses.blue, [color]);

    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              {label}
            </p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-xl border ${iconColorClass}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </div>
    );
  }
);

StatsCard.displayName = 'StatsCard';

export default StatsCard;
