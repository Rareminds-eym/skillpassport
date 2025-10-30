import React from 'react';
import { MapPin, Briefcase, X, ExternalLink, Star, Bookmark } from 'lucide-react';
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
  if (!opportunity) {
    return (
      <div className="bg-blue-600 rounded-2xl shadow-lg h-full flex items-center justify-center p-8">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Job Preview</h2>
          <p className="text-blue-100">Select a job to view details</p>
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
    if (!min && !max) return 'Salary not specified';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `$${min.toLocaleString()}+`;
    return `Up to $${max.toLocaleString()}`;
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

  return (
    <div className="bg-blue-600 rounded-2xl shadow-lg h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-8 pb-6">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-white text-2xl font-bold mb-4">Job Preview</h2>
          
          {/* Company Logo */}
          <div 
            className="w-24 h-24 rounded-3xl flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-6 bg-white bg-opacity-20 backdrop-blur-sm"
          >
            {opportunity.company_logo ? (
              <img 
                src={opportunity.company_logo} 
                alt={opportunity.company_name}
                className="w-full h-full object-cover rounded-3xl"
              />
            ) : (
              <div className="w-16 h-16 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                <span className="text-lg">{getInitials(opportunity.company_name)}</span>
              </div>
            )}
          </div>

          {/* Title and Company */}
          <h3 className="text-white text-2xl font-bold mb-2">
            {opportunity.job_title || opportunity.title}
          </h3>
          <p className="text-blue-100 text-lg mb-8">{opportunity.company_name}</p>

          {/* Close button for mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden absolute top-4 right-4 text-white hover:text-blue-100"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto bg-white rounded-t-3xl p-8 space-y-6">
        {/* Meta Information */}
        <div className="flex items-center gap-6 text-gray-600 pb-6 border-b border-gray-100">
          {opportunity.location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              <span className="font-medium">{opportunity.location}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-green-600" />
            <span className="font-medium">{formatSalary(opportunity.salary_range_min, opportunity.salary_range_max)}</span>
          </div>
        </div>

        {/* Description */}
        {opportunity.description && (
          <div>
            <p className="text-gray-600 leading-relaxed">
              {opportunity.description}
            </p>
          </div>
        )}

        {/* Requirements */}
        {requirements.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Requirements</h3>
            <ul className="space-y-2">
              {requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-3 text-gray-600">
                  <Star className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" fill="currentColor" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Responsibilities */}
        {responsibilities.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Responsibilities</h3>
            <ul className="space-y-2">
              {responsibilities.map((resp, idx) => (
                <li key={idx} className="flex items-start gap-3 text-gray-600">
                  <Star className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" fill="currentColor" />
                  <span>{resp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Skills Required */}
        {skills.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Skills Required</h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, idx) => (
                <Badge 
                  key={idx}
                  variant="outline"
                  className="border-gray-300 text-gray-700 px-3 py-1"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Benefits */}
        {benefits.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Benefits</h3>
            <ul className="space-y-2">
              {benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-3 text-gray-600">
                  <Star className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" fill="currentColor" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Experience Level */}
        {opportunity.experience_level && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Experience Level</h3>
            <p className="text-gray-600">{opportunity.experience_level}</p>
          </div>
        )}

        {/* Work Mode */}
        {opportunity.mode && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Work Mode</h3>
            <p className="text-gray-600 capitalize">{opportunity.mode}</p>
          </div>
        )}
      </div>

      {/* Footer - Apply Button */}
      <div className="bg-white p-6 border-t border-gray-100">
        <div className="flex gap-3">
          <button 
            onClick={() => !isApplied && !isApplying && onApply(opportunity)}
            disabled={isApplied || isApplying}
            className={`flex-1 font-semibold py-4 rounded-xl transition-colors ${
              isApplied
                ? 'bg-green-500 text-white cursor-not-allowed'
                : isApplying
                ? 'bg-gray-400 text-white cursor-wait'
                : 'bg-gray-900 hover:bg-gray-800 text-white'
            }`}
          >
            {isApplied ? '✓ ALREADY APPLIED' : isApplying ? 'APPLYING...' : 'APPLY JOB'}
          </button>
          {opportunity.application_link && (
            <button
              onClick={() => window.open(opportunity.application_link, '_blank')}
              className="px-5 border-2 border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <ExternalLink className="w-5 h-5 text-gray-600" />
            </button>
          )}
          {onToggleSave && (
            <button 
              onClick={() => onToggleSave(opportunity)}
              className="px-5 border-2 border-gray-200 hover:border-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
              title={isSaved ? 'Unsave job' : 'Save job'}
            >
              <Bookmark
                className={`w-5 h-5 transition-all ${
                  isSaved ? 'fill-blue-600 text-blue-600' : 'text-gray-600'
                }`}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OpportunityPreview;
