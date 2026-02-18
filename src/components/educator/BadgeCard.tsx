import { Badge } from '../../types/badge';
import { Trash2 } from 'lucide-react';

interface BadgeCardProps {
  badge: Badge;
  onDelete?: (id: string) => void;
}

const categoryColors: Record<string, string> = {
  Achievement: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Academic: 'bg-blue-100 text-blue-800 border-blue-200',
  Skills: 'bg-purple-100 text-purple-800 border-purple-200',
  Participation: 'bg-green-100 text-green-800 border-green-200',
  Leadership: 'bg-red-100 text-red-800 border-red-200',
  Attendance: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  Career: 'bg-orange-100 text-orange-800 border-orange-200'
};

const institutionTypeColors: Record<string, string> = {
  School: 'bg-blue-50 text-blue-700 border-blue-200',
  College: 'bg-green-50 text-green-700 border-green-200'
};

const BadgeCard = ({ badge, onDelete }: BadgeCardProps) => {
  const formatDate = (date: Date) => {
    if (date instanceof Date) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 overflow-hidden group">
      {/* Icon Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 flex items-center justify-center border-b border-gray-100 relative">
        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onDelete && (
            <button
              onClick={() => onDelete(badge.id)}
              className="p-2 bg-white rounded-lg shadow-sm hover:bg-red-50 transition-colors"
              title="Delete Badge"
            >
              <Trash2 size={16} className="text-red-600" />
            </button>
          )}
        </div>

        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-5xl shadow-sm group-hover:scale-110 transition-transform duration-300">
          {badge.emoji}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        {/* Student Name - PROMINENT */}
        <div className="mb-3 pb-3 border-b border-gray-100">
          <div className="text-xs text-gray-500 mb-1">Awarded to</div>
          <div className="text-base font-bold text-blue-600">{badge.studentName || 'Unknown Student'}</div>
        </div>

        {/* Badge Name */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
          {badge.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[40px]">
          {badge.description}
        </p>

        {/* Labels */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${categoryColors[badge.category] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
            {badge.category}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${institutionTypeColors[badge.institutionType] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
            {badge.institutionType}
          </span>
        </div>

        {/* Criteria */}
        <div className="pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 mb-1">Criteria:</div>
          <div className="text-sm text-gray-700 line-clamp-2">
            {badge.criteria}
          </div>
        </div>

        {/* Awarded Date */}
        <div className="mt-3 text-xs text-gray-400">
          Awarded on {badge.awardedDate ? formatDate(badge.awardedDate) : formatDate(badge.createdAt)}
        </div>
      </div>
    </div>
  );
};

export default BadgeCard;