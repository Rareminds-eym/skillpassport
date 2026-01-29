import React from "react";
import { Briefcase, Plus, Edit, Calendar, Building2, Clock, CheckCircle } from "lucide-react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";

const ExperienceTab = ({ 
  experienceData, 
  setShowExperienceModal 
}) => {

  const calculateDuration = (startDate, endDate) => {
    if (!startDate) return "";
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffMonths / 12);
    
    if (diffYears > 0) {
      const remainingMonths = diffMonths % 12;
      return `${diffYears} year${diffYears > 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''}`;
    } else if (diffMonths > 0) {
      return `${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
    } else {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  const isCurrentRole = (endDate) => !endDate || endDate === "";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-blue-600" />
          My Experience
        </h3>
        <Button
          onClick={() => setShowExperienceModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Experience
        </Button>
      </div>

      {experienceData?.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 text-base font-medium">
            No work experience added yet
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Add your professional experience, internships, and part-time jobs
          </p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
          {(experienceData || [])
            .sort((a, b) => {
              // Sort by start date, most recent first
              const dateA = new Date(a.start_date || a.startDate || 0);
              const dateB = new Date(b.start_date || b.startDate || 0);
              return dateB - dateA;
            })
            .map((experience, idx) => (
              <div
                key={experience.id || `exp-${idx}`}
                className="p-5 rounded-xl bg-white border-l-4 border-l-blue-500 border border-gray-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-base font-bold text-gray-900">
                        {experience.role || experience.position || experience.title || experience.jobTitle || "Position"}
                      </h4>
                      <div className="flex items-center gap-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        <CheckCircle className="w-3 h-3" />
                        <span>Verified</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowExperienceModal(true)}
                        className="p-1 h-6 w-6 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      {isCurrentRole(experience.end_date || experience.endDate) && (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-2 py-1 text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <p className="text-sm text-blue-600 font-medium">
                        {experience.organization || experience.company || experience.employer || experience.workplace || "Company"}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {formatDate(experience.start_date || experience.startDate)}
                          {" - "}
                          {isCurrentRole(experience.end_date || experience.endDate) 
                            ? "Present" 
                            : formatDate(experience.end_date || experience.endDate)
                          }
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">
                          {calculateDuration(
                            experience.start_date || experience.startDate, 
                            experience.end_date || experience.endDate
                          )}
                        </span>
                      </div>
                    </div>

                    {experience.description && (
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {experience.description}
                      </p>
                    )}

                    {experience.skills && experience.skills.length > 0 && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-1">
                          {experience.skills.slice(0, 5).map((skill, skillIdx) => (
                            <Badge 
                              key={skillIdx}
                              variant="secondary" 
                              className="text-xs px-2 py-1"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {experience.skills.length > 5 && (
                            <Badge variant="secondary" className="text-xs px-2 py-1">
                              +{experience.skills.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default ExperienceTab;