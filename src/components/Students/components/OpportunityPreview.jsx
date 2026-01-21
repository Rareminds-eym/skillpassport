// import React from 'react';
// import { MapPin, Briefcase, X, ExternalLink, Star, Bookmark, Clock, Users, TrendingUp, Award, CheckCircle2, Calendar } from 'lucide-react';
// import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
// import { Button } from './ui/button';
// import { Badge } from './ui/badge';

// const OpportunityPreview = ({
//   opportunity,
//   onClose,
//   onApply,
//   onToggleSave,
//   isApplied = false,
//   isSaved = false,
//   isApplying = false
// }) => {
//   // State for expanding sections
//   const [showAllRequirements, setShowAllRequirements] = React.useState(false);
//   const [showAllResponsibilities, setShowAllResponsibilities] = React.useState(false);
//   const [showAllSkills, setShowAllSkills] = React.useState(false);

//   // Reset expand states when opportunity changes
//   React.useEffect(() => {
//     setShowAllRequirements(false);
//     setShowAllResponsibilities(false);
//     setShowAllSkills(false);
//   }, [opportunity?.id]);

//   if (!opportunity) {
//     return (
//       <div className="bg-white rounded-3xl shadow-sm h-full flex items-center justify-center p-8 border border-gray-100">
//         <div className="text-center">
//           <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl flex items-center justify-center">
//             <Briefcase className="w-12 h-12 text-indigo-600" />
//           </div>
//           <h2 className="text-2xl font-bold mb-3 text-gray-900">Select a Position</h2>
//           <p className="text-gray-500 max-w-xs mx-auto">
//             Choose a job from the list to view detailed information and apply
//           </p>
//         </div>
//       </div>
//     );
//   }

//   const getInitials = (name) => {
//     return name
//       ?.split(' ')
//       .map(word => word[0])
//       .join('')
//       .toUpperCase()
//       .slice(0, 2) || '??';
//   };

//   const formatSalary = (min, max) => {
//     if (!min && !max) return 'Competitive';
//     if (min && max) return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
//     if (min) return `₹${min.toLocaleString()}+`;
//     return `Up to ₹${max.toLocaleString()}`;
//   };

//   const parseJsonField = (field) => {
//     if (!field) return [];
//     if (Array.isArray(field)) return field;
//     try {
//       return JSON.parse(field);
//     } catch {
//       return [];
//     }
//   };

//   const requirements = parseJsonField(opportunity.requirements);
//   const responsibilities = parseJsonField(opportunity.responsibilities);
//   const benefits = parseJsonField(opportunity.benefits);
//   const skills = parseJsonField(opportunity.skills_required);

//   // Calculate days since posted
//   const postedDate = new Date(opportunity.posted_date || opportunity.created_at);
//   const daysAgo = Math.floor((new Date() - postedDate) / (1000 * 60 * 60 * 24));
//   const postedText = daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`;

//   // Check if description is long (more than 300 characters)
//   const isDescriptionLong = opportunity.description && opportunity.description.length > 300;
//   const truncatedDescription = isDescriptionLong
//     ? opportunity.description.slice(0, 300) + '...'
//     : opportunity.description;

//   return (
//     <div className="bg-white rounded-3xl shadow-md h-full flex flex-col overflow-hidden border border-gray-100">
//       {/* Modern Header with Gradient Accent */}
//       <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 p-6">
//         {/* Decorative Background Pattern */}
//         <div className="absolute inset-0 opacity-10">
//           <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
//           <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
//         </div>

//         {/* Close Button */}
//         {onClose && (
//           <button
//             onClick={onClose}
//             className="lg:hidden absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-opacity-30 transition-all"
//           >
//             <X className="w-4 h-4" />
//           </button>
//         )}

//         {/* Company Logo & Basic Info */}
//         <div className="relative z-10 flex items-start gap-4">
//           {/* Logo */}
//           <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
//             {opportunity.company_logo ? (
//               <img
//                 src={opportunity.company_logo}
//                 alt={opportunity.company_name}
//                 className="w-full h-full object-cover"
//               />
//             ) : (
//               <span className="text-xl font-bold text-indigo-600">
//                 {getInitials(opportunity.company_name)}
//               </span>
//             )}
//           </div>

//           {/* Title & Company */}
//           <div className="flex-1 min-w-0 pr-10 lg:pr-0">
//             <h1 className="text-xl font-bold text-white mb-1 line-clamp-2 leading-tight">
//               {opportunity.job_title || opportunity.title}
//             </h1>
//             <p className="text-indigo-100 text-sm font-medium mb-2">
//               {opportunity.company_name}
//             </p>

//             {/* Quick Meta */}
//             <div className="flex items-center gap-3 text-xs text-indigo-200">
//               <div className="flex items-center gap-1">
//                 <MapPin className="w-3.5 h-3.5" />
//                 <span className="line-clamp-1">{opportunity.location || 'Remote'}</span>
//               </div>
//               <div className="flex items-center gap-1 text-nowrap">
//                 <Clock className="w-3.5 h-3.5" />
//                 <span>{postedText}</span>
//               </div>
//             </div>
//           </div>

//           {/* Save Button - Hidden on mobile when close button is present, shown on desktop */}
//           {onToggleSave && (
//             <button
//               onClick={() => onToggleSave(opportunity)}
//               className={`w-9 h-9 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center hover:bg-opacity-30 transition-all flex-shrink-0 ${
//                 onClose ? 'hidden lg:flex' : 'flex'
//               }`}
//               title={isSaved ? 'Unsave job' : 'Save job'}
//             >
//               <Bookmark
//                 className={`w-4 h-4 transition-all ${
//                   isSaved ? 'fill-white text-white' : 'text-white'
//                 }`}
//               />
//             </button>
//           )}
//         </div>

//         {/* Salary & Type Tags */}
//         <div className="relative z-10 flex items-center gap-2 mt-4">
//           <div className="flex items-center gap-1.5 bg-white bg-opacity-20 backdrop-blur-sm px-3 py-1.5 rounded-full">
//             <span className="text-sm font-semibold text-white">
//               {formatSalary(opportunity.salary_range_min, opportunity.salary_range_max)}
//             </span>
//           </div>
//           {opportunity.employment_type && (
//             <div className="px-3 py-1.5 bg-white bg-opacity-20 backdrop-blur-sm rounded-full text-nowrap">
//               <span className="text-xs font-semibold text-white">
//                 {opportunity.employment_type}
//               </span>
//             </div>
//           )}
//           {opportunity.mode && (
//             <div className="px-3 py-1.5 bg-white bg-opacity-20 backdrop-blur-sm rounded-full">
//               <span className="text-xs font-semibold text-white capitalize">
//                 {opportunity.mode}
//               </span>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Scrollable Content */}
//       <div className="flex-1 overflow-y-auto p-6 space-y-5 max-h-[calc(100vh-350px)]">

//         {/* About the Role */}
//         {opportunity.description && (
//           <div>
//             <h2 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2">
//               <div className="w-1.5 h-4 bg-gradient-to-b from-indigo-600 to-indigo-400 rounded-full"></div>
//               About the Role
//             </h2>
//             <p className="text-sm text-gray-600 leading-relaxed">
//               {truncatedDescription}
//             </p>
//           </div>
//         )}

//         {/* Key Information - Experience & Deadline */}
//         {(opportunity.experience_level || opportunity.deadline) && (
//           <div className="grid grid-cols-2 gap-4">
//             {/* Experience - Left */}
//             {opportunity.experience_level && (
//               <div className="flex items-center gap-2.5">
//                 <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md">
//                   <Award className="w-4.5 h-4.5 text-white" />
//                 </div>
//                 <div>
//                   <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Experience</p>
//                   <p className="text-sm font-bold text-gray-900">{opportunity.experience_level}</p>
//                 </div>
//               </div>
//             )}

//             {/* Deadline - Right */}
//             {opportunity.deadline && (
//               <div className="flex items-center gap-2.5">
//                 <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-md">
//                   <Calendar className="w-4.5 h-4.5 text-white" />
//                 </div>
//                 <div>
//                   <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Deadline</p>
//                   <p className="text-sm font-bold text-gray-900">
//                     {new Date(opportunity.deadline).toLocaleDateString('en-US', {
//                       month: 'short',
//                       day: 'numeric',
//                       year: 'numeric'
//                     })}
//                   </p>
//                 </div>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Skills Required - Expand/Collapse Design */}
//         {skills.length > 0 && (
//           <div>
//             <h2 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2">
//               <div className="w-1.5 h-4 bg-gradient-to-b from-indigo-600 to-indigo-400 rounded-full"></div>
//               Required Skills
//               <span className="text-xs font-normal text-gray-500">({skills.length})</span>
//             </h2>

//             <div className="flex flex-wrap gap-2">
//               {(showAllSkills ? skills : skills.slice(0, 8)).map((skill, idx) => (
//                 <span
//                   key={idx}
//                   className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
//                 >
//                   {skill}
//                 </span>
//               ))}
//             </div>

//             {skills.length > 8 && (
//               <button
//                 onClick={() => setShowAllSkills(!showAllSkills)}
//                 className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 mt-2 flex items-center gap-1 transition-colors"
//               >
//                 {showAllSkills ? (
//                   <>
//                     Show less
//                     <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
//                       <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
//                     </svg>
//                   </>
//                 ) : (
//                   <>
//                     View {skills.length - 8} more skill{skills.length - 8 !== 1 ? 's' : ''} →
//                   </>
//                 )}
//               </button>
//             )}
//           </div>
//         )}

//         {/* Requirements */}
//         {requirements.length > 0 && (
//           <div>
//             <h2 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2">
//               <div className="w-1.5 h-4 bg-gradient-to-b from-indigo-600 to-indigo-400 rounded-full"></div>
//               Requirements
//             </h2>
//             <ul className="space-y-2">
//               {(showAllRequirements ? requirements : requirements.slice(0, 3)).map((req, idx) => (
//                 <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-600">
//                   <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
//                     <CheckCircle2 className="w-3 h-3 text-indigo-600" />
//                   </div>
//                   <span className="flex-1 leading-relaxed">{req}</span>
//                 </li>
//               ))}
//             </ul>
//             {requirements.length > 3 && (
//               <button
//                 onClick={() => setShowAllRequirements(!showAllRequirements)}
//                 className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 pl-7 mt-2 flex items-center gap-1 transition-colors"
//               >
//                 {showAllRequirements ? (
//                   <>
//                     Show less
//                     <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
//                       <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
//                     </svg>
//                   </>
//                 ) : (
//                   <>
//                     View {requirements.length - 3} more requirement{requirements.length - 3 !== 1 ? 's' : ''} →
//                   </>
//                 )}
//               </button>
//             )}
//           </div>
//         )}

//         {/* Responsibilities */}
//         {responsibilities.length > 0 && (
//           <div>
//             <h2 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2">
//               <div className="w-1.5 h-4 bg-gradient-to-b from-indigo-600 to-indigo-400 rounded-full"></div>
//               Key Responsibilities
//             </h2>
//             <ul className="space-y-2">
//               {(showAllResponsibilities ? responsibilities : responsibilities.slice(0, 3)).map((resp, idx) => (
//                 <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-600">
//                   <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
//                     <TrendingUp className="w-3 h-3 text-blue-600" />
//                   </div>
//                   <span className="flex-1 leading-relaxed">{resp}</span>
//                 </li>
//               ))}
//             </ul>
//             {responsibilities.length > 3 && (
//               <button
//                 onClick={() => setShowAllResponsibilities(!showAllResponsibilities)}
//                 className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 pl-7 mt-2 flex items-center gap-1 transition-colors"
//               >
//                 {showAllResponsibilities ? (
//                   <>
//                     Show less
//                     <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
//                       <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
//                     </svg>
//                   </>
//                 ) : (
//                   <>
//                     View {responsibilities.length - 3} more responsibilit{responsibilities.length - 3 !== 1 ? 'ies' : 'y'} →
//                   </>
//                 )}
//               </button>
//             )}
//           </div>
//         )}

//         {/* Benefits */}
//         {benefits.length > 0 && (
//           <div>
//             <h2 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2">
//               <div className="w-1.5 h-4 bg-gradient-to-b from-indigo-600 to-indigo-400 rounded-full"></div>
//               Benefits & Perks
//               <span className="text-xs font-normal text-gray-500">({benefits.length})</span>
//             </h2>
//             <div className="grid grid-cols-1 gap-2">
//               {benefits.map((benefit, idx) => (
//                 <div key={idx} className="flex items-start gap-2.5 p-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-100">
//                   <Star className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" fill="currentColor" />
//                   <span className="text-sm text-gray-700 font-medium">{benefit}</span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Modern Action Footer */}
//       <div className="p-5 bg-gradient-to-t from-gray-50 to-white border-t border-gray-100">
//         <div className="flex gap-2.5">
//           {/* Primary Apply Button */}
//           <button
//             onClick={() => !isApplied && !isApplying && onApply(opportunity)}
//             disabled={isApplied || isApplying}
//             className={`flex-1 relative overflow-hidden font-bold py-3.5 px-4 rounded-xl transition-all text-sm shadow-sm group ${
//               isApplied
//                 ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white cursor-not-allowed'
//                 : isApplying
//                 ? 'bg-gray-400 text-white cursor-wait'
//                 : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white hover:shadow-xl active:scale-[0.98]'
//             }`}
//           >
//             {/* Shine Effect */}
//             {!isApplied && !isApplying && (
//               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 group-hover:translate-x-full transition-all duration-500 -translate-x-full"></div>
//             )}

//             <span className="relative z-10 flex items-center justify-center gap-2">
//               {isApplied ? (
//                 <>
//                   <CheckCircle2 className="w-4 h-4" />
//                   Application Submitted
//                 </>
//               ) : isApplying ? (
//                 <>
//                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
//                   Submitting...
//                 </>
//               ) : (
//                 <>
//                   Apply Now
//                   <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
//                     <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
//                   </svg>
//                 </>
//               )}
//             </span>
//           </button>

//           {/* External Link Button */}
//           {opportunity.application_link && (
//             <button
//               onClick={() => window.open(opportunity.application_link, '_blank')}
//               className="w-12 h-12 border-2 border-gray-300 hover:border-indigo-600 hover:bg-indigo-50 rounded-xl transition-all flex items-center justify-center group"
//               title="Open external link"
//             >
//               <ExternalLink className="w-5 h-5 text-gray-600 group-hover:text-indigo-600 transition-colors" />
//             </button>
//           )}

//           {/* Save Button - Show on mobile when close button is present */}
//           {onToggleSave && onClose && (
//             <button
//               onClick={() => onToggleSave(opportunity)}
//               className="lg:hidden w-12 h-12 border-2 border-gray-300 hover:border-rose-400 hover:bg-rose-50 rounded-xl transition-all flex items-center justify-center group"
//               title={isSaved ? 'Unsave job' : 'Save job'}
//             >
//               <Bookmark
//                 className={`w-5 h-5 transition-all ${
//                   isSaved ? 'fill-rose-500 text-rose-500' : 'text-gray-600 group-hover:text-rose-500'
//                 }`}
//               />
//             </button>
//           )}
//         </div>

//         {/* Additional Info */}
//         <p className="text-xs text-gray-500 text-center mt-3">
//           {isApplied ? 'Track your application in the Applications tab' : 'One-click application with your saved profile'}
//         </p>
//       </div>
//     </div>
//   );
// };

// export default OpportunityPreview;

import React from 'react';
import ReactDOM from 'react-dom';
import {
  MapPin,
  Briefcase,
  X,
  ExternalLink,
  Star,
  Bookmark,
  Clock,
  Users,
  TrendingUp,
  Award,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Send,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

// Application Confirmation Modal Component
const ApplicationConfirmationModal = ({ opportunity, isOpen, onClose, onConfirm, isApplying }) => {
  const [applicationStatus, setApplicationStatus] = React.useState('confirm'); // 'confirm', 'applying', 'success'

  // Reset status when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setApplicationStatus('confirm');
    }
  }, [isOpen]);

  // Handle application status changes
  React.useEffect(() => {
    if (isApplying) {
      setApplicationStatus('applying');
    }
  }, [isApplying]);

  if (!isOpen || !opportunity) return null;

  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getDisplayName = () => {
    return opportunity.company_name || opportunity.job_title || opportunity.title || 'Unknown';
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100000]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-blue-600 p-6 rounded-t-2xl text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-opacity-30 transition-all"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white shadow-lg flex items-center justify-center overflow-hidden">
            {opportunity.company_logo ? (
              <img
                src={opportunity.company_logo}
                alt={getDisplayName()}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-blue-600">
                {getInitials(getDisplayName())}
              </span>
            )}
          </div>

          <h2 className="text-xl font-bold text-white mb-2">Confirm Application</h2>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Job Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-gray-900 text-lg mb-1">
              {opportunity.job_title || opportunity.title}
            </h3>
            {opportunity.company_name && (
              <p className="text-blue-600 font-medium mb-2">{opportunity.company_name}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {opportunity.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{opportunity.location}</span>
                </div>
              )}
              {opportunity.employment_type && (
                <div className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  <span>{opportunity.employment_type}</span>
                </div>
              )}
            </div>
          </div>

          {/* Application Info */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h5 className="font-semibold text-gray-900 mb-1">Ready to Apply</h5>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Your application will be submitted using your saved profile information. Make sure
                  your profile is up to date for the best results.
                </p>
              </div>
            </div>
          </div>

          {/* External Link Warning */}
          {opportunity.application_link && (
            <div className="bg-yellow-50 rounded-lg p-4 mb-6 border border-yellow-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-600 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">External Application</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    This will also open an external application page. We'll save your application to
                    your profile for tracking.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                setApplicationStatus('applying');
                await onConfirm();
                setApplicationStatus('success');
                // Auto-close after 2 seconds
                setTimeout(() => {
                  onClose();
                }, 2000);
              }}
              disabled={
                isApplying || applicationStatus === 'applying' || applicationStatus === 'success'
              }
              className={`flex-1 px-4 py-3 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
                applicationStatus === 'success'
                  ? 'bg-green-600 text-white cursor-default'
                  : applicationStatus === 'applying'
                    ? 'bg-gray-400 text-white cursor-wait'
                    : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg'
              }`}
            >
              {applicationStatus === 'success' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Application Submitted!
                </>
              ) : applicationStatus === 'applying' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Applying...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Confirm & Apply
                </>
              )}
            </button>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-gray-500 text-center mt-4">
            {applicationStatus === 'success'
              ? '✅ Application submitted successfully! Check Applications tab to track progress.'
              : '💡 You can track your application status in the Applications tab'}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

const OpportunityPreview = ({
  opportunity,
  onClose,
  onApply,
  onToggleSave,
  isApplied = false,
  isSaved = false,
  isApplying = false,
}) => {
  // State for expanding sections
  const [showAllRequirements, setShowAllRequirements] = React.useState(false);
  const [showAllResponsibilities, setShowAllResponsibilities] = React.useState(false);
  const [showAllSkills, setShowAllSkills] = React.useState(false);
  const [showDetailsModal, setShowDetailsModal] = React.useState(false);
  const [showApplicationModal, setShowApplicationModal] = React.useState(false);

  // Reset expand states when opportunity changes
  React.useEffect(() => {
    setShowAllRequirements(false);
    setShowAllResponsibilities(false);
    setShowAllSkills(false);
    setShowDetailsModal(false);
    setShowApplicationModal(false);
  }, [opportunity?.id]);

  if (!opportunity) {
    return (
      <div className="bg-white rounded-3xl shadow-sm h-full flex items-center justify-center p-8 border border-gray-100">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl flex items-center justify-center">
            <Briefcase className="w-12 h-12 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">Select a Position</h2>
          <p className="text-gray-500 max-w-xs mx-auto">
            Choose a job from the list to view detailed information and apply
          </p>
        </div>
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getDisplayName = () => {
    return opportunity.company_name || opportunity.job_title || opportunity.title || 'Unknown';
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Competitive';
    if (min && max) return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
    if (min) return `₹${min.toLocaleString()}+`;
    return `Up to ₹${max.toLocaleString()}`;
  };

  const parseJsonField = (field) => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    try {
      return JSON.parse(field);
    } catch {
      return [];
    }
  };

  const requirements = parseJsonField(opportunity.requirements);
  const responsibilities = parseJsonField(opportunity.responsibilities);
  const benefits = parseJsonField(opportunity.benefits);
  const skills = parseJsonField(opportunity.skills_required);

  // Calculate days since posted
  const postedDate = new Date(opportunity.posted_date || opportunity.created_at);
  const daysAgo = Math.floor((new Date() - postedDate) / (1000 * 60 * 60 * 24));
  const postedText = daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`;

  // Check if description is long (more than 300 characters)
  const isDescriptionLong = opportunity.description && opportunity.description.length > 300;
  const truncatedDescription = isDescriptionLong
    ? opportunity.description.slice(0, 300) + '...'
    : opportunity.description;

  // Determine if this is a learning internship (has extra fields)
  const isLearningInternship =
    opportunity.employment_type === 'Internship' &&
    (opportunity.what_youll_learn || opportunity.sector || opportunity.exposure_type);

  // Determine if this is a regular job/internship
  const isRegularOpportunity =
    opportunity.employment_type === 'FullTime' ||
    (opportunity.employment_type === 'Internship' && !isLearningInternship);

  return (
    <div className="bg-white rounded-3xl shadow-md h-full flex flex-col overflow-hidden border border-gray-100">
      {/* Modern Header with Gradient Accent */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 p-6">
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
        </div>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-opacity-30 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Company Logo & Basic Info */}
        <div className="relative z-10 flex items-start gap-4">
          {/* Logo */}
          <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
            {opportunity.company_logo ? (
              <img
                src={opportunity.company_logo}
                alt={getDisplayName()}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-blue-600">
                {getInitials(getDisplayName())}
              </span>
            )}
          </div>

          {/* Title & Company */}
          <div className="flex-1 min-w-0 pr-10 lg:pr-0">
            <h1 className="text-xl font-bold text-white mb-1 line-clamp-2 leading-tight">
              {opportunity.job_title || opportunity.title}
            </h1>
            {opportunity.company_name && (
              <p className="text-blue-100 text-sm font-medium mb-2">{opportunity.company_name}</p>
            )}

            {/* Quick Meta */}
            <div className="flex items-center gap-3 text-xs text-blue-200">
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span className="line-clamp-1">{opportunity.location || 'Remote'}</span>
              </div>
              <div className="flex items-center gap-1 text-nowrap">
                <Clock className="w-3.5 h-3.5" />
                <span>{postedText}</span>
              </div>
            </div>
          </div>

          {/* Save Button - Hidden on mobile when close button is present, shown on desktop */}
          {onToggleSave && (
            <button
              onClick={() => onToggleSave(opportunity)}
              className={`w-9 h-9 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center hover:bg-opacity-30 transition-all flex-shrink-0 ${
                onClose ? 'hidden lg:flex' : 'flex'
              }`}
              title={isSaved ? 'Unsave job' : 'Save job'}
            >
              <Bookmark
                className={`w-4 h-4 transition-all ${
                  isSaved ? 'fill-white text-white' : 'text-white'
                }`}
              />
            </button>
          )}
        </div>

        {/* Salary & Type Tags */}
        <div className="relative z-10 flex items-center gap-2 mt-4">
          <div className="flex items-center gap-1.5 bg-white bg-opacity-20 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <span className="text-sm font-semibold text-white">
              {formatSalary(opportunity.salary_range_min, opportunity.salary_range_max)}
            </span>
          </div>
          {opportunity.employment_type && (
            <div className="px-3 py-1.5 bg-white bg-opacity-20 backdrop-blur-sm rounded-full text-nowrap">
              <span className="text-xs font-semibold text-white">
                {opportunity.employment_type}
              </span>
            </div>
          )}
          {opportunity.mode && (
            <div className="px-3 py-1.5 bg-white bg-opacity-20 backdrop-blur-sm rounded-full">
              <span className="text-xs font-semibold text-white capitalize">
                {opportunity.mode}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 max-h-[calc(100vh-350px)]">
        {/* About the Role - Always show for all types */}
        {opportunity.description && (
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
              About the Role
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">{truncatedDescription}</p>
          </div>
        )}

        {/* What You'll Learn - Only for Learning Internships */}
        {isLearningInternship && opportunity.what_youll_learn && (
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
              What You'll Learn
            </h2>
            <ul className="space-y-2">
              {opportunity.what_youll_learn
                .split(/[;,]/)
                .filter((item) => item.trim())
                .map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0 mt-2"></div>
                    <span className="flex-1 leading-relaxed">{item.trim()}</span>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* Sector & Exposure Type - Show in preview for Learning Internships */}
        {isLearningInternship && (opportunity.sector || opportunity.exposure_type) && (
          <div className="grid grid-cols-2 gap-4">
            {opportunity.sector && (
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
                  <Briefcase className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 uppercase tracking-wide">Sector</p>
                  <p className="text-xs text-gray-600 mb-1">{opportunity.sector}</p>
                </div>
              </div>
            )}

            {opportunity.exposure_type && (
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                  {/* <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Exposure</p>
                  <p className="text-sm font-bold text-gray-900">{opportunity.exposure_type}</p> */}
                  <p className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                    Exposure
                  </p>
                  <p className="text-xs text-gray-600 mb-1">{opportunity.exposure_type}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* What You'll Do - Show in preview for Learning Internships */}
        {isLearningInternship && opportunity.what_youll_do && (
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
              What You'll Do
            </h2>
            <ul className="space-y-2">
              {opportunity.what_youll_do
                .split(/[;,]/)
                .filter((item) => item.trim())
                .map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0 mt-2"></div>
                    <span className="flex-1 leading-relaxed">{item.trim()}</span>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {/* View More Button - Show for all opportunity types with additional details */}
        {(isLearningInternship ||
          isRegularOpportunity ||
          skills.length > 0 ||
          requirements.length > 0 ||
          responsibilities.length > 0 ||
          benefits.length > 0) && (
          <div className="flex justify-center">
            <button
              onClick={() => setShowDetailsModal(true)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 group"
            >
              View More Details
              <svg
                className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Simple Footer - No Apply Button */}
      <div className="p-5 bg-gradient-to-t from-gray-50 to-white border-t border-gray-100">
        <p className="text-sm text-gray-600 text-center">
          Click "View More Details" to see complete information and apply
        </p>
      </div>

      {/* Details Modal - Rendered via Portal */}
      {showDetailsModal &&
        ReactDOM.createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto"
            style={{ zIndex: 99999, paddingTop: '2rem', paddingBottom: '2rem' }}
            onClick={() => setShowDetailsModal(false)}
          >
            <div
              className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-3xl w-full my-auto flex flex-col"
              style={{ maxHeight: 'calc(100vh - 4rem)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              {/* <div className="bg-blue-600 p-4 sm:p-6 flex items-center justify-between flex-shrink-0 sticky top-0 z-10">
              <h2 className="text-lg sm:text-xl font-bold text-white">Complete Details:</h2>
              <h1 className="text-xl font-bold text-white mb-1 line-clamp-2 leading-tight">
              {opportunity.job_title || opportunity.title}
            </h1>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-9 h-9 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-opacity-30 transition-all flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div> */}
              <div className="bg-blue-600 p-4 sm:p-6 flex items-center justify-between flex-shrink-0 sticky top-0 z-10">
                <div className="flex-1 min-w-0 pr-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                    Complete Details
                  </h2>
                  <h1 className="text-xl font-bold text-white line-clamp-2 leading-tight">
                    {opportunity.job_title || opportunity.title}
                  </h1>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-9 h-9 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-opacity-30 transition-all flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content - Dynamic Layout */}
              <div
                className="p-4 sm:p-6 overflow-y-auto flex-1"
                style={{ maxHeight: 'calc(100vh - 10rem)' }}
              >
                {(() => {
                  // Determine which fields exist for left column
                  const hasLeftColumn =
                    opportunity.sector ||
                    opportunity.exposure_type ||
                    opportunity.duration_weeks ||
                    opportunity.duration_days ||
                    opportunity.total_hours ||
                    opportunity.what_youll_do ||
                    opportunity.final_artifact_type ||
                    opportunity.final_artifact_description ||
                    opportunity.mentor_bio ||
                    (opportunity.cost_inr !== null && opportunity.cost_inr !== undefined) ||
                    opportunity.cost_note;

                  // Determine which fields exist for right column
                  const hasRightColumn =
                    opportunity.prerequiste ||
                    opportunity.safety_note ||
                    opportunity.parent_role ||
                    skills.length > 0 ||
                    requirements.length > 0 ||
                    responsibilities.length > 0 ||
                    benefits.length > 0;

                  // Use single column if only one side has data, otherwise use two columns
                  const gridClass =
                    hasLeftColumn && hasRightColumn
                      ? 'grid grid-cols-1 lg:grid-cols-2 gap-5'
                      : 'max-w-3xl mx-auto space-y-5';

                  return (
                    <div className={gridClass}>
                      {/* LEFT COLUMN - Only render if has content */}
                      {hasLeftColumn && (
                        <div className="space-y-5">
                          {/* Sector & Exposure Type */}
                          {(opportunity.sector || opportunity.exposure_type) && (
                            <div className="space-y-3">
                              {opportunity.sector && (
                                <div className="flex items-center gap-2.5">
                                  {/* <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
                            <Briefcase className="w-4 h-4 text-white" />
                          </div> */}
                                  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                                    <Briefcase className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                                      Sector
                                    </p>
                                    <p className="text-xs text-gray-600 mb-1">
                                      {opportunity.sector}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {opportunity.exposure_type && (
                                <div className="flex items-center gap-2.5">
                                  {/* <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
                            <TrendingUp className="w-4 h-4 text-white" />
                          </div> */}
                                  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                                    <TrendingUp className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                                      Exposure
                                    </p>
                                    <p className="text-xs text-gray-600 mb-1">
                                      {opportunity.exposure_type}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Duration & Schedule */}
                          {(opportunity.duration_weeks ||
                            opportunity.duration_days ||
                            opportunity.total_hours) && (
                            <div>
                              <h3 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                                  <Clock className="w-4 h-4 text-white" />
                                </div>
                                Duration & Schedule
                              </h3>
                              <div className="grid grid-cols-3 gap-2">
                                {opportunity.duration_weeks && (
                                  <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                                    <p className="text-xs text-gray-600 mb-1">Duration</p>
                                    <p className="text-sm font-bold text-gray-900">
                                      {opportunity.duration_weeks} weeks
                                    </p>
                                  </div>
                                )}
                                {opportunity.duration_days && (
                                  <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                                    <p className="text-xs text-gray-600 mb-1">Days</p>
                                    <p className="text-sm font-bold text-gray-900">
                                      {opportunity.duration_days} days
                                    </p>
                                  </div>
                                )}
                                {opportunity.total_hours && (
                                  <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                                    <p className="text-xs text-gray-600 mb-1">Total Hours</p>
                                    <p className="text-sm font-bold text-gray-900">
                                      {opportunity.total_hours} hours
                                    </p>
                                  </div>
                                )}
                              </div>
                              {opportunity.schedule_note && (
                                <p className="text-sm text-gray-600 mt-2 italic">
                                  📅 {opportunity.schedule_note}
                                </p>
                              )}
                            </div>
                          )}

                          {/* What You'll Do */}
                          {opportunity.what_youll_do && (
                            <div>
                              <h3 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                                  <Users className="w-4 h-4 text-white" />
                                </div>
                                What You'll Do
                              </h3>
                              <ul className="space-y-2">
                                {opportunity.what_youll_do
                                  .split(/[;,]/)
                                  .filter((item) => item.trim())
                                  .map((item, idx) => (
                                    <li
                                      key={idx}
                                      className="flex items-start gap-2.5 text-sm text-gray-600"
                                    >
                                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                      </div>
                                      <span className="flex-1 leading-relaxed">{item.trim()}</span>
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          )}

                          {/* Final Artifact */}
                          {(opportunity.final_artifact_type ||
                            opportunity.final_artifact_description) && (
                            <div>
                              <h3 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                                  <Award className="w-4 h-4 text-white" />
                                </div>
                                Final Deliverable
                              </h3>
                              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                {opportunity.final_artifact_type && (
                                  <p className="text-sm font-bold text-gray-900 mb-1">
                                    {opportunity.final_artifact_type}
                                  </p>
                                )}
                                {opportunity.final_artifact_description && (
                                  <p className="text-sm text-gray-600">
                                    {opportunity.final_artifact_description}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Mentor Information */}
                          {opportunity.mentor_bio && (
                            <div>
                              <h3 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                                  <Users className="w-4 h-4 text-white" />
                                </div>
                                Your Mentor
                              </h3>
                              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {opportunity.mentor_bio}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Cost Information */}
                          {(opportunity.cost_inr !== null && opportunity.cost_inr !== undefined) ||
                            (opportunity.cost_note && (
                              <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center">
                                    <Star className="w-4 h-4 text-white" fill="currentColor" />
                                  </div>
                                  Program Cost
                                </h3>
                                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                                  {opportunity.cost_inr !== null &&
                                    opportunity.cost_inr !== undefined && (
                                      <p className="text-lg font-bold text-gray-900 mb-1">
                                        {opportunity.cost_inr === 0
                                          ? '🎉 Free'
                                          : `₹${opportunity.cost_inr.toLocaleString()}`}
                                      </p>
                                    )}
                                  {opportunity.cost_note && (
                                    <p className="text-sm text-gray-600">{opportunity.cost_note}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}

                      {/* RIGHT COLUMN - Only render if has content */}
                      {hasRightColumn && (
                        <div className="space-y-5">
                          {/* Prerequisites */}
                          {opportunity.prerequiste && (
                            <div>
                              <h3 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                                  <CheckCircle2 className="w-4 h-4 text-white" />
                                </div>
                                Prerequisites
                              </h3>
                              <p className="text-sm text-gray-600 leading-relaxed">
                                {opportunity.prerequiste}
                              </p>
                            </div>
                          )}

                          {/* Safety & Parent Role */}
                          {(opportunity.safety_note || opportunity.parent_role) && (
                            <div>
                              <h3 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                                  <Star className="w-4 h-4 text-white" fill="currentColor" />
                                </div>
                                Important Information
                              </h3>
                              <div className="space-y-2">
                                {opportunity.safety_note && (
                                  <div className="p-3 bg-blue-50 rounded-lg border border-yellow-100">
                                    <p className="text-xs font-semibold text-gray-800 mb-1">
                                      Safety Note
                                    </p>
                                    <p className="text-sm text-gray-700">
                                      {opportunity.safety_note}
                                    </p>
                                  </div>
                                )}
                                {opportunity.parent_role && (
                                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <p className="text-xs font-semibold text-gray-800 mb-1">
                                      Parent/Guardian Role
                                    </p>
                                    <p className="text-sm text-gray-700">
                                      {opportunity.parent_role}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Skills Required */}
                          {skills.length > 0 && (
                            <div>
                              <h3 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                                  <Star className="w-4 h-4 text-white" fill="currentColor" />
                                </div>
                                Required Skills
                                <span className="text-xs font-normal text-gray-500">
                                  ({skills.length})
                                </span>
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {skills.map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Requirements */}
                          {requirements.length > 0 && (
                            <div>
                              <h3 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                                  <CheckCircle2 className="w-4 h-4 text-white" />
                                </div>
                                Requirements
                              </h3>
                              <ul className="space-y-2">
                                {requirements.map((req, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-2.5 text-sm text-gray-600"
                                  >
                                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                      <CheckCircle2 className="w-3 h-3 text-blue-600" />
                                    </div>
                                    <span className="flex-1 leading-relaxed">{req}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Responsibilities */}
                          {responsibilities.length > 0 && (
                            <div>
                              <h3 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                                  <TrendingUp className="w-4 h-4 text-white" />
                                </div>
                                Key Responsibilities
                              </h3>
                              <ul className="space-y-2">
                                {responsibilities.map((resp, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-2.5 text-sm text-gray-600"
                                  >
                                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                      <TrendingUp className="w-3 h-3 text-blue-600" />
                                    </div>
                                    <span className="flex-1 leading-relaxed">{resp}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Benefits */}
                          {benefits.length > 0 && (
                            <div>
                              <h3 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center">
                                  <Star className="w-4 h-4 text-white" fill="currentColor" />
                                </div>
                                Benefits & Perks
                                <span className="text-xs font-normal text-gray-500">
                                  ({benefits.length})
                                </span>
                              </h3>
                              <div className="grid grid-cols-1 gap-2">
                                {benefits.map((benefit, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-start gap-2.5 p-2.5 bg-green-50 rounded-lg border border-green-100"
                                  >
                                    <Star
                                      className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5"
                                      fill="currentColor"
                                    />
                                    <span className="text-sm text-gray-700 font-medium">
                                      {benefit}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Deadline - Full Width at Bottom */}
                      {(opportunity.deadline || opportunity.closing_date) && (
                        <div
                          className={
                            hasLeftColumn && hasRightColumn ? 'col-span-1 lg:col-span-2' : ''
                          }
                        >
                          <div className="flex items-center gap-2.5 p-4 bg-red-50 rounded-lg border border-red-100">
                            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shadow-md">
                              <Calendar className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Application Deadline
                              </p>
                              <p className="text-sm font-bold text-gray-900">
                                {new Date(
                                  opportunity.deadline || opportunity.closing_date
                                ).toLocaleDateString('en-US', {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Modal Footer with Apply Button */}
              <div className="p-4 sm:p-6 bg-gradient-to-t from-gray-50 to-white border-t border-gray-200 flex-shrink-0">
                <div className="flex gap-3">
                  {/* Primary Apply Button */}
                  <button
                    onClick={() => {
                      if (!isApplied && !isApplying) {
                        setShowApplicationModal(true);
                      }
                    }}
                    disabled={isApplied || isApplying}
                    className={`flex-1 relative overflow-hidden font-bold py-3.5 px-4 rounded-xl transition-all text-sm shadow-md group ${
                      isApplied
                        ? 'bg-green-600 text-white cursor-not-allowed'
                        : isApplying
                          ? 'bg-gray-400 text-white cursor-wait'
                          : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-xl active:scale-[0.98]'
                    }`}
                  >
                    {/* Shine Effect */}
                    {!isApplied && !isApplying && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 group-hover:translate-x-full transition-all duration-500 -translate-x-full"></div>
                    )}

                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isApplied ? (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Application Submitted
                        </>
                      ) : isApplying ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Apply Now
                        </>
                      )}
                    </span>
                  </button>

                  {/* External Link Button */}
                  {opportunity.application_link && (
                    <button
                      onClick={() => window.open(opportunity.application_link, '_blank')}
                      className="w-12 h-12 border-2 border-gray-300 hover:border-blue-600 hover:bg-blue-50 rounded-xl transition-all flex items-center justify-center group"
                      title="Open external link"
                    >
                      <ExternalLink className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                    </button>
                  )}

                  {/* Save Button */}
                  {onToggleSave && (
                    <button
                      onClick={() => onToggleSave(opportunity)}
                      className="w-12 h-12 border-2 border-gray-300 hover:border-red-400 hover:bg-red-50 rounded-xl transition-all flex items-center justify-center group"
                      title={isSaved ? 'Unsave job' : 'Save job'}
                    >
                      <Bookmark
                        className={`w-5 h-5 transition-all ${
                          isSaved
                            ? 'fill-red-500 text-red-500'
                            : 'text-gray-600 group-hover:text-red-500'
                        }`}
                      />
                    </button>
                  )}
                </div>

                {/* Additional Info */}
                <p className="text-xs text-gray-500 text-center mt-3">
                  {isApplied
                    ? '✓ Track your application in the Applications tab'
                    : '💡 One-click application with your saved profile'}
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Application Confirmation Modal */}
      <ApplicationConfirmationModal
        opportunity={opportunity}
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
        onConfirm={() => {
          if (onApply) {
            onApply(opportunity);
            setShowDetailsModal(false);
          }
        }}
        isApplying={isApplying}
      />
    </div>
  );
};

export default OpportunityPreview;
