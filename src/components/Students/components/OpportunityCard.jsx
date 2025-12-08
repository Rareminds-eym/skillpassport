import React from 'react';
import { MapPin, Bookmark } from 'lucide-react';

const OpportunityCard = ({ 
  opportunity, 
  onClick, 
  isSelected, 
  isApplied = false,
  isSaved = false,
  onToggleSave
}) => {
  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getDisplayName = () => {
    return opportunity.company_name || opportunity.job_title || opportunity.title || 'Unknown';
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
  const displayName = getDisplayName();
  const logoColor = getColorFromName(displayName);

  const handleSaveClick = (e) => {
    e.stopPropagation(); // Prevent card click
    if (onToggleSave) {
      onToggleSave(opportunity);
    }
  };

  return (
    <div 
      className={`bg-white rounded-lg sm:rounded-xl p-3 sm:p-6 cursor-pointer transition-all duration-200 relative ${
        isSelected 
          ? 'shadow-lg ring-2 ring-blue-500' 
          : 'shadow-sm hover:shadow-md border border-gray-100'
      }`}
      onClick={onClick}
    >
      {/* Bookmark Button */}
      {onToggleSave && (
        <button
          onClick={handleSaveClick}
          className="absolute top-2 left-2 p-2 rounded-full bg-white shadow-sm hover:shadow-md transition-all z-10"
          title={isSaved ? 'Unsave job' : 'Save job'}
        >
          <Bookmark
            className={`w-4 h-4 sm:w-5 sm:h-5 transition-all ${
              isSaved ? 'fill-blue-600 text-blue-600' : 'text-gray-400 hover:text-blue-600'
            }`}
          />
        </button>
      )}
      
      {/* Applied Badge */}
      {isApplied && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
          ✓ Applied
        </div>
      )}
      <div className="flex flex-col items-center text-center space-y-2.5 sm:space-y-4">
        {/* Company Logo */}
        <div 
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-sm"
          style={{ backgroundColor: opportunity.company_logo ? 'transparent' : logoColor }}
        >
          {opportunity.company_logo ? (
            <img 
              src={opportunity.company_logo} 
              alt={displayName}
              className="w-full h-full object-cover rounded-2xl"
            />
          ) : (
            <div className="w-10 h-10 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
              <span className="text-sm">{getInitials(displayName)}</span>
            </div>
          )}
        </div>

        {/* Job Title */}
        <h3 className="font-semibold text-gray-900 text-base sm:text-lg leading-tight">
          {opportunity.job_title || opportunity.title}
        </h3>

        {/* Company Name - Only show if exists */}
        {opportunity.company_name && (
          <p className="text-xs sm:text-sm text-gray-600">
            {opportunity.company_name}
          </p>
        )}

        {/* Location */}
        {opportunity.location && (
          <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-gray-500">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{opportunity.location}</span>
          </div>
        )}

        {/* Salary */}
        {salary && (
          <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-gray-500">
            <span>{salary}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpportunityCard;


// import React from 'react';
// import { MapPin, Bookmark } from 'lucide-react';

// const OpportunityCard = ({ 
//   opportunity, 
//   onClick, 
//   isSelected, 
//   isApplied = false,
//   isSaved = false,
//   onToggleSave
// }) => {
//   const getInitials = (name) => {
//     return name
//       ?.split(' ')
//       .map(word => word[0])
//       .join('')
//       .toUpperCase()
//       .slice(0, 2) || '??';
//   };

//   const formatSalary = (min, max) => {
//     if (!min && !max) return null;
//     if (min && max) return `₹ ${min.toLocaleString()} - ₹ ${max.toLocaleString()}`;
//     if (min) return `₹ ${min.toLocaleString()}+`;
//     return `Up to ₹ ${max.toLocaleString()}`;
//   };

//   // Generate consistent color based on company name
//   const getColorFromName = (name) => {
//     if (!name) return '#6B7280';
//     const colors = [
//       '#3B82F6', // blue
//       '#EC4899', // pink
//       '#06B6D4', // cyan
//       '#84CC16', // lime
//       '#8B5CF6', // purple
//       '#F59E0B', // amber
//       '#10B981', // emerald
//       '#EF4444', // red
//     ];
//     const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
//     return colors[index % colors.length];
//   };

//   const salary = formatSalary(opportunity.salary_range_min, opportunity.salary_range_max);
//   const logoColor = getColorFromName(opportunity.company_name);

//   const handleSaveClick = (e) => {
//     e.stopPropagation(); // Prevent card click
//     if (onToggleSave) {
//       onToggleSave(opportunity);
//     }
//   };

//   return (
//     <div 
//       className={`bg-white rounded-lg sm:rounded-xl p-3 sm:p-6 cursor-pointer transition-all duration-200 relative ${
//         isSelected 
//           ? 'shadow-lg ring-2 ring-blue-500' 
//           : 'shadow-sm hover:shadow-md border border-gray-100'
//       }`}
//       onClick={onClick}
//     >
//       {/* Bookmark Button */}
//       {onToggleSave && (
//         <button
//           onClick={handleSaveClick}
//           className="absolute top-2 left-2 p-2 rounded-full bg-white shadow-sm hover:shadow-md transition-all z-10"
//           title={isSaved ? 'Unsave job' : 'Save job'}
//         >
//           <Bookmark
//             className={`w-4 h-4 sm:w-5 sm:h-5 transition-all ${
//               isSaved ? 'fill-blue-600 text-blue-600' : 'text-gray-400 hover:text-blue-600'
//             }`}
//           />
//         </button>
//       )}
      
//       {/* Applied Badge */}
//       {isApplied && (
//         <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
//           ✓ Applied
//         </div>
//       )}
//       <div className="flex flex-col items-center text-center space-y-2.5 sm:space-y-4">
//         {/* Company Logo */}
//         <div 
//           className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-sm"
//           style={{ backgroundColor: opportunity.company_logo ? 'transparent' : logoColor }}
//         >
//           {opportunity.company_logo ? (
//             <img 
//               src={opportunity.company_logo} 
//               alt={opportunity.company_name}
//               className="w-full h-full object-cover rounded-2xl"
//             />
//           ) : (
//             <div className="w-10 h-10 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
//               <span className="text-sm">{getInitials(opportunity.company_name)}</span>
//             </div>
//           )}
//         </div>

//         {/* Job Title */}
//         <h3 className="font-semibold text-gray-900 text-base sm:text-lg leading-tight">
//           {opportunity.job_title || opportunity.title}
//         </h3>

//         {/* Company Name */}
//         <p className="text-xs sm:text-sm text-gray-600">
//           {opportunity.company_name}
//         </p>

//         {/* Location */}
//         {opportunity.location && (
//           <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-gray-500">
//             <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
//             <span>{opportunity.location}</span>
//           </div>
//         )}

//         {/* Salary */}
//         {salary && (
//           <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-gray-500">
//             <span>{salary}</span>
//           </div>
//         )}

//         {/* Additional Info Tags */}
//         <div className="flex flex-wrap gap-1.5 justify-center">
//           {/* {opportunity.employment_type && (
//             <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
//               {opportunity.employment_type}
//             </span>
//           )}
//           {opportunity.mode && (
//             <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full capitalize">
//               {opportunity.mode}
//             </span>
//           )} */}
//           {/* {opportunity.sector && (
//             <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
//               {opportunity.sector}
//             </span>
//           )} */}
//         </div>

//         {/* Duration for Internships */}
//         {/* {opportunity.duration_weeks && (
//           <div className="text-xs text-gray-500">
//             📅 {opportunity.duration_weeks} weeks
//           </div>
//         )} */}

//         {/* Cost Badge */}
//         {opportunity.cost_inr !== null && opportunity.cost_inr !== undefined && (
//           <div className="text-xs font-semibold">
//             {opportunity.cost_inr === 0 ? (
//               <span className="text-green-600">Free</span>
//             ) : (
//               <span className="text-gray-600">₹{opportunity.cost_inr.toLocaleString()}</span>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default OpportunityCard;
