// import React, { useState, useEffect } from 'react';
// import {
//   FunnelIcon,
//   XMarkIcon,
//   ChevronDownIcon,
//   AdjustmentsHorizontalIcon,
//   CalendarIcon,
//   MapPinIcon,
//   BriefcaseIcon,
//   AcademicCapIcon,
//   CurrencyDollarIcon,
//   ClockIcon,
//   CheckCircleIcon
// } from '@heroicons/react/24/outline';
// import { RequisitionFilters } from '../../../types/recruiter';
// import { supabase } from '../../../lib/supabaseClient';

// interface AdvancedRequisitionFiltersProps {
//   filters: RequisitionFilters;
//   onFiltersChange: (filters: RequisitionFilters) => void;
//   onReset: () => void;
//   onApply: () => void;
// }

// // Static filter options data
// const STATUSES = ['open', 'draft', 'on_hold', 'closed'];
// const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];
// const EXPERIENCE_LEVELS = ['Entry', 'Mid', 'Senior', 'Lead'];

// // Smart Filter Options
// const APPLICATION_COUNT_RANGES = [
//   { value: 'all', label: 'All Applications', min: 0, max: null },
//   { value: '0', label: 'No Applications (0)', min: 0, max: 0 },
//   { value: '1-5', label: 'Low (1-5)', min: 1, max: 5 },
//   { value: '6-20', label: 'Medium (6-20)', min: 6, max: 20 },
//   { value: '21-50', label: 'High (21-50)', min: 21, max: 50 },
//   { value: '50+', label: 'Very High (50+)', min: 51, max: null },
// ];

// // Salary Range Presets (in INR)
// const SALARY_PRESETS = [
//   { label: 'Entry Level (3-6L)', min: 300000, max: 600000 },
//   { label: 'Mid Level (6-12L)', min: 600000, max: 1200000 },
//   { label: 'Senior (12-20L)', min: 1200000, max: 2000000 },
//   { label: 'Lead (20L+)', min: 2000000, max: null },
// ];

// // Date Range Presets
// const getDatePreset = (preset: string) => {
//   const today = new Date();
//   const startDate = new Date();

//   switch (preset) {
//     case '7d':
//       startDate.setDate(today.getDate() - 7);
//       return { startDate: startDate.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] };
//     case '30d':
//       startDate.setDate(today.getDate() - 30);
//       return { startDate: startDate.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] };
//     case '90d':
//       startDate.setDate(today.getDate() - 90);
//       return { startDate: startDate.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] };
//     case 'ytd':
//       startDate.setMonth(0, 1); // January 1st of current year
//       return { startDate: startDate.toISOString().split('T')[0], endDate: today.toISOString().split('T')[0] };
//     default:
//       return { startDate: undefined, endDate: undefined };
//   }
// };

// const AdvancedRequisitionFilters: React.FC<AdvancedRequisitionFiltersProps> = ({
//   filters,
//   onFiltersChange,
//   onReset,
//   onApply
// }) => {
//   const [isExpanded, setIsExpanded] = useState(false);
//   const [activeSection, setActiveSection] = useState<string | null>(null);
//   const [departments, setDepartments] = useState<string[]>([]);
//   const [locations, setLocations] = useState<string[]>([]);
//   const [loadingDepartments, setLoadingDepartments] = useState(false);
//   const [loadingLocations, setLoadingLocations] = useState(false);

//   // Fetch unique departments and locations from database
//   useEffect(() => {
//     const fetchFilterOptions = async () => {
//       // Fetch departments
//       setLoadingDepartments(true);
//       try {
//         const { data: deptData, error: deptError } = await supabase
//           .from('opportunities')
//           .select('department')
//           .not('department', 'is', null)
//           .order('department');

//         if (deptError) {
//           console.error('Error fetching departments:', deptError);
//         } else {
//           const uniqueDepartments = [...new Set(
//             deptData.map(item => item.department).filter(Boolean)
//           )] as string[];
//           setDepartments(uniqueDepartments);
//         }
//       } catch (error) {
//         console.error('Error fetching departments:', error);
//       } finally {
//         setLoadingDepartments(false);
//       }

//       // Fetch locations
//       setLoadingLocations(true);
//       try {
//         const { data: locData, error: locError } = await supabase
//           .from('opportunities')
//           .select('location')
//           .not('location', 'is', null)
//           .order('location');

//         if (locError) {
//           console.error('Error fetching locations:', locError);
//         } else {
//           const uniqueLocations = [...new Set(
//             locData.map(item => item.location).filter(Boolean)
//           )] as string[];
//           setLocations(uniqueLocations);
//         }
//       } catch (error) {
//         console.error('Error fetching locations:', error);
//       } finally {
//         setLoadingLocations(false);
//       }
//     };

//     fetchFilterOptions();
//   }, []);

//   // Count active filters
//   const activeFilterCount =
//     filters.status.length +
//     filters.departments.length +
//     filters.locations.length +
//     filters.employmentTypes.length +
//     filters.experienceLevels.length +
//     (filters.salaryRange.min || filters.salaryRange.max ? 1 : 0) +
//     (filters.applicationCountRange && filters.applicationCountRange !== 'all' ? 1 : 0) +
//     (filters.dateRange.startDate || filters.dateRange.endDate ? 1 : 0);

//   const toggleFilter = (category: keyof RequisitionFilters, value: string) => {
//     const currentValues = filters[category] as string[];
//     const newValues = currentValues.includes(value)
//       ? currentValues.filter(v => v !== value)
//       : [...currentValues, value];

//     onFiltersChange({
//       ...filters,
//       [category]: newValues
//     });
//   };

//   const clearCategory = (category: keyof RequisitionFilters) => {
//     if (category === 'salaryRange') {
//       onFiltersChange({ ...filters, salaryRange: {} });
//     } else if (category === 'applicationCountRange') {
//       onFiltersChange({ ...filters, applicationCountRange: 'all' });
//     } else if (Array.isArray(filters[category])) {
//       onFiltersChange({ ...filters, [category]: [] });
//     }
//   };

//   const handleApply = () => {
//     onApply();
//     setIsExpanded(false);
//   };

//   const FilterSection = ({
//     title,
//     icon: Icon,
//     category,
//     options,
//     isLoading = false
//   }: {
//     title: string;
//     icon: any;
//     category: keyof RequisitionFilters;
//     options: string[];
//     isLoading?: boolean;
//   }) => {
//     const selectedValues = filters[category] as string[];
//     const isActive = selectedValues.length > 0;

//     return (
//       <div className="border-b border-gray-200 last:border-b-0">
//         <button
//           onClick={() => setActiveSection(activeSection === category ? null : category)}
//           className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
//         >
//           <div className="flex items-center gap-2">
//             <Icon className={`h-4 w-4 ${isActive ? 'text-primary-600' : 'text-gray-500'}`} />
//             <span className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
//               {title}
//             </span>
//             {isActive && (
//               <span className="ml-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
//                 {selectedValues.length}
//               </span>
//             )}
//           </div>
//           <ChevronDownIcon
//             className={`h-4 w-4 text-gray-400 transition-transform ${
//               activeSection === category ? 'transform rotate-180' : ''
//             }`}
//           />
//         </button>

//         {activeSection === category && (
//           <div className="px-6 py-4 bg-gray-50 space-y-2 max-h-80 overflow-y-auto">
//             {isLoading ? (
//               <div className="flex items-center justify-center py-4">
//                 <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
//                 <span className="ml-2 text-sm text-gray-500">Loading...</span>
//               </div>
//             ) : options.length === 0 ? (
//               <div className="text-center py-4 text-sm text-gray-500">
//                 No {title.toLowerCase()} found
//               </div>
//             ) : (
//               options.map((option) => {
//                 const isSelected = selectedValues.includes(option);
//                 return (
//                   <label
//                     key={option}
//                     className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors"
//                   >
//                     <input
//                       type="checkbox"
//                       checked={isSelected}
//                       onChange={() => toggleFilter(category, option)}
//                       className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
//                     />
//                     <span className="text-sm text-gray-700 capitalize">{option.replace('_', ' ')}</span>
//                   </label>
//                 );
//               })
//             )}
//             {selectedValues.length > 0 && !isLoading && (
//               <button
//                 onClick={() => clearCategory(category)}
//                 className="w-full mt-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
//               >
//                 Clear {title}
//               </button>
//             )}
//           </div>
//         )}
//       </div>
//     );
//   };

//   const SalaryRangeSection = () => {
//     const isActive = filters.salaryRange.min !== undefined || filters.salaryRange.max !== undefined;

//     return (
//       <div className="border-b border-gray-200 last:border-b-0">
//         <button
//           onClick={() => setActiveSection(activeSection === 'salaryRange' ? null : 'salaryRange')}
//           className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
//         >
//           <div className="flex items-center gap-2">
//             <CurrencyDollarIcon className={`h-4 w-4 ${isActive ? 'text-primary-600' : 'text-gray-500'}`} />
//             <span className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
//               Salary Range
//             </span>
//             {isActive && (
//               <span className="ml-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
//                 1
//               </span>
//             )}
//           </div>
//           <ChevronDownIcon
//             className={`h-4 w-4 text-gray-400 transition-transform ${
//               activeSection === 'salaryRange' ? 'transform rotate-180' : ''
//             }`}
//           />
//         </button>

//         {activeSection === 'salaryRange' && (
//           <div className="px-6 py-4 bg-gray-50 space-y-3">
//             {/* Quick Presets */}
//             <div>
//               <label className="block text-xs font-medium text-gray-700 mb-2">Quick Presets</label>
//               <div className="grid grid-cols-2 gap-2">
//                 {SALARY_PRESETS.map((preset) => (
//                   <button
//                     key={preset.label}
//                     onClick={() => onFiltersChange({
//                       ...filters,
//                       salaryRange: { min: preset.min, max: preset.max || undefined }
//                     })}
//                     className="px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
//                   >
//                     {preset.label}
//                   </button>
//                 ))}
//               </div>
//             </div>

//             <div className="border-t border-gray-200 pt-3">
//               <label className="block text-xs font-medium text-gray-700 mb-2">Custom Range</label>
//               <div className="space-y-2">
//                 <div>
//                   <label className="block text-xs text-gray-600 mb-1">Minimum (₹)</label>
//                   <input
//                     type="number"
//                     value={filters.salaryRange.min || ''}
//                     onChange={(e) => onFiltersChange({
//                       ...filters,
//                       salaryRange: { ...filters.salaryRange, min: e.target.value ? parseInt(e.target.value) : undefined }
//                     })}
//                     placeholder="e.g., 300000"
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-xs text-gray-600 mb-1">Maximum (₹)</label>
//                   <input
//                     type="number"
//                     value={filters.salaryRange.max || ''}
//                     onChange={(e) => onFiltersChange({
//                       ...filters,
//                       salaryRange: { ...filters.salaryRange, max: e.target.value ? parseInt(e.target.value) : undefined }
//                     })}
//                     placeholder="e.g., 600000"
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
//                   />
//                 </div>
//               </div>
//             </div>

//             {isActive && (
//               <button
//                 onClick={() => onFiltersChange({ ...filters, salaryRange: {} })}
//                 className="w-full mt-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
//               >
//                 Clear Salary Range
//               </button>
//             )}
//           </div>
//         )}
//       </div>
//     );
//   };

//   const ApplicationCountSection = () => {
//     const isActive = filters.applicationCountRange && filters.applicationCountRange !== 'all';

//     return (
//       <div className="border-b border-gray-200 last:border-b-0">
//         <button
//           onClick={() => setActiveSection(activeSection === 'applicationCount' ? null : 'applicationCount')}
//           className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
//         >
//           <div className="flex items-center gap-2">
//             <BriefcaseIcon className={`h-4 w-4 ${isActive ? 'text-primary-600' : 'text-gray-500'}`} />
//             <span className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
//               Application Count
//             </span>
//             {isActive && (
//               <span className="ml-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
//                 1
//               </span>
//             )}
//           </div>
//           <ChevronDownIcon
//             className={`h-4 w-4 text-gray-400 transition-transform ${
//               activeSection === 'applicationCount' ? 'transform rotate-180' : ''
//             }`}
//           />
//         </button>

//         {activeSection === 'applicationCount' && (
//           <div className="px-6 py-4 bg-gray-50 space-y-2">
//             {APPLICATION_COUNT_RANGES.map((range) => {
//               const isSelected = filters.applicationCountRange === range.value;
//               return (
//                 <label
//                   key={range.value}
//                   className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors"
//                 >
//                   <input
//                     type="radio"
//                     name="applicationCount"
//                     checked={isSelected}
//                     onChange={() => onFiltersChange({
//                       ...filters,
//                       applicationCountRange: range.value
//                     })}
//                     className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
//                   />
//                   <span className="text-sm text-gray-700">{range.label}</span>
//                 </label>
//               );
//             })}
//             {isActive && (
//               <button
//                 onClick={() => onFiltersChange({ ...filters, applicationCountRange: 'all' })}
//                 className="w-full mt-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
//               >
//                 Clear Application Count
//               </button>
//             )}
//           </div>
//         )}
//       </div>
//     );
//   };

//   const DateRangeSection = () => {
//     const isActive = filters.dateRange.startDate || filters.dateRange.endDate;

//     return (
//       <div className="border-b border-gray-200 last:border-b-0">
//         <button
//           onClick={() => setActiveSection(activeSection === 'dateRange' ? null : 'dateRange')}
//           className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
//         >
//           <div className="flex items-center gap-2">
//             <CalendarIcon className={`h-4 w-4 ${isActive ? 'text-primary-600' : 'text-gray-500'}`} />
//             <span className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
//               Posted Date
//             </span>
//             {isActive && (
//               <span className="ml-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
//                 1
//               </span>
//             )}
//           </div>
//           <ChevronDownIcon
//             className={`h-4 w-4 text-gray-400 transition-transform ${
//               activeSection === 'dateRange' ? 'transform rotate-180' : ''
//             }`}
//           />
//         </button>

//         {activeSection === 'dateRange' && (
//           <div className="px-6 py-4 bg-gray-50 space-y-3">
//             {/* Quick Date Presets */}
//             <div>
//               <label className="block text-xs font-medium text-gray-700 mb-2">Quick Presets</label>
//               <div className="grid grid-cols-2 gap-2">
//                 <button
//                   onClick={() => {
//                     const dates = getDatePreset('7d');
//                     onFiltersChange({ ...filters, dateRange: { preset: '7d', ...dates } });
//                   }}
//                   className={`px-3 py-2 text-xs font-medium rounded-md transition-colors ${
//                     filters.dateRange.preset === '7d'
//                       ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
//                       : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
//                   }`}
//                 >
//                   Last 7 Days
//                 </button>
//                 <button
//                   onClick={() => {
//                     const dates = getDatePreset('30d');
//                     onFiltersChange({ ...filters, dateRange: { preset: '30d', ...dates } });
//                   }}
//                   className={`px-3 py-2 text-xs font-medium rounded-md transition-colors ${
//                     filters.dateRange.preset === '30d'
//                       ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
//                       : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
//                   }`}
//                 >
//                   Last 30 Days
//                 </button>
//                 <button
//                   onClick={() => {
//                     const dates = getDatePreset('90d');
//                     onFiltersChange({ ...filters, dateRange: { preset: '90d', ...dates } });
//                   }}
//                   className={`px-3 py-2 text-xs font-medium rounded-md transition-colors ${
//                     filters.dateRange.preset === '90d'
//                       ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
//                       : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
//                   }`}
//                 >
//                   Last 90 Days
//                 </button>
//                 <button
//                   onClick={() => {
//                     const dates = getDatePreset('ytd');
//                     onFiltersChange({ ...filters, dateRange: { preset: 'ytd', ...dates } });
//                   }}
//                   className={`px-3 py-2 text-xs font-medium rounded-md transition-colors ${
//                     filters.dateRange.preset === 'ytd'
//                       ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
//                       : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
//                   }`}
//                 >
//                   Year to Date
//                 </button>
//               </div>
//             </div>

//             {/* Custom Date Range */}
//             <div className="border-t border-gray-200 pt-3">
//               <label className="block text-xs font-medium text-gray-700 mb-2">Custom Date Range</label>
//               <div className="space-y-2">
//                 <div>
//                   <label className="block text-xs text-gray-600 mb-1">From Date</label>
//                   <input
//                     type="date"
//                     value={filters.dateRange.startDate || ''}
//                     onChange={(e) => onFiltersChange({
//                       ...filters,
//                       dateRange: { preset: 'custom', startDate: e.target.value, endDate: filters.dateRange.endDate }
//                     })}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-xs text-gray-600 mb-1">To Date</label>
//                   <input
//                     type="date"
//                     value={filters.dateRange.endDate || ''}
//                     onChange={(e) => onFiltersChange({
//                       ...filters,
//                       dateRange: { preset: 'custom', startDate: filters.dateRange.startDate, endDate: e.target.value }
//                     })}
//                     className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
//                   />
//                 </div>
//               </div>
//             </div>

//             {isActive && (
//               <button
//                 onClick={() => onFiltersChange({
//                   ...filters,
//                   dateRange: { preset: undefined, startDate: undefined, endDate: undefined }
//                 })}
//                 className="w-full mt-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
//               >
//                 Clear Date Range
//               </button>
//             )}
//           </div>
//         )}
//       </div>
//     );
//   };

//   return (
//     <div className="relative">
//       {/* Filter Toggle Button */}
//       <button
//         onClick={() => setIsExpanded(!isExpanded)}
//         className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-all ${
//           isExpanded || activeFilterCount > 0
//             ? 'bg-primary-50 border-primary-300 text-primary-700'
//             : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
//         }`}
//       >
//         <AdjustmentsHorizontalIcon className="h-5 w-5" />
//         <span className="text-sm font-medium">Advanced Filters</span>
//         {activeFilterCount > 0 && (
//           <span className="px-2 py-0.5 bg-primary-600 text-white text-xs font-bold rounded-full">
//             {activeFilterCount}
//           </span>
//         )}
//         <ChevronDownIcon
//           className={`h-4 w-4 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
//         />
//       </button>

//       {/* Filter Panel */}
//       {isExpanded && (
//         <>
//           {/* Backdrop */}
//           <div
//             className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
//             onClick={() => setIsExpanded(false)}
//           />

//           {/* Slide-in Panel from Right */}
//           <div className="fixed top-0 right-0 h-full w-full md:w-[480px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out">
//             {/* Header */}
//             <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
//               <div className="flex items-center gap-3">
//                 <FunnelIcon className="h-6 w-6 text-gray-700" />
//                 <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
//               </div>
//               <button
//                 onClick={() => setIsExpanded(false)}
//                 className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
//               >
//                 <XMarkIcon className="h-6 w-6 text-gray-500" />
//               </button>
//             </div>

//             {/* Active Filters Summary */}
//             {activeFilterCount > 0 && (
//               <div className="px-6 py-3 bg-primary-50 border-b border-primary-100">
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm text-primary-700 font-medium">
//                     {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
//                   </span>
//                   <button
//                     onClick={onReset}
//                     className="text-sm text-primary-600 hover:text-primary-800 font-medium underline"
//                   >
//                     Reset All
//                   </button>
//                 </div>
//               </div>
//             )}

//             {/* Filter Sections */}
//             <div className="flex-1 overflow-y-auto">
//               <FilterSection
//                 title="Status"
//                 icon={CheckCircleIcon}
//                 category="status"
//                 options={STATUSES}
//               />

//               <FilterSection
//                 title="Department"
//                 icon={BriefcaseIcon}
//                 category="departments"
//                 options={departments}
//                 isLoading={loadingDepartments}
//               />

//               <FilterSection
//                 title="Location"
//                 icon={MapPinIcon}
//                 category="locations"
//                 options={locations}
//                 isLoading={loadingLocations}
//               />

//               <FilterSection
//                 title="Employment Type"
//                 icon={ClockIcon}
//                 category="employmentTypes"
//                 options={EMPLOYMENT_TYPES}
//               />

//               <FilterSection
//                 title="Experience Level"
//                 icon={AcademicCapIcon}
//                 category="experienceLevels"
//                 options={EXPERIENCE_LEVELS}
//               />

//               <SalaryRangeSection />

//               <ApplicationCountSection />

//               <DateRangeSection />
//             </div>

//             {/* Footer Actions */}
//             <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between gap-3">
//               <button
//                 onClick={onReset}
//                 className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
//               >
//                 Reset All
//               </button>
//               <button
//                 onClick={handleApply}
//                 className="flex-1 px-4 py-2.5 text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors shadow-sm"
//               >
//                 Apply Filters
//               </button>
//             </div>
//           </div>
//         </>
//       )}

//       {/* Active Filter Tags */}
//       {activeFilterCount > 0 && !isExpanded && (
//         <div className="absolute top-full left-0 mt-2 flex flex-wrap gap-2 max-w-3xl z-30">
//           {filters.status.map(status => (
//             <span key={status} className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
//               <CheckCircleIcon className="h-3 w-3" />
//               {status.replace('_', ' ')}
//               <button
//                 onClick={() => toggleFilter('status', status)}
//                 className="hover:bg-green-200 rounded-full p-0.5"
//               >
//                 <XMarkIcon className="h-3 w-3" />
//               </button>
//             </span>
//           ))}

//           {filters.departments.map(dept => (
//             <span key={dept} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
//               <BriefcaseIcon className="h-3 w-3" />
//               {dept}
//               <button
//                 onClick={() => toggleFilter('departments', dept)}
//                 className="hover:bg-blue-200 rounded-full p-0.5"
//               >
//                 <XMarkIcon className="h-3 w-3" />
//               </button>
//             </span>
//           ))}

//           {filters.locations.map(loc => (
//             <span key={loc} className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
//               <MapPinIcon className="h-3 w-3" />
//               {loc}
//               <button
//                 onClick={() => toggleFilter('locations', loc)}
//                 className="hover:bg-orange-200 rounded-full p-0.5"
//               >
//                 <XMarkIcon className="h-3 w-3" />
//               </button>
//             </span>
//           ))}

//           {filters.employmentTypes.map(type => (
//             <span key={type} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
//               <ClockIcon className="h-3 w-3" />
//               {type}
//               <button
//                 onClick={() => toggleFilter('employmentTypes', type)}
//                 className="hover:bg-purple-200 rounded-full p-0.5"
//               >
//                 <XMarkIcon className="h-3 w-3" />
//               </button>
//             </span>
//           ))}

//           {filters.experienceLevels.map(level => (
//             <span key={level} className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-800 text-xs font-medium rounded-full">
//               <AcademicCapIcon className="h-3 w-3" />
//               {level}
//               <button
//                 onClick={() => toggleFilter('experienceLevels', level)}
//                 className="hover:bg-pink-200 rounded-full p-0.5"
//               >
//                 <XMarkIcon className="h-3 w-3" />
//               </button>
//             </span>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default AdvancedRequisitionFilters;

import React, { useState, useEffect } from 'react';
import {
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
  AdjustmentsHorizontalIcon,
  CalendarIcon,
  MapPinIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';
import { RequisitionFilters } from '../../../types/recruiter';
import { supabase } from '../../../lib/supabaseClient';

interface AdvancedRequisitionFiltersProps {
  filters: RequisitionFilters;
  onFiltersChange: (filters: RequisitionFilters) => void;
  onReset: () => void;
  onApply: () => void;
}

// Static filter options data
const STATUSES = ['open', 'draft', 'on_hold', 'closed'];
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];
const EXPERIENCE_LEVELS = ['Entry', 'Mid', 'Senior', 'Lead'];
const WORK_MODES = ['Remote', 'Hybrid', 'On-site', 'Flexible'];
// Smart Filter Options
const APPLICATION_COUNT_RANGES = [
  { value: 'all', label: 'All Applications', min: 0, max: null },
  { value: '0', label: 'No Applications (0)', min: 0, max: 0 },
  { value: '1-5', label: 'Low (1-5)', min: 1, max: 5 },
  { value: '6-20', label: 'Medium (6-20)', min: 6, max: 20 },
  { value: '21-50', label: 'High (21-50)', min: 21, max: 50 },
  { value: '50+', label: 'Very High (50+)', min: 51, max: null },
];
const SALARY_PRESETS = [
  { label: 'Entry Level (3-6L)', min: 300000, max: 600000 },
  { label: 'Mid Level (6-12L)', min: 600000, max: 1200000 },
  { label: 'Senior (12-20L)', min: 1200000, max: 2000000 },
  { label: 'Lead (20L+)', min: 2000000, max: null },
];

const EXPERIENCE_REQUIRED_OPTIONS = [
  { value: '0', label: 'Fresher (0 years)' },
  { value: '0-1', label: '0-1 years' },
  { value: '1-2', label: '1-2 years' },
  { value: '2-3', label: '2-3 years' },
  { value: '3-5', label: '3-5 years' },
  { value: '5-7', label: '5-7 years' },
  { value: '7-10', label: '7-10 years' },
  { value: '10+', label: '10+ years' },
];

// Date Range Presets
const getDatePreset = (preset: string) => {
  const today = new Date();
  const startDate = new Date();

  switch (preset) {
    case '7d':
      startDate.setDate(today.getDate() - 7);
      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      };
    case '30d':
      startDate.setDate(today.getDate() - 30);
      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      };
    case '90d':
      startDate.setDate(today.getDate() - 90);
      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      };
    case 'ytd':
      startDate.setMonth(0, 1); // January 1st of current year
      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      };
    default:
      return { startDate: undefined, endDate: undefined };
  }
};

const AdvancedRequisitionFilters: React.FC<AdvancedRequisitionFiltersProps> = ({
  filters,
  onFiltersChange,
  onReset,
  onApply,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [titles, setTitles] = useState<string[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingTitles, setLoadingTitles] = useState(false);
  // Fetch unique departments and locations from database
  useEffect(() => {
    const fetchFilterOptions = async () => {
      // 🔹 Fetch departments
      setLoadingDepartments(true);
      try {
        const { data: deptData, error: deptError } = await supabase
          .from('opportunities')
          .select('department')
          .not('department', 'is', null)
          .order('department');

        if (deptError) {
          console.error('Error fetching departments:', deptError);
        } else {
          const uniqueDepartments = [
            ...new Set(deptData.map((item) => item.department).filter(Boolean)),
          ] as string[];
          setDepartments(uniqueDepartments);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
      } finally {
        setLoadingDepartments(false);
      }

      // 🔹 Fetch locations
      setLoadingLocations(true);
      try {
        const { data: locData, error: locError } = await supabase
          .from('opportunities')
          .select('location')
          .not('location', 'is', null)
          .order('location');

        if (locError) {
          console.error('Error fetching locations:', locError);
        } else {
          const uniqueLocations = [
            ...new Set(locData.map((item) => item.location).filter(Boolean)),
          ] as string[];
          setLocations(uniqueLocations);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setLoadingLocations(false);
      }

      // 🔹 Fetch titles (moved **inside** the async function)
      setLoadingTitles(true);
      try {
        const { data: titleData, error: titleError } = await supabase
          .from('opportunities')
          .select('title, job_title')
          .order('title');

        if (titleError) {
          console.error('Error fetching titles:', titleError);
        } else {
          const allTitles = titleData.map((item) => item.title || item.job_title).filter(Boolean);
          const uniqueTitles = [...new Set(allTitles)] as string[];

          setTitles(
            uniqueTitles.length > 0
              ? uniqueTitles
              : [
                  'Software Engineer',
                  'Senior Software Engineer',
                  'Product Manager',
                  'UI/UX Designer',
                  'Data Analyst',
                  'DevOps Engineer',
                ]
          );
        }
      } catch (error) {
        console.error('Error fetching titles:', error);
        setTitles([
          'Software Engineer',
          'Senior Software Engineer',
          'Product Manager',
          'UI/UX Designer',
          'Data Analyst',
          'DevOps Engineer',
        ]);
      } finally {
        setLoadingTitles(false);
      }
    };

    // ✅ Call once after mount
    fetchFilterOptions();
  }, []);
  // Count active filters
  const activeFilterCount =
    filters.status.length +
    filters.departments.length +
    filters.locations.length +
    filters.employmentTypes.length +
    filters.experienceLevels.length +
    (filters.workModes?.length || 0) +
    (filters.experienceRequired?.length || 0) +
    (filters.titles?.length || 0) +
    (filters.salaryRange.min || filters.salaryRange.max ? 1 : 0) +
    (filters.applicationCountRange && filters.applicationCountRange !== 'all' ? 1 : 0) +
    (filters.dateRange.startDate || filters.dateRange.endDate ? 1 : 0);

  const toggleFilter = (category: keyof RequisitionFilters, value: string) => {
    const currentValues = filters[category] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    onFiltersChange({
      ...filters,
      [category]: newValues,
    });
  };

  const clearCategory = (category: keyof RequisitionFilters) => {
    if (category === 'salaryRange') {
      onFiltersChange({ ...filters, salaryRange: {} });
    } else if (category === 'applicationCountRange') {
      onFiltersChange({ ...filters, applicationCountRange: 'all' });
    } else if (Array.isArray(filters[category])) {
      onFiltersChange({ ...filters, [category]: [] });
    }
  };

  const handleApply = () => {
    onApply();
    setIsExpanded(false);
  };

  const FilterSection = ({
    title,
    icon: Icon,
    category,
    options,
    isLoading = false,
  }: {
    title: string;
    icon: any;
    category: keyof RequisitionFilters;
    options: string[];
    isLoading?: boolean;
  }) => {
    const selectedValues = filters[category] as string[];
    const isActive = selectedValues.length > 0;

    return (
      <div className="border-b border-gray-200 last:border-b-0">
        <button
          onClick={() => setActiveSection(activeSection === category ? null : category)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${isActive ? 'text-primary-600' : 'text-gray-500'}`} />
            <span className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
              {title}
            </span>
            {isActive && (
              <span className="ml-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                {selectedValues.length}
              </span>
            )}
          </div>
          <ChevronDownIcon
            className={`h-4 w-4 text-gray-400 transition-transform ${
              activeSection === category ? 'transform rotate-180' : ''
            }`}
          />
        </button>

        {activeSection === category && (
          <div className="px-6 py-4 bg-gray-50 space-y-2 max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                <span className="ml-2 text-sm text-gray-500">Loading...</span>
              </div>
            ) : options.length === 0 ? (
              <div className="text-center py-4 text-sm text-gray-500">
                No {title.toLowerCase()} found
              </div>
            ) : (
              options.map((option) => {
                const isSelected = selectedValues.includes(option);
                return (
                  <label
                    key={option}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleFilter(category, option)}
                      className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {option.replace('_', ' ')}
                    </span>
                  </label>
                );
              })
            )}
            {selectedValues.length > 0 && !isLoading && (
              <button
                onClick={() => clearCategory(category)}
                className="w-full mt-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                Clear {title}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const SalaryRangeSection = () => {
    const isActive = filters.salaryRange.min !== undefined || filters.salaryRange.max !== undefined;

    return (
      <div className="border-b border-gray-200 last:border-b-0">
        <button
          onClick={() => setActiveSection(activeSection === 'salaryRange' ? null : 'salaryRange')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <CurrencyDollarIcon
              className={`h-4 w-4 ${isActive ? 'text-primary-600' : 'text-gray-500'}`}
            />
            <span className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
              Salary Range
            </span>
            {isActive && (
              <span className="ml-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                1
              </span>
            )}
          </div>
          <ChevronDownIcon
            className={`h-4 w-4 text-gray-400 transition-transform ${
              activeSection === 'salaryRange' ? 'transform rotate-180' : ''
            }`}
          />
        </button>

        {activeSection === 'salaryRange' && (
          <div className="px-6 py-4 bg-gray-50 space-y-3">
            {/* Quick Presets */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Quick Presets</label>
              <div className="grid grid-cols-2 gap-2">
                {SALARY_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() =>
                      onFiltersChange({
                        ...filters,
                        salaryRange: { min: preset.min, max: preset.max || undefined },
                      })
                    }
                    className="px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-3">
              <label className="block text-xs font-medium text-gray-700 mb-2">Mode</label>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <label className="block text-xs font-medium text-gray-700 mb-2">Custom Range</label>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Minimum (₹)</label>
                  <input
                    type="number"
                    value={filters.salaryRange.min || ''}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        salaryRange: {
                          ...filters.salaryRange,
                          min: e.target.value ? parseInt(e.target.value) : undefined,
                        },
                      })
                    }
                    placeholder="e.g., 300000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Maximum (₹)</label>
                  <input
                    type="number"
                    value={filters.salaryRange.max || ''}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        salaryRange: {
                          ...filters.salaryRange,
                          max: e.target.value ? parseInt(e.target.value) : undefined,
                        },
                      })
                    }
                    placeholder="e.g., 600000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            {isActive && (
              <button
                onClick={() => onFiltersChange({ ...filters, salaryRange: {} })}
                className="w-full mt-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                Clear Salary Range
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const ApplicationCountSection = () => {
    const isActive = filters.applicationCountRange && filters.applicationCountRange !== 'all';

    return (
      <div className="border-b border-gray-200 last:border-b-0">
        <button
          onClick={() =>
            setActiveSection(activeSection === 'applicationCount' ? null : 'applicationCount')
          }
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <BriefcaseIcon
              className={`h-4 w-4 ${isActive ? 'text-primary-600' : 'text-gray-500'}`}
            />
            <span className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
              Application Count
            </span>
            {isActive && (
              <span className="ml-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                1
              </span>
            )}
          </div>
          <ChevronDownIcon
            className={`h-4 w-4 text-gray-400 transition-transform ${
              activeSection === 'applicationCount' ? 'transform rotate-180' : ''
            }`}
          />
        </button>

        {activeSection === 'applicationCount' && (
          <div className="px-6 py-4 bg-gray-50 space-y-2">
            {APPLICATION_COUNT_RANGES.map((range) => {
              const isSelected = filters.applicationCountRange === range.value;
              return (
                <label
                  key={range.value}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors"
                >
                  <input
                    type="radio"
                    name="applicationCount"
                    checked={isSelected}
                    onChange={() =>
                      onFiltersChange({
                        ...filters,
                        applicationCountRange: range.value,
                      })
                    }
                    className="h-4 w-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{range.label}</span>
                </label>
              );
            })}
            {isActive && (
              <button
                onClick={() => onFiltersChange({ ...filters, applicationCountRange: 'all' })}
                className="w-full mt-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                Clear Application Count
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const DateRangeSection = () => {
    const isActive = filters.dateRange.startDate || filters.dateRange.endDate;

    return (
      <div className="border-b border-gray-200 last:border-b-0">
        <button
          onClick={() => setActiveSection(activeSection === 'dateRange' ? null : 'dateRange')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <CalendarIcon
              className={`h-4 w-4 ${isActive ? 'text-primary-600' : 'text-gray-500'}`}
            />
            <span className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
              Posted Date
            </span>
            {isActive && (
              <span className="ml-1 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                1
              </span>
            )}
          </div>
          <ChevronDownIcon
            className={`h-4 w-4 text-gray-400 transition-transform ${
              activeSection === 'dateRange' ? 'transform rotate-180' : ''
            }`}
          />
        </button>

        {activeSection === 'dateRange' && (
          <div className="px-6 py-4 bg-gray-50 space-y-3">
            {/* Quick Date Presets */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Quick Presets</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const dates = getDatePreset('7d');
                    onFiltersChange({ ...filters, dateRange: { preset: '7d', ...dates } });
                  }}
                  className={`px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                    filters.dateRange.preset === '7d'
                      ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Last 7 Days
                </button>
                <button
                  onClick={() => {
                    const dates = getDatePreset('30d');
                    onFiltersChange({ ...filters, dateRange: { preset: '30d', ...dates } });
                  }}
                  className={`px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                    filters.dateRange.preset === '30d'
                      ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Last 30 Days
                </button>
                <button
                  onClick={() => {
                    const dates = getDatePreset('90d');
                    onFiltersChange({ ...filters, dateRange: { preset: '90d', ...dates } });
                  }}
                  className={`px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                    filters.dateRange.preset === '90d'
                      ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Last 90 Days
                </button>
                <button
                  onClick={() => {
                    const dates = getDatePreset('ytd');
                    onFiltersChange({ ...filters, dateRange: { preset: 'ytd', ...dates } });
                  }}
                  className={`px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                    filters.dateRange.preset === 'ytd'
                      ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Year to Date
                </button>
              </div>
            </div>

            {/* Custom Date Range */}
            <div className="border-t border-gray-200 pt-3">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Custom Date Range
              </label>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">From Date</label>
                  <input
                    type="date"
                    value={filters.dateRange.startDate || ''}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        dateRange: {
                          preset: 'custom',
                          startDate: e.target.value,
                          endDate: filters.dateRange.endDate,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">To Date</label>
                  <input
                    type="date"
                    value={filters.dateRange.endDate || ''}
                    onChange={(e) =>
                      onFiltersChange({
                        ...filters,
                        dateRange: {
                          preset: 'custom',
                          startDate: filters.dateRange.startDate,
                          endDate: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            {isActive && (
              <button
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    dateRange: { preset: undefined, startDate: undefined, endDate: undefined },
                  })
                }
                className="w-full mt-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                Clear Date Range
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-all ${
          isExpanded || activeFilterCount > 0
            ? 'bg-primary-50 border-primary-300 text-primary-700'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        <AdjustmentsHorizontalIcon className="h-5 w-5" />
        <span className="text-sm font-medium">Advanced Filters</span>
        {activeFilterCount > 0 && (
          <span className="px-2 py-0.5 bg-primary-600 text-white text-xs font-bold rounded-full">
            {activeFilterCount}
          </span>
        )}
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
        />
      </button>

      {/* Filter Panel */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
            onClick={() => setIsExpanded(false)}
          />

          {/* Slide-in Panel from Right */}
          <div className="fixed top-0 right-0 h-full w-full md:w-[480px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FunnelIcon className="h-6 w-6 text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            {/* Active Filters Summary */}
            {activeFilterCount > 0 && (
              <div className="px-6 py-3 bg-primary-50 border-b border-primary-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-primary-700 font-medium">
                    {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                  </span>
                  <button
                    onClick={onReset}
                    className="text-sm text-primary-600 hover:text-primary-800 font-medium underline"
                  >
                    Reset All
                  </button>
                </div>
              </div>
            )}

            {/* Filter Sections */}
            <div className="flex-1 overflow-y-auto">
              <FilterSection
                title="Status"
                icon={CheckCircleIcon}
                category="status"
                options={STATUSES}
              />

              <FilterSection
                title="Department"
                icon={BriefcaseIcon}
                category="departments"
                options={departments}
                isLoading={loadingDepartments}
              />

              <FilterSection
                title="Location"
                icon={MapPinIcon}
                category="locations"
                options={locations}
                isLoading={loadingLocations}
              />

              <FilterSection
                title="Work Mode"
                icon={BuildingOfficeIcon}
                category="workModes"
                options={WORK_MODES}
              />

              <FilterSection title="Job Title" icon={EyeIcon} category="titles" options={titles} />

              <FilterSection
                title="Employment Type"
                icon={ClockIcon}
                category="employmentTypes"
                options={EMPLOYMENT_TYPES}
              />

              <FilterSection
                title="Experience Level"
                icon={AcademicCapIcon}
                category="experienceLevels"
                options={EXPERIENCE_LEVELS}
              />
              <FilterSection
                title="Experience Required"
                icon={BriefcaseIcon}
                category="experienceRequired"
                options={EXPERIENCE_REQUIRED_OPTIONS.map((option) => option.value)}
              />
              <SalaryRangeSection />

              <ApplicationCountSection />

              <DateRangeSection />
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between gap-3">
              <button
                onClick={onReset}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Reset All
              </button>
              <button
                onClick={handleApply}
                className="flex-1 px-4 py-2.5 text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors shadow-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}

      {/* Active Filter Tags */}
      {activeFilterCount > 0 && !isExpanded && (
        <div className="absolute top-full left-0 mt-2 flex flex-wrap gap-2 max-w-3xl z-30">
          {filters.status.map((status) => (
            <span
              key={status}
              className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full"
            >
              <CheckCircleIcon className="h-3 w-3" />
              {status.replace('_', ' ')}
              <button
                onClick={() => toggleFilter('status', status)}
                className="hover:bg-green-200 rounded-full p-0.5"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}

          {(filters.titles || []).map((title) => (
            <span
              key={title}
              className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full"
            >
              <BriefcaseIcon className="h-3 w-3" />
              {title}
              <button
                onClick={() => toggleFilter('titles', title)}
                className="hover:bg-indigo-200 rounded-full p-0.5"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}

          {filters.departments.map((dept) => (
            <span
              key={dept}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
            >
              <BriefcaseIcon className="h-3 w-3" />
              {dept}
              <button
                onClick={() => toggleFilter('departments', dept)}
                className="hover:bg-blue-200 rounded-full p-0.5"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}

          {filters.locations.map((loc) => (
            <span
              key={loc}
              className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full"
            >
              <MapPinIcon className="h-3 w-3" />
              {loc}
              <button
                onClick={() => toggleFilter('locations', loc)}
                className="hover:bg-orange-200 rounded-full p-0.5"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
          {(filters.experienceRequired || []).map((exp) => {
            const option = EXPERIENCE_REQUIRED_OPTIONS.find((o) => o.value === exp);
            return (
              <span key={exp} className="...">
                {option?.label || exp} {/* Show label, not value */}
              </span>
            );
          })}
          {(filters.workModes || []).map((mode) => (
            <span
              key={mode}
              className="inline-flex items-center gap-1 px-3 py-1 bg-teal-100 text-teal-800 text-xs font-medium rounded-full"
            >
              <MapPinIcon className="h-3 w-3" />
              {mode}
              <button
                onClick={() => toggleFilter('workModes', mode)}
                className="hover:bg-teal-200 rounded-full p-0.5"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}

          {filters.employmentTypes.map((type) => (
            <span
              key={type}
              className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full"
            >
              <ClockIcon className="h-3 w-3" />
              {type}
              <button
                onClick={() => toggleFilter('employmentTypes', type)}
                className="hover:bg-purple-200 rounded-full p-0.5"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}

          {filters.experienceLevels.map((level) => (
            <span
              key={level}
              className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-800 text-xs font-medium rounded-full"
            >
              <AcademicCapIcon className="h-3 w-3" />
              {level}
              <button
                onClick={() => toggleFilter('experienceLevels', level)}
                className="hover:bg-pink-200 rounded-full p-0.5"
              >
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdvancedRequisitionFilters;
