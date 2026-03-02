import React from 'react';
import { MapPin, Factory, X, Building2, Calendar, Tag, Info } from 'lucide-react';

const IndustrialVisitPreview = ({ 
  visit, 
  onClose,
  onRegister,
  isRegistered = false,
  isRegistering = false
}) => {
  if (!visit) {
    return (
      <div className="bg-white rounded-3xl shadow-sm h-full flex items-center justify-center p-8 border border-gray-100">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl flex items-center justify-center">
            <Factory className="w-12 h-12 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-gray-900">Select a Visit</h2>
          <p className="text-gray-500 max-w-xs mx-auto">
            Choose an industrial visit from the list to view detailed information
          </p>
        </div>
      </div>
    );
  }

  // Calculate days since posted
  const postedDate = new Date(visit.posted_date || visit.created_at);
  const daysAgo = Math.floor((new Date() - postedDate) / (1000 * 60 * 60 * 24));
  const postedText = daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`;

  return (
    <div className="bg-white rounded-3xl shadow-md h-full flex flex-col overflow-hidden border border-gray-100">
      {/* Modern Header with Gradient Accent */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-6">
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
        </div>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-white bg-opacity-20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-opacity-30 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Company Info */}
        <div className="relative z-10 flex items-start gap-4">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center flex-shrink-0">
            <Factory className="w-8 h-8 text-blue-600" />
          </div>

          {/* Title & Location */}
          <div className="flex-1 min-w-0 pr-10 lg:pr-0">
            <h1 className="text-xl font-bold text-white mb-1 line-clamp-2 leading-tight">
              {visit.company_name}
            </h1>
            <p className="text-blue-100 text-sm font-medium mb-2">
              Industrial Visit Opportunity
            </p>
            
            {/* Quick Meta */}
            <div className="flex items-center gap-3 text-xs text-blue-200">
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span className="line-clamp-1">{visit.location}</span>
              </div>
              <div className="flex items-center gap-1 text-nowrap">
                <Calendar className="w-3.5 h-3.5" />
                <span>{postedText}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Industry Tag */}
        <div className="relative z-10 flex items-center gap-2 mt-4">
          <div className="flex items-center gap-1.5 bg-white bg-opacity-20 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <Building2 className="w-4 h-4 text-white" />
            <span className="text-sm font-semibold text-white">
              {visit.sector}
            </span>
          </div>
          <div className="px-3 py-1.5 bg-white bg-opacity-20 backdrop-blur-sm rounded-full">
            <span className="text-xs font-semibold text-white">
              Factory Visit
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 max-h-[calc(100vh-350px)]">
        
        {/* About the Visit */}
        {visit.description && (
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
              About This Visit
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {visit.description}
            </p>
          </div>
        )}

        {/* Key Information */}
        <div className="grid grid-cols-1 gap-4">
          {/* Industry Type */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
              <Tag className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Industry Type</p>
              <p className="text-sm font-bold text-gray-900">{visit.sector}</p>
            </div>
          </div>
          
          {/* Location */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md">
              <MapPin className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</p>
              <p className="text-sm font-bold text-gray-900">{visit.location}</p>
            </div>
          </div>

          {/* Posted Date */}
          {visit.posted_date && (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
                <Calendar className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Posted On</p>
                <p className="text-sm font-bold text-gray-900">
                  {new Date(visit.posted_date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* What to Expect */}
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Info className="w-4 h-4 text-white" />
            </div>
            <div>
              <h5 className="font-semibold text-gray-900 mb-1">What to Expect</h5>
              <p className="text-sm text-gray-600 leading-relaxed">
                This industrial visit will provide hands-on exposure to {visit.sector} operations. 
                You'll get to see real-world manufacturing processes and interact with industry professionals.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Action Footer */}
      <div className="p-5 bg-gradient-to-t from-gray-50 to-white border-t border-gray-100">
        <div className="flex gap-2.5">
          {/* Primary Register Button */}
          {isRegistered ? (
            <button 
              disabled
              className="flex-1 font-bold py-3.5 px-4 rounded-xl text-sm bg-green-100 text-green-700 cursor-not-allowed"
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Registered
              </span>
            </button>
          ) : (
            <button 
              onClick={() => onRegister && onRegister(visit)}
              disabled={isRegistering}
              className="flex-1 relative overflow-hidden font-bold py-3.5 px-4 rounded-xl transition-all text-sm shadow-sm group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 group-hover:translate-x-full transition-all duration-500 -translate-x-full"></div>
              
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isRegistering ? 'Registering...' : 'Register for Visit'}
                {!isRegistering && (
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                )}
              </span>
            </button>
          )}
        </div>
        
        {/* Additional Info */}
        <p className="text-xs text-gray-500 text-center mt-3">
          {isRegistered 
            ? 'You have successfully registered for this visit' 
            : 'Registration will be confirmed by your school coordinator'}
        </p>
      </div>
    </div>
  );
};

export default IndustrialVisitPreview;
