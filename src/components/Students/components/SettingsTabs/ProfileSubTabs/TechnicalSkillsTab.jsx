import React from "react";
import { Code, Plus, Edit, Star, Zap, Eye, EyeOff, CheckCircle, Clock } from "lucide-react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";

const TechnicalSkillsTab = ({ 
  technicalSkillsData, 
  setShowTechnicalSkillsModal,
  onToggleTechnicalSkillEnabled
}) => {

  // Helper function to get skill level text (matching Dashboard exactly)
  const getSkillLevelText = (level) => {
    if (level >= 5) return "Expert";
    if (level >= 4) return "Advanced";
    if (level >= 3) return "Intermediate";
    if (level >= 1) return "Beginner";
    return "Beginner";
  };

  // Helper function to get skill level badge color (with consistent hover states)
  const getSkillLevelColor = (level) => {
    if (level >= 5) return "bg-purple-100 text-purple-700 border-purple-300 hover:bg-purple-100";
    if (level >= 4) return "bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-100";
    if (level >= 3) return "bg-green-100 text-green-700 border-green-300 hover:bg-green-100";
    if (level >= 1) return "bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-100";
    return "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-100";
  };

  const getCategoryIcon = (category) => {
    // Ensure category is a string and handle null/undefined cases
    const categoryStr = category && typeof category === 'string' ? category.toLowerCase() : '';
    
    switch (categoryStr) {
      case 'programming':
        return <Code className="w-4 h-4" />;
      case 'framework':
        return <Zap className="w-4 h-4" />;
      case 'database':
        return <Code className="w-4 h-4" />;
      case 'tools':
        return <Zap className="w-4 h-4" />;
      default:
        return <Code className="w-4 h-4" />;
    }
  };

  // Render stars function (matching Dashboard exactly)
  const renderStars = (level) => {
    const numericLevel = parseInt(level) || 0;
    
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < numericLevel ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
      />
    ));
  };

  // Show all skills in Settings (including pending), but indicate their status
  // VERSIONING: Apply versioning logic to show verified_data when pending
  const processedSkills = (technicalSkillsData || [])
    .map((skill) => {
      // If there's a pending edit, show verified_data in Settings
      if (skill.has_pending_edit && skill.verified_data) {
        return {
          ...skill,
          name: skill.verified_data.name,
          level: skill.verified_data.level,
          description: skill.verified_data.description,
          category: skill.verified_data.category,
        };
      }
      return skill;
    })
    .filter((skill) => skill.enabled !== false);

  const groupedSkills = processedSkills.reduce((acc, skill) => {
    const category = skill.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Code className="w-5 h-5 text-blue-600" />
          Technical Skills
        </h3>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowTechnicalSkillsModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Technical Skill
          </Button>
          <button
            className="p-2 rounded-md hover:bg-blue-100 transition-colors"
            title="View All Technical Skills"
            onClick={() => setShowTechnicalSkillsModal(true)}
          >
            <Eye className="w-5 h-5 text-blue-600" />
          </button>
        </div>
      </div>

      {processedSkills.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <Code className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 text-base font-medium">
            No technical skills added yet
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Add your programming languages, frameworks, and technical expertise
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 blue-scrollbar">
          {processedSkills.map((skill, idx) => (
            <div
              key={skill.id || `tech-skill-${idx}`}
              className="p-5 rounded-xl bg-white border-l-4 border-l-blue-500 border border-gray-200 hover:shadow-md transition-all duration-200"
            >
              {/* Skill Name + Level Badge + Status Badges */}
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-base font-bold text-gray-900">
                    {skill.name}
                  </h4>
                  
                  {/* Verified Badge */}
                  {(skill.approval_status === "verified" || skill.approval_status === "approved") && !skill._hasPendingEdit && (
                    <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </Badge>
                  )}

                  {/* Pending Verification Badge - Show when has_pending_edit is true */}
                  {skill._hasPendingEdit && (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pending Verification
                    </Badge>
                  )}

                  {/* Pending Verification Badge - Show for new pending records */}
                  {(!skill.approval_status || skill.approval_status === 'pending') && !skill._hasPendingEdit && (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Pending Verification
                    </Badge>
                  )}
                </div>
                <Badge
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full shadow-sm border ${getSkillLevelColor(
                    skill.level
                  )}`}
                >
                  {getSkillLevelText(skill.level)}
                </Badge>
              </div>

              {/* Category */}
              {skill.category && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-blue-600 font-medium">
                    {skill.category}
                  </span>
                </div>
              )}

              {/* Star Rating (matching Dashboard exactly) */}
              <div className="flex gap-0.5">
                {renderStars(skill.level)}
              </div>

              {/* Description */}
              {skill.description && (
                <p className="text-sm text-gray-600 mt-3">
                  {skill.description}
                </p>
              )}

              {/* Edit Button + Eye Icon */}
              <div className="flex justify-end gap-1 mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTechnicalSkillsModal(true)}
                  className="p-2 h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                
                {/* Eye icon - only show for verified/approved skills */}
                {(skill.approval_status === 'verified' || skill.approval_status === 'approved') && !skill._hasPendingEdit && onToggleTechnicalSkillEnabled && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleTechnicalSkillEnabled(idx)}
                    className="p-2 h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                    title={skill.enabled ? "Hide from profile" : "Show on profile"}
                  >
                    {skill.enabled !== false ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TechnicalSkillsTab;