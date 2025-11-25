import React from 'react';
import { MapPin, Briefcase, X, ExternalLink, Star, Bookmark, Clock, Users, TrendingUp, Award, CheckCircle2, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const OpportunityPreview = ({ 
  opportunity, 
  onClose, 
  onApply, 
  onToggleSave,
  isApplied = false, 
  isSaved = false,
  isApplying = false 
}) => {
  // State for expanding sections
  const [showAllRequirements, setShowAllRequirements] = React.useState(false);
  const [showAllResponsibilities, setShowAllResponsibilities] = React.useState(false);
  const [showAllSkills, setShowAllSkills] = React.useState(false);

  // Reset expand states when opportunity changes
  React.useEffect(() => {
    setShowAllRequirements(false);
    setShowAllResponsibilities(false);
    setShowAllSkills(false);
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
    return name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '??';
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

  return (
    <div className="bg-white rounded-3xl shadow-md h-full flex flex-col overflow-hidden border border-gray-100">
      {/* Modern Header with Gradient Accent */}
      <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 p-6">
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

        {/* Company Logo & Basic Info */}
        <div className="relative z-10 flex items-start gap-4">
          {/* Logo */}
          <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
            {opportunity.company_logo ? (
              <img 
                src={opportunity.company_logo} 
                alt={opportunity.company_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-indigo-600">
                {getInitials(opportunity.company_name)}
              </span>
            )}
          </div>

          {/* Title & Company */}
          <div className="flex-1 min-w-0 pr-10 lg:pr-0">
            <h1 className="text-xl font-bold text-white mb-1 line-clamp-2 leading-tight">
              {opportunity.job_title || opportunity.title}
            </h1>
            <p className="text-indigo-100 text-sm font-medium mb-2">
              {opportunity.company_name}
            </p>
            
            {/* Quick Meta */}
            <div className="flex items-center gap-3 text-xs text-indigo-200">
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
        
        {/* About the Role */}
        {opportunity.description && (
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-gradient-to-b from-indigo-600 to-indigo-400 rounded-full"></div>
              About the Role
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              {truncatedDescription}
            </p>
          </div>
        )}

        {/* Key Information - Experience & Deadline */}
        {(opportunity.experience_level || opportunity.deadline) && (
          <div className="grid grid-cols-2 gap-4">
            {/* Experience - Left */}
            {opportunity.experience_level && (
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <Award className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Experience</p>
                  <p className="text-sm font-bold text-gray-900">{opportunity.experience_level}</p>
                </div>
              </div>
            )}
            
            {/* Deadline - Right */}
            {opportunity.deadline && (
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-md">
                  <Calendar className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Deadline</p>
                  <p className="text-sm font-bold text-gray-900">
                    {new Date(opportunity.deadline).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Skills Required - Expand/Collapse Design */}
        {skills.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-gradient-to-b from-indigo-600 to-indigo-400 rounded-full"></div>
              Required Skills
              <span className="text-xs font-normal text-gray-500">({skills.length})</span>
            </h2>
            
            <div className="flex flex-wrap gap-2">
              {(showAllSkills ? skills : skills.slice(0, 8)).map((skill, idx) => (
                <span 
                  key={idx}
                  className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                >
                  {skill}
                </span>
              ))}
            </div>
            
            {skills.length > 8 && (
              <button 
                onClick={() => setShowAllSkills(!showAllSkills)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 mt-2 flex items-center gap-1 transition-colors"
              >
                {showAllSkills ? (
                  <>
                    Show less
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </>
                ) : (
                  <>
                    View {skills.length - 8} more skill{skills.length - 8 !== 1 ? 's' : ''} →
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Requirements */}
        {requirements.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-gradient-to-b from-indigo-600 to-indigo-400 rounded-full"></div>
              Requirements
            </h2>
            <ul className="space-y-2">
              {(showAllRequirements ? requirements : requirements.slice(0, 3)).map((req, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                  </div>
                  <span className="flex-1 leading-relaxed">{req}</span>
                </li>
              ))}
            </ul>
            {requirements.length > 3 && (
              <button 
                onClick={() => setShowAllRequirements(!showAllRequirements)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 pl-7 mt-2 flex items-center gap-1 transition-colors"
              >
                {showAllRequirements ? (
                  <>
                    Show less
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </>
                ) : (
                  <>
                    View {requirements.length - 3} more requirement{requirements.length - 3 !== 1 ? 's' : ''} →
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Responsibilities */}
        {responsibilities.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-gradient-to-b from-indigo-600 to-indigo-400 rounded-full"></div>
              Key Responsibilities
            </h2>
            <ul className="space-y-2">
              {(showAllResponsibilities ? responsibilities : responsibilities.slice(0, 3)).map((resp, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <TrendingUp className="w-3 h-3 text-blue-600" />
                  </div>
                  <span className="flex-1 leading-relaxed">{resp}</span>
                </li>
              ))}
            </ul>
            {responsibilities.length > 3 && (
              <button 
                onClick={() => setShowAllResponsibilities(!showAllResponsibilities)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 pl-7 mt-2 flex items-center gap-1 transition-colors"
              >
                {showAllResponsibilities ? (
                  <>
                    Show less
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </>
                ) : (
                  <>
                    View {responsibilities.length - 3} more responsibilit{responsibilities.length - 3 !== 1 ? 'ies' : 'y'} →
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Benefits */}
        {benefits.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-gradient-to-b from-indigo-600 to-indigo-400 rounded-full"></div>
              Benefits & Perks
              <span className="text-xs font-normal text-gray-500">({benefits.length})</span>
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-100">
                  <Star className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" fill="currentColor" />
                  <span className="text-sm text-gray-700 font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modern Action Footer */}
      <div className="p-5 bg-gradient-to-t from-gray-50 to-white border-t border-gray-100">
        <div className="flex gap-2.5">
          {/* Primary Apply Button */}
          <button 
            onClick={() => !isApplied && !isApplying && onApply(opportunity)}
            disabled={isApplied || isApplying}
            className={`flex-1 relative overflow-hidden font-bold py-3.5 px-4 rounded-xl transition-all text-sm shadow-sm group ${
              isApplied
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white cursor-not-allowed'
                : isApplying
                ? 'bg-gray-400 text-white cursor-wait'
                : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white hover:shadow-xl active:scale-[0.98]'
            }`}
          >
            {/* Shine Effect */}
            {!isApplied && !isApplying && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 group-hover:translate-x-full transition-all duration-500 -translate-x-full"></div>
            )}
            
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isApplied ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Application Submitted
                </>
              ) : isApplying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  Apply Now
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </span>
          </button>

          {/* External Link Button */}
          {opportunity.application_link && (
            <button
              onClick={() => window.open(opportunity.application_link, '_blank')}
              className="w-12 h-12 border-2 border-gray-300 hover:border-indigo-600 hover:bg-indigo-50 rounded-xl transition-all flex items-center justify-center group"
              title="Open external link"
            >
              <ExternalLink className="w-5 h-5 text-gray-600 group-hover:text-indigo-600 transition-colors" />
            </button>
          )}

          {/* Save Button - Show on mobile when close button is present */}
          {onToggleSave && onClose && (
            <button 
              onClick={() => onToggleSave(opportunity)}
              className="lg:hidden w-12 h-12 border-2 border-gray-300 hover:border-rose-400 hover:bg-rose-50 rounded-xl transition-all flex items-center justify-center group"
              title={isSaved ? 'Unsave job' : 'Save job'}
            >
              <Bookmark
                className={`w-5 h-5 transition-all ${
                  isSaved ? 'fill-rose-500 text-rose-500' : 'text-gray-600 group-hover:text-rose-500'
                }`}
              />
            </button>
          )}
        </div>
        
        {/* Additional Info */}
        <p className="text-xs text-gray-500 text-center mt-3">
          {isApplied ? 'Track your application in the Applications tab' : 'One-click application with your saved profile'}
        </p>
      </div>
    </div>
  );
};

export default OpportunityPreview;