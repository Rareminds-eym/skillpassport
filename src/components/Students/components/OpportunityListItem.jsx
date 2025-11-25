import React from 'react';
import { MapPin, Briefcase, Bookmark } from 'lucide-react';

const OpportunityListItem = ({ 
  opportunity, 
  onClick, 
  isSelected, 
  isApplied = false, 
  isSaved = false,
  onApply,
  onToggleSave
}) => {
  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return null;
    if (min && max) return `₹ ${min.toLocaleString()} - ₹ ${max.toLocaleString()}`;
    if (min) return `₹ ${min.toLocaleString()}+`;
    return `Up to ₹ ${max.toLocaleString()}`;
  };

  // Generate consistent color based on company name
  const getColorFromName = (name) => {
    if (!name) return '#6B7280';
    const colors = [
      '#3B82F6', // blue
      '#EC4899', // pink
      '#06B6D4', // cyan
      '#84CC16', // lime
      '#8B5CF6', // purple
      '#F59E0B', // amber
      '#10B981', // emerald
      '#EF4444', // red
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const salary = formatSalary(opportunity.salary_range_min, opportunity.salary_range_max);
  const logoColor = getColorFromName(opportunity.company_name);

  const handleSaveClick = (e) => {
    e.stopPropagation();
    if (onToggleSave) {
      onToggleSave(opportunity);
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg sm:rounded-xl p-3 sm:p-6 cursor-pointer transition-all duration-200 flex items-center gap-3 sm:gap-6 ${
        isSelected 
          ? 'shadow-lg ring-2 ring-blue-500' 
          : 'shadow-sm hover:shadow-md border border-gray-100'
      }`}
      onClick={onClick}
    >
      {/* Company Logo */}
      <div 
        className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-sm flex-shrink-0"
        style={{ backgroundColor: opportunity.company_logo ? 'transparent' : logoColor }}
      >
        {opportunity.company_logo ? (
          <img 
            src={opportunity.company_logo} 
            alt={opportunity.company_name}
            className="w-full h-full object-cover rounded-2xl"
          />
          ) : (
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
              <span className="text-xs sm:text-sm">{getInitials(opportunity.company_name)}</span>
            </div>
          )}
      </div>

      {/* Job Title and Company */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-gray-900 text-base sm:text-xl mb-1">
          {opportunity.job_title || opportunity.title}
        </h3>
        <p className="text-sm sm:text-base text-gray-600">
          {opportunity.company_name}
        </p>
      </div>

      {/* Salary with Icon Box */}
      {salary && (
        <div className="hidden sm:flex items-center gap-3">
          <div>
            <p className="font-bold text-gray-900 text-lg">
              {salary}
            </p>
            <p className="text-sm text-gray-500">Monthly Salary</p>
          </div>
        </div>
      )}

      {/* Location with Icon Box */}
      {opportunity.location && (
        <div className="hidden sm:flex items-center gap-3">
          <div className="w-14 h-14 bg-orange-400 rounded-2xl flex items-center justify-center flex-shrink-0">
            <MapPin className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">
              {opportunity.location}
            </p>
            <p className="text-sm text-gray-500">Location</p>
          </div>
        </div>
      )}

      {/* Bookmark Button */}
      {onToggleSave && (
        <button
          onClick={handleSaveClick}
          className="p-3 rounded-lg border-2 border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition-all flex-shrink-0"
          title={isSaved ? 'Unsave job' : 'Save job'}
        >
          <Bookmark
            className={`w-5 h-5 transition-all ${
              isSaved ? 'fill-blue-600 text-blue-600' : 'text-gray-400'
            }`}
          />
        </button>
      )}

      {/* Apply Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (onApply && !isApplied) {
            onApply();
          }
        }}
        disabled={isApplied}
        className={`px-4 sm:px-8 py-2 sm:py-3 font-semibold rounded-lg sm:rounded-xl text-sm sm:text-base transition-colors whitespace-nowrap ${
          isApplied
            ? 'bg-green-500 text-white cursor-not-allowed'
            : 'bg-white border-2 border-gray-900 hover:bg-gray-900 hover:text-white text-gray-900'
        }`}
      >
        {isApplied ? (
          <>
            <span className="hidden sm:inline">✓ Applied</span>
            <span className="sm:hidden">✓</span>
          </>
        ) : (
          <>
            <span className="hidden sm:inline">Apply Now</span>
            <span className="sm:hidden">Apply</span>
          </>
        )}
      </button>
    </div>
  );
};

export default OpportunityListItem;
